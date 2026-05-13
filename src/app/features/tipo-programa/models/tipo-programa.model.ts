export interface TipoPrograma {
id_tipo_programa: number;
nombre: string;
estado: 'activo' | 'inactivo';
cupo_minimo: number | null;
created_at: string;
updated_at: string;
}

export interface TipoProgramaCreate extends Omit<TipoPrograma, 'id_tipo_programa' | 'created_at' | 'updated_at'> {}