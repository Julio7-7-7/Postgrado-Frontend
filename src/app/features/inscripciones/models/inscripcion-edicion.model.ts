export interface AlumnoBasico {
  id_alumno: number;
  nombre: string;
  apellido: string;
  ci: string | null;
  correo: string | null;
}

export interface InscripcionEdicionItem {
  id_detalle_programa_alumno: number;
  alumno: AlumnoBasico;
  estado: string;
  modalidad: string;
  descuento_aplicado: number;
  tipo_descuento: string | null;
  modulo_inicio: number;
  fecha_inscripcion: string | null;
  docs_completados: number;
  docs_total: number;
}

export interface PaginatedInscripciones {
  items: InscripcionEdicionItem[];
  total: number;
  page: number;
  per_page: number;
  pages: number;
}

export interface TransferirRequest {
  id_programa_version_edicion_destino: number;
  motivo: string;
  id_modalidad_academica: number;
  id_tipo_descuento: number | null;
}

export interface ModuloTranscript {
  id_detalle_programa_modulo: number;
  modulo_nombre: string;
  modulo_orden: number;
  nota: number | null;
  nota_tipo: string | null;
  completado_en_edicion: number;
  edicion_numero: number | null;
  edicion_anio: number | null;
  edicion_semestre: number | null;
  fecha_completion: string | null;
}

export interface InscripcionTranscript {
  id_detalle_programa_alumno: number;
  estado: string;
  edicion_id: number;
  edicion_numero: number | null;
  edicion_anio: number | null;
  edicion_semestre: number | null;
  programa_nombre: string;
  modalidad_nombre: string;
  modulos: ModuloTranscript[];
  promedio: number | null;
}

export interface TranscriptResponse {
  id_alumno: number;
  alumno_nombre: string;
  alumno_apellido: string;
  alumno_ci: string | null;
  inscripciones: InscripcionTranscript[];
  promedio_general: number | null;
}

export interface EdicionBasica {
  id_programa_version_edicion: number;
  edicion: number;
  anio: number;
  semestre: number;
  estado: string;
  programa_nombre: string;
}
