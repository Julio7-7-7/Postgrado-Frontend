import { Component, Inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatDialogModule, MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatIconModule } from '@angular/material/icon';
import { RolResponse } from '../../roles/models/roles.model';

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
    MatButtonModule, MatDialogModule, MatCheckboxModule, MatIconModule,
  ],
  templateUrl: './roles-change-dialog.html',
  styleUrl: './roles-change-dialog.css',
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
