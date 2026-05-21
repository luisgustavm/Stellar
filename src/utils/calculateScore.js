export function calculateScore(answers, quizData) {
  let score = 0;

  answers.forEach((ans, index) => {
    if (quizData[index]?.answer === ans) {
      score += 1;
    }
  });

  return score;
}