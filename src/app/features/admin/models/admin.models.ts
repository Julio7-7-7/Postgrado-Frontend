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

export interface UserAdminResponse {
  id_usuario: number;
  email: string;
  activo: boolean;
  rol: string;
  id_rol: number;
  profile_type: string | null;
  profile_nombre: string | null;
  created_at: string;
}

export interface UserAdminCreate {
  email: string;
  password: string;
  id_rol: number;
  ci: string;
  nombre: string;
  apellido: string;
  celular?: string | null;
}

export interface UserChangeRol {
  id_rol: number;
}
