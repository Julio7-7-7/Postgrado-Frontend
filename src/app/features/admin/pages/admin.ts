import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterOutlet, RouterLink, RouterLinkActive, Router } from '@angular/router';
import { MatTabsModule } from '@angular/material/tabs';
import { MatIconModule } from '@angular/material/icon';

@Component({
  selector: 'app-admin',
  standalone: true,
  imports: [
    CommonModule, RouterOutlet, RouterLink, RouterLinkActive,
    MatTabsModule, MatIconModule,
  ],
  template: `
    <div class="admin-wrapper">
      <div class="page-container">
        <div class="header-section">
          <h2><mat-icon>admin_panel_settings</mat-icon> Panel de Administración</h2>
          <p class="subtitle">Gestión de roles, permisos y usuarios del sistema</p>
        </div>
        <nav mat-tab-nav-bar [tabPanel]="tabPanel">
          <a mat-tab-link
             [routerLink]="['./roles']"
             routerLinkActive
             #rla1="routerLinkActive"
             [active]="rla1.isActive">
            <mat-icon>verified_user</mat-icon> Roles y Permisos
          </a>
          <a mat-tab-link
             [routerLink]="['./usuarios']"
             routerLinkActive
             #rla2="routerLinkActive"
             [active]="rla2.isActive">
            <mat-icon>people</mat-icon> Usuarios
          </a>
        </nav>
        <mat-tab-nav-panel #tabPanel>
          <router-outlet></router-outlet>
        </mat-tab-nav-panel>
      </div>
    </div>
  `,
  styles: [`
    .admin-wrapper { max-width: 1100px; margin: 0 auto; }
    nav { margin-bottom: 24px; }
    mat-tab-link mat-icon { margin-right: 6px; font-size: 20px; width: 20px; height: 20px; }
  `],
})
export class AdminComponent {}
