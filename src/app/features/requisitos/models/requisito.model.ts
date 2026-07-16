export interface RequisitoResponse {
  id_requisito: number;
  nombre: string;
  descripcion: string | null;
  imagen_url: string | null;
  estado: string;
  created_at: string;
  updated_at: string;
}

export interface RequisitoCreate {
  nombre: string;
  descripcion?: string | null;
  imagen_url?: string | null;
  estado?: string;
}

export interface RequisitoUpdate {
  nombre?: string;
  descripcion?: string | null;
  imagen_url?: string | null;
  estado?: string;
}
