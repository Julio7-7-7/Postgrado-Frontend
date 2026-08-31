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
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBarModule, MatSnackBar } from '@angular/material/snack-bar';
import { MatDialogModule, MatDialog } from '@angular/material/dialog';
import { MatMenuModule } from '@angular/material/menu';

import { ConfirmDialogComponent } from '../../../../shared/components/confirm-dialog/confirm-dialog';
import { AuthService } from '../../../../core/services/auth.service';
import { DocenteService } from '../../services/docente.service';
import { Docente } from '../../models/docente.model';
import { NavigationBackService } from '../../../../core/navigation/navigation-back.service';
import { nombreCompleto } from '../../../../core/utils/nombre-utils';

@Component({
  selector: 'app-docente-list',
  standalone: true,
  imports: [
    CommonModule,
    RouterLink,
    FormsModule,
    MatTableModule,
    MatPaginatorModule,
    MatButtonModule,
    MatIconModule,
    MatTooltipModule,
    MatFormFieldModule,
    MatInputModule,
    MatProgressSpinnerModule,
    MatSnackBarModule,
    MatDialogModule,
    MatMenuModule,
  ],
  templateUrl: './docente-list.html',
  styleUrl: './docente-list.css'
})
export class DocenteListComponent implements OnInit {
  private service = inject(DocenteService);
  private dialog = inject(MatDialog);
  private snackbar = inject(MatSnackBar);
  private router = inject(Router);
  private destroyRef = inject(DestroyRef);
  private navBack = inject(NavigationBackService);
  private auth = inject(AuthService);

  canCrear = computed(() => this.auth.hasPermiso('docentes.crear'));
  canEditar = computed(() => this.auth.hasPermiso('docentes.editar'));
  nombreCompleto = nombreCompleto;

  listaTotal = signal<Docente[]>([]);
  terminoBusqueda = signal('');
  isLoading = signal(true);
  error = signal<string | null>(null);
  criterioOrden = signal<'id' | 'nombre' | 'estado'>('id');
  showInactivos = signal(false);
  pageIndex = signal(0);
  pageSize = signal(20);

  listaActivos = computed(() => this.filtrarYOrdenar('activo'));
  listaInactivos = computed(() => this.filtrarYOrdenar('inactivo'));
  paginatedActivos = computed(() => {
    const start = this.pageIndex() * this.pageSize();
    return this.listaActivos().slice(start, start + this.pageSize());
  });

  columnas: string[] = ['id', 'nombre', 'ci', 'extension', 'correo', 'grado', 'titulo', 'estado', 'acciones'];

  ngOnInit(): void {
    this.cargarDatos();
  }

  private filtrarYOrdenar(estado: string) {
    const busqueda = this.terminoBusqueda().toLowerCase();
    const criterio = this.criterioOrden();

    let resultado = this.listaTotal().filter(item =>
      item.estado === estado &&
      (item.nombre.toLowerCase().includes(busqueda) ||
       item.apellido.toLowerCase().includes(busqueda) ||
       item.ci.toLowerCase().includes(busqueda))
    );

    return [...resultado].sort((a, b) => {
      if (criterio === 'nombre') {
        const nombreA = `${a.nombre} ${a.apellido}`;
        const nombreB = `${b.nombre} ${b.apellido}`;
        return nombreA.localeCompare(nombreB);
      }
      if (criterio === 'estado') {
        return a.estado.localeCompare(b.estado);
      }
      return a.id_docente - b.id_docente;
    });
  }

  cargarDatos(): void {
    this.isLoading.set(true);
    this.error.set(null);
    this.pageIndex.set(0);

    this.service.getAll().pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: (data) => {
        this.listaTotal.set(data);
        this.isLoading.set(false);
      },
      error: (err) => {
        console.error('Error al cargar datos:', err);
        this.error.set('No se pudo establecer conexión con el servidor.');
        this.isLoading.set(false);
        this.snackbar.open('Error al sincronizar datos', 'Cerrar', { duration: 4000 });
      }
    });
  }

  irADetalle(id: number): void {
    this.navBack.setReturn(this.router.url);
    this.router.navigate(['/docentes', id]);
  }

  onPageChange(event: PageEvent): void {
    this.pageIndex.set(event.pageIndex);
    this.pageSize.set(event.pageSize);
  }

  confirmarCancelar(docente: Docente, event: Event): void {
    event.stopPropagation();
    const dialogRef = this.dialog.open(ConfirmDialogComponent, {
      width: '420px',
      data: {
        titulo: 'Confirmar',
        mensaje: `¿Está seguro de que desea dar de baja a "${docente.nombre} ${docente.apellido}"?`
      }
    });

    dialogRef.afterClosed().pipe(takeUntilDestroyed(this.destroyRef)).subscribe((confirmado: boolean) => {
      if (confirmado) {
        this.ejecutarCancelar(docente);
      }
    });
  }

  private ejecutarCancelar(docente: Docente): void {
    this.service.cancelar(docente.id_docente).pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: () => {
        this.snackbar.open(`Docente "${docente.nombre} ${docente.apellido}" dado de baja`, 'OK', { duration: 3000 });
        this.cargarDatos();
      },
      error: (err) => {
        console.error(err);
        this.snackbar.open(
          err.error?.detail || 'Error al cambiar estado',
          'Cerrar',
          { duration: 4000 }
        );
      }
    });
  }
}
