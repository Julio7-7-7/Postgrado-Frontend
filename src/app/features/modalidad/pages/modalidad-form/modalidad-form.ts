import { Component, OnInit, signal, inject, DestroyRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { MAT_DIALOG_DATA, MatDialogRef, MatDialogModule } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatAutocompleteModule } from '@angular/material/autocomplete';
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
    MatSelectModule, MatAutocompleteModule,
    MatProgressSpinnerModule, MatSnackBarModule,
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
  filteredRequisitos = signal<RequisitoResponse[]>([]);
  isSaving = signal(false);
  requisitoCtrl = this.fb.control('');

  ngOnInit(): void {
    const requisitosIds = this.data?.requisitos?.map(r => r.id_requisito) ?? [];

    this.form = this.fb.group({
      nombre_modalidad: [this.data?.nombre_modalidad ?? '', Validators.required],
      descripcion: [this.data?.descripcion ?? ''],
      estado: [this.data?.estado ?? 'activo'],
      requisitos: [requisitosIds],
    });

    this.requisitoCtrl.valueChanges.subscribe(val => {
      const search = (val ?? '').toLowerCase();
      const selected = this.form.get('requisitos')?.value ?? [];
      const filtered = this.requisitosAll().filter(r =>
        r.nombre.toLowerCase().includes(search) && !selected.includes(r.id_requisito)
      );
      this.filteredRequisitos.set(filtered);
    });

    this.cargarRequisitos();
  }

  addRequisito(id: number): void {
    const current: number[] = this.form.get('requisitos')?.value ?? [];
    if (!current.includes(id)) {
      this.form.get('requisitos')?.setValue([...current, id]);
    }
    this.requisitoCtrl.setValue('');
  }

  removeRequisito(id: number): void {
    const current: number[] = this.form.get('requisitos')?.value ?? [];
    this.form.get('requisitos')?.setValue(current.filter(x => x !== id));
    this.requisitoCtrl.setValue('');
  }

  requisitoNombre(id: number): string {
    return this.requisitosAll().find(r => r.id_requisito === id)?.nombre ?? '';
  }

  cargarRequisitos(): void {
    this.requisitoService.getAll().pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: all => {
        const activos = all.filter(r => r.estado === 'activo');
        this.requisitosAll.set(activos);
        const selected = this.form.get('requisitos')?.value ?? [];
        this.filteredRequisitos.set(activos.filter(r => !selected.includes(r.id_requisito)));
      },
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
