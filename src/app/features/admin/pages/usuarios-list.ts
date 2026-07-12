import { Component, OnInit, signal, inject, DestroyRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatTableModule } from '@angular/material/table';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBarModule, MatSnackBar } from '@angular/material/snack-bar';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { AdminService } from '../services/admin.service';
import { UserAdminResponse, RolResponse } from '../models/admin.models';
import { UsuarioFormComponent } from './usuario-form';
import { ConfirmDialog, RolesChangeDialog } from './admin-dialogs';

@Component({
  selector: 'app-usuarios-list',
  standalone: true,
  imports: [
    CommonModule,
    MatButtonModule, MatIconModule, MatTooltipModule,
    MatTableModule, MatProgressSpinnerModule,
    MatSnackBarModule, MatDialogModule, ConfirmDialog, RolesChangeDialog,
  ],
  templateUrl: './usuarios-list.html',
  styleUrl: './usuarios-list.css',
})
export class UsuariosListComponent implements OnInit {
  private service = inject(AdminService);
  private dialog = inject(MatDialog);
  private snackbar = inject(MatSnackBar);
  private destroyRef = inject(DestroyRef);

  usuarios = signal<UserAdminResponse[]>([]);
  roles = signal<RolResponse[]>([]);
  isLoading = signal(true);
  error = signal<string | null>(null);
  columnas = ['email', 'profile', 'roles', 'activo', 'acciones'];

  ngOnInit(): void {
    this.cargarDatos();
    this.service.getAllRoles().pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: data => this.roles.set(data),
      error: () => this.snackbar.open('Error al cargar roles', 'Cerrar', { duration: 3000 }),
    });
  }

  cargarDatos(): void {
    this.isLoading.set(true);
    this.error.set(null);
    this.service.getAllUsers().pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: data => { this.usuarios.set(data); this.isLoading.set(false); },
      error: () => { this.error.set('Error al cargar usuarios'); this.isLoading.set(false); },
    });
  }

  abrirFormulario(): void {
    const dialogRef = this.dialog.open(UsuarioFormComponent, {
      width: '500px',
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
      this.service.updateUserRoles(u.id_usuario, { roles: result })
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
    const dialogRef = this.dialog.open(ConfirmDialog, {
      id: 'confirm-dialog',
      width: '400px',
      data: { message: `¿${msg} al usuario "${u.email}"?` },
    });
    dialogRef.afterClosed().pipe(takeUntilDestroyed(this.destroyRef)).subscribe(result => {
      if (!result) return;
      this.service.toggleUserActive(u.id_usuario)
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
