export interface InformeNotasRequest {
  id_programa_version_edicion: number;
  tipo: 'parcial' | 'final';
  id_modulos: number[];
  id_carrera?: number | null;
}

export interface InformeAlumnoNota {
  id_alumno: number;
  id_detalle_programa_alumno: number;
  nombre: string;
  apellido: string;
  ci: string | null;
  nota: number | null;
  aprobada: boolean;
}

export interface InformeModulo {
  id_detalle_programa_modulo: number;
  nombre_modulo: string;
  sigla: string;
  fecha_inicio: string | null;
  fecha_fin: string | null;
  docente: string | null;
  alumnos: InformeAlumnoNota[];
}

export interface InformeMatrizColumna {
  id_detalle_programa_modulo: number;
  nombre_modulo: string;
  sigla: string;
}

export interface InformeMatrizFila {
  id_alumno: number;
  id_detalle_programa_alumno: number;
  nombre: string;
  apellido: string;
  ci: string | null;
  notas: (number | null)[];
  aprobada: boolean;
  elegible: boolean;
  motivo_exclusion: string | null;
}

export interface InformeCarrera {
  id_carrera: number | null;
  nombre: string;
  modulos: InformeModulo[];
  matriz_columnas: InformeMatrizColumna[];
  matriz_filas: InformeMatrizFila[];
}

export interface InformeResumenCarrera {
  id_carrera: number | null;
  nombre: string;
  alumnos: number;
  elegibles: number;
}

export interface InformeResumen {
  total_alumnos: number;
  total_aprobados: number;
  total_reprobados: number;
  elegibles: number;
  carreras: InformeResumenCarrera[];
}

export interface InformeContenido {
  tipo: string;
  id_programa_version_edicion: number;
  edicion_desc: string | null;
  programa_nombre: string;
  version: number;
  edicion: number;
  semestre: number | null;
  anio: number | null;
  carreras: InformeCarrera[];
  todas_notas: boolean;
  edicion_finalizada: boolean;
  resumen: InformeResumen;
}

export interface InformePreviewResponse extends InformeContenido {
  numero_tanda: number;
  timestamp: string;
  es_borrador: boolean;
  edicion_estado: string;
}

export interface InformeNotas {
  id_informe: number;
  id_programa_version_edicion: number;
  numero_tanda: number;
  tipo: 'parcial' | 'final';
  fecha_emision: string;
  generado_at: string | null;
  estado: string;
  observaciones: string | null;
  contenido: InformeContenido | null;
  certificados_count: number;
  created_at: string;
  updated_at: string;
}

export interface AlumnoElegible {
  id_alumno: number;
  id_detalle_programa_alumno: number;
  nombre: string;
  apellido: string;
  ci: string | null;
  elegible: boolean;
  motivo_exclusion: string | null;
}

export interface ElegiblesResponse {
  id_programa_version_edicion: number;
  total_elegibles: number;
  alumnos: AlumnoElegible[];
}

export interface CertificadoNotasInfo {
  id_certificado: number;
  id_alumno: number;
  id_programa_version_edicion: number;
  id_informe: number;
  fecha_emision: string;
  ruta_pdf: string | null;
  alumno: {
    nombre: string | null;
    apellido: string | null;
    ci: string | null;
  } | null;
  edicion: {
    programa: string | null;
    edicion: number | null;
    anio: number | null;
    semestre: number | null;
  } | null;
}

export interface CertificadosPorInformeResponse {
  id_informe: number;
  certificados: CertificadoNotasInfo[];
}