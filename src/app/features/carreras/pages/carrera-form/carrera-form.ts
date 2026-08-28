import { Component, OnInit, signal, inject, DestroyRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { MAT_DIALOG_DATA, MatDialogRef, MatDialogModule } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { CarreraService } from '../../services/carrera.service';
import { Carrera } from '../../models/carrera.model';

@Component({
  selector: 'app-carrera-form',
  standalone: true,
  imports: [
    CommonModule, ReactiveFormsModule,
    MatDialogModule, MatButtonModule, MatIconModule,
    MatFormFieldModule, MatInputModule,
    MatProgressSpinnerModule, MatSnackBarModule,
  ],
  templateUrl: './carrera-form.html',
  styleUrl: './carrera-form.css',
})
export class CarreraFormComponent implements OnInit {
  private fb = inject(FormBuilder);
  private service = inject(CarreraService);
  private snackbar = inject(MatSnackBar);
  private destroyRef = inject(DestroyRef);
  private dialogRef = inject(MatDialogRef<CarreraFormComponent>);

  data: Carrera | null = inject(MAT_DIALOG_DATA);

  form!: FormGroup;
  isSaving = signal(false);

  ngOnInit(): void {
    this.form = this.fb.group({
      nombre: [this.data?.nombre ?? '', [Validators.required, Validators.minLength(3)]],
      sigla: [this.data?.sigla ?? ''],
      descripcion: [this.data?.descripcion ?? ''],
    });
  }

  guardar(): void {
    if (this.form.invalid) return;
    this.isSaving.set(true);

    const payload = {
      nombre: this.form.value.nombre,
      sigla: this.form.value.sigla?.trim() || null,
      descripcion: this.form.value.descripcion?.trim() || null,
    };

    const req = this.data
      ? this.service.update(this.data.id_carrera, payload)
      : this.service.create(payload);

    req.pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: () => {
        this.isSaving.set(false);
        this.snackbar.open(this.data ? 'Carrera actualizada' : 'Carrera creada', 'Cerrar', { duration: 2000 });
        this.dialogRef.close(true);
      },
      error: err => {
        this.isSaving.set(false);
        this.snackbar.open(err.error?.detail || 'Error al guardar', 'Cerrar', { duration: 3000 });
      },
    });
  }
}