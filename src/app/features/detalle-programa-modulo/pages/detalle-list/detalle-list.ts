import { Component, OnInit, signal, inject, DestroyRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink, ActivatedRoute, Router } from '@angular/router';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { MatTableModule } from '@angular/material/table';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBarModule, MatSnackBar } from '@angular/material/snack-bar';
import { MatCardModule } from '@angular/material/card';
import { MatDialogModule, MatDialog } from '@angular/material/dialog';
import { ConfirmDialogComponent } from '../../../../shared/components/confirm-dialog/confirm-dialog';
import { DetalleService } from '../../services/detalle.service';
import { DetalleProgramaModulo } from '../../models/detalle.model';

@Component({
  selector: 'app-detalle-list',
  standalone: true,
  imports: [
    CommonModule, RouterLink,
    MatTableModule, MatButtonModule, MatIconModule, MatTooltipModule,
    MatProgressSpinnerModule, MatSnackBarModule, MatCardModule, MatDialogModule,
  ],
  templateUrl: './detalle-list.html',
  styleUrl: './detalle-list.css',
})
export class DetalleListComponent implements OnInit {
  private detalleService = inject(DetalleService);
  private snackbar = inject(MatSnackBar);
  private dialog = inject(MatDialog);
  private router = inject(Router);
  private destroyRef = inject(DestroyRef);

  idEdicion = signal<number>(0);
  detalles = signal<DetalleProgramaModulo[]>([]);
  isLoading = signal(true);
  error = signal<string | null>(null);

  columnas: string[] = ['orden', 'sigla', 'nombre', 'docente', 'fechas', 'estado', 'acciones'];

  ngOnInit(): void {
    const match = this.router.url.match(/\/ediciones\/(\d+)\/modulos/);
    if (!match) {
      this.error.set('Edición no especificada');
      this.isLoading.set(false);
      return;
    }
    this.idEdicion.set(+match[1]);
    this.cargarDetalles();
  }

  cargarDetalles() {
    this.isLoading.set(true);
    this.error.set(null);
    this.detalleService.getAll(this.idEdicion()).pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: (data) => {
        this.detalles.set(data.sort((a, b) => a.orden - b.orden));
        this.isLoading.set(false);
      },
      error: () => {
        this.error.set('No se pudieron cargar los módulos de la edición.');
        this.isLoading.set(false);
        this.snackbar.open('Error al sincronizar datos', 'Cerrar', { duration: 4000 });
      },
    });
  }

  cancelarModulo(detalle: DetalleProgramaModulo) {
    if (detalle.estado === 'cancelado') return;
    const dialogRef = this.dialog.open(ConfirmDialogComponent, {
      width: '420px',
      data: {
        titulo: 'Cancelar Módulo',
        mensaje: `¿Está seguro de cancelar "${detalle.modulo.sigla} - ${detalle.modulo.nombre_modulo}" en esta edición?`,
      },
    });
    dialogRef.afterClosed().subscribe((confirmado: boolean) => {
      if (!confirmado) return;
      this.detalleService.cancelar(detalle.id_detalle_programa_modulo).pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
        next: () => {
          this.cargarDetalles();
          this.snackbar.open('Módulo cancelado', 'OK', { duration: 3000 });
        },
        error: () => this.snackbar.open('Error al cancelar', 'Cerrar', { duration: 4000 }),
      });
    });
  }

  estadoClass(estado: string): string {
    const map: Record<string, string> = {
      programado: 'programado',
      en_curso: 'en-curso',
      pausado: 'pausado',
      reprogramado: 'reprogramado',
      finalizado: 'finalizado',
      cancelado: 'cancelado',
    };
    return map[estado] || '';
  }

  volverAEdiciones(): void {
    const idx = this.router.url.indexOf('/modulos');
    if (idx !== -1) {
      this.router.navigateByUrl(this.router.url.substring(0, idx));
    }
  }
}
