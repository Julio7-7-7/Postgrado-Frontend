import { Routes } from '@angular/router';
import { ContratacionListComponent } from '../pages/contratacion-list/contratacion-list';
import { ContratacionCreateComponent } from '../pages/contratacion-create/contratacion-create';
import { ContratacionDetalleComponent } from '../pages/contratacion-detalle/contratacion-detalle';

export const CONTRATACION_ROUTES: Routes = [
  {
    path: '',
    component: ContratacionListComponent,
  },
  {
    path: 'nuevo',
    component: ContratacionCreateComponent,
  },
  {
    path: ':id',
    component: ContratacionDetalleComponent,
  },
];
