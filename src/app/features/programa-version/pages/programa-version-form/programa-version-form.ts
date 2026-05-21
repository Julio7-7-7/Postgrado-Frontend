import { Component, OnInit, signal, inject, DestroyRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';

import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatDividerModule } from '@angular/material/divider';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBarModule, MatSnackBar } from '@angular/material/snack-bar';

import { ProgramaVersionService } from '../../services/programa-version.service';
import { ProgramaService } from '../../../programa/services/programa.service';
import { ProgramaVersionCreate } from '../../models/programa-version.model';
import { environment } from '../../../../../environments/environment';

@Component({
  selector: 'app-programa-version-form',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    RouterLink,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatCardModule,
    MatDividerModule,
    MatIconModule,
    MatProgressSpinnerModule,
    MatSnackBarModule,
  ],
  templateUrl: './programa-version-form.html',
  styleUrl: './programa-version-form.css',
})
export class ProgramaVersionFormComponent implements OnInit {
  private fb = inject(FormBuilder);
  private versionService = inject(ProgramaVersionService);
  private programaService = inject(ProgramaService);
  private router = inject(Router);
  private route = inject(ActivatedRoute);
  private snackbar = inject(MatSnackBar);
  private destroyRef = inject(DestroyRef);

  form: FormGroup;
  idPrograma = signal<number>(0);
  idEditando: number | null = null;
  loading = signal(false);
  cargandoDatos = signal(false);
  nombrePrograma = signal('');

  fotoPreview = signal<string | null>(null);
  fotoBase64 = signal<string | null>(null);
  fotoActual = signal<string | null>(null);
  archivoSeleccionado = signal<boolean>(false);

  constructor() {
    this.form = this.fb.group({
      descripcion: ['', [Validators.maxLength(500)]],
    });
  }

  ngOnInit(): void {
    const id = this.route.parent?.snapshot.paramMap.get('id');
    if (!id) {
      this.snackbar.open('Programa no especificado', 'Cerrar', { duration: 4000 });
      this.router.navigate(['/programas']);
      return;
    }
    this.idPrograma.set(+id);
    this.cargarPrograma(+id);

    const versionId = this.route.snapshot.paramMap.get('versionId');
    if (versionId) {
      this.idEditando = +versionId;
      this.cargarDatosParaEditar(this.idEditando);
    }
  }

  private cargarPrograma(id: number) {
    this.programaService.getById(id).pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: (data) => {
        this.nombrePrograma.set(data.nombre_programa);
        if (data.estado !== 'activo' && !this.idEditando) {
          this.snackbar.open('No se pueden agregar versiones a un programa inactivo', 'Cerrar', { duration: 4000 });
          this.router.navigate(['/programas', id, 'versiones']);
        }
      },
      error: () => this.router.navigate(['/programas']),
    });
  }

  private cargarDatosParaEditar(id: number) {
    this.cargandoDatos.set(true);
    this.versionService.getById(id).pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: (data) => {
        this.form.patchValue({ descripcion: data.descripcion });

        if (data.foto) {
          this.fotoPreview.set(`${environment.apiUrl}${data.foto}`);
          this.fotoActual.set(data.foto);
        }

        this.cargandoDatos.set(false);
      },
      error: () => {
        this.cargandoDatos.set(false);
        this.snackbar.open('Error al cargar los datos de la versión', 'Cerrar', { duration: 4000 });
        this.router.navigate(['/programas', this.idPrograma(), 'versiones']);
      },
    });
  }

  onFotoSeleccionada(event: Event): void {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    if (!file) return;

    const formatosPermitidos = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
    if (!formatosPermitidos.includes(file.type)) {
      this.snackbar.open('Formato no soportado. Use jpg, png, gif o webp', 'Cerrar', { duration: 4000 });
      input.value = '';
      return;
    }

    this.archivoSeleccionado.set(true);
    const reader = new FileReader();
    reader.onload = () => {
      this.fotoPreview.set(reader.result as string);
      this.fotoBase64.set(reader.result as string);
    };
    reader.readAsDataURL(file);
  }

  eliminarFoto(): void {
    this.fotoPreview.set(null);
    this.fotoBase64.set(null);
    this.fotoActual.set(null);
    this.archivoSeleccionado.set(false);
  }

  guardar() {
    if (this.form.invalid) return;

    this.loading.set(true);
    const datos: ProgramaVersionCreate = {
      id_programa: this.idPrograma(),
      descripcion: this.form.value.descripcion || null,
    };

    if (this.fotoBase64()) {
      datos.foto = this.fotoBase64();
    } else if (this.idEditando && this.fotoActual() === null && this.fotoPreview() === null) {
      datos.foto = null;
    } else if (!this.idEditando) {
      datos.foto = null;
    }

    const peticion = this.idEditando
      ? this.versionService.update(this.idEditando, datos)
      : this.versionService.create(datos);

    peticion.pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: () => {
        this.loading.set(false);
        const mensaje = this.idEditando
          ? 'Versión actualizada con éxito'
          : 'Versión creada con éxito';
        this.snackbar.open(mensaje, 'OK', { duration: 3000 });
        this.router.navigate(['/programas', this.idPrograma(), 'versiones']);
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
