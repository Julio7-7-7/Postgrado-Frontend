export interface DetalleProgramaModulo {
  id_detalle_programa_modulo: number;
  id_programa_version_edicion: number;
  id_modulo: number;
  id_docente: number | null;
  id_modalidad: number | null;
  orden: number;
  fecha_inicio: string | null;
  fecha_fin: string | null;
  estado: 'programado' | 'en_curso' | 'pausado' | 'reprogramado' | 'finalizado';
  modulo: {
    id_modulo: number;
    sigla: string;
    nombre_modulo: string;
    horas_academicas: number;
    creditos: number;
  };
  docente: {
    id_docente: number;
    nombre: string;
    apellido: string;
  } | null;
  modalidad: {
    id_modalidad: number;
    nombre: string;
  } | null;
  created_at: string;
  updated_at: string;
}

export interface DetalleUpdate {
  id_docente?: number | null;
  id_modalidad?: number | null;
  orden?: number | null;
  fecha_inicio?: string | null;
  fecha_fin?: string | null;
  estado?: string | null;
  motivo?: string | null;
}
