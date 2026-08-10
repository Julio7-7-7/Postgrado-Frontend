import { Component, OnInit, signal, inject, DestroyRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { MAT_DIALOG_DATA, MatDialogRef, MatDialogModule } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBarModule, MatSnackBar } from '@angular/material/snack-bar';
import { ModuloService } from '../../services/modulo.service';
import { ProgramaVersionService } from '../../../programa-version/services/programa-version.service';
import { ModuloCreate, Modulo } from '../../models/modulo.model';

export interface ModuloDialogData {
  id_programa: number;
  id_version: number;
  modulo: Modulo | null;
}

@Component({
  selector: 'app-modulo-form',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatDialogModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatButtonModule,
    MatIconModule,
    MatProgressSpinnerModule,
    MatSnackBarModule,
  ],
  templateUrl: './modulo-form.html',
  styleUrl: './modulo-form.css',
})
export class ModuloFormComponent implements OnInit {
  private fb = inject(FormBuilder);
  private moduloService = inject(ModuloService);
  private versionService = inject(ProgramaVersionService);
  private snackbar = inject(MatSnackBar);
  private destroyRef = inject(DestroyRef);
  private dialogRef = inject(MatDialogRef<ModuloFormComponent>);

  data: ModuloDialogData = inject(MAT_DIALOG_DATA);

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
    this.idPrograma.set(this.data?.id_programa ?? 0);
    this.idVersion.set(this.data?.id_version ?? 0);

    this.cargarVersion(this.idVersion());

    if (this.data?.modulo) {
      this.idEditando = this.data.modulo.id_modulo;
      this.form.patchValue(this.data.modulo);
    }
  }

  private cargarVersion(id: number) {
    this.versionService.getById(id).pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: (data) => {
        this.infoVersion.set(`${data.programa.nombre_programa} — V${data.version}`);
        if (data.programa.estado !== 'activo' && !this.idEditando) {
          this.snackbar.open('No se pueden agregar módulos a un programa inactivo', 'Cerrar', { duration: 4000 });
          this.dialogRef.close();
        }
        if (data.ediciones_count > 0 && !this.idEditando) {
          this.snackbar.open('Esta versión ya tiene ediciones registradas. No es posible añadir nuevos módulos.', 'Cerrar', { duration: 5000 });
          this.dialogRef.close();
        }
      },
      error: () => {
        this.snackbar.open('No se pudo cargar la versión', 'Cerrar', { duration: 4000 });
        this.dialogRef.close();
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
