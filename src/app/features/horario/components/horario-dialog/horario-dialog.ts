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
          <mat-form-field appearance="outline">
            <mat-label>Hora inicio</mat-label>
            <input matInput type="time" formControlName="hora_ini" required>
          </mat-form-field>
          <mat-form-field appearance="outline">
            <mat-label>Hora fin</mat-label>
            <input matInput type="time" formControlName="hora_fin" required>
          </mat-form-field>
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
    .horario-form { display: flex; flex-direction: column; gap: 16px; min-width: 320px; padding-top: 8px; }
    .time-row { display: flex; gap: 12px; }
    .time-row mat-form-field { flex: 1; }
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
      hora_ini: [data.horario?.hora_ini || '', Validators.required],
      hora_fin: [data.horario?.hora_fin || '', Validators.required],
      aula: [data.horario?.aula || ''],
    });
  }

  onNoClick(): void {
    this.dialogRef.close();
  }

  guardar(): void {
    if (this.form.invalid) return;
    this.dialogRef.close(this.form.value as HorarioCreate | HorarioUpdate);
  }
}
