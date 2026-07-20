export interface AlumnoAdmin {
  id_alumno: number;
  ci: string | null;
  pasaporte: string | null;
  nombre: string;
  apellido: string;
  fecha_nacimiento: string | null;
  genero: string | null;
  celular: string | null;
  correo: string;
  direccion: string | null;
  id_usuario: number | null;
  created_at: string;
  updated_at: string;
}

export interface AlumnoAdminUpdate {
  ci?: string | null;
  pasaporte?: string | null;
  nombre?: string;
  apellido?: string;
  fecha_nacimiento?: string | null;
  genero?: string | null;
  celular?: string | null;
  correo?: string;
  direccion?: string | null;
}
