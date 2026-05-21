export function fadeIn(element, duration = 500) {
  if (!element) return;

  element.style.opacity = 0;
  element.style.transition = `opacity ${duration}ms ease`;

  requestAnimationFrame(() => {
    element.style.opacity = 1;
  });
}

export function fadeOut(element, duration = 500) {
  if (!element) return;

  element.style.opacity = 1;
  element.style.transition = `opacity ${duration}ms ease`;

  requestAnimationFrame(() => {
    element.style.opacity = 0;
  });
}

export function scaleIn(element, duration = 400) {
  if (!element) return;

  element.style.transform = "scale(0.8)";
  element.style.opacity = 0;
  element.style.transition = `all ${duration}ms ease`;

  requestAnimationFrame(() => {
    element.style.transform = "scale(1)";
    element.style.opacity = 1;
  });
}