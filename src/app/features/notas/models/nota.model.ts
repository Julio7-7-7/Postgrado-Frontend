export interface NotaResponse {
  id_nota: number;
  id_detalle_programa_alumno: number;
  id_detalle_programa_modulo: number;
  modulo_nombre: string;
  modulo_orden: number;
  nota: number;
  tipo: string;
  fecha: string;
  observaciones: string | null;
  created_at: string;
  updated_at: string;
}

export interface NotaCreate {
  id_detalle_programa_alumno: number;
  id_detalle_programa_modulo: number;
  nota: number;
  tipo: string;
  fecha: string;
  observaciones?: string | null;
}

export interface NotaUpdate {
  nota?: number;
  tipo?: string;
  fecha?: string;
  observaciones?: string | null;
}

export interface AlumnoNotas {
  id_detalle_programa_alumno: number;
  alumno: {
    id_alumno: number;
    nombre: string;
    apellido: string;
    ci: string | null;
  } | null;
  notas: NotaResponse[];
  promedio: number;
}

export interface MisNotasResponse {
  notas: any[];
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
    notas: {
      id_nota: number;
      nota: number;
      tipo: string;
      fecha: string;
      observaciones: string | null;
      created_at: string;
      updated_at: string;
    }[];
    promedio: number;
  }[];
}

export interface HistorialTransferencia {
  id_historial: number;
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

export interface HistorialTransferenciasResponse {
  id_alumno: number;
  inscripciones: any[];
  transferencias: HistorialTransferencia[];
}
