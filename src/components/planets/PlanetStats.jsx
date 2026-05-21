export default function PlanetStats({ planet }) {
  return (
    <div className="bg-black/40 border border-white/10 rounded-xl p-4 text-white">
      <h3 className="text-lg font-bold mb-2">Características</h3>

      <ul className="text-sm space-y-1 text-white/80">
        <li>Diâmetro: {planet.diameter}</li>
        <li>Distância do Sol: {planet.distance}</li>
        <li>Rotação: {planet.rotation}</li>
        <li>Translação: {planet.translation}</li>
      </ul>
    </div>
  );
}