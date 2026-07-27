export interface NotaResponse {
  id_nota: number;
  id_detalle_programa_alumno: number;
  id_detalle_programa_modulo: number;
  id_programa_version_edicion: number | null;
  modulo_nombre: string;
  modulo_orden: number;
  nota: number;
  calificacion: string;
  fecha: string;
  created_at: string;
  updated_at: string;
}

export interface NotaItem {
  id_nota: number;
  nota: number;
  calificacion: string;
  fecha: string;
  created_at: string;
  updated_at: string;
}

export interface NotaCreate {
  id_detalle_programa_alumno: number;
  id_detalle_programa_modulo: number;
  nota: number;
  fecha: string;
}

export interface NotaUpdate {
  nota?: number;
  fecha?: string;
}

export interface AlumnoBasico {
  id_alumno: number;
  nombre: string;
  apellido: string;
  ci: string | null;
}

export interface NotaDialogData {
  idDetalle: number;
  alumno: AlumnoBasico | null;
  idEdicion: number;
  notaExistente?: NotaResponse;
}

export interface AlumnoNotas {
  id_detalle_programa_alumno: number;
  alumno: {
    id_alumno: number;
    nombre: string;
    apellido: string;
    ci: string | null;
  } | null;
  modulo_inicio: number;
  estado: string;
  notas: NotaResponse[];
  promedio: number;
}

export interface DocenteEdicionResumen {
  id_programa_version_edicion: number;
  edicion_numero: number;
  anio: number;
  semestre: number;
  programa_nombre: string;
  estado: string;
}

export interface DocenteModuloResumen {
  id_detalle_programa_modulo: number;
  nombre: string;
  sigla: string;
  orden: number;
  estado: string;
  fecha_inicio: string | null;
  fecha_fin: string | null;
  num_alumnos: number;
}

export interface DocenteAlumnoResumen {
  id_detalle_programa_alumno: number;
  alumno: {
    id_alumno: number;
    nombre: string;
    apellido: string;
    ci: string | null;
  } | null;
  modulo_inicio: number;
  estado: string;
  notas_count: number;
}

export interface DocenteEdicionCompleta {
  edicion: DocenteEdicionResumen;
  modulos: DocenteModuloResumen[];
  alumnos: DocenteAlumnoResumen[];
}

export interface DocenteModuloDetalle {
  modulo: {
    id_detalle_programa_modulo: number;
    nombre: string;
    sigla: string;
    orden: number;
    estado: string;
    fecha_inicio: string | null;
    fecha_fin: string | null;
  };
  edicion: DocenteEdicionResumen;
  alumnos: {
    id_detalle_programa_alumno: number;
    alumno: {
      id_alumno: number;
      nombre: string;
      apellido: string;
      ci: string | null;
    } | null;
    modulo_inicio: number;
    estado: string;
    notas: NotaItem[];
    promedio: number;
  }[];
}

export interface HistorialTransferencia {
  id_historial: number;
  tipo_movimiento: string;
  origen: {
    id_detalle_programa_alumno: number;
    edicion_numero: number;
    anio: number;
    semestre: number;
    programa_nombre: string;
    estado: string;
    modulo_inicio: number;
  };
  destino: {
    id_detalle_programa_alumno: number;
    edicion_numero: number;
    anio: number;
    semestre: number;
    programa_nombre: string;
    estado: string;
    modulo_inicio: number;
  };
  motivo: string;
  fecha: string;
}

export interface InscripcionBasica {
  id_detalle_programa_alumno: number;
  id_programa_version_edicion: number;
  edicion_numero: number;
  anio: number;
  semestre: number;
  programa_nombre: string;
  estado: string;
  modulo_inicio: number;
}

export interface HistorialTransferenciasResponse {
  id_alumno: number;
  inscripciones: InscripcionBasica[];
  transferencias: HistorialTransferencia[];
}
