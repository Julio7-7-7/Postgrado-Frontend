import { Routes } from '@angular/router';

export const NOTAS_ROUTES: Routes = [
  {
    path: '',
    loadComponent: () =>
      import('../pages/notas-admin/notas-admin').then(m => m.NotasAdminComponent),
  },
  {
    path: ':idEdicion',
    loadComponent: () =>
      import('../pages/notas-edicion/notas-edicion').then(m => m.NotasEdicionComponent),
  },
];
