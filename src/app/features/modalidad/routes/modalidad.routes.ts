import { Routes } from '@angular/router';

export const MODALIDAD_ROUTES: Routes = [
  {
    path: ':id',
    loadComponent: () =>
      import('../pages/modalidad-detail/modalidad-detail').then(m => m.ModalidadDetailComponent),
  },
];
