export type GeneroDocente = 'masculino' | 'femenino';
export type ExtensionDocente = 'LP' | 'CB' | 'SC' | 'CH' | 'OR' | 'PT' | 'TRJ' | 'BN' | 'PD';
export type GradoDocente = 'Dr.' | 'MSc.' | 'Mg.' | 'Esp.' | 'Ing.' | 'Lic.' | 'Otro';
export type EstadoDocente = 'disponible' | 'contratado' | 'inactivo';

export interface Docente {
  id_docente: number;
  ci: string;
  nombre: string;
  apellido: string;
  genero: GeneroDocente | null;
  extension: ExtensionDocente | null;
  grado: GradoDocente | null;
  titulo: string | null;
  correo: string;
  celular: string | null;
  estado: EstadoDocente;
  created_at: string;
  updated_at: string;
}

export interface DocenteCreate {
  ci: string;
  nombre: string;
  apellido: string;
  genero: GeneroDocente | null;
  extension: ExtensionDocente | null;
  grado: GradoDocente | null;
  titulo: string | null;
  correo: string;
  celular: string | null;
  estado: EstadoDocente;
}
