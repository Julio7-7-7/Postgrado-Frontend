import { Routes } from '@angular/router';

export const REQUISITOS_ROUTES: Routes = [
  {
    path: '',
    loadComponent: () =>
      import('../pages/requisitos-list/requisitos-list').then(m => m.RequisitosListComponent),
  },
  {
    path: ':id',
    loadComponent: () =>
      import('../pages/requisito-detail/requisito-detail').then(m => m.RequisitoDetailComponent),
  },
];
