import { Component, Inject, signal, inject, DestroyRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MAT_DIALOG_DATA, MatDialogRef, MatDialogModule } from '@angular/material/dialog';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { InscripcionEdicionService } from '../../services/inscripcion-edicion.service';
import { SolicitudIncorporacionConDetalle } from '../../../alumno/models/solicitud-incorporacion.model';
import { environment } from '../../../../../environments/environment';

export interface SolicitudIncorporacionDialogData {
  solicitud: SolicitudIncorporacionConDetalle;
}

@Component({
  selector: 'app-solicitud-incorporacion-dialog',
  standalone: true,
  imports: [
    CommonModule, MatDialogModule, MatIconModule, MatButtonModule,
    MatTooltipModule, MatSnackBarModule,
  ],
  template: `
    <div class="dialog-header">
      <div class="header-left">
        <div class="avatar-lg">{{ iniciales }}</div>
        <div class="header-info">
          <h2 mat-dialog-title>{{ nombreCompleto }}</h2>
          <div class="header-meta">
            @if (sol.alumno_ci) {
              <span class="meta-chip"><mat-icon>badge</mat-icon> CI: {{ sol.alumno_ci }}</span>
            }
            <span class="estado-pill" [class]="'pill-' + sol.estado">{{ sol.estado }}</span>
          </div>
        </div>
      </div>
      <button mat-icon-button (click)="close()" class="close-btn">
        <mat-icon>close</mat-icon>
      </button>
    </div>

    <div class="dialog-programa">
      <mat-icon>school</mat-icon>
      <span>{{ sol.programa_nombre }} — Ed. {{ sol.edicion_numero }} ({{ sol.edicion_semestre }}-{{ sol.edicion_anio }})</span>
    </div>

    <mat-dialog-content class="dialog-content">
      @if (sol.documentos && sol.documentos.length > 0) {
        @for (doc of sol.documentos; track doc.id_solicitud_documento) {
          <div class="doc-row" [class.doc-uploaded]="!!doc.url_documento">
            <div class="doc-main">
              <div class="doc-status">
                <mat-icon class="status-icon" [class]="doc.url_documento ? 'icon-uploaded' : 'icon-pending'">
                  {{ doc.url_documento ? 'check_circle' : 'radio_button_unchecked' }}
                </mat-icon>
              </div>
              <div class="doc-info">
                <span class="doc-name">{{ doc.nombre_requisito }}</span>
                @if (doc.fecha_entrega) {
                  <span class="doc-dates">Entregado: {{ doc.fecha_entrega }}</span>
                }
              </div>
              <span class="doc-badge" [class]="doc.url_documento ? 'badge-uploaded' : 'badge-pending'">
                {{ doc.url_documento ? 'Subido' : 'Pendiente' }}
              </span>
            </div>
            @if (doc.url_documento) {
              <div class="doc-actions">
                <button mat-stroked-button class="action-btn" (click)="verDocumento(doc.url_documento!)">
                  <mat-icon>visibility</mat-icon> Ver
                </button>
              </div>
            }
          </div>
        }
      } @else {
        <div class="no-docs-msg">
          <mat-icon>info_outline</mat-icon>
          <span>No se adjuntaron documentos</span>
        </div>
      }
    </mat-dialog-content>

    <mat-dialog-actions align="end" class="dialog-actions">
      @if (sol.estado === 'pendiente') {
        <button mat-stroked-button class="action-btn reject-btn" (click)="rechazar()" [disabled]="procesando()">
          <mat-icon>close</mat-icon> Rechazar
        </button>
        <button mat-flat-button color="primary" class="action-btn" (click)="aprobar()" [disabled]="procesando()">
          @if (procesando()) {
            <mat-icon class="spin">sync</mat-icon>
          } @else {
            <mat-icon>check</mat-icon>
          }
          Aprobar
        </button>
      }
      @if (sol.estado === 'aceptado') {
        <span class="approved-label"><mat-icon>verified</mat-icon> Solicitud aprobada</span>
      }
      @if (sol.estado === 'rechazado') {
        <span class="rejected-label"><mat-icon>block</mat-icon> Solicitud rechazada</span>
      }
      <button mat-button (click)="close()">Cerrar</button>
    </mat-dialog-actions>
  `,
  styles: [`
    .dialog-header {
      display: flex;
      align-items: flex-start;
      justify-content: space-between;
      padding: 20px 24px 0;
    }
    .header-left { display: flex; align-items: center; gap: 14px; min-width: 0; }
    .avatar-lg {
      width: 48px; height: 48px; border-radius: 12px;
      background: linear-gradient(135deg, #0d9488, #14b8a6);
      color: white; display: flex; align-items: center; justify-content: center;
      font-weight: 700; font-size: 1rem; flex-shrink: 0;
    }
    .header-info h2 { margin: 0; font-size: 1.15rem; font-weight: 700; color: var(--fich-text); }
    .header-meta { display: flex; align-items: center; gap: 8px; margin-top: 4px; flex-wrap: wrap; }
    .meta-chip {
      display: inline-flex; align-items: center; gap: 4px;
      font-size: 0.78rem; color: var(--fich-text-muted);
      background: var(--fich-bg-subtle); padding: 2px 8px; border-radius: 6px;
    }
    .meta-chip mat-icon { font-size: 14px; width: 14px; height: 14px; }
    .close-btn { flex-shrink: 0; }

    .estado-pill {
      font-size: 0.68rem; font-weight: 600; padding: 3px 10px;
      border-radius: 16px; text-transform: uppercase; letter-spacing: 0.4px;
    }
    .pill-pendiente { background: #fef3c7; color: #92400e; }
    .pill-aceptado { background: #d1fae5; color: #065f46; }
    .pill-rechazado { background: #fee2e2; color: #991b1b; }

    .dialog-programa {
      display: flex; align-items: center; gap: 8px;
      padding: 10px 24px; font-size: 0.85rem; font-weight: 500;
      color: var(--fich-text-secondary); background: var(--fich-bg-subtle);
      border-top: 1px solid var(--fich-border-light);
      border-bottom: 1px solid var(--fich-border-light);
    }
    .dialog-programa mat-icon { font-size: 18px; width: 18px; height: 18px; color: #4f46e5; }

    .dialog-content { padding: 16px 24px !important; max-height: 50vh; }

    /* Doc row */
    .doc-row {
      border: 1px solid var(--fich-border-light); border-radius: 10px;
      padding: 14px 16px; margin-bottom: 10px; background: var(--fich-bg-card);
      transition: border-color 0.12s;
    }
    .doc-row:last-child { margin-bottom: 0; }
    .doc-row.doc-uploaded { border-left: 3px solid #10b981; }

    .doc-main { display: flex; align-items: center; gap: 12px; }
    .doc-status { flex-shrink: 0; }
    .status-icon { font-size: 22px; width: 22px; height: 22px; }
    .icon-uploaded { color: #10b981; }
    .icon-pending { color: #94a3b8; }

    .doc-info { flex: 1; min-width: 0; display: flex; flex-direction: column; gap: 2px; }
    .doc-name { font-weight: 600; color: var(--fich-text); font-size: 0.9rem; }
    .doc-dates { font-size: 0.75rem; color: var(--fich-text-muted); }

    .doc-badge {
      font-size: 0.68rem; font-weight: 600; padding: 3px 10px;
      border-radius: 16px; text-transform: uppercase; letter-spacing: 0.3px;
      white-space: nowrap; flex-shrink: 0;
    }
    .badge-uploaded { background: #d1fae5; color: #065f46; }
    .badge-pending { background: #f1f5f9; color: #64748b; }

    .doc-actions { margin-top: 10px; }
    .action-btn {
      height: 32px !important; font-size: 0.78rem !important; border-radius: 6px !important;
    }
    .action-btn mat-icon { font-size: 16px; width: 16px; height: 16px; margin-right: 4px; }

    .no-docs-msg {
      display: flex; align-items: center; gap: 8px; padding: 24px;
      color: var(--fich-text-muted); font-size: 0.85rem; justify-content: center;
    }

    /* Actions */
    .dialog-actions { padding: 8px 24px 16px !important; gap: 8px; }
    .reject-btn { color: #ef4444 !important; border-color: #fecaca !important; }
    .reject-btn:hover { background: #fef2f2 !important; }

    .approved-label {
      display: inline-flex; align-items: center; gap: 4px;
      font-size: 0.82rem; font-weight: 600; color: #10b981;
    }
    .approved-label mat-icon { font-size: 18px; width: 18px; height: 18px; }

    .rejected-label {
      display: inline-flex; align-items: center; gap: 4px;
      font-size: 0.82rem; font-weight: 600; color: #ef4444;
    }
    .rejected-label mat-icon { font-size: 18px; width: 18px; height: 18px; }

    @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
    .spin { animation: spin 1s linear infinite; }
  `],
})
export class SolicitudIncorporacionDialogComponent {
  private service = inject(InscripcionEdicionService);
  private snackBar = inject(MatSnackBar);
  private destroyRef = inject(DestroyRef);

  apiUrl = environment.apiUrl;
  sol: SolicitudIncorporacionConDetalle;
  procesando = signal(false);

  constructor(
    public dialogRef: MatDialogRef<SolicitudIncorporacionDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: SolicitudIncorporacionDialogData,
  ) {
    this.sol = { ...data.solicitud };
  }

  get nombreCompleto(): string {
    return `${this.sol.alumno_nombre || ''} ${this.sol.alumno_apellido || ''}`.trim() || 'Sin datos';
  }

  get iniciales(): string {
    const n = this.sol.alumno_nombre || '?';
    const a = this.sol.alumno_apellido || '';
    return (n[0] + a[0]).toUpperCase();
  }

  verDocumento(url: string): void {
    window.open(`${this.apiUrl}${url}`, '_blank');
  }

  aprobar(): void {
    this.procesando.set(true);
    this.service.aprobarSolicitud(this.sol.id_solicitud)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (updated) => {
          this.sol = { ...updated };
          this.procesando.set(false);
          this.snackBar.open('Solicitud aprobada', 'Cerrar', { duration: 2000 });
          this.dialogRef.close(updated);
        },
        error: (err) => {
          this.procesando.set(false);
          this.snackBar.open(err.error?.detail || 'Error al aprobar', 'Cerrar', { duration: 4000 });
        },
      });
  }

  rechazar(): void {
    this.procesando.set(true);
    this.service.rechazarSolicitud(this.sol.id_solicitud, 'Solicitud rechazada por el administrador')
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (updated) => {
          this.sol = { ...updated };
          this.procesando.set(false);
          this.snackBar.open('Solicitud rechazada', 'Cerrar', { duration: 2000 });
          this.dialogRef.close(updated);
        },
        error: (err) => {
          this.procesando.set(false);
          this.snackBar.open(err.error?.detail || 'Error al rechazar', 'Cerrar', { duration: 4000 });
        },
      });
  }

  close(): void {
    this.dialogRef.close(null);
  }
}
