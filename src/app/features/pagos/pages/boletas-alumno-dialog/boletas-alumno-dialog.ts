import { Component, computed, inject, signal, OnInit, DestroyRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { MAT_DIALOG_DATA, MatDialog, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { environment } from '../../../../../environments/environment';
import { PagoService } from '../../services/pago.service';
import { AuthService } from '../../../../core/services/auth.service';
import { TransaccionTranscript } from '../../models/pago.model';
import { AnularBoletaDialog } from '../anular-boleta-dialog/anular-boleta-dialog';

interface BoletasDialogData {
  idAlumno: number;
  idDetalleProgramaAlumno: number;
  nombre: string;
  edicion: string;
}

@Component({
  selector: 'app-boletas-alumno-dialog',
  standalone: true,
  imports: [
    CommonModule,
    MatDialogModule, MatButtonModule, MatIconModule, MatTooltipModule,
    MatProgressSpinnerModule, MatSnackBarModule,
  ],
  templateUrl: './boletas-alumno-dialog.html',
  styleUrl: './boletas-alumno-dialog.css',
})
export class BoletasAlumnoDialog implements OnInit {
  private service = inject(PagoService);
  private auth = inject(AuthService);
  private snackbar = inject(MatSnackBar);
  private dialog = inject(MatDialog);
  private destroyRef = inject(DestroyRef);
  dialogRef = inject(MatDialogRef<BoletasAlumnoDialog>);
  data = inject<BoletasDialogData>(MAT_DIALOG_DATA);

  apiUrl = environment.apiUrl;
  transacciones = signal<TransaccionTranscript[]>([]);
  isLoading = signal(true);
  totalPagado = signal(0);
  cambios = signal(false);

  puedeAnular = computed(() => this.auth.hasPermiso('pagos.anular'));

  ngOnInit(): void {
    this.service.getTranscriptPagos(this.data.idAlumno).pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: resp => {
        const ins = resp.inscripciones.find(i => i.id_detalle_programa_alumno === this.data.idDetalleProgramaAlumno);
        if (!ins) {
          this.snackbar.open('No se encontraron pagos para esta inscripción', 'Cerrar', { duration: 3000 });
          this.dialogRef.close();
          return;
        }
        this.transacciones.set(
          [...ins.transacciones].sort((a, b) => (a.fecha_pago < b.fecha_pago ? 1 : -1)),
        );
        this.totalPagado.set(ins.total_pagado);
        this.isLoading.set(false);
      },
      error: () => {
        this.isLoading.set(false);
        this.snackbar.open('Error al cargar las boletas', 'Cerrar', { duration: 3000 });
      },
    });
  }

  fmt(n: number): string {
    return Number(n || 0).toLocaleString('es-BO', { minimumFractionDigits: 0, maximumFractionDigits: 2 });
  }

  fecha(iso: string): string {
    if (!iso) return '—';
    return new Date(`${iso}T00:00:00`).toLocaleDateString('es-BO');
  }

  comprobanteUrl(url: string | null): string | null {
    return url ? `${this.apiUrl}${url}` : null;
  }

  puedeAnularTransaccion(t: TransaccionTranscript): boolean {
    return this.puedeAnular() && t.estado === 'confirmado';
  }

  anular(t: TransaccionTranscript): void {
    const dialogRef = this.dialog.open(AnularBoletaDialog, {
      width: '440px',
      data: { transaccion: t },
    });
    dialogRef.afterClosed().subscribe((ok: boolean | undefined) => {
      if (!ok) return;
      const list = this.transacciones().map(x =>
        x.id_transaccion === t.id_transaccion ? { ...x, estado: 'anulado' } : x,
      );
      this.transacciones.set(list);
      const still = list.filter(x => x.estado === 'confirmado');
      this.totalPagado.set(still.reduce((acc, x) => acc + x.monto_total, 0));
      this.cambios.set(true);
      this.snackbar.open('Boleta anulada con éxito', 'Cerrar', { duration: 3000 });
    });
  }

  cerrar(): void {
    this.dialogRef.close(this.cambios() ? true : undefined);
  }
}
