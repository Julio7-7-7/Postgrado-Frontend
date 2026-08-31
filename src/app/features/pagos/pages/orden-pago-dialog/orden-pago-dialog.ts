import { Component, computed, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { filter } from 'rxjs';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { provideNativeDateAdapter, MAT_DATE_LOCALE } from '@angular/material/core';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { AuthService } from '../../../../core/services/auth.service';
import { OrdenPagoService } from '../../services/orden-pago.service';
import { AlumnoPagosMatrix, ModuloPagosInfo } from '../../models/pago.model';
import { OrdenPagoItem, OrdenPagoResponse } from '../../models/orden-pago.model';
import { UploadBoxComponent } from '../../../../shared/components/upload-box/upload-box';

export interface OrdenPagoDialogData {
  alumno: AlumnoPagosMatrix;
  modulos: ModuloPagosInfo[];
  matricula: number;
  precio: number;
  orden?: OrdenPagoResponse | null;
}

const MAX_SIZE = 10 * 1024 * 1024;
const ACCEPTED = ['image/jpeg', 'image/png', 'image/webp', 'application/pdf'];

@Component({
  selector: 'app-orden-pago-dialog',
  standalone: true,
  providers: [
    { provide: MAT_DATE_LOCALE, useValue: 'es-BO' },
    provideNativeDateAdapter({
      parse: { dateInput: ['DD/MM/YYYY', 'D/M/YYYY'] },
      display: {
        dateInput: 'DD/MM/YYYY',
        monthYearLabel: 'MMM YYYY',
        dateA11yLabel: 'DD/MM/YYYY',
        monthYearA11yLabel: 'MMMM YYYY',
      },
    }),
  ],
  imports: [
    CommonModule, FormsModule,
    MatDialogModule, MatFormFieldModule, MatInputModule,
    MatButtonModule, MatIconModule, MatTooltipModule,
    MatDatepickerModule,
    MatSnackBarModule, UploadBoxComponent,
  ],
  templateUrl: './orden-pago-dialog.html',
  styleUrl: './orden-pago-dialog.css',
})
export class OrdenPagoDialog {
  private service = inject(OrdenPagoService);
  private auth = inject(AuthService);
  private snackbar = inject(MatSnackBar);
  dialogRef = inject(MatDialogRef<OrdenPagoDialog>);
  data = inject<OrdenPagoDialogData>(MAT_DIALOG_DATA);

  orden = signal<OrdenPagoResponse | null>(this.data.orden ?? null);

  cantidadModulos = signal(0);
  previewItems = signal<OrdenPagoItem[]>([]);
  previewTotal = signal(0);
  previewLoading = signal(false);
  previewError = signal<string | null>(null);

  fechaPago: Date | null = new Date();
  codigoBoleta = '';
  comprobante = signal<{ name: string; size: number; data: string } | null>(null);
  comprobanteFile = signal<File | null>(null);

  anulando = signal(false);
  motivoAnulacion = '';
  isSubmitting = signal(false);
  huboCambios = signal(false);

  puedeAnular = computed(() => this.auth.hasPermiso('pagos.anular'));
  esEmitir = computed(() => !this.orden());
  esEmitida = computed(() => this.orden()?.estado === 'emitida');
  esCerrada = computed(() => this.orden()?.estado === 'pagada' || this.orden()?.estado === 'anulada');

  matriculaPendiente = computed(() => {
    const m = this.data.alumno.matricula;
    return Math.max(0, (m.esperado || 0) - (m.pagado || 0));
  });

  modulos = computed(() => [...this.data.modulos].sort((a, b) => a.orden - b.orden));

  cuotasPendientes = computed(() => {
    const res: { id: number; orden: number; sigla: string; resto: number; integra: boolean }[] = [];
    for (const c of this.data.alumno.cuotas) {
      if (c.esperado <= 0) continue;
      const resto = Math.max(0, Math.round((c.esperado - c.pagado) * 100) / 100);
      if (resto <= 0) continue;
      res.push({
        id: c.id_detalle_programa_modulo,
        orden: c.orden,
        sigla: c.sigla,
        resto,
        integra: Math.abs(resto - c.esperado) < 0.005,
      });
    }
    return res;
  });

  maxModulos = computed(() => {
    let n = 0;
    for (const c of this.cuotasPendientes()) {
      if (!c.integra) break;
      n++;
    }
    return n;
  });

  puedeEmitir = computed(() =>
    (this.maxModulos() > 0 || this.matriculaPendiente() > 0) && this.cantidadModulos() <= this.maxModulos());

  nombreAlumno = computed(() =>
    this.data.alumno.alumno
      ? `${this.data.alumno.alumno.apellido} ${this.data.alumno.alumno.nombre}`
      : 'Alumno sin datos');

  totalPrograma = computed(() => this.data.alumno.total_esperado);
  totalPagado = computed(() => this.data.alumno.total_pagado);
  saldoPendiente = computed(() => Math.max(0, this.totalPrograma() - this.totalPagado()));
  descuento = computed(() => this.data.alumno.descuento_aplicado || 0);
  becaActiva = computed(() => this.data.alumno.beca_activa);
  becaMotivo = computed(() => this.data.alumno.beca_motivo);

  constructor() {
    this.cantidadModulos.set(Math.min(1, this.maxModulos()));
    if (this.esEmitir()) this.actualizarPreview();

    this.dialogRef.backdropClick().subscribe(() => this.cerrar());
    this.dialogRef.keydownEvents()
      .pipe(filter(e => e.key === 'Escape'))
      .subscribe(() => this.cerrar());
  }

  cerrar(): void {
    this.dialogRef.close(this.huboCambios() ? true : false);
  }

  cambiarCantidad(delta: number): void {
    this.cantidadModulos.set(Math.min(this.maxModulos(), Math.max(0, this.cantidadModulos() + delta)));
    this.actualizarPreview();
  }

  private previewSeq = 0;

  actualizarPreview(): void {
    const seq = ++this.previewSeq;
    this.previewLoading.set(true);
    this.previewError.set(null);
    this.service.preview({
      id_detalle_programa_alumno: this.data.alumno.id_detalle_programa_alumno,
      cubre_matricula: this.matriculaPendiente() > 0,
      cantidad_modulos: this.cantidadModulos(),
    }).subscribe({
      next: resp => {
        if (seq !== this.previewSeq) return;
        this.previewItems.set(resp.items);
        this.previewTotal.set(resp.monto_total);
        this.previewLoading.set(false);
      },
      error: err => {
        if (seq !== this.previewSeq) return;
        this.previewItems.set([]);
        this.previewTotal.set(0);
        this.previewError.set(err.error?.detail || 'No se pudo calcular la orden');
        this.previewLoading.set(false);
      },
    });
  }

  emitir(): void {
    if (this.cantidadModulos() > this.maxModulos() || (this.maxModulos() === 0 && this.matriculaPendiente() === 0)) {
      this.snackbar.open('La orden no cubre ningún concepto', 'Cerrar', { duration: 3000 });
      return;
    }
    if (this.previewError()) {
      this.snackbar.open(this.previewError()!, 'Cerrar', { duration: 4000 });
      return;
    }
    this.isSubmitting.set(true);
    this.service.emitir({
      id_detalle_programa_alumno: this.data.alumno.id_detalle_programa_alumno,
      cubre_matricula: this.matriculaPendiente() > 0,
      cantidad_modulos: this.cantidadModulos(),
    }).subscribe({
      next: creada => {
        this.isSubmitting.set(false);
        this.huboCambios.set(true);
        this.orden.set(creada);
        this.snackbar.open(`Orden ${creada.numero} emitida`, 'Cerrar', { duration: 3000 });
      },
      error: err => {
        this.isSubmitting.set(false);
        this.snackbar.open(err.error?.detail || 'Error al emitir la orden', 'Cerrar', { duration: 3500 });
      },
    });
  }

  onFileSelected(file: File): void {
    if (!ACCEPTED.includes(file.type)) {
      this.snackbar.open('El comprobante debe ser una imagen (JPG/PNG/WebP) o PDF', 'Cerrar', { duration: 3500 });
      return;
    }
    if (file.size > MAX_SIZE) {
      this.snackbar.open('El comprobante supera los 10 MB', 'Cerrar', { duration: 3500 });
      return;
    }
    this.comprobanteFile.set(file);
    const reader = new FileReader();
    reader.onload = () => {
      this.comprobante.set({ name: file.name, size: file.size, data: String(reader.result) });
    };
    reader.readAsDataURL(file);
  }

  quitarComprobante(): void {
    this.comprobante.set(null);
    this.comprobanteFile.set(null);
  }

  cobrar(): void {
    const orden = this.orden();
    if (!orden) return;
    if (!this.fechaPago) {
      this.snackbar.open('Ingresá una fecha de pago válida', 'Cerrar', { duration: 3000 });
      return;
    }
    const codigoBoleta = this.codigoBoleta.trim();
    if (!codigoBoleta) {
      this.snackbar.open('Debés ingresar el código de boleta (recibo de caja)', 'Cerrar', { duration: 3000 });
      return;
    }
    this.isSubmitting.set(true);
    this.service.pagar(orden.id_orden_pago, {
      fecha_pago: this.fechaPago.toISOString().split('T')[0],
      comprobante: this.comprobante()?.data ?? null,
      codigo_boleta: codigoBoleta,
    }).subscribe({
      next: () => {
        this.isSubmitting.set(false);
        this.snackbar.open(`Pago de ${orden.numero} registrado`, 'Cerrar', { duration: 3000 });
        this.dialogRef.close(true);
      },
      error: err => {
        this.isSubmitting.set(false);
        this.snackbar.open(err.error?.detail || 'Error al registrar el pago', 'Cerrar', { duration: 3500 });
      },
    });
  }

  anular(): void {
    const orden = this.orden();
    if (!orden) return;
    const motivo = this.motivoAnulacion.trim();
    if (!motivo) {
      this.snackbar.open('El motivo de la anulación es obligatorio', 'Cerrar', { duration: 3000 });
      return;
    }
    this.isSubmitting.set(true);
    this.service.anular(orden.id_orden_pago, { motivo_anulacion: motivo }).subscribe({
      next: () => {
        this.isSubmitting.set(false);
        this.huboCambios.set(true);
        this.snackbar.open(`Orden ${orden.numero} anulada`, 'Cerrar', { duration: 3000 });
        this.cerrar();
      },
      error: err => {
        this.isSubmitting.set(false);
        this.snackbar.open(err.error?.detail || 'Error al anular la orden', 'Cerrar', { duration: 3500 });
      },
    });
  }

  imprimir(): void {
    window.print();
  }

  fmt(n: number): string {
    return Number(n || 0).toLocaleString('es-BO', { minimumFractionDigits: 0, maximumFractionDigits: 2 });
  }

  fechaDisplay(iso: string): string {
    if (!iso) return '—';
    return new Date(`${iso}T00:00:00`).toLocaleDateString('es-BO');
  }
}
