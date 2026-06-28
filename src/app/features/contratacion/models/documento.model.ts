export type TipoDocumentoContrato = 'invitacion' | 'aceptacion' | 'solicitud' | 'contrato';

export interface DocumentoContratacion {
  id_documento: number;
  id_contratacion: number;
  tipo: TipoDocumentoContrato;
  archivo_pdf: string | null;
  fecha_subida: string;
  orden: number;
  created_at: string;
}

export interface DocumentoCreate {
  id_contratacion: number;
  tipo: TipoDocumentoContrato;
  archivo_pdf_base64?: string;
}

export const RUTA_DOCUMENTAL: { tipo: TipoDocumentoContrato; label: string }[] = [
  { tipo: 'invitacion', label: 'Carta de invitación' },
  { tipo: 'aceptacion', label: 'Carta de aceptación' },
  { tipo: 'solicitud', label: 'Solicitud a la universidad' },
  { tipo: 'contrato', label: 'Contrato firmado' },
];
