export interface SolicitudRequisito {
  id_solicitud_requisito: number;
  id_requisito: number;
  obligatorio: boolean;
  estado: string;
  tipo: string;
  requisito_nombre: string | null;
}

export interface Requisito {
  id_requisito: number;
  nombre: string;
  descripcion: string | null;
  estado: string;
}
