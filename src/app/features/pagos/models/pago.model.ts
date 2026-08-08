export interface PagoResponse {
  id_pago: number;
  id_detalle_programa_alumno: number;
  id_detalle_programa_modulo: number | null;
  monto: number;
  fecha_pago: string;
  concepto: string;
  comprobante_url: string | null;
  numero_referencia: string | null;
  estado: string;
  observaciones: string | null;
  created_at: string;
  updated_at: string;
}

export interface PagoCreate {
  id_detalle_programa_alumno: number;
  id_detalle_programa_modulo?: number | null;
  monto: number;
  fecha_pago: string;
  concepto: string;
  comprobante_url?: string | null;
  numero_referencia?: string | null;
  estado?: string;
  observaciones?: string | null;
}

export interface PagoUpdate {
  monto?: number;
  fecha_pago?: string;
  concepto?: string;
  id_detalle_programa_modulo?: number | null;
  comprobante_url?: string | null;
  numero_referencia?: string | null;
  estado?: string;
  observaciones?: string | null;
}

export interface MisPagosResponse {
  pagos: PagoResponse[];
  total_pagado: number;
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
  monto: number;
  fecha_pago: string;
  numero_referencia: string | null;
  estado: string;
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
