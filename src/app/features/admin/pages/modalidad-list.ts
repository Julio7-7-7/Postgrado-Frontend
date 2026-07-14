import { Component, OnInit, signal, inject, DestroyRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { AdminService } from '../services/admin.service';
import { ModalidadAcademicaResponse } from '../models/admin.models';
import { ModalidadFormComponent } from './modalidad-form';

@Component({
  selector: 'app-modalidad-list',
  standalone: true,
  imports: [
    CommonModule,
    MatButtonModule, MatIconModule, MatTooltipModule,
    MatProgressSpinnerModule, MatDialogModule, MatSnackBarModule,
  ],
  template: `
    <div class="page-container">
      <div class="header-section">
        <div>
          <h1>Modalidades Académicas</h1>
          <p class="subtitle">Gestioná las modalidades de admisión y sus requisitos documentales</p>
        </div>
        <button mat-flat-button color="primary" (click)="abrirFormulario()">
          <mat-icon>add</mat-icon> Nueva Modalidad
        </button>
      </div>

      @if (isLoading()) {
        <div class="loading-state">
          <mat-spinner diameter="36"></mat-spinner>
        </div>
      } @else if (error()) {
        <div class="empty-state">
          <mat-icon>error_outline</mat-icon>
          <p>{{ error() }}</p>
          <button mat-stroked-button (click)="cargar()">Reintentar</button>
        </div>
      } @else if (modalidades().length === 0) {
        <div class="empty-state">
          <mat-icon>school</mat-icon>
          <p>No hay modalidades creadas</p>
          <button mat-flat-button color="primary" (click)="abrirFormulario()">Crear primera modalidad</button>
        </div>
      } @else {
        <div class="entity-table">
          @for (m of modalidades(); track m.id_modalidad_academica) {
            <div class="entity-row">
              <div class="entity-main">
                <div class="entity-icon" [class.active]="m.estado === 'activo'">
                  <mat-icon>{{ m.requiere_titulo ? 'school' : 'pending_actions' }}</mat-icon>
                </div>
                <div class="entity-info">
                  <div class="entity-name">{{ m.nombre_modalidad }}</div>
                  <div class="entity-meta">
                    @if (m.descripcion) { {{ m.descripcion }} · }
                    {{ m.requiere_titulo ? 'Requiere título' : 'Sin título' }}
                  </div>
                </div>
              </div>
              <div class="entity-actions">
                <span class="status-pill" [class.active]="m.estado === 'activo'">
                  {{ m.estado }}
                </span>
                <button mat-icon-button matTooltip="Editar" (click)="abrirFormulario(m)">
                  <mat-icon>edit</mat-icon>
                </button>
              </div>
            </div>
          }
        </div>
      }
    </div>
  `,
  styles: [`
    .page-container { max-width: 1100px; margin: 0 auto; padding: 24px; }

    .header-section {
      display: flex;
      align-items: flex-start;
      justify-content: space-between;
      margin-bottom: 24px;
    }

    .header-section h1 { margin: 0; font-size: 1.5rem; font-weight: 700; }
    .subtitle { margin: 4px 0 0; color: #94a3b8; font-size: 0.88rem; }

    .loading-state, .empty-state {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 12px;
      padding: 48px;
      color: #94a3b8;
    }

    .empty-state mat-icon { font-size: 48px; width: 48px; height: 48px; }

    .entity-table {
      display: flex;
      flex-direction: column;
      gap: 6px;
    }

    .entity-row {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 14px 18px;
      background: white;
      border: 1px solid #e2e8f0;
      border-radius: 10px;
      transition: border-color 0.15s;
    }

    .entity-row:hover { border-color: #c7d2fe; }

    .entity-main {
      display: flex;
      align-items: center;
      gap: 14px;
      min-width: 0;
    }

    .entity-icon {
      width: 40px;
      height: 40px;
      border-radius: 10px;
      background: #f1f5f9;
      display: flex;
      align-items: center;
      justify-content: center;
      flex-shrink: 0;
    }

    .entity-icon.active {
      background: #ecfdf5;
      color: #059669;
    }

    .entity-icon mat-icon { font-size: 20px; width: 20px; height: 20px; }

    .entity-name { font-weight: 600; font-size: 0.95rem; }
    .entity-meta { font-size: 0.78rem; color: #94a3b8; }

    .entity-actions {
      display: flex;
      align-items: center;
      gap: 8px;
      flex-shrink: 0;
    }

    .status-pill {
      font-size: 0.72rem;
      font-weight: 600;
      padding: 3px 10px;
      border-radius: 20px;
      text-transform: uppercase;
      letter-spacing: 0.5px;
      background: #fee2e2;
      color: #991b1b;
    }

    .status-pill.active { background: #d1fae5; color: #065f46; }
  `],
})
export class ModalidadListComponent implements OnInit {
  private service = inject(AdminService);
  private dialog = inject(MatDialog);
  private snackbar = inject(MatSnackBar);
  private destroyRef = inject(DestroyRef);

  modalidades = signal<ModalidadAcademicaResponse[]>([]);
  isLoading = signal(true);
  error = signal<string | null>(null);

  ngOnInit(): void { this.cargar(); }

  cargar(): void {
    this.isLoading.set(true);
    this.error.set(null);
    this.service.getModalidades().pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: data => { this.modalidades.set(data); this.isLoading.set(false); },
      error: () => { this.error.set('Error al cargar modalidades'); this.isLoading.set(false); },
    });
  }

  abrirFormulario(modalidad?: ModalidadAcademicaResponse): void {
    const ref = this.dialog.open(ModalidadFormComponent, {
      width: '640px',
      data: modalidad ?? null,
    });
    ref.afterClosed().pipe(takeUntilDestroyed(this.destroyRef)).subscribe(r => {
      if (r) this.cargar();
    });
  }
}
