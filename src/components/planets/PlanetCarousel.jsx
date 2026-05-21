import { useState } from "react";
import PlanetCard from "./PlanetCard";

export default function PlanetCarousel({ planets = [] }) {
  const [index, setIndex] = useState(0);

  if (!planets.length) {
    return (
      <div className="text-white text-center p-4">
        Carregando planetas...
      </div>
    );
  }

  const safeIndex = index % planets.length;

  const next = () => setIndex((i) => (i + 1) % planets.length);

  const prev = () =>
    setIndex((i) => (i - 1 + planets.length) % planets.length);

  return (
    <div className="w-full flex items-center justify-center gap-4">
      <button onClick={prev} className="px-3 py-2 bg-white/10 rounded-lg">
        ◀
      </button>

      <div className="w-72">
        <PlanetCard planet={planets[safeIndex]} />
      </div>

      <button onClick={next} className="px-3 py-2 bg-white/10 rounded-lg">
        ▶
      </button>
    </div>
  );
}