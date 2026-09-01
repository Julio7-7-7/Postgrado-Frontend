import { Routes } from '@angular/router';
import { permisoGuard } from '../../../core/guards/auth.guard';

export const BACKUPS_ROUTES: Routes = [
  {
    path: '',
    loadComponent: () => import('../pages/backups/backups').then(m => m.BackupsComponent),
    canActivate: [permisoGuard('backups.ver')],
  },
];
