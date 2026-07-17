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
import { MatAutocompleteModule } from '@angular/material/autocomplete';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { TipoDescuentoService } from '../../services/tipo-descuento.service';
import { TipoDescuentoResponse } from '../../models/tipo-descuento.model';
import { ModalidadAcademicaResponse } from '../../../modalidad/models/modalidad.model';
import { RequisitoResponse } from '../../../requisitos/models/requisito.model';

@Component({
  selector: 'app-tipo-descuento-form',
  standalone: true,
  imports: [
    CommonModule, ReactiveFormsModule,
    MatDialogModule, MatButtonModule, MatIconModule,
    MatFormFieldModule, MatInputModule, MatCheckboxModule,
    MatSelectModule, MatAutocompleteModule,
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
  isSaving = signal(false);

  modalidadesAll = signal<ModalidadAcademicaResponse[]>([]);
  filteredModalidades = signal<ModalidadAcademicaResponse[]>([]);
  modalidadCtrl = this.fb.control('');

  requisitosAll = signal<RequisitoResponse[]>([]);
  filteredRequisitos = signal<RequisitoResponse[]>([]);
  requisitoCtrl = this.fb.control('');

  ngOnInit(): void {
    this.form = this.fb.group({
      nombre: [this.data?.nombre ?? '', Validators.required],
      porcentaje: [this.data?.porcentaje ?? 50, [Validators.required, Validators.min(1), Validators.max(100)]],
      descripcion: [this.data?.descripcion ?? ''],
      uso_unico: [this.data?.uso_unico ?? false],
      estado: [this.data?.estado ?? 'activo'],
      modalidades: [this.data?.modalidades.map(m => m.id_modalidad_academica) ?? []],
      requisitos: [this.data?.requisitos.map(r => r.id_requisito) ?? []],
    });

    this.modalidadCtrl.valueChanges.subscribe(val => {
      const search = (val ?? '').toLowerCase();
      const selected = this.form.get('modalidades')?.value ?? [];
      this.filteredModalidades.set(
        this.modalidadesAll().filter(m =>
          m.nombre_modalidad.toLowerCase().includes(search) && !selected.includes(m.id_modalidad_academica)
        )
      );
    });

    this.requisitoCtrl.valueChanges.subscribe(val => {
      const search = (val ?? '').toLowerCase();
      const selected = this.form.get('requisitos')?.value ?? [];
      this.filteredRequisitos.set(
        this.requisitosAll().filter(r =>
          r.nombre.toLowerCase().includes(search) && !selected.includes(r.id_requisito)
        )
      );
    });

    this.cargarDatos();
  }

  cargarDatos(): void {
    this.service.getModalidades().pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: data => {
        this.modalidadesAll.set(data);
        const selected = this.form.get('modalidades')?.value ?? [];
        this.filteredModalidades.set(data.filter(m => !selected.includes(m.id_modalidad_academica)));
      },
    });

    this.service.getRequisitos().pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: data => {
        this.requisitosAll.set(data);
        const selected = this.form.get('requisitos')?.value ?? [];
        this.filteredRequisitos.set(data.filter(r => !selected.includes(r.id_requisito)));
      },
    });
  }

  addModalidad(id: number): void {
    const current: number[] = this.form.get('modalidades')?.value ?? [];
    if (!current.includes(id)) {
      this.form.get('modalidades')?.setValue([...current, id]);
    }
    this.modalidadCtrl.setValue('');
  }

  removeModalidad(id: number): void {
    const current: number[] = this.form.get('modalidades')?.value ?? [];
    this.form.get('modalidades')?.setValue(current.filter(x => x !== id));
    this.modalidadCtrl.setValue('');
  }

  modalidadNombre(id: number): string {
    return this.modalidadesAll().find(m => m.id_modalidad_academica === id)?.nombre_modalidad ?? '';
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

  guardar(): void {
    if (this.form.invalid) return;
    this.isSaving.set(true);

    const payload = {
      ...this.form.value,
      modalidades: this.form.get('modalidades')?.value ?? [],
      requisitos: this.form.get('requisitos')?.value ?? [],
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
