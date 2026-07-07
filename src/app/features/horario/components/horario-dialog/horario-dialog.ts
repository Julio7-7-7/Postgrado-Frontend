import { Component, Inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatDialogModule, MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatTooltipModule } from '@angular/material/tooltip';
import { AnalogClockComponent } from '../../../../shared/components/analog-clock/analog-clock';
import { Dia, HorarioCreate, HorarioUpdate } from '../../models/horario.model';

export interface HorarioDialogData {
  detalleId: number;
  horario?: { id: number; dia: Dia; hora_ini: string; hora_fin: string; aula: string | null };
}

@Component({
  selector: 'app-horario-dialog',
  standalone: true,
  imports: [
    CommonModule, ReactiveFormsModule,
    MatDialogModule, MatFormFieldModule, MatInputModule,
    MatButtonModule, MatIconModule, MatTooltipModule,
    AnalogClockComponent,
  ],
  template: `
    <h2 mat-dialog-title>
      <mat-icon class="title-icon">schedule</mat-icon>
      <span>{{ data.horario ? 'Editar Horario' : 'Nuevo Horario' }}</span>
    </h2>

    <mat-dialog-content>
      <form [formGroup]="form" class="horario-form">

        <div class="field-group">
          <label class="field-label">Día@if (!data.horario) { (podés elegir varios) }</label>
          <div class="day-chips">
            @for (d of dias; track d) {
              <button type="button" class="day-chip"
                [class.selected]="diasSel().has(d)"
                (click)="toggleDia(d)">
                {{ diaCorto(d) }}
              </button>
            }
          </div>
        </div>

        <div class="field-group">
          <label class="field-label">Horario</label>
          <div class="clocks-row">
            <div class="clock-card">
              <div class="clock-card-header">
                <mat-icon>login</mat-icon>
                <span>Inicio</span>
              </div>
              <app-analog-clock
                [value]="form.get('hora_ini')?.value || '08:00'"
                (valueChange)="onIniChange($event)"
              />
              <span class="clock-time-label">{{ form.get('hora_ini')?.value || '08:00' }}</span>
            </div>

            <div class="clock-card">
              <div class="clock-card-header">
                <mat-icon>logout</mat-icon>
                <span>Fin</span>
              </div>
              <app-analog-clock
                [value]="form.get('hora_fin')?.value || '09:00'"
                (valueChange)="onFinChange($event)"
              />
              <span class="clock-time-label">{{ form.get('hora_fin')?.value || '09:00' }}</span>
            </div>
          </div>
        </div>

        <mat-form-field appearance="outline" subscriptSizing="dynamic">
          <mat-label>Aula (opcional)</mat-label>
          <input matInput formControlName="aula" placeholder="Ej: Laboratorio 3">
          <mat-icon matIconPrefix>location_on</mat-icon>
        </mat-form-field>

        @if (diasSel().size > 0 && form.valid) {
          <div class="preview-card">
            <div class="preview-icon">
              <mat-icon>calendar_view_month</mat-icon>
            </div>
            <div class="preview-body">
              <span class="preview-title">
                @for (d of diasSel(); track d; let last = $last) {
                  {{ diaCompleto(d) }}@if (!last) {, }
                }
                · {{ form.get('hora_ini')?.value }}–{{ form.get('hora_fin')?.value }}
              </span>
              <span class="preview-meta">
                @if (form.get('aula')?.value) {
                  <span>{{ form.get('aula')?.value }} · </span>
                }
                Se repite cada semana
              </span>
            </div>
          </div>
        }
      </form>
    </mat-dialog-content>

    <mat-dialog-actions align="end">
      <button mat-button (click)="onNoClick()">Cancelar</button>
      <button mat-raised-button color="primary" [disabled]="diasSel().size === 0 || form.invalid" (click)="guardar()">
        {{ data.horario ? 'Guardar' : 'Agregar' }}
      </button>
    </mat-dialog-actions>
  `,
  styles: [`
    .title-icon {
      font-size: 22px;
      width: 22px;
      height: 22px;
      color: var(--fich-primary);
    }

    .horario-form {
      display: flex;
      flex-direction: column;
      gap: 20px;
      padding-top: 4px;
    }

    .field-group {
      display: flex;
      flex-direction: column;
      gap: 8px;
    }

    .field-label {
      font-size: 0.78rem;
      font-weight: 700;
      color: var(--fich-text-secondary);
      text-transform: uppercase;
      letter-spacing: 0.04em;
    }

    .day-chips {
      display: flex;
      gap: 6px;
      flex-wrap: wrap;
    }

    .day-chip {
      flex: 1;
      min-width: 44px;
      padding: 8px 4px;
      border: 2px solid var(--fich-border);
      border-radius: var(--fich-radius-md);
      background: var(--fich-bg-card);
      font-size: 0.8rem;
      font-weight: 600;
      color: var(--fich-text-secondary);
      cursor: pointer;
      transition: all 0.15s;
      text-align: center;
    }

    .day-chip:hover {
      border-color: var(--fich-primary);
      background: var(--fich-primary-light);
      color: var(--fich-primary-dark);
    }

    .day-chip.selected {
      border-color: var(--fich-primary);
      background: var(--fich-primary-light);
      color: var(--fich-primary-dark);
      font-weight: 800;
      box-shadow: 0 0 0 2px var(--fich-primary-light);
    }

    .clocks-row {
      display: flex;
      gap: 16px;
    }

    .clock-card {
      flex: 1;
      border: 1.5px solid var(--fich-border);
      border-radius: var(--fich-radius-lg);
      padding: 12px 8px 8px;
      display: flex;
      flex-direction: column;
      align-items: center;
      background: var(--fich-bg-subtle);
      transition: border-color 0.2s, box-shadow 0.2s;
    }

    .clock-card:focus-within,
    .clock-card:hover {
      border-color: var(--fich-primary);
      box-shadow: 0 0 0 3px var(--fich-primary-light);
    }

    .clock-card-header {
      display: flex;
      align-items: center;
      gap: 4px;
      font-size: 0.75rem;
      font-weight: 600;
      color: var(--fich-text-secondary);
      text-transform: uppercase;
      letter-spacing: 0.04em;
      margin-bottom: 2px;
    }

    .clock-card-header mat-icon {
      font-size: 14px;
      width: 14px;
      height: 14px;
      color: var(--fich-primary);
    }

    .clock-time-label {
      font-size: 0.85rem;
      font-weight: 700;
      color: var(--fich-primary-dark);
      font-family: 'Roboto Mono', monospace;
      margin-top: 4px;
    }

    .preview-card {
      display: flex;
      align-items: center;
      gap: 12px;
      padding: 12px 14px;
      background: #e8f0fe;
      border: 1px solid #c5d9f9;
      border-radius: var(--fich-radius-md);
    }

    .preview-icon {
      display: flex;
      align-items: center;
      justify-content: center;
      width: 36px;
      height: 36px;
      background: var(--fich-primary);
      border-radius: var(--fich-radius-sm);
      flex-shrink: 0;
    }

    .preview-icon mat-icon {
      font-size: 20px;
      width: 20px;
      height: 20px;
      color: #fff;
    }

    .preview-body {
      display: flex;
      flex-direction: column;
      gap: 1px;
    }

    .preview-title {
      font-size: 0.88rem;
      font-weight: 700;
      color: var(--fich-primary-dark);
    }

    .preview-meta {
      font-size: 0.75rem;
      color: var(--fich-text-secondary);
    }
  `]
})
export class HorarioDialogComponent {
  form: FormGroup;
  dias: Dia[] = ['lunes', 'martes', 'miercoles', 'jueves', 'viernes', 'sabado', 'domingo'];
  diasSel = signal<Set<Dia>>(new Set());

  private readonly DIAS_CORTO: Record<string, string> = {
    lunes: 'Lu', martes: 'Ma', miercoles: 'Mi',
    jueves: 'Ju', viernes: 'Vi', sabado: 'Sá', domingo: 'Do',
  };

  private readonly DIAS_COMPLETO: Record<string, string> = {
    lunes: 'Lunes', martes: 'Martes', miercoles: 'Miércoles',
    jueves: 'Jueves', viernes: 'Viernes', sabado: 'Sábado', domingo: 'Domingo',
  };

  constructor(
    private fb: FormBuilder,
    public dialogRef: MatDialogRef<HorarioDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: HorarioDialogData,
  ) {
    this.form = this.fb.group({
      hora_ini: [data.horario?.hora_ini || '20:00', Validators.required],
      hora_fin: [data.horario?.hora_fin || '22:00', Validators.required],
      aula: [data.horario?.aula || ''],
    });
    if (data.horario) {
      this.diasSel.set(new Set([data.horario.dia]));
    }
  }

  diaCorto(dia: string): string {
    return this.DIAS_CORTO[dia] || dia;
  }

  diaCompleto(dia: string): string {
    return this.DIAS_COMPLETO[dia] || dia;
  }

  toggleDia(dia: Dia) {
    if (this.data.horario) return;
    this.diasSel.update(s => {
      const next = new Set(s);
      if (next.has(dia)) next.delete(dia);
      else next.add(dia);
      return next;
    });
  }

  onIniChange(val: string) {
    this.form.patchValue({ hora_ini: val });
  }

  onFinChange(val: string) {
    this.form.patchValue({ hora_fin: val });
  }

  onNoClick(): void {
    this.dialogRef.close();
  }

  guardar(): void {
    if (this.form.invalid || this.diasSel().size === 0) return;
    const v = this.form.value;

    if (this.data.horario) {
      const resultado: HorarioUpdate = {
        dia: this.data.horario.dia,
        hora_ini: v.hora_ini,
        hora_fin: v.hora_fin,
        aula: v.aula || null,
        estado: 'activo',
      };
      this.dialogRef.close(resultado);
    } else {
      const horarios: HorarioCreate[] = [];
      for (const dia of this.diasSel()) {
        horarios.push({
          id_detalle_programa_modulo: this.data.detalleId,
          dia,
          hora_ini: v.hora_ini,
          hora_fin: v.hora_fin,
          aula: v.aula || null,
        });
      }
      this.dialogRef.close(horarios);
    }
  }
}
