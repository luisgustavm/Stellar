import { useContext } from "react";
import { QuizContext } from "../context/QuizContext";

export function useQuiz() {
  return useContext(QuizContext);
}