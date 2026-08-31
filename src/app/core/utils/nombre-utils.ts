export interface PersonaNombre {
  nombre?: string | null;
  apellido?: string | null;
}

export function nombreCompleto(p: PersonaNombre | null | undefined): string {
  if (!p) return '';
  const apellido = (p.apellido || '').trim();
  const nombre = (p.nombre || '').trim();
  if (!apellido && !nombre) return '';
  return [apellido, nombre].filter(Boolean).join(' ');
}

export function inicialesNombre(p: PersonaNombre | null | undefined): string {
  if (!p) return '??';
  const apellido = (p.apellido || '').trim();
  const nombre = (p.nombre || '').trim();
  const a = apellido ? apellido[0] : '';
  const n = nombre ? nombre[0] : '';
  const ini = (n + a).toUpperCase();
  return ini || '??';
}
