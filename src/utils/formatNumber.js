export function formatNumber(num) {
  if (num === null || num === undefined) return "0";

  return new Intl.NumberFormat("pt-BR").format(num);
}