import { useCallback, useContext, useEffect, useState } from "react";
import { doc, runTransaction, setDoc } from "firebase/firestore";
import GameCanvas from "../../components/game/GameCanvas";
import GameHUD from "../../components/game/GameHUD";
import GameOverModal from "../../components/game/GameOverModal";
import { useAuth } from "../../context/AuthContext";
import { CoinsContext } from "../../context/CoinsContext";
import { UserContext } from "../../context/UserContext";
import { useToast } from "../../context/ToastContext";
import { db } from "../../services/firebase";
import "./Game.css";

const STARTING_COINS = 100;
const STORE_STORAGE_PREFIX = "stellar-store:";
const GAME_STORAGE_PREFIX = "stellar-game:";
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

export default function Game() {
  const { user } = useAuth();
  const { coins, setCoins, loadingCoins } = useContext(CoinsContext);
  const { userData, setUserData } = useContext(UserContext);
  const { showToast } = useToast();
  const [phase, setPhase] = useState("menu");
  const [runId, setRunId] = useState(0);
  const [stats, setStats] = useState(initialStats);
  const [finalStats, setFinalStats] = useState(initialStats);
  const [reward, setReward] = useState(null);
  const [bestGame, setBestGame] = useState(() => readBestGame(user?.uid));

  useEffect(() => {
    setBestGame(readBestGame(user?.uid));
  }, [user?.uid]);

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
    },
    [user?.uid]
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
    },
    [grantGameReward, updateBestGame]
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

            <button className="stellar-button" type="button" onClick={startGame}>
              Jogar
            </button>
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
          />
          <section className="game-stage" aria-label="Área de jogo">
            <GameCanvas
              running
              paused={phase === "paused"}
              restartKey={runId}
              onStatsChange={setStats}
              onGameOver={handleGameOver}
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
