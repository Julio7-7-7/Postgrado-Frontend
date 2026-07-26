import type { Alumno } from './alumno.model';
import type { ModalidadAcademica } from './modalidad-academica.model';
import type { ProgramaVersionEdicion } from '../../edicion/models/edicion.model';
import type { TipoDescuento } from './tipo-descuento.model';

export type EstadoDetalleAlumno =
  | 'postulante' | 'observado' | 'inscrito' | 'incorporado'
  | 'finalizado' | 'graduado' | 'retirado';

export interface ControlDocumentacionAlumno {
  id_control_documentacion: number;
  id_requisito: number;
  id_detalle_programa_alumno: number;
  url_documento: string | null;
  obligatorio: boolean;
  estado: string;
  fecha_entrega: string | null;
  fecha_revision: string | null;
  observaciones: string | null;
  requisito: {
    id_requisito: number;
    nombre: string;
    descripcion: string | null;
    imagen_url: string | null;
    estado: string;
  };
  created_at: string;
  updated_at: string;
}

export interface DetalleProgramaAlumno {
  id_detalle_programa_alumno: number;
  id_programa_version_edicion: number;
  id_alumno: number;
  id_modalidad_academica: number;
  id_tipo_descuento: number | null;
  descuento_aplicado: number;
  estado: EstadoDetalleAlumno;
  modulo_inicio: number;
  es_incorporacion: boolean;
  fecha_inscripcion: string | null;
  alumno: Alumno;
  modalidad_academica: ModalidadAcademica;
  programa_version_edicion: ProgramaVersionEdicion;
  tipo_descuento: TipoDescuento | null;
  control_documentacion: ControlDocumentacionAlumno[];
  created_at: string;
  updated_at: string;
}

export interface AutoInscribirRequest {
  id_programa_version_edicion: number;
  id_modalidad_academica: number;
  id_tipo_descuento?: number | null;
  modulo_inicio?: number;
}
