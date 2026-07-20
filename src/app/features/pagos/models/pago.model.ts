export interface PagoResponse {
  id_pago: number;
  id_detalle_programa_alumno: number;
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
  comprobante_url?: string | null;
  numero_referencia?: string | null;
  estado?: string;
  observaciones?: string | null;
}

export interface AlumnoPagos {
  id_detalle_programa_alumno: number;
  alumno: {
    id_alumno: number;
    nombre: string;
    apellido: string;
    ci: string | null;
  } | null;
  descuento_aplicado: number;
  pagos: PagoResponse[];
  total_pagado: number;
}

export interface MisPagosResponse {
  pagos: PagoResponse[];
  total_pagado: number;
}
