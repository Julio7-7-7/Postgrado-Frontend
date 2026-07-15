import { Component, OnInit, signal, inject, DestroyRef, Inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { MAT_DIALOG_DATA, MatDialogRef, MatDialogModule } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatSelectModule } from '@angular/material/select';
import { MatChipsModule } from '@angular/material/chips';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { TipoDescuentoService } from '../../services/tipo-descuento.service';
import { TipoDescuentoResponse } from '../../models/tipo-descuento.model';
import { ModalidadAcademicaResponse, RequisitoResponse } from '../../../modalidad/models/modalidad.model';

@Component({
  selector: 'app-tipo-descuento-form',
  standalone: true,
  imports: [
    CommonModule, ReactiveFormsModule,
    MatDialogModule, MatButtonModule, MatIconModule,
    MatFormFieldModule, MatInputModule, MatCheckboxModule,
    MatSelectModule, MatChipsModule,
    MatProgressSpinnerModule, MatSnackBarModule,
  ],
  templateUrl: './tipo-descuento-form.html',
  styleUrl: './tipo-descuento-form.css',
})
export class TipoDescuentoFormComponent implements OnInit {
  private fb = inject(FormBuilder);
  private service = inject(TipoDescuentoService);
  private snackbar = inject(MatSnackBar);
  private destroyRef = inject(DestroyRef);
  private dialogRef = inject(MatDialogRef<TipoDescuentoFormComponent>);

  data: TipoDescuentoResponse | null = inject(MAT_DIALOG_DATA);

  form!: FormGroup;
  modalidades = signal<ModalidadAcademicaResponse[]>([]);
  requisitosAll = signal<RequisitoResponse[]>([]);
  selectedModalidades = signal<Set<number>>(new Set());
  selectedRequisitos = signal<Set<number>>(new Set());
  isSaving = signal(false);

  requisitosDisponibles = signal<RequisitoResponse[]>([]);

  ngOnInit(): void {
    this.form = this.fb.group({
      nombre: [this.data?.nombre ?? '', Validators.required],
      porcentaje: [this.data?.porcentaje ?? 50, [Validators.required, Validators.min(1), Validators.max(100)]],
      descripcion: [this.data?.descripcion ?? ''],
      uso_unico: [this.data?.uso_unico ?? false],
      estado: [this.data?.estado ?? 'activo'],
    });

    this.service.getModalidades().pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: data => {
        this.modalidades.set(data);
        if (this.data) {
          const ids = new Set(this.data.modalidades.map(m => m.id_modalidad_academica));
          this.selectedModalidades.set(ids);
        }
      },
    });

    this.service.getRequisitos().pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: data => {
        this.requisitosAll.set(data);
        this.requisitosDisponibles.set(data);
        if (this.data) {
          const ids = new Set(this.data.requisitos.map(r => r.id_requisito));
          this.selectedRequisitos.set(ids);
        }
      },
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

  toggleRequisito(id: number): void {
    this.selectedRequisitos.update(s => {
      const next = new Set(s);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  guardar(): void {
    if (this.form.invalid) return;
    this.isSaving.set(true);

    const payload = {
      ...this.form.value,
      modalidades: Array.from(this.selectedModalidades()),
      requisitos: Array.from(this.selectedRequisitos()),
    };

    const req = this.data
      ? this.service.update(this.data.id_tipo_descuento, payload)
      : this.service.create(payload);

    req.pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: () => {
        this.isSaving.set(false);
        this.snackbar.open(this.data ? 'Descuento actualizado' : 'Descuento creado', 'Cerrar', { duration: 2000 });
        this.dialogRef.close(true);
      },
      error: err => {
        this.isSaving.set(false);
        this.snackbar.open(err.error?.detail || 'Error al guardar', 'Cerrar', { duration: 3000 });
      },
    });
  }
}
