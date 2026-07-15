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
import { RolesService } from '../../services/roles.service';
import { PermisoResponse, RolResponse, RolCreate, RolUpdate } from '../../models/roles.model';

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
  templateUrl: './rol-form.html',
  styleUrl: './rol-form.css',
})
export class RolFormComponent implements OnInit {
  private service = inject(RolesService);
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
      this.service.update(this.data.id_rol, data).pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
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
      this.service.create(data).pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
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
