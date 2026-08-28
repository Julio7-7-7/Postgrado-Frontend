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
import { CarreraService } from '../../services/carrera.service';
import { Carrera } from '../../models/carrera.model';
import { CarreraFormComponent } from '../carrera-form/carrera-form';
import { ConfirmDialogComponent } from '../../../../shared/components/confirm-dialog/confirm-dialog';
import { AuthService } from '../../../../core/services/auth.service';

@Component({
  selector: 'app-carrera-list',
  standalone: true,
  imports: [
    CommonModule,
    MatButtonModule, MatIconModule, MatTooltipModule,
    MatSlideToggleModule, MatProgressSpinnerModule,
    MatDialogModule, MatSnackBarModule,
  ],
  templateUrl: './carrera-list.html',
  styleUrl: './carrera-list.css',
})
export class CarreraListComponent implements OnInit {
  private service = inject(CarreraService);
  private dialog = inject(MatDialog);
  private snackbar = inject(MatSnackBar);
  private auth = inject(AuthService);
  private destroyRef = inject(DestroyRef);

  canCrear = computed(() => this.auth.hasPermiso('carreras.crear'));
  canEditar = computed(() => this.auth.hasPermiso('carreras.editar'));

  carreras = signal<Carrera[]>([]);
  isLoading = signal(true);
  error = signal<string | null>(null);
  showInactivos = signal(false);

  get activas(): Carrera[] {
    return this.carreras().filter(c => c.estado === 'activo');
  }

  get inactivas(): Carrera[] {
    return this.carreras().filter(c => c.estado !== 'activo');
  }

  ngOnInit(): void { this.cargar(); }

  cargar(): void {
    this.isLoading.set(true);
    this.error.set(null);
    this.service.getAll().pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: data => { this.carreras.set(data); this.isLoading.set(false); },
      error: () => { this.error.set('Error al cargar carreras'); this.isLoading.set(false); },
    });
  }

  abrirFormulario(carrera?: Carrera): void {
    const ref = this.dialog.open(CarreraFormComponent, {
      width: '560px',
      data: carrera ?? null,
    });
    ref.afterClosed().pipe(takeUntilDestroyed(this.destroyRef)).subscribe(r => {
      if (r) this.cargar();
    });
  }

  toggleEstado(event: MatSlideToggleChange, c: Carrera): void {
    const esActivo = c.estado === 'activo';
    const accion = esActivo ? 'desactivar' : 'reactivar';

    const ref = this.dialog.open(ConfirmDialogComponent, {
      width: '420px',
      data: {
        titulo: 'Confirmar Cambio de Estado',
        mensaje: `¿Está seguro de que desea ${accion} la carrera "${c.nombre}"?`,
      },
    });
    ref.afterClosed().pipe(takeUntilDestroyed(this.destroyRef)).subscribe(confirmado => {
      if (confirmado) {
        this.service.cambiarEstado(c.id_carrera).pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
          next: () => {
            this.snackbar.open(`Carrera ${accion === 'desactivar' ? 'desactivada' : 'activada'}`, 'Cerrar', { duration: 2000 });
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