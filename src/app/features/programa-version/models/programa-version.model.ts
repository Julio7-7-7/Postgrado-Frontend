import { Programa } from '../../programa/models/programa.model';

export interface ProgramaVersion {
  id_programa_version: number;
  id_programa: number;
  version: number;
  descripcion: string | null;
  foto: string | null;
  vigente: boolean;
  programa: Programa;
  ediciones_count: number;
  created_at: string;
  updated_at: string;
}

export interface ProgramaVersionCreate {
  id_programa: number;
  descripcion: string | null;
  foto?: string | null;
  vigente?: boolean;
}
