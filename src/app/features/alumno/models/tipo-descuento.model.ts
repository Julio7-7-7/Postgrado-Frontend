export interface TipoDescuentoRequisito {
  id_requisito: number;
  nombre: string;
  descripcion: string | null;
  imagen_url: string | null;
  estado: string;
}

export interface TipoDescuento {
  id_tipo_descuento: number;
  nombre: string;
  porcentaje: number;
  descripcion: string | null;
  uso_unico: boolean;
  estado: 'activo' | 'inactivo';
  modalidades: { id_modalidad_academica: number; nombre_modalidad: string }[];
  requisitos: TipoDescuentoRequisito[];
  created_at: string;
  updated_at: string;
}
