export interface DocumentoContratacion {
  id_documento: number;
  id_contratacion: number;
  tipo: string;
  archivo_pdf: string | null;
  fecha_subida: string;
  orden: number;
  created_at: string;
}

export interface DocumentoCreate {
  id_contratacion: number;
  tipo: string;
  archivo_pdf_base64?: string;
}

export interface DocumentoInfo {
  tipo: string;
  label: string;
}

export interface EtapaDocumental {
  nombre: string;
  label: string;
  documentos: DocumentoInfo[];
}

export const ETAPAS_DOCUMENTALES: EtapaDocumental[] = [
  {
    nombre: 'presupuesto',
    label: 'Verificación Presupuestaria',
    documentos: [
      { tipo: 'solicitud_verificacion_saldos', label: 'Solicitud de verificación de saldos presupuestarios para contratación de consultor de postgrado' },
      { tipo: 'remision_saldo', label: 'Remisión de saldo presupuestario' },
      { tipo: 'resolucion_dg_verificacion', label: 'Resolución de Dirección General de Postgrado' },
    ],
  },
  {
    nombre: 'convocatoria',
    label: 'Convocatoria',
    documentos: [
      { tipo: 'terminos_referencia', label: 'Términos de referencia' },
      { tipo: 'solicitud_contratacion_consultor', label: 'Solicitud de contratación de consultor por producto para postgrado' },
      { tipo: 'acta_inicio_proceso', label: 'Acta de inicio de proceso de contratación' },
    ],
  },
  {
    nombre: 'seleccion',
    label: 'Selección',
    documentos: [
      { tipo: 'seleccion_docente', label: 'Selección docente para contratación modalidad consultoría por producto' },
      { tipo: 'invitacion_dictar_modulo', label: 'Invitación a dictar módulo' },
      { tipo: 'respuesta_invitacion', label: 'Respuesta a invitación a dictar módulo' },
    ],
  },
  {
    nombre: 'resolucion',
    label: 'Resolución Académica',
    documentos: [
      { tipo: 'resolucion_comite_academico', label: 'Resolución de Comité Académico Científico' },
      { tipo: 'resolucion_consejo_directivo', label: 'Resolución del Consejo Directivo de Postgrado' },
      { tipo: 'resolucion_dg_designacion', label: 'Resolución de Dirección General de Postgrado de designación de docente' },
    ],
  },
  {
    nombre: 'legal',
    label: 'Gestión Legal y Administrativa',
    documentos: [
      { tipo: 'solicitud_antecedentes', label: 'Solicitud de emisión de formulario de antecedentes laborales para educador postgradual' },
      { tipo: 'formulario_antecedentes', label: 'Formulario de antecedentes laborales' },
      { tipo: 'remision_proceso_contratacion', label: 'Remisión de proceso de contratación consultor para postgrado' },
      { tipo: 'formulario_notarial', label: 'Formulario notarial' },
      { tipo: 'informe_tecnico_recomendacion', label: 'Informe técnico de recomendación para la contratación de consultoría por producto' },
      { tipo: 'resolucion_administrativa', label: 'Resolución administrativa' },
      { tipo: 'informe_legal', label: 'Informe legal' },
    ],
  },
  {
    nombre: 'contrato',
    label: 'Contrato',
    documentos: [
      { tipo: 'contrato', label: 'Contrato administrativo de prestación de servicios profesionales de consultoría por producto' },
    ],
  },
];

/** Versión plana para compatibilidad con el backend (orden secuencial) */
export const RUTA_DOCUMENTAL = ETAPAS_DOCUMENTALES.flatMap(e => e.documentos.map(d => d.tipo));
