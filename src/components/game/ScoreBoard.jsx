export default function ScoreBoard({ score = 0 }) {
  return (
    <div className="text-white text-lg bg-black/40 border border-white/10 px-4 py-2 rounded-lg backdrop-blur">
      Score: <span className="font-bold text-blue-400">{score}</span>
    </div>
  );
}