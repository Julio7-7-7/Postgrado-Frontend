import { Component, OnInit, signal, inject, DestroyRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { MAT_DIALOG_DATA, MatDialogRef, MatDialogModule } from '@angular/material/dialog';

import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBarModule, MatSnackBar } from '@angular/material/snack-bar';
import { MatCheckboxModule } from '@angular/material/checkbox';

import { ProgramaVersionService } from '../../services/programa-version.service';
import { ProgramaService } from '../../../programa/services/programa.service';
import { ProgramaVersionCreate, ProgramaVersion } from '../../models/programa-version.model';
import { environment } from '../../../../../environments/environment';

export interface ProgramaVersionDialogData {
  id_programa: number;
  version: ProgramaVersion | null;
}

@Component({
  selector: 'app-programa-version-form',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatDialogModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatIconModule,
    MatProgressSpinnerModule,
    MatSnackBarModule,
    MatCheckboxModule,
  ],
  templateUrl: './programa-version-form.html',
  styleUrl: './programa-version-form.css',
})
export class ProgramaVersionFormComponent implements OnInit {
  private fb = inject(FormBuilder);
  private versionService = inject(ProgramaVersionService);
  private programaService = inject(ProgramaService);
  private snackbar = inject(MatSnackBar);
  private destroyRef = inject(DestroyRef);
  private dialogRef = inject(MatDialogRef<ProgramaVersionFormComponent>);

  data: ProgramaVersionDialogData = inject(MAT_DIALOG_DATA);

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
    this.idPrograma.set(this.data?.id_programa ?? 0);
    if (this.data?.version) {
      this.idEditando = this.data.version.id_programa_version;
      this.cargarDatosParaEditar(this.data.version);
    }
    if (this.idPrograma()) {
      this.cargarPrograma(this.idPrograma());
    }
  }

  private cargarPrograma(id: number) {
    this.programaService.getById(id).pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: (data) => {
        this.nombrePrograma.set(data.nombre_programa);
      },
      error: () => {
        this.snackbar.open('No se pudo cargar el programa', 'Cerrar', { duration: 4000 });
        this.dialogRef.close();
      },
    });
  }

  private cargarDatosParaEditar(version: ProgramaVersion) {
    this.cargandoDatos.set(true);
    this.form.patchValue({ descripcion: version.descripcion });

    if (version.foto) {
      this.fotoPreview.set(`${environment.apiUrl}${version.foto}`);
      this.fotoActual.set(version.foto);
    }

    this.cargandoDatos.set(false);
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
    const raw = this.form.value;
    const datos: ProgramaVersionCreate = {
      id_programa: this.idPrograma(),
      descripcion: raw.descripcion || null,
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
        this.dialogRef.close(true);
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
