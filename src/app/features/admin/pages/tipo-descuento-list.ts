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
import { TipoDescuentoResponse } from '../models/admin.models';
import { TipoDescuentoFormComponent } from './tipo-descuento-form';

@Component({
  selector: 'app-tipo-descuento-list',
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
          <h1>Tipos de Descuento</h1>
          <p class="subtitle">Gestioná becas, descuentos y los documentos que requieren</p>
        </div>
        <button mat-flat-button color="primary" (click)="abrirFormulario()">
          <mat-icon>add</mat-icon> Nuevo Descuento
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
      } @else if (descuentos().length === 0) {
        <div class="empty-state">
          <mat-icon>local_offer</mat-icon>
          <p>No hay tipos de descuento creados</p>
          <button mat-flat-button color="primary" (click)="abrirFormulario()">Crear primer descuento</button>
        </div>
      } @else {
        <div class="entity-table">
          @for (d of descuentos(); track d.id_tipo_descuento) {
            <div class="entity-row">
              <div class="entity-main">
                <div class="entity-icon discount">
                  <mat-icon>local_offer</mat-icon>
                </div>
                <div class="entity-info">
                  <div class="entity-name">
                    {{ d.nombre }}
                    <span class="discount-badge">{{ d.porcentaje }}%</span>
                  </div>
                  <div class="entity-meta">
                    @if (d.descripcion) { {{ d.descripcion }} · }
                    {{ d.modalidades.length }} modalidad{{ d.modalidades.length !== 1 ? 'es' : '' }}
                    · {{ d.requisitos.length }} requisito{{ d.requisitos.length !== 1 ? 's' : '' }}
                  </div>
                  <div class="entity-tags">
                    @for (mod of d.modalidades; track mod.id_modalidad_academica) {
                      <span class="tag tag-modalidad">{{ mod.nombre_modalidad }}</span>
                    }
                    @for (req of d.requisitos; track req.id_requisito) {
                      <span class="tag tag-requisito">{{ req.nombre }}</span>
                    }
                  </div>
                </div>
              </div>
              <div class="entity-actions">
                <span class="status-pill" [class.active]="d.estado === 'activo'">
                  {{ d.estado }}
                </span>
                <button mat-icon-button matTooltip="Editar" (click)="abrirFormulario(d)">
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
      align-items: flex-start;
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
      align-items: flex-start;
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

    .entity-icon.discount { background: #fef3c7; color: #b45309; }
    .entity-icon mat-icon { font-size: 20px; width: 20px; height: 20px; }

    .entity-name {
      font-weight: 600;
      font-size: 0.95rem;
      display: flex;
      align-items: center;
      gap: 8px;
    }

    .discount-badge {
      font-size: 0.75rem;
      font-weight: 700;
      padding: 2px 8px;
      border-radius: 12px;
      background: #fef3c7;
      color: #b45309;
    }

    .entity-meta { font-size: 0.78rem; color: #94a3b8; }

    .entity-tags {
      display: flex;
      flex-wrap: wrap;
      gap: 4px;
      margin-top: 6px;
    }

    .tag {
      font-size: 0.7rem;
      font-weight: 500;
      padding: 2px 8px;
      border-radius: 6px;
    }

    .tag-modalidad { background: #e0e7ff; color: #3730a3; }
    .tag-requisito { background: #fce7f3; color: #9d174d; }

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
export class TipoDescuentoListComponent implements OnInit {
  private service = inject(AdminService);
  private dialog = inject(MatDialog);
  private snackbar = inject(MatSnackBar);
  private destroyRef = inject(DestroyRef);

  descuentos = signal<TipoDescuentoResponse[]>([]);
  isLoading = signal(true);
  error = signal<string | null>(null);

  ngOnInit(): void { this.cargar(); }

  cargar(): void {
    this.isLoading.set(true);
    this.error.set(null);
    this.service.getTiposDescuento().pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: data => { this.descuentos.set(data); this.isLoading.set(false); },
      error: () => { this.error.set('Error al cargar descuentos'); this.isLoading.set(false); },
    });
  }

  abrirFormulario(descuento?: TipoDescuentoResponse): void {
    const ref = this.dialog.open(TipoDescuentoFormComponent, {
      width: '640px',
      data: descuento ?? null,
    });
    ref.afterClosed().pipe(takeUntilDestroyed(this.destroyRef)).subscribe(r => {
      if (r) this.cargar();
    });
  }
}
