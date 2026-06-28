import { Docente } from '../../docente/models/docente.model';

export type ContratacionEstado = 'pendiente' | 'en_curso' | 'formalizado' | 'truncado';

export interface ContratacionDocente {
  id_contratacion: number;
  id_docente: number;
  id_detalle_modulo: number;
  monto: number | null;
  fecha_inicio: string | null;
  fecha_fin: string | null;
  estado: ContratacionEstado;
  docente: Docente;
  created_at: string;
  updated_at: string;
}

export interface ContratacionCreate {
  id_docente: number;
  id_detalle_modulo: number;
  monto?: number | null;
}
