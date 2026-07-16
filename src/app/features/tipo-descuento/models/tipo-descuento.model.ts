import { ModalidadAcademicaResponse } from '../../modalidad/models/modalidad.model';
import { RequisitoResponse } from '../../requisitos/models/requisito.model';

export interface TipoDescuentoResponse {
  id_tipo_descuento: number;
  nombre: string;
  porcentaje: number;
  descripcion: string | null;
  uso_unico: boolean;
  estado: string;
  modalidades: ModalidadAcademicaResponse[];
  requisitos: RequisitoResponse[];
  created_at: string;
  updated_at: string;
}

export interface TipoDescuentoCreate {
  nombre: string;
  porcentaje: number;
  descripcion?: string | null;
  modalidades: number[];
  requisitos: number[];
}

export interface TipoDescuentoUpdate {
  nombre?: string;
  porcentaje?: number;
  descripcion?: string | null;
  uso_unico?: boolean;
  estado?: string;
  modalidades?: number[];
  requisitos?: number[];
}
