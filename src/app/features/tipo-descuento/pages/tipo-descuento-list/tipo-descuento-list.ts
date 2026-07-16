import { Component, OnInit, signal, inject, computed, DestroyRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatSlideToggleModule, MatSlideToggleChange } from '@angular/material/slide-toggle';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { ConfirmDialogComponent } from '../../../../shared/components/confirm-dialog/confirm-dialog';
import { TipoDescuentoService } from '../../services/tipo-descuento.service';
import { TipoDescuentoResponse } from '../../models/tipo-descuento.model';
import { TipoDescuentoFormComponent } from '../tipo-descuento-form/tipo-descuento-form';

@Component({
  selector: 'app-tipo-descuento-list',
  standalone: true,
  imports: [
    CommonModule,
    MatButtonModule, MatIconModule, MatTooltipModule,
    MatSlideToggleModule,
    MatProgressSpinnerModule, MatDialogModule, MatSnackBarModule,
  ],
  templateUrl: './tipo-descuento-list.html',
  styleUrl: './tipo-descuento-list.css',
})
export class TipoDescuentoListComponent implements OnInit {
  private service = inject(TipoDescuentoService);
  private dialog = inject(MatDialog);
  private snackbar = inject(MatSnackBar);
  private destroyRef = inject(DestroyRef);

  listaTotal = signal<TipoDescuentoResponse[]>([]);
  isLoading = signal(true);
  error = signal<string | null>(null);
  showInactivos = signal(false);

  listaActivos = computed(() => this.listaTotal().filter(d => d.estado === 'activo'));
  listaInactivos = computed(() => this.listaTotal().filter(d => d.estado === 'inactivo'));

  ngOnInit(): void { this.cargar(); }

  cargar(): void {
    this.isLoading.set(true);
    this.error.set(null);
    this.service.getAll().pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: data => { this.listaTotal.set(data); this.isLoading.set(false); },
      error: () => { this.error.set('Error al cargar descuentos'); this.isLoading.set(false); },
    });
  }

  abrirFormulario(descuento?: TipoDescuentoResponse): void {
    const ref = this.dialog.open(TipoDescuentoFormComponent, {
      width: '640px',
      data: descuento ?? null,
    });
    ref.afterClosed().pipe(takeUntilDestroyed(this.destroyRef)).subscribe(r => {
      if (r) this.cargar();
    });
  }

  toggleEstado(event: MatSlideToggleChange, registro: TipoDescuentoResponse): void {
    const esActivoOriginal = registro.estado === 'activo';
    const accion = esActivoOriginal ? 'desactivar' : 'reactivar';

    const dialogRef = this.dialog.open(ConfirmDialogComponent, {
      width: '420px',
      data: {
        titulo: 'Confirmar Cambio de Estado',
        mensaje: `¿Está seguro de que desea ${accion} el descuento "${registro.nombre}"?`
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

  private ejecutarCambioEstado(registro: TipoDescuentoResponse, esActivoAnterior: boolean): void {
    const nuevoEstado = esActivoAnterior ? 'inactivo' : 'activo';

    this.service.cambiarEstado(registro.id_tipo_descuento).pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: (registroActualizado: TipoDescuentoResponse) => {
        this.listaTotal.update(lista =>
          lista.map(d => d.id_tipo_descuento === registro.id_tipo_descuento ? registroActualizado : d)
        );
        this.snackbar.open(
          `Descuento "${registro.nombre}" ${nuevoEstado === 'activo' ? 'activado' : 'desactivado'}`,
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
