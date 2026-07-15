export interface ModalidadAcademicaResponse {
  id_modalidad_academica: number;
  nombre_modalidad: string;
  descripcion: string | null;
  requiere_titulo: boolean;
  estado: string;
  created_at: string;
  updated_at: string;
}

export interface ModalidadAcademicaCreate {
  nombre_modalidad: string;
  descripcion?: string | null;
  requiere_titulo?: boolean;
  uso_unico?: boolean;
}

export interface ModalidadAcademicaUpdate {
  nombre_modalidad?: string;
  descripcion?: string | null;
  requiere_titulo?: boolean;
  uso_unico?: boolean;
  estado?: string;
}

export interface RequisitoResponse {
  id_requisito: number;
  id_modalidad_academica: number | null;
  nombre: string;
  descripcion: string | null;
  obligatorio: boolean;
  estado: string;
  modalidad_academica: ModalidadAcademicaResponse | null;
  created_at: string;
  updated_at: string;
}

export interface RequisitoCreate {
  id_modalidad_academica: number | null;
  nombre: string;
  descripcion?: string | null;
  obligatorio?: boolean;
}

export interface RequisitoUpdate {
  id_modalidad_academica?: number | null;
  nombre?: string;
  descripcion?: string | null;
  obligatorio?: boolean;
  estado?: string;
}
