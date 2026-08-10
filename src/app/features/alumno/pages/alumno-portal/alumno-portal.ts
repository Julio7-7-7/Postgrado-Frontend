import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';

@Component({
  selector: 'app-alumno-portal',
  standalone: true,
  imports: [
    RouterOutlet, MatIconModule,
  ],
  template: `
    <div class="portal-shell">
      <div class="portal-header">
        <h1><mat-icon>person</mat-icon> Portal del Estudiante</h1>
      </div>
      <router-outlet />
    </div>
  `,
  styles: [`
    .portal-shell { padding: 24px; width: 90%; max-width: 1560px; margin: 0 auto; }
    .portal-header { margin-bottom: 24px; }
    .portal-header h1 { margin: 0; font-size: 1.5rem; display: flex; align-items: center; gap: 8px; }
  `],
})
export class AlumnoPortalComponent {}
