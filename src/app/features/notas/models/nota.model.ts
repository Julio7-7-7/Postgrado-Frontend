export interface NotaResponse {
  id_nota: number;
  id_detalle_programa_alumno: number;
  id_detalle_programa_modulo: number;
  modulo_nombre: string;
  modulo_orden: number;
  nota: number;
  tipo: string;
  fecha: string;
  observaciones: string | null;
  created_at: string;
  updated_at: string;
}

export interface NotaCreate {
  id_detalle_programa_alumno: number;
  id_detalle_programa_modulo: number;
  nota: number;
  tipo: string;
  fecha: string;
  observaciones?: string | null;
}

export interface NotaUpdate {
  nota?: number;
  tipo?: string;
  fecha?: string;
  observaciones?: string | null;
}

export interface AlumnoNotas {
  id_detalle_programa_alumno: number;
  alumno: {
    id_alumno: number;
    nombre: string;
    apellido: string;
    ci: string | null;
  } | null;
  notas: NotaResponse[];
  promedio: number;
}

export interface MisNotasResponse {
  notas: any[];
}
