import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { AuthService } from '../../../core/services/auth.service';

@Component({
  selector: 'app-register',
  standalone: true,
  imports: [
    CommonModule, FormsModule,
    MatCardModule, MatButtonModule, MatIconModule,
    MatFormFieldModule, MatInputModule, MatSnackBarModule,
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

  email = '';
  password = '';
  confirmPassword = '';
  ci = '';
  honeypot = '';

  showPassword = false;
  showConfirmPassword = false;

  ngOnInit(): void {
    this.inscribirId = Number(this.route.snapshot.queryParams['inscribir']) || null;
    if (this.auth.isLogged()) {
      this.router.navigate(['/']);
    }
  }

  register(): void {
    if (!this.email || !this.password || !this.confirmPassword || !this.ci) {
      this.snackBar.open('Completá todos los campos', 'Cerrar', { duration: 3000 });
      return;
    }

    if (this.password !== this.confirmPassword) {
      this.snackBar.open('Las contraseñas no coinciden', 'Cerrar', { duration: 3000 });
      return;
    }

    if (this.password.length < 6) {
      this.snackBar.open('La contraseña debe tener al menos 6 caracteres', 'Cerrar', { duration: 3000 });
      return;
    }

    this.loading = true;
    this.auth.register({
      email: this.email,
      password: this.password,
      ci: this.ci,
      honeypot: this.honeypot,
    }).subscribe({
      next: (resp) => {
        this.auth.guardarSesion(resp);
        this.loading = false;
        this.snackBar.open('¡Cuenta creada! Completá tu perfil para inscribirte', 'Cerrar', { duration: 4000 });

        if (this.inscribirId) {
          this.router.navigate(['/alumnos', 'inscribir', this.inscribirId], { replaceUrl: true });
        } else {
          this.router.navigate(['/alumnos/perfil'], { replaceUrl: true });
        }
      },
      error: (err) => {
        this.loading = false;
        const msg = err.error?.detail || 'Error al crear la cuenta';
        this.snackBar.open(msg, 'Cerrar', { duration: 4000 });
      },
    });
  }

  goToLogin(): void {
    if (this.inscribirId) {
      this.router.navigate(['/login'], { queryParams: { inscribir: this.inscribirId } });
    } else {
      this.router.navigate(['/login']);
    }
  }
}
