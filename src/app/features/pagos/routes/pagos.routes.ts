import { Routes } from '@angular/router';

export const PAGOS_ROUTES: Routes = [
  {
    path: '',
    loadComponent: () =>
      import('../pages/pagos-admin/pagos-admin').then(m => m.PagosAdminComponent),
  },
  {
    path: ':idEdicion',
    loadComponent: () =>
      import('../pages/pagos-edicion/pagos-edicion').then(m => m.PagosEdicionComponent),
  },
];
