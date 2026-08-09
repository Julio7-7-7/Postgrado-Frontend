import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { PagoService } from '../../services/pago.service';
import { TransaccionTranscript } from '../../models/pago.model';

interface AnularData {
  transaccion: TransaccionTranscript;
}

@Component({
  selector: 'app-anular-boleta-dialog',
  standalone: true,
  imports: [
    CommonModule, FormsModule,
    MatDialogModule, MatFormFieldModule, MatInputModule,
    MatButtonModule, MatIconModule, MatSnackBarModule,
  ],
  templateUrl: './anular-boleta-dialog.html',
  styleUrl: './anular-boleta-dialog.css',
})
export class AnularBoletaDialog {
  private service = inject(PagoService);
  private snackbar = inject(MatSnackBar);
  dialogRef = inject(MatDialogRef<AnularBoletaDialog>);
  data = inject<AnularData>(MAT_DIALOG_DATA);

  motivo = '';
  isSubmitting = signal(false);

  fmt(n: number): string {
    return Number(n || 0).toLocaleString('es-BO', { minimumFractionDigits: 0, maximumFractionDigits: 2 });
  }

  anular(): void {
    const motivo = this.motivo.trim();
    if (!motivo) {
      this.snackbar.open('El motivo de la anulación es obligatorio', 'Cerrar', { duration: 3000 });
      return;
    }
    this.isSubmitting.set(true);
    this.service.anular(this.data.transaccion.id_transaccion, { motivo_anulacion: motivo }).subscribe({
      next: () => {
        this.isSubmitting.set(false);
        this.dialogRef.close(true);
      },
      error: err => {
        this.isSubmitting.set(false);
        this.snackbar.open(err.error?.detail || 'Error al anular la boleta', 'Cerrar', { duration: 3500 });
      },
    });
  }
}
