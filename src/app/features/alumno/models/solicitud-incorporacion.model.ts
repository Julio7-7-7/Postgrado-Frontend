export interface SolicitudDocumento {
  id_solicitud_documento: number;
  id_requisito: number;
  nombre_requisito: string;
  url_documento: string;
  estado: string;
  fecha_entrega: string;
}

export interface SolicitudIncorporacion {
  id_solicitud: number;
  id_detalle_programa_alumno: number;
  id_programa_version_edicion: number;
  estado: string;
  observaciones: string | null;
  fecha_revision: string | null;
  created_at: string;
  updated_at: string;
  documentos: SolicitudDocumento[];
}

export interface SolicitudIncorporacionConDetalle {
  id_solicitud: number;
  estado: string;
  observaciones: string | null;
  fecha_revision: string | null;
  created_at: string;
  id_alumno: number | null;
  alumno_nombre: string | null;
  alumno_apellido: string | null;
  alumno_ci: string | null;
  id_programa_version_edicion: number | null;
  edicion_numero: number | null;
  edicion_anio: number | null;
  edicion_semestre: number | null;
  programa_nombre: string | null;
  id_detalle_programa_alumno: number | null;
  dpa_estado: string | null;
  es_migracion: boolean;
  documentos: SolicitudDocumento[];
}
