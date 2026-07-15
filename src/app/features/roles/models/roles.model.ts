export interface PermisoResponse {
  id_permiso: number;
  codigo: string;
  descripcion: string | null;
}

export interface RolResponse {
  id_rol: number;
  nombre: string;
  descripcion: string | null;
  created_at: string;
  updated_at: string;
  permisos: PermisoResponse[];
}

export interface RolCreate {
  nombre: string;
  descripcion?: string | null;
  permisos: number[];
}

export interface RolUpdate {
  nombre?: string;
  descripcion?: string | null;
  permisos?: number[];
}
