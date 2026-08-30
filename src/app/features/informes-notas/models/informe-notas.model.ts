export interface InformeNotasRequest {
  id_programa_version_edicion: number;
  tipo: 'borrador' | 'final';
  id_modulos: number[];
  id_carrera?: number | null;
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
  promedio: number | null;
  aprobada: boolean;
  elegible: boolean;
  estado: string;
}

export interface InformeCarrera {
  id_carrera: number | null;
  nombre: string;
  matriz_columnas: InformeMatrizColumna[];
  matriz_filas: InformeMatrizFila[];
}

export interface InformeResumenCarrera {
  id_carrera: number | null;
  nombre: string;
  alumnos: number;
  completos: number;
}

export interface InformeResumen {
  total_alumnos: number;
  total_aprobados: number;
  total_reprobados: number;
  completos: number;
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

export interface InformeNotas {
  id_informe: number;
  id_programa_version_edicion: number;
  numero_tanda: number;
  tipo: 'borrador' | 'final';
  fecha_emision: string;
  generado_at: string | null;
  estado: string;
  observaciones: string | null;
  contenido: InformeContenido | null;
  certificados_count: number;
  emitido_por: number | null;
  emitido_por_nombre: string | null;
  created_at: string;
  updated_at: string;
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