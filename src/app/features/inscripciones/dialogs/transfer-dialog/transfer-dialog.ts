import { Component, Inject, OnInit, signal, inject, DestroyRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatDialogModule, MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { InscripcionEdicionService } from '../../services/inscripcion-edicion.service';
import { EdicionBasica, InscripcionEdicionItem } from '../../models/inscripcion-edicion.model';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';

export interface TransferDialogData {
  inscripcion: InscripcionEdicionItem;
}

@Component({
  selector: 'app-transfer-dialog',
  standalone: true,
  imports: [
    CommonModule, FormsModule,
    MatDialogModule, MatButtonModule, MatFormFieldModule, MatInputModule,
    MatSelectModule, MatIconModule, MatProgressSpinnerModule, MatSnackBarModule,
  ],
  templateUrl: './transfer-dialog.html',
  styleUrl: './transfer-dialog.css',
})
export class TransferDialogComponent implements OnInit {
  private service = inject(InscripcionEdicionService);
  private snackbar = inject(MatSnackBar);
  private destroyRef = inject(DestroyRef);

  ediciones = signal<EdicionBasica[]>([]);
  isLoading = signal(true);
  isSubmitting = signal(false);

  edicionDestino: number | null = null;
  motivo = '';

  constructor(
    public dialogRef: MatDialogRef<TransferDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: TransferDialogData,
  ) {}

  ngOnInit(): void {
    this.service.getEdicionesDisponibles()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (ediciones: EdicionBasica[]) => {
          this.ediciones.set(ediciones.filter((e: EdicionBasica) =>
            e.id_programa_version_edicion !== this.getEdicionOrigen()
          ));
          this.isLoading.set(false);
        },
        error: () => {
          this.isLoading.set(false);
          this.snackbar.open('Error al cargar ediciones', 'Cerrar', { duration: 3000 });
        },
      });
  }

  getEdicionOrigen(): number {
    return (this.data.inscripcion as any).id_programa_version_edicion ?? 0;
  }

  edicionLabel(e: EdicionBasica): string {
    const semLabel = e.semestre === 1 ? 'I' : 'II';
    return `${e.programa_nombre} — Ed. ${e.edicion} (${semLabel} ${e.anio})`;
  }

  confirmar(): void {
    if (!this.edicionDestino || !this.motivo.trim()) {
      this.snackbar.open('Complete todos los campos', 'Cerrar', { duration: 2000 });
      return;
    }

    this.isSubmitting.set(true);
    this.service.transferir(this.data.inscripcion.id_detalle_programa_alumno, {
      id_programa_version_edicion_destino: this.edicionDestino,
      motivo: this.motivo.trim(),
      id_modalidad_academica: (this.data.inscripcion as any).id_modalidad_academica ?? 0,
      id_tipo_descuento: null,
    }).pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: () => {
          this.snackbar.open('Estudiante transferido exitosamente', 'Cerrar', { duration: 3000 });
          this.dialogRef.close(true);
        },
        error: (err: any) => {
          this.isSubmitting.set(false);
          this.snackbar.open(err.error?.detail || 'Error al transferir', 'Cerrar', { duration: 4000 });
        },
      });
  }

  cancelar(): void {
    this.dialogRef.close(false);
  }
}
