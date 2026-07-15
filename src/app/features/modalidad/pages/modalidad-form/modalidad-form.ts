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
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { ModalidadService } from '../../services/modalidad.service';
import { ModalidadAcademicaResponse, RequisitoResponse } from '../../models/modalidad.model';

@Component({
  selector: 'app-modalidad-form',
  standalone: true,
  imports: [
    CommonModule, ReactiveFormsModule,
    MatDialogModule, MatButtonModule, MatIconModule,
    MatFormFieldModule, MatInputModule, MatCheckboxModule,
    MatSelectModule, MatProgressSpinnerModule, MatSnackBarModule,
  ],
  templateUrl: './modalidad-form.html',
  styleUrl: './modalidad-form.css',
})
export class ModalidadFormComponent implements OnInit {
  private fb = inject(FormBuilder);
  private service = inject(ModalidadService);
  private snackbar = inject(MatSnackBar);
  private destroyRef = inject(DestroyRef);
  private dialogRef = inject(MatDialogRef<ModalidadFormComponent>);

  data: ModalidadAcademicaResponse | null = inject(MAT_DIALOG_DATA);

  form!: FormGroup;
  requisitos = signal<RequisitoResponse[]>([]);
  isSaving = signal(false);

  ngOnInit(): void {
    this.form = this.fb.group({
      nombre_modalidad: [this.data?.nombre_modalidad ?? '', Validators.required],
      descripcion: [this.data?.descripcion ?? ''],
      requiere_titulo: [this.data?.requiere_titulo ?? false],
      estado: [this.data?.estado ?? 'activo'],
    });

    if (this.data) {
      this.cargarRequisitos();
    }
  }

  cargarRequisitos(): void {
    this.service.getRequisitos().pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: all => {
        const filtered = all.filter(r => r.id_modalidad_academica === this.data!.id_modalidad_academica);
        this.requisitos.set(filtered);
      },
    });
  }

  agregarRequisito(): void {
    const nombre = prompt('Nombre del nuevo requisito:');
    if (!nombre || !nombre.trim()) return;

    const desc = prompt('Descripción (opcional):');

    this.service.createRequisito({
      id_modalidad_academica: this.data?.id_modalidad_academica ?? null,
      nombre: nombre.trim(),
      descripcion: desc?.trim() || null,
      obligatorio: true,
    }).pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: r => {
        this.requisitos.update(list => [...list, r]);
        this.snackbar.open('Requisito agregado', 'Cerrar', { duration: 2000 });
      },
      error: err => this.snackbar.open(err.error?.detail || 'Error', 'Cerrar', { duration: 3000 }),
    });
  }

  toggleObligatorio(r: RequisitoResponse, obligatorio: boolean): void {
    this.service.updateRequisito(r.id_requisito, { obligatorio }).pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: updated => {
        this.requisitos.update(list => list.map(x => x.id_requisito === updated.id_requisito ? updated : x));
      },
    });
  }

  eliminarRequisito(r: RequisitoResponse): void {
    if (!confirm(`¿Eliminar requisito "${r.nombre}"?`)) return;
    this.service.deleteRequisito(r.id_requisito).pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: () => {
        this.requisitos.update(list => list.filter(x => x.id_requisito !== r.id_requisito));
        this.snackbar.open('Requisito eliminado', 'Cerrar', { duration: 2000 });
      },
      error: err => this.snackbar.open(err.error?.detail || 'Error al eliminar', 'Cerrar', { duration: 3000 }),
    });
  }

  guardar(): void {
    if (this.form.invalid) return;
    this.isSaving.set(true);

    const payload = this.form.value;

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
