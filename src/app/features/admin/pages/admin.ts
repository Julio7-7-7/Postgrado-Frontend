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
          <div class="header-icon">
            <mat-icon>admin_panel_settings</mat-icon>
          </div>
          <div class="header-text">
            <h2>Administración</h2>
            <p>Gestión de roles, permisos y usuarios del sistema</p>
          </div>
        </div>
        <nav mat-tab-nav-bar [tabPanel]="tabPanel" class="admin-tabs">
          <a mat-tab-link
             [routerLink]="['./roles']"
             routerLinkActive
             #rla1="routerLinkActive"
             [active]="rla1.isActive">
            <mat-icon>shield</mat-icon> Roles
          </a>
          <a mat-tab-link
             [routerLink]="['./usuarios']"
             routerLinkActive
             #rla2="routerLinkActive"
             [active]="rla2.isActive">
            <mat-icon>people</mat-icon> Usuarios
          </a>
          <a mat-tab-link
             [routerLink]="['./modalidades']"
             routerLinkActive
             #rla3="routerLinkActive"
             [active]="rla3.isActive">
            <mat-icon>school</mat-icon> Modalidades
          </a>
          <a mat-tab-link
             [routerLink]="['./descuentos']"
             routerLinkActive
             #rla4="routerLinkActive"
             [active]="rla4.isActive">
            <mat-icon>local_offer</mat-icon> Descuentos
          </a>
          <a mat-tab-link
             [routerLink]="['./documentacion']"
             routerLinkActive
             #rla5="routerLinkActive"
             [active]="rla5.isActive">
            <mat-icon>description</mat-icon> Documentación
          </a>
        </nav>
        <mat-tab-nav-panel #tabPanel class="admin-panel">
          <router-outlet></router-outlet>
        </mat-tab-nav-panel>
      </div>
    </div>
  `,
  styles: [`
    .admin-wrapper { max-width: 1100px; margin: 0 auto; }

    .header-section {
      display: flex;
      align-items: center;
      gap: 16px;
      margin-bottom: 24px;
    }

    .header-icon {
      width: 48px;
      height: 48px;
      border-radius: 12px;
      background: linear-gradient(135deg, #4f46e5, #6366f1);
      display: flex;
      align-items: center;
      justify-content: center;
    }

    .header-icon mat-icon {
      font-size: 24px;
      width: 24px;
      height: 24px;
      color: white;
    }

    .header-text h2 {
      margin: 0;
      font-size: 1.3rem;
      font-weight: 700;
    }

    .header-text p {
      margin: 0;
      font-size: 0.85rem;
      color: #94a3b8;
    }

    .admin-tabs {
      margin-bottom: 24px;
    }

    .admin-tabs mat-tab-link mat-icon {
      margin-right: 6px;
      font-size: 18px;
      width: 18px;
      height: 18px;
    }
  `],
})
export class AdminComponent {}
