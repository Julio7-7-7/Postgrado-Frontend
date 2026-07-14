export interface ModalidadResumen {
  id_modalidad_academica: number;
  nombre_modalidad: string;
}

export interface TipoPrograma {
  id_tipo_programa: number;
  nombre: string;
  estado: 'activo' | 'inactivo';
  cupo_minimo: number | null;
  duracion_minima_meses: number | null;
  modalidades: ModalidadResumen[];
  created_at: string;
  updated_at: string;
}

export interface TipoProgramaCreate {
  nombre: string;
  estado: 'activo' | 'inactivo';
  cupo_minimo: number | null;
  duracion_minima_meses: number | null;
  modalidades: number[];
}
