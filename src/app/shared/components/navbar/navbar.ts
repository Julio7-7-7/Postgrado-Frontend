import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink, RouterLinkActive, Router } from '@angular/router';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatMenuModule } from '@angular/material/menu';
import { MatDividerModule } from '@angular/material/divider';
import { MatTooltipModule } from '@angular/material/tooltip';

@Component({
  selector: 'app-navbar',
  standalone: true,
  imports: [
    CommonModule, RouterLink, RouterLinkActive,
    MatToolbarModule, MatButtonModule, MatIconModule, MatMenuModule, MatDividerModule, MatTooltipModule,
  ],
  templateUrl: './navbar.html',
  styleUrl: './navbar.css',
})
export class NavbarComponent {
  router = inject(Router);

  navItems: { path: string; label: string; icon: string; exact?: boolean; feature: string }[] = [
    { path: '/', label: 'Inicio', icon: 'home', exact: true, feature: 'home' },
    { path: '/programas', label: 'Programas', icon: 'school', feature: 'programas' },
    { path: '/tipos-programa', label: 'Tipos', icon: 'category', feature: 'tipos-programa' },
    { path: '/alumnos', label: 'Alumnos', icon: 'people', feature: 'alumno' },
    { path: '/docentes', label: 'Docentes', icon: 'badge', feature: 'docente' },
    { path: '/contrataciones', label: 'Contrataciones', icon: 'assignment', feature: 'contratacion' },
  ];

  isActive(path: string, exact: boolean = false): boolean {
    if (exact) return this.router.url === path;
    return this.router.url.startsWith(path) && path !== '/';
  }
}
