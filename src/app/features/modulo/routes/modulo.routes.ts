import { Routes } from '@angular/router';

export const MODULO_ROUTES: Routes = [
  {
    path: '',
    loadComponent: () =>
      import('../pages/modulo-list/modulo-list').then(m => m.ModuloListComponent),
  },
  {
    path: 'nuevo',
    loadComponent: () =>
      import('../pages/modulo-form/modulo-form').then(m => m.ModuloFormComponent),
  },
  {
    path: 'editar/:moduloId',
    loadComponent: () =>
      import('../pages/modulo-form/modulo-form').then(m => m.ModuloFormComponent),
  },
];
