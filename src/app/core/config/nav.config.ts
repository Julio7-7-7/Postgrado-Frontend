export type NavModule = 'inicio' | 'programas' | 'docentes' | 'docente' | 'estudiantes' | 'notas' | 'pagos' | 'sistema' | 'oferta';

export interface NavItem {
  path: string;
  label: string;
  icon: string;
  feature: string;
  permiso: string;
  exact?: boolean;
  kind?: 'component' | 'children';
  load?: () => Promise<any>;
  build?: boolean;
}

export interface NavModuleGroup {
  key: NavModule;
  label: string;
  icon: string;
  permiso: string;
  items: NavItem[];
}

export const NAV_MODULES: NavModuleGroup[] = [
  {
    key: 'inicio',
    label: 'Inicio',
    icon: 'home',
    permiso: 'dashboard.ver',
    items: [
      {
        path: '/dashboard',
        label: 'Dashboard',
        icon: 'space_dashboard',
        feature: 'home',
        permiso: 'dashboard.ver',
        exact: true,
        build: false,
      },
    ],
  },
  {
    key: 'programas',
    label: 'Programas',
    icon: 'school',
    permiso: 'programas.ver',
    items: [
      {
        path: '/programas',
        label: 'Programas',
        icon: 'school',
        feature: 'programas',
        permiso: 'programas.ver',
        kind: 'children',
        load: () => import('../../features/programa/routes/programa.routes').then(m => m.PROGRAMA_ROUTES),
      },
      {
        path: '/tipos-programa',
        label: 'Tipos de Programa',
        icon: 'category',
        feature: 'tipos-programa',
        permiso: 'tipos_programa.ver',
        kind: 'children',
        load: () => import('../../features/tipo-programa/routes/tipo-programa.routes').then(m => m.TIPO_PROGRAMA_ROUTES),
      },
      {
        path: '/requisitos',
        label: 'Requisitos',
        icon: 'checklist',
        feature: 'requisitos',
        permiso: 'requisitos.ver',
        build: false,
      },
      {
        path: '/modalidades',
        label: 'Modalidades',
        icon: 'account_balance',
        feature: 'modalidades',
        permiso: 'modalidades_academicas.ver',
        build: false,
      },
      {
        path: '/descuentos',
        label: 'Descuentos',
        icon: 'local_offer',
        feature: 'descuentos',
        permiso: 'tipos_descuento.ver',
        kind: 'component',
        load: () => import('../../features/tipo-descuento/pages/tipo-descuento-list/tipo-descuento-list').then(m => m.TipoDescuentoListComponent),
      },
    ],
  },
  {
    key: 'docentes',
    label: 'Docentes',
    icon: 'badge',
    permiso: 'docentes.ver',
    items: [
      {
        path: '/docentes',
        label: 'Docentes',
        icon: 'badge',
        feature: 'docente',
        permiso: 'docentes.ver',
        kind: 'children',
        load: () => import('../../features/docente/routes/docente.routes').then(m => m.DOCENTE_ROUTES),
      },
      {
        path: '/contrataciones',
        label: 'Contrataciones',
        icon: 'assignment',
        feature: 'contratacion',
        permiso: 'contrataciones.ver',
        kind: 'children',
        load: () => import('../../features/contratacion/routes/contratacion.routes').then(m => m.CONTRATACION_ROUTES),
      },
    ],
  },
  {
    key: 'estudiantes',
    label: 'Estudiantes',
    icon: 'people',
    permiso: 'alumnos.ver',
    items: [
      {
        path: '/estudiantes',
        label: 'Alumnos',
        icon: 'people',
        feature: 'alumno',
        permiso: 'alumnos.ver',
        kind: 'component',
        load: () => import('../../features/alumnos-admin/pages/alumnos-admin-list/alumnos-admin-list').then(m => m.AlumnosAdminListComponent),
      },
      {
        path: '/inscripciones',
        label: 'Inscripciones',
        icon: 'how_to_reg',
        feature: 'inscripciones',
        permiso: 'alumnos.ver',
        kind: 'children',
        load: () => import('../../features/inscripciones/routes/inscripciones.routes').then(m => m.INSCRIPCIONES_ROUTES),
      },
      {
        path: '/solicitudes',
        label: 'Solicitudes',
        icon: 'swap_horiz',
        feature: 'solicitudes',
        permiso: 'alumnos.ver',
        kind: 'component',
        load: () => import('../../features/inscripciones/pages/solicitudes-incorporacion/solicitudes-incorporacion').then(m => m.SolicitudesIncorporacionComponent),
      },
      {
        path: '/documentacion',
        label: 'Documentación',
        icon: 'description',
        feature: 'documentacion',
        permiso: 'documentos.revisar',
        kind: 'children',
        load: () => import('../../features/documentacion/routes/documentacion.routes').then(m => m.DOCUMENTACION_ROUTES),
      },
    ],
  },
  {
    key: 'notas',
    label: 'Notas',
    icon: 'grading',
    permiso: 'notas.ver',
    items: [
      {
        path: '/notas',
        label: 'Notas',
        icon: 'grading',
        feature: 'notas',
        permiso: 'notas.ver',
        kind: 'children',
        load: () => import('../../features/notas/routes/notas.routes').then(m => m.NOTAS_ROUTES),
      },
    ],
  },
  {
    key: 'pagos',
    label: 'Pagos',
    icon: 'payments',
    permiso: 'pagos.ver',
    items: [
      {
        path: '/pagos',
        label: 'Pagos',
        icon: 'payments',
        feature: 'pagos',
        permiso: 'pagos.ver',
        kind: 'children',
        load: () => import('../../features/pagos/routes/pagos.routes').then(m => m.PAGOS_ROUTES),
      },
    ],
  },
  {
    key: 'sistema',
    label: 'Sistema',
    icon: 'settings',
    permiso: 'roles.gestionar',
    items: [
      {
        path: '/roles',
        label: 'Roles',
        icon: 'shield',
        feature: 'roles',
        permiso: 'roles.gestionar',
        kind: 'component',
        load: () => import('../../features/roles/pages/roles-list/roles-list').then(m => m.RolesListComponent),
      },
      {
        path: '/usuarios',
        label: 'Usuarios',
        icon: 'group',
        feature: 'usuarios',
        permiso: 'usuarios.gestionar',
        kind: 'component',
        load: () => import('../../features/usuarios/pages/usuarios-list/usuarios-list').then(m => m.UsuariosListComponent),
      },
      {
        path: '/personas',
        label: 'Personas',
        icon: 'people_alt',
        feature: 'personas',
        permiso: 'usuarios.gestionar',
        kind: 'children',
        load: () => import('../../features/persona/routes/persona.routes').then(m => m.PERSONA_ROUTES),
      },
    ],
  },
];

export const NAV_ITEMS = NAV_MODULES.flatMap(m => m.items);
