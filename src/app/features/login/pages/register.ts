import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule } from '@angular/material/core';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { AuthService } from '../../../core/services/auth.service';

@Component({
  selector: 'app-register',
  standalone: true,
  imports: [
    CommonModule, FormsModule,
    MatButtonModule, MatIconModule,
    MatFormFieldModule, MatInputModule, MatSelectModule,
    MatDatepickerModule, MatNativeDateModule, MatSnackBarModule,
  ],
  templateUrl: './register.html',
  styleUrl: './register.css',
})
export class RegisterComponent implements OnInit {
  private auth = inject(AuthService);
  private router = inject(Router);
  private route = inject(ActivatedRoute);
  private snackBar = inject(MatSnackBar);

  loading = false;
  inscribirId: number | null = null;
  incorporarId: number | null = null;

  currentStep = signal(1);

  email = '';
  password = '';
  confirmPassword = '';
  ci = '';
  pasaporte = '';
  nombre = '';
  apellido = '';
  fechaNacimiento: string | null = null;
  genero: string | null = null;
  celular = '';
  direccion = '';
  honeypot = '';

  generos = ['masculino', 'femenino'];

  showPassword = false;
  showConfirmPassword = false;

  ngOnInit(): void {
    this.inscribirId = Number(this.route.snapshot.queryParams['inscribir']) || null;
    this.incorporarId = Number(this.route.snapshot.queryParams['incorporar']) || null;
    if (this.auth.isLogged()) {
      this.router.navigate(['/']);
    }
  }

  siguiente(): void {
    if (this.currentStep() === 1 && !this.validarPaso1()) return;
    if (this.currentStep() === 2 && !this.validarPaso2()) return;
    this.currentStep.update(s => s + 1);
  }

  anterior(): void {
    this.currentStep.update(s => s - 1);
  }

  private validarPaso1(): boolean {
    if (!this.email || !this.password || !this.confirmPassword) {
      this.snackBar.open('Completá todos los campos', 'Cerrar', { duration: 3000 });
      return false;
    }
    if (this.password !== this.confirmPassword) {
      this.snackBar.open('Las contraseñas no coinciden', 'Cerrar', { duration: 3000 });
      return false;
    }
    if (this.password.length < 6) {
      this.snackBar.open('La contraseña debe tener al menos 6 caracteres', 'Cerrar', { duration: 3000 });
      return false;
    }
    return true;
  }

  private validarPaso2(): boolean {
    if (!this.nombre.trim() || !this.apellido.trim()) {
      this.snackBar.open('Completá nombre y apellido', 'Cerrar', { duration: 3000 });
      return false;
    }
    if (!this.ci.trim() && !this.pasaporte.trim()) {
      this.snackBar.open('Debés proporcionar al menos CI o pasaporte', 'Cerrar', { duration: 3000 });
      return false;
    }
    return true;
  }

  register(): void {
    this.loading = true;
    this.auth.register({
      email: this.email,
      password: this.password,
      ci: this.ci.trim() || null,
      pasaporte: this.pasaporte.trim() || null,
      nombre: this.nombre.trim(),
      apellido: this.apellido.trim(),
      fecha_nacimiento: this.fechaNacimiento,
      genero: this.genero,
      celular: this.celular.trim() || null,
      direccion: this.direccion.trim() || null,
      honeypot: this.honeypot,
    }).subscribe({
      next: (resp) => {
        this.auth.guardarSesion(resp);
        this.loading = false;
        this.snackBar.open('¡Cuenta creada correctamente!', 'Cerrar', { duration: 4000 });

        if (this.incorporarId) {
          this.router.navigate(['/alumnos', 'inscribir', this.incorporarId], { replaceUrl: true });
        } else if (this.inscribirId) {
          this.router.navigate(['/alumnos', 'inscribir', this.inscribirId], { replaceUrl: true });
        } else {
          this.router.navigate(['/alumnos'], { replaceUrl: true });
        }
      },
      error: (err) => {
        this.loading = false;
        const detail = err.error?.detail;
        const msg = Array.isArray(detail)
          ? detail.map((e: any) => e.msg).join(', ')
          : (detail || 'Error al crear la cuenta');
        this.snackBar.open(msg, 'Cerrar', { duration: 4000 });
      },
    });
  }

  goToLogin(): void {
    const params: any = {};
    if (this.inscribirId) params.inscribir = this.inscribirId;
    if (this.incorporarId) params.incorporar = this.incorporarId;
    this.router.navigate(['/login'], { queryParams: Object.keys(params).length ? params : undefined });
  }
}
