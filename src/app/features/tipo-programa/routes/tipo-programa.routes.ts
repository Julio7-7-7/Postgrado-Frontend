import { Routes } from '@angular/router';
import { TipoProgramaListComponent } from '../pages/tipo-programa-list/tipo-programa-list';
import { TipoProgramaFormComponent } from '../pages/tipo-programa-form/tipo-programa-form';

export const TIPO_PROGRAMA_ROUTES: Routes = [
  { 
    path: '', 
    component: TipoProgramaListComponent 
  },
  { 
    path: 'nuevo', 
    component: TipoProgramaFormComponent 
  },
  { 
    path: 'editar/:id', 
    component: TipoProgramaFormComponent 
  },
];