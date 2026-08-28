import { Component, OnInit, signal, inject, DestroyRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { MAT_DIALOG_DATA, MatDialogRef, MatDialogModule, MatDialog } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBarModule, MatSnackBar } from '@angular/material/snack-bar';
import { MatChipsModule } from '@angular/material/chips';
import { MatTooltipModule } from '@angular/material/tooltip';

import { EtapaService } from '../../services/etapa.service';
import { EtapaContratacion } from '../../models/etapa.model';
import { RequisitoService } from '../../../requisitos/services/requisito.service';
import { RequisitoResponse } from '../../../requisitos/models/requisito.model';
import { ConfirmDialogComponent } from '../../../../shared/components/confirm-dialog/confirm-dialog';

@Component({
  selector: 'app-etapa-contratacion-dialog',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MatDialogModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatIconModule,
    MatProgressSpinnerModule,
    MatSnackBarModule,
    MatChipsModule,
    MatTooltipModule,
  ],
  templateUrl: './etapa-contratacion-dialog.html',
  styleUrl: './etapa-contratacion-dialog.css',
})
export class EtapaContratacionDialogComponent implements OnInit {
  private service = inject(EtapaService);
  private requisitoService = inject(RequisitoService);
  private snackbar = inject(MatSnackBar);
  private destroyRef = inject(DestroyRef);
  private dialogRef = inject(MatDialogRef<EtapaContratacionDialogComponent>);
  private dialog = inject(MatDialog);

  data: { tipoProgramaId: number; tipoProgramaNombre: string } = inject(MAT_DIALOG_DATA);

  etapas = signal<EtapaContratacion[]>([]);
  requisitos = signal<RequisitoResponse[]>([]);
  loading = signal(true);
  guardando = signal(false);
  nuevaEtapaNombre = signal('');
  editandoEtapaId = signal<number | null>(null);
  editandoEtapaNombre = signal('');
  gestionandoRequisitos = signal<number | null>(null);
  requisitosSeleccionados = signal<Set<number>>(new Set());

  ngOnInit(): void {
    this.cargarEtapas();
    this.cargarRequisitos();
  }

  private cargarEtapas(): void {
    this.loading.set(true);
    this.service.getAll(this.data.tipoProgramaId).pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: (etapas) => {
        this.etapas.set(etapas.sort((a, b) => a.orden - b.orden));
        this.loading.set(false);
      },
      error: () => {
        this.loading.set(false);
      },
    });
  }

  private cargarRequisitos(): void {
    this.requisitoService.getAll().pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: (requisitos) => {
        this.requisitos.set(requisitos.filter(r => r.estado === 'activo'));
      },
    });
  }

  agregarEtapa(): void {
    const nombre = this.nuevaEtapaNombre().trim();
    if (!nombre) return;

    this.guardando.set(true);
    this.service.create({
      id_tipo_programa: this.data.tipoProgramaId,
      nombre,
    }).pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: (etapa) => {
        this.etapas.update(etapas => [...etapas, etapa].sort((a, b) => a.orden - b.orden));
        this.nuevaEtapaNombre.set('');
        this.guardando.set(false);
        this.snackbar.open('Etapa creada', 'OK', { duration: 2000 });
      },
      error: (err) => {
        this.guardando.set(false);
        this.snackbar.open(err.error?.detail || 'Error al crear etapa', 'Cerrar', { duration: 4000 });
      },
    });
  }

  iniciarEdicion(etapa: EtapaContratacion): void {
    this.editandoEtapaId.set(etapa.id_etapa);
    this.editandoEtapaNombre.set(etapa.nombre);
  }

  cancelarEdicion(): void {
    this.editandoEtapaId.set(null);
    this.editandoEtapaNombre.set('');
  }

  guardarEdicion(etapa: EtapaContratacion): void {
    const nombre = this.editandoEtapaNombre().trim();
    if (!nombre) return;

    this.guardando.set(true);
    this.service.update(etapa.id_etapa, { nombre }).pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: (actualizada) => {
        this.etapas.update(etapas =>
          etapas.map(e => e.id_etapa === actualizada.id_etapa ? actualizada : e)
        );
        this.cancelarEdicion();
        this.guardando.set(false);
        this.snackbar.open('Etapa actualizada', 'OK', { duration: 2000 });
      },
      error: (err) => {
        this.guardando.set(false);
        this.snackbar.open(err.error?.detail || 'Error al actualizar etapa', 'Cerrar', { duration: 4000 });
      },
    });
  }

  eliminarEtapa(etapa: EtapaContratacion): void {
    const dialogRef = this.dialog.open(ConfirmDialogComponent, {
      width: '400px',
      data: {
        titulo: 'Eliminar etapa',
        mensaje: `¿Está seguro de eliminar la etapa "${etapa.nombre}"? Se eliminarán también sus requisitos asociados.`,
      },
    });

    dialogRef.afterClosed().pipe(takeUntilDestroyed(this.destroyRef)).subscribe((confirmado) => {
      if (confirmado) {
        this.service.delete(etapa.id_etapa).pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
          next: () => {
            this.etapas.update(etapas => etapas.filter(e => e.id_etapa !== etapa.id_etapa));
            this.snackbar.open('Etapa eliminada', 'OK', { duration: 2000 });
          },
          error: (err) => {
            this.snackbar.open(err.error?.detail || 'Error al eliminar etapa', 'Cerrar', { duration: 4000 });
          },
        });
      }
    });
  }

  abrirGestionRequisitos(etapa: EtapaContratacion): void {
    this.gestionandoRequisitos.set(etapa.id_etapa);
    this.requisitosSeleccionados.set(new Set(etapa.requisitos.map(r => r.id_requisito)));
  }

  cerrarGestionRequisitos(): void {
    this.gestionandoRequisitos.set(null);
    this.requisitosSeleccionados.set(new Set());
  }

  toggleRequisito(idRequisito: number): void {
    this.requisitosSeleccionados.update(s => {
      const next = new Set(s);
      if (next.has(idRequisito)) next.delete(idRequisito);
      else next.add(idRequisito);
      return next;
    });
  }

  guardarRequisitos(): void {
    const etapaId = this.gestionandoRequisitos();
    if (!etapaId) return;

    const requisitos = Array.from(this.requisitosSeleccionados()).map((id, idx) => ({
      id_requisito: id,
      orden: idx + 1,
    }));

    this.guardando.set(true);
    this.service.update(etapaId, {}).pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: () => {
        this.cargarEtapas();
        this.cerrarGestionRequisitos();
        this.guardando.set(false);
        this.snackbar.open('Requisitos actualizados', 'OK', { duration: 2000 });
      },
      error: (err) => {
        this.guardando.set(false);
        this.snackbar.open(err.error?.detail || 'Error al actualizar requisitos', 'Cerrar', { duration: 4000 });
      },
    });
  }

  cerrar(): void {
    this.dialogRef.close(true);
  }
}
