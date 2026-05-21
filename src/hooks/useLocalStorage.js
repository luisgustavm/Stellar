// src/hooks/useLocalStorage.js
import { useState } from "react";

export default function useLocalStorage(key, initial) {
const [value, setValue] = useState(() => {
const stored = localStorage.getItem(key);
return stored ? JSON.parse(stored) : initial;
});

const setStored = (val) => {
setValue(val);
localStorage.setItem(key, JSON.stringify(val));
};

return [value, setStored];
}

// src/hooks/useQuiz.js
import { useState } from "react";

export default function useQuiz(questions = []) {
const [index, setIndex] = useState(0);
const [score, setScore] = useState(0);

const answer = (i) => {
if (i === questions[index].correct) setScore((s) => s + 1);
setIndex((i) => i + 1);
};

return {
index,
score,
answer,
finished: index >= questions.length,
};
}