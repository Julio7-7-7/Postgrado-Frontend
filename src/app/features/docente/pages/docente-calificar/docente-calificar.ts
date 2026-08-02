import { Component, OnInit, signal, computed, inject, DestroyRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatDividerModule } from '@angular/material/divider';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MatTooltipModule } from '@angular/material/tooltip';
import { NotaService } from '../../../notas/services/nota.service';
import { DocenteModuloDetalle, NotaItem } from '../../../notas/models/nota.model';
import { SortDir, sortItems } from '../../../../core/utils/sort-utils';

interface AlumnoCalificar {
  id_detalle_programa_alumno: number;
  alumno: { id_alumno: number; nombre: string; apellido: string; ci: string | null } | null;
}
import { NotaRegisterDialog } from '../../../notas/pages/nota-register-dialog/nota-register-dialog';
import { clasificarNota } from '../../../../core/utils/nota-utils';

@Component({
  selector: 'app-docente-calificar',
  standalone: true,
  imports: [
    CommonModule,
    MatCardModule, MatButtonModule, MatIconModule, MatDividerModule,
    MatProgressSpinnerModule, MatSnackBarModule, MatDialogModule, MatTooltipModule,
  ],
  templateUrl: './docente-calificar.html',
  styleUrl: './docente-calificar.css',
})
export class DocenteCalificarComponent implements OnInit {
  private service = inject(NotaService);
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private snackbar = inject(MatSnackBar);
  private dialog = inject(MatDialog);
  private destroyRef = inject(DestroyRef);

  datos = signal<DocenteModuloDetalle | null>(null);
  isLoading = signal(true);
  idDpm = 0;
  idDocente = 0;
  nombreDir = signal<SortDir>('asc');

  alumnosOrdenados = computed(() => {
    const d = this.datos();
    if (!d) return [];
    return sortItems(d.alumnos, a => `${a.alumno?.apellido || ''} ${a.alumno?.nombre || ''}`, this.nombreDir());
  });

  toggleOrden(): void {
    this.nombreDir.set(this.nombreDir() === 'asc' ? 'desc' : 'asc');
  }

  promedioGeneral = computed(() => {
    const d = this.datos();
    if (!d || d.alumnos.length === 0) return 0;
    const conPromedio = d.alumnos.filter(a => a.notas.length > 0);
    if (conPromedio.length === 0) return 0;
    return Math.round(conPromedio.reduce((sum, a) => sum + a.promedio, 0) / conPromedio.length * 10) / 10;
  });

  ngOnInit(): void {
    this.idDpm = Number(this.route.snapshot.paramMap.get('idDpm'));
    this.idDocente = Number(this.route.snapshot.parent?.paramMap.get('id'));
    if (!this.idDpm) {
      this.router.navigate(['/docentes']);
      return;
    }
    this.cargarDatos();
  }

  cargarDatos(): void {
    this.isLoading.set(true);
    this.service.getNotasPorModulo(this.idDpm).pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: data => {
        this.datos.set(data);
        this.isLoading.set(false);
      },
      error: () => {
        this.isLoading.set(false);
        this.snackbar.open('Error al cargar datos del módulo', 'Cerrar', { duration: 3000 });
      },
    });
  }

  agregarNota(a: AlumnoCalificar, event: MouseEvent): void {
    event.stopPropagation();
    const d = this.datos();
    if (!d) return;

    const dialogRef = this.dialog.open(NotaRegisterDialog, {
      width: '480px',
      data: {
        idDetalle: a.id_detalle_programa_alumno,
        alumno: a.alumno,
        idEdicion: d.edicion.id_programa_version_edicion,
      },
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) this.cargarDatos();
    });
  }

  editarNota(nota: NotaItem, a: AlumnoCalificar, event: MouseEvent): void {
    event.stopPropagation();
    const dialogRef = this.dialog.open(NotaRegisterDialog, {
      width: '480px',
      data: {
        idDetalle: a.id_detalle_programa_alumno,
        alumno: a.alumno,
        idEdicion: this.datos()?.edicion.id_programa_version_edicion,
        notaExistente: nota,
      },
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) this.cargarDatos();
    });
  }

  promedioClass(promedio: number): string {
    return clasificarNota(promedio);
  }

  iniciales(a: AlumnoCalificar): string {
    if (!a.alumno) return '??';
    return (a.alumno.nombre[0] + a.alumno.apellido[0]).toUpperCase();
  }

  volver(): void {
    if (this.idDocente) {
      this.router.navigate(['/docentes', this.idDocente, 'mis-modulos']);
    } else {
      this.router.navigate(['/docentes']);
    }
  }
}
