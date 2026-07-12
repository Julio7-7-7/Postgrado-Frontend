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
import { MatSnackBarModule, MatSnackBar } from '@angular/material/snack-bar';
import { AdminService } from '../services/admin.service';
import { RolResponse, UserAdminCreate } from '../models/admin.models';

@Component({
  selector: 'app-usuario-form',
  standalone: true,
  imports: [
    CommonModule, FormsModule,
    MatDialogModule, MatButtonModule, MatFormFieldModule,
    MatInputModule, MatSelectModule, MatCheckboxModule, MatSnackBarModule,
  ],
  template: `
    <h2 mat-dialog-title>Nuevo Usuario</h2>

    <mat-dialog-content>
      <mat-form-field appearance="outline" class="full-width">
        <mat-label>Email</mat-label>
        <input matInput [(ngModel)]="email" type="email" required>
      </mat-form-field>

      <mat-form-field appearance="outline" class="full-width">
        <mat-label>Contraseña</mat-label>
        <input matInput [(ngModel)]="password" type="password" required minlength="6">
      </mat-form-field>

      <label class="roles-label">Roles</label>
      <div class="roles-checkboxes">
        @for (r of roles(); track r.id_rol) {
          <mat-checkbox [(ngModel)]="rolesSeleccionados[r.id_rol]">
            {{ r.nombre }}
          </mat-checkbox>
        }
      </div>

      <div class="row">
        <mat-form-field appearance="outline" class="half">
          <mat-label>Nombre</mat-label>
          <input matInput [(ngModel)]="nombre" required>
        </mat-form-field>
        <mat-form-field appearance="outline" class="half">
          <mat-label>Apellido</mat-label>
          <input matInput [(ngModel)]="apellido" required>
        </mat-form-field>
      </div>

      <div class="row">
        <mat-form-field appearance="outline" class="half">
          <mat-label>CI</mat-label>
          <input matInput [(ngModel)]="ci" required>
        </mat-form-field>
        <mat-form-field appearance="outline" class="half">
          <mat-label>Celular</mat-label>
          <input matInput [(ngModel)]="celular">
        </mat-form-field>
      </div>
    </mat-dialog-content>

    <mat-dialog-actions align="end">
      <button mat-button mat-dialog-close>Cancelar</button>
      <button mat-raised-flat color="primary"
              [disabled]="!puedeGuardar() || guardando()"
              (click)="guardar()">
        {{ guardando() ? 'Creando...' : 'Crear Usuario' }}
      </button>
    </mat-dialog-actions>
  `,
  styles: [`
    .full-width { width: 100%; margin-bottom: 12px; }
    .row { display: flex; gap: 12px; margin-bottom: 12px; }
    .half { flex: 1; }
    .roles-label { font-weight: 500; margin-bottom: 8px; display: block; }
    .roles-checkboxes { display: flex; flex-direction: column; gap: 4px; margin-bottom: 16px; }
  `],
})
export class UsuarioFormComponent implements OnInit {
  private service = inject(AdminService);
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

  ngOnInit(): void {
    this.service.getAllRoles().pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
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

    this.service.createUser(data).pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
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
