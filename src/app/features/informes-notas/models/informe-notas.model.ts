export interface InformeNotas {
  id_informe: number;
  id_programa_version_edicion: number;
  numero_tanda: number;
  fecha_emision: string;
  alumnos_ids: number[];
  estado: string;
  observaciones: string | null;
  created_at: string;
  updated_at: string;
}

export interface AlumnoElegible {
  id_alumno: number;
  id_detalle_programa_alumno: number;
  nombre: string;
  apellido: string;
  ci: string | null;
}

export interface ElegiblesResponse {
  id_programa_version_edicion: number;
  total_elegibles: number;
  alumnos: AlumnoElegible[];
}
