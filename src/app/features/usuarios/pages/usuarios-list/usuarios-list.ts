import { Component, OnInit, signal, computed, inject, DestroyRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatTableModule } from '@angular/material/table';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBarModule, MatSnackBar } from '@angular/material/snack-bar';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { UsuariosService } from '../../services/usuarios.service';
import { RolesService } from '../../../roles/services/roles.service';
import { UserAdminResponse } from '../../models/usuarios.model';
import { RolResponse } from '../../../roles/models/roles.model';
import { UsuarioFormComponent } from '../usuario-form/usuario-form';
import { RolesChangeDialog } from '../../dialogs/roles-change-dialog';
import { UsuarioEditDialog } from '../../dialogs/usuario-edit-dialog';
import { ConfirmDialogComponent } from '../../../../shared/components/confirm-dialog/confirm-dialog';

@Component({
  selector: 'app-usuarios-list',
  standalone: true,
  imports: [
    CommonModule,
    MatButtonModule, MatIconModule, MatTooltipModule,
    MatTableModule, MatProgressSpinnerModule,
    MatSnackBarModule, MatDialogModule,
  ],
  templateUrl: './usuarios-list.html',
  styleUrl: './usuarios-list.css',
})
export class UsuariosListComponent implements OnInit {
  private service = inject(UsuariosService);
  private rolesService = inject(RolesService);
  private dialog = inject(MatDialog);
  private snackbar = inject(MatSnackBar);
  private destroyRef = inject(DestroyRef);

  usuarios = signal<UserAdminResponse[]>([]);
  roles = signal<RolResponse[]>([]);
  isLoading = signal(true);
  error = signal<string | null>(null);
  columnas = ['email', 'profile', 'roles', 'activo', 'acciones'];

  page = signal(1);
  totalPages = signal(1);
  total = signal(0);
  perPage = 20;

  pageNumbers = computed(() => {
    const total = this.totalPages();
    const current = this.page();
    if (total <= 5) return Array.from({ length: total }, (_, i) => i + 1);
    const start = Math.max(1, current - 2);
    const end = Math.min(total, start + 4);
    return Array.from({ length: end - start + 1 }, (_, i) => start + i);
  });

  rangeEnd = computed(() => Math.min(this.page() * this.perPage, this.total()));

  ngOnInit(): void {
    this.cargarDatos();
    this.rolesService.getAll().pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: data => this.roles.set(data),
      error: () => this.snackbar.open('Error al cargar roles', 'Cerrar', { duration: 3000 }),
    });
  }

  cargarDatos(): void {
    this.isLoading.set(true);
    this.error.set(null);
    this.service.getAll(this.page(), this.perPage).pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: data => {
        this.usuarios.set(data.items);
        this.totalPages.set(data.pages);
        this.total.set(data.total);
        this.isLoading.set(false);
      },
      error: () => { this.error.set('Error al cargar usuarios'); this.isLoading.set(false); },
    });
  }

  paginaAnterior(): void {
    if (this.page() > 1) {
      this.page.update(p => p - 1);
      this.cargarDatos();
    }
  }

  paginaSiguiente(): void {
    if (this.page() < this.totalPages()) {
      this.page.update(p => p + 1);
      this.cargarDatos();
    }
  }

  irAPagina(n: number): void {
    this.page.set(n);
    this.cargarDatos();
  }

  abrirFormulario(): void {
    const dialogRef = this.dialog.open(UsuarioFormComponent, {
      width: '520px',
    });
    dialogRef.afterClosed().pipe(takeUntilDestroyed(this.destroyRef)).subscribe(result => {
      if (result) this.cargarDatos();
    });
  }

  editarUsuario(u: UserAdminResponse): void {
    const dialogRef = this.dialog.open(UsuarioEditDialog, {
      width: '500px',
      data: { usuario: u },
    });
    dialogRef.afterClosed().pipe(takeUntilDestroyed(this.destroyRef)).subscribe(result => {
      if (result) this.cargarDatos();
    });
  }

  cambiarRoles(u: UserAdminResponse): void {
    const dialogRef = this.dialog.open(RolesChangeDialog, {
      width: '400px',
      data: { email: u.email, rolesActuales: u.id_roles, opciones: this.roles() },
    });
    dialogRef.afterClosed().pipe(takeUntilDestroyed(this.destroyRef)).subscribe(result => {
      if (!result) return;
      this.service.updateRoles(u.id_usuario, { roles: result })
        .pipe(takeUntilDestroyed(this.destroyRef))
        .subscribe({
          next: () => {
            this.snackbar.open('Roles actualizados', 'Cerrar', { duration: 3000 });
            this.cargarDatos();
          },
          error: err => this.snackbar.open(err.error?.detail || 'Error', 'Cerrar', { duration: 4000 }),
        });
    });
  }

  toggleActivo(u: UserAdminResponse): void {
    const msg = u.activo ? 'desactivar' : 'activar';
    const dialogRef = this.dialog.open(ConfirmDialogComponent, {
      width: '400px',
      data: { titulo: 'Confirmar', mensaje: `¿${msg} al usuario "${u.email}"?` },
    });
    dialogRef.afterClosed().pipe(takeUntilDestroyed(this.destroyRef)).subscribe(result => {
      if (!result) return;
      this.service.toggleActive(u.id_usuario)
        .pipe(takeUntilDestroyed(this.destroyRef))
        .subscribe({
          next: () => {
            this.snackbar.open(`Usuario ${msg}do`, 'Cerrar', { duration: 3000 });
            this.cargarDatos();
          },
          error: err => this.snackbar.open(err.error?.detail || 'Error', 'Cerrar', { duration: 4000 }),
        });
    });
  }
}
