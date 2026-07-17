import type { Alumno } from './alumno.model';
import type { ModalidadAcademica } from './modalidad-academica.model';
import type { ProgramaVersionEdicion } from '../../edicion/models/edicion.model';
import type { TipoDescuento } from './tipo-descuento.model';

export type EstadoDetalleAlumno =
  | 'postulante' | 'inscrito' | 'en_curso' | 'finalizado'
  | 'graduado' | 'titulado' | 'retirado' | 'observado';

export interface DetalleProgramaAlumno {
  id_detalle_programa_alumno: number;
  id_programa_version_edicion: number;
  id_alumno: number;
  id_modalidad_academica: number;
  id_tipo_descuento: number | null;
  descuento_aplicado: number;
  estado: EstadoDetalleAlumno;
  fecha_inscripcion: string | null;
  alumno: Alumno;
  modalidad_academica: ModalidadAcademica;
  programa_version_edicion: ProgramaVersionEdicion;
  tipo_descuento: TipoDescuento | null;
  created_at: string;
  updated_at: string;
}

export interface AutoInscribirRequest {
  id_programa_version_edicion: number;
  id_modalidad_academica: number;
  id_tipo_descuento?: number | null;
}
