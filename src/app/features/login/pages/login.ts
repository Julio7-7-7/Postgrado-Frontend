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

interface RoleOption {
  key: string;
  label: string;
  icon: string;
  description: string;
  color: string;
}

const UI_KEY_TO_ROLE: Record<string, string> = {
  administrativo: 'adm_informatico',
  docente: 'docente',
  alumno: 'alumno',
};

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

  step = signal<'roles' | 'form'>('roles');
  selectedRole = signal<string | null>(null);
  email = '';
  password = '';
  loading = false;
  inscribirId: number | null = null;
  roleLoadError = false;

  roles: RoleOption[] = [
    {
      key: 'administrativo',
      label: 'Administrativo',
      icon: 'admin_panel_settings',
      description: 'Personal administrativo y directivo',
      color: '#1e3a8a',
    },
    {
      key: 'alumno',
      label: 'Estudiante',
      icon: 'school',
      description: 'Alumnos de postgrado',
      color: '#0891b2',
    },
    {
      key: 'docente',
      label: 'Docente',
      icon: 'badge',
      description: 'Planta docente',
      color: '#0d9488',
    },
  ];

  roleMap: Record<string, number> = { administrativo: 1, docente: 6, alumno: 7 };

  ngOnInit(): void {
    this.inscribirId = Number(this.route.snapshot.queryParams['inscribir']) || null;

    if (this.auth.isLogged()) {
      if (this.inscribirId && this.auth.user()?.profile_type === 'alumno') {
        this.router.navigate(['/alumnos', 'inscribir', this.inscribirId], { replaceUrl: true });
        return;
      }
      this.redirectAfterLogin();
      return;
    }

    this.auth.getRoles().subscribe({
      next: (roles) => {
        const map: Record<string, number> = {};
        for (const [uiKey, roleName] of Object.entries(UI_KEY_TO_ROLE)) {
          const found = roles.find(r => r.nombre === roleName);
          if (found) map[uiKey] = found.id_rol;
        }
        if (map['administrativo'] && map['docente'] && map['alumno']) {
          this.roleMap = map;
        }
        if (this.inscribirId) {
          this.selectRole('alumno');
        }
      },
      error: () => {
        this.roleLoadError = true;
        if (this.inscribirId) {
          this.selectRole('alumno');
        }
      },
    });
  }

  selectRole(key: string): void {
    this.selectedRole.set(key);
    this.step.set('form');
  }

  volver(): void {
    this.selectedRole.set(null);
    this.step.set('roles');
  }

  login(): void {
    if (!this.email || !this.password) {
      this.snackBar.open('Completá todos los campos', 'Cerrar', { duration: 3000 });
      return;
    }

    const roleKey = this.selectedRole();
    if (!roleKey) return;

    const idRol = this.roleMap[roleKey];
    if (!idRol) {
      this.snackBar.open('Error de configuración: rol no mapeado', 'Cerrar', { duration: 3000 });
      return;
    }

    this.loading = true;
    this.auth.login(this.email, this.password, idRol).subscribe({
      next: (resp) => {
        this.auth.guardarSesion(resp);
        this.loading = false;

        if (this.inscribirId && roleKey === 'alumno') {
          this.router.navigate(['/alumnos', 'inscribir', this.inscribirId], { replaceUrl: true });
        } else {
          this.redirectAfterLogin();
        }
      },
      error: () => {
        this.loading = false;
        this.snackBar.open('Credenciales inválidas', 'Cerrar', { duration: 4000 });
      },
    });
  }

  private redirectAfterLogin(): void {
    const user = this.auth.user();
    if (user?.profile_type === 'alumno') {
      this.router.navigate(['/alumnos']);
    } else {
      this.router.navigate(['/dashboard']);
    }
  }
}
