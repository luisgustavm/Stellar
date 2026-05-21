// src/components/effects/SpaceParallax.jsx
import { useEffect } from "react";

export default function SpaceParallax() {
  useEffect(() => {
    function move(e) {
      const x = (e.pageX - window.innerWidth / 2) / 50;
      const y = (e.pageY - window.innerHeight / 2) / 50;

      document.body.style.backgroundPosition = `${x}px ${y}px`;
    }

    window.addEventListener("mousemove", move);

    return () => window.removeEventListener("mousemove", move);
  }, []);

  return null;
}