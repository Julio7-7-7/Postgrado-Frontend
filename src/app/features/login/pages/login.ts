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
import { AuthService, RolInfo } from '../../../core/services/auth.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [
    CommonModule, FormsModule,
    MatCardModule, MatButtonModule, MatIconModule,
    MatFormFieldModule, MatInputModule, MatSnackBarModule,
  ],
  templateUrl: './login.html',
  styleUrl: './login.css',
})
export class LoginComponent implements OnInit {
  private auth = inject(AuthService);
  private router = inject(Router);
  private route = inject(ActivatedRoute);
  private snackBar = inject(MatSnackBar);

  step = signal<'credentials' | 'roles'>('credentials');
  userRoles = signal<RolInfo[]>([]);
  loginUserId = signal<number>(0);
  email = '';
  password = '';
  loading = false;
  inscribirId: number | null = null;

  ngOnInit(): void {
    this.inscribirId = Number(this.route.snapshot.queryParams['inscribir']) || null;

    if (this.auth.isLogged()) {
      const user = this.auth.user();
      if (this.inscribirId && user?.rol === 'alumno') {
        this.router.navigate(['/alumnos', 'inscribir', this.inscribirId], { replaceUrl: true });
        return;
      }
      this.redirectAfterLogin(user?.rol || '', user?.id_profile);
      return;
    }
  }

  login(): void {
    if (!this.email || !this.password) {
      this.snackBar.open('Completá todos los campos', 'Cerrar', { duration: 3000 });
      return;
    }

    this.loading = true;
    this.auth.login(this.email, this.password).subscribe({
      next: (resp) => {
        this.loading = false;
        this.userRoles.set(resp.roles);
        this.loginUserId.set(resp.id_usuario);

        if (this.inscribirId) {
          const rolAlumno = resp.roles.find(r => r.nombre === 'alumno');
          if (rolAlumno) {
            this.seleccionarRol(rolAlumno.id_rol);
            return;
          }
        }

        if (resp.roles.length === 1) {
          this.seleccionarRol(resp.roles[0].id_rol);
        } else {
          this.step.set('roles');
        }
      },
      error: (err) => {
        this.loading = false;
        const msg = err.error?.detail || 'Credenciales inválidas';
        this.snackBar.open(msg, 'Cerrar', { duration: 6000 });
      },
    });
  }

  seleccionarRol(id_rol: number): void {
    this.loading = true;
    this.auth.seleccionarRol(this.loginUserId(), id_rol).subscribe({
      next: (resp) => {
        this.auth.guardarSesion(resp);
        this.loading = false;

        if (this.inscribirId && resp.user.rol === 'alumno') {
          this.router.navigate(['/alumnos', 'inscribir', this.inscribirId], { replaceUrl: true });
        } else {
          this.redirectAfterLogin(resp.user.rol, resp.user.id_profile);
        }
      },
      error: () => {
        this.loading = false;
        this.snackBar.open('Error al seleccionar rol', 'Cerrar', { duration: 4000 });
      },
    });
  }

  volver(): void {
    this.step.set('credentials');
    this.userRoles.set([]);
  }

  getRolIcon(nombre: string): string {
    const icons: Record<string, string> = {
      'adm_informatico': 'admin_panel_settings',
      'adm_legal': 'gavel',
      'adm_contable': 'account_balance',
      'adm_director': 'business',
      'adm_pasante': 'support_agent',
      'docente': 'badge',
      'alumno': 'school',
    };
    return icons[nombre] || 'person';
  }

  getRolLabel(nombre: string): string {
    const labels: Record<string, string> = {
      'adm_informatico': 'Administrador',
      'adm_legal': 'Adm. Legal',
      'adm_contable': 'Adm. Contable',
      'adm_director': 'Director',
      'adm_pasante': 'Pasante',
      'docente': 'Docente',
      'alumno': 'Estudiante',
    };
    return labels[nombre] || nombre;
  }

  getRolColor(nombre: string): string {
    const colors: Record<string, string> = {
      'adm_informatico': '#1e3a8a',
      'adm_legal': '#7c3aed',
      'adm_contable': '#d97706',
      'adm_director': '#0d9488',
      'adm_pasante': '#6b7280',
      'docente': '#0d9488',
      'alumno': '#0891b2',
    };
    return colors[nombre] || '#4338ca';
  }

  private redirectAfterLogin(rol: string, id_profile?: number | null): void {
    if (rol === 'alumno') {
      this.router.navigate(['/']);
    } else if (rol === 'docente' && id_profile) {
      this.router.navigate(['/docentes', id_profile]);
    } else {
      this.router.navigate(['/dashboard']);
    }
  }

  goToRegister(): void {
    if (this.inscribirId) {
      this.router.navigate(['/registro'], { queryParams: { inscribir: this.inscribirId } });
    } else {
      this.router.navigate(['/registro']);
    }
  }
}
