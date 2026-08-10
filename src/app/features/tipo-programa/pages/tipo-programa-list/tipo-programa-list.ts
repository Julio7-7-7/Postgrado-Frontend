import { Component, OnInit, signal, inject, computed, DestroyRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';

// Angular Material
import { MatTableModule } from '@angular/material/table';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatSlideToggleModule, MatSlideToggleChange } from '@angular/material/slide-toggle';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBarModule, MatSnackBar } from '@angular/material/snack-bar';
import { MatDialogModule, MatDialog } from '@angular/material/dialog';
import { MatMenuModule } from '@angular/material/menu';

// Componentes compartidos, Servicios y Modelos
import { ConfirmDialogComponent } from '../../../../shared/components/confirm-dialog/confirm-dialog'; 
import { TipoProgramaFormComponent } from '../tipo-programa-form/tipo-programa-form'; 
import { TipoProgramaService } from '../../services/tipo-programa.service'; 
import { TipoPrograma } from '../../models/tipo-programa.model';

@Component({
  selector: 'app-tipo-programa-list',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MatTableModule,
    MatButtonModule,
    MatIconModule,
    MatTooltipModule,
    MatSlideToggleModule,
    MatFormFieldModule,
    MatInputModule,
    MatProgressSpinnerModule,
    MatSnackBarModule,
    MatDialogModule,
    MatMenuModule,
  ],
  templateUrl: './tipo-programa-list.html',
  styleUrl: './tipo-programa-list.css'
})
export class TipoProgramaListComponent implements OnInit {
  private service = inject(TipoProgramaService);
  private dialog = inject(MatDialog);
  private snackbar = inject(MatSnackBar);
  private destroyRef = inject(DestroyRef);

  // Estados Base
  listaTotal = signal<TipoPrograma[]>([]);
  terminoBusqueda = signal('');
  isLoading = signal(true);
  error = signal<string | null>(null);
  showInactivos = signal(false);

  criterioOrden = signal<'id' | 'nombre' | 'cupo' | 'duracion'>('id');

  // Listas Computadas con Filtro + Ordenamiento
  listaActivos = computed(() => this.filtrarYOrdenar('activo'));
  listaInactivos = computed(() => this.filtrarYOrdenar('inactivo'));

  columnas: string[] = ['id', 'nombre', 'modalidades', 'cupo', 'duracion', 'estado', 'acciones'];

  ngOnInit(): void {
    this.cargarDatos();
  }

  /**
   * Lógica centralizada para filtrar por texto y luego aplicar el orden seleccionado
   */
  private filtrarYOrdenar(estado: 'activo' | 'inactivo') {
    const busqueda = this.terminoBusqueda().toLowerCase();
    const criterio = this.criterioOrden();

    // 1. Filtrar
    let resultado = this.listaTotal().filter(item => 
      item.estado === estado && 
      item.nombre.toLowerCase().includes(busqueda)
    );

    // 2. Ordenar (Clonamos con [...] para no mutar el original)
    return [...resultado].sort((a, b) => {
      if (criterio === 'nombre') {
        return a.nombre.localeCompare(b.nombre);
      }
      if (criterio === 'cupo') {
        return (a.cupo_minimo || 0) - (b.cupo_minimo || 0);
      }
      if (criterio === 'duracion') {
        return (a.duracion_minima_meses || 0) - (b.duracion_minima_meses || 0);
      }
      // Por defecto ordena por ID
      return a.id_tipo_programa - b.id_tipo_programa;
    });
  }

  cargarDatos(): void {
    this.isLoading.set(true);
    this.error.set(null);

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

  abrirFormulario(registro?: TipoPrograma): void {
    const ref = this.dialog.open(TipoProgramaFormComponent, {
      width: '640px',
      data: registro ?? null,
    });
    ref.afterClosed().pipe(takeUntilDestroyed(this.destroyRef)).subscribe(result => {
      if (result) this.cargarDatos();
    });
  }

  toggleEstado(event: MatSlideToggleChange, registro: TipoPrograma): void {
    const esActivoOriginal = registro.estado === 'activo';
    const accion = esActivoOriginal ? 'desactivar' : 'reactivar';

    const dialogRef = this.dialog.open(ConfirmDialogComponent, {
      width: '420px',
      data: {
        titulo: 'Confirmar Cambio de Estado',
        mensaje: `¿Está seguro de que desea ${accion} el programa "${registro.nombre}"?`
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

  private ejecutarCambioEstado(registro: TipoPrograma, esActivoAnterior: boolean): void {
    const nuevoEstado = esActivoAnterior ? 'inactivo' : 'activo';
    
    this.service.update(registro.id_tipo_programa, { estado: nuevoEstado }).pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: (registroActualizado: TipoPrograma) => {
        this.listaTotal.update(lista =>
          lista.map(t => t.id_tipo_programa === registro.id_tipo_programa ? registroActualizado : t)
        );

        this.snackbar.open(
          `Programa "${registro.nombre}" ${nuevoEstado === 'activo' ? 'activado' : 'desactivado'} con éxito`,
          'OK',
          { duration: 3000 }
        );
      },
      error: (err: unknown) => {
        console.error(err);
        this.snackbar.open('Error crítico: No se pudo actualizar el estado', 'Cerrar', { duration: 4000 });
        this.cargarDatos();
      }
    });
  }
}
