// src/hooks/usePlanets.js
import { useEffect, useState } from "react";

export default function usePlanets() {
const [planets, setPlanets] = useState([]);
const [loading, setLoading] = useState(true);

useEffect(() => {
const fetchPlanets = async () => {
const res = await fetch("https://api.le-systeme-solaire.net/rest/bodies/");
const data = await res.json();

  const filtered = data.bodies
    .filter((p) => p.isPlanet)
    .map((p) => ({
      id: p.id,
      name: p.englishName,
      gravity: p.gravity,
      density: p.density,
      discoveredBy: p.discoveredBy,
    }));

  setPlanets(filtered);
  setLoading(false);
};

fetchPlanets();

}, []);

return { planets, loading };
}