function formatTime(seconds = 0) {
  const safeSeconds = Math.max(0, Math.floor(seconds));
  const minutes = Math.floor(safeSeconds / 60);
  const rest = safeSeconds % 60;

  return `${minutes}:${String(rest).padStart(2, "0")}`;
}

export default function GameHUD({
  stats,
  coins = 0,
  loadingCoins = false,
  paused = false,
  onTogglePause,
  soundEnabled = false,
  onToggleSound,
}) {
  const ammo = stats.ammo ?? 0;
  const maxAmmo = stats.maxAmmo ?? 6;
  const reloadProgress = Math.round((stats.reloadProgress ?? 1) * 100);
  const starRemainder = stats.stars % 100;
  const starsToReward = 100 - starRemainder;
  const nextRewardText = stats.stars > 0 && starRemainder === 0
    ? "recompensa pronta"
    : `${starsToReward} para moeda`;

  return (
    <aside className="game-hud" aria-label="Status da partida">
      <div>
        <span>Pontos</span>
        <strong>{stats.score}</strong>
      </div>
      <div>
        <span>Estrelas</span>
        <strong>{stats.stars}</strong>
      </div>
      <div>
        <span>Meteoros</span>
        <strong>{stats.meteorsDestroyed ?? 0}</strong>
      </div>
      <div className="game-ammo-panel">
        <span>Tiros</span>
        <strong>{ammo}/{maxAmmo}</strong>
        <i className="game-ammo-bar" aria-label={`Recarga em ${reloadProgress}%`}>
          <b style={{ width: `${reloadProgress}%` }} />
        </i>
      </div>
      <div>
        <span>Moedas</span>
        <strong>{loadingCoins ? "..." : coins}</strong>
      </div>
      <div>
        <span>Vidas</span>
        <strong>{"♥".repeat(stats.lives)}{"♡".repeat(Math.max(0, 3 - stats.lives))}</strong>
      </div>
      <div>
        <span>Tempo</span>
        <strong>{formatTime(stats.time)}</strong>
      </div>
      <div>
        <span>Velocidade</span>
        <strong>{Math.round(stats.speed)}</strong>
      </div>
      <small>{nextRewardText}</small>
      <button
        className="game-pause-button"
        type="button"
        onClick={onTogglePause}
        aria-pressed={paused}
      >
        {paused ? "Continuar" : "Pausar"}
      </button>
      <button
        className="game-sound-button"
        type="button"
        onClick={onToggleSound}
        aria-pressed={soundEnabled}
      >
        Som {soundEnabled ? "on" : "off"}
      </button>
    </aside>
  );
}
