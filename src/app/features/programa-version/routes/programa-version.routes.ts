import { Routes } from '@angular/router';
import { ProgramaVersionListComponent } from '../pages/programa-version-list/programa-version-list';
import { ProgramaVersionFormComponent } from '../pages/programa-version-form/programa-version-form';

export const PROGRAMA_VERSION_ROUTES: Routes = [
  { path: '', component: ProgramaVersionListComponent },
  { path: 'nuevo', component: ProgramaVersionFormComponent },
  { path: 'editar/:versionId', component: ProgramaVersionFormComponent },
  {
    path: ':versionId/modulos',
    loadChildren: () =>
      import('../../modulo/routes/modulo.routes').then(m => m.MODULO_ROUTES),
  },
];
