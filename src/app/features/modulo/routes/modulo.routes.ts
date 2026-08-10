import { Routes } from '@angular/router';

export const MODULO_ROUTES: Routes = [
  {
    path: '',
    loadComponent: () =>
      import('../pages/modulo-list/modulo-list').then(m => m.ModuloListComponent),
  },
  {
    path: 'masiva',
    loadComponent: () =>
      import('../pages/modulo-batch/modulo-batch').then(m => m.ModuloBatchComponent),
  },
];
