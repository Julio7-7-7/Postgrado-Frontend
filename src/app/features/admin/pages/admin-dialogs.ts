import { Component, Inject, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatDialogModule, MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatIconModule } from '@angular/material/icon';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { RolResponse, UserAdminResponse, UserAdminUpdate } from '../models/admin.models';
import { AdminService } from '../services/admin.service';

export interface ConfirmData {
  message: string;
}

@Component({
  selector: 'app-confirm-dialog',
  standalone: true,
  imports: [CommonModule, MatDialogModule, MatButtonModule, MatIconModule],
  template: `
    <h2 mat-dialog-title>Confirmar</h2>
    <mat-dialog-content>
      <div class="confirm-body">
        <mat-icon class="confirm-icon">warning</mat-icon>
        <p>{{ data.message }}</p>
      </div>
    </mat-dialog-content>
    <mat-dialog-actions align="end">
      <button mat-button mat-dialog-close>Cancelar</button>
      <button mat-raised-button color="warn" [mat-dialog-close]="true">Confirmar</button>
    </mat-dialog-actions>
  `,
  styles: [`
    .confirm-body { display: flex; align-items: flex-start; gap: 12px; padding: 8px 0; }
    .confirm-icon { color: #d97706; flex-shrink: 0; margin-top: 2px; }
    .confirm-body p { margin: 0; line-height: 1.5; }
  `],
})
export class ConfirmDialog {
  constructor(
    public dialogRef: MatDialogRef<ConfirmDialog>,
    @Inject(MAT_DIALOG_DATA) public data: ConfirmData,
  ) {}
}

export interface RolesChangeData {
  email: string;
  rolesActuales: number[];
  opciones: RolResponse[];
}

@Component({
  selector: 'app-roles-change-dialog',
  standalone: true,
  imports: [
    CommonModule, FormsModule,
    MatButtonModule, MatDialogModule, MatCheckboxModule, MatIconModule,
  ],
  styles: [`
    .roles-header { display: flex; align-items: center; gap: 8px; margin-bottom: 16px; }
    .roles-header mat-icon { color: #4f46e5; }
    .roles-list { display: flex; flex-direction: column; gap: 4px; }
    .role-option { display: flex; align-items: center; gap: 8px; padding: 8px 12px; border-radius: 8px; transition: background 0.15s; }
    .role-option:hover { background: #f8fafc; }
    .role-desc { font-size: 0.78rem; color: #94a3b8; margin-left: auto; }
  `],
  template: `
    <h2 mat-dialog-title>Gestionar Roles</h2>
    <mat-dialog-content>
      <div class="roles-header">
        <mat-icon>person</mat-icon>
        <span>{{ data.email }}</span>
      </div>
      <div class="roles-list">
        @for (rol of data.opciones; track rol.id_rol) {
          <div class="role-option">
            <mat-checkbox [(ngModel)]="seleccionados[rol.id_rol]">
              {{ rol.nombre }}
            </mat-checkbox>
            @if (rol.descripcion) {
              <span class="role-desc">{{ rol.descripcion }}</span>
            }
          </div>
        }
      </div>
    </mat-dialog-content>
    <mat-dialog-actions align="end">
      <button mat-button mat-dialog-close>Cancelar</button>
      <button mat-raised-button color="primary" [disabled]="!hayCambios()" (click)="confirmar()">Guardar</button>
    </mat-dialog-actions>
  `,
})
export class RolesChangeDialog implements OnInit {
  seleccionados: Record<number, boolean> = {};

  constructor(
    public dialogRef: MatDialogRef<RolesChangeDialog>,
    @Inject(MAT_DIALOG_DATA) public data: RolesChangeData,
  ) {}

  ngOnInit(): void {
    for (const rol of this.data.opciones) {
      this.seleccionados[rol.id_rol] = this.data.rolesActuales.includes(rol.id_rol);
    }
  }

  hayCambios(): boolean {
    const actuales = this.data.rolesActuales.sort().join(',');
    const nuevos = Object.entries(this.seleccionados)
      .filter(([_, v]) => v)
      .map(([k]) => Number(k))
      .sort()
      .join(',');
    return actuales !== nuevos;
  }

  confirmar(): void {
    const resultado = Object.entries(this.seleccionados)
      .filter(([_, v]) => v)
      .map(([k]) => Number(k));
    this.dialogRef.close(resultado);
  }
}

export interface UsuarioEditData {
  usuario: UserAdminResponse;
}

@Component({
  selector: 'app-usuario-edit-dialog',
  standalone: true,
  imports: [
    CommonModule, FormsModule,
    MatButtonModule, MatDialogModule, MatFormFieldModule, MatInputModule, MatIconModule, MatSnackBarModule,
  ],
  template: `
    <h2 mat-dialog-title>Editar Usuario</h2>
    <mat-dialog-content>
      <div class="edit-email">{{ data.usuario.email }}</div>

      <div class="form-section">
        <mat-form-field appearance="outline" class="full-width">
          <mat-label>Correo electrónico</mat-label>
          <input matInput type="email" [(ngModel)]="form.email" name="email">
        </mat-form-field>

        <mat-form-field appearance="outline" class="full-width">
          <mat-label>Nueva contraseña</mat-label>
          <input matInput type="password" [(ngModel)]="form.password" name="password"
                 placeholder="Dejar vacío para no cambiar" autocomplete="new-password">
        </mat-form-field>
      </div>

      <div class="form-section">
        <mat-form-field appearance="outline" class="full-width">
          <mat-label>CI</mat-label>
          <input matInput type="text" [(ngModel)]="form.ci" name="ci">
        </mat-form-field>

        <div class="form-row">
          <mat-form-field appearance="outline" class="half">
            <mat-label>Nombre</mat-label>
            <input matInput type="text" [(ngModel)]="form.nombre" name="nombre">
          </mat-form-field>

          <mat-form-field appearance="outline" class="half">
            <mat-label>Apellido</mat-label>
            <input matInput type="text" [(ngModel)]="form.apellido" name="apellido">
          </mat-form-field>
        </div>

        <mat-form-field appearance="outline" class="full-width">
          <mat-label>Celular</mat-label>
          <input matInput type="tel" [(ngModel)]="form.celular" name="celular">
        </mat-form-field>
      </div>
    </mat-dialog-content>
    <mat-dialog-actions align="end">
      <button mat-button mat-dialog-close>Cancelar</button>
      <button mat-raised-button color="primary" [disabled]="loading" (click)="guardar()">
        @if (loading) {
          Guardando...
        } @else {
          <mat-icon>save</mat-icon> Guardar
        }
      </button>
    </mat-dialog-actions>
  `,
  styles: [`
    .edit-email {
      font-size: 0.82rem;
      color: #94a3b8;
      margin-bottom: 16px;
    }
    .form-section { margin-bottom: 8px; }
    .full-width { width: 100%; }
    .form-row { display: flex; gap: 12px; }
    .half { flex: 1; }
  `],
})
export class UsuarioEditDialog {
  private service = inject(AdminService);
  private snackBar = inject(MatSnackBar);

  form = {
    email: '',
    password: '',
    ci: '',
    nombre: '',
    apellido: '',
    celular: '',
  };

  loading = false;

  constructor(
    public dialogRef: MatDialogRef<UsuarioEditDialog>,
    @Inject(MAT_DIALOG_DATA) public data: UsuarioEditData,
  ) {
    const u = data.usuario;
    const perfil = u.perfiles.length > 0 ? u.perfiles[0] : null;
    this.form.email = u.email;

    if (perfil) {
      const parts = perfil.nombre.split(' ');
      this.form.nombre = parts[0] || '';
      this.form.apellido = parts.slice(1).join(' ') || '';
    }
  }

  guardar(): void {
    if (!this.form.email) {
      this.snackBar.open('El email es obligatorio', 'Cerrar', { duration: 3000 });
      return;
    }

    this.loading = true;
    const payload: UserAdminUpdate = {
      email: this.form.email,
      ci: this.form.ci || undefined,
      nombre: this.form.nombre || undefined,
      apellido: this.form.apellido || undefined,
      celular: this.form.celular || undefined,
    };

    if (this.form.password) {
      payload.password = this.form.password;
    }

    this.service.updateUser(this.data.usuario.id_usuario, payload).subscribe({
      next: () => {
        this.snackBar.open('Usuario actualizado', 'Cerrar', { duration: 3000 });
        this.loading = false;
        this.dialogRef.close(true);
      },
      error: (err: any) => {
        this.loading = false;
        this.snackBar.open(err.error?.detail || 'Error al actualizar', 'Cerrar', { duration: 4000 });
      },
    });
  }
}
