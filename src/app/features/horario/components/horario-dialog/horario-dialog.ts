import { Component, Inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatDialogModule, MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
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
    MatSelectModule, MatButtonModule, MatIconModule,
    AnalogClockComponent,
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

        <div class="clocks-row">
          <div class="clock-card">
            <div class="clock-card-header">
              <mat-icon>schedule</mat-icon>
              <span>Inicio</span>
            </div>
            <app-analog-clock
              [value]="form.get('hora_ini')?.value || '08:00'"
              (valueChange)="onIniChange($event)"
            />
          </div>

          <div class="clock-card">
            <div class="clock-card-header">
              <mat-icon>schedule</mat-icon>
              <span>Fin</span>
            </div>
            <app-analog-clock
              [value]="form.get('hora_fin')?.value || '09:00'"
              (valueChange)="onFinChange($event)"
            />
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
    .horario-form { display: flex; flex-direction: column; gap: 16px; padding-top: 8px; }
    .clocks-row { display: flex; gap: 16px; justify-content: center; }
    .clock-card {
      flex: 1;
      min-width: 0;
      border: 1.5px solid var(--fich-border);
      border-radius: var(--fich-radius-lg);
      padding: 12px 8px;
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
      font-size: 0.8rem;
      font-weight: 600;
      color: var(--fich-text-secondary);
      text-transform: uppercase;
      letter-spacing: 0.04em;
      margin-bottom: 4px;
    }
    .clock-card-header mat-icon {
      font-size: 16px;
      width: 16px;
      height: 16px;
      color: var(--fich-primary);
    }
  `]
})
export class HorarioDialogComponent {
  form: FormGroup;
  dias: Dia[] = ['lunes', 'martes', 'miercoles', 'jueves', 'viernes', 'sabado', 'domingo'];

  constructor(
    private fb: FormBuilder,
    public dialogRef: MatDialogRef<HorarioDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: HorarioDialogData,
  ) {
    this.form = this.fb.group({
      dia: [data.horario?.dia || '', Validators.required],
      hora_ini: [data.horario?.hora_ini || '08:00', Validators.required],
      hora_fin: [data.horario?.hora_fin || '09:00', Validators.required],
      aula: [data.horario?.aula || ''],
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
    if (this.form.invalid) return;
    const v = this.form.value;
    const resultado: HorarioCreate | HorarioUpdate = {
      dia: v.dia,
      hora_ini: v.hora_ini,
      hora_fin: v.hora_fin,
      aula: v.aula || null,
    } as any;
    if (this.data.horario) {
      (resultado as HorarioUpdate).estado = 'activo';
    }
    this.dialogRef.close(resultado);
  }
}
