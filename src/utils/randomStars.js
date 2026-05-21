export function generateStars(count = 150) {
  const stars = [];

  for (let i = 0; i < count; i++) {
    stars.push({
      id: i,
      x: Math.random() * window.innerWidth,
      y: Math.random() * window.innerHeight,
      size: Math.random() * 2 + 1,
      speed: Math.random() * 0.5 + 0.1
    });
  }

  return stars;
}