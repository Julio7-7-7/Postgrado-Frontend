import { Component, OnInit, signal, inject, computed, DestroyRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatTabsModule } from '@angular/material/tabs';
import { MatSlideToggleModule, MatSlideToggleChange } from '@angular/material/slide-toggle';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { ConfirmDialogComponent } from '../../../../shared/components/confirm-dialog/confirm-dialog';
import { RequisitoService } from '../../services/requisito.service';
import { RequisitoResponse } from '../../models/requisito.model';
import { RequisitosFormComponent } from '../requisitos-form/requisitos-form';

@Component({
  selector: 'app-requisitos-list',
  standalone: true,
  imports: [
    CommonModule, FormsModule, RouterModule,
    MatButtonModule, MatIconModule, MatTooltipModule,
    MatTabsModule, MatSlideToggleModule,
    MatFormFieldModule, MatInputModule,
    MatProgressSpinnerModule, MatSnackBarModule, MatDialogModule,
  ],
  templateUrl: './requisitos-list.html',
  styleUrl: './requisitos-list.css',
})
export class RequisitosListComponent implements OnInit {
  private service = inject(RequisitoService);
  private dialog = inject(MatDialog);
  private snackbar = inject(MatSnackBar);
  private destroyRef = inject(DestroyRef);

  listaTotal = signal<RequisitoResponse[]>([]);
  terminoBusqueda = signal('');
  isLoading = signal(true);
  error = signal<string | null>(null);

  listaActivos = computed(() => this.filtrar('activo'));
  listaInactivos = computed(() => this.filtrar('inactivo'));

  ngOnInit(): void { this.cargar(); }

  private filtrar(estado: 'activo' | 'inactivo'): RequisitoResponse[] {
    const busqueda = this.terminoBusqueda().toLowerCase();
    return this.listaTotal().filter(item =>
      item.estado === estado &&
      item.nombre.toLowerCase().includes(busqueda)
    );
  }

  cargar(): void {
    this.isLoading.set(true);
    this.error.set(null);
    this.service.getAll().pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: data => { this.listaTotal.set(data); this.isLoading.set(false); },
      error: () => { this.error.set('Error al cargar requisitos'); this.isLoading.set(false); },
    });
  }

  abrirFormulario(requisito?: RequisitoResponse): void {
    const ref = this.dialog.open(RequisitosFormComponent, {
      width: '520px',
      data: requisito ?? null,
    });
    ref.afterClosed().pipe(takeUntilDestroyed(this.destroyRef)).subscribe(r => {
      if (r) this.cargar();
    });
  }

  toggleEstado(event: MatSlideToggleChange, registro: RequisitoResponse): void {
    const esActivoOriginal = registro.estado === 'activo';
    const accion = esActivoOriginal ? 'desactivar' : 'reactivar';

    const dialogRef = this.dialog.open(ConfirmDialogComponent, {
      width: '420px',
      data: {
        titulo: 'Confirmar Cambio de Estado',
        mensaje: `¿Está seguro de que desea ${accion} el requisito "${registro.nombre}"?`
      }
    });

    dialogRef.afterClosed().pipe(takeUntilDestroyed(this.destroyRef)).subscribe((confirmado: boolean) => {
      if (confirmado) {
        this.ejecutarCambioEstado(registro, esActivoOriginal);
      } else {
        event.source.checked = esActivoOriginal;
      }
    });
  }

  private ejecutarCambioEstado(registro: RequisitoResponse, esActivoAnterior: boolean): void {
    const nuevoEstado = esActivoAnterior ? 'inactivo' : 'activo';

    this.service.update(registro.id_requisito, { estado: nuevoEstado }).pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: (registroActualizado: RequisitoResponse) => {
        this.listaTotal.update(lista =>
          lista.map(r => r.id_requisito === registro.id_requisito ? registroActualizado : r)
        );
        this.snackbar.open(
          `Requisito "${registro.nombre}" ${nuevoEstado === 'activo' ? 'activado' : 'desactivado'}`,
          'OK', { duration: 3000 }
        );
      },
      error: () => {
        this.snackbar.open('Error al actualizar estado', 'Cerrar', { duration: 4000 });
        this.cargar();
      }
    });
  }
}
