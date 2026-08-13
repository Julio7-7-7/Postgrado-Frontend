import { ProgramaVersion } from '../../programa-version/models/programa-version.model';

export type ModalidadType = 'presencial' | 'virtual' | 'semipresencial';

export interface ProgramaVersionEdicion {
  id_programa_version_edicion: number;
  id_programa_version: number;
  modalidad: ModalidadType;
  edicion: number;
  semestre: number;
  anio: number;
  gestion: string;
  es_historico: boolean;
  estado: 'programado' | 'en_curso' | 'reprogramado' | 'finalizado';
  fecha_inicio: string | null;
  fecha_fin: string | null;
  cupo_maximo: number | null;
  descripcion: string | null;
  precio: number | null;
  matricula: number | null;
  programa_version: ProgramaVersion;
  created_at: string;
  updated_at: string;
}

export interface ProgramaVersionEdicionCreate {
  id_programa_version: number;
  modalidad: ModalidadType;
  semestre?: number | null;
  anio?: number | null;
  es_historico?: boolean;
  edicion?: number | null;
  estado?: 'programado' | 'en_curso' | 'reprogramado' | 'finalizado';
  fecha_inicio?: string | null;
  fecha_fin?: string | null;
  cupo_maximo?: number | null;
  descripcion?: string | null;
  precio?: number | null;
  matricula?: number | null;
}

export interface PaginatedProgramaVersionEdicion {
  items: ProgramaVersionEdicion[];
  total: number;
  page: number;
  per_page: number;
  pages: number;
}
