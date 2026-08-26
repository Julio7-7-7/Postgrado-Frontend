import { Routes } from '@angular/router';
import { authGuard } from '../../../core/guards/auth.guard';
import { AlumnoPortalComponent } from '../pages/alumno-portal/alumno-portal';

export const ALUMNO_ROUTES: Routes = [
  {
    path: '',
    component: AlumnoPortalComponent,
    canActivate: [authGuard()],
    children: [
      {
        path: '',
        redirectTo: 'perfil',
        pathMatch: 'full',
      },
      {
        path: 'perfil',
        loadComponent: () =>
          import('../pages/perfil/perfil').then(m => m.PerfilComponent),
      },
      {
        path: 'inscripciones',
        loadComponent: () =>
          import('../pages/inscripciones/inscripciones').then(m => m.InscripcionesComponent),
      },
      {
        path: 'inscripciones/:id',
        loadComponent: () =>
          import('../pages/inscripcion-detail/inscripcion-detail').then(m => m.InscripcionDetailComponent),
      },
      {
        path: 'inscribir/:id',
        loadComponent: () =>
          import('../pages/inscribir/inscribir').then(m => m.InscribirComponent),
      },
    ],
  },
];
