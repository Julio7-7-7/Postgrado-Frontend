import { ProgramaVersion } from '../../programa-version/models/programa-version.model';

export interface Modulo {
  id_modulo: number;
  id_programa_version: number;
  sigla: string;
  nombre_modulo: string;
  horas_academicas: number;
  creditos: number;
  descripcion: string | null;
  estado: 'activo' | 'inactivo';
  programa_version: ProgramaVersion;
  created_at: string;
  updated_at: string;
}

export interface ModuloCreate {
  id_programa_version: number;
  sigla: string;
  nombre_modulo: string;
  horas_academicas: number;
  creditos: number;
  descripcion?: string | null;
  estado?: 'activo' | 'inactivo';
}
