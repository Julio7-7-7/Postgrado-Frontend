import { Component, OnInit, signal, inject, DestroyRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormsModule } from '@angular/forms';
import { MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBarModule, MatSnackBar } from '@angular/material/snack-bar';
import { UsuariosService } from '../../services/usuarios.service';
import { RolesService } from '../../../roles/services/roles.service';
import { UserAdminCreate } from '../../models/usuarios.model';
import { RolResponse } from '../../../roles/models/roles.model';

@Component({
  selector: 'app-usuario-form',
  standalone: true,
  imports: [
    CommonModule, FormsModule,
    MatDialogModule, MatButtonModule, MatFormFieldModule,
    MatInputModule, MatSelectModule, MatCheckboxModule, MatIconModule,
    MatProgressSpinnerModule, MatSnackBarModule,
  ],
  templateUrl: './usuario-form.html',
  styleUrl: './usuario-form.css',
})
export class UsuarioFormComponent implements OnInit {
  private service = inject(UsuariosService);
  private rolesService = inject(RolesService);
  private snackbar = inject(MatSnackBar);
  private dialogRef = inject(MatDialogRef<UsuarioFormComponent>);
  private destroyRef = inject(DestroyRef);

  roles = signal<RolResponse[]>([]);
  guardando = signal(false);
  rolesSeleccionados: Record<number, boolean> = {};

  email = '';
  password = '';
  nombre = '';
  apellido = '';
  ci = '';
  celular = '';

  rolesSeleccionadosCount(): number {
    return Object.values(this.rolesSeleccionados).filter(v => v).length;
  }

  toggleRol(id: number): void {
    this.rolesSeleccionados[id] = !this.rolesSeleccionados[id];
  }

  ngOnInit(): void {
    this.rolesService.getAll().pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: data => {
        this.roles.set(data);
        for (const r of data) {
          this.rolesSeleccionados[r.id_rol] = false;
        }
      },
      error: () => this.snackbar.open('Error al cargar roles', 'Cerrar', { duration: 3000 }),
    });
  }

  puedeGuardar(): boolean {
    const rolesSeleccionados = Object.entries(this.rolesSeleccionados)
      .filter(([_, seleccionado]) => seleccionado)
      .map(([id]) => Number(id));
    return !!(this.email && this.password.length >= 6 && rolesSeleccionados.length > 0
      && this.nombre && this.apellido && this.ci);
  }

  guardar(): void {
    if (!this.puedeGuardar()) return;
    this.guardando.set(true);

    const rolesSeleccionados = Object.entries(this.rolesSeleccionados)
      .filter(([_, seleccionado]) => seleccionado)
      .map(([id]) => Number(id));

    const data: UserAdminCreate = {
      email: this.email,
      password: this.password,
      roles: rolesSeleccionados,
      nombre: this.nombre,
      apellido: this.apellido,
      ci: this.ci,
      celular: this.celular || null,
    };

    this.service.create(data).pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: () => {
        this.snackbar.open('Usuario creado', 'Cerrar', { duration: 3000 });
        this.dialogRef.close(true);
      },
      error: err => {
        this.guardando.set(false);
        this.snackbar.open(err.error?.detail || 'Error al crear usuario', 'Cerrar', { duration: 4000 });
      },
    });
  }
}
