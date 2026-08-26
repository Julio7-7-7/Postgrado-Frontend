import { Component, Inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatDialogModule, MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { aDate } from '../../../../core/utils/date-utils';

export interface OverlapEdition {
  gestion: string;
  fecha_inicio: string;
  fecha_fin: string | null;
}

export interface EdicionSolapadaData {
  nuevasFechas: { inicio: string; fin: string | null };
  ediciones: OverlapEdition[];
}

@Component({
  selector: 'app-edicion-solapada-dialog',
  standalone: true,
  imports: [CommonModule, MatDialogModule, MatButtonModule, MatIconModule],
  templateUrl: './edicion-solapada-dialog.html',
  styleUrl: './edicion-solapada-dialog.css',
})
export class EdicionSolapadaDialogComponent {
  readonly minDate: number;
  readonly maxDate: number;
  readonly totalDays: number;
  readonly items: EditionBar[];

  constructor(
    @Inject(MAT_DIALOG_DATA) public data: EdicionSolapadaData,
    private dialogRef: MatDialogRef<EdicionSolapadaDialogComponent>,
  ) {
    const itemsRaw: EditionBar[] = data.ediciones.map(e => ({
      gestion: e.gestion,
      inicio: aDate(e.fecha_inicio)!.getTime(),
      fin: e.fecha_fin ? aDate(e.fecha_fin)!.getTime() : aDate(e.fecha_inicio)!.getTime(),
      esNueva: false,
    }));

    const nuevaInicio = aDate(data.nuevasFechas.inicio)!.getTime();
    const nuevaFin = data.nuevasFechas.fin ? aDate(data.nuevasFechas.fin)!.getTime() : nuevaInicio;

    itemsRaw.push({
      gestion: 'Tu nueva edición',
      inicio: nuevaInicio,
      fin: nuevaFin,
      esNueva: true,
    });

    this.minDate = Math.min(...itemsRaw.map(i => i.inicio));
    this.maxDate = Math.max(...itemsRaw.map(i => i.fin));
    this.totalDays = (this.maxDate - this.minDate) / (1000 * 60 * 60 * 24) || 1;

    this.items = itemsRaw;
  }

  pct(date: number): number {
    return ((date - this.minDate) / (1000 * 60 * 60 * 24)) / this.totalDays * 100;
  }

  overlapStart(existing: EditionBar): number {
    const nueva = this.items[this.items.length - 1];
    return Math.max(existing.inicio, nueva.inicio);
  }

  overlapEnd(existing: EditionBar): number {
    const nueva = this.items[this.items.length - 1];
    return Math.min(existing.fin, nueva.fin);
  }

  hasOverlap(existing: EditionBar): boolean {
    return this.overlapStart(existing) < this.overlapEnd(existing);
  }

  formatDate(ts: number): string {
    const d = new Date(ts);
    return d.toLocaleDateString('es-BO', { day: '2-digit', month: '2-digit', year: 'numeric' });
  }

  confirmar(): void {
    this.dialogRef.close(true);
  }

  cancelar(): void {
    this.dialogRef.close(false);
  }
}

interface EditionBar {
  gestion: string;
  inicio: number;
  fin: number;
  esNueva: boolean;
}
