import { Component, Inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatDialogModule, MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatDividerModule } from '@angular/material/divider';

export interface CambioResumen {
  campo: string;
  antes: string | null;
  despues: string | null;
}

export interface ConfirmCambiosData {
  modulo: string;
  sigla: string;
  programa: string;
  version: number;
  edicion: number;
  orden: number;
  modalidad?: string | null;
  docente?: string | null;
  cambios: CambioResumen[];
}

@Component({
  selector: 'app-confirm-cambios-dialog',
  standalone: true,
  imports: [CommonModule, MatDialogModule, MatButtonModule, MatIconModule, MatDividerModule],
  template: `
    <h2 mat-dialog-title class="dialog-title">
      <mat-icon>info</mat-icon>
      Confirmar modificación
    </h2>

    <mat-dialog-content>
      <p class="confirm-intro">¿Está seguro de que desea modificar este módulo?</p>

      <div class="summary-card">
        <div class="summary-header">
          <span class="summary-sigla">{{ data.sigla }}</span>
          <span class="summary-nombre">{{ data.modulo }}</span>
          <span class="summary-orden">#{{ data.orden }}</span>
        </div>

        <div class="summary-context">
          <mat-icon>account_tree</mat-icon>
          <span>{{ data.programa }} · V{{ data.version }} · E{{ data.edicion }}</span>
        </div>

        @if (data.modalidad) {
          <div class="summary-context">
            <mat-icon>school</mat-icon>
            <span>{{ data.modalidad }}</span>
          </div>
        }

        @if (data.docente) {
          <div class="summary-context">
            <mat-icon>person</mat-icon>
            <span>{{ data.docente }}</span>
          </div>
        }

        <mat-divider class="summary-divider"></mat-divider>

        <div class="summary-cambios">
          @for (c of data.cambios; track c.campo) {
            <div class="cambio-row">
              <span class="cambio-campo">{{ c.campo }}</span>
              @if (c.antes !== null) {
                <span class="cambio-antes">{{ c.antes }}</span>
                <span class="cambio-flecha">&rarr;</span>
              }
              <span class="cambio-despues">{{ c.despues ?? '—' }}</span>
            </div>
          }
        </div>
      </div>
    </mat-dialog-content>

    <mat-dialog-actions align="end">
      <button mat-button (click)="onNoClick()">Cancelar</button>
      <button mat-flat-button color="primary" [mat-dialog-close]="true">
        <mat-icon>check</mat-icon> Confirmar
      </button>
    </mat-dialog-actions>
  `,
  styles: [`
    .dialog-title {
      display: flex;
      align-items: center;
      gap: 10px;
      font-weight: 700;
      color: var(--fich-primary-dark);
    }
    .dialog-title mat-icon { color: var(--fich-primary); }
    .confirm-intro {
      margin: 0 0 16px;
      color: var(--fich-text-secondary);
      font-size: 0.92rem;
    }
    .summary-card {
      background: var(--fich-bg-subtle);
      border: 1px solid var(--fich-border);
      border-radius: var(--fich-radius-md);
      padding: 16px;
    }
    .summary-header {
      display: flex;
      align-items: center;
      gap: 8px;
      margin-bottom: 8px;
      flex-wrap: wrap;
    }
    .summary-sigla {
      background: var(--fich-primary);
      color: #fff;
      font-size: 0.72rem;
      font-weight: 700;
      padding: 2px 8px;
      border-radius: var(--fich-radius-sm);
      letter-spacing: 0.3px;
    }
    .summary-nombre {
      font-weight: 700;
      font-size: 0.95rem;
      color: var(--fich-text);
    }
    .summary-orden {
      font-size: 0.78rem;
      color: var(--fich-text-muted);
      font-family: 'Roboto Mono', monospace;
    }
    .summary-context {
      display: flex;
      align-items: center;
      gap: 6px;
      font-size: 0.82rem;
      color: var(--fich-text-secondary);
      margin-top: 4px;
    }
    .summary-context mat-icon {
      font-size: 16px;
      width: 16px;
      height: 16px;
      color: var(--fich-text-muted);
    }
    .summary-divider {
      margin: 12px 0;
    }
    .summary-cambios {
      display: flex;
      flex-direction: column;
      gap: 8px;
    }
    .cambio-row {
      display: flex;
      align-items: center;
      gap: 8px;
      font-size: 0.88rem;
    }
    .cambio-campo {
      font-weight: 600;
      color: var(--fich-text);
      min-width: 70px;
    }
    .cambio-antes {
      color: var(--fich-est-truncado);
      text-decoration: line-through;
      font-size: 0.82rem;
    }
    .cambio-flecha {
      color: var(--fich-text-muted);
      font-weight: 700;
    }
    .cambio-despues {
      font-weight: 600;
      color: var(--fich-est-en-curso);
    }
  `],
})
export class ConfirmCambiosDialogComponent {
  constructor(
    public dialogRef: MatDialogRef<ConfirmCambiosDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: ConfirmCambiosData,
  ) {}

  onNoClick(): void {
    this.dialogRef.close(false);
  }
}
