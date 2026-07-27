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
  es_incorporacion: boolean;
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

export interface ModuloTranscript {
  id_detalle_programa_modulo: number;
  modulo_nombre: string;
  modulo_orden: number;
  nota: number | null;
  calificacion: string | null;
  edicion_numero: number | null;
  edicion_anio: number | null;
  edicion_semestre: number | null;
  es_migrada: boolean;
  edicion_origen_numero: number | null;
  edicion_origen_anio: number | null;
  edicion_origen_semestre: number | null;
  migrado_a_edicion_numero: number | null;
  migrado_a_edicion_anio: number | null;
  migrado_a_edicion_semestre: number | null;
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
  modulo_inicio: number;
  modulos: ModuloTranscript[];
  promedio: number | null;
  migrado_a_edicion_numero: number | null;
  migrado_a_edicion_anio: number | null;
  migrado_a_edicion_semestre: number | null;
}

export interface EdicionInfo {
  id_programa_version_edicion: number;
  edicion_numero: number | null;
  anio: number | null;
  semestre: number | null;
  programa_nombre: string;
  estado: string | null;
}

export interface TranscriptResponse {
  id_alumno: number;
  alumno_nombre: string;
  alumno_apellido: string;
  alumno_ci: string | null;
  inscripciones: InscripcionTranscript[];
  ediciones_info: EdicionInfo[];
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
