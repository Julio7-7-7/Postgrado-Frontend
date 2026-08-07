export type NavGroup = 'inicio' | 'catalogos' | 'docentes' | 'estudiantes' | 'sistema';

export interface NavItem {
  path: string;
  label: string;
  icon: string;
  feature: string;
  permiso: string;
  group?: NavGroup;
  exact?: boolean;
  kind?: 'component' | 'children';
  load?: () => Promise<any>;
  build?: boolean;
}

export const NAV_GROUP_LABELS: Record<NavGroup, string> = {
  inicio: 'Inicio',
  catalogos: 'Catálogos',
  docentes: 'Docentes',
  estudiantes: 'Estudiantes',
  sistema: 'Sistema',
};

export const NAV_ITEMS: NavItem[] = [
  {
    path: '/dashboard',
    label: 'Inicio',
    icon: 'home',
    feature: 'home',
    permiso: 'dashboard.ver',
    group: 'inicio',
    exact: true,
    build: false,
  },
  {
    path: '/programas',
    label: 'Programas',
    icon: 'school',
    feature: 'programas',
    permiso: 'programas.ver',
    group: 'catalogos',
    kind: 'children',
    load: () => import('../../features/programa/routes/programa.routes').then(m => m.PROGRAMA_ROUTES),
  },
  {
    path: '/tipos-programa',
    label: 'Tipos',
    icon: 'category',
    feature: 'tipos-programa',
    permiso: 'tipos_programa.ver',
    group: 'catalogos',
    kind: 'children',
    load: () => import('../../features/tipo-programa/routes/tipo-programa.routes').then(m => m.TIPO_PROGRAMA_ROUTES),
  },
  {
    path: '/requisitos',
    label: 'Requisitos',
    icon: 'checklist',
    feature: 'requisitos',
    permiso: 'requisitos.ver',
    group: 'catalogos',
    build: false,
  },
  {
    path: '/modalidades',
    label: 'Modalidades',
    icon: 'account_balance',
    feature: 'modalidades',
    permiso: 'modalidades_academicas.ver',
    group: 'catalogos',
    build: false,
  },
  {
    path: '/descuentos',
    label: 'Descuentos',
    icon: 'local_offer',
    feature: 'descuentos',
    permiso: 'tipos_descuento.ver',
    group: 'catalogos',
    kind: 'component',
    load: () => import('../../features/tipo-descuento/pages/tipo-descuento-list/tipo-descuento-list').then(m => m.TipoDescuentoListComponent),
  },
  {
    path: '/docentes',
    label: 'Docentes',
    icon: 'badge',
    feature: 'docente',
    permiso: 'docentes.ver',
    group: 'docentes',
    kind: 'children',
    load: () => import('../../features/docente/routes/docente.routes').then(m => m.DOCENTE_ROUTES),
  },
  {
    path: '/contrataciones',
    label: 'Contrataciones',
    icon: 'assignment',
    feature: 'contratacion',
    permiso: 'contrataciones.ver',
    group: 'docentes',
    kind: 'children',
    load: () => import('../../features/contratacion/routes/contratacion.routes').then(m => m.CONTRATACION_ROUTES),
  },
  {
    path: '/estudiantes',
    label: 'Alumnos',
    icon: 'people',
    feature: 'alumno',
    permiso: 'alumnos.ver',
    group: 'estudiantes',
    kind: 'component',
    load: () => import('../../features/alumnos-admin/pages/alumnos-admin-list/alumnos-admin-list').then(m => m.AlumnosAdminListComponent),
  },
  {
    path: '/documentacion',
    label: 'Documentación',
    icon: 'description',
    feature: 'documentacion',
    permiso: 'documentos.revisar',
    group: 'estudiantes',
    kind: 'children',
    load: () => import('../../features/documentacion/routes/documentacion.routes').then(m => m.DOCUMENTACION_ROUTES),
  },
  {
    path: '/inscripciones',
    label: 'Inscripciones',
    icon: 'how_to_reg',
    feature: 'inscripciones',
    permiso: 'alumnos.ver',
    group: 'estudiantes',
    kind: 'children',
    load: () => import('../../features/inscripciones/routes/inscripciones.routes').then(m => m.INSCRIPCIONES_ROUTES),
  },
  {
    path: '/pagos',
    label: 'Pagos',
    icon: 'payments',
    feature: 'pagos',
    permiso: 'pagos.ver',
    group: 'estudiantes',
    kind: 'children',
    load: () => import('../../features/pagos/routes/pagos.routes').then(m => m.PAGOS_ROUTES),
  },
  {
    path: '/notas',
    label: 'Notas',
    icon: 'grading',
    feature: 'notas',
    permiso: 'notas.ver',
    group: 'estudiantes',
    kind: 'children',
    load: () => import('../../features/notas/routes/notas.routes').then(m => m.NOTAS_ROUTES),
  },
  {
    path: '/solicitudes',
    label: 'Solicitudes',
    icon: 'swap_horiz',
    feature: 'solicitudes',
    permiso: 'alumnos.ver',
    group: 'estudiantes',
    kind: 'component',
    load: () => import('../../features/inscripciones/pages/solicitudes-incorporacion/solicitudes-incorporacion').then(m => m.SolicitudesIncorporacionComponent),
  },
  {
    path: '/roles',
    label: 'Roles',
    icon: 'shield',
    feature: 'roles',
    permiso: 'roles.gestionar',
    group: 'sistema',
    kind: 'component',
    load: () => import('../../features/roles/pages/roles-list/roles-list').then(m => m.RolesListComponent),
  },
  {
    path: '/usuarios',
    label: 'Usuarios',
    icon: 'group',
    feature: 'usuarios',
    permiso: 'usuarios.gestionar',
    group: 'sistema',
    kind: 'component',
    load: () => import('../../features/usuarios/pages/usuarios-list/usuarios-list').then(m => m.UsuariosListComponent),
  },
];
