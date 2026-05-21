// src/components/quiz/QuizCard.jsx
export default function QuizCard({ children }) {
  return (
    <div className="bg-white/10 border border-white/10 backdrop-blur rounded-xl p-6 text-white max-w-2xl mx-auto">
      {children}
    </div>
  );
}