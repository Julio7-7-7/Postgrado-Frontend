export interface ModalidadAcademica {
  id_modalidad_academica: number;
  nombre_modalidad: string;
  descripcion: string | null;
  requiere_titulo: boolean;
  uso_unico: boolean;
  estado: 'activo' | 'inactivo';
  created_at: string;
  updated_at: string;
}
