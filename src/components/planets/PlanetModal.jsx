import Modal from "../ui/Modal";

export default function PlanetModal({ open, planet, onClose }) {
  if (!open || !planet) return null;

  return (
    <Modal open={open} onClose={onClose}>
      <div className="text-white">
        <h2 className="text-2xl font-bold mb-2">{planet.name}</h2>

        <div className="w-full h-56 bg-white/10 rounded-lg mb-3 flex items-center justify-center text-white/40">
          Sem imagem disponível
        </div>

        <p className="text-sm text-white/80">{planet.description}</p>

        <div className="mt-4 text-sm text-white/70 space-y-1">
          <p>Diâmetro: {planet.diameter}</p>
          <p>Distância: {planet.distance}</p>
          <p>Rotação: {planet.rotation}</p>
          <p>Translação: {planet.translation}</p>
        </div>
      </div>
    </Modal>
  );
}