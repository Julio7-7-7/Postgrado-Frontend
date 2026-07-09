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
    ],
  },
];
