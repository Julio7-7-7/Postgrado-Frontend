import { Component, Inject, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatDialogModule, MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatIconModule } from '@angular/material/icon';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { UserAdminResponse, UserAdminUpdate } from '../models/usuarios.model';
import { UsuariosService } from '../services/usuarios.service';

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
  templateUrl: './usuario-edit-dialog.html',
  styleUrl: './usuario-edit-dialog.css',
})
export class UsuarioEditDialog {
  private service = inject(UsuariosService);
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

    this.service.update(this.data.usuario.id_usuario, payload).subscribe({
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
