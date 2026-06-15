import { Component, Inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatDialogModule, MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
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
    MatSelectModule, MatButtonModule, MatIconModule,
  ],
  template: `
    <h2 mat-dialog-title>{{ data.horario ? 'Editar Horario' : 'Agregar Horario' }}</h2>
    <mat-dialog-content>
      <form [formGroup]="form" class="horario-form">
        <mat-form-field appearance="outline">
          <mat-label>Día</mat-label>
          <mat-select formControlName="dia" required>
            @for (d of dias; track d) {
              <mat-option [value]="d">{{ d | titlecase }}</mat-option>
            }
          </mat-select>
        </mat-form-field>
        <div class="time-row">
          <div class="time-group">
            <span class="time-label">Hora inicio</span>
            <div class="time-picker">
              <mat-form-field appearance="outline" subscriptSizing="dynamic">
                <mat-select formControlName="hora_ini_h" placeholder="HH">
                  @for (h of horas; track h) {
                    <mat-option [value]="h">{{ h }}</mat-option>
                  }
                </mat-select>
              </mat-form-field>
              <span class="time-sep">:</span>
              <mat-form-field appearance="outline" subscriptSizing="dynamic">
                <mat-select formControlName="hora_ini_m" placeholder="MM">
                  @for (m of minutos; track m) {
                    <mat-option [value]="m">{{ m }}</mat-option>
                  }
                </mat-select>
              </mat-form-field>
              <mat-icon class="clock-icon">schedule</mat-icon>
            </div>
          </div>
          <div class="time-group">
            <span class="time-label">Hora fin</span>
            <div class="time-picker">
              <mat-form-field appearance="outline" subscriptSizing="dynamic">
                <mat-select formControlName="hora_fin_h" placeholder="HH">
                  @for (h of horas; track h) {
                    <mat-option [value]="h">{{ h }}</mat-option>
                  }
                </mat-select>
              </mat-form-field>
              <span class="time-sep">:</span>
              <mat-form-field appearance="outline" subscriptSizing="dynamic">
                <mat-select formControlName="hora_fin_m" placeholder="MM">
                  @for (m of minutos; track m) {
                    <mat-option [value]="m">{{ m }}</mat-option>
                  }
                </mat-select>
              </mat-form-field>
              <mat-icon class="clock-icon">schedule</mat-icon>
            </div>
          </div>
        </div>
        <mat-form-field appearance="outline">
          <mat-label>Aula</mat-label>
          <input matInput formControlName="aula" placeholder="Opcional">
        </mat-form-field>
      </form>
    </mat-dialog-content>
    <mat-dialog-actions align="end">
      <button mat-button (click)="onNoClick()">Cancelar</button>
      <button mat-raised-button color="primary" [disabled]="form.invalid" (click)="guardar()">
        {{ data.horario ? 'Guardar' : 'Agregar' }}
      </button>
    </mat-dialog-actions>
  `,
  styles: [`
    .horario-form { display: flex; flex-direction: column; gap: 16px; min-width: 420px; padding-top: 8px; }
    .time-row { display: flex; gap: 20px; }
    .time-group { flex: 1; display: flex; flex-direction: column; gap: 4px; }
    .time-label { font-size: 0.75rem; font-weight: 600; color: var(--fich-text-muted); padding-left: 4px; text-transform: uppercase; letter-spacing: 0.04em; }
    .time-picker { display: flex; align-items: flex-start; gap: 4px; }
    .time-picker mat-form-field { width: 64px; }
    ::ng-deep .time-picker .mat-mdc-text-field-wrapper { padding: 0 8px !important; }
    ::ng-deep .time-picker .mat-mdc-form-field-subscript-wrapper { display: none !important; }
    ::ng-deep .time-picker .mat-mdc-select-trigger { font-size: 1rem; font-weight: 700; font-family: 'Roboto Mono', monospace; color: var(--fich-primary-dark); }
    .time-sep { font-size: 1.5rem; font-weight: 800; color: var(--fich-primary-dark); padding: 12px 0 0 0; line-height: 1; }
    .clock-icon { color: var(--fich-text-faint); font-size: 22px; width: 22px; height: 22px; margin: 10px 0 0 4px; }
  `]
})
export class HorarioDialogComponent {
  form: FormGroup;
  dias: Dia[] = ['lunes', 'martes', 'miercoles', 'jueves', 'viernes', 'sabado', 'domingo'];
  horas: string[] = Array.from({ length: 24 }, (_, i) => String(i).padStart(2, '0'));
  minutos: string[] = ['00', '15', '30', '45'];

  constructor(
    private fb: FormBuilder,
    public dialogRef: MatDialogRef<HorarioDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: HorarioDialogData,
  ) {
    const ini = data.horario?.hora_ini?.split(':') || ['', ''];
    const fin = data.horario?.hora_fin?.split(':') || ['', ''];
    this.form = this.fb.group({
      dia: [data.horario?.dia || '', Validators.required],
      hora_ini_h: [ini[0] || '', Validators.required],
      hora_ini_m: [ini[1] || '', Validators.required],
      hora_fin_h: [fin[0] || '', Validators.required],
      hora_fin_m: [fin[1] || '', Validators.required],
      aula: [data.horario?.aula || ''],
    });
  }

  onNoClick(): void {
    this.dialogRef.close();
  }

  guardar(): void {
    if (this.form.invalid) return;
    const v = this.form.value;
    const resultado: HorarioCreate | HorarioUpdate = {
      dia: v.dia,
      hora_ini: `${v.hora_ini_h}:${v.hora_ini_m}`,
      hora_fin: `${v.hora_fin_h}:${v.hora_fin_m}`,
      aula: v.aula || null,
    } as any;
    if (this.data.horario) {
      (resultado as HorarioUpdate).estado = 'activo';
    }
    this.dialogRef.close(resultado);
  }
}
