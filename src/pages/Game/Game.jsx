import { useCallback, useContext, useEffect, useRef, useState } from "react";
import {
  collection,
  doc,
  limit as firestoreLimit,
  onSnapshot,
  orderBy,
  query,
  runTransaction,
  serverTimestamp,
  setDoc,
} from "firebase/firestore";
import GameCanvas from "../../components/game/GameCanvas";
import GameHUD from "../../components/game/GameHUD";
import GameOverModal from "../../components/game/GameOverModal";
import { useAuth } from "../../context/AuthContext";
import { CoinsContext } from "../../context/CoinsContext";
import { UserContext } from "../../context/UserContext";
import { useToast } from "../../context/ToastContext";
import { unlockAchievement } from "../../data/achievements";
import { db } from "../../services/firebase";
import "./Game.css";

const STARTING_COINS = 100;
const STORE_STORAGE_PREFIX = "stellar-store:";
const GAME_STORAGE_PREFIX = "stellar-game:";
const GAME_SOUND_KEY = "stellar-game-sound";
const initialStats = {
  score: 0,
  stars: 0,
  lives: 3,
  time: 0,
  speed: 230,
  ammo: 6,
  maxAmmo: 6,
  reloadProgress: 1,
  meteorsDestroyed: 0,
  shotsFired: 0,
};

function formatTime(seconds = 0) {
  const safeSeconds = Math.max(0, Math.floor(seconds));
  const minutes = Math.floor(safeSeconds / 60);
  const rest = safeSeconds % 60;

  return `${minutes}:${String(rest).padStart(2, "0")}`;
}

function getLocalStoreKey(uid) {
  return `${STORE_STORAGE_PREFIX}${uid}`;
}

function getLocalGameKey(uid) {
  return `${GAME_STORAGE_PREFIX}${uid || "guest"}`;
}

function readLocalJson(key, fallback = {}) {
  try {
    const stored = localStorage.getItem(key);
    return stored ? JSON.parse(stored) : fallback;
  } catch {
    return fallback;
  }
}

function readLocalStore(uid) {
  if (!uid) return {};
  return readLocalJson(getLocalStoreKey(uid), {});
}

function saveLocalStore(uid, nextData) {
  if (!uid) return;

  const current = readLocalStore(uid);
  localStorage.setItem(
    getLocalStoreKey(uid),
    JSON.stringify({
      ...current,
      ...nextData,
      updatedAt: Date.now(),
    })
  );
}

function readBestGame(uid) {
  const stored = readLocalJson(getLocalGameKey(uid), null);

  return stored || {
    score: 0,
    stars: 0,
    time: 0,
    playedAt: null,
  };
}

function isBetterRun(stats, best) {
  return stats.time > (best?.time || 0) || stats.score > (best?.score || 0);
}

function readSoundPreference() {
  try {
    return localStorage.getItem(GAME_SOUND_KEY) === "on";
  } catch {
    return false;
  }
}

function formatPlayerName(user, userData) {
  return (
    userData?.name ||
    userData?.username ||
    user?.name ||
    user?.username ||
    user?.email?.split("@")[0] ||
    "Explorador"
  );
}

export default function Game() {
  const { user } = useAuth();
  const { coins, setCoins, loadingCoins } = useContext(CoinsContext);
  const { userData, setUserData } = useContext(UserContext);
  const { showToast } = useToast();
  const audioContextRef = useRef(null);
  const [phase, setPhase] = useState("menu");
  const [runId, setRunId] = useState(0);
  const [stats, setStats] = useState(initialStats);
  const [finalStats, setFinalStats] = useState(initialStats);
  const [reward, setReward] = useState(null);
  const [bestGame, setBestGame] = useState(() => readBestGame(user?.uid));
  const [leaderboard, setLeaderboard] = useState([]);
  const [soundEnabled, setSoundEnabled] = useState(readSoundPreference);

  useEffect(() => {
    setBestGame(readBestGame(user?.uid));
  }, [user?.uid]);

  useEffect(() => {
    try {
      localStorage.setItem(GAME_SOUND_KEY, soundEnabled ? "on" : "off");
    } catch {
      // Preferimos manter o jogo funcionando mesmo se o navegador bloquear storage.
    }
  }, [soundEnabled]);

  useEffect(() => {
    if (!user?.uid) return undefined;

    const leaderboardQuery = query(
      collection(db, "gameScores"),
      orderBy("score", "desc"),
      firestoreLimit(8)
    );

    return onSnapshot(
      leaderboardQuery,
      (snapshot) => {
        setLeaderboard(
          snapshot.docs.map((item) => ({
            id: item.id,
            ...item.data(),
          }))
        );
      },
      (error) => {
        console.warn("Nao foi possivel carregar o ranking do jogo:", error);
      }
    );
  }, [user?.uid]);

  const playGameSound = useCallback(
    (type) => {
      if (!soundEnabled) return;

      const AudioContext = window.AudioContext || window.webkitAudioContext;
      if (!AudioContext) return;

      const audioContext = audioContextRef.current || new AudioContext();
      audioContextRef.current = audioContext;

      if (audioContext.state === "suspended") {
        audioContext.resume().catch(() => {});
      }

      const soundMap = {
        shoot: { frequency: 620, duration: 0.07, type: "square", gain: 0.035 },
        empty: { frequency: 170, duration: 0.08, type: "sawtooth", gain: 0.03 },
        star: { frequency: 880, duration: 0.09, type: "triangle", gain: 0.04 },
        meteor: { frequency: 92, duration: 0.18, type: "sawtooth", gain: 0.05 },
        hit: { frequency: 130, duration: 0.16, type: "square", gain: 0.045 },
        gameover: { frequency: 72, duration: 0.38, type: "sawtooth", gain: 0.05 },
      };
      const config = soundMap[type] || soundMap.star;
      const now = audioContext.currentTime;
      const oscillator = audioContext.createOscillator();
      const gain = audioContext.createGain();

      oscillator.type = config.type;
      oscillator.frequency.setValueAtTime(config.frequency, now);
      oscillator.frequency.exponentialRampToValueAtTime(
        Math.max(40, config.frequency * 0.45),
        now + config.duration
      );
      gain.gain.setValueAtTime(config.gain, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + config.duration);
      oscillator.connect(gain);
      gain.connect(audioContext.destination);
      oscillator.start(now);
      oscillator.stop(now + config.duration);
    },
    [soundEnabled]
  );

  function toggleSound() {
    setSoundEnabled((current) => !current);
  }

  const getCurrentCoins = useCallback(() => {
    const localCoins = Number(readLocalStore(user?.uid)?.coins);

    if (Number.isFinite(localCoins)) return localCoins;

    const profileCoins = Number(userData?.coins);
    if (Number.isFinite(profileCoins)) return profileCoins;

    const contextCoins = Number(coins);
    return Number.isFinite(contextCoins) ? contextCoins : STARTING_COINS;
  }, [coins, user?.uid, userData?.coins]);

  const updateBestGame = useCallback(
    async (nextStats) => {
      const currentBest = readBestGame(user?.uid);
      const nextBest = isBetterRun(nextStats, currentBest)
        ? {
            score: nextStats.score,
            stars: nextStats.stars,
            time: nextStats.time,
            playedAt: Date.now(),
          }
        : currentBest;

      localStorage.setItem(getLocalGameKey(user?.uid), JSON.stringify(nextBest));
      setBestGame(nextBest);

      if (user?.uid && nextBest !== currentBest) {
        try {
          await setDoc(
            doc(db, "users", user.uid),
            {
              bestGame: nextBest,
            },
            { merge: true }
          );
        } catch (error) {
          console.warn("Recorde do jogo salvo localmente porque o Firebase recusou:", error);
        }
      }

      if (user?.uid) {
        const playerName = formatPlayerName(user, userData);

        setDoc(
          doc(db, "gameScores", user.uid),
          {
            uid: user.uid,
            name: playerName,
            score: Math.max(nextStats.score, nextBest.score || 0),
            stars: Math.max(nextStats.stars, nextBest.stars || 0),
            time: Math.max(nextStats.time, nextBest.time || 0),
            meteorsDestroyed: nextStats.meteorsDestroyed || 0,
            updatedAt: serverTimestamp(),
          },
          { merge: true }
        ).catch((error) => {
          console.warn("Ranking do jogo indisponivel:", error);
        });
      }
    },
    [user, userData]
  );

  const grantGameReward = useCallback(
    async (nextStats) => {
      const amount = Math.floor(nextStats.stars / 100) * 20;

      if (amount <= 0) {
        return {
          amount: 0,
          status: "no-reward",
          message: "Colete 100 pontos de estrela em uma partida para converter em 20 moedas.",
        };
      }

      if (!user?.uid) {
        return {
          amount: 0,
          status: "no-user",
          message: "Entre na sua conta para receber moedas do jogo.",
        };
      }

      const fallbackCoins = getCurrentCoins();
      let nextCoins = fallbackCoins + amount;
      const gameReward = {
        amount,
        stars: nextStats.stars,
        score: nextStats.score,
        time: nextStats.time,
        earnedAt: Date.now(),
      };

      try {
        await runTransaction(db, async (transaction) => {
          const userRef = doc(db, "users", user.uid);
          const snap = await transaction.get(userRef);
          const data = snap.exists() ? snap.data() : {};
          const remoteCoins = Number(data.coins ?? 0);
          const currentCoins = Math.max(
            Number.isFinite(remoteCoins) ? remoteCoins : 0,
            fallbackCoins,
            STARTING_COINS
          );

          nextCoins = currentCoins + amount;

          transaction.set(
            userRef,
            {
              coins: nextCoins,
              initialCoinsGranted: true,
              lastGameReward: gameReward,
            },
            { merge: true }
          );
        });
      } catch (error) {
        console.warn("Recompensa do jogo salva localmente porque o Firebase recusou:", error);
        nextCoins = fallbackCoins + amount;
      }

      saveLocalStore(user.uid, {
        coins: nextCoins,
        lastGameReward: gameReward,
      });
      setCoins(nextCoins);
      setUserData?.((current) => ({
        ...current,
        coins: nextCoins,
        initialCoinsGranted: true,
        lastGameReward: gameReward,
      }));
      showToast(`Você ganhou ${amount} moedas no jogo.`, "success");

      return {
        amount,
        status: "earned",
        message: `${nextStats.stars} pontos de estrela convertidos em ${amount} moedas.`,
      };
    },
    [getCurrentCoins, setCoins, setUserData, showToast, user?.uid]
  );

  function startGame() {
    setStats(initialStats);
    setFinalStats(initialStats);
    setReward(null);
    setRunId((current) => current + 1);
    setPhase("playing");
  }

  const togglePause = useCallback(() => {
    setPhase((current) => {
      if (current === "playing") return "paused";
      if (current === "paused") return "playing";
      return current;
    });
  }, []);

  useEffect(() => {
    if (phase !== "playing" && phase !== "paused") return undefined;

    const handlePauseKey = (event) => {
      const key = event.key.toLowerCase();

      if (key === "p" || key === "escape") {
        event.preventDefault();
        togglePause();
      }
    };

    window.addEventListener("keydown", handlePauseKey);
    return () => window.removeEventListener("keydown", handlePauseKey);
  }, [phase, togglePause]);

  const handleGameOver = useCallback(
    (nextStats) => {
      setStats(nextStats);
      setFinalStats(nextStats);
      setPhase("gameOver");
      updateBestGame(nextStats);
      grantGameReward(nextStats).then(setReward);

      if (user?.uid) {
        const nextAchievements = {
          ...unlockAchievement(user.uid, "first_game", { score: nextStats.score }),
        };

        if ((nextStats.meteorsDestroyed || 0) >= 20) {
          Object.assign(
            nextAchievements,
            unlockAchievement(user.uid, "meteor_hunter", {
              meteorsDestroyed: nextStats.meteorsDestroyed,
            })
          );
        }

        if ((nextStats.score || 0) >= 1000) {
          Object.assign(
            nextAchievements,
            unlockAchievement(user.uid, "score_1000", { score: nextStats.score })
          );
        }

        if ((nextStats.stars || 0) >= 100) {
          Object.assign(
            nextAchievements,
            unlockAchievement(user.uid, "centurion_stars", { stars: nextStats.stars })
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
          console.warn("Conquistas do jogo salvas localmente:", error);
        });
      }
    },
    [grantGameReward, setUserData, updateBestGame, user?.uid]
  );

  return (
    <div className={`game-page is-${phase}`}>
      {phase === "menu" && (
        <main className="game-menu">
          <section className="game-menu-card">
            <p className="page-kicker">Arcade estelar</p>
            <h1>Stellar Run</h1>
            <p>
              Controle a nave, destrua meteoros com tiros recarregaveis e colete
              estrelas. As estrelas maiores valem mais pontos; a cada 100 pontos
              de estrela em uma partida, voce recebe 20 moedas para usar na loja.
            </p>

            <div className="game-menu-stats" aria-label="Recordes do jogo">
              <article>
                <strong>{formatTime(bestGame.time)}</strong>
                <span>maior tempo vivo</span>
              </article>
              <article>
                <strong>{bestGame.score}</strong>
                <span>melhor pontuação</span>
              </article>
              <article>
                <strong>{bestGame.stars}</strong>
                <span>mais estrelas</span>
              </article>
            </div>

            <div className="game-rules">
              <span>3 vidas</span>
              <span>Shift ou botao direito atira</span>
              <span>municao recarregavel</span>
              <span>meteoros com 1 a 4 vidas</span>
              <span>velocidade crescente</span>
              <span>WASD ou setas</span>
            </div>

            <div className="game-menu-actions">
              <button className="stellar-button" type="button" onClick={startGame}>
                Jogar
              </button>
              <button
                type="button"
                className="game-sound-toggle"
                onClick={toggleSound}
                aria-pressed={soundEnabled}
              >
                Som {soundEnabled ? "ligado" : "desligado"}
              </button>
            </div>

            <section className="game-leaderboard" aria-labelledby="game-ranking-title">
              <div className="game-leaderboard-heading">
                <p className="page-kicker">Ranking</p>
                <h2 id="game-ranking-title">Melhores pilotos</h2>
              </div>
              {leaderboard.length > 0 ? (
                <ol>
                  {leaderboard.map((entry, entryIndex) => (
                    <li key={entry.id}>
                      <span>{entryIndex + 1}</span>
                      <strong>{entry.name || "Explorador"}</strong>
                      <em>{entry.score || 0} pts</em>
                    </li>
                  ))}
                </ol>
              ) : (
                <p>Nenhum registro publico ainda. Jogue uma partida para abrir o placar.</p>
              )}
            </section>
          </section>
        </main>
      )}

      {(phase === "playing" || phase === "paused") && (
        <>
          <GameHUD
            stats={stats}
            coins={getCurrentCoins()}
            loadingCoins={loadingCoins}
            paused={phase === "paused"}
            onTogglePause={togglePause}
            soundEnabled={soundEnabled}
            onToggleSound={toggleSound}
          />
          <section className="game-stage" aria-label="Área de jogo">
            <GameCanvas
              running
              paused={phase === "paused"}
              restartKey={runId}
              onStatsChange={setStats}
              onGameOver={handleGameOver}
              onSoundEvent={playGameSound}
            />
            {phase === "paused" && (
              <div className="game-pause-overlay" role="status" aria-live="polite">
                <strong>Jogo pausado</strong>
                <span>A partida esta congelada. Aperte P, Esc ou continue pelo botao.</span>
                <button className="stellar-button" type="button" onClick={togglePause}>
                  Continuar
                </button>
              </div>
            )}
          </section>
          <div className="game-controls-hint">
            <span>Setas/WASD movem a nave</span>
            <span>Shift ou botao direito dispara</span>
            <span>Quebre meteoros antes da colisao</span>
            <span>Estrelas maiores valem 1 a 5</span>
          </div>
        </>
      )}

      <GameOverModal
        open={phase === "gameOver"}
        stats={finalStats}
        reward={reward}
        onRestart={startGame}
        onMenu={() => setPhase("menu")}
      />
    </div>
  );
}
