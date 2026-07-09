import { Component, Inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatDialogModule, MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';
import { RolResponse } from '../models/admin.models';

export interface ConfirmData {
  message: string;
}

@Component({
  selector: 'app-confirm-dialog',
  standalone: true,
  imports: [CommonModule, MatDialogModule, MatButtonModule],
  template: `
    <h2 mat-dialog-title>Confirmar</h2>
    <mat-dialog-content>
      <p>{{ data.message }}</p>
    </mat-dialog-content>
    <mat-dialog-actions align="end">
      <button mat-button mat-dialog-close>Cancelar</button>
      <button mat-raised-button color="warn" [mat-dialog-close]="true">Confirmar</button>
    </mat-dialog-actions>
  `,
})
export class ConfirmDialog {
  constructor(
    public dialogRef: MatDialogRef<ConfirmDialog>,
    @Inject(MAT_DIALOG_DATA) public data: ConfirmData,
  ) {}
}

export interface RolChangeData {
  email: string;
  roleActual: string;
  opciones: RolResponse[];
}

@Component({
  selector: 'app-rol-change-dialog',
  standalone: true,
  imports: [
    CommonModule, FormsModule,
    MatButtonModule, MatDialogModule,
    MatFormFieldModule, MatSelectModule,
  ],
  styles: ['.full-width { width: 100%; margin-top: 8px; }'],
  template: `
    <h2 mat-dialog-title>Cambiar Rol</h2>
    <mat-dialog-content>
      <p>Usuario: <strong>{{ data.email }}</strong></p>
      <p>Rol actual: <strong>{{ data.roleActual }}</strong></p>
      <mat-form-field appearance="outline" class="full-width">
        <mat-label>Nuevo rol</mat-label>
        <mat-select #rolSelect>
          <mat-option *ngFor="let r of data.opciones" [value]="r.id_rol">{{ r.nombre }}</mat-option>
        </mat-select>
      </mat-form-field>
    </mat-dialog-content>
    <mat-dialog-actions align="end">
      <button mat-button mat-dialog-close>Cancelar</button>
      <button mat-raised-button color="primary" (click)="confirmar(rolSelect.value)">Cambiar</button>
    </mat-dialog-actions>
  `,
})
export class RolChangeDialog {
  constructor(
    public dialogRef: MatDialogRef<RolChangeDialog>,
    @Inject(MAT_DIALOG_DATA) public data: RolChangeData,
  ) {}

  confirmar(value: any): void {
    if (value) this.dialogRef.close(value);
  }
}
