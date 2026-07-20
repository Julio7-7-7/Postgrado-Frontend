import { Routes } from '@angular/router';

export const INSCRIPCIONES_ROUTES: Routes = [
  {
    path: '',
    loadComponent: () =>
      import('../pages/inscripciones-landing/inscripcion-landing').then(m => m.InscripcionesLandingComponent),
  },
  {
    path: ':idEdicion',
    loadComponent: () =>
      import('../pages/inscripciones-edicion/inscripcion-edicion').then(m => m.InscripcionesEdicionComponent),
  },
];
