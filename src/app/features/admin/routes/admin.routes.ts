import { Routes } from '@angular/router';
import { authGuard, permisoGuard } from '../../../core/guards/auth.guard';
import { AdminComponent } from '../pages/admin';

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
          import('../pages/roles-list').then(m => m.RolesListComponent),
        canActivate: [permisoGuard('roles.gestionar')],
      },
      {
        path: 'usuarios',
        loadComponent: () =>
          import('../pages/usuarios-list').then(m => m.UsuariosListComponent),
        canActivate: [permisoGuard('usuarios.gestionar')],
      },
      {
        path: 'modalidades',
        loadComponent: () =>
          import('../pages/modalidad-list').then(m => m.ModalidadListComponent),
        canActivate: [permisoGuard('modalidades_academicas.ver')],
      },
      {
        path: 'descuentos',
        loadComponent: () =>
          import('../pages/tipo-descuento-list').then(m => m.TipoDescuentoListComponent),
        canActivate: [permisoGuard('tipos_descuento.ver')],
      },
      {
        path: 'documentacion',
        loadComponent: () =>
          import('../pages/documentacion').then(m => m.DocumentacionComponent),
        canActivate: [permisoGuard('control_documentacion.ver')],
      },
    ],
  },
];
