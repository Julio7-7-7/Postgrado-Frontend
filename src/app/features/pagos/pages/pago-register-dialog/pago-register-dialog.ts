import { Component, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
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
import { PagoCreate, AlumnoPagosMatrix, ModuloPagosInfo } from '../../models/pago.model';

interface Bucket {
  key: string;
  id: number | null;
  label: string;
  orden: number;
  esperado: number;
  pagado: number;
}

interface PreviewItem {
  label: string;
  monto: number;
  esUltimo: boolean;
}

interface PagoDialogData {
  alumno: AlumnoPagosMatrix;
  modulos: ModuloPagosInfo[];
  matricula: number;
  precio: number;
}

@Component({
  selector: 'app-pago-register-dialog',
  standalone: true,
  imports: [
    CommonModule, FormsModule,
    MatDialogModule, MatFormFieldModule, MatInputModule, MatSelectModule,
    MatButtonModule, MatIconModule, MatTooltipModule,
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
  data = inject<PagoDialogData>(MAT_DIALOG_DATA);

  target = signal<number | null>(null);
  monto = signal<number | null>(null);
  fechaPago: Date | null = new Date();
  numeroReferencia = '';
  comprobanteUrl = '';
  isSubmitting = signal(false);

  modulosOrdenados = computed(() =>
    [...this.data.modulos].sort((a, b) => a.orden - b.orden)
  );

  matEsperado = computed(() => this.data.alumno.matricula.esperado);
  matPagado = computed(() => this.data.alumno.matricula.pagado);

  cuotaDe(idDpm: number): { esperado: number; pagado: number } {
    const c = this.data.alumno.cuotas.find(x => x.id_detalle_programa_modulo === idDpm);
    return { esperado: c?.esperado ?? 0, pagado: c?.pagado ?? 0 };
  }

  restanteLabel(id: number | null): number {
    if (id === null) return Math.max(0, this.matEsperado() - this.matPagado());
    const { esperado, pagado } = this.cuotaDe(id);
    return Math.max(0, Math.round(esperado - pagado));
  }

  opcionLabel(id: number | null): string {
    if (id === null) {
      const rest = this.restanteLabel(null);
      return rest > 0 ? `Matrícula — restante ${rest} Bs` : 'Matrícula — pagada';
    }
    const m = this.data.modulos.find(x => x.id_detalle_programa_modulo === id);
    const rest = this.restanteLabel(id);
    const sufijo = rest > 0 ? ` · restante ${rest} Bs` : ' · pagada';
    return m ? `Cuota ${m.orden} — ${m.sigla}${sufijo}` : `Cuota`;
  }

  buckets: Bucket[] = [];

  constructor() {
    const matBucket: Bucket = {
      key: 'matricula',
      id: null,
      label: 'Matrícula',
      orden: 0,
      esperado: this.matEsperado(),
      pagado: this.matPagado(),
    };
    const modBuckets: Bucket[] = this.modulosOrdenados().map(m => {
      const { esperado, pagado } = this.cuotaDe(m.id_detalle_programa_modulo);
      return {
        key: `m-${m.id_detalle_programa_modulo}`,
        id: m.id_detalle_programa_modulo,
        label: `Cuota ${m.orden}`,
        orden: m.orden,
        esperado,
        pagado,
      };
    });
    this.buckets = [matBucket, ...modBuckets];

    const defaultTarget = modBuckets.find(b => b.esperado - b.pagado > 0) ?? modBuckets[0];
    this.target.set(defaultTarget ? defaultTarget.id : null);
    const rest = this.restanteLabel(this.target());
    this.monto.set(rest > 0 ? rest : this.cuotaDe(this.target() as number).esperado || 1);
  }

  onTargetChange(id: number | null): void {
    this.target.set(id);
    const rest = this.restanteLabel(id);
    if (rest > 0) this.monto.set(rest);
  }

  preview = computed<PreviewItem[]>(() => {
    const monto = this.monto();
    if (!monto || monto <= 0) return [];

    const targetId = this.target();
    const orden = this.buckets.slice(1);
    let cola: Bucket[];
    if (targetId === null) {
      cola = [this.buckets[0], ...orden];
    } else {
      const idx = orden.findIndex(b => b.id === targetId);
      cola = idx >= 0 ? orden.slice(idx) : orden;
    }

    const items: PreviewItem[] = [];
    let sobra = monto;
    let last: Bucket | null = null;
    for (const b of cola) {
      last = b;
      if (sobra <= 0) break;
      const pendiente = Math.max(0, b.esperado - b.pagado);
      const asignar = Math.min(pendiente, sobra);
      if (asignar > 0) items.push({ label: b.label, monto: asignar, esUltimo: false });
      sobra -= asignar;
    }
    if (sobra > 0.001) {
      if (items.length > 0) {
        items.push({ label: last!.label, monto: sobra, esUltimo: true });
      } else {
        items.push({ label: 'Matrícula', monto: sobra, esUltimo: true });
      }
    }
    return items;
  });

  fmt(n: number): string {
    return Number(n || 0).toLocaleString('es-BO', { minimumFractionDigits: 0, maximumFractionDigits: 2 });
  }

  guardar(): void {
    const monto = this.monto();
    if (!monto || monto <= 0 || !this.fechaPago) {
      this.snackbar.open('Ingresá un monto y una fecha válidos', 'Cerrar', { duration: 3000 });
      return;
    }

    this.isSubmitting.set(true);

    const payload: PagoCreate = {
      id_detalle_programa_alumno: this.data.alumno.id_detalle_programa_alumno,
      id_detalle_programa_modulo: this.target(),
      monto,
      fecha_pago: this.fechaPago.toISOString().split('T')[0],
      concepto: 'auto',
      estado: 'confirmado',
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
