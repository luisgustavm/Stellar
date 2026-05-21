// src/components/quiz/QuizProgress.jsx
export default function QuizProgress({ current, total }) {
  const percent = (current / total) * 100;

  return (
    <div className="w-full bg-white/10 rounded-full h-2 mb-4">
      <div
        className="bg-blue-500 h-2 rounded-full transition-all"
        style={{ width: `${percent}%` }}
      />
    </div>
  );
}