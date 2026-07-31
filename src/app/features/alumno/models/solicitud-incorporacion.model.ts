export interface DocumentoSolicitud {
  id_solicitud_documento: number;
  id_requisito: number;
  nombre_requisito: string;
  url_documento: string | null;
  estado: string;
  fecha_entrega: string;
}

export interface SolicitudIncorporacion {
  id_solicitud: number;
  id_programa_version_edicion: number;
  id_modalidad_academica: number;
  id_tipo_descuento: number | null;
}

export interface SolicitudMigracion {
  id_solicitud: number;
  id_edicion_destino: number;
  motivo: string;
}

export interface Solicitud {
  id_solicitud: number;
  id_tipo_solicitud: number;
  tipo_codigo: string;
  id_alumno: number;
  id_detalle_origen: number | null;
  estado: string;
  motivo: string | null;
  motivo_rechazo: string | null;
  created_at: string;
  updated_at: string;
  documentos: DocumentoSolicitud[];
  incorporacion: SolicitudIncorporacion | null;
  migracion: SolicitudMigracion | null;
}

export interface SolicitudConDetalle {
  id_solicitud: number;
  id_tipo_solicitud: number;
  tipo_codigo: string;
  id_alumno: number | null;
  alumno_nombre: string | null;
  alumno_apellido: string | null;
  alumno_ci: string | null;
  estado: string;
  motivo: string | null;
  motivo_rechazo: string | null;
  id_detalle_origen: number | null;
  edicion_numero: number | null;
  edicion_anio: number | null;
  edicion_semestre: number | null;
  programa_nombre: string | null;
  dpa_estado: string | null;
  created_at: string;
  documentos: DocumentoSolicitud[];
  incorporacion: SolicitudIncorporacion | null;
  migracion: SolicitudMigracion | null;
}

export interface NotaPreviewItem {
  modulo_nombre: string;
  modulo_orden: number;
  nota: number;
  calificacion: string | null;
}

export interface PagoPreviewItem {
  concepto: string;
  monto: number;
  estado: string;
  fecha_pago: string;
}

export interface ModuloDestinoItem {
  modulo_nombre: string;
  modulo_orden: number;
  match: boolean;
}

export interface PreviewOrigen {
  id_detalle_programa_alumno: number;
  edicion_numero: number | null;
  edicion_anio: number | null;
  edicion_semestre: number | null;
  notas: NotaPreviewItem[];
  pagos: PagoPreviewItem[];
  total_notas: number;
  total_pagos: number;
  monto_total_pagos: number;
}

export interface PreviewDestino {
  id_programa_version_edicion: number;
  edicion_numero: number | null;
  edicion_anio: number | null;
  edicion_semestre: number | null;
  modulos: ModuloDestinoItem[];
  precio: number | null;
  cupo_disponible: number | null;
}

export interface PreviewMigracion {
  alumno: { id_alumno: number; nombre: string; apellido: string; ci: string | null };
  origen: PreviewOrigen;
  destino: PreviewDestino;
  resumen: { notas_a_migrar: number; pagos_a_migrar: number; monto_a_migrar: number };
}

export type TipoSolicitud = 'incorporacion' | 'migracion' | 'reincorporacion';

export interface SolicitudAdminItem {
  tipo: TipoSolicitud;
  id: number;
  estado: string;
  created_at: string;
  id_alumno: number | null;
  alumno_nombre: string | null;
  alumno_apellido: string | null;
  alumno_ci: string | null;
  id_detalle_programa_alumno: number | null;
  dpa_estado: string | null;
  edicion_numero: number | null;
  edicion_anio: number | null;
  edicion_semestre: number | null;
  programa_nombre: string | null;
  documentos?: DocumentoSolicitud[];
  motivo_rechazo?: string | null;
  es_migracion?: boolean;
}

export interface PuedeMigrarResponse {
  puede: boolean;
  motivo: string | null;
}
