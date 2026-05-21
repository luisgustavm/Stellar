import { useEffect } from "react";

function formatTime(seconds = 0) {
  const safeSeconds = Math.max(0, Math.floor(seconds));
  const minutes = Math.floor(safeSeconds / 60);
  const rest = safeSeconds % 60;

  return `${minutes}:${String(rest).padStart(2, "0")}`;
}

export default function GameOverModal({
  open,
  stats,
  reward,
  onRestart,
  onMenu,
}) {
  useEffect(() => {
    if (!open) return undefined;

    const handleKey = (event) => {
      if (event.key === "Enter") onRestart?.();
      if (event.key === "Escape") onMenu?.();
    };

    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [onMenu, onRestart, open]);

  if (!open) return null;

  return (
    <div className="game-modal-backdrop" role="dialog" aria-modal="true">
      <section className="game-modal">
        <p className="page-kicker">Fim da missão</p>
        <h2>Game Over</h2>
        <p>
          Voce resistiu ate onde conseguiu. Cada 100 pontos de estrela rendem 20 moedas para usar na loja.
        </p>

        <div className="game-over-stats">
          <article>
            <strong>{stats.score}</strong>
            <span>pontos</span>
          </article>
          <article>
            <strong>{stats.stars}</strong>
            <span>estrelas</span>
          </article>
          <article>
            <strong>{formatTime(stats.time)}</strong>
            <span>tempo vivo</span>
          </article>
          <article>
            <strong>{stats.meteorsDestroyed ?? 0}</strong>
            <span>meteoros</span>
          </article>
        </div>

        {reward && (
          <div className={`game-reward ${reward.status === "earned" ? "" : "is-muted"}`}>
            <strong>
              {reward.status === "earned" ? `+${reward.amount} moedas` : "Recompensa"}
            </strong>
            <span>{reward.message}</span>
          </div>
        )}

        <div className="game-modal-actions">
          <button className="stellar-button" type="button" onClick={onRestart}>
            Jogar novamente
          </button>
          <button type="button" onClick={onMenu}>
            Voltar ao menu
          </button>
        </div>
      </section>
    </div>
  );
}
