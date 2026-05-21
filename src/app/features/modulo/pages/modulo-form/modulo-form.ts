import { Component, OnInit, signal, inject, DestroyRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatDividerModule } from '@angular/material/divider';
import { MatIconModule } from '@angular/material/icon';
import { MatSnackBarModule, MatSnackBar } from '@angular/material/snack-bar';
import { ModuloService } from '../../services/modulo.service';
import { ProgramaVersionService } from '../../../programa-version/services/programa-version.service';
import { ModuloCreate } from '../../models/modulo.model';

@Component({
  selector: 'app-modulo-form',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    RouterLink,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatButtonModule,
    MatCardModule,
    MatDividerModule,
    MatIconModule,
    MatSnackBarModule,
  ],
  templateUrl: './modulo-form.html',
  styleUrl: './modulo-form.css',
})
export class ModuloFormComponent implements OnInit {
  private fb = inject(FormBuilder);
  private moduloService = inject(ModuloService);
  private versionService = inject(ProgramaVersionService);
  private router = inject(Router);
  private route = inject(ActivatedRoute);
  private snackbar = inject(MatSnackBar);
  private destroyRef = inject(DestroyRef);

  form: FormGroup;
  idPrograma = signal<number>(0);
  idVersion = signal<number>(0);
  idEditando: number | null = null;
  loading = signal(false);
  cargandoDatos = signal(false);
  infoVersion = signal('');

  constructor() {
    this.form = this.fb.group({
      sigla: ['', [Validators.required, Validators.maxLength(20)]],
      nombre_modulo: ['', [Validators.required, Validators.minLength(3), Validators.maxLength(200)]],
      horas_academicas: [null, [Validators.required, Validators.min(1)]],
      creditos: [null, [Validators.required, Validators.min(1)]],
      descripcion: ['', [Validators.maxLength(500)]],
      estado: ['activo', Validators.required],
    });
  }

  ngOnInit(): void {
    const versionId = this.route.parent?.snapshot.paramMap.get('versionId');
    const programaId = this.route.parent?.parent?.snapshot.paramMap.get('id');

    if (!versionId) {
      this.snackbar.open('Versión no especificada', 'Cerrar', { duration: 4000 });
      this.router.navigate(['/programas']);
      return;
    }

    this.idVersion.set(+versionId);
    this.idPrograma.set(programaId ? +programaId : 0);
    this.cargarVersion(+versionId);

    const moduloId = this.route.snapshot.paramMap.get('moduloId');
    if (moduloId) {
      this.idEditando = +moduloId;
      this.cargarDatosParaEditar(this.idEditando);
    }
  }

  private cargarVersion(id: number) {
    this.versionService.getById(id).pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: (data) => {
        this.infoVersion.set(`${data.programa.nombre_programa} — v${data.version}`);
        if (data.programa.estado !== 'activo' && !this.idEditando) {
          this.snackbar.open('No se pueden agregar módulos a un programa inactivo', 'Cerrar', { duration: 4000 });
          this.router.navigate(['/programas', data.id_programa, 'versiones', id, 'modulos']);
        }
      },
      error: () => this.router.navigate(['/programas']),
    });
  }

  private cargarDatosParaEditar(id: number) {
    this.cargandoDatos.set(true);
    this.moduloService.getById(id).pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: (data) => {
        this.form.patchValue(data);
        this.cargandoDatos.set(false);
      },
      error: () => {
        this.cargandoDatos.set(false);
        this.snackbar.open('Error al cargar los datos del módulo', 'Cerrar', { duration: 4000 });
        this.router.navigate(['/programas', this.idPrograma(), 'versiones', this.idVersion(), 'modulos']);
      },
    });
  }

  guardar() {
    if (this.form.invalid) return;

    this.loading.set(true);
    const datos: ModuloCreate = {
      ...this.form.value,
      id_programa_version: this.idVersion(),
    };

    const peticion = this.idEditando
      ? this.moduloService.update(this.idEditando, datos)
      : this.moduloService.create(datos);

    peticion.pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: () => {
        this.loading.set(false);
        const mensaje = this.idEditando ? 'Módulo actualizado con éxito' : 'Módulo creado con éxito';
        this.snackbar.open(mensaje, 'OK', { duration: 3000 });
        this.router.navigate(['/programas', this.idPrograma(), 'versiones', this.idVersion(), 'modulos']);
      },
      error: (err) => {
        this.loading.set(false);
        this.snackbar.open(
          err.error?.detail || 'Ocurrió un error al procesar la solicitud',
          'Cerrar',
          { duration: 4000 }
        );
      },
    });
  }
}
