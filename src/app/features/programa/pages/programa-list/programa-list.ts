import { Component, OnInit, signal, inject, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';

import { MatTableModule } from '@angular/material/table';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatTabsModule } from '@angular/material/tabs';
import { MatSlideToggleModule, MatSlideToggleChange } from '@angular/material/slide-toggle';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBarModule, MatSnackBar } from '@angular/material/snack-bar';
import { MatMenuModule } from '@angular/material/menu';

import { ConfirmDialogComponent } from '../../../../shared/components/confirm-dialog/confirm-dialog';
import { ProgramaService } from '../../services/programa.service';
import { Programa } from '../../models/programa.model';

@Component({
  selector: 'app-programa-list',
  standalone: true,
  imports: [
    CommonModule,
    RouterLink,
    FormsModule,
    MatTableModule,
    MatButtonModule,
    MatIconModule,
    MatTooltipModule,
    MatTabsModule,
    MatSlideToggleModule,
    MatFormFieldModule,
    MatInputModule,
    MatProgressSpinnerModule,
    MatSnackBarModule,
    MatMenuModule,
    ConfirmDialogComponent,
  ],
  templateUrl: './programa-list.html',
  styleUrl: './programa-list.css',
})
export class ProgramaListComponent implements OnInit {
  private service = inject(ProgramaService);
  private snackbar = inject(MatSnackBar);

  listaTotal = signal<Programa[]>([]);
  terminoBusqueda = signal('');
  isLoading = signal(true);
  error = signal<string | null>(null);
  criterioOrden = signal<'id' | 'nombre'>('id');

  listaActivos = computed(() => this.filtrarYOrdenar('activo'));
  listaInactivos = computed(() => this.filtrarYOrdenar('inactivo'));

  columnas: string[] = ['id', 'nombre', 'tipo', 'estado', 'acciones'];

  ngOnInit(): void {
    this.cargarDatos();
  }

  private filtrarYOrdenar(estado: 'activo' | 'inactivo') {
    const busqueda = this.terminoBusqueda().toLowerCase();
    const criterio = this.criterioOrden();

    let resultado = this.listaTotal().filter(
      item =>
        item.estado === estado &&
        item.nombre_programa.toLowerCase().includes(busqueda)
    );

    return [...resultado].sort((a, b) => {
      if (criterio === 'nombre') {
        return a.nombre_programa.localeCompare(b.nombre_programa);
      }
      return a.id_programa - b.id_programa;
    });
  }

  cargarDatos(): void {
    this.isLoading.set(true);
    this.error.set(null);

    this.service.getAll().subscribe({
      next: data => {
        this.listaTotal.set(data);
        this.isLoading.set(false);
      },
      error: () => {
        this.error.set('No se pudo establecer conexión con el servidor.');
        this.isLoading.set(false);
        this.snackbar.open('Error al sincronizar datos', 'Cerrar', {
          duration: 4000,
        });
      },
    });
  }

  toggleEstado(event: MatSlideToggleChange, registro: Programa): void {
    const esActivoOriginal = registro.estado === 'activo';
    const accion = esActivoOriginal ? 'desactivar' : 'reactivar';

    if (!confirm(`¿Está seguro de que desea ${accion} el programa "${registro.nombre_programa}"?`)) {
      event.source.checked = esActivoOriginal;
      return;
    }

    const nuevoEstado = esActivoOriginal ? 'inactivo' : 'activo';

    this.service.update(registro.id_programa, { estado: nuevoEstado }).subscribe({
      next: (registroActualizado: Programa) => {
        this.listaTotal.update(lista =>
          lista.map(t =>
            t.id_programa === registro.id_programa ? registroActualizado : t
          )
        );
        this.snackbar.open(
          `Programa "${registro.nombre_programa}" ${nuevoEstado === 'activo' ? 'activado' : 'desactivado'} con éxito`,
          'OK',
          { duration: 3000 }
        );
      },
      error: (err: unknown) => {
        console.error(err);
        this.snackbar.open(
          'Error crítico: No se pudo actualizar el estado',
          'Cerrar',
          { duration: 4000 }
        );
        this.cargarDatos();
      },
    });
  }
}
