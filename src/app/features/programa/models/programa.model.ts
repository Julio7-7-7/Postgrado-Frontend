import { TipoPrograma } from '../../tipo-programa/models/tipo-programa.model';

export interface Programa {
  id_programa: number;
  id_tipo_programa: number;
  nombre_programa: string;
  foto: string | null;
  estado: 'activo' | 'inactivo';
  tipo_programa: TipoPrograma;
  created_at: string;
  updated_at: string;
}

export interface ProgramaCreate {
  id_tipo_programa: number;
  nombre_programa: string;
  foto?: string | null;
  estado: 'activo' | 'inactivo';
}
