export function abrirInfo(planeta) {
  const map = {
    mercurio: 1,
    venus: 2,
    terra: 3,
    marte: 4,
    jupiter: 5,
    saturno: 6,
    urano: 7,
    netuno: 8,
    sol: 0,
  };

  const id = map[planeta];

  if (id) {
    window.location.href = `/planeta/${id}`;
  }
}