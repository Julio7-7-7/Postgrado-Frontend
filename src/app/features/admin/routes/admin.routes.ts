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
        path: 'documentacion',
        loadComponent: () =>
          import('../../documentacion/pages/documentacion/documentacion').then(m => m.DocumentacionComponent),
        canActivate: [permisoGuard('control_documentacion.ver')],
      },
    ],
  },
];
