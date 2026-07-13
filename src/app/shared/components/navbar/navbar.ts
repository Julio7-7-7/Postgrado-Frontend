import { Component, inject, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink, RouterLinkActive, Router } from '@angular/router';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatMenuModule } from '@angular/material/menu';
import { MatDividerModule } from '@angular/material/divider';
import { MatTooltipModule } from '@angular/material/tooltip';
import { AuthService } from '../../../core/services/auth.service';

interface NavItem {
  path: string;
  label: string;
  icon: string;
  exact?: boolean;
  feature: string;
  permiso: string;
}

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
  auth = inject(AuthService);

  user = computed(() => this.auth.user());
  isLogged = computed(() => this.auth.isLogged());
  hasMultipleRoles = computed(() => this.auth.roles().length > 1);

  profileRoute = computed(() => {
    const user = this.auth.user();
    if (!user) return null;
    if (user.rol === 'alumno') return '/alumnos/perfil';
    if (user.rol === 'docente') return '/docentes';
    return null;
  });

  allNavItems: NavItem[] = [
    { path: '/dashboard', label: 'Inicio', icon: 'home', exact: true, feature: 'home', permiso: 'programas.ver' },
    { path: '/programas', label: 'Programas', icon: 'school', feature: 'programas', permiso: 'programas.ver' },
    { path: '/tipos-programa', label: 'Tipos', icon: 'category', feature: 'tipos-programa', permiso: 'tipos_programa.ver' },
    { path: '/alumnos', label: 'Alumnos', icon: 'people', feature: 'alumno', permiso: 'alumnos.ver' },
    { path: '/docentes', label: 'Docentes', icon: 'badge', feature: 'docente', permiso: 'docentes.ver' },
    { path: '/contrataciones', label: 'Contrataciones', icon: 'assignment', feature: 'contratacion', permiso: 'contrataciones.ver' },
    { path: '/admin', label: 'Admin', icon: 'admin_panel_settings', feature: 'admin', permiso: 'roles.gestionar' },
  ];

  docenteItems: NavItem[] = [
    { path: '/docentes', label: 'Mi Perfil', icon: 'badge', exact: true, feature: 'docente', permiso: 'docentes.ver' },
    { path: '/alumnos', label: 'Mis Alumnos', icon: 'people', feature: 'alumno', permiso: 'alumnos.ver' },
    { path: '/', label: 'Oferta Académica', icon: 'school', exact: true, feature: 'alumno', permiso: 'dashboard.ver' },
  ];

  studentItems: NavItem[] = [
    { path: '/alumnos/inscripciones', label: 'Mis Inscripciones', icon: 'assignment_ind', feature: 'alumno', permiso: 'dashboard.ver' },
    { path: '/', label: 'Oferta Académica', icon: 'school', exact: true, feature: 'alumno', permiso: 'dashboard.ver' },
  ];

  navItems = computed(() => {
    const user = this.auth.user();
    if (user?.rol === 'alumno') {
      return this.studentItems.filter(item => this.auth.hasPermiso(item.permiso));
    }
    if (user?.rol === 'docente') {
      return this.docenteItems.filter(item => this.auth.hasPermiso(item.permiso));
    }
    return this.allNavItems.filter(item => this.auth.hasPermiso(item.permiso));
  });

  isActive(path: string, exact: boolean = false): boolean {
    if (exact) return this.router.url === path;
    return this.router.url.startsWith(path) && path !== '/';
  }

  logout() {
    this.auth.logout();
  }
}
