export default function QuizResult({ score, total, questions, answers }) {
  return (
    <div className="text-white">
      <h2 className="text-2xl font-bold mb-4">
        Resultado: {score}/{total}
      </h2>

      <div className="space-y-4">
        {questions.map((q, i) => {
          const correctAnswer = q.a?.[q.correct];

          return (
            <div
              key={i}
              className="bg-black/40 p-4 rounded-lg border border-white/10"
            >
              <p className="font-bold">{q.q}</p>

              <p className="text-sm text-green-400">
                Correta: {correctAnswer}
              </p>

              <p className="text-sm text-red-400">
                Sua resposta: {q.a?.[answers[i]] || "Não respondido"}
              </p>

              <p className="text-xs text-white/60 mt-2">
                {q.explanation}
              </p>
            </div>
          );
        })}
      </div>
    </div>
  );
}