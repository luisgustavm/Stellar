// src/components/effects/GalaxyParticles.jsx
import { useEffect } from "react";

export default function GalaxyParticles() {
  useEffect(() => {
    const container = document.getElementById("galaxy");
    if (!container) return;

    const particles = [];

    for (let i = 0; i < 60; i++) {
      const particle = document.createElement("div");

      particle.className =
        "absolute w-1 h-1 bg-white rounded-full opacity-60";

      particle.style.left = Math.random() * 100 + "vw";
      particle.style.top = Math.random() * 100 + "vh";

      container.appendChild(particle);
      particles.push(particle);
    }

    return () => {
      particles.forEach((p) => p.remove());
    };
  }, []);

  return (
    <div id="galaxy" className="fixed inset-0 z-0 pointer-events-none" />
  );
}