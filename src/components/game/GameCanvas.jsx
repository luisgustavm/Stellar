import { useEffect, useRef } from "react";

const PLAYER_WIDTH = 58;
const PLAYER_HEIGHT = 36;
const PLAYER_SPEED = 360;
const MAX_AMMO = 6;
const SHOT_COOLDOWN_MS = 150;
const SHOT_RELOAD_MS = 850;
const BULLET_SPEED = 760;
const BULLET_WIDTH = 22;
const BULLET_HEIGHT = 5;
const METEOR_SCORE = 12;

function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}

function randomBetween(min, max) {
  return min + Math.random() * (max - min);
}

function rectsCollide(a, b) {
  return (
    a.x < b.x + b.width &&
    a.x + a.width > b.x &&
    a.y < b.y + b.height &&
    a.y + a.height > b.y
  );
}

function rectCircleCollide(rect, circle) {
  const closestX = clamp(circle.x, rect.x, rect.x + rect.width);
  const closestY = clamp(circle.y, rect.y, rect.y + rect.height);
  const distanceX = circle.x - closestX;
  const distanceY = circle.y - closestY;

  return distanceX * distanceX + distanceY * distanceY < circle.radius * circle.radius;
}

function getReloadProgress(game, now = performance.now()) {
  if (!game || game.ammo >= game.maxAmmo) return 1;
  if (!game.nextReloadAt) return 0;

  return clamp(1 - (game.nextReloadAt - now) / SHOT_RELOAD_MS, 0, 1);
}

function getMeteorBox(meteor) {
  return {
    x: meteor.x + meteor.size * 0.12,
    y: meteor.y + meteor.size * 0.12,
    width: meteor.size * 0.76,
    height: meteor.size * 0.76,
  };
}

function fireBullet(game, now, isPaused) {
  if (!game || game.ended || isPaused) return false;

  if (now - game.lastShotAt < SHOT_COOLDOWN_MS) {
    return false;
  }

  if (game.ammo <= 0) {
    game.emptyAmmoPulseUntil = now + 260;
    return false;
  }

  game.lastShotAt = now;
  game.ammo -= 1;
  game.shotsFired += 1;

  if (!game.nextReloadAt) {
    game.nextReloadAt = now + SHOT_RELOAD_MS;
  }

  game.bullets.push({
    x: game.player.x + PLAYER_WIDTH - 3,
    y: game.player.y + PLAYER_HEIGHT / 2 - BULLET_HEIGHT / 2,
    width: BULLET_WIDTH,
    height: BULLET_HEIGHT,
    bornAt: now,
  });

  return true;
}

function updateAmmo(game, now) {
  if (!game) return;

  if (game.ammo >= game.maxAmmo) {
    game.nextReloadAt = null;
    return;
  }

  if (!game.nextReloadAt) {
    game.nextReloadAt = now + SHOT_RELOAD_MS;
    return;
  }

  while (game.ammo < game.maxAmmo && now >= game.nextReloadAt) {
    game.ammo += 1;
    game.nextReloadAt += SHOT_RELOAD_MS;
  }

  if (game.ammo >= game.maxAmmo) {
    game.nextReloadAt = null;
  }
}

function drawShip(ctx, player, invulnerable) {
  ctx.save();
  ctx.translate(player.x, player.y);
  ctx.globalAlpha = invulnerable ? 0.58 + Math.sin(performance.now() / 70) * 0.24 : 1;

  const gradient = ctx.createLinearGradient(0, 0, PLAYER_WIDTH, PLAYER_HEIGHT);
  gradient.addColorStop(0, "#67e8f9");
  gradient.addColorStop(0.52, "#38bdf8");
  gradient.addColorStop(1, "#facc15");

  ctx.beginPath();
  ctx.moveTo(PLAYER_WIDTH, PLAYER_HEIGHT / 2);
  ctx.lineTo(10, 0);
  ctx.lineTo(0, 12);
  ctx.lineTo(0, PLAYER_HEIGHT - 12);
  ctx.lineTo(10, PLAYER_HEIGHT);
  ctx.closePath();
  ctx.fillStyle = gradient;
  ctx.fill();

  ctx.strokeStyle = "rgba(255, 255, 255, 0.72)";
  ctx.lineWidth = 2;
  ctx.stroke();

  ctx.beginPath();
  ctx.arc(30, PLAYER_HEIGHT / 2, 6, 0, Math.PI * 2);
  ctx.fillStyle = "rgba(2, 6, 23, 0.86)";
  ctx.fill();

  ctx.beginPath();
  ctx.moveTo(-2, 10);
  ctx.lineTo(-22 - Math.random() * 10, PLAYER_HEIGHT / 2);
  ctx.lineTo(-2, PLAYER_HEIGHT - 10);
  ctx.closePath();
  ctx.fillStyle = "rgba(249, 115, 22, 0.72)";
  ctx.fill();

  ctx.restore();
}

function drawAmmoWarning(ctx, game, now) {
  if (!game || now > game.emptyAmmoPulseUntil) return;

  ctx.save();
  ctx.globalAlpha = 0.78 + Math.sin(now / 42) * 0.18;
  ctx.font = "900 11px Orbitron, sans-serif";
  ctx.textAlign = "left";
  ctx.textBaseline = "middle";
  ctx.fillStyle = "#fde68a";
  ctx.shadowColor = "rgba(250, 204, 21, 0.7)";
  ctx.shadowBlur = 10;
  ctx.fillText("RECARREGANDO", game.player.x + 6, game.player.y - 10);
  ctx.restore();
}

function drawMeteor(ctx, meteor) {
  ctx.save();
  ctx.translate(meteor.x + meteor.size / 2, meteor.y + meteor.size / 2);
  ctx.rotate(meteor.rotation);

  const radius = meteor.size / 2;
  const damageRatio = 1 - meteor.health / meteor.maxHealth;
  const gradient = ctx.createRadialGradient(-radius * 0.25, -radius * 0.25, 2, 0, 0, radius);
  gradient.addColorStop(0, "#fef3c7");
  gradient.addColorStop(0.34, "#f97316");
  gradient.addColorStop(1, "#7f1d1d");

  ctx.beginPath();
  for (let i = 0; i < 9; i += 1) {
    const angle = (Math.PI * 2 * i) / 9;
    const jaggedRadius = radius * meteor.points[i];
    const x = Math.cos(angle) * jaggedRadius;
    const y = Math.sin(angle) * jaggedRadius;

    if (i === 0) ctx.moveTo(x, y);
    else ctx.lineTo(x, y);
  }
  ctx.closePath();
  ctx.fillStyle = gradient;
  ctx.fill();
  ctx.strokeStyle = "rgba(254, 215, 170, 0.45)";
  ctx.stroke();

  if (damageRatio > 0) {
    ctx.strokeStyle = `rgba(248, 113, 113, ${0.35 + damageRatio * 0.4})`;
    ctx.lineWidth = 1.4 + damageRatio * 2;

    for (let i = 0; i < meteor.maxHealth - meteor.health; i += 1) {
      const angle = meteor.rotation + i * 1.9;
      ctx.beginPath();
      ctx.moveTo(Math.cos(angle) * radius * 0.18, Math.sin(angle) * radius * 0.18);
      ctx.lineTo(Math.cos(angle) * radius * 0.78, Math.sin(angle) * radius * 0.78);
      ctx.stroke();
    }
  }

  ctx.rotate(-meteor.rotation);
  const pipGap = 5;
  const totalPipsWidth = (meteor.maxHealth - 1) * pipGap;

  for (let i = 0; i < meteor.maxHealth; i += 1) {
    ctx.beginPath();
    ctx.arc(-totalPipsWidth / 2 + i * pipGap, -radius - 7, 2, 0, Math.PI * 2);
    ctx.fillStyle = i < meteor.health ? "#fde68a" : "rgba(148, 163, 184, 0.36)";
    ctx.fill();
  }

  ctx.restore();
}

function drawBullet(ctx, bullet) {
  const trail = ctx.createLinearGradient(bullet.x - 20, bullet.y, bullet.x + bullet.width, bullet.y);
  trail.addColorStop(0, "rgba(103, 232, 249, 0)");
  trail.addColorStop(0.4, "rgba(103, 232, 249, 0.55)");
  trail.addColorStop(1, "#f8fafc");

  ctx.save();
  ctx.shadowColor = "rgba(103, 232, 249, 0.95)";
  ctx.shadowBlur = 16;
  ctx.fillStyle = trail;
  ctx.beginPath();
  ctx.roundRect(bullet.x - 18, bullet.y - 1, bullet.width + 20, bullet.height + 2, 999);
  ctx.fill();
  ctx.restore();
}

function createExplosion(x, y, radius, now, variant = "meteor") {
  const amount = Math.round(clamp(radius / 2, 10, 24));
  const colors = variant === "spark"
    ? ["#67e8f9", "#f8fafc", "#93c5fd"]
    : ["#facc15", "#fb923c", "#fb7185", "#fef3c7"];

  return {
    x,
    y,
    bornAt: now,
    duration: variant === "spark" ? 280 : 520,
    particles: Array.from({ length: amount }, () => {
      const angle = randomBetween(0, Math.PI * 2);
      const distance = randomBetween(radius * 0.25, radius * 1.25);

      return {
        dx: Math.cos(angle) * distance,
        dy: Math.sin(angle) * distance,
        radius: randomBetween(1.5, variant === "spark" ? 3 : 5),
        color: colors[Math.floor(Math.random() * colors.length)],
      };
    }),
  };
}

function drawExplosion(ctx, explosion, now) {
  const progress = clamp((now - explosion.bornAt) / explosion.duration, 0, 1);
  const alpha = 1 - progress;

  ctx.save();
  ctx.globalCompositeOperation = "lighter";
  explosion.particles.forEach((particle) => {
    ctx.globalAlpha = alpha;
    ctx.beginPath();
    ctx.arc(
      explosion.x + particle.dx * progress,
      explosion.y + particle.dy * progress,
      particle.radius * (1 - progress * 0.45),
      0,
      Math.PI * 2
    );
    ctx.fillStyle = particle.color;
    ctx.shadowColor = particle.color;
    ctx.shadowBlur = 12;
    ctx.fill();
  });
  ctx.restore();
}

function drawStarCollectible(ctx, star) {
  const spikes = 5;
  const outerRadius = star.radius;
  const innerRadius = star.radius * 0.45;

  ctx.save();
  ctx.translate(star.x, star.y);
  ctx.rotate(star.rotation);

  if (star.value >= 4) {
    ctx.beginPath();
    ctx.arc(0, 0, outerRadius * 1.45, 0, Math.PI * 2);
    ctx.fillStyle = `rgba(103, 232, 249, ${0.08 + star.value * 0.025})`;
    ctx.fill();
  }

  ctx.beginPath();

  for (let i = 0; i < spikes * 2; i += 1) {
    const radius = i % 2 === 0 ? outerRadius : innerRadius;
    const angle = (Math.PI * i) / spikes - Math.PI / 2;
    const x = Math.cos(angle) * radius;
    const y = Math.sin(angle) * radius;

    if (i === 0) ctx.moveTo(x, y);
    else ctx.lineTo(x, y);
  }

  ctx.closePath();
  ctx.fillStyle = star.color;
  ctx.shadowColor = "rgba(250, 204, 21, 0.95)";
  ctx.shadowBlur = 12 + star.value * 4;
  ctx.fill();

  ctx.rotate(-star.rotation);
  ctx.shadowBlur = 0;
  ctx.fillStyle = "#020617";
  ctx.font = `900 ${Math.max(9, star.radius * 0.72)}px Orbitron, sans-serif`;
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText(String(star.value), 0, 1);
  ctx.restore();
}

function drawBackground(ctx, width, height, stars, elapsed) {
  ctx.clearRect(0, 0, width, height);

  const gradient = ctx.createLinearGradient(0, 0, width, height);
  gradient.addColorStop(0, "#020617");
  gradient.addColorStop(0.52, "#07132e");
  gradient.addColorStop(1, "#020617");
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, width, height);

  stars.forEach((star) => {
    const x = (star.x - elapsed * star.speed) % width;
    const drawX = x < 0 ? x + width : x;
    const pulse = Math.sin(elapsed * star.twinkle + star.phase) * 0.22;
    const alpha = clamp(star.alpha + pulse, 0.16, 1);
    const radius = star.radius * (1 + pulse * 0.18);

    ctx.beginPath();
    ctx.arc(drawX, star.y, radius, 0, Math.PI * 2);
    ctx.fillStyle = `rgba(226, 232, 240, ${alpha})`;
    ctx.fill();

    if (star.radius > 1.45) {
      ctx.strokeStyle = `rgba(103, 232, 249, ${alpha * 0.28})`;
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(drawX - radius * 2.4, star.y);
      ctx.lineTo(drawX + radius * 2.4, star.y);
      ctx.moveTo(drawX, star.y - radius * 2.4);
      ctx.lineTo(drawX, star.y + radius * 2.4);
      ctx.stroke();
    }
  });
}

function createMeteor(width, height) {
  const size = randomBetween(30, 62);
  const maxHealth = clamp(Math.ceil((size - 24) / 14) + (Math.random() > 0.72 ? 1 : 0), 1, 4);

  return {
    x: width + size,
    y: randomBetween(18, height - size - 18),
    size,
    maxHealth,
    health: maxHealth,
    rotation: randomBetween(0, Math.PI * 2),
    spin: randomBetween(-1.8, 1.8),
    points: Array.from({ length: 9 }, () => randomBetween(0.7, 1.08)),
  };
}

function createCollectible(width, height) {
  const roll = Math.random();
  const value = roll > 0.9 ? 5 : roll > 0.74 ? 4 : roll > 0.54 ? 3 : roll > 0.28 ? 2 : 1;
  const colors = {
    1: "#facc15",
    2: "#fde68a",
    3: "#67e8f9",
    4: "#c4b5fd",
    5: "#fb7185",
  };

  return {
    x: width + 20,
    y: randomBetween(30, height - 30),
    value,
    color: colors[value],
    radius: 7 + value * 2.2,
    rotation: randomBetween(0, Math.PI * 2),
  };
}

function createBackdropStars(width, height) {
  const amount = width < 720 ? 90 : 150;

  return Array.from({ length: amount }, () => ({
    x: Math.random() * width,
    y: Math.random() * height,
    radius: Math.random() > 0.86 ? randomBetween(1.6, 2.8) : randomBetween(0.55, 1.35),
    speed: randomBetween(8, 36),
    alpha: randomBetween(0.32, 0.9),
    phase: randomBetween(0, Math.PI * 2),
    twinkle: randomBetween(1.1, 3.4),
  }));
}

export default function GameCanvas({ running, restartKey, paused = false, onStatsChange, onGameOver }) {
  const canvasRef = useRef(null);
  const animationRef = useRef(null);
  const keysRef = useRef(new Set());
  const gameRef = useRef(null);
  const pausedRef = useRef(paused);

  useEffect(() => {
    pausedRef.current = paused;
  }, [paused]);

  useEffect(() => {
    const handleKeyDown = (event) => {
      const key = event.key.toLowerCase();

      if (["arrowup", "arrowdown", "arrowleft", "arrowright", "w", "a", "s", "d"].includes(key)) {
        event.preventDefault();
        keysRef.current.add(key);
      }

      if (key === "shift") {
        event.preventDefault();
        keysRef.current.add(key);
        fireBullet(gameRef.current, performance.now(), pausedRef.current);
      }
    };

    const handleKeyUp = (event) => {
      keysRef.current.delete(event.key.toLowerCase());
    };

    window.addEventListener("keydown", handleKeyDown);
    window.addEventListener("keyup", handleKeyUp);

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      window.removeEventListener("keyup", handleKeyUp);
    };
  }, []);

  useEffect(() => {
    if (!running) return undefined;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");
    let disposed = false;

    function resizeCanvas() {
      const rect = canvas.getBoundingClientRect();
      const dpr = Math.min(window.devicePixelRatio || 1, 2);

      canvas.width = Math.floor(rect.width * dpr);
      canvas.height = Math.floor(rect.height * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

      const width = rect.width;
      const height = rect.height;

      if (gameRef.current) {
        gameRef.current.width = width;
        gameRef.current.height = height;
        gameRef.current.player.x = clamp(gameRef.current.player.x, 18, width - PLAYER_WIDTH - 18);
        gameRef.current.player.y = clamp(gameRef.current.player.y, 18, height - PLAYER_HEIGHT - 18);
        gameRef.current.backdropStars = createBackdropStars(width, height);
      }
    }

    const rect = canvas.getBoundingClientRect();
    const width = rect.width || 900;
    const height = rect.height || 520;

    gameRef.current = {
      width,
      height,
      player: {
        x: 82,
        y: height / 2 - PLAYER_HEIGHT / 2,
        width: PLAYER_WIDTH,
        height: PLAYER_HEIGHT,
        invulnerableUntil: 0,
      },
      meteors: [],
      collectibles: [],
      bullets: [],
      explosions: [],
      backdropStars: createBackdropStars(width, height),
      lives: 3,
      stars: 0,
      score: 0,
      speed: 230,
      ammo: MAX_AMMO,
      maxAmmo: MAX_AMMO,
      nextReloadAt: null,
      lastShotAt: 0,
      emptyAmmoPulseUntil: 0,
      shotsFired: 0,
      meteorsDestroyed: 0,
      startedAt: performance.now(),
      lastFrameAt: performance.now(),
      lastMeteorAt: performance.now(),
      lastStarAt: performance.now(),
      lastStatsAt: 0,
      totalPausedMs: 0,
      pauseStartedAt: null,
      ended: false,
    };

    resizeCanvas();
    window.addEventListener("resize", resizeCanvas);

    function handleCanvasPointerDown(event) {
      if (event.button !== 2) return;

      event.preventDefault();
      fireBullet(gameRef.current, performance.now(), pausedRef.current);
    }

    function preventContextMenu(event) {
      event.preventDefault();
    }

    canvas.addEventListener("pointerdown", handleCanvasPointerDown);
    canvas.addEventListener("contextmenu", preventContextMenu);

    function getElapsedSeconds(game, now = performance.now()) {
      const currentPauseMs = game.pauseStartedAt ? now - game.pauseStartedAt : 0;
      return Math.max(0, (now - game.startedAt - game.totalPausedMs - currentPauseMs) / 1000);
    }

    function finishGame() {
      const game = gameRef.current;
      if (!game || game.ended) return;

      game.ended = true;
      const elapsed = getElapsedSeconds(game);

      onGameOver?.({
        score: game.score,
        stars: game.stars,
        lives: 0,
        time: elapsed,
        speed: game.speed,
        ammo: game.ammo,
        maxAmmo: game.maxAmmo,
        reloadProgress: getReloadProgress(game),
        meteorsDestroyed: game.meteorsDestroyed,
        shotsFired: game.shotsFired,
      });
    }

    function emitStats(force = false) {
      const game = gameRef.current;
      if (!game) return;

      const now = performance.now();
      if (!force && now - game.lastStatsAt < 120) return;

      game.lastStatsAt = now;
      onStatsChange?.({
        score: game.score,
        stars: game.stars,
        lives: game.lives,
        time: getElapsedSeconds(game, now),
        speed: game.speed,
        ammo: game.ammo,
        maxAmmo: game.maxAmmo,
        reloadProgress: getReloadProgress(game, now),
        meteorsDestroyed: game.meteorsDestroyed,
        shotsFired: game.shotsFired,
      });
    }

    function loop(now) {
      const game = gameRef.current;
      if (!game || disposed || game.ended) return;

      if (pausedRef.current) {
        if (!game.pauseStartedAt) {
          game.pauseStartedAt = now;
          emitStats(true);
        }

        animationRef.current = requestAnimationFrame(loop);
        return;
      }

      if (game.pauseStartedAt) {
        const pausedFor = now - game.pauseStartedAt;
        game.totalPausedMs += pausedFor;
        game.lastFrameAt = now;
        game.lastMeteorAt += pausedFor;
        game.lastStarAt += pausedFor;

        if (game.player.invulnerableUntil > game.pauseStartedAt) {
          game.player.invulnerableUntil += pausedFor;
        }

        if (game.nextReloadAt) {
          game.nextReloadAt += pausedFor;
        }

        game.pauseStartedAt = null;
      }

      const dt = Math.min((now - game.lastFrameAt) / 1000, 0.04);
      const elapsed = getElapsedSeconds(game, now);
      game.lastFrameAt = now;
      game.speed = 230 + elapsed * 11;
      updateAmmo(game, now);

      const keys = keysRef.current;
      if (keys.has("shift")) {
        fireBullet(game, now, false);
      }

      const dx =
        (keys.has("arrowright") || keys.has("d") ? 1 : 0) -
        (keys.has("arrowleft") || keys.has("a") ? 1 : 0);
      const dy =
        (keys.has("arrowdown") || keys.has("s") ? 1 : 0) -
        (keys.has("arrowup") || keys.has("w") ? 1 : 0);
      const diagonal = dx !== 0 && dy !== 0 ? 0.72 : 1;

      game.player.x = clamp(
        game.player.x + dx * PLAYER_SPEED * diagonal * dt,
        18,
        game.width - PLAYER_WIDTH - 18
      );
      game.player.y = clamp(
        game.player.y + dy * PLAYER_SPEED * diagonal * dt,
        18,
        game.height - PLAYER_HEIGHT - 18
      );

      const meteorDelay = Math.max(430, 1180 - elapsed * 18);
      const starDelay = Math.max(560, 960 - elapsed * 5);

      if (now - game.lastMeteorAt > meteorDelay) {
        game.meteors.push(createMeteor(game.width, game.height));
        game.lastMeteorAt = now;
      }

      if (now - game.lastStarAt > starDelay) {
        game.collectibles.push(createCollectible(game.width, game.height));
        game.lastStarAt = now;
      }

      game.meteors = game.meteors
        .map((meteor) => ({
          ...meteor,
          x: meteor.x - game.speed * dt,
          rotation: meteor.rotation + meteor.spin * dt,
        }))
        .filter((meteor) => meteor.x > -meteor.size - 40);

      game.collectibles = game.collectibles
        .map((star) => ({
          ...star,
          x: star.x - game.speed * 0.74 * dt,
          rotation: star.rotation + 2.4 * dt,
        }))
        .filter((star) => star.x > -30);

      game.bullets = game.bullets
        .map((bullet) => ({
          ...bullet,
          x: bullet.x + BULLET_SPEED * dt,
        }))
        .filter((bullet) => bullet.x < game.width + 60);

      game.explosions = game.explosions.filter((explosion) => now - explosion.bornAt < explosion.duration);

      const playerBox = {
        x: game.player.x + 8,
        y: game.player.y + 6,
        width: PLAYER_WIDTH - 14,
        height: PLAYER_HEIGHT - 12,
      };

      const remainingBullets = [];

      for (const bullet of game.bullets) {
        const hitIndex = game.meteors.findIndex((meteor) => rectsCollide(bullet, getMeteorBox(meteor)));

        if (hitIndex === -1) {
          remainingBullets.push(bullet);
          continue;
        }

        const meteor = game.meteors[hitIndex];
        meteor.health -= 1;
        game.score += 2;
        game.explosions.push(createExplosion(bullet.x + bullet.width, bullet.y, 10, now, "spark"));

        if (meteor.health <= 0) {
          game.score += meteor.maxHealth * METEOR_SCORE;
          game.meteorsDestroyed += 1;
          game.explosions.push(
            createExplosion(meteor.x + meteor.size / 2, meteor.y + meteor.size / 2, meteor.size, now)
          );
          game.meteors.splice(hitIndex, 1);
        }
      }

      game.bullets = remainingBullets;

      game.collectibles = game.collectibles.filter((star) => {
        if (!rectCircleCollide(playerBox, star)) return true;

        game.stars += star.value;
        game.score += star.value;
        game.explosions.push(createExplosion(star.x, star.y, star.radius * 2, now, "spark"));
        return false;
      });

      const canTakeDamage = now > game.player.invulnerableUntil;

      if (canTakeDamage) {
        const hitIndex = game.meteors.findIndex((meteor) =>
          rectsCollide(playerBox, getMeteorBox(meteor))
        );

        if (hitIndex >= 0) {
          const meteor = game.meteors[hitIndex];
          game.explosions.push(
            createExplosion(meteor.x + meteor.size / 2, meteor.y + meteor.size / 2, meteor.size, now)
          );
          game.meteors.splice(hitIndex, 1);
          game.lives -= 1;
          game.player.invulnerableUntil = now + 1250;

          if (game.lives <= 0) {
            emitStats(true);
            finishGame();
            return;
          }
        }
      }

      drawBackground(ctx, game.width, game.height, game.backdropStars, elapsed);
      game.collectibles.forEach((star) => drawStarCollectible(ctx, star));
      game.bullets.forEach((bullet) => drawBullet(ctx, bullet));
      game.meteors.forEach((meteor) => drawMeteor(ctx, meteor));
      game.explosions.forEach((explosion) => drawExplosion(ctx, explosion, now));
      drawShip(ctx, game.player, now < game.player.invulnerableUntil);
      drawAmmoWarning(ctx, game, now);
      emitStats();

      animationRef.current = requestAnimationFrame(loop);
    }

    animationRef.current = requestAnimationFrame(loop);

    return () => {
      disposed = true;
      window.removeEventListener("resize", resizeCanvas);
      canvas.removeEventListener("pointerdown", handleCanvasPointerDown);
      canvas.removeEventListener("contextmenu", preventContextMenu);
      cancelAnimationFrame(animationRef.current);
      keysRef.current.clear();
    };
  }, [onGameOver, onStatsChange, restartKey, running]);

  return <canvas ref={canvasRef} className="game-canvas" aria-label="Campo de jogo Stellar Run" />;
}
