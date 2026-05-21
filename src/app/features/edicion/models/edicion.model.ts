import { ProgramaVersion } from '../../programa-version/models/programa-version.model';
import { Modalidad } from '../../modalidad/models/modalidad.model';

export interface ProgramaVersionEdicion {
  id_programa_version_edicion: number;
  id_programa_version: number;
  id_modalidad: number;
  edicion: number;
  gestion: string;
  estado: 'programado' | 'en_curso' | 'pausado' | 'finalizado' | 'cancelado';
  fecha_inicio: string | null;
  fecha_fin: string | null;
  cupo_maximo: number | null;
  descripcion: string | null;
  precio: number | null;
  programa_version: ProgramaVersion;
  modalidad: Modalidad;
  created_at: string;
  updated_at: string;
}

export interface ProgramaVersionEdicionCreate {
  id_programa_version: number;
  id_modalidad: number;
  gestion?: string | null;
  estado?: 'programado' | 'en_curso' | 'pausado' | 'finalizado' | 'cancelado';
  fecha_inicio?: string | null;
  fecha_fin?: string | null;
  cupo_maximo?: number | null;
  descripcion?: string | null;
  precio?: number | null;
}
