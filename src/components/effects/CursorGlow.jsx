// src/components/effects/CursorGlow.jsx
import { useEffect } from "react";

export default function CursorGlow() {
  useEffect(() => {
    const glow = document.createElement("div");

    glow.style.position = "fixed";
    glow.style.width = "20px";
    glow.style.height = "20px";
    glow.style.borderRadius = "50%";
    glow.style.background = "rgba(255,255,255,0.6)";
    glow.style.pointerEvents = "none";
    glow.style.zIndex = "9999";
    glow.style.transform = "translate(-50%, -50%)";
    glow.style.boxShadow = "0 0 20px white";

    document.body.appendChild(glow);

    function move(e) {
      glow.style.left = e.clientX + "px";
      glow.style.top = e.clientY + "px";
    }

    window.addEventListener("mousemove", move);

    return () => {
      window.removeEventListener("mousemove", move);
      glow.remove();
    };
  }, []);

  return null;
}