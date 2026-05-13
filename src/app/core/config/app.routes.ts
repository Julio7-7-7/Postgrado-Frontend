import { Routes } from '@angular/router';

export const routes: Routes = [
  {
    path: 'tipos-programa',
    loadChildren: () =>
      import('../../features/tipo-programa/routes/tipo-programa.routes') .then(m => m.TIPO_PROGRAMA_ROUTES)
  },
  // Redirección por defecto: si la URL está vacía, nos manda a tipos-programa
  { path: '', redirectTo: 'tipos-programa', pathMatch: 'full' },
  // Si escriben cualquier otra cosa que no existe, también los mandamos a la lista
  { path: '**', redirectTo: 'tipos-programa' }
];