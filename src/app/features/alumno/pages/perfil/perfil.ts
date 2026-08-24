import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatDividerModule } from '@angular/material/divider';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { AlumnoService } from '../../services/alumno.service';
import { AuthService } from '../../../../core/services/auth.service';
import { Alumno } from '../../models/alumno.model';

@Component({
  selector: 'app-perfil',
  standalone: true,
  imports: [
    CommonModule, FormsModule,
    MatCardModule, MatButtonModule, MatIconModule, MatFormFieldModule,
    MatInputModule, MatDividerModule, MatSnackBarModule,
  ],
  templateUrl: './perfil.html',
  styleUrl: './perfil.css',
})
export class PerfilComponent implements OnInit {
  private alumnoService = inject(AlumnoService);
  private authService = inject(AuthService);
  private snackBar = inject(MatSnackBar);

  alumno = signal<Alumno | null>(null);
  cargando = signal(true);

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

  getPasswordChangedText(): string {
    const user = this.authService.user();
    if (!user?.password_changed_at) return 'Tu contraseña protege el acceso a tu cuenta.';
    const changed = new Date(user.password_changed_at);
    const now = new Date();
    const diffMs = now.getTime() - changed.getTime();
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
    if (diffDays === 0) return 'Contraseña cambiada hoy.';
    if (diffDays === 1) return 'Contraseña cambiada ayer.';
    if (diffDays < 30) return `Contraseña cambiada hace ${diffDays} días.`;
    if (diffDays < 365) {
      const months = Math.floor(diffDays / 30);
      return `Contraseña cambiada hace ${months} ${months === 1 ? 'mes' : 'meses'}.`;
    }
    return `Contraseña cambiada el ${changed.toLocaleDateString('es-BO')}.`;
  }
}
