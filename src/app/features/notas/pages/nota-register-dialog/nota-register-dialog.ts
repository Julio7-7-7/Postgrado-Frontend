import { Component, inject, signal, OnInit, DestroyRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatSelectModule } from '@angular/material/select';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule } from '@angular/material/core';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { NotaService } from '../../services/nota.service';
import { NotaCreate, NotaUpdate, NotaDialogData } from '../../models/nota.model';
import { DetalleService } from '../../../detalle-programa-modulo/services/detalle.service';
import { DetalleProgramaModulo } from '../../../detalle-programa-modulo/models/detalle.model';

@Component({
  selector: 'app-nota-register-dialog',
  standalone: true,
  imports: [
    CommonModule, FormsModule,
    MatDialogModule, MatFormFieldModule, MatInputModule,
    MatButtonModule, MatIconModule, MatSelectModule,
    MatDatepickerModule, MatNativeDateModule,
    MatSnackBarModule,
  ],
  templateUrl: './nota-register-dialog.html',
  styleUrl: './nota-register-dialog.css',
})
export class NotaRegisterDialog implements OnInit {
  private service = inject(NotaService);
  private modService = inject(DetalleService);
  private snackbar = inject(MatSnackBar);
  dialogRef = inject(MatDialogRef<NotaRegisterDialog>);
  private destroyRef = inject(DestroyRef);
  data = inject<NotaDialogData>(MAT_DIALOG_DATA);

  modulos = signal<DetalleProgramaModulo[]>([]);
  idModulo: number | null = null;
  nota: number | null = null;
  fecha: Date | null = new Date();
  isSubmitting = signal(false);

  get esEdicion(): boolean {
    return !!this.data.notaExistente;
  }

  ngOnInit(): void {
    this.modService.getAll(this.data.idEdicion).pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: data => this.modulos.set(data),
    });

    if (this.data.notaExistente) {
      const n = this.data.notaExistente;
      this.idModulo = n.id_detalle_programa_modulo;
      this.nota = n.nota;
      this.fecha = new Date(n.fecha + 'T00:00:00');
    }
  }

  guardar(): void {
    if (!this.idModulo || this.nota === null || !this.fecha) {
      this.snackbar.open('Complete todos los campos obligatorios', 'Cerrar', { duration: 3000 });
      return;
    }

    if (this.nota < 0 || this.nota > 100) {
      this.snackbar.open('La nota debe estar entre 0 y 100', 'Cerrar', { duration: 3000 });
      return;
    }

    this.isSubmitting.set(true);

    const fechaStr = this.fecha.toISOString().split('T')[0];

    if (this.esEdicion) {
      const payload: NotaUpdate = {
        nota: this.nota,
        fecha: fechaStr,
      };

      const notaId = this.data.notaExistente!.id_nota;
      this.service.update(notaId, payload).subscribe({
        next: () => {
          this.isSubmitting.set(false);
          this.dialogRef.close(true);
        },
        error: err => {
          this.isSubmitting.set(false);
          this.snackbar.open(err.error?.detail || 'Error al editar nota', 'Cerrar', { duration: 3000 });
        },
      });
    } else {
      const payload: NotaCreate = {
        id_detalle_programa_alumno: this.data.idDetalle,
        id_detalle_programa_modulo: this.idModulo,
        nota: this.nota,
        fecha: fechaStr,
      };

      this.service.create(payload).subscribe({
        next: () => {
          this.isSubmitting.set(false);
          this.dialogRef.close(true);
        },
        error: err => {
          this.isSubmitting.set(false);
          this.snackbar.open(err.error?.detail || 'Error al registrar nota', 'Cerrar', { duration: 3000 });
        },
      });
    }
  }
}
