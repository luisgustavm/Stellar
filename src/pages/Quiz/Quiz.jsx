import { useContext, useMemo, useState } from "react";
import { doc, runTransaction, setDoc } from "firebase/firestore";
import { useAuth } from "../../context/AuthContext";
import { CoinsContext } from "../../context/CoinsContext";
import { useToast } from "../../context/ToastContext";
import { UserContext } from "../../context/UserContext";
import ConfirmDialog from "../../components/ui/ConfirmDialog";
import { unlockAchievement } from "../../data/achievements";
import { difficultyLevels, quizData } from "../../data/quizData";
import { db } from "../../services/firebase";
import "./Quiz.css";

const HISTORY_KEY = "stellar-quiz-history";
const STARTING_COINS = 100;
const STORE_STORAGE_PREFIX = "stellar-store:";

function shuffle(items) {
  return [...items].sort(() => Math.random() - 0.5);
}

function getStoredHistory() {
  try {
    const stored = localStorage.getItem(HISTORY_KEY);
    return stored ? JSON.parse(stored) : [];
  } catch {
    return [];
  }
}

function saveHistory(history) {
  localStorage.setItem(HISTORY_KEY, JSON.stringify(history));
}

function getLocalStoreKey(uid) {
  return `${STORE_STORAGE_PREFIX}${uid}`;
}

function readLocalStore(uid) {
  if (!uid) return {};

  try {
    const stored = localStorage.getItem(getLocalStoreKey(uid));
    return stored ? JSON.parse(stored) : {};
  } catch (error) {
    console.warn("Não foi possível ler o saldo local:", error);
    return {};
  }
}

function saveLocalStore(uid, nextData) {
  if (!uid) return;

  try {
    const current = readLocalStore(uid);
    localStorage.setItem(
      getLocalStoreKey(uid),
      JSON.stringify({
        ...current,
        ...nextData,
        updatedAt: Date.now(),
      })
    );
  } catch (error) {
    console.warn("Não foi possível salvar o saldo local:", error);
  }
}

function getLocalCoins(uid, fallback = STARTING_COINS) {
  const localCoins = Number(readLocalStore(uid)?.coins);

  return Number.isFinite(localCoins) ? localCoins : Number(fallback || STARTING_COINS);
}

function formatDate(value) {
  return new Intl.DateTimeFormat("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(value));
}

function getTodayKey() {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "America/Sao_Paulo",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date());
}

export default function Quiz() {
  const { user } = useAuth();
  const { showToast } = useToast();
  const { setCoins } = useContext(CoinsContext);
  const { userData, setUserData } = useContext(UserContext);
  const [difficulty, setDifficulty] = useState("facil");
  const [phase, setPhase] = useState("setup");
  const [questions, setQuestions] = useState([]);
  const [reserveQuestions, setReserveQuestions] = useState([]);
  const [index, setIndex] = useState(0);
  const [score, setScore] = useState(0);
  const [answers, setAnswers] = useState([]);
  const [selectedAnswer, setSelectedAnswer] = useState(null);
  const [swapsLeft, setSwapsLeft] = useState(0);
  const [history, setHistory] = useState(getStoredHistory);
  const [rewardResult, setRewardResult] = useState(null);
  const [isGrantingReward, setIsGrantingReward] = useState(false);
  const [showStopConfirm, setShowStopConfirm] = useState(false);

  const config = difficultyLevels[difficulty];
  const currentQuestion = questions[index];
  const progress = questions.length
    ? Math.round(((index + (selectedAnswer !== null ? 1 : 0)) / questions.length) * 100)
    : 0;
  const selectedResult =
    selectedAnswer !== null && currentQuestion
      ? {
          isCorrect: selectedAnswer === currentQuestion.correct,
          correctAnswer: currentQuestion.a[currentQuestion.correct],
        }
      : null;

  const difficultyStats = useMemo(() => {
    return Object.values(difficultyLevels).map((level) => ({
      ...level,
      available: quizData.filter((question) => question.difficulty === level.id).length,
    }));
  }, []);

  function startQuiz(nextDifficulty = difficulty) {
    const nextConfig = difficultyLevels[nextDifficulty];
    const pool = shuffle(quizData.filter((question) => question.difficulty === nextDifficulty));

    setDifficulty(nextDifficulty);
    setQuestions(pool.slice(0, nextConfig.minQuestions));
    setReserveQuestions(pool.slice(nextConfig.minQuestions));
    setIndex(0);
    setScore(0);
    setAnswers([]);
    setSelectedAnswer(null);
    setSwapsLeft(nextConfig.swaps);
    setRewardResult(null);
    setPhase("playing");
  }

  function handleAnswer(answerIndex) {
    if (!currentQuestion || selectedAnswer !== null) return;

    const isCorrect = answerIndex === currentQuestion.correct;
    const nextAnswer = {
      questionId: currentQuestion.id,
      question: currentQuestion.q,
      category: currentQuestion.category,
      selected: answerIndex,
      selectedText: currentQuestion.a[answerIndex],
      correct: currentQuestion.correct,
      correctText: currentQuestion.a[currentQuestion.correct],
      isCorrect,
      explanation: currentQuestion.explanation,
    };

    setSelectedAnswer(answerIndex);
    setAnswers((current) => [...current, nextAnswer]);
    if (isCorrect) setScore((current) => current + 1);
  }

  async function grantDailyQuizReward(finalScore) {
    if (!user?.uid) {
      return {
        amount: 0,
        status: "no-user",
        message: "Entre na sua conta para receber moedas do quiz.",
      };
    }

    const today = getTodayKey();
    const amount = Math.floor(Math.random() * 10) + 1;
    const userRef = doc(db, "users", user.uid);
    const localStore = readLocalStore(user.uid);
    const fallbackCoins = getLocalCoins(user.uid, userData?.coins ?? STARTING_COINS);
    let nextCoins = fallbackCoins;
    let nextReward = {
      date: today,
      amount,
      score: finalScore,
      earnedAt: Date.now(),
    };

    if (localStore.quizReward?.date === today) {
      return {
        amount: 0,
        status: "daily-limit",
        message: "Você já recebeu a recompensa diária do quiz hoje.",
      };
    }

    try {
      await runTransaction(db, async (transaction) => {
        const snap = await transaction.get(userRef);
        const data = snap.exists() ? snap.data() : {};
        const currentRewardDate = data.quizReward?.date;

        if (currentRewardDate === today) {
          throw new Error("daily-limit");
        }

        const currentCoins = Number(data.coins ?? fallbackCoins);
        nextCoins = currentCoins + amount;
        nextReward = {
          date: today,
          amount,
          score: finalScore,
          earnedAt: Date.now(),
        };

        transaction.set(
          userRef,
          {
            coins: nextCoins,
            initialCoinsGranted: true,
            quizReward: nextReward,
          },
          { merge: true }
        );
      });

      saveLocalStore(user.uid, {
        coins: nextCoins,
        quizReward: nextReward,
      });
      setCoins(nextCoins);
      setUserData?.((current) => ({
        ...current,
        coins: nextCoins,
        initialCoinsGranted: true,
        quizReward: nextReward,
      }));

      return {
        amount,
        status: "earned",
        message: `Você ganhou ${amount} moedas pelo quiz de hoje.`,
      };
    } catch (error) {
      if (error.message === "daily-limit") {
        return {
          amount: 0,
          status: "daily-limit",
          message: "Você já recebeu a recompensa diária do quiz hoje.",
        };
      }

      console.warn("Recompensa salva localmente porque o Firebase recusou a operação:", error);
      nextCoins = fallbackCoins + amount;
      nextReward = {
        date: today,
        amount,
        score: finalScore,
        earnedAt: Date.now(),
      };

      saveLocalStore(user.uid, {
        coins: nextCoins,
        quizReward: nextReward,
      });
      setCoins(nextCoins);
      setUserData?.((current) => ({
        ...current,
        coins: nextCoins,
        initialCoinsGranted: true,
        quizReward: nextReward,
      }));

      return {
        amount,
        status: "earned",
        message: `Você ganhou ${amount} moedas pelo quiz de hoje. Salvamos no seu navegador.`,
      };
    }
  }

  async function finishQuiz(finalScore = score) {
    setIsGrantingReward(true);
    const reward = await grantDailyQuizReward(finalScore);
    setRewardResult(reward);
    setIsGrantingReward(false);

    const record = {
      id: globalThis.crypto?.randomUUID?.() || String(Date.now()),
      date: Date.now(),
      difficulty,
      difficultyLabel: config.label,
      score: finalScore,
      total: questions.length,
      accuracy: Math.round((finalScore / questions.length) * 100),
      swapsUsed: config.swaps - swapsLeft,
      rewardAmount: reward.amount,
    };
    const nextHistory = [record, ...history].slice(0, 8);

    setHistory(nextHistory);
    saveHistory(nextHistory);

    if (user?.uid) {
      const nextAchievements = {
        ...unlockAchievement(user.uid, "first_quiz", { score: finalScore }),
      };

      if (finalScore === questions.length) {
        Object.assign(
          nextAchievements,
          unlockAchievement(user.uid, "quiz_master", { difficulty, score: finalScore })
        );
      }

      setUserData?.((current) => ({
        ...current,
        achievements: {
          ...(current?.achievements || {}),
          ...nextAchievements,
        },
      }));

      setDoc(
        doc(db, "users", user.uid),
        {
          achievements: nextAchievements,
        },
        { merge: true }
      ).catch((error) => {
        console.warn("Conquistas do quiz salvas localmente:", error);
      });
    }

    setPhase("result");
  }

  async function handleNext() {
    if (selectedAnswer === null || isGrantingReward) return;

    const finalScore = score;

    if (index >= questions.length - 1) {
      await finishQuiz(finalScore);
      return;
    }

    setIndex((current) => current + 1);
    setSelectedAnswer(null);
  }

  function handleSwapQuestion() {
    if (selectedAnswer !== null || swapsLeft <= 0 || reserveQuestions.length === 0) return;

    const [replacement, ...rest] = reserveQuestions;

    setQuestions((current) =>
      current.map((question, questionIndex) =>
        questionIndex === index ? replacement : question
      )
    );
    setReserveQuestions(rest);
    setSwapsLeft((current) => current - 1);
  }

  function clearHistory() {
    setHistory([]);
    saveHistory([]);
  }

  function stopQuiz() {
    setPhase("setup");
    setQuestions([]);
    setReserveQuestions([]);
    setIndex(0);
    setScore(0);
    setAnswers([]);
    setSelectedAnswer(null);
    setRewardResult(null);
    setIsGrantingReward(false);
    setShowStopConfirm(false);
    showToast("Quiz interrompido.", "info");
  }

  if (phase === "setup") {
    return (
      <div className="quiz-page">
        <main className="quiz-shell">
          <section className="quiz-hero">
            <p className="page-kicker">Centro de treinamento</p>
            <h1>Quiz Estelar</h1>
            <p>
              Escolha uma dificuldade, responda uma sequência mínima de perguntas
              e ganhe de 1 a 10 moedas uma vez por dia ao finalizar o quiz.
            </p>
          </section>

          <section className="quiz-difficulty-grid" aria-label="Escolha a dificuldade">
            {difficultyStats.map((level) => (
              <button
                type="button"
                key={level.id}
                className={`quiz-difficulty-card ${difficulty === level.id ? "is-active" : ""}`}
                onClick={() => setDifficulty(level.id)}
                aria-pressed={difficulty === level.id}
              >
                <span>{level.label}</span>
                <strong>{level.minQuestions} perguntas mínimas</strong>
                <p>{level.description}</p>
                <small>
                  {level.available} disponíveis | {level.swaps} trocas
                </small>
              </button>
            ))}
          </section>

          <div className="quiz-start-panel">
            <button className="stellar-button" type="button" onClick={() => startQuiz()}>
              Iniciar quiz {config.label.toLowerCase()}
            </button>
          </div>

          <section className="quiz-history-panel" aria-labelledby="history-title">
            <div className="quiz-section-heading">
              <div>
                <p className="page-kicker">Histórico</p>
                <h2 id="history-title">Últimas tentativas</h2>
              </div>
              {history.length > 0 && (
                <button type="button" onClick={clearHistory}>
                  Limpar
                </button>
              )}
            </div>

            {history.length > 0 ? (
              <ul className="quiz-history-list">
                {history.map((item) => (
                  <li key={item.id}>
                    <strong>{item.difficultyLabel}</strong>
                    <span>{item.score}/{item.total} acertos</span>
                    <span>{item.accuracy}%</span>
                    <span>{item.rewardAmount ? `+${item.rewardAmount} moedas` : "sem recompensa"}</span>
                    <small>{formatDate(item.date)}</small>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="quiz-empty">Nenhuma tentativa registrada ainda.</p>
            )}
          </section>
        </main>
      </div>
    );
  }

  if (phase === "result") {
    const accuracy = Math.round((score / questions.length) * 100);

    return (
      <div className="quiz-page">
        <main className="quiz-shell">
          <section className="quiz-result-card">
            <span className="quiz-orbit" aria-hidden="true" />
            <p className="page-kicker">Resultado da missão</p>
            <h1>{accuracy >= 70 ? "Excelente navegação" : "Treino registrado"}</h1>
            <p>
              Você acertou <strong>{score}</strong> de {questions.length} perguntas
              no nível {config.label.toLowerCase()}.
            </p>

            {rewardResult && (
              <div className={`quiz-reward-card ${rewardResult.status === "earned" ? "" : "is-muted"}`}>
                <strong>
                  {rewardResult.status === "earned" ? `+${rewardResult.amount} moedas` : "Recompensa diária"}
                </strong>
                <span>{rewardResult.message}</span>
              </div>
            )}

            <div className="quiz-result-stats">
              <article>
                <strong>{accuracy}%</strong>
                <span>aproveitamento</span>
              </article>
              <article>
                <strong>{config.swaps - swapsLeft}</strong>
                <span>trocas usadas</span>
              </article>
              <article>
                <strong>{answers.filter((answer) => answer.isCorrect).length}</strong>
                <span>respostas corretas</span>
              </article>
            </div>

            <div className="quiz-result-actions">
              <button className="stellar-button" type="button" onClick={() => startQuiz(difficulty)}>
                Refazer nível
              </button>
              <button type="button" onClick={() => setPhase("setup")}>
                Escolher dificuldade
              </button>
            </div>
          </section>

          <section className="quiz-review-panel" aria-labelledby="review-title">
            <p className="page-kicker">Revisão</p>
            <h2 id="review-title">Resumo das respostas</h2>
            <ul className="quiz-review-list">
              {answers.map((answer, answerIndex) => (
                <li key={`${answer.questionId}-${answerIndex}`} className={answer.isCorrect ? "is-correct" : "is-wrong"}>
                  <strong>{answer.question}</strong>
                  <span>Sua resposta: {answer.selectedText}</span>
                  {!answer.isCorrect && <span>Correta: {answer.correctText}</span>}
                  <p>{answer.explanation}</p>
                </li>
              ))}
            </ul>
          </section>
        </main>
      </div>
    );
  }

  return (
    <div className="quiz-page">
      <main className="quiz-shell">
        <section className="quiz-play-card" aria-live="polite">
          <div className="quiz-topline">
            <div>
              <p className="page-kicker">{config.label} | {currentQuestion.category}</p>
              <h1>Pergunta {index + 1} de {questions.length}</h1>
            </div>
            <div className="quiz-swap-counter">
              <span>{swapsLeft}</span>
              <small>trocas</small>
            </div>
          </div>

          <div className="quiz-progress" aria-label={`Progresso ${progress}%`}>
            <span style={{ width: `${progress}%` }} />
          </div>

          <h2>{currentQuestion.q}</h2>

          <div className="quiz-options">
            {currentQuestion.a.map((option, optionIndex) => {
              const isSelected = selectedAnswer === optionIndex;
              const isCorrect = selectedAnswer !== null && optionIndex === currentQuestion.correct;
              const isWrong = isSelected && optionIndex !== currentQuestion.correct;

              return (
                <button
                  key={option}
                  type="button"
                  onClick={() => handleAnswer(optionIndex)}
                  disabled={selectedAnswer !== null}
                  className={`${isCorrect ? "is-correct" : ""} ${isWrong ? "is-wrong" : ""}`}
                >
                  <span>{String.fromCharCode(65 + optionIndex)}</span>
                  {option}
                </button>
              );
            })}
          </div>

          {selectedResult && (
            <div className={`quiz-feedback ${selectedResult.isCorrect ? "is-correct" : "is-wrong"}`} role="status">
              <strong>{selectedResult.isCorrect ? "Resposta correta" : "Resposta incorreta"}</strong>
              <p>
                Resposta certa: {selectedResult.correctAnswer}. {currentQuestion.explanation}
              </p>
            </div>
          )}

          <div className="quiz-play-actions">
            <button
              type="button"
              className="quiz-stop-button"
              onClick={() => setShowStopConfirm(true)}
              disabled={isGrantingReward}
            >
              Parar quiz
            </button>
            <button
              type="button"
              onClick={handleSwapQuestion}
              disabled={selectedAnswer !== null || swapsLeft <= 0 || reserveQuestions.length === 0}
            >
              Trocar pergunta
            </button>
            <button
              type="button"
              className="stellar-button"
              onClick={handleNext}
              disabled={selectedAnswer === null || isGrantingReward}
            >
              {isGrantingReward
                ? "Salvando recompensa..."
                : index >= questions.length - 1
                  ? "Finalizar"
                  : "Próxima"}
            </button>
          </div>
        </section>

        <ConfirmDialog
          open={showStopConfirm}
          variant="warning"
          title="Parar o quiz?"
          message="O progresso desta tentativa será descartado e você voltará para a tela inicial do quiz."
          confirmLabel="Parar quiz"
          onCancel={() => setShowStopConfirm(false)}
          onConfirm={stopQuiz}
        />
      </main>
    </div>
  );
}
