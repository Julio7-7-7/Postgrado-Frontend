import { Routes } from '@angular/router';
import { ProgramaListComponent } from '../pages/programa-list/programa-list';
import { ProgramaFormComponent } from '../pages/programa-form/programa-form';

export const PROGRAMA_ROUTES: Routes = [
  { path: '', component: ProgramaListComponent },
  { path: 'nuevo', component: ProgramaFormComponent },
  { path: 'editar/:id', component: ProgramaFormComponent },
];
