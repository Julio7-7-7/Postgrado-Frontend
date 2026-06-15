import { Component, Inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatDialogModule, MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatRadioModule } from '@angular/material/radio';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MAT_DATE_LOCALE, provideNativeDateAdapter } from '@angular/material/core';
import { DragDropModule, CdkDragDrop, moveItemInArray } from '@angular/cdk/drag-drop';
import { DetalleProgramaModulo } from '../../models/detalle.model';
import { aFechaString } from '../../../../core/utils/date-utils';

export interface ModificarDialogData {
  detalle: DetalleProgramaModulo;
  modulos: DetalleProgramaModulo[];
}

export interface ModificarResult {
  estado: string;
  fecha_inicio: string | null;
  fecha_fin: string | null;
  motivo: string;
  ordenes?: { id_detalle: number; orden: number }[];
}

@Component({
  selector: 'app-modificar-dialog',
  standalone: true,
  imports: [
    CommonModule, ReactiveFormsModule,
    MatDialogModule, MatFormFieldModule, MatInputModule,
    MatSelectModule, MatButtonModule, MatIconModule,
    MatRadioModule, MatDatepickerModule, DragDropModule,
  ],
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
  templateUrl: './modificar-dialog.html',
  styleUrl: './modificar-dialog.css',
})
export class ModificarDialogComponent {
  form: FormGroup;
  modulos = signal<DetalleProgramaModulo[]>([]);
  currentId: number;

  private readonly ESTADO_TRANSICIONES: Record<string, string[]> = {
    programado: ['en_curso', 'reprogramado'],
    en_curso: ['reprogramado', 'finalizado'],
    reprogramado: ['programado', 'en_curso'],
    finalizado: [],
  };

  estadosDisponibles = computed<{ value: string; label: string }[]>(() => {
    const d = this.data.detalle;
    const permitidos = this.ESTADO_TRANSICIONES[d.estado] ?? [];
    return [
      { value: d.estado, label: this.etiquetaEstado(d.estado) },
      ...permitidos.map(v => ({ value: v, label: this.etiquetaEstado(v) })),
    ];
  });

  constructor(
    private fb: FormBuilder,
    public dialogRef: MatDialogRef<ModificarDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: ModificarDialogData,
  ) {
    this.currentId = data.detalle.id_detalle_programa_modulo;
    this.modulos.set([...data.modulos].sort((a, b) => a.orden - b.orden));

    this.form = this.fb.group({
      nuevo_estado: [data.detalle.estado, Validators.required],
      fecha_inicio: [data.detalle.fecha_inicio ? new Date(data.detalle.fecha_inicio) : null],
      fecha_fin: [data.detalle.fecha_fin ? new Date(data.detalle.fecha_fin) : null],
      motivo: ['', [Validators.required, Validators.minLength(5)]],
    });
  }

  etiquetaEstado(estado: string): string {
    const map: Record<string, string> = {
      programado: 'Programado', en_curso: 'En Curso', reprogramado: 'Reprogramado', finalizado: 'Finalizado',
    };
    return map[estado] || estado;
  }

  onNoClick(): void {
    this.dialogRef.close();
  }

  onDrop(event: CdkDragDrop<DetalleProgramaModulo[]>) {
    const items = this.modulos();
    moveItemInArray(items, event.previousIndex, event.currentIndex);
    this.modulos.set([...items]);
  }

  confirmar(): void {
    if (this.form.invalid) return;
    const v = this.form.value;

    const hayReorder = this.modulos().some((m, i) => m.orden !== i + 1);
    const result: ModificarResult = {
      estado: v.nuevo_estado,
      fecha_inicio: v.fecha_inicio ? aFechaString(v.fecha_inicio) : null,
      fecha_fin: v.fecha_fin ? aFechaString(v.fecha_fin) : null,
      motivo: v.motivo,
    };
    if (hayReorder) {
      result.ordenes = this.modulos().map((m, i) => ({
        id_detalle: m.id_detalle_programa_modulo,
        orden: i + 1,
      }));
    }
    this.dialogRef.close(result);
  }
}
