import { Component, OnInit, signal, inject, DestroyRef, Inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { MAT_DIALOG_DATA, MatDialogRef, MatDialogModule } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { ModalidadService } from '../../services/modalidad.service';
import { RequisitoService } from '../../../requisitos/services/requisito.service';
import { ModalidadAcademicaResponse } from '../../models/modalidad.model';
import { RequisitoResponse } from '../../../requisitos/models/requisito.model';

@Component({
  selector: 'app-modalidad-form',
  standalone: true,
  imports: [
    CommonModule, ReactiveFormsModule,
    MatDialogModule, MatButtonModule, MatIconModule,
    MatFormFieldModule, MatInputModule,
    MatSelectModule, MatProgressSpinnerModule, MatSnackBarModule,
  ],
  templateUrl: './modalidad-form.html',
  styleUrl: './modalidad-form.css',
})
export class ModalidadFormComponent implements OnInit {
  private fb = inject(FormBuilder);
  private service = inject(ModalidadService);
  private requisitoService = inject(RequisitoService);
  private snackbar = inject(MatSnackBar);
  private destroyRef = inject(DestroyRef);
  private dialogRef = inject(MatDialogRef<ModalidadFormComponent>);

  data: ModalidadAcademicaResponse | null = inject(MAT_DIALOG_DATA);

  form!: FormGroup;
  requisitosAll = signal<RequisitoResponse[]>([]);
  isSaving = signal(false);

  ngOnInit(): void {
    const requisitosIds = this.data?.requisitos?.map(r => r.id_requisito) ?? [];

    this.form = this.fb.group({
      nombre_modalidad: [this.data?.nombre_modalidad ?? '', Validators.required],
      descripcion: [this.data?.descripcion ?? ''],
      estado: [this.data?.estado ?? 'activo'],
      requisitos: [requisitosIds],
    });

    this.cargarRequisitos();
  }

  toggleRequisito(id: number): void {
    const current: number[] = this.form.get('requisitos')?.value ?? [];
    const next = current.includes(id) ? current.filter(x => x !== id) : [...current, id];
    this.form.get('requisitos')?.setValue(next);
  }

  cargarRequisitos(): void {
    this.requisitoService.getAll().pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: all => this.requisitosAll.set(all.filter(r => r.estado === 'activo')),
    });
  }

  guardar(): void {
    if (this.form.invalid) return;
    this.isSaving.set(true);

    const payload = {
      ...this.form.value,
      requisitos: this.form.get('requisitos')?.value ?? [],
    };

    const req = this.data
      ? this.service.update(this.data.id_modalidad_academica, payload)
      : this.service.create(payload);

    req.pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: () => {
        this.isSaving.set(false);
        this.snackbar.open(this.data ? 'Modalidad actualizada' : 'Modalidad creada', 'Cerrar', { duration: 2000 });
        this.dialogRef.close(true);
      },
      error: err => {
        this.isSaving.set(false);
        this.snackbar.open(err.error?.detail || 'Error al guardar', 'Cerrar', { duration: 3000 });
      },
    });
  }
}
