export function clasificarNota(nota: number): string {
  if (nota === 0) return 'cal-abandono';
  if (nota <= 65) return 'cal-insuficiente';
  if (nota <= 70) return 'cal-suficiente';
  if (nota <= 80) return 'cal-bueno';
  if (nota <= 90) return 'cal-distinguido';
  return 'cal-sobresaliente';
}
