import { RequisitoResponse } from '../../requisitos/models/requisito.model';

export interface ModalidadAcademicaResponse {
  id_modalidad_academica: number;
  nombre_modalidad: string;
  descripcion: string | null;
  requiere_titulo: boolean;
  estado: string;
  requisitos: RequisitoResponse[];
  created_at: string;
  updated_at: string;
}

export interface ModalidadAcademicaCreate {
  nombre_modalidad: string;
  descripcion?: string | null;
  requiere_titulo?: boolean;
  requisitos?: number[];
}

export interface ModalidadAcademicaUpdate {
  nombre_modalidad?: string;
  descripcion?: string | null;
  requiere_titulo?: boolean;
  estado?: string;
  requisitos?: number[];
}
