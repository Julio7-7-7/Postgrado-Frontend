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
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { SolicitudRequisitoService } from '../../services/solicitud-requisito.service';
import { SolicitudRequisito, Requisito } from '../../models/solicitud-requisito.model';
import { ConfirmDialogComponent } from '../../../../shared/components/confirm-dialog/confirm-dialog';

const TIPOS = [
  { id: 1, codigo: 'incorporacion', label: 'Incorporación', icon: 'how_to_reg' },
  { id: 2, codigo: 'migracion', label: 'Migración', icon: 'swap_horiz' },
  { id: 3, codigo: 'reincorporacion', label: 'Reincorporación', icon: 'replay' },
] as const;

@Component({
  selector: 'app-gestionar-requisitos-incorporacion',
  standalone: true,
  imports: [
    CommonModule, FormsModule,
    MatIconModule, MatButtonModule, MatTooltipModule,
    MatProgressSpinnerModule, MatSelectModule, MatFormFieldModule, MatInputModule,
    MatSnackBarModule, MatDialogModule,
  ],
  template: `
    <div class="page-container">
      <div class="page-toolbar">
        <button mat-icon-button (click)="volver()" class="back-btn" matTooltip="Volver a inscripciones">
          <mat-icon>arrow_back</mat-icon>
        </button>
        <div class="toolbar-titulo">
          <h1><mat-icon>description</mat-icon> Documentos Requeridos</h1>
          <p class="subtitle">Configurá qué documentos se generan por tipo de solicitud</p>
        </div>
      </div>

      <div class="tabs-bar">
        @for (t of tipos; track t.id) {
          <button class="tab-btn" [class.active]="tipo() === t.id" (click)="cambiarTipo(t.id)">
            <mat-icon>{{ t.icon }}</mat-icon>
            <span>{{ t.label }}</span>
            <span class="tab-count" [class.active]="tipo() === t.id">{{ configs()[t.id]?.length ?? 0 }}</span>
          </button>
        }
      </div>

      @if (isLoading()) {
        <div class="loading-state">
          <mat-spinner diameter="36"></mat-spinner>
          <span>Cargando configuración...</span>
        </div>
      } @else {
        <div class="add-card">
          <div class="add-card-header">
            <div class="add-icon">
              <mat-icon>playlist_add</mat-icon>
            </div>
            <div class="add-heading">
              <h3>Agregar requisito</h3>
              <p>Elegí un requisito del catálogo para configurarlo en {{ tipoLabelMap[tipo()] }}</p>
            </div>
          </div>

          <mat-form-field appearance="outline" class="select-field">
            <mat-icon matPrefix>manage_search</mat-icon>
            <mat-select placeholder="Buscar requisito..." (selectionChange)="onRequisitoSelected($event.value)">
              @for (req of requisitosDisponibles(); track req.id_requisito) {
                <mat-option [value]="req.id_requisito">
                  <div class="opt-wrap">
                    <span class="opt-name">{{ req.nombre }}</span>
                    @if (req.descripcion) { <span class="opt-desc">{{ req.descripcion }}</span> }
                  </div>
                </mat-option>
              }
            </mat-select>
          </mat-form-field>

          @if (requisitosDisponibles().length === 0) {
            <div class="all-added">
              <mat-icon>check_circle</mat-icon>
              <span>Todos los requisitos del catálogo ya están configurados para este tipo.</span>
            </div>
          }
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
                  <th class="col-num">#</th>
                  <th>Requisito</th>
                  <th class="col-acciones">Acciones</th>
                </tr>
              </thead>
              <tbody>
                @for (item of items(); track item.id_solicitud_requisito; let i = $index) {
                  <tr class="table-row">
                    <td class="col-num">
                      <span class="row-index">{{ i + 1 }}</span>
                    </td>
                    <td>
                      <div class="req-cell">
                        <div class="req-avatar" [class]="'req-avatar-' + tipoCodigo()">
                          <mat-icon>{{ tipoIcon() }}</mat-icon>
                        </div>
                        <div class="req-info">
                          <span class="req-name">{{ item.requisito_nombre }}</span>
                          @if (descripcionDe(item.id_requisito)) {
                            <span class="req-desc">{{ descripcionDe(item.id_requisito) }}</span>
                          }
                        </div>
                      </div>
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
            <span>Cuando un alumno crea una solicitud de {{ tipoLabelMap[tipo()] }}, se generarán automáticamente los documentos configurados aquí.</span>
          </div>
        }
      }
    </div>
  `,
  styles: [`
    .page-container { width: 90%; max-width: 1240px; margin: 0 auto; padding: 24px; }

    .page-toolbar { display: flex; align-items: center; gap: 14px; margin-bottom: 20px; }
    .back-btn { background: var(--fich-bg-subtle, #f8fafc); border: 1px solid var(--fich-border-light, #e2e8f0); }
    .toolbar-titulo h1 { margin: 0; font-size: 1.35rem; font-weight: 700; display: flex; align-items: center; gap: 8px; }
    .toolbar-titulo h1 mat-icon { color: #0d9488; }
    .subtitle { margin: 4px 0 0; color: var(--fich-text-muted, #64748b); font-size: 0.85rem; }

    .tabs-bar {
      display: flex; gap: 6px; margin-bottom: 20px;
      background: var(--fich-bg-subtle, #f8fafc); border: 1px solid var(--fich-border-light, #e2e8f0);
      border-radius: 12px; padding: 4px;
    }
    .tab-btn {
      flex: 1; display: flex; align-items: center; justify-content: center; gap: 8px;
      padding: 10px 16px; border: none; background: transparent;
      border-radius: 9px; cursor: pointer; font-size: 0.85rem; font-weight: 600;
      color: var(--fich-text-secondary, #475569); transition: all 0.2s;
    }
    .tab-btn mat-icon { font-size: 18px; width: 18px; height: 18px; }
    .tab-btn:hover { background: var(--fich-bg-hover, #f1f5f9); color: var(--fich-text, #1e293b); }
    .tab-btn.active {
      background: white; color: #0d9488; box-shadow: 0 1px 3px rgba(0,0,0,0.08);
    }
    .tab-count {
      min-width: 22px; height: 22px; padding: 0 6px; border-radius: 9999px;
      display: inline-flex; align-items: center; justify-content: center;
      font-size: 0.72rem; font-weight: 700; background: var(--fich-bg-hover, #f1f5f9); color: var(--fich-text-muted, #94a3b8);
      transition: all 0.2s;
    }
    .tab-count.active { background: #ccfbf1; color: #0f766e; }

    .loading-state, .empty-state {
      display: flex; flex-direction: column; align-items: center; gap: 12px;
      padding: 56px 20px; background: white; border-radius: 12px;
      border: 1px solid var(--fich-border-light, #e2e8f0);
    }
    .empty-state mat-icon { font-size: 48px; width: 48px; height: 48px; color: #cbd5e1; }
    .empty-state h4 { margin: 0; font-size: 1rem; color: var(--fich-text-secondary, #475569); }
    .empty-state p { margin: 0; font-size: 0.85rem; color: var(--fich-text-muted, #94a3b8); text-align: center; max-width: 400px; }

    .add-card {
      background: white; border: 1px solid var(--fich-border-light, #e2e8f0);
      border-radius: 12px; padding: 20px; margin-bottom: 20px;
      box-shadow: 0 1px 3px rgba(15, 23, 42, 0.04);
    }
    .add-card-header { display: flex; align-items: center; gap: 12px; margin-bottom: 16px; }
    .add-icon {
      width: 40px; height: 40px; border-radius: 10px; flex-shrink: 0;
      background: #ccfbf1; color: #0f766e;
      display: flex; align-items: center; justify-content: center;
    }
    .add-icon mat-icon { font-size: 20px; width: 20px; height: 20px; }
    .add-heading h3 { margin: 0; font-size: 0.95rem; font-weight: 700; }
    .add-heading p { margin: 2px 0 0; font-size: 0.78rem; color: var(--fich-text-muted, #64748b); }

    .select-field { width: 100%; }

    .all-added {
      display: flex; align-items: center; gap: 8px; margin-top: 12px;
      padding: 10px 14px; background: #f0fdf4; border: 1px solid #bbf7d0; border-radius: 8px;
      font-size: 0.8rem; color: #15803d;
    }
    .all-added mat-icon { font-size: 18px; width: 18px; height: 18px; flex-shrink: 0; }

    .table-container {
      background: white; border-radius: 12px; border: 1px solid var(--fich-border-light, #e2e8f0); overflow: hidden;
    }
    .fich-table { width: 100%; border-collapse: collapse; }
    .fich-table th {
      padding: 12px 16px; text-align: left; font-size: 0.72rem; font-weight: 700;
      text-transform: uppercase; letter-spacing: 0.5px; color: var(--fich-text-muted, #94a3b8);
      background: var(--fich-bg-subtle, #f8fafc); border-bottom: 1px solid var(--fich-border-light, #e2e8f0);
    }
    .fich-table td {
      padding: 14px 16px; font-size: 0.85rem; color: var(--fich-text, #1e293b);
      border-bottom: 1px solid #f1f5f9; vertical-align: middle;
    }
    .table-row { transition: background 0.15s; }
    .table-row:hover { background: var(--fich-bg-hover, #f8fafc); }
    .table-row:last-child td { border-bottom: none; }

    .col-num { width: 48px; }
    .row-index {
      width: 28px; height: 28px; border-radius: 8px;
      display: inline-flex; align-items: center; justify-content: center;
      font-size: 0.78rem; font-weight: 600; color: var(--fich-text-muted, #94a3b8);
      background: var(--fich-bg-subtle, #f8fafc);
    }

    .req-cell { display: flex; align-items: center; gap: 12px; min-width: 0; }
    .req-avatar {
      width: 38px; height: 38px; border-radius: 10px; flex-shrink: 0;
      display: flex; align-items: center; justify-content: center;
    }
    .req-avatar mat-icon { font-size: 18px; width: 18px; height: 18px; }
    .req-avatar-incorporacion { background: #eef2ff; color: #1e3a8a; }
    .req-avatar-migracion { background: #f0fdfa; color: #0d9488; }
    .req-avatar-reincorporacion { background: #f5f3ff; color: #4f46e5; }

    .req-info { display: flex; flex-direction: column; min-width: 0; }
    .req-name { font-weight: 600; }
    .req-desc {
      font-size: 0.75rem; color: var(--fich-text-muted, #94a3b8);
      overflow: hidden; text-overflow: ellipsis; white-space: nowrap; max-width: 720px;
    }

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

  readonly tipos = TIPOS;
  readonly tipoLabelMap: Record<number, string> = {
    1: 'incorporación',
    2: 'migración',
    3: 'reincorporación',
  };

  tipo = signal<number>(1);
  configs = signal<Record<number, SolicitudRequisito[]>>({});
  allRequisitos = signal<Requisito[]>([]);
  isLoading = signal(true);

  items = computed(() => this.configs()[this.tipo()] ?? []);

  tipoCodigo = computed(() => this.tipos.find(t => t.id === this.tipo())?.codigo ?? 'incorporacion');
  tipoIcon = computed(() => this.tipos.find(t => t.id === this.tipo())?.icon ?? 'how_to_reg');

  requisitosDisponibles = computed(() => {
    const configurados = new Set(this.items().map(i => i.id_requisito));
    return this.allRequisitos().filter(r => !configurados.has(r.id_requisito));
  });

  requisitoById = computed(() => new Map(this.allRequisitos().map(r => [r.id_requisito, r] as const)));

  ngOnInit(): void {
    this.cargarDatos();
  }

  cambiarTipo(nuevo: number): void {
    if (this.tipo() === nuevo) return;
    this.tipo.set(nuevo);
  }

  cargarDatos(): void {
    this.isLoading.set(true);
    let pending = TIPOS.length + 1;
    const onComplete = () => {
      if (--pending <= 0) this.isLoading.set(false);
    };

    for (const t of TIPOS) {
      this.service.getRequisitosConfigurados(t.id).pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
        next: data => {
          this.configs.update(c => ({ ...c, [t.id]: data }));
          onComplete();
        },
        error: () => onComplete(),
      });
    }

    this.service.getTodosLosRequisitos().pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: data => { this.allRequisitos.set(data); onComplete(); },
      error: () => onComplete(),
    });
  }

  onRequisitoSelected(idRequisito: number): void {
    this.service.agregarRequisito(idRequisito, this.tipo()).pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: (nuevo) => {
        this.configs.update(c => ({ ...c, [this.tipo()]: [...(c[this.tipo()] ?? []), nuevo] }));
        this.snackBar.open('Requisito agregado', 'Cerrar', { duration: 2000 });
      },
      error: (err) => {
        this.snackBar.open(err.error?.detail || 'Error al agregar requisito', 'Cerrar', { duration: 3000 });
      },
    });
  }

  desactivar(item: SolicitudRequisito): void {
    const tipoLabel = this.tipoLabelMap[this.tipo()] || 'incorporación';
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
            this.configs.update(c => ({
              ...c,
              [this.tipo()]: (c[this.tipo()] ?? []).filter(i => i.id_solicitud_requisito !== item.id_solicitud_requisito),
            }));
            this.snackBar.open('Requisito quitado', 'Cerrar', { duration: 2000 });
          },
          error: () => {
            this.snackBar.open('Error al desactivar', 'Cerrar', { duration: 3000 });
          },
        });
      }
    });
  }

  descripcionDe(idRequisito: number): string | null {
    return this.requisitoById().get(idRequisito)?.descripcion ?? null;
  }

  volver(): void {
    this.router.navigate(['/admin/inscripciones']);
  }
}
