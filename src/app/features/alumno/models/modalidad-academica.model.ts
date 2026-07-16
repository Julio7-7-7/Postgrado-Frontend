export interface RequisitoResumen {
  id_requisito: number;
  nombre: string;
  descripcion: string | null;
  imagen_url: string | null;
  estado: string;
}

export interface ModalidadAcademica {
  id_modalidad_academica: number;
  nombre_modalidad: string;
  descripcion: string | null;
  estado: 'activo' | 'inactivo';
  requisitos: RequisitoResumen[];
  created_at: string;
  updated_at: string;
}
