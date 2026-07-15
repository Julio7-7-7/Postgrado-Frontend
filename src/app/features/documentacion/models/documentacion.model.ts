export interface ControlDocumentacionResponse {
  id_control_documentacion: number;
  id_requisito: number;
  estado: string;
  obligatorio: boolean;
  url_documento: string | null;
  fecha_entrega: string | null;
  fecha_revision: string | null;
  observaciones: string | null;
}

export interface ControlDocumentacionUpdate {
  estado?: string;
  url_documento?: string | null;
  observaciones?: string | null;
}

export interface PostulanteResponse {
  id_detalle_programa_alumno: number;
  estado: string;
  fecha_inscripcion: string | null;
  descuento_aplicado: number;
  alumno: {
    id_alumno: number;
    nombre: string;
    apellido: string;
    ci: string | null;
    correo: string | null;
  } | null;
  control_documentacion: ControlDocumentacionResponse[];
  docs_completados: number;
  docs_total: number;
}

export interface TipoProgramaResponse {
  id_tipo_programa: number;
  nombre: string;
  estado: string;
  cupo_minimo: number | null;
  duracion_minima_meses: number | null;
  modalidades: { id_modalidad_academica: number; nombre_modalidad: string }[];
  created_at: string;
  updated_at: string;
}

export interface ProgramaResponse {
  id_programa: number;
  nombre_programa: string;
  tipo_programa: TipoProgramaResponse;
}

export interface ProgramaVersionResponse {
  id_programa_version: number;
  version: number;
  programa: ProgramaResponse;
}

export interface ProgramaVersionEdicionResponse {
  id_programa_version_edicion: number;
  edicion: number;
  semestre: number | null;
  anio: number | null;
  estado: string;
  modalidad: string;
  precio: number | null;
  programa_version: ProgramaVersionResponse;
  created_at: string;
}
