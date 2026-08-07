import { Component, Inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatDialogModule, MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';

export interface CredencialesDocenteData {
  nombre: string;
  email: string;
  password: string;
}

@Component({
  selector: 'app-credenciales-docente-dialog',
  standalone: true,
  imports: [CommonModule, MatDialogModule, MatButtonModule, MatIconModule],
  template: `
    <h2 mat-dialog-title class="dialog-title">
      <mat-icon class="title-icon">how_to_reg</mat-icon>
      Usuario de acceso creado
    </h2>
    <mat-dialog-content class="dialog-content">
      <p class="intro">
        El docente <strong>{{ data.nombre }}</strong> ya puede iniciar sesión. Compartile estas
        credenciales:
      </p>
      <div class="cred-row">
        <span class="cred-label">Correo</span>
        <code class="cred-value">{{ data.email }}</code>
      </div>
      <div class="cred-row">
        <span class="cred-label">Contraseña inicial</span>
        <code class="cred-value">{{ data.password }}</code>
      </div>
      <p class="aviso">
        <mat-icon>info</mat-icon>
        Al ingresar por primera vez, el sistema le pedirá crear una nueva contraseña.
      </p>
    </mat-dialog-content>
    <mat-dialog-actions align="end">
      <button mat-raised-button color="primary" (click)="dialogRef.close()">
        <mat-icon>check</mat-icon> Entendido
      </button>
    </mat-dialog-actions>
  `,
  styles: [`
    .dialog-title {
      color: var(--fich-feature-docente);
      margin-bottom: 8px;
      font-weight: 700;
      display: flex;
      align-items: center;
      gap: 8px;
    }
    .title-icon { color: var(--fich-feature-docente); }
    .dialog-content {
      min-width: 380px;
      font-size: 0.95rem;
      line-height: 1.6;
      color: var(--fich-text-secondary);
      padding-bottom: 16px;
    }
    .intro { margin: 0 0 16px; }
    .cred-row {
      display: flex;
      justify-content: space-between;
      align-items: center;
      gap: 12px;
      background: var(--fich-feature-docente-light);
      border: 1px solid rgba(13, 148, 136, 0.25);
      border-radius: 8px;
      padding: 10px 14px;
      margin-bottom: 10px;
    }
    .cred-label {
      font-weight: 600;
      color: var(--fich-primary-dark);
      white-space: nowrap;
    }
    .cred-value {
      font-family: monospace;
      font-size: 0.9rem;
      background: #fff;
      border: 1px solid #e2e8f0;
      border-radius: 6px;
      padding: 4px 10px;
      user-select: all;
    }
    .aviso {
      display: flex;
      align-items: flex-start;
      gap: 8px;
      margin: 16px 0 0;
      font-size: 0.85rem;
      color: var(--fich-text-muted);
    }
    .aviso mat-icon {
      font-size: 18px;
      width: 18px;
      height: 18px;
      color: #d97706;
      margin-top: 1px;
    }
    mat-dialog-actions {
      padding: 16px 24px 20px;
      gap: 8px;
    }
  `],
})
export class CredencialesDocenteDialog {
  constructor(
    public dialogRef: MatDialogRef<CredencialesDocenteDialog>,
    @Inject(MAT_DIALOG_DATA) public data: CredencialesDocenteData,
  ) {}
}
