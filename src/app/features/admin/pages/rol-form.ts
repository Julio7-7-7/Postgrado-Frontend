import { Component, OnInit, signal, computed, inject, Inject, DestroyRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormsModule } from '@angular/forms';
import { MatDialogModule, MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBarModule, MatSnackBar } from '@angular/material/snack-bar';
import { AdminService } from '../services/admin.service';
import { PermisoResponse, RolResponse, RolCreate, RolUpdate } from '../models/admin.models';

interface PermisoGroup {
  prefix: string;
  label: string;
  permisos: PermisoResponse[];
}

@Component({
  selector: 'app-rol-form',
  standalone: true,
  imports: [
    CommonModule, FormsModule,
    MatDialogModule, MatButtonModule, MatFormFieldModule,
    MatInputModule, MatCheckboxModule, MatIconModule,
    MatProgressSpinnerModule, MatSnackBarModule,
  ],
  template: `
    <div class="dialog-header">
      <div class="header-icon">
        <mat-icon>{{ esEdicion() ? 'edit' : 'add_circle' }}</mat-icon>
      </div>
      <div>
        <h2 mat-dialog-title>{{ esEdicion() ? 'Editar Rol' : 'Nuevo Rol' }}</h2>
        <p class="header-sub">{{ esEdicion() ? 'Modificá nombre, descripción y permisos' : 'Definí un nuevo rol con sus permisos' }}</p>
      </div>
    </div>

    <mat-dialog-content>
      <div class="section-card">
        <div class="section-label">
          <mat-icon>info</mat-icon>
          Información básica
        </div>
        <mat-form-field appearance="outline" class="full-width">
          <mat-label>Nombre del rol</mat-label>
          <input matInput [(ngModel)]="nombre" placeholder="Ej: adm_legal" required>
        </mat-form-field>

        <mat-form-field appearance="outline" class="full-width no-margin">
          <mat-label>Descripción</mat-label>
          <textarea matInput [(ngModel)]="descripcion" rows="2" placeholder="Qué hace este rol..."></textarea>
        </mat-form-field>
      </div>

      <div class="section-card">
        <div class="section-label">
          <mat-icon>vpn_key</mat-icon>
          Permisos
          <span class="permisos-badge">{{ selectedIds().size }} / {{ totalPermisos() }}</span>
        </div>

        <div class="permisos-progress">
          <div class="progress-bar" [style.width.%]="porcentajePermisos()"></div>
        </div>

        @if (isLoadingPermisos()) {
          <div class="loading-permisos">
            <mat-spinner diameter="20"></mat-spinner>
            <span>Cargando permisos...</span>
          </div>
        } @else {
          @for (group of grupos(); track group.prefix; let i = $index) {
            <div class="permiso-group" [class.expanded]="panelAbierto() === group.prefix">
              <div class="group-header" (click)="togglePanel(group.prefix)">
                <mat-checkbox [checked]="grupoCompleto(group)"
                              [indeterminate]="grupoParcial(group) && !grupoCompleto(group)"
                              (change)="toggleGrupo(group, $event.checked)"
                              (click)="$event.stopPropagation()">
                  <span class="group-label">{{ group.label }}</span>
                </mat-checkbox>
                <div class="group-meta">
                  <span class="group-count">{{ permisosSeleccionadosGrupo(group) }}/{{ group.permisos.length }}</span>
                  <mat-icon class="expand-icon" [class.rotated]="panelAbierto() === group.prefix">expand_more</mat-icon>
                </div>
              </div>
              @if (panelAbierto() === group.prefix) {
                <div class="group-body">
                  @for (permiso of group.permisos; track permiso.id_permiso) {
                    <label class="permiso-item" [class.checked]="selectedIds().has(permiso.id_permiso)">
                      <mat-checkbox [checked]="selectedIds().has(permiso.id_permiso)"
                                    (change)="togglePermiso(permiso.id_permiso, $event.checked)">
                        <span class="permiso-codigo">{{ permiso.codigo }}</span>
                        @if (permiso.descripcion) {
                          <span class="permiso-desc">{{ permiso.descripcion }}</span>
                        }
                      </mat-checkbox>
                    </label>
                  }
                </div>
              }
            </div>
          }
        }
      </div>
    </mat-dialog-content>

    <mat-dialog-actions align="end">
      <button mat-button mat-dialog-close class="btn-cancel">Cancelar</button>
      <button mat-raised-button color="primary"
              [disabled]="!nombre.trim() || guardando()"
              (click)="guardar()">
        @if (guardando()) {
          <mat-spinner diameter="16"></mat-spinner> Guardando...
        } @else {
          <mat-icon>save</mat-icon> {{ esEdicion() ? 'Actualizar' : 'Crear Rol' }}
        }
      </button>
    </mat-dialog-actions>
  `,
  styles: [`
    .dialog-header {
      display: flex;
      align-items: center;
      gap: 14px;
      padding: 20px 24px 0;
    }

    .header-icon {
      width: 44px;
      height: 44px;
      border-radius: 12px;
      background: linear-gradient(135deg, #4f46e5, #6366f1);
      display: flex;
      align-items: center;
      justify-content: center;
      flex-shrink: 0;
    }

    .header-icon mat-icon {
      font-size: 22px;
      width: 22px;
      height: 22px;
      color: white;
    }

    .dialog-header h2 {
      margin: 0;
      font-size: 1.15rem;
      font-weight: 700;
    }

    .header-sub {
      margin: 2px 0 0;
      font-size: 0.8rem;
      color: #94a3b8;
    }

    mat-dialog-content {
      padding-top: 16px !important;
    }

    .section-card {
      background: #f8fafc;
      border: 1px solid #e2e8f0;
      border-radius: 12px;
      padding: 16px;
      margin-bottom: 16px;
    }

    .section-label {
      display: flex;
      align-items: center;
      gap: 6px;
      font-size: 0.82rem;
      font-weight: 600;
      color: #475569;
      margin-bottom: 12px;
    }

    .section-label mat-icon {
      font-size: 16px;
      width: 16px;
      height: 16px;
      color: #6366f1;
    }

    .full-width { width: 100%; }
    .no-margin { margin-bottom: 0 !important; }

    .permisos-badge {
      margin-left: auto;
      font-size: 0.72rem;
      font-weight: 700;
      padding: 2px 8px;
      border-radius: 6px;
      background: #eef2ff;
      color: #4f46e5;
    }

    .permisos-progress {
      height: 4px;
      background: #e2e8f0;
      border-radius: 4px;
      margin-bottom: 12px;
      overflow: hidden;
    }

    .progress-bar {
      height: 100%;
      background: linear-gradient(90deg, #4f46e5, #6366f1);
      border-radius: 4px;
      transition: width 0.3s ease;
    }

    .loading-permisos {
      display: flex;
      align-items: center;
      gap: 10px;
      padding: 20px;
      color: #94a3b8;
      font-size: 0.85rem;
    }

    .permiso-group {
      background: white;
      border: 1px solid #e2e8f0;
      border-radius: 8px;
      margin-bottom: 6px;
      overflow: hidden;
      transition: border-color 0.2s;
    }

    .permiso-group.expanded {
      border-color: #c7d2fe;
    }

    .group-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 10px 14px;
      cursor: pointer;
      transition: background 0.15s;
    }

    .group-header:hover {
      background: #f8fafc;
    }

    .group-label {
      font-weight: 600;
      font-size: 0.88rem;
    }

    .group-meta {
      display: flex;
      align-items: center;
      gap: 8px;
    }

    .group-count {
      font-size: 0.75rem;
      font-weight: 600;
      color: #94a3b8;
      min-width: 36px;
      text-align: right;
    }

    .expand-icon {
      font-size: 18px;
      width: 18px;
      height: 18px;
      color: #94a3b8;
      transition: transform 0.2s ease;
    }

    .expand-icon.rotated {
      transform: rotate(180deg);
    }

    .group-body {
      padding: 4px 14px 10px;
      border-top: 1px solid #f1f5f9;
    }

    .permiso-item {
      display: block;
      padding: 4px 0;
    }

    .permiso-codigo {
      font-family: 'SF Mono', 'Fira Code', monospace;
      font-size: 0.82rem;
      color: #475569;
      font-weight: 500;
    }

    .permiso-desc {
      display: block;
      font-size: 0.78rem;
      color: #94a3b8;
      margin-left: 28px;
      margin-top: -2px;
    }

    .btn-cancel {
      color: #64748b;
    }

    mat-dialog-actions button mat-spinner {
      display: inline-block;
    }
  `],
})
export class RolFormComponent implements OnInit {
  private service = inject(AdminService);
  private snackbar = inject(MatSnackBar);
  private dialogRef = inject(MatDialogRef<RolFormComponent>);
  private destroyRef = inject(DestroyRef);

  esEdicion = signal(false);
  guardando = signal(false);
  nombre = '';
  descripcion = '';
  selectedIds = signal<Set<number>>(new Set());
  allPermisos = signal<PermisoResponse[]>([]);
  isLoadingPermisos = signal(true);
  panelAbierto = signal<string | null>(null);

  grupos = signal<PermisoGroup[]>([]);

  totalPermisos = computed(() => this.allPermisos().length);
  porcentajePermisos = computed(() => {
    const total = this.totalPermisos();
    return total === 0 ? 0 : (this.selectedIds().size / total) * 100;
  });

  constructor(@Inject(MAT_DIALOG_DATA) public data: RolResponse | null) {}

  ngOnInit(): void {
    if (this.data) {
      this.esEdicion.set(true);
      this.nombre = this.data.nombre;
      this.descripcion = this.data.descripcion || '';
      this.selectedIds.set(new Set(this.data.permisos.map(p => p.id_permiso)));
    }
    this.cargarPermisos();
  }

  cargarPermisos(): void {
    this.isLoadingPermisos.set(true);
    this.service.getAllPermisos().pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: data => {
        this.allPermisos.set(data);
        this.grupos.set(this.agruparPermisos(data));
        this.isLoadingPermisos.set(false);
      },
      error: () => {
        this.isLoadingPermisos.set(false);
        this.snackbar.open('Error al cargar permisos', 'Cerrar', { duration: 3000 });
      },
    });
  }

  private agruparPermisos(permisos: PermisoResponse[]): PermisoGroup[] {
    const prefixLabel: Record<string, string> = {
      dashboard: 'Dashboard',
      programas: 'Programas',
      ediciones: 'Ediciones',
      modulos: 'Módulos',
      docentes: 'Docentes',
      contrataciones: 'Contrataciones',
      horarios: 'Horarios',
      alumnos: 'Alumnos',
      documentos: 'Documentación',
      pagos: 'Pagos',
      tipos_programa: 'Tipos de Programa',
      modalidades_academicas: 'Modalidades Académicas',
      requisitos: 'Requisitos',
      tipos_descuento: 'Tipos de Descuento',
      historial: 'Historial',
      notas: 'Notas',
      roles: 'Roles y Usuarios',
      usuarios: 'Roles y Usuarios',
    };
    const groups = new Map<string, PermisoResponse[]>();
    for (const p of permisos) {
      const prefix = p.codigo.split('.')[0];
      const key = prefixLabel[prefix] || prefix;
      if (!groups.has(key)) groups.set(key, []);
      groups.get(key)!.push(p);
    }
    return Array.from(groups.entries()).map(([label, items]) => ({
      prefix: label,
      label,
      permisos: items,
    }));
  }

  togglePermiso(id: number, checked: boolean): void {
    const set = new Set(this.selectedIds());
    checked ? set.add(id) : set.delete(id);
    this.selectedIds.set(set);
  }

  toggleGrupo(group: PermisoGroup, checked: boolean): void {
    const set = new Set(this.selectedIds());
    for (const p of group.permisos) {
      checked ? set.add(p.id_permiso) : set.delete(p.id_permiso);
    }
    this.selectedIds.set(set);
  }

  togglePanel(prefix: string): void {
    this.panelAbierto.set(this.panelAbierto() === prefix ? null : prefix);
  }

  grupoCompleto(group: PermisoGroup): boolean {
    return group.permisos.every(p => this.selectedIds().has(p.id_permiso));
  }

  grupoParcial(group: PermisoGroup): boolean {
    const count = group.permisos.filter(p => this.selectedIds().has(p.id_permiso)).length;
    return count > 0 && count < group.permisos.length;
  }

  permisosSeleccionadosGrupo(group: PermisoGroup): number {
    return group.permisos.filter(p => this.selectedIds().has(p.id_permiso)).length;
  }

  guardar(): void {
    if (!this.nombre.trim()) return;
    this.guardando.set(true);
    const permisos = Array.from(this.selectedIds());

    if (this.esEdicion() && this.data) {
      const data: RolUpdate = { nombre: this.nombre, descripcion: this.descripcion || null, permisos };
      this.service.updateRol(this.data.id_rol, data).pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
        next: () => {
          this.snackbar.open('Rol actualizado', 'Cerrar', { duration: 3000 });
          this.dialogRef.close(true);
        },
        error: err => {
          this.guardando.set(false);
          this.snackbar.open(err.error?.detail || 'Error al actualizar', 'Cerrar', { duration: 4000 });
        },
      });
    } else {
      const data: RolCreate = { nombre: this.nombre, descripcion: this.descripcion || null, permisos };
      this.service.createRol(data).pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
        next: () => {
          this.snackbar.open('Rol creado', 'Cerrar', { duration: 3000 });
          this.dialogRef.close(true);
        },
        error: err => {
          this.guardando.set(false);
          this.snackbar.open(err.error?.detail || 'Error al crear', 'Cerrar', { duration: 4000 });
        },
      });
    }
  }
}
