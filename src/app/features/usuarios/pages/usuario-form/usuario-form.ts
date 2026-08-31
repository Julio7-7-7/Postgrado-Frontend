import { Component, OnInit, signal, computed, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule } from '@angular/material/core';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBarModule, MatSnackBar } from '@angular/material/snack-bar';
import { MatTooltipModule } from '@angular/material/tooltip';
import { UsuariosService } from '../../services/usuarios.service';
import { RolesService } from '../../../roles/services/roles.service';
import { UserAdminCreate } from '../../models/usuarios.model';
import { RolResponse } from '../../../roles/models/roles.model';

type TipoPersona = 'alumno' | 'docente' | 'administrativo';

const ROLES_ADMINISTRATIVO = new Set([
  'adm_informatico',
  'adm_legal',
  'adm_contable',
  'adm_director',
  'adm_pasante',
]);

interface TipoCard {
  valor: TipoPersona;
  icono: string;
  titulo: string;
  descripcion: string;
}

@Component({
  selector: 'app-usuario-form',
  standalone: true,
  imports: [
    CommonModule, FormsModule, RouterLink,
    MatButtonModule, MatCardModule, MatFormFieldModule,
    MatInputModule, MatSelectModule, MatCheckboxModule,
    MatDatepickerModule, MatNativeDateModule, MatIconModule,
    MatProgressSpinnerModule, MatSnackBarModule, MatTooltipModule,
  ],
  templateUrl: './usuario-form.html',
  styleUrl: './usuario-form.css',
})
export class UsuarioFormComponent implements OnInit {
  private service = inject(UsuariosService);
  private rolesService = inject(RolesService);
  private snackbar = inject(MatSnackBar);
  private router = inject(Router);

  pasos = ['Tipo', 'Datos', 'Roles'];
  paso = signal(1);

  tipos: TipoCard[] = [
    { valor: 'alumno', icono: 'school', titulo: 'Alumno', descripcion: 'Estudiante que cursa o se inscribe a programas de postgrado' },
    { valor: 'docente', icono: 'cast_for_education', titulo: 'Docente', descripcion: 'Dicta módulos, carga notas y consulta sus horarios' },
    { valor: 'administrativo', icono: 'admin_panel_settings', titulo: 'Administrativo', descripcion: 'Personal de oficina: informático, legal, contable, director o pasante' },
  ];

  tipo = signal<TipoPersona | null>(null);

  email = '';
  nombre = '';
  apellido = '';
  ci = '';
  celular = '';
  numeroRegistro = '';

  fechaNacimiento: Date | null = null;
  genero = '';
  extension = '';
  grado = '';
  titulo = '';

  readonly generos = ['masculino', 'femenino'];
  readonly extensiones = ['LP', 'CB', 'SC', 'CH', 'OR', 'PT', 'TRJ', 'BN', 'PD'];
  readonly grados = ['Dr.', 'MSc.', 'Mg.', 'Esp.', 'Ing.', 'Lic.', 'Otro'];

  roles = signal<RolResponse[]>([]);
  rolesSeleccionados = signal<number[]>([]);

  guardando = signal(false);
  credenciales = signal<{ email: string; password: string } | null>(null);

  tipoLabel = computed(() => {
    const t = this.tipo();
    if (!t) return '';
    return this.tipos.find(tc => tc.valor === t)?.titulo ?? '';
  });

  rolesVisibles = computed(() => {
    const t = this.tipo();
    if (!t) return [];
    if (t === 'administrativo') {
      return this.roles().filter(r => ROLES_ADMINISTRATIVO.has(r.nombre));
    }
    return this.roles().filter(r => r.nombre === t);
  });

  rolesSeleccionadosCount = computed(() => this.rolesSeleccionados().length);

  rolSeleccionado(id: number): boolean {
    return this.rolesSeleccionados().includes(id);
  }

  ngOnInit(): void {
    this.rolesService.getAll().subscribe({
      next: data => {
        this.roles.set(data);
        this.preseleccionarRol();
      },
      error: () => this.snackbar.open('No se pudieron cargar los roles', 'Cerrar', { duration: 3000 }),
    });
  }

  seleccionarTipo(t: TipoPersona): void {
    this.tipo.set(t);
    this.preseleccionarRol();
  }

  private preseleccionarRol(): void {
    const t = this.tipo();
    if (!t || this.roles().length === 0) return;
    this.rolesSeleccionados.set(
      this.roles().filter(r => r.nombre === t).map(r => r.id_rol),
    );
  }

  toggleRol(id: number): void {
    const actuales = this.rolesSeleccionados();
    this.rolesSeleccionados.set(
      actuales.includes(id) ? actuales.filter(x => x !== id) : [...actuales, id],
    );
  }

  siguiente(): void {
    if (this.paso() === 1) {
      if (!this.tipo()) {
        this.snackbar.open('Elegí un tipo de persona para continuar', 'Cerrar', { duration: 2500 });
        return;
      }
      this.paso.set(2);
      return;
    }
    if (this.paso() === 2) {
      if (!this.datosValidos()) return;
      this.paso.set(3);
      return;
    }
    this.guardar();
  }

  atras(): void {
    if (this.paso() > 1) this.paso.set(this.paso() - 1);
  }

  datosValidos(): boolean {
    if (!this.email.trim() || !this.email.includes('@')) {
      this.snackbar.open('Ingresá un email válido', 'Cerrar', { duration: 2500 });
      return false;
    }
    if (!this.nombre.trim() || !this.apellido.trim()) {
      this.snackbar.open('Completá nombre y apellido', 'Cerrar', { duration: 2500 });
      return false;
    }
    if (!this.ci.trim() || this.ci.trim().length < 5) {
      this.snackbar.open('El CI debe tener al menos 5 caracteres', 'Cerrar', { duration: 2500 });
      return false;
    }
    return true;
  }

  private rolesSeleccionadosIds(): number[] {
    const visibles = new Set(this.rolesVisibles().map(r => r.id_rol));
    return this.rolesSeleccionados().filter(id => visibles.has(id));
  }

  puedeGuardar(): boolean {
    return this.rolesSeleccionadosCount() > 0 && !this.guardando();
  }

  private formatearFecha(d: Date | null): string | null {
    if (!d) return null;
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${y}-${m}-${day}`;
  }

  guardar(): void {
    const t = this.tipo();
    if (!t) return;
    if (this.rolesSeleccionadosCount() === 0) {
      this.snackbar.open('Seleccioná al menos un rol', 'Cerrar', { duration: 2500 });
      return;
    }

    const data: UserAdminCreate = {
      email: this.email.trim().toLowerCase(),
      tipo_persona: t,
      roles: this.rolesSeleccionadosIds(),
      ci: this.ci.trim(),
      nombre: this.nombre.trim(),
      apellido: this.apellido.trim(),
      celular: this.celular.trim() || null,
    };

    if (t === 'alumno') {
      data.fecha_nacimiento = this.formatearFecha(this.fechaNacimiento);
      data.genero = this.genero || null;
      data.numero_registro = this.numeroRegistro.trim() || null;
    } else if (t === 'docente') {
      data.genero = this.genero || null;
      data.extension = this.extension || null;
      data.grado = this.grado || null;
      data.titulo = this.titulo.trim() || null;
    }

    this.guardando.set(true);
    this.service.create(data).subscribe({
      next: resp => {
        this.guardando.set(false);
        this.credenciales.set({ email: resp.email, password: resp.password_inicial ?? this.ci.trim() });
        this.paso.set(4);
      },
      error: err => {
        this.guardando.set(false);
        this.snackbar.open(err.error?.detail || 'No se pudo crear la persona', 'Cerrar', { duration: 4000 });
      },
    });
  }

  cerrar(): void {
    this.router.navigate(['/usuarios']);
  }

  cancelar(): void {
    if (this.guardando()) return;
    this.router.navigate(['/usuarios']);
  }

  copiar(texto: string): void {
    navigator.clipboard?.writeText(texto).then(
      () => this.snackbar.open('Copiado', 'Cerrar', { duration: 1500 }),
      () => this.snackbar.open('No se pudo copiar', 'Cerrar', { duration: 2500 }),
    );
  }
}
