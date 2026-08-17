import { Component, computed, inject, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { OrdenPagoService } from '../../services/orden-pago.service';
import { OrdenPagoResponse } from '../../models/orden-pago.model';

export interface OrdenEstudianteData {
  idDetalleProgramaAlumno: number;
  alumnoNombre: string;
  programaNombre: string;
  edicionLabel: string;
  matriculaPendiente: boolean;
  precioMatricula: number;
  modulosPendientes: { nombre: string; sigla: string; orden: number; precio: number }[];
  totalEsperado: number;
  totalPagado: number;
}

@Component({
  selector: 'app-orden-estudiante-dialog',
  standalone: true,
  imports: [
    CommonModule, MatDialogModule, MatButtonModule,
    MatIconModule, MatTooltipModule, MatSnackBarModule, MatProgressSpinnerModule,
  ],
  template: `
    <div class="dialog-header">
      <div class="header-icon" style="background: linear-gradient(135deg, #15803d, #166534)">
        <mat-icon>receipt_long</mat-icon>
      </div>
      <div>
        <h2>Generar Orden de Pago</h2>
        <p class="header-sub">{{ data.programaNombre }} — {{ data.edicionLabel }}</p>
      </div>
    </div>

    <mat-dialog-content>
      <div class="fin-summary">
        <div class="fin-row">
          <span class="fin-label">Total del programa</span>
          <span class="fin-value">Bs {{ fmt(data.totalEsperado) }}</span>
        </div>
        <div class="fin-row">
          <span class="fin-label">Ya pagado</span>
          <span class="fin-value pagado">Bs {{ fmt(data.totalPagado) }}</span>
        </div>
        <div class="fin-row total">
          <span class="fin-label">Saldo pendiente</span>
          <span class="fin-value">Bs {{ fmt(saldoPendiente()) }}</span>
        </div>
      </div>

      @if (ordenActiva()) {
        <div class="orden-activa">
          <mat-icon>info</mat-icon>
          <div>
            <strong>Ya tenés una orden activa</strong>
            <p>{{ ordenActiva()!.numero }} — Bs {{ fmt(ordenActiva()!.monto_total) }}</p>
          </div>
        </div>
      } @else if (data.modulosPendientes.length === 0 && !data.matriculaPendiente) {
        <div class="empty-state">
          <mat-icon>check_circle</mat-icon>
          <p>No hay conceptos pendientes de pago.</p>
        </div>
      } @else {
        <div class="modules-section">
          <h4>Conceptos a incluir</h4>

          @if (data.matriculaPendiente) {
            <div class="module-row matricula">
              <div class="module-info">
                <mat-icon>school</mat-icon>
                <span class="module-name">Matrícula</span>
              </div>
              <span class="module-price">Bs {{ fmt(data.precioMatricula) }}</span>
            </div>
          }

          <div class="modules-stepper">
            <span class="stepper-label">Cuotas a incluir:</span>
            <div class="stepper-controls">
              <button mat-icon-button (click)="decModules()" [disabled]="cantidadModulos() === 0" type="button">
                <mat-icon>remove</mat-icon>
              </button>
              <span class="stepper-value">{{ cantidadModulos() }} / {{ data.modulosPendientes.length }}</span>
              <button mat-icon-button (click)="incModules()" [disabled]="cantidadModulos() >= data.modulosPendientes.length" type="button">
                <mat-icon>add</mat-icon>
              </button>
            </div>
          </div>

          @if (cantidadModulos() > 0) {
            <div class="modules-preview">
              @for (mod of modulosIncluidos(); track mod.orden) {
                <div class="preview-item">
                  <span class="preview-sigla">{{ mod.sigla }}</span>
                  <span class="preview-name">{{ mod.nombre }}</span>
                  <span class="preview-price">Bs {{ fmt(mod.precio) }}</span>
                </div>
              }
            </div>
          }
        </div>

        @if (cantidadModulos() > 0 || data.matriculaPendiente) {
          <div class="preview-section">
            <div class="preview-row total">
              <span>Total a pagar</span>
              <span class="preview-monto">Bs {{ fmt(montoPreview()) }}</span>
            </div>
          </div>
        }
      }
    </mat-dialog-content>

    <mat-dialog-actions align="end">
      <button mat-button mat-dialog-close>Cancelar</button>
      @if (!ordenActiva() && (data.modulosPendientes.length > 0 || data.matriculaPendiente)) {
        <button
          mat-flat-button
          color="primary"
          [disabled]="creando()"
          (click)="emitir()">
          @if (creando()) {
            <mat-spinner diameter="18"></mat-spinner>
          } @else {
            Generar Orden
          }
        </button>
      }
    </mat-dialog-actions>
  `,
  styles: [`
    .dialog-header {
      display: flex; align-items: center; gap: 14px;
      padding: 20px 24px 12px;
    }
    .header-icon {
      width: 44px; height: 44px; border-radius: 12px;
      display: flex; align-items: center; justify-content: center;
      color: white; flex-shrink: 0;
    }
    .dialog-header h2 { margin: 0; font-size: 1.15rem; font-weight: 600; }
    .header-sub { margin: 2px 0 0; font-size: 0.8rem; color: var(--fich-text-secondary); }

    mat-dialog-content { padding: 0 24px 16px; min-width: 440px; max-height: 480px; }

    .fin-summary {
      background: var(--fich-bg-subtle); border-radius: 10px;
      padding: 12px 14px; margin-bottom: 16px;
    }
    .fin-row {
      display: flex; justify-content: space-between; align-items: center;
      padding: 4px 0; font-size: 0.85rem;
    }
    .fin-row.total {
      border-top: 1px solid var(--fich-border); margin-top: 6px; padding-top: 8px;
      font-weight: 600;
    }
    .fin-label { color: var(--fich-text-secondary); }
    .fin-value { font-variant-numeric: tabular-nums; }
    .fin-value.pagado { color: #15803d; }

    .orden-activa {
      display: flex; align-items: flex-start; gap: 10px;
      background: #eff6ff; border-radius: 10px; padding: 12px 14px;
      color: #1e40af; font-size: 0.85rem;
    }
    .orden-activa mat-icon { color: #3b82f6; margin-top: 2px; }
    .orden-activa p { margin: 4px 0 0; font-size: 0.8rem; opacity: 0.8; }

    .empty-state {
      display: flex; flex-direction: column; align-items: center;
      gap: 6px; padding: 20px 0; color: var(--fich-text-secondary);
    }
    .empty-state mat-icon { color: #047857; font-size: 28px; width: 28px; height: 28px; }
    .empty-state p { margin: 0; font-size: 0.85rem; }

    .modules-section h4 {
      margin: 0 0 8px; font-size: 0.85rem; font-weight: 600;
      color: var(--fich-text-secondary);
    }
    .module-row {
      display: flex; align-items: center; justify-content: space-between;
      padding: 10px 12px; border-radius: 8px;
    }
    .module-row.matricula { background: #f0fdf4; border: 1px solid #15803d22; }
    .module-info { display: flex; align-items: center; gap: 8px; }
    .module-info mat-icon { font-size: 18px; width: 18px; height: 18px; color: #15803d; }
    .module-name { font-size: 0.85rem; font-weight: 500; }
    .module-price { font-size: 0.8rem; color: var(--fich-text-secondary); font-variant-numeric: tabular-nums; }

    .modules-stepper {
      display: flex; align-items: center; justify-content: space-between;
      padding: 12px 0; border-bottom: 1px solid var(--fich-border-light);
    }
    .stepper-label { font-size: 0.85rem; color: var(--fich-text-secondary); }
    .stepper-controls { display: flex; align-items: center; gap: 4px; }
    .stepper-value {
      min-width: 48px; text-align: center; font-size: 0.95rem;
      font-weight: 600; font-variant-numeric: tabular-nums;
    }

    .modules-preview {
      margin-top: 8px; border-radius: 8px; overflow: hidden;
    }
    .preview-item {
      display: flex; align-items: center; gap: 8px;
      padding: 6px 10px; font-size: 0.82rem;
      border-bottom: 1px solid var(--fich-border-light);
    }
    .preview-item:last-child { border-bottom: none; }
    .preview-sigla {
      background: var(--fich-bg-subtle); padding: 2px 6px;
      border-radius: 4px; font-weight: 600; font-size: 0.75rem;
    }
    .preview-name { flex: 1; }
    .preview-price { font-variant-numeric: tabular-nums; color: var(--fich-text-secondary); }

    .preview-section {
      margin-top: 12px; border-top: 1px solid var(--fich-border);
      padding-top: 10px;
    }
    .preview-row {
      display: flex; justify-content: space-between; font-size: 0.9rem;
    }
    .preview-row.total { font-weight: 700; }
    .preview-monto { color: #15803d; font-variant-numeric: tabular-nums; }

    mat-dialog-actions { padding: 8px 24px 16px; gap: 8px; }
  `],
})
export class OrdenEstudianteDialogComponent implements OnInit {
  private ordenService = inject(OrdenPagoService);
  private snackBar = inject(MatSnackBar);
  dialogRef = inject(MatDialogRef<OrdenEstudianteDialogComponent>);
  data = inject<OrdenEstudianteData>(MAT_DIALOG_DATA);

  cantidadModulos = signal(0);
  creando = signal(false);
  ordenActiva = signal<OrdenPagoResponse | null>(null);

  modulosIncluidos = computed(() =>
    this.data.modulosPendientes.slice(0, this.cantidadModulos())
  );

  saldoPendiente = computed(() => Math.max(0, this.data.totalEsperado - this.data.totalPagado));

  montoPreview = computed(() => {
    let total = 0;
    if (this.data.matriculaPendiente) total += this.data.precioMatricula;
    for (const mod of this.modulosIncluidos()) {
      total += mod.precio;
    }
    return total;
  });

  ngOnInit() {
    this.ordenService.getMisOrdenes(this.data.idDetalleProgramaAlumno).subscribe({
      next: (ordenes) => {
        const activa = ordenes.find(o => o.estado === 'emitida');
        if (activa) this.ordenActiva.set(activa);
      },
    });
  }

  incModules() {
    if (this.cantidadModulos() < this.data.modulosPendientes.length) {
      this.cantidadModulos.update(v => v + 1);
    }
  }

  decModules() {
    if (this.cantidadModulos() > 0) {
      this.cantidadModulos.update(v => v - 1);
    }
  }

  emitir() {
    if (this.cantidadModulos() === 0 && !this.data.matriculaPendiente) return;
    this.creando.set(true);

    this.ordenService.emitir({
      id_detalle_programa_alumno: this.data.idDetalleProgramaAlumno,
      cubre_matricula: this.data.matriculaPendiente,
      cantidad_modulos: this.cantidadModulos(),
    }).subscribe({
      next: (orden) => {
        this.snackBar.open(`Orden ${orden.numero} generada`, 'Cerrar', { duration: 3000 });
        this.dialogRef.close(orden);
      },
      error: (err) => {
        this.snackBar.open(err.error?.detail || 'Error al generar orden', 'Cerrar', { duration: 4000 });
        this.creando.set(false);
      },
    });
  }

  fmt(n: number): string {
    return Number(n || 0).toLocaleString('es-BO', { minimumFractionDigits: 0, maximumFractionDigits: 2 });
  }
}
