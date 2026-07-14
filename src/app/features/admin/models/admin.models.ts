export interface PermisoResponse {
  id_permiso: number;
  codigo: string;
  descripcion: string | null;
}

export interface RolResponse {
  id_rol: number;
  nombre: string;
  descripcion: string | null;
  created_at: string;
  updated_at: string;
  permisos: PermisoResponse[];
}

export interface RolCreate {
  nombre: string;
  descripcion?: string | null;
  permisos: number[];
}

export interface RolUpdate {
  nombre?: string;
  descripcion?: string | null;
  permisos?: number[];
}

export interface ProfileInfo {
  type: string;
  id: number;
  nombre: string;
}

export interface UserAdminResponse {
  id_usuario: number;
  email: string;
  activo: boolean;
  roles: string[];
  id_roles: number[];
  perfiles: ProfileInfo[];
  created_at: string;
}

export interface UserAdminCreate {
  email: string;
  password: string;
  roles: number[];
  ci: string;
  nombre: string;
  apellido: string;
  celular?: string | null;
}

export interface UserAdminUpdate {
  email?: string | null;
  password?: string | null;
  ci?: string | null;
  nombre?: string | null;
  apellido?: string | null;
  celular?: string | null;
  cargo?: string | null;
}

export interface UserUpdateRoles {
  roles: number[];
}

export interface PaginatedUsersResponse {
  items: UserAdminResponse[];
  total: number;
  page: number;
  per_page: number;
  pages: number;
}

export interface ModalidadAcademicaCreate {
  nombre_modalidad: string;
  descripcion?: string | null;
  requiere_titulo?: boolean;
  uso_unico?: boolean;
}

export interface ModalidadAcademicaUpdate {
  nombre_modalidad?: string;
  descripcion?: string | null;
  requiere_titulo?: boolean;
  uso_unico?: boolean;
  estado?: string;
}

export interface RequisitoCreate {
  id_modalidad_academica: number | null;
  nombre: string;
  descripcion?: string | null;
  obligatorio?: boolean;
}

export interface RequisitoUpdate {
  id_modalidad_academica?: number | null;
  nombre?: string;
  descripcion?: string | null;
  obligatorio?: boolean;
  estado?: string;
}

export interface TipoDescuentoUpdate {
  nombre?: string;
  porcentaje?: number;
  descripcion?: string | null;
  estado?: string;
  modalidades?: number[];
  requisitos?: number[];
}

export interface ModalidadAcademicaResponse {
  id_modalidad_academica: number;
  nombre_modalidad: string;
  descripcion: string | null;
  requiere_titulo: boolean;
  estado: string;
  created_at: string;
  updated_at: string;
}

export interface RequisitoResponse {
  id_requisito: number;
  id_modalidad_academica: number | null;
  nombre: string;
  descripcion: string | null;
  obligatorio: boolean;
  estado: string;
  modalidad_academica: ModalidadAcademicaResponse | null;
  created_at: string;
  updated_at: string;
}

export interface TipoDescuentoResponse {
  id_tipo_descuento: number;
  nombre: string;
  porcentaje: number;
  descripcion: string | null;
  uso_unico: boolean;
  estado: string;
  modalidades: ModalidadAcademicaResponse[];
  requisitos: RequisitoResponse[];
  created_at: string;
  updated_at: string;
}

export interface TipoDescuentoCreate {
  nombre: string;
  porcentaje: number;
  descripcion?: string | null;
  modalidades: number[];
  requisitos: number[];
}

export interface ControlDocumentacionResponse {
  id_control_documentacion: number;
  id_requisito: number;
  estado: string;
  obligatorio: boolean;
  url_documento: string | null;
  fecha_entrega: string | null;
  fecha_revision: string | null;
  observaciones: string | null;
}

export interface ControlDocumentacionUpdate {
  estado?: string;
  url_documento?: string | null;
  observaciones?: string | null;
}

export interface PostulanteResponse {
  id_detalle_programa_alumno: number;
  estado: string;
  fecha_inscripcion: string | null;
  descuento_aplicado: number;
  alumno: {
    id_alumno: number;
    nombre: string;
    apellido: string;
    ci: string | null;
    correo: string | null;
  } | null;
  control_documentacion: ControlDocumentacionResponse[];
  docs_completados: number;
  docs_total: number;
}

export interface TipoProgramaResponse {
  id_tipo_programa: number;
  nombre: string;
  estado: string;
  cupo_minimo: number | null;
  duracion_minima_meses: number | null;
  modalidades: ModalidadAcademicaResponse[];
  created_at: string;
  updated_at: string;
}

export interface ProgramaResponse {
  id_programa: number;
  nombre_programa: string;
  tipo_programa: TipoProgramaResponse;
}

export interface ProgramaVersionResponse {
  id_programa_version: number;
  version: number;
  programa: ProgramaResponse;
}

export interface ProgramaVersionEdicionResponse {
  id_programa_version_edicion: number;
  edicion: number;
  semestre: number | null;
  anio: number | null;
  estado: string;
  modalidad: string;
  precio: number | null;
  programa_version: ProgramaVersionResponse;
  created_at: string;
}
