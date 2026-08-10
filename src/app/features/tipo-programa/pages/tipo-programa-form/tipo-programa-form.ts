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

import { TipoProgramaService } from '../../services/tipo-programa.service';
import { TipoProgramaCreate, TipoPrograma } from '../../models/tipo-programa.model';
import { ModalidadAcademicaResponse } from '../../../modalidad/models/modalidad.model';

@Component({
  selector: 'app-tipo-programa-form',
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
  templateUrl: './tipo-programa-form.html',
  styleUrl: './tipo-programa-form.css'
})
export class TipoProgramaFormComponent implements OnInit {
  private fb = inject(FormBuilder);
  private service = inject(TipoProgramaService);
  private snackbar = inject(MatSnackBar);
  private destroyRef = inject(DestroyRef);
  private dialogRef = inject(MatDialogRef<TipoProgramaFormComponent>);

  data: TipoPrograma | null = inject(MAT_DIALOG_DATA);

  form: FormGroup;
  loading = signal(false);
  cargandoDatos = signal(false);

  modalidades = signal<ModalidadAcademicaResponse[]>([]);
  selectedModalidades = signal<Set<number>>(new Set());

  constructor() {
    this.form = this.fb.group({
      nombre: ['', [Validators.required, Validators.minLength(3), Validators.maxLength(100)]],
      estado: ['activo', Validators.required],
      cupo_minimo: [null, [Validators.min(1)]],
      duracion_minima_meses: [null, [Validators.min(1)]]
    });
  }

  ngOnInit(): void {
    this.cargarModalidades();
    if (this.data) {
      this.form.patchValue(this.data);
      const ids = new Set(this.data.modalidades.map(m => m.id_modalidad_academica));
      this.selectedModalidades.set(ids);
    }
  }

  private cargarModalidades(): void {
    this.service.getModalidades().pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: data => this.modalidades.set(data.filter(m => m.estado === 'activo')),
    });
  }

  toggleModalidad(id: number): void {
    this.selectedModalidades.update(s => {
      const next = new Set(s);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  guardar() {
    if (this.form.invalid) return;

    this.loading.set(true);
    const datos: TipoProgramaCreate = {
      ...this.form.value,
      modalidades: Array.from(this.selectedModalidades()),
    };

    const peticion = this.data
      ? this.service.update(this.data.id_tipo_programa, datos)
      : this.service.create(datos);

    peticion.pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: () => {
        this.loading.set(false);
        const mensaje = this.data
          ? 'Registro actualizado con éxito'
          : 'Registro creado con éxito';
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
      }
    });
  }
}
