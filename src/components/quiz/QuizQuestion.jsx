export default function QuizQuestion({ question, onAnswer }) {
  return (
    <div>
      <h2 className="text-xl font-bold mb-4">{question.q}</h2>

      <div className="grid gap-2">
        {question.a.map((opt, i) => (
          <button
            key={i}
            onClick={() => onAnswer(i)}
            className="w-full text-left p-3 rounded-lg bg-black/40 hover:bg-blue-600 transition border border-white/10"
          >
            {opt}
          </button>
        ))}
      </div>
    </div>
  );
}