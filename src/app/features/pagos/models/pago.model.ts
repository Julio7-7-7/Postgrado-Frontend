/* ===== Transacciones de pago (boletas) ===== */

export interface PagoItemResponse {
  id_pago: number;
  id_transaccion: number;
  id_detalle_programa_modulo: number | null;
  monto: number;
  concepto: string;
}

export interface TransaccionPagoResponse {
  id_transaccion: number;
  id_detalle_programa_alumno: number;
  monto_total: number;
  fecha_pago: string;
  comprobante: string | null;
  estado: string;
  motivo_anulacion: string | null;
  anulado_por_id_usuario: number | null;
  anulado_fecha: string | null;
  creado_por_id_usuario: number | null;
  created_at: string;
  updated_at: string;
  pagos: PagoItemResponse[];
}

export interface TransaccionPagoCreate {
  id_detalle_programa_alumno: number;
  id_detalle_programa_modulo?: number | null;
  monto: number;
  fecha_pago: string;
  comprobante?: string | null;
}

export interface TransaccionPagoBaja {
  motivo_anulacion: string;
}

export interface PreviewAsignacion {
  tipo: 'matricula' | 'cuota';
  id_detalle_programa_modulo: number | null;
  concepto: string;
  monto: number;
}

export interface PreviewResponse {
  asignaciones: PreviewAsignacion[];
}

export interface MisPagosResponse {
  transacciones: TransaccionPagoResponse[];
  total_pagado: number;
}

/* ===== Transcript de pagos por alumno ===== */

export interface TransaccionTranscript {
  id_transaccion: number;
  fecha_pago: string;
  monto_total: number;
  comprobante: string | null;
  estado: string;
  motivo_anulacion: string | null;
  anulado_fecha: string | null;
  anulado_por: string | null;
  creado_por: string | null;
  asignaciones: {
    id_pago: number;
    id_detalle_programa_modulo: number | null;
    concepto: string;
    orden: number;
    modulo_nombre: string | null;
    monto: number;
  }[];
}

export interface FinancieroAlumno {
  matricula: { esperado: number; pagado: number; saldo: number };
  cuotas: { esperado: number; pagado: number; saldo: number };
  otros_pagado: number;
  total_esperado: number;
  total_pagado: number;
  saldo: number;
  pct: number;
  beca_activa: boolean;
  beca_motivo: string | null;
  descuento_aplicado: number;
}

export interface TranscriptPagosInscripcion {
  id_detalle_programa_alumno: number;
  id_programa_version_edicion: number;
  programa_nombre: string | null;
  edicion_numero: number | null;
  edicion_anio: number | null;
  edicion_semestre: number | null;
  estado: string;
  es_incorporacion: boolean;
  total_pagado: number;
  transacciones: TransaccionTranscript[];
  financiero?: FinancieroAlumno;
}

export interface TranscriptPagosResponse {
  id_alumno: number;
  inscripciones: TranscriptPagosInscripcion[];
}

/* ===== Matriz de pagos por edición ===== */

export interface ModuloPagosInfo {
  id_detalle_programa_modulo: number;
  id_modulo: number;
  nombre: string;
  sigla: string;
  orden: number;
}

export interface PagoOrigenEdicion {
  edicion: number;
  anio: number;
  semestre: number;
}

export interface PagoEntry {
  id_pago: number;
  id_transaccion: number;
  monto: number;
  fecha_pago: string;
  concepto: string;
  estado: string;
  comprobante: string | null;
  origen: PagoOrigenEdicion | null;
}

export interface CuotaPagos {
  id_detalle_programa_modulo: number;
  id_modulo: number;
  orden: number;
  nombre: string;
  sigla: string;
  esperado: number;
  pagado: number;
  pct: number;
  pagos: PagoEntry[];
}

export interface MatriculaPagos {
  esperado: number;
  pagado: number;
  pct: number;
  pagos: PagoEntry[];
}

export interface OtrosPagos {
  pagado: number;
  pagos: PagoEntry[];
}

export interface AlumnoPagosMatrix {
  id_detalle_programa_alumno: number;
  alumno: {
    id_alumno: number;
    nombre: string;
    apellido: string;
    ci: string | null;
  } | null;
  estado: string;
  descuento_aplicado: number;
  beca_activa: boolean;
  beca_motivo: string | null;
  matricula: MatriculaPagos;
  cuotas: CuotaPagos[];
  otros: OtrosPagos;
  total_esperado: number;
  total_pagado: number;
  pct_total: number;
}

export interface PagosEdicionData {
  id_programa_version_edicion: number;
  precio: number;
  matricula: number;
  modulos: ModuloPagosInfo[];
  alumnos: AlumnoPagosMatrix[];
}
