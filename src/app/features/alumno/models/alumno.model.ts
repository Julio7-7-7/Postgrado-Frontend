export type GeneroAlumno = 'masculino' | 'femenino' | 'otro';

export interface Alumno {
  id_alumno: number;
  ci: string | null;
  pasaporte: string | null;
  numero_registro?: string | null;
  nombre: string;
  apellido: string;
  fecha_nacimiento: string | null;
  genero: GeneroAlumno | null;
  celular: string | null;
  correo: string;
  direccion: string | null;
  created_at: string;
  updated_at: string;
}

export interface AlumnoUpdate {
  ci?: string | null;
  pasaporte?: string | null;
  numero_registro?: string | null;
  nombre?: string;
  apellido?: string;
  fecha_nacimiento?: string | null;
  genero?: GeneroAlumno | null;
  celular?: string | null;
  correo?: string;
  direccion?: string | null;
}
