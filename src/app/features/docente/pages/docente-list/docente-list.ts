import { Component, OnInit, signal, inject, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';

import { MatTableModule } from '@angular/material/table';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatTabsModule } from '@angular/material/tabs';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBarModule, MatSnackBar } from '@angular/material/snack-bar';
import { MatDialogModule, MatDialog } from '@angular/material/dialog';
import { MatMenuModule } from '@angular/material/menu';

import { ConfirmDialogComponent } from '../../../../shared/components/confirm-dialog/confirm-dialog';
import { DocenteService } from '../../services/docente.service';
import { Docente } from '../../models/docente.model';

@Component({
  selector: 'app-docente-list',
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

  listaTotal = signal<Docente[]>([]);
  terminoBusqueda = signal('');
  isLoading = signal(true);
  error = signal<string | null>(null);
  criterioOrden = signal<'id' | 'nombre' | 'estado'>('id');

  listaDisponibles = computed(() => this.filtrarYOrdenar('disponible'));
  listaContratados = computed(() => this.filtrarYOrdenar('contratado'));
  listaInactivos = computed(() => this.filtrarYOrdenar('inactivo'));

  columnas: string[] = ['id', 'nombre', 'ci', 'correo', 'titulo', 'estado', 'acciones'];

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

    this.service.getAll().subscribe({
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

  confirmarCancelar(docente: Docente): void {
    const dialogRef = this.dialog.open(ConfirmDialogComponent, {
      width: '420px',
      data: {
        titulo: 'Confirmar',
        mensaje: `¿Está seguro de que desea dar de baja a "${docente.nombre} ${docente.apellido}"?`
      }
    });

    dialogRef.afterClosed().subscribe((confirmado: boolean) => {
      if (confirmado) {
        this.ejecutarCancelar(docente);
      }
    });
  }

  private ejecutarCancelar(docente: Docente): void {
    this.service.cancelar(docente.id_docente).subscribe({
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
