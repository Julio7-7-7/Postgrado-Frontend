import { Component, OnInit, signal, inject, computed, DestroyRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';

import { MatTableModule } from '@angular/material/table';
import { MatPaginatorModule, PageEvent } from '@angular/material/paginator';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBarModule, MatSnackBar } from '@angular/material/snack-bar';
import { MatDialogModule, MatDialog } from '@angular/material/dialog';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';

import { ConfirmDialogComponent } from '../../../../shared/components/confirm-dialog/confirm-dialog';
import { ContratacionService } from '../../services/contratacion.service';
import { ContratacionDocente } from '../../models/contratacion.model';
import { ProgramaService } from '../../../programa/services/programa.service';
import { Programa } from '../../../programa/models/programa.model';
import { AuthService } from '../../../../core/services/auth.service';

@Component({
  selector: 'app-contratacion-list',
  standalone: true,
  imports: [
    CommonModule, RouterLink, FormsModule,
    MatTableModule, MatPaginatorModule, MatButtonModule, MatIconModule, MatTooltipModule,
    MatProgressSpinnerModule, MatSnackBarModule, MatDialogModule, MatCardModule,
    MatFormFieldModule, MatInputModule, MatSelectModule,
  ],
  templateUrl: './contratacion-list.html',
  styleUrl: './contratacion-list.css',
})
export class ContratacionListComponent implements OnInit {
  private service = inject(ContratacionService);
  private programaService = inject(ProgramaService);
  private dialog = inject(MatDialog);
  private snackbar = inject(MatSnackBar);
  private router = inject(Router);
  private destroyRef = inject(DestroyRef);
  private auth = inject(AuthService);

  puedeGestionarEtapas = computed(() => this.auth.hasPermiso('contrataciones.editar'));

  listaTotal = signal<ContratacionDocente[]>([]);
  programas = signal<Programa[]>([]);
  isLoading = signal(true);
  error = signal<string | null>(null);

  terminoBusqueda = signal('');
  filtroProgramaId = signal<number | null>(null);
  sortField = signal<'estado' | 'docente' | 'programa' | 'fecha_inicio'>('estado');
  sortDirection = signal<'asc' | 'desc'>('asc');
  pageIndex = signal(0);
  pageSize = signal(20);

  listaFiltrada = computed(() => {
    const busqueda = this.terminoBusqueda().toLowerCase().trim();
    const progId = this.filtroProgramaId();
    const campo = this.sortField();
    const dir = this.sortDirection();

    const filtrados = this.listaTotal().filter(c => {
      if (progId && c.id_programa !== progId) return false;
      if (busqueda) {
        const nombre = `${c.docente.nombre} ${c.docente.apellido}`.toLowerCase();
        const ci = c.docente.ci.toLowerCase();
        if (!nombre.includes(busqueda) && !ci.includes(busqueda)) return false;
      }
      return true;
    });

    const ordenEstados: Record<string, number> = {
      pendiente: 0,
      verificacion: 1,
      convocatoria: 2,
      seleccion: 3,
      resolucion: 4,
      legal: 5,
      formalizado: 6,
      truncado: 7,
    };
    const factor = dir === 'asc' ? 1 : -1;

    return [...filtrados].sort((a, b) => {
      let cmp = 0;
      switch (campo) {
        case 'estado':
          cmp = (ordenEstados[a.estado] ?? 99) - (ordenEstados[b.estado] ?? 99);
          break;
        case 'docente':
          cmp = `${a.docente.apellido} ${a.docente.nombre}`.localeCompare(
            `${b.docente.apellido} ${b.docente.nombre}`
          );
          break;
        case 'programa':
          cmp = (a.programa_nombre || '').localeCompare(b.programa_nombre || '');
          break;
        case 'fecha_inicio':
          cmp = (a.fecha_inicio || '').localeCompare(b.fecha_inicio || '');
          break;
      }
      return cmp * factor;
    });
  });

  paginatedLista = computed(() => {
    const start = this.pageIndex() * this.pageSize();
    return this.listaFiltrada().slice(start, start + this.pageSize());
  });

  columnas: string[] = ['docente', 'sigla', 'modulo', 'fechas', 'progreso', 'acciones'];

  ngOnInit(): void {
    this.programaService.getAll().pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: (data) => this.programas.set(data),
    });
    this.cargarDatos();
  }

  cargarDatos(): void {
    this.isLoading.set(true);
    this.error.set(null);

    this.service.getAll().pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: (data) => {
        this.listaTotal.set(data);
        this.isLoading.set(false);
      },
      error: () => {
        this.error.set('No se pudo establecer conexión con el servidor.');
        this.isLoading.set(false);
      },
    });
  }

  progresoTexto(c: ContratacionDocente): string {
    if (c.estado === 'formalizado') return 'Completado';
    if (c.estado === 'truncado') return 'Truncado';
    if (c.estado === 'cancelado') return 'Cancelado';
    return c.etapa_actual_nombre || 'Pendiente';
  }

  irADetalle(id: number): void {
    this.router.navigate(['/contrataciones', id]);
  }

  onPageChange(event: PageEvent): void {
    this.pageIndex.set(event.pageIndex);
    this.pageSize.set(event.pageSize);
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

  irARutaDocumental(): void {
    this.router.navigate(['/tipos-programa']);
  }
}
