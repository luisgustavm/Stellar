// src/components/effects/StarsBackground.jsx
import { useEffect, useRef } from "react";

export default function StarsBackground() {
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");
    const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    let stars = [];
    let starCount = window.innerWidth < 700 ? 48 : 84;
    let animationId;
    let isRunning = true;
    let lastFrame = 0;
    const FRAME_INTERVAL = 1000 / 30;

    function resize() {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
      canvas.style.width = "100vw";
      canvas.style.height = "100dvh";
    }

    function createStars() {
      starCount = window.innerWidth < 700 ? 48 : 84;
      stars = Array.from({ length: prefersReducedMotion ? Math.min(52, starCount) : starCount }).map(() => ({
        x: Math.random() * canvas.width,
        y: Math.random() * canvas.height,
        r: Math.random() * 1.5,
        d: Math.random() * 1,
      }));
    }

    function draw() {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.fillStyle = "white";

      for (const s of stars) {
        ctx.beginPath();
        ctx.arc(s.x, s.y, s.r, 0, Math.PI * 2);
        ctx.fill();
      }
    }

    function update() {
      for (const s of stars) {
        s.y += s.d;

        if (s.y > canvas.height) {
          s.y = 0;
          s.x = Math.random() * canvas.width;
        }
      }
    }

    function animate(time = 0) {
      if (!isRunning) {
        animationId = null;
        return;
      }

      if (time - lastFrame >= FRAME_INTERVAL) {
        draw();
        update();
        lastFrame = time;
      }

      animationId = requestAnimationFrame(animate);
    }

    function handleResize() {
      resize();
      createStars();
    }

    resize();
    createStars();
    if (prefersReducedMotion) {
      draw();
    } else {
      animate();
    }

    function handleVisibilityChange() {
      isRunning = document.visibilityState === "visible";

      if (!isRunning) {
        cancelAnimationFrame(animationId);
        animationId = null;
        return;
      }

      if (isRunning && !animationId && !prefersReducedMotion) {
        animate();
      }
    }

    window.addEventListener("resize", handleResize);
    document.addEventListener("visibilitychange", handleVisibilityChange);

    return () => {
      cancelAnimationFrame(animationId);
      window.removeEventListener("resize", handleResize);
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      aria-hidden="true"
      className="fixed inset-0 z-0 h-dvh w-screen pointer-events-none"
    />
  );
}
