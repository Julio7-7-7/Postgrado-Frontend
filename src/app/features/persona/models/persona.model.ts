export interface RolInfo {
  id_rol: number;
  nombre: string;
  descripcion: string | null;
}

export interface AlumnoInfo {
  id_alumno: number;
  ci: string | null;
  pasaporte: string | null;
  nombre: string;
  apellido: string;
  correo: string;
  genero: string | null;
  celular: string | null;
  fecha_nacimiento: string | null;
  direccion: string | null;
}

export interface DocenteInfo {
  id_docente: number;
  ci: string;
  nombre: string;
  apellido: string;
  correo: string;
  genero: string | null;
  celular: string | null;
  extension: string | null;
  grado: string | null;
  titulo: string | null;
  estado: string;
}

export interface AdministrativoInfo {
  id_administrativo: number;
  ci: string;
  nombre: string;
  apellido: string;
  correo: string | null;
  celular: string | null;
  cargo: string | null;
  estado: string;
}

export interface Persona {
  id_usuario: number;
  email: string;
  activo: boolean;
  roles: RolInfo[];
  alumno: AlumnoInfo | null;
  docente: DocenteInfo | null;
  administrativo: AdministrativoInfo | null;
  created_at: string;
}

export interface PaginatedPersonas {
  items: Persona[];
  total: number;
  page: number;
  per_page: number;
  pages: number;
}
