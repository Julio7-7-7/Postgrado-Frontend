export interface HistorialModulo {
  id_historial: number;
  id_detalle_programa_modulo: number;
  estado_anterior: string | null;
  estado_nuevo: string | null;
  motivo: string;
  fecha_inicio_original: string | null;
  fecha_fin_original: string | null;
  fecha_inicio_nuevo: string | null;
  fecha_fin_nuevo: string | null;
  created_at: string;
  detalle?: {
    programa_nombre: string;
    programa_version: number;
    edicion: number;
    modulo_sigla: string;
    modulo_nombre: string;
    orden: number;
    estado_actual: string | null;
  } | null;
}
