import { Component, OnInit, signal, inject, DestroyRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterLink } from '@angular/router';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';

import { MatTableModule } from '@angular/material/table';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBarModule, MatSnackBar } from '@angular/material/snack-bar';
import { MatDialogModule, MatDialog } from '@angular/material/dialog';
import { MatCardModule } from '@angular/material/card';

import { ConfirmDialogComponent } from '../../../../shared/components/confirm-dialog/confirm-dialog';
import { ContratacionService } from '../../services/contratacion.service';
import { ContratacionDocente, ContratacionEstado } from '../../models/contratacion.model';
import { RUTA_DOCUMENTAL } from '../../models/documento.model';

@Component({
  selector: 'app-contratacion-list',
  standalone: true,
  imports: [
    CommonModule, RouterLink,
    MatTableModule, MatButtonModule, MatIconModule, MatTooltipModule,
    MatProgressSpinnerModule, MatSnackBarModule, MatDialogModule, MatCardModule,
  ],
  templateUrl: './contratacion-list.html',
  styleUrl: './contratacion-list.css',
})
export class ContratacionListComponent implements OnInit {
  private service = inject(ContratacionService);
  private dialog = inject(MatDialog);
  private snackbar = inject(MatSnackBar);
  private router = inject(Router);
  private destroyRef = inject(DestroyRef);

  lista = signal<ContratacionDocente[]>([]);
  isLoading = signal(true);
  error = signal<string | null>(null);

  columnas: string[] = ['id', 'docente', 'modulo', 'fechas', 'estado', 'progreso', 'acciones'];

  ngOnInit(): void {
    this.cargarDatos();
  }

  cargarDatos(): void {
    this.isLoading.set(true);
    this.error.set(null);

    this.service.getAll().pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: (data) => {
        this.lista.set(data);
        this.isLoading.set(false);
      },
      error: () => {
        this.error.set('No se pudo establecer conexión con el servidor.');
        this.isLoading.set(false);
      },
    });
  }

  progresoTexto(estado: ContratacionEstado): string {
    const map: Record<ContratacionEstado, string> = {
      pendiente: '0/' + RUTA_DOCUMENTAL.length,
      en_curso: 'En trámite',
      formalizado: RUTA_DOCUMENTAL.length + '/' + RUTA_DOCUMENTAL.length,
      truncado: 'Truncado',
    };
    return map[estado];
  }

  irADetalle(id: number): void {
    this.router.navigate(['/contrataciones', id]);
  }

  truncar(c: ContratacionDocente, event: Event): void {
    event.stopPropagation();
    const dialogRef = this.dialog.open(ConfirmDialogComponent, {
      width: '420px',
      data: {
        titulo: 'Truncar contratación',
        mensaje: `¿Está seguro de truncar la contratación de "${c.docente.nombre} ${c.docente.apellido}"? Los documentos quedarán como historial.`,
      },
    });

    dialogRef.afterClosed().pipe(takeUntilDestroyed(this.destroyRef)).subscribe((confirmado) => {
      if (confirmado) {
        this.service.truncar(c.id_contratacion).pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
          next: () => {
            this.snackbar.open('Contratación truncada', 'OK', { duration: 3000 });
            this.cargarDatos();
          },
          error: (err) => {
            this.snackbar.open(err.error?.detail || 'Error al truncar', 'Cerrar', { duration: 4000 });
          },
        });
      }
    });
  }
}
