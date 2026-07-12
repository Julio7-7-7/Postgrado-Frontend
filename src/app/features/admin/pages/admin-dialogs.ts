import { Component, Inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatDialogModule, MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { MatCheckboxModule } from '@angular/material/checkbox';
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

export interface RolesChangeData {
  email: string;
  rolesActuales: number[];
  opciones: RolResponse[];
}

@Component({
  selector: 'app-roles-change-dialog',
  standalone: true,
  imports: [
    CommonModule, FormsModule,
    MatButtonModule, MatDialogModule, MatCheckboxModule,
  ],
  styles: [`
    .roles-list { display: flex; flex-direction: column; gap: 8px; margin-top: 12px; }
  `],
  template: `
    <h2 mat-dialog-title>Gestionar Roles</h2>
    <mat-dialog-content>
      <p>Usuario: <strong>{{ data.email }}</strong></p>
      <div class="roles-list">
        @for (rol of data.opciones; track rol.id_rol) {
          <mat-checkbox [(ngModel)]="seleccionados[rol.id_rol]">
            {{ rol.nombre }}
            @if (rol.descripcion) {
              <span style="color: #666; font-size: 12px;"> — {{ rol.descripcion }}</span>
            }
          </mat-checkbox>
        }
      </div>
    </mat-dialog-content>
    <mat-dialog-actions align="end">
      <button mat-button mat-dialog-close>Cancelar</button>
      <button mat-raised-button color="primary" [disabled]="!hayCambios()" (click)="confirmar()">Guardar</button>
    </mat-dialog-actions>
  `,
})
export class RolesChangeDialog implements OnInit {
  seleccionados: Record<number, boolean> = {};

  constructor(
    public dialogRef: MatDialogRef<RolesChangeDialog>,
    @Inject(MAT_DIALOG_DATA) public data: RolesChangeData,
  ) {}

  ngOnInit(): void {
    for (const rol of this.data.opciones) {
      this.seleccionados[rol.id_rol] = this.data.rolesActuales.includes(rol.id_rol);
    }
  }

  hayCambios(): boolean {
    const actuales = this.data.rolesActuales.sort().join(',');
    const nuevos = Object.entries(this.seleccionados)
      .filter(([_, v]) => v)
      .map(([k]) => Number(k))
      .sort()
      .join(',');
    return actuales !== nuevos;
  }

  confirmar(): void {
    const resultado = Object.entries(this.seleccionados)
      .filter(([_, v]) => v)
      .map(([k]) => Number(k));
    this.dialogRef.close(resultado);
  }
}
