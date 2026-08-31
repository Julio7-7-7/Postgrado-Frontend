export interface ProfileInfo {
  type: string;
  id: number;
  nombre: string;
}

export interface UserAdminResponse {
  id_usuario: number;
  email: string;
  activo: boolean;
  roles: string[];
  id_roles: number[];
  perfiles: ProfileInfo[];
  password_inicial?: string | null;
  created_at: string;
}

export interface UserAdminCreate {
  email: string;
  tipo_persona: 'alumno' | 'docente' | 'administrativo';
  roles: number[];
  ci: string;
  nombre: string;
  apellido: string;
  celular?: string | null;
  cargo?: string | null;
  numero_registro?: string | null;
  fecha_nacimiento?: string | null;
  genero?: string | null;
  extension?: string | null;
  grado?: string | null;
  titulo?: string | null;
}

export interface UserAdminUpdate {
  email?: string | null;
  password?: string | null;
  ci?: string | null;
  nombre?: string | null;
  apellido?: string | null;
  celular?: string | null;
  cargo?: string | null;
}

export interface UserUpdateRoles {
  roles: number[];
}

export interface PaginatedUsersResponse {
  items: UserAdminResponse[];
  total: number;
  page: number;
  per_page: number;
  pages: number;
}
