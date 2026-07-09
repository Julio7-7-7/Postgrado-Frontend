import { Component, signal, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { AuthService, RolInfo } from '../../../core/services/auth.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [
    CommonModule, FormsModule,
    MatButtonModule, MatIconModule, MatFormFieldModule, MatInputModule,
    MatSelectModule, MatSnackBarModule, MatProgressSpinnerModule,
  ],
  templateUrl: './login.html',
  styleUrl: './login.css',
})
export class LoginComponent implements OnInit {
  private auth = inject(AuthService);
  private router = inject(Router);
  private snackBar = inject(MatSnackBar);

  roles = signal<RolInfo[]>([]);
  selectedRol = signal<number | null>(null);
  email = signal('');
  password = signal('');
  loading = signal(false);

  ngOnInit() {
    if (this.auth.isLogged()) {
      this.router.navigate(['/']);
      return;
    }
    this.auth.getRoles().subscribe({
      next: (r) => this.roles.set(r),
      error: () => this.snackBar.open('Error al cargar roles', 'Cerrar', { duration: 4000 }),
    });
  }

  login() {
    if (!this.selectedRol() || !this.email() || !this.password()) {
      this.snackBar.open('Complete todos los campos', 'Cerrar', { duration: 3000 });
      return;
    }
    this.loading.set(true);
    this.auth.login(this.email(), this.password(), this.selectedRol()!).subscribe({
      next: (resp) => {
        this.auth.guardarSesion(resp);
        this.router.navigate(['/']);
      },
      error: () => {
        this.loading.set(false);
        this.snackBar.open('Credenciales inválidas', 'Cerrar', { duration: 4000 });
      },
    });
  }
}
