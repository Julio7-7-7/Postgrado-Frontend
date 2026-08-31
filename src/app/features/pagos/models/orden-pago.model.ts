/* ===== Órdenes de pago ===== */

export interface OrdenPagoItem {
  tipo: 'matricula' | 'cuota';
  id_detalle_programa_modulo: number | null;
  concepto: string;
  monto: number;
}

export interface OrdenPagoEmitir {
  id_detalle_programa_alumno: number;
  cubre_matricula: boolean;
  cantidad_modulos: number;
}

export interface OrdenPagoPagar {
  fecha_pago: string;
  comprobante?: string | null;
  codigo_boleta?: string | null;
}

export interface OrdenPagoBaja {
  motivo_anulacion: string;
}

export interface OrdenPagoAlumno {
  id_alumno: number;
  nombre: string;
  apellido: string;
  ci: string | null;
}

export interface OrdenPagoEdicion {
  programa: string | null;
  edicion: number | null;
  anio: number | null;
  semestre: number | null;
}

export interface OrdenPagoResponse {
  id_orden_pago: number;
  numero: string;
  id_detalle_programa_alumno: number;
  fecha_emision: string;
  monto_total: number;
  items: OrdenPagoItem[];
  estado: 'emitida' | 'pagada' | 'anulada';
  motivo_anulacion: string | null;
  anulado_por_id_usuario: number | null;
  anulado_por: string | null;
  anulado_fecha: string | null;
  creado_por_id_usuario: number | null;
  creado_por: string | null;
  created_at: string;
  updated_at: string;
  id_transaccion: number | null;
  alumno: OrdenPagoAlumno | null;
  edicion: OrdenPagoEdicion | null;
}

export interface OrdenPagoPreview {
  items: OrdenPagoItem[];
  monto_total: number;
}
