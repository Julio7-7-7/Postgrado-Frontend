import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule } from '@angular/material/core';
import { MatDividerModule } from '@angular/material/divider';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { AlumnoService } from '../../services/alumno.service';
import { AuthService } from '../../../../core/services/auth.service';
import { Alumno, AlumnoUpdate, GeneroAlumno } from '../../models/alumno.model';

@Component({
  selector: 'app-perfil',
  standalone: true,
  imports: [
    CommonModule, FormsModule,
    MatCardModule, MatButtonModule, MatIconModule, MatFormFieldModule,
    MatInputModule, MatSelectModule, MatDatepickerModule, MatNativeDateModule,
    MatDividerModule, MatSnackBarModule,
  ],
  templateUrl: './perfil.html',
  styleUrl: './perfil.css',
})
export class PerfilComponent implements OnInit {
  private alumnoService = inject(AlumnoService);
  private authService = inject(AuthService);
  private snackBar = inject(MatSnackBar);

  alumno = signal<Alumno | null>(null);
  editando = signal(false);
  cargando = signal(true);
  guardando = signal(false);

  editData: AlumnoUpdate = {};
  generos: GeneroAlumno[] = ['masculino', 'femenino', 'otro'];

  editandoPassword = signal(false);
  guardandoPassword = signal(false);
  passwordActual = '';
  passwordNuevo = '';
  passwordConfirmar = '';
  showPasswordActual = false;
  showPasswordNuevo = false;

  ngOnInit(): void {
    this.cargarPerfil();
  }

  private cargarPerfil(): void {
    this.cargando.set(true);
    this.alumnoService.getMiPerfil().subscribe({
      next: (data) => {
        this.alumno.set(data);
        this.cargando.set(false);
      },
      error: () => {
        this.cargando.set(false);
        this.snackBar.open('Error al cargar perfil', 'Cerrar', { duration: 4000 });
      },
    });
  }

  iniciarEdicion(): void {
    const a = this.alumno();
    if (!a) return;
    this.editData = {
      ci: a.ci,
      pasaporte: a.pasaporte,
      nombre: a.nombre,
      apellido: a.apellido,
      fecha_nacimiento: a.fecha_nacimiento,
      genero: a.genero,
      celular: a.celular,
      correo: a.correo,
      direccion: a.direccion,
    };
    this.editando.set(true);
  }

  cancelarEdicion(): void {
    this.editando.set(false);
    this.editData = {};
  }

  guardar(): void {
    this.guardando.set(true);
    this.alumnoService.actualizarMiPerfil(this.editData).subscribe({
      next: (data) => {
        this.alumno.set(data);
        this.editando.set(false);
        this.guardando.set(false);
        this.snackBar.open('Perfil actualizado', 'Cerrar', { duration: 3000 });
      },
      error: (err) => {
        this.guardando.set(false);
        let msg = 'Error al actualizar perfil';
        if (err.error?.detail) {
          msg = Array.isArray(err.error.detail)
            ? err.error.detail.map((e: any) => e.msg).join(', ')
            : err.error.detail;
        }
        this.snackBar.open(msg, 'Cerrar', { duration: 4000 });
      },
    });
  }

  iniciarCambioPassword(): void {
    this.passwordActual = '';
    this.passwordNuevo = '';
    this.passwordConfirmar = '';
    this.editandoPassword.set(true);
  }

  cancelarCambioPassword(): void {
    this.editandoPassword.set(false);
  }

  guardarPassword(): void {
    if (!this.passwordActual || !this.passwordNuevo || !this.passwordConfirmar) {
      this.snackBar.open('Completá todos los campos', 'Cerrar', { duration: 3000 });
      return;
    }
    if (this.passwordNuevo !== this.passwordConfirmar) {
      this.snackBar.open('Las contraseñas no coinciden', 'Cerrar', { duration: 3000 });
      return;
    }

    this.guardandoPassword.set(true);
    this.authService.cambiarPassword(this.passwordActual, this.passwordNuevo).subscribe({
      next: () => {
        this.editandoPassword.set(false);
        this.guardandoPassword.set(false);
        this.passwordActual = '';
        this.passwordNuevo = '';
        this.passwordConfirmar = '';
        this.snackBar.open('Contraseña actualizada', 'Cerrar', { duration: 3000 });
      },
      error: (err) => {
        this.guardandoPassword.set(false);
        const msg = err.error?.detail || 'Error al cambiar contraseña';
        this.snackBar.open(msg, 'Cerrar', { duration: 4000 });
      },
    });
  }

  getUserInitial(): string {
    const a = this.alumno();
    if (!a) return '?';
    return (a.nombre?.[0] || '?').toUpperCase();
  }

  getUserEmail(): string {
    return this.authService.user()?.email || '';
  }
}
