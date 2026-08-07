import { Routes } from '@angular/router';
import { permisoGuard } from '../../../core/guards/auth.guard';

export const REQUISITOS_ROUTES: Routes = [
  {
    path: '',
    loadComponent: () =>
      import('../pages/requisitos-list/requisitos-list').then(m => m.RequisitosListComponent),
    canActivate: [permisoGuard('requisitos.ver')],
  },
  {
    path: ':id',
    loadComponent: () =>
      import('../pages/requisito-detail/requisito-detail').then(m => m.RequisitoDetailComponent),
  },
];
