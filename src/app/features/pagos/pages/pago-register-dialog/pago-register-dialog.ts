import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule } from '@angular/material/core';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { PagoService } from '../../services/pago.service';
import { PagoCreate } from '../../models/pago.model';

@Component({
  selector: 'app-pago-register-dialog',
  standalone: true,
  imports: [
    CommonModule, FormsModule,
    MatDialogModule, MatFormFieldModule, MatInputModule,
    MatButtonModule, MatIconModule,
    MatDatepickerModule, MatNativeDateModule,
    MatSnackBarModule,
  ],
  templateUrl: './pago-register-dialog.html',
  styleUrl: './pago-register-dialog.css',
})
export class PagoRegisterDialog {
  private service = inject(PagoService);
  private snackbar = inject(MatSnackBar);
  dialogRef = inject(MatDialogRef<PagoRegisterDialog>);
  data = inject<{ idDetalle: number; alumno: any }>(MAT_DIALOG_DATA);

  concepto = '';
  monto: number | null = null;
  fechaPago: Date | null = new Date();
  numeroReferencia = '';
  comprobanteUrl = '';
  isSubmitting = signal(false);

  guardar(): void {
    if (!this.concepto.trim() || !this.monto || this.monto <= 0 || !this.fechaPago) {
      this.snackbar.open('Complete todos los campos obligatorios', 'Cerrar', { duration: 3000 });
      return;
    }

    this.isSubmitting.set(true);

    const payload: PagoCreate = {
      id_detalle_programa_alumno: this.data.idDetalle,
      monto: this.monto,
      fecha_pago: this.fechaPago.toISOString().split('T')[0],
      concepto: this.concepto.trim(),
      numero_referencia: this.numeroReferencia.trim() || null,
      comprobante_url: this.comprobanteUrl.trim() || null,
    };

    this.service.create(payload).subscribe({
      next: () => {
        this.isSubmitting.set(false);
        this.dialogRef.close(true);
      },
      error: err => {
        this.isSubmitting.set(false);
        this.snackbar.open(err.error?.detail || 'Error al registrar pago', 'Cerrar', { duration: 3000 });
      },
    });
  }
}
