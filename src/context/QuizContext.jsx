import { createContext, useState } from "react";

export const QuizContext = createContext();

export function QuizProvider({ children }) {
  const [answers, setAnswers] = useState([]);
  const [score, setScore] = useState(0);

  return (
    <QuizContext.Provider value={{ answers, setAnswers, score, setScore }}>
      {children}
    </QuizContext.Provider>
  );
}