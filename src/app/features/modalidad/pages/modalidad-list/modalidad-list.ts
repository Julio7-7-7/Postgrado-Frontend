import { Component, OnInit, signal, computed, inject, DestroyRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatSlideToggleModule, MatSlideToggleChange } from '@angular/material/slide-toggle';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { ModalidadService } from '../../services/modalidad.service';
import { ModalidadAcademicaResponse } from '../../models/modalidad.model';
import { ModalidadFormComponent } from '../modalidad-form/modalidad-form';
import { ConfirmDialogComponent } from '../../../../shared/components/confirm-dialog/confirm-dialog';
import { AuthService } from '../../../../core/services/auth.service';

@Component({
  selector: 'app-modalidad-list',
  standalone: true,
  imports: [
    CommonModule,
    MatButtonModule, MatIconModule, MatTooltipModule,
    MatSlideToggleModule, MatProgressSpinnerModule,
    MatDialogModule, MatSnackBarModule,
  ],
  templateUrl: './modalidad-list.html',
  styleUrl: './modalidad-list.css',
})
export class ModalidadListComponent implements OnInit {
  private service = inject(ModalidadService);
  private dialog = inject(MatDialog);
  private snackbar = inject(MatSnackBar);
  private auth = inject(AuthService);
  private destroyRef = inject(DestroyRef);

  canCrear = computed(() => this.auth.hasPermiso('modalidades_academicas.crear'));
  canEditar = computed(() => this.auth.hasPermiso('modalidades_academicas.editar'));

  modalidades = signal<ModalidadAcademicaResponse[]>([]);
  isLoading = signal(true);
  error = signal<string | null>(null);
  showInactivos = signal(false);

  get activas(): ModalidadAcademicaResponse[] {
    return this.modalidades().filter(m => m.estado === 'activo');
  }

  get inactivas(): ModalidadAcademicaResponse[] {
    return this.modalidades().filter(m => m.estado !== 'activo');
  }

  ngOnInit(): void { this.cargar(); }

  cargar(): void {
    this.isLoading.set(true);
    this.error.set(null);
    this.service.getAll().pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: data => { this.modalidades.set(data); this.isLoading.set(false); },
      error: () => { this.error.set('Error al cargar modalidades'); this.isLoading.set(false); },
    });
  }

  abrirFormulario(modalidad?: ModalidadAcademicaResponse): void {
    const ref = this.dialog.open(ModalidadFormComponent, {
      width: '640px',
      data: modalidad ?? null,
    });
    ref.afterClosed().pipe(takeUntilDestroyed(this.destroyRef)).subscribe(r => {
      if (r) this.cargar();
    });
  }

  toggleEstado(event: MatSlideToggleChange, m: ModalidadAcademicaResponse): void {
    const esActivo = m.estado === 'activo';
    const accion = esActivo ? 'desactivar' : 'reactivar';

    const ref = this.dialog.open(ConfirmDialogComponent, {
      width: '420px',
      data: {
        titulo: 'Confirmar Cambio de Estado',
        mensaje: `¿Está seguro de que desea ${accion} la modalidad "${m.nombre_modalidad}"?`,
      },
    });
    ref.afterClosed().pipe(takeUntilDestroyed(this.destroyRef)).subscribe(confirmado => {
      if (confirmado) {
        this.service.cambiarEstado(m.id_modalidad_academica).pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
          next: () => {
            this.snackbar.open(`Modalidad ${accion === 'desactivar' ? 'desactivada' : 'activada'}`, 'Cerrar', { duration: 2000 });
            this.cargar();
          },
          error: err => this.snackbar.open(err.error?.detail || 'Error', 'Cerrar', { duration: 3000 }),
        });
      } else {
        event.source.checked = esActivo;
      }
    });
  }
}
