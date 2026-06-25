import { Component, Inject, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterLink } from '@angular/router';
import { MatDialogModule, MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatDividerModule } from '@angular/material/divider';
import { Docente } from '../../models/docente.model';

@Component({
  selector: 'app-docente-card-dialog',
  standalone: true,
  imports: [
    CommonModule,
    RouterLink,
    MatDialogModule, MatButtonModule, MatIconModule, MatTooltipModule, MatDividerModule,
  ],
  template: `
    <div class="docente-card">
      <div class="card-header">
        <div class="avatar">
          <span>{{ iniciales(data) }}</span>
        </div>
        <div class="header-info">
          <h2>{{ data.grado ? data.grado + '.' : '' }} {{ data.nombre }} {{ data.apellido }}</h2>
          <span class="docente-estado-badge"
                [class.docente-estado-activo]="!data.tiene_modulos_activos && data.estado === 'activo'"
                [class.docente-estado-inactivo]="data.estado === 'inactivo'"
                [class.docente-estado-dictando]="data.tiene_modulos_activos">
            {{ data.estado === 'inactivo' ? 'Inactivo' : data.tiene_modulos_activos ? 'Dictando' : 'Activo' }}
          </span>
        </div>
        <button mat-icon-button class="close-btn" (click)="cerrar()" matTooltip="Cerrar">
          <mat-icon>close</mat-icon>
        </button>
      </div>

      <mat-divider></mat-divider>

      <div class="card-body">
        <div class="info-group">
          <div class="info-item">
            <mat-icon class="item-icon">badge</mat-icon>
            <div>
              <span class="item-label">Cédula de Identidad</span>
              <span class="item-value">{{ data.ci }} {{ data.extension ? data.extension : '' }}</span>
            </div>
          </div>
          <div class="info-item">
            <mat-icon class="item-icon">school</mat-icon>
            <div>
              <span class="item-label">Título</span>
              <span class="item-value">{{ data.titulo || '—' }}</span>
            </div>
          </div>
          <div class="info-item">
            <mat-icon class="item-icon">email</mat-icon>
            <div>
              <span class="item-label">Correo</span>
              <span class="item-value">{{ data.correo }}</span>
            </div>
          </div>
          <div class="info-item">
            <mat-icon class="item-icon">phone</mat-icon>
            <div>
              <span class="item-label">Celular</span>
              <span class="item-value">{{ data.celular || '—' }}</span>
            </div>
          </div>
          <div class="info-item">
            <mat-icon class="item-icon">wc</mat-icon>
            <div>
              <span class="item-label">Género</span>
              <span class="item-value">{{ data.genero ? (data.genero === 'masculino' ? 'Masculino' : 'Femenino') : '—' }}</span>
            </div>
          </div>
        </div>

        <mat-divider class="body-divider"></mat-divider>

        <button mat-stroked-button color="primary" class="btn-ver-perfil" (click)="irAPerfil()">
          <mat-icon>open_in_new</mat-icon> Ver perfil completo
        </button>
      </div>
    </div>
  `,
  styles: [`
    .docente-card { width: 100%; overflow: hidden; }
    .card-header {
      display: flex;
      align-items: center;
      gap: 16px;
      padding: 24px 24px 20px;
      position: relative;
    }
    .avatar {
      width: 56px;
      height: 56px;
      border-radius: 50%;
      background: linear-gradient(135deg, var(--fich-primary), var(--fich-primary-hover));
      color: white;
      display: flex;
      align-items: center;
      justify-content: center;
      font-weight: 700;
      font-size: 1.2rem;
      flex-shrink: 0;
      box-shadow: 0 3px 10px rgba(30, 58, 138, 0.2);
    }
    .header-info { flex: 1; }
    .header-info h2 {
      margin: 0;
      font-size: 1.2rem;
      font-weight: 700;
      color: var(--fich-text);
    }
    .docente-estado-badge {
      display: inline-block;
      padding: 3px 12px;
      border-radius: 9999px;
      font-size: 0.75rem;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 0.03em;
      margin-top: 6px;
    }
    .docente-estado-activo {
      background: #f0fdf4;
      color: #16a34a;
      border: 1px solid #bbf7d0;
    }
    .docente-estado-inactivo {
      background: #f8fafc;
      color: #64748b;
      border: 1px solid #e2e8f0;
    }
    .docente-estado-dictando {
      background: #dcfce7;
      color: #16a34a;
      border: 1px solid #bbf7d0;
    }
    .close-btn {
      position: absolute;
      top: 12px;
      right: 12px;
    }
    .card-body { padding: 20px 24px 24px; }
    .body-divider { margin: 20px 0 16px; }
    .btn-ver-perfil {
      width: 100%;
      border-radius: var(--fich-radius-sm) !important;
    }
    .info-group { display: flex; flex-direction: column; gap: 16px; }
    .info-item {
      display: flex;
      align-items: flex-start;
      gap: 12px;
    }
    .item-icon {
      font-size: 20px;
      width: 20px;
      height: 20px;
      color: var(--fich-text-muted);
      margin-top: 2px;
    }
    .info-item div { display: flex; flex-direction: column; gap: 2px; }
    .item-label {
      font-size: 0.75rem;
      font-weight: 600;
      color: var(--fich-text-muted);
      text-transform: uppercase;
      letter-spacing: 0.04em;
    }
    .item-value {
      font-size: 0.95rem;
      color: var(--fich-text);
      font-weight: 500;
    }
  `],
})
export class DocenteCardDialogComponent {
  private router = inject(Router);

  constructor(
    public dialogRef: MatDialogRef<DocenteCardDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: Docente,
  ) {}

  iniciales(d: Docente): string {
    return (d.nombre.charAt(0) + d.apellido.charAt(0)).toUpperCase();
  }

  cerrar(): void {
    this.dialogRef.close();
  }

  irAPerfil(): void {
    this.dialogRef.close();
    this.router.navigate(['/docentes', this.data.id_docente]);
  }
}
