import { Component, computed, inject, signal, OnInit, DestroyRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { MAT_DIALOG_DATA, MatDialog, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { FormsModule } from '@angular/forms';
import { environment } from '../../../../../environments/environment';
import { PagoService } from '../../services/pago.service';
import { OrdenPagoService } from '../../services/orden-pago.service';
import { AuthService } from '../../../../core/services/auth.service';
import { TransaccionTranscript } from '../../models/pago.model';
import { OrdenPagoResponse } from '../../models/orden-pago.model';
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
    MatProgressSpinnerModule, MatSnackBarModule, MatFormFieldModule, MatInputModule,
    FormsModule,
  ],
  templateUrl: './boletas-alumno-dialog.html',
  styleUrl: './boletas-alumno-dialog.css',
})
export class BoletasAlumnoDialog implements OnInit {
  private service = inject(PagoService);
  private ordenService = inject(OrdenPagoService);
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

  ordenes = signal<OrdenPagoResponse[]>([]);
  ordenesLoading = signal(true);
  anulandoOrdenId = signal<number | null>(null);
  motivoAnulacion = '';

  puedeAnular = computed(() => this.auth.hasPermiso('pagos.anular'));

  ordenesEmitidas = computed(() => this.ordenes().filter(o => o.estado === 'emitida'));

  ngOnInit(): void {
    this.ordenService.getOrdenesDeAlumno(this.data.idDetalleProgramaAlumno).pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: ordenes => {
        this.ordenes.set(ordenes);
        this.ordenesLoading.set(false);
      },
      error: () => this.ordenesLoading.set(false),
    });
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

  puedeAnularOrden(o: OrdenPagoResponse): boolean {
    return this.puedeAnular() && o.estado === 'emitida';
  }

  ordenTotal(o: OrdenPagoResponse): number {
    return o.items.reduce((acc, it) => acc + (it.monto || 0), 0);
  }

  anularOrden(o: OrdenPagoResponse): void {
    const motivo = this.motivoAnulacion.trim();
    if (!motivo) {
      this.snackbar.open('El motivo de la anulación es obligatorio', 'Cerrar', { duration: 3000 });
      return;
    }
    this.anulandoOrdenId.set(o.id_orden_pago);
    this.ordenService.anular(o.id_orden_pago, { motivo_anulacion: motivo }).subscribe({
      next: () => {
        this.ordenes.set(this.ordenes().map(x =>
          x.id_orden_pago === o.id_orden_pago ? { ...x, estado: 'anulada', motivo_anulacion: motivo } : x,
        ));
        this.anulandoOrdenId.set(null);
        this.motivoAnulacion = '';
        this.cambios.set(true);
        this.snackbar.open(`Orden ${o.numero} anulada`, 'Cerrar', { duration: 3000 });
      },
      error: err => {
        this.anulandoOrdenId.set(null);
        this.snackbar.open(err.error?.detail || 'Error al anular la orden', 'Cerrar', { duration: 3500 });
      },
    });
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
