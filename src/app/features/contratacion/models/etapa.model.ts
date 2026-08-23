export interface EtapaContratacion {
  id_etapa: number;
  id_tipo_programa: number;
  nombre: string;
  orden: number;
  requisitos: EtapaRequisitoInfo[];
  created_at: string;
  updated_at: string;
}

export interface EtapaRequisitoInfo {
  id_requisito: number;
  nombre: string;
  orden: number;
}

export interface EtapaContratacionCreate {
  id_tipo_programa: number;
  nombre: string;
  requisitos?: EtapaRequisitoAsignar[];
}

export interface EtapaRequisitoAsignar {
  id_requisito: number;
  orden?: number;
}

export interface ControlDocContratacion {
  id_control_doc_contratacion: number;
  id_contratacion: number;
  id_requisito: number;
  id_etapa: number;
  url_documento: string | null;
  estado: 'pendiente' | 'entregado' | 'aceptado' | 'rechazado';
  notas: string | null;
  requisito_nombre: string;
  etapa_nombre: string;
  created_at: string;
  updated_at: string;
}
