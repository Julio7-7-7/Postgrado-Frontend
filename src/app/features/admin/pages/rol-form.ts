import { Component, OnInit, signal, inject, Inject, DestroyRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormsModule } from '@angular/forms';
import { MatDialogModule, MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatExpansionModule } from '@angular/material/expansion';
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
    MatInputModule, MatCheckboxModule, MatExpansionModule,
    MatProgressSpinnerModule, MatSnackBarModule,
  ],
  template: `
    <h2 mat-dialog-title>{{ esEdicion() ? 'Editar Rol' : 'Nuevo Rol' }}</h2>

    <mat-dialog-content>
      <mat-form-field appearance="outline" class="full-width">
        <mat-label>Nombre del rol</mat-label>
        <input matInput [(ngModel)]="nombre" placeholder="Ej: adm_legal" required>
      </mat-form-field>

      <mat-form-field appearance="outline" class="full-width">
        <mat-label>Descripción</mat-label>
        <textarea matInput [(ngModel)]="descripcion" rows="2"></textarea>
      </mat-form-field>

      <h3 style="margin-top: 20px; margin-bottom: 8px;">Permisos</h3>
      @if (isLoadingPermisos()) {
        <div class="loading-permisos"><mat-spinner diameter="24"></mat-spinner> Cargando permisos...</div>
      } @else {
        @for (group of grupos(); track group.prefix) {
          <mat-expansion-panel>
            <mat-expansion-panel-header>
              <mat-panel-title>
                <mat-checkbox [checked]="grupoCompleto(group)"
                              (change)="toggleGrupo(group, $event.checked)"
                              (click)="$event.stopPropagation()">
                  {{ group.label }}
                </mat-checkbox>
              </mat-panel-title>
              <mat-panel-description>
                {{ permisosSeleccionadosGrupo(group) }} / {{ group.permisos.length }}
              </mat-panel-description>
            </mat-expansion-panel-header>

            @for (permiso of group.permisos; track permiso.id_permiso) {
              <div class="permiso-row">
                <mat-checkbox [checked]="selectedIds().has(permiso.id_permiso)"
                              (change)="togglePermiso(permiso.id_permiso, $event.checked)">
                  <code>{{ permiso.codigo }}</code>
                  @if (permiso.descripcion) {
                    <span class="permiso-desc"> — {{ permiso.descripcion }}</span>
                  }
                </mat-checkbox>
              </div>
            }
          </mat-expansion-panel>
        }
      }
    </mat-dialog-content>

    <mat-dialog-actions align="end">
      <button mat-button mat-dialog-close>Cancelar</button>
      <button mat-raised-button color="primary" class="btn-guardar"
              [disabled]="!nombre.trim() || guardando()"
              (click)="guardar()">
        {{ guardando() ? 'Guardando...' : 'Guardar' }}
      </button>
    </mat-dialog-actions>
  `,
  styles: [`
    .full-width { width: 100%; margin-bottom: 12px; }
    .loading-permisos { display: flex; align-items: center; gap: 12px; padding: 24px; color: var(--fich-text-muted, rgba(0,0,0,0.55)); }
    .permiso-row { padding: 4px 0 4px 24px; }
    .permiso-desc { color: var(--fich-text-muted, rgba(0,0,0,0.55)); font-size: 0.9em; }
    code { background: var(--fich-bg-muted, #f5f5f5); padding: 2px 6px; border-radius: 4px; font-size: 0.9em; }
    mat-expansion-panel { margin-bottom: 8px; }
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

  grupos = signal<PermisoGroup[]>([]);

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

  grupoCompleto(group: PermisoGroup): boolean {
    return group.permisos.every(p => this.selectedIds().has(p.id_permiso));
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
