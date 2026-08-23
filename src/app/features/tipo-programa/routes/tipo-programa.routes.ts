import { Routes } from '@angular/router';
import { TipoProgramaListComponent } from '../pages/tipo-programa-list/tipo-programa-list';

export const TIPO_PROGRAMA_ROUTES: Routes = [
  {
    path: '',
    component: TipoProgramaListComponent,
  },
  {
    path: ':id/ruta-documental',
    loadComponent: () => import('../pages/ruta-documental/ruta-documental').then(m => m.RutaDocumentalComponent),
  },
];
