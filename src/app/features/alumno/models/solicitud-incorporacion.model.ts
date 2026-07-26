export interface SolicitudIncorporacion {
  id_solicitud: number;
  id_detalle_programa_alumno: number | null;
  id_alumno: number | null;
  id_programa_version_edicion: number | null;
  id_requisito: number | null;
  tipo_documento: string;
  estado: string;
  url_documento: string | null;
  observaciones: string | null;
  fecha_entrega: string | null;
  fecha_revision: string | null;
  created_at: string;
  updated_at: string;
}

export interface SolicitudIncorporacionConDetalle {
  id_solicitud: number;
  tipo_documento: string;
  estado: string;
  url_documento: string | null;
  observaciones: string | null;
  fecha_entrega: string | null;
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
  id_requisito: number | null;
  requisito_nombre: string | null;
}
