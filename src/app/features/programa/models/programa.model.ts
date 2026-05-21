export interface Programa {
  id_programa: number;
  id_tipo_programa: number;
  nombre_programa: string;
  foto: string | null;
  estado: 'activo' | 'inactivo';
  tipo_programa: {
    id_tipo_programa: number;
    nombre: string;
    estado: 'activo' | 'inactivo';
    cupo_minimo: number | null;
    created_at: string;
    updated_at: string;
  };
  created_at: string;
  updated_at: string;
}

export interface ProgramaCreate {
  id_tipo_programa: number;
  nombre_programa: string;
  foto?: string | null;
  estado: 'activo' | 'inactivo';
}
