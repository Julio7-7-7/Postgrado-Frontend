export interface Modalidad {
  id_modalidad: number;
  nombre: string;
  descripcion: string | null;
  estado: 'activo' | 'inactivo';
  created_at: string;
  updated_at: string;
}
