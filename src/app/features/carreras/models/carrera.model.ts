export interface Carrera {
  id_carrera: number;
  nombre: string;
  sigla: string | null;
  descripcion: string | null;
  estado: 'activo' | 'inactivo';
  created_at: string;
  updated_at: string;
}

export interface CarreraCreate {
  nombre: string;
  sigla?: string | null;
  descripcion?: string | null;
}

export interface CarreraUpdate {
  nombre?: string;
  sigla?: string | null;
  descripcion?: string | null;
}