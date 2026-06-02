export function aFechaString(fecha: Date | null): string | null {
  if (!fecha) return null;
  return `${fecha.getFullYear()}-${String(fecha.getMonth() + 1).padStart(2, '0')}-${String(fecha.getDate()).padStart(2, '0')}`;
}
