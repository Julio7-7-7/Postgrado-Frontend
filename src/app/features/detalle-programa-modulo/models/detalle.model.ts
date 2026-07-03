import { ContratacionDocente } from '../../contratacion/models/contratacion.model';

export type ModalidadType = 'presencial' | 'virtual' | 'semipresencial';

export interface DetalleProgramaModulo {
  id_detalle_programa_modulo: number;
  id_programa_version_edicion: number;
  id_programa_version: number;
  id_programa: number;
  edicion: number;
  programa_nombre: string;
  programa_version_numero: number;
  id_modulo: number;
  modalidad: ModalidadType | null;
  orden: number;
  fecha_inicio: string | null;
  fecha_fin: string | null;
  estado: 'programado' | 'en_curso' | 'reprogramado' | 'finalizado';
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
  contratacion: ContratacionDocente | null;
  created_at: string;
  updated_at: string;
}

export interface DetalleUpdate {
  modalidad?: ModalidadType | null;
  orden?: number | null;
  fecha_inicio?: string | null;
  fecha_fin?: string | null;
  estado?: string | null;
  motivo?: string | null;
}
