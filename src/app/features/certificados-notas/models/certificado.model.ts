export interface CertificadoModulo {
  nombre: string;
  sigla: string;
  nota: number | null;
  aprobada: boolean;
  clasificacion: string | null;
}

export interface CertificadoDatos {
  programa: string;
  version: number;
  edicion: number;
  semestre: number;
  anio: number;
  modalidad: string | null;
  carrera: string | null;
  estado_alumno: string;
  alumno: { nombre: string; apellido: string; ci: string | null };
  modulos: CertificadoModulo[];
  promedio: number | null;
}

export interface CertificadoNotas {
  id_certificado: number;
  id_alumno: number;
  id_programa_version_edicion: number;
  id_informe: number | null;
  fecha_emision: string;
  emitido_por: number | null;
  emitido_at: string | null;
  procedencia: string;
  numero_certificado: number | null;
  codigo: string | null;
  n_impresiones: number;
  ultima_impresion_at: string | null;
  ruta_pdf: string | null;
  modalidad: string | null;
  carrera: string | null;
  datos: CertificadoDatos | null;
  alumno?: { nombre: string | null; apellido: string | null; ci: string | null } | null;
  edicion?: {
    programa: string | null;
    edicion: number | null;
    anio: number | null;
    semestre: number | null;
  } | null;
}

export interface CertificadoElegibleAlumno {
  id_alumno: number;
  id_detalle_programa_alumno: number;
  nombre: string;
  apellido: string;
  ci: string | null;
  modalidad: string | null;
  carrera: string | null;
  educacion_continua: boolean;
  elegible: boolean;
  motivo_exclusion: string | null;
}

export interface CertificadoEmitirRequest {
  id_programa_version_edicion: number;
  alumnos_ids: number[];
}

export interface CertificadoEmitirOmitido {
  id_alumno: number;
  motivo: string;
}

export interface CertificadoEmitirResponse {
  emitidos: CertificadoNotas[];
  omitidos: CertificadoEmitirOmitido[];
}

export interface CertificadoImpresionResponse {
  id_certificado: number;
  n_impresiones: number;
  ultima_impresion_at: string | null;
}

export interface CertificadoGrupo {
  clave: string;
  modalidad: string;
  carrera: string | null;
  certificados: CertificadoNotas[];
}

export interface CertificadoSelGrupo {
  modalidad: string;
  alumnos: CertificadoElegibleAlumno[];
}