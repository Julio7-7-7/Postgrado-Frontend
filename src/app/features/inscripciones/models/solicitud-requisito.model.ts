export interface SolicitudRequisito {
  id_solicitud_requisito: number;
  id_requisito: number;
  id_tipo_solicitud: number;
  estado: string;
  tipo_codigo: string | null;
  requisito_nombre: string | null;
}

export interface Requisito {
  id_requisito: number;
  nombre: string;
  descripcion: string | null;
  estado: string;
}
