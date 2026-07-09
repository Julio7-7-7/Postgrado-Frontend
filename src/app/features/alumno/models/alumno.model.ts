export type GeneroAlumno = 'masculino' | 'femenino' | 'otro';
export type EstadoAlumno = 'activo' | 'inactivo' | 'graduado';

export interface Alumno {
  id_alumno: number;
  ci: string | null;
  pasaporte: string | null;
  nombre: string;
  apellido: string;
  fecha_nacimiento: string | null;
  genero: GeneroAlumno | null;
  celular: string | null;
  correo: string;
  direccion: string | null;
  estado: EstadoAlumno;
  created_at: string;
  updated_at: string;
}

export interface AlumnoUpdate {
  ci?: string | null;
  pasaporte?: string | null;
  nombre?: string;
  apellido?: string;
  fecha_nacimiento?: string | null;
  genero?: GeneroAlumno | null;
  celular?: string | null;
  correo?: string;
  direccion?: string | null;
  estado?: EstadoAlumno;
}
