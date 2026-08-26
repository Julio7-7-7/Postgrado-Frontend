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
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { RequisitoService } from '../../services/requisito.service';
import { RequisitoResponse, RequisitoCreate, RequisitoUpdate } from '../../models/requisito.model';

@Component({
  selector: 'app-requisitos-form',
  standalone: true,
  imports: [
    CommonModule, ReactiveFormsModule,
    MatDialogModule, MatButtonModule, MatIconModule,
    MatFormFieldModule, MatInputModule, MatSelectModule,
    MatProgressSpinnerModule, MatSnackBarModule,
  ],
  templateUrl: './requisitos-form.html',
  styleUrl: './requisitos-form.css',
})
export class RequisitosFormComponent implements OnInit {
  private fb = inject(FormBuilder);
  private service = inject(RequisitoService);
  private snackbar = inject(MatSnackBar);
  private destroyRef = inject(DestroyRef);
  private dialogRef = inject(MatDialogRef<RequisitosFormComponent>);

  data: RequisitoResponse | null = inject(MAT_DIALOG_DATA);

  form!: FormGroup;
  isSaving = signal(false);
  imagenPreview = signal<string | null>(null);
  imagenBase64 = signal<string | null>(null);
  imagenEliminada = signal(false);

  ngOnInit(): void {
    this.form = this.fb.group({
      nombre: [this.data?.nombre ?? '', Validators.required],
      descripcion: [this.data?.descripcion ?? ''],
      estado: [this.data?.estado ?? 'activo'],
    });

    if (this.data?.imagen_url) {
      this.imagenPreview.set(this.data.imagen_url);
    }
  }

  onImagenSeleccionada(event: Event): void {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    if (!file) return;

    const formatosPermitidos = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
    if (!formatosPermitidos.includes(file.type)) {
      this.snackbar.open('Formato no soportado. Use jpg, png, gif o webp', 'Cerrar', { duration: 4000 });
      input.value = '';
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      this.imagenPreview.set(reader.result as string);
      this.imagenBase64.set(reader.result as string);
      this.imagenEliminada.set(false);
    };
    reader.readAsDataURL(file);
  }

  eliminarImagen(): void {
    this.imagenPreview.set(null);
    this.imagenBase64.set(null);
    this.imagenEliminada.set(true);
  }

  guardar(): void {
    if (this.form.invalid) return;
    this.isSaving.set(true);

    const payload: Partial<RequisitoCreate & RequisitoUpdate> = this.form.value;
    if (this.imagenBase64()) {
      payload['imagen_url'] = this.imagenBase64();
    } else if (this.imagenEliminada()) {
      payload['imagen_url'] = null;
    }

    const req = this.data
      ? this.service.update(this.data.id_requisito, payload as RequisitoUpdate)
      : this.service.create(payload as RequisitoCreate);

    req.pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: () => {
        this.isSaving.set(false);
        this.snackbar.open(this.data ? 'Requisito actualizado' : 'Requisito creado', 'Cerrar', { duration: 2000 });
        this.dialogRef.close(true);
      },
      error: err => {
        this.isSaving.set(false);
        this.snackbar.open(err.error?.detail || 'Error al guardar', 'Cerrar', { duration: 3000 });
      },
    });
  }
}
