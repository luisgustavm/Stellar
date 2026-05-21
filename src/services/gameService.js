// src/services/gameService.js
import { doc, updateDoc } from "firebase/firestore";
import { db } from "./api";

export const saveScore = async (uid, score) => {
const ref = doc(db, "users", uid);
await updateDoc(ref, { bestScore: score });
};

// src/data/quizData.js
export const quizData = [
{
question: "Qual é o maior planeta do sistema solar?",
options: ["Terra", "Júpiter", "Marte", "Vênus"],
correct: 1,
explanation: "Júpiter é o maior planeta do sistema solar.",
},
{
question: "Qual planeta é conhecido como planeta vermelho?",
options: ["Marte", "Saturno", "Mercúrio", "Netuno"],
correct: 0,
explanation: "Marte é chamado de planeta vermelho devido ao óxido de ferro.",
},
];