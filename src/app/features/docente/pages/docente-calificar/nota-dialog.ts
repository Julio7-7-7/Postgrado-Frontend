import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { NotaService } from '../../../notas/services/nota.service';
import { DocenteModuloDetalle, NotaResponse } from '../../../notas/models/nota.model';
import { clasificarNota } from '../../../../core/utils/nota-utils';
import { nombreCompleto } from '../../../../core/utils/nombre-utils';

export type AlumnoCalificar = DocenteModuloDetalle['alumnos'][number];

export interface NotaDialogData {
  modo: 'crear' | 'editar';
  alumnos?: AlumnoCalificar[];
  alumno?: AlumnoCalificar;
  idDpm: number;
  fijo?: boolean;
  contexto?: {
    sigla: string;
    edicion: string;
  };
}

export interface NotaDialogResult {
  dpaId: number;
  nota: NotaResponse;
}

@Component({
  selector: 'app-nota-dialog',
  standalone: true,
  imports: [
    CommonModule, FormsModule,
    MatDialogModule, MatButtonModule, MatIconModule,
    MatFormFieldModule, MatInputModule, MatSnackBarModule,
  ],
  templateUrl: './nota-dialog.html',
  styleUrl: './nota-dialog.css',
})
export class NotaDialog {
  private service = inject(NotaService);
  private snackbar = inject(MatSnackBar);
  dialogRef = inject(MatDialogRef<NotaDialog>);
  data = inject<NotaDialogData>(MAT_DIALOG_DATA);

  readonly esCrear = this.data.modo === 'crear';
  readonly esFijo = this.data.fijo === true;
  nombreCompleto = nombreCompleto;
  seleccionId: number | null = this.esCrear
    ? (this.data.alumnos?.[0]?.id_detalle_programa_alumno ?? null)
    : null;
  nota = this.notaInicial();
  busqueda = '';
  isSubmitting = signal(false);

  private notaInicial(): string {
    if (this.esCrear || !this.data.alumno) return '';
    const n = this.data.alumno.notas[0];
    if (!n) return '';
    return String(Math.floor(Number(n.nota) + 0.5));
  }

  get alumno(): AlumnoCalificar | undefined {
    if (!this.esCrear) return this.data.alumno;
    return this.data.alumnos?.find(a => a.id_detalle_programa_alumno === this.seleccionId);
  }

  filtrados(): AlumnoCalificar[] {
    const q = this.busqueda.trim().toLowerCase();
    const lista = this.data.alumnos ?? [];
    if (!q) return lista;
    return lista.filter(a => {
      const nombre = `${a.alumno?.nombre ?? ''} ${a.alumno?.apellido ?? ''}`.toLowerCase();
      const ci = (a.alumno?.ci ?? '').toLowerCase();
      return nombre.includes(q) || ci.includes(q);
    });
  }

  seleccionar(id: number): void {
    this.seleccionId = id;
  }

  notaNumero(): number | null {
    if (this.nota.trim() === '') return null;
    const n = Number(this.nota);
    if (Number.isNaN(n) || n < 0 || n > 100) return null;
    return n;
  }

  clasificacionPreview(): string {
    const n = this.notaNumero();
    return n === null ? '' : clasificarNota(Math.floor(n + 0.5)).replace('cal-', '');
  }

  clasePreview(): string {
    const n = this.notaNumero();
    return n === null ? 'sin-nota' : clasificarNota(Math.floor(n + 0.5)).replace('cal-', '');
  }

  onNotaInput(value: string | number): void {
    const s = String(value ?? '');
    const limpio = s.replace(/\D/g, '').slice(0, 3);
    this.nota = limpio === '' ? '' : String(Math.min(100, Number(limpio)));
  }

  onFocusNota(event: FocusEvent): void {
    (event.target as HTMLInputElement).select();
  }

  iniciales(): string {
    const a = this.alumno;
    if (!a?.alumno) return '??';
    return (a.alumno.nombre[0] + a.alumno.apellido[0]).toUpperCase();
  }

  inicialesDe(a: AlumnoCalificar): string {
    if (!a.alumno) return '??';
    return (a.alumno.nombre[0] + a.alumno.apellido[0]).toUpperCase();
  }

  guardar(): void {
    const notaNum = this.notaNumero();
    const alumno = this.alumno;
    if (!alumno) {
      this.snackbar.open('Seleccioná un alumno', 'Cerrar', { duration: 3000 });
      return;
    }
    if (notaNum === null) {
      this.snackbar.open('Ingresá una nota válida (0 a 100)', 'Cerrar', { duration: 3000 });
      return;
    }

    this.isSubmitting.set(true);
    const peticion = this.esCrear
      ? this.service.create({
          id_detalle_programa_alumno: alumno.id_detalle_programa_alumno,
          id_detalle_programa_modulo: this.data.idDpm,
          nota: notaNum,
          fecha: this.hoy(),
        })
      : this.service.update(alumno.notas[0].id_nota, { nota: notaNum });

    peticion.subscribe({
      next: (resp: NotaResponse) => {
        this.isSubmitting.set(false);
        this.dialogRef.close({ dpaId: alumno.id_detalle_programa_alumno, nota: resp } as NotaDialogResult);
      },
      error: err => {
        this.isSubmitting.set(false);
        this.snackbar.open(err.error?.detail || 'Error al guardar la nota', 'Cerrar', { duration: 4000 });
      },
    });
  }

  private hoy(): string {
    const d = new Date();
    const mes = String(d.getMonth() + 1).padStart(2, '0');
    const dia = String(d.getDate()).padStart(2, '0');
    return `${d.getFullYear()}-${mes}-${dia}`;
  }
}
