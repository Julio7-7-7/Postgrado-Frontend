export interface OpcionPrograma {
  id_programa: number;
  nombre: string;
  versiones: OpcionVersion[];
}

export interface OpcionVersion {
  id_programa_version: number;
  version: number;
  ediciones: OpcionEdicion[];
}

export interface OpcionEdicion {
  id_programa_version_edicion: number;
  edicion: number;
  anio: number;
  semestre: number;
  modalidad: string;
  estado: string;
  fecha_inicio: string | null;
  fecha_fin: string | null;
}

export interface OpcionCarrera {
  id_carrera: number;
  nombre: string;
  sigla: string | null;
}

export interface OpcionesReportes {
  programas: OpcionPrograma[];
  carreras: OpcionCarrera[];
  ediciones: OpcionEdicion[];
}

export interface SeriePunto {
  periodo: string;
  monto?: number;
  cantidad?: number;
}

export interface PorPrograma {
  programa: string;
  monto?: number;
  deuda?: number;
  cantidad?: number;
  retirados?: number;
  graduados?: number;
}

export interface Ingresos {
  total: number;
  por_mes: SeriePunto[];
  por_edicion: PorPrograma[];
}

export interface Deudor {
  id_detalle_programa_alumno: number;
  id_alumno: number;
  nombre: string;
  apellido: string;
  ci: string | null;
  celular: string | null;
  correo: string | null;
  carrera: string | null;
  programa: string;
  estado: string;
  saldo: number;
}

export interface DeudoresGrupo {
  carrera: string;
  deuda: number;
  cantidad: number;
  deudores: Deudor[];
}

export interface ReporteEconomico {
  desde: string;
  hasta: string;
  carrera: number | null;
  ingresos: Ingresos;
  deuda: {
    total: number;
    cantidad_deudores: number;
    por_programa: PorPrograma[];
  };
  deudores_por_carrera: DeudoresGrupo[];
  deudores: Deudor[];
}

export interface EstadoPoblacion {
  estado: string;
  label: string;
  cantidad: number;
}

export interface ReportePoblacion {
  desde: string;
  hasta: string;
  total: number;
  por_estado: EstadoPoblacion[];
  incorporaciones: number;
  egresados: {
    educacion_continua: number;
    profesionales: number;
    total: number;
  };
  por_programa: PorPrograma[];
  evolucion: SeriePunto[];
}

export interface ClasificacionNota {
  clasificacion: string;
  cantidad: number;
}

export interface ModuloRendimiento {
  id_detalle_programa_modulo: number;
  orden: number;
  nombre: string;
  promedio: number;
  cantidad: number;
  aprobados: number;
  reprobados: number;
}

export interface ReporteRendimiento {
  desde: string;
  hasta: string;
  total_notas: number;
  promedio_general: number;
  por_clasificacion: ClasificacionNota[];
  por_modulo: ModuloRendimiento[];
  aprobados: number;
  reprobados: number;
}

export type ReporteTab = 'economico' | 'poblacion' | 'rendimiento';

export type PeriodoPreset = 'anual' | 'semestral' | 'rango';
