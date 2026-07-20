import { Routes } from '@angular/router';
import { authGuard, permisoGuard } from '../../../core/guards/auth.guard';
import { AdminComponent } from '../pages/admin/admin';

export const ADMIN_ROUTES: Routes = [
  {
    path: '',
    component: AdminComponent,
    canActivate: [authGuard()],
    children: [
      {
        path: '',
        redirectTo: 'roles',
        pathMatch: 'full',
      },
      {
        path: 'roles',
        loadComponent: () =>
          import('../../roles/pages/roles-list/roles-list').then(m => m.RolesListComponent),
        canActivate: [permisoGuard('roles.gestionar')],
      },
      {
        path: 'usuarios',
        loadComponent: () =>
          import('../../usuarios/pages/usuarios-list/usuarios-list').then(m => m.UsuariosListComponent),
        canActivate: [permisoGuard('usuarios.gestionar')],
      },
      {
        path: 'requisitos',
        loadComponent: () =>
          import('../../requisitos/pages/requisitos-list/requisitos-list').then(m => m.RequisitosListComponent),
        canActivate: [permisoGuard('requisitos.ver')],
      },
      {
        path: 'modalidades',
        loadComponent: () =>
          import('../../modalidad/pages/modalidad-list/modalidad-list').then(m => m.ModalidadListComponent),
        canActivate: [permisoGuard('modalidades_academicas.ver')],
      },
      {
        path: 'descuentos',
        loadComponent: () =>
          import('../../tipo-descuento/pages/tipo-descuento-list/tipo-descuento-list').then(m => m.TipoDescuentoListComponent),
        canActivate: [permisoGuard('tipos_descuento.ver')],
      },
      {
        path: 'alumnos',
        loadComponent: () =>
          import('../../alumnos-admin/pages/alumnos-admin-list/alumnos-admin-list').then(m => m.AlumnosAdminListComponent),
        canActivate: [permisoGuard('alumnos.ver')],
      },
      {
        path: 'documentacion',
        loadChildren: () =>
          import('../../documentacion/routes/documentacion.routes').then(m => m.DOCUMENTACION_ROUTES),
        canActivate: [permisoGuard('documentos.revisar')],
      },
      {
        path: 'inscripciones',
        loadChildren: () =>
          import('../../inscripciones/routes/inscripciones.routes').then(m => m.INSCRIPCIONES_ROUTES),
        canActivate: [permisoGuard('alumnos.ver')],
      },
      {
        path: 'pagos',
        loadChildren: () =>
          import('../../pagos/routes/pagos.routes').then(m => m.PAGOS_ROUTES),
        canActivate: [permisoGuard('pagos.ver')],
      },
      {
        path: 'notas',
        loadChildren: () =>
          import('../../notas/routes/notas.routes').then(m => m.NOTAS_ROUTES),
        canActivate: [permisoGuard('notas.ver')],
      },
      {
        path: 'transcript/:idAlumno',
        loadComponent: () =>
          import('../../transcript/pages/transcript/transcript').then(m => m.TranscriptComponent),
        canActivate: [permisoGuard('alumnos.ver')],
      },
    ],
  },
];
