import { Routes } from '@angular/router';
import { DocenteListComponent } from '../pages/docente-list/docente-list';
import { DocenteFormComponent } from '../pages/docente-form/docente-form';
import { DocenteDetalleComponent } from '../pages/docente-detalle/docente-detalle';

export const DOCENTE_ROUTES: Routes = [
  {
    path: '',
    component: DocenteListComponent
  },
  {
    path: 'nuevo',
    component: DocenteFormComponent
  },
  {
    path: 'editar/:id',
    component: DocenteFormComponent
  },
  {
    path: ':id',
    component: DocenteDetalleComponent
  },
];
