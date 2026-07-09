export interface TipoDescuento {
  id_tipo_descuento: number;
  nombre: string;
  porcentaje: number;
  descripcion: string | null;
  requiere_documento: boolean;
  id_requisito_extra: number | null;
  estado: 'activo' | 'inactivo';
  created_at: string;
  updated_at: string;
}
