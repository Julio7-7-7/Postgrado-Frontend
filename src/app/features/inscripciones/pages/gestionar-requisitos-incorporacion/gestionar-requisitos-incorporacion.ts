import { Component, OnInit, inject, signal, computed, DestroyRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSelectModule } from '@angular/material/select';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { SolicitudRequisitoService } from '../../services/solicitud-requisito.service';
import { SolicitudRequisito, Requisito } from '../../models/solicitud-requisito.model';
import { ConfirmDialogComponent } from '../../../../shared/components/confirm-dialog/confirm-dialog';

@Component({
  selector: 'app-gestionar-requisitos-incorporacion',
  standalone: true,
  imports: [
    CommonModule, FormsModule,
    MatIconModule, MatButtonModule, MatTooltipModule,
    MatProgressSpinnerModule, MatSelectModule, MatFormFieldModule, MatInputModule,
    MatCheckboxModule, MatSnackBarModule, MatDialogModule,
  ],
  template: `
    <div class="page-container">
      <div class="header-section">
        <div class="header-left">
          <button mat-icon-button (click)="volver()" class="back-btn" matTooltip="Volver a inscripciones">
            <mat-icon>arrow_back</mat-icon>
          </button>
          <div>
            <h1><mat-icon>description</mat-icon> Documentos Requeridos</h1>
            <p class="subtitle">Configurar qué documentos son requeridos por tipo de solicitud</p>
          </div>
        </div>
      </div>

      <div class="tabs-bar">
        <button class="tab-btn" [class.active]="tipo() === 'incorporacion'" (click)="cambiarTipo('incorporacion')">
          <mat-icon>how_to_reg</mat-icon>
          <span>Incorporación</span>
        </button>
        <button class="tab-btn" [class.active]="tipo() === 'reincorporacion'" (click)="cambiarTipo('reincorporacion')">
          <mat-icon>replay</mat-icon>
          <span>Reincorporación</span>
        </button>
      </div>

      @if (isLoading()) {
        <div class="loading-state">
          <mat-spinner diameter="36"></mat-spinner>
          <span>Cargando configuración...</span>
        </div>
      } @else {
        <div class="add-section">
          <div class="add-row">
            <mat-form-field appearance="outline" class="select-field">
              <mat-label>Agregar requisito</mat-label>
              <mat-select (selectionChange)="onRequisitoSelected($event.value)">
                @for (req of requisitosDisponibles(); track req.id_requisito) {
                  <mat-option [value]="req.id_requisito">{{ req.nombre }}</mat-option>
                }
              </mat-select>
            </mat-form-field>
          </div>
        </div>

        @if (items().length === 0) {
          <div class="empty-state">
            <mat-icon>folder_open</mat-icon>
            <h4>Sin requisitos configurados</h4>
            <p>Agregá requisitos de la lista superior para definir los documentos necesarios.</p>
          </div>
        } @else {
          <div class="table-container">
            <table class="fich-table">
              <thead>
                <tr>
                  <th class="col-nombre">Requisito</th>
                  <th class="col-obligatorio">Obligatorio</th>
                  <th class="col-acciones">Acciones</th>
                </tr>
              </thead>
              <tbody>
                @for (item of items(); track item.id_solicitud_requisito) {
                  <tr class="table-row">
                    <td class="col-nombre">
                      <div class="req-cell">
                        <mat-icon class="req-icon">description</mat-icon>
                        <span class="req-name">{{ item.requisito_nombre }}</span>
                      </div>
                    </td>
                    <td class="col-obligatorio">
                      <mat-checkbox
                        [checked]="item.obligatorio"
                        (change)="toggleObligatorio(item, $event.checked)"
                        color="primary">
                      </mat-checkbox>
                    </td>
                    <td class="col-acciones">
                      <div class="acciones-cell">
                        <button mat-icon-button class="action-icon deactivate-icon"
                                (click)="desactivar(item)" matTooltip="Quitar requisito">
                          <mat-icon>delete_outline</mat-icon>
                        </button>
                      </div>
                    </td>
                  </tr>
                }
              </tbody>
            </table>
          </div>

          <div class="info-note">
            <mat-icon>info</mat-icon>
            <span>Cuando un alumno crea una solicitud de {{ tipo() === 'incorporacion' ? 'incorporación' : 'reincorporación' }}, se generarán automáticamente los documentos configurados aquí.</span>
          </div>
        }
      }
    </div>
  `,
  styles: [`
    .page-container { max-width: 800px; margin: 0 auto; padding: 24px; }
    .header-section { display: flex; align-items: center; justify-content: space-between; margin-bottom: 20px; }
    .header-left { display: flex; align-items: center; gap: 12px; }
    .back-btn { margin-right: 2px; }
    .header-section h1 { margin: 0; font-size: 1.4rem; font-weight: 700; display: flex; align-items: center; gap: 8px; }
    .header-section h1 mat-icon { color: #0d9488; }
    .subtitle { margin: 2px 0 0; color: #64748b; font-size: 0.85rem; }

    .tabs-bar {
      display: flex; gap: 4px; margin-bottom: 20px;
      background: #f1f5f9; border-radius: 10px; padding: 4px;
    }
    .tab-btn {
      flex: 1; display: flex; align-items: center; justify-content: center; gap: 6px;
      padding: 10px 16px; border: none; background: transparent;
      border-radius: 8px; cursor: pointer; font-size: 0.85rem; font-weight: 500;
      color: #64748b; transition: all 0.2s;
    }
    .tab-btn mat-icon { font-size: 18px; width: 18px; height: 18px; }
    .tab-btn:hover { background: #e2e8f0; color: #334155; }
    .tab-btn.active {
      background: white; color: #0d9488; box-shadow: 0 1px 3px rgba(0,0,0,0.08);
    }

    .loading-state, .empty-state {
      display: flex; flex-direction: column; align-items: center; gap: 12px;
      padding: 56px 20px; background: white; border-radius: 12px;
      border: 1px solid #e2e8f0;
    }
    .empty-state mat-icon { font-size: 48px; width: 48px; height: 48px; color: #cbd5e1; }
    .empty-state h4 { margin: 0; font-size: 1rem; color: #64748b; }
    .empty-state p { margin: 0; font-size: 0.85rem; color: #94a3b8; text-align: center; max-width: 400px; }

    .add-section { margin-bottom: 20px; }
    .add-row { display: flex; gap: 12px; align-items: center; }
    .select-field { flex: 1; }

    .table-container {
      background: white; border-radius: 12px; border: 1px solid #e2e8f0; overflow: hidden;
    }
    .fich-table { width: 100%; border-collapse: collapse; }
    .fich-table th {
      padding: 12px 16px; text-align: left; font-size: 0.72rem; font-weight: 700;
      text-transform: uppercase; letter-spacing: 0.5px; color: #94a3b8;
      background: #f8fafc; border-bottom: 1px solid #e2e8f0;
    }
    .fich-table td {
      padding: 14px 16px; font-size: 0.85rem; color: #1e293b;
      border-bottom: 1px solid #f1f5f9; vertical-align: middle;
    }
    .table-row { transition: background 0.15s; }
    .table-row:hover { background: #f8fafc; }
    .table-row:last-child td { border-bottom: none; }

    .req-cell { display: flex; align-items: center; gap: 10px; }
    .req-icon { font-size: 18px; width: 18px; height: 18px; color: #0d9488; }
    .req-name { font-weight: 500; }

    .acciones-cell { display: flex; align-items: center; gap: 4px; }
    .action-icon {
      width: 32px; height: 32px; display: flex; align-items: center; justify-content: center;
      border-radius: 8px; cursor: pointer; transition: all 0.15s; border: none; background: none;
    }
    .action-icon mat-icon { font-size: 18px; width: 18px; height: 18px; }
    .deactivate-icon { color: #ef4444; }
    .deactivate-icon:hover { background: #fee2e2; }

    .info-note {
      display: flex; align-items: center; gap: 8px; margin-top: 16px;
      padding: 12px 16px; background: #f0f9ff; border: 1px solid #bae6fd; border-radius: 8px;
      font-size: 0.8rem; color: #0369a1;
    }
    .info-note mat-icon { font-size: 18px; width: 18px; height: 18px; flex-shrink: 0; }
  `],
})
export class GestionarRequisitosIncorporacionComponent implements OnInit {
  private service = inject(SolicitudRequisitoService);
  private router = inject(Router);
  private snackBar = inject(MatSnackBar);
  private dialog = inject(MatDialog);
  private destroyRef = inject(DestroyRef);

  tipo = signal<'incorporacion' | 'reincorporacion'>('incorporacion');
  items = signal<SolicitudRequisito[]>([]);
  allRequisitos = signal<Requisito[]>([]);
  isLoading = signal(true);

  requisitosDisponibles = computed(() => {
    const configurados = new Set(this.items().map(i => i.id_requisito));
    return this.allRequisitos().filter(r => !configurados.has(r.id_requisito));
  });

  ngOnInit(): void {
    this.cargarDatos();
  }

  cambiarTipo(nuevo: 'incorporacion' | 'reincorporacion'): void {
    if (this.tipo() === nuevo) return;
    this.tipo.set(nuevo);
    this.cargarDatos();
  }

  cargarDatos(): void {
    this.isLoading.set(true);
    this.items.set([]);
    let loaded = 0;
    const onComplete = () => {
      if (++loaded >= 2) this.isLoading.set(false);
    };

    this.service.getRequisitosConfigurados(this.tipo()).pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: data => { this.items.set(data); onComplete(); },
      error: () => {
        this.snackBar.open('Error al cargar requisitos configurados', 'Cerrar', { duration: 3000 });
        onComplete();
      },
    });

    this.service.getTodosLosRequisitos().pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: data => { this.allRequisitos.set(data); onComplete(); },
      error: () => {
        this.snackBar.open('Error al cargar catálogo de requisitos', 'Cerrar', { duration: 3000 });
        onComplete();
      },
    });
  }

  onRequisitoSelected(idRequisito: number): void {
    this.service.agregarRequisito(idRequisito, true, this.tipo()).pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: (nuevo) => {
        this.items.update(items => [...items, nuevo]);
        this.snackBar.open('Requisito agregado', 'Cerrar', { duration: 2000 });
      },
      error: (err) => {
        this.snackBar.open(err.error?.detail || 'Error al agregar requisito', 'Cerrar', { duration: 3000 });
      },
    });
  }

  toggleObligatorio(item: SolicitudRequisito, obligatorio: boolean): void {
    this.service.actualizarObligatorio(item.id_solicitud_requisito, obligatorio).pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: () => {
        this.items.update(items =>
          items.map(i => i.id_solicitud_requisito === item.id_solicitud_requisito ? { ...i, obligatorio } : i)
        );
      },
      error: () => {
        this.snackBar.open('Error al actualizar', 'Cerrar', { duration: 3000 });
      },
    });
  }

  desactivar(item: SolicitudRequisito): void {
    const tipoLabel = this.tipo() === 'incorporacion' ? 'incorporación' : 'reincorporación';
    const dialogRef = this.dialog.open(ConfirmDialogComponent, {
      data: {
        titulo: 'Quitar requisito',
        mensaje: `¿Quitar "${item.requisito_nombre}" de los documentos requeridos para ${tipoLabel}?`,
      },
    });
    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        this.service.toggleEstado(item.id_solicitud_requisito, false).pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
          next: () => {
            this.items.update(items => items.filter(i => i.id_solicitud_requisito !== item.id_solicitud_requisito));
            this.snackBar.open('Requisito quitado', 'Cerrar', { duration: 2000 });
          },
          error: () => {
            this.snackBar.open('Error al desactivar', 'Cerrar', { duration: 3000 });
          },
        });
      }
    });
  }

  volver(): void {
    this.router.navigate(['/admin/inscripciones']);
  }
}
