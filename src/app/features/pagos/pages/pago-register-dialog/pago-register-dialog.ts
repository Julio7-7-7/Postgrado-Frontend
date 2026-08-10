import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialog, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule } from '@angular/material/core';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { PagoService } from '../../services/pago.service';
import { AlumnoPagosMatrix, ModuloPagosInfo, PreviewAsignacion, TransaccionPagoCreate } from '../../models/pago.model';
import { ConfirmDialogComponent } from '../../../../shared/components/confirm-dialog/confirm-dialog';
import { UploadBoxComponent } from '../../../../shared/components/upload-box/upload-box';

interface PagoDialogData {
  alumno: AlumnoPagosMatrix;
  modulos: ModuloPagosInfo[];
  matricula: number;
  precio: number;
}

const MAX_SIZE = 10 * 1024 * 1024;
const ACCEPTED = ['image/jpeg', 'image/png', 'image/webp', 'application/pdf'];

@Component({
  selector: 'app-pago-register-dialog',
  standalone: true,
  imports: [
    CommonModule, FormsModule,
    MatDialogModule, MatFormFieldModule, MatInputModule, MatSelectModule,
    MatButtonModule, MatIconModule, MatTooltipModule,
    MatDatepickerModule, MatNativeDateModule,
    MatSnackBarModule, UploadBoxComponent,
  ],
  templateUrl: './pago-register-dialog.html',
  styleUrl: './pago-register-dialog.css',
})
export class PagoRegisterDialog {
  private service = inject(PagoService);
  private snackbar = inject(MatSnackBar);
  private dialog = inject(MatDialog);
  dialogRef = inject(MatDialogRef<PagoRegisterDialog>);
  data = inject<PagoDialogData>(MAT_DIALOG_DATA);

  target = signal<number | null>(null);
  monto = signal<number | null>(null);
  fechaPago: Date | null = new Date();
  comprobante = signal<{ name: string; size: number; data: string } | null>(null);
  comprobanteFile = signal<File | null>(null);
  isSubmitting = signal(false);
  previewAsig = signal<PreviewAsignacion[]>([]);
  previewLoading = signal(false);

  modulos = () => [...this.data.modulos].sort((a, b) => a.orden - b.orden);

  constructor() {
    const modBuckets = this.modulos().map(m => m.id_detalle_programa_modulo);
    const restante = (id: number | null): number => {
      if (id === null) return Math.max(0, this.data.alumno.matricula.esperado - this.data.alumno.matricula.pagado);
      const c = this.data.alumno.cuotas.find(x => x.id_detalle_programa_modulo === id);
      return Math.max(0, Math.round((c?.esperado ?? 0) - (c?.pagado ?? 0)));
    };
    const defaultTarget = modBuckets.find(id => restante(id) > 0) ?? modBuckets[0] ?? null;
    this.target.set(defaultTarget);
    const rest = restante(defaultTarget);
    this.monto.set(rest > 0 ? rest : 1);
    this.actualizarPreview();
  }

  onTargetChange(id: number | null): void {
    this.target.set(id);
    const c = this.data.alumno.cuotas.find(x => x.id_detalle_programa_modulo === id);
    const restante = id === null
      ? Math.max(0, this.data.alumno.matricula.esperado - this.data.alumno.matricula.pagado)
      : Math.max(0, Math.round((c?.esperado ?? 0) - (c?.pagado ?? 0)));
    if (restante > 0) this.monto.set(restante);
    this.actualizarPreview();
  }

  onMontoChange(value: number | string): void {
    const n = Number(value ?? 0);
    this.monto.set(Number.isFinite(n) && n > 0 ? n : null);
    this.actualizarPreview();
  }

  actualizarPreview(): void {
    const monto = this.monto();
    if (!monto || monto <= 0) {
      this.previewAsig.set([]);
      return;
    }
    this.previewLoading.set(true);
    this.service.preview({
      id_detalle_programa_alumno: this.data.alumno.id_detalle_programa_alumno,
      monto,
      fecha_pago: (this.fechaPago ?? new Date()).toISOString().split('T')[0],
    }).subscribe({
      next: resp => {
        this.previewAsig.set(resp.asignaciones);
        this.previewLoading.set(false);
      },
      error: () => {
        this.previewAsig.set([]);
        this.previewLoading.set(false);
      },
    });
  }

  sobrante = (): number => {
    const asig = this.previewAsig();
    if (asig.length <= 1) return 0;
    return asig.slice(1).reduce((acc, a) => acc + a.monto, 0);
  };

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

  fmt(n: number): string {
    return Number(n || 0).toLocaleString('es-BO', { minimumFractionDigits: 0, maximumFractionDigits: 2 });
  }

  guardar(): void {
    const monto = this.monto();
    if (!monto || monto <= 0) {
      this.snackbar.open('Ingresá un monto válido', 'Cerrar', { duration: 3000 });
      return;
    }
    if (!this.fechaPago) {
      this.snackbar.open('Ingresá una fecha válida', 'Cerrar', { duration: 3000 });
      return;
    }
    if (!this.comprobante()) {
      this.snackbar.open('Debés adjuntar el comprobante del pago', 'Cerrar', { duration: 3000 });
      return;
    }

    const sobrante = this.sobrante();
    if (sobrante > 0) {
      const detalle = this.previewAsig().slice(1)
        .map(a => `${a.concepto} (${this.fmt(a.monto)} Bs)`)
        .join(', ');
      const dialogRef = this.dialog.open(ConfirmDialogComponent, {
        width: '460px',
        data: {
          titulo: 'Sobrante de pago',
          mensaje: `El monto de ${this.fmt(this.monto()!)} Bs supera lo pendiente del concepto elegido.\n\nEl sobrante de ${this.fmt(sobrante)} Bs se repartirá en: ${detalle}.\n\n¿Cierto?`,
        },
      });
      dialogRef.afterClosed().subscribe(ok => {
        if (ok) this.crear();
      });
      return;
    }

    this.crear();
  }

  private crear(): void {
    this.isSubmitting.set(true);
    const payload: TransaccionPagoCreate = {
      id_detalle_programa_alumno: this.data.alumno.id_detalle_programa_alumno,
      id_detalle_programa_modulo: this.target(),
      monto: this.monto()!,
      fecha_pago: this.fechaPago!.toISOString().split('T')[0],
      comprobante: this.comprobante()!.data,
    };

    this.service.create(payload).subscribe({
      next: () => {
        this.isSubmitting.set(false);
        this.dialogRef.close(true);
      },
      error: err => {
        this.isSubmitting.set(false);
        this.snackbar.open(err.error?.detail || 'Error al registrar el pago', 'Cerrar', { duration: 3500 });
      },
    });
  }
}
