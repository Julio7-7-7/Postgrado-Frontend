import { Component, OnInit, signal, computed, inject, DestroyRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { NotaService } from '../../services/nota.service';
import { AlumnoNotas, NotaResponse } from '../../models/nota.model';
import { NotaRegisterDialog } from '../nota-register-dialog/nota-register-dialog';
import { clasificarNota } from '../../../../core/utils/nota-utils';

@Component({
  selector: 'app-notas-edicion',
  standalone: true,
  imports: [
    CommonModule,
    MatIconModule, MatButtonModule, MatTooltipModule,
    MatProgressSpinnerModule, MatSnackBarModule, MatDialogModule,
  ],
  templateUrl: './notas-edicion.html',
  styleUrl: './notas-edicion.css',
})
export class NotasEdicionComponent implements OnInit {
  private service = inject(NotaService);
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private snackbar = inject(MatSnackBar);
  private dialog = inject(MatDialog);
  private destroyRef = inject(DestroyRef);

  alumnos = signal<AlumnoNotas[]>([]);
  isLoading = signal(true);
  expandedId = signal<number | null>(null);
  showRetirados = signal(false);
  idEdicion = 0;

  activos = computed(() => this.alumnos().filter(a => a.estado !== 'retirado'));
  retirados = computed(() => this.alumnos().filter(a => a.estado === 'retirado'));

  ngOnInit(): void {
    this.idEdicion = Number(this.route.snapshot.paramMap.get('idEdicion'));
    if (!this.idEdicion) {
      this.router.navigate(['/admin/notas']);
      return;
    }
    this.cargarDatos();
  }

  cargarDatos(): void {
    this.isLoading.set(true);
    this.service.getNotasPorEdicion(this.idEdicion).pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: data => {
        this.alumnos.set(data);
        this.isLoading.set(false);
      },
      error: () => {
        this.isLoading.set(false);
        this.snackbar.open('Error al cargar notas', 'Cerrar', { duration: 3000 });
      },
    });
  }

  toggleExpand(a: AlumnoNotas): void {
    const newId = this.expandedId() === a.id_detalle_programa_alumno ? null : a.id_detalle_programa_alumno;
    this.expandedId.set(newId);
  }

  iniciales(a: AlumnoNotas): string {
    if (!a.alumno) return '??';
    return (a.alumno.nombre[0] + a.alumno.apellido[0]).toUpperCase();
  }

  promedioClass(promedio: number): string {
    return clasificarNota(promedio);
  }

  agregarNota(a: AlumnoNotas, event: MouseEvent): void {
    event.stopPropagation();
    const dialogRef = this.dialog.open(NotaRegisterDialog, {
      width: '480px',
      data: { idDetalle: a.id_detalle_programa_alumno, alumno: a.alumno, idEdicion: this.idEdicion },
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) this.cargarDatos();
    });
  }

  editarNota(nota: NotaResponse, a: AlumnoNotas, event: MouseEvent): void {
    event.stopPropagation();
    const dialogRef = this.dialog.open(NotaRegisterDialog, {
      width: '480px',
      data: { idDetalle: a.id_detalle_programa_alumno, alumno: a.alumno, idEdicion: this.idEdicion, notaExistente: nota },
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) this.cargarDatos();
    });
  }

  volver(): void {
    this.router.navigate(['/admin/notas']);
  }
}
