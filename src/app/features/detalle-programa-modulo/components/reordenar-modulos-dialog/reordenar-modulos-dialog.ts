import { Component, Inject, signal, computed, inject, DestroyRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatDialogModule, MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatSnackBarModule, MatSnackBar } from '@angular/material/snack-bar';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { DragDropModule, CdkDragDrop, moveItemInArray } from '@angular/cdk/drag-drop';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { DetalleProgramaModulo } from '../../models/detalle.model';
import { DetalleService } from '../../services/detalle.service';

export interface ReordenarModulosData {
  idEdicion: number;
  modulos: DetalleProgramaModulo[];
}

@Component({
  selector: 'app-reordenar-modulos-dialog',
  standalone: true,
  imports: [
    CommonModule,
    MatDialogModule, MatButtonModule, MatIconModule,
    MatSnackBarModule, MatProgressSpinnerModule,
    DragDropModule,
  ],
  template: `
    <h2 mat-dialog-title>
      <mat-icon>swap_vert</mat-icon>
      Reordenar módulos
    </h2>

    <mat-dialog-content>
      <p class="reorden-hint">Arrastre los módulos para cambiar su orden de ejecución</p>

      <div cdkDropList class="reorden-list" (cdkDropListDropped)="onDrop($event)">
        @for (m of modulos(); track m.id_detalle_programa_modulo; let i = $index) {
          <div class="reorden-item" cdkDrag>
            <span class="reorden-orden">{{ i + 1 }}</span>
            <span class="reorden-sigla">{{ m.modulo.sigla }}</span>
            <span class="reorden-nombre">{{ m.modulo.nombre_modulo }}</span>
            <span class="reorden-estado reorden-badge" [class]="'r-estado-' + m.estado">
              {{ etiquetaEstado(m.estado) }}
            </span>
            <mat-icon class="reorden-handle" cdkDragHandle>drag_indicator</mat-icon>
          </div>
        }
      </div>
    </mat-dialog-content>

    <mat-dialog-actions align="end">
      <div class="actions-left">
        @if (!hayCambios()) {
          <span class="sin-cambios">Orden original</span>
        } @else {
          <span class="con-cambios">Orden modificado</span>
        }
      </div>
      <button mat-button (click)="onNoClick()" [disabled]="saving()">Cancelar</button>
      <button mat-raised-button color="primary"
        [disabled]="!hayCambios() || saving()"
        (click)="guardar()">
        @if (saving()) {
          <mat-spinner diameter="18"></mat-spinner>
        } @else {
          <mat-icon>save</mat-icon>
        }
        Guardar orden
      </button>
    </mat-dialog-actions>
  `,
  styles: [`
    :host { display: block; }
    h2 mat-icon { vertical-align: middle; margin-right: 8px; color: var(--fich-primary); }
    .reorden-hint { color: var(--fich-text-muted); font-size: 0.85rem; margin: 0 0 16px; }
    .reorden-list { display: flex; flex-direction: column; gap: 6px; min-width: 480px; }
    .reorden-item {
      display: flex;
      align-items: center;
      gap: 12px;
      padding: 10px 14px;
      background: var(--fich-bg-card);
      border: 1px solid var(--fich-border);
      border-radius: var(--fich-radius-md);
      cursor: move;
      transition: box-shadow 0.2s;
    }
    .reorden-item:hover { box-shadow: var(--fich-shadow-sm); }
    .reorden-item:active { box-shadow: var(--fich-shadow-md); }
    .reorden-item.cdk-drag-preview {
      box-shadow: var(--fich-shadow-lg);
      border-color: var(--fich-primary);
      background: var(--fich-bg-card);
    }
    .reorden-item.cdk-drag-placeholder { opacity: 0.3; }
    .reorden-orden {
      display: inline-flex; align-items: center; justify-content: center;
      min-width: 32px; height: 28px;
      background: var(--fich-primary); color: #fff;
      font-weight: 800; font-size: 0.82rem;
      border-radius: var(--fich-radius-sm);
      font-family: 'Roboto Mono', monospace;
    }
    .reorden-sigla {
      background: var(--fich-primary-light); color: var(--fich-primary-dark);
      font-weight: 700; font-size: 0.82rem;
      padding: 3px 10px; border-radius: var(--fich-radius-sm);
      font-family: 'Roboto Mono', monospace;
    }
    .reorden-nombre { font-weight: 600; font-size: 0.95rem; flex: 1; }
    .reorden-estado { font-size: 0.72rem; font-weight: 700; padding: 2px 10px; border-radius: var(--fich-radius-full); text-transform: uppercase; letter-spacing: 0.03em; }
    .r-estado-programado { background: #eff6ff; color: #2563eb; }
    .r-estado-en_curso { background: #f0fdf4; color: #16a34a; }
    .r-estado-reprogramado { background: #f5f3ff; color: #7c3aed; }
    .r-estado-finalizado { background: #f1f5f9; color: #64748b; }
    .reorden-handle { color: var(--fich-text-faint); cursor: grab; }
    .cdk-drag-preview .reorden-handle { cursor: grabbing; }
    .actions-left { flex: 1; }
    .sin-cambios { font-size: 0.82rem; color: var(--fich-text-faint); font-style: italic; }
    .con-cambios { font-size: 0.82rem; color: var(--fich-warning); font-weight: 600; }
    mat-dialog-actions button mat-icon { margin-right: 4px; }
    mat-dialog-actions button mat-spinner { display: inline-block; margin-right: 4px; vertical-align: middle; }
  `],
})
export class ReordenarModulosDialogComponent {
  private detalleService = inject(DetalleService);
  private snackbar = inject(MatSnackBar);
  private dialogRef = inject(MatDialogRef<ReordenarModulosDialogComponent>);
  private destroyRef = inject(DestroyRef);

  modulos = signal<DetalleProgramaModulo[]>([]);
  saving = signal(false);
  ordenOriginal: number[];

  constructor(@Inject(MAT_DIALOG_DATA) public data: ReordenarModulosData) {
    const ordenados = [...data.modulos].sort((a, b) => a.orden - b.orden);
    this.modulos.set(ordenados);
    this.ordenOriginal = ordenados.map(m => m.id_detalle_programa_modulo);
  }

  hayCambios = computed(() => {
    const current = this.modulos().map(m => m.id_detalle_programa_modulo);
    return current.some((id, i) => id !== this.ordenOriginal[i]);
  });

  etiquetaEstado(estado: string): string {
    const map: Record<string, string> = {
      programado: 'Programado', en_curso: 'En Curso',
      reprogramado: 'Reprogramado', finalizado: 'Finalizado',
    };
    return map[estado] || estado;
  }

  onNoClick() {
    this.dialogRef.close();
  }

  onDrop(event: CdkDragDrop<DetalleProgramaModulo[]>) {
    const items = this.modulos();
    moveItemInArray(items, event.previousIndex, event.currentIndex);
    this.modulos.set([...items]);
  }

  guardar() {
    this.saving.set(true);
    const ordenes = this.modulos().map((m, i) => ({
      id_detalle: m.id_detalle_programa_modulo,
      orden: i + 1,
    }));
    this.detalleService.reordenar({ id_edicion: this.data.idEdicion, ordenes })
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: () => {
          this.saving.set(false);
          this.snackbar.open('Orden guardado con éxito', 'OK', { duration: 3000 });
          this.dialogRef.close(true);
        },
        error: (err) => {
          this.saving.set(false);
          this.snackbar.open(err.error?.detail || 'Error al reordenar', 'Cerrar', { duration: 5000 });
        },
      });
  }
}
