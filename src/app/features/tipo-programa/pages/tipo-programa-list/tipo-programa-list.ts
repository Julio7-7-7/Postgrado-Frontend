import { Component, OnInit, signal, inject, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { Observable } from 'rxjs';

// Angular Material
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
import { MatDialogModule, MatDialog } from '@angular/material/dialog';

// Componentes compartidos, Servicios y Modelos
import { ConfirmDialogComponent } from '../../../../shared/components/confirm-dialog/confirm-dialog'; 
import { TipoProgramaService } from '../../services/tipo-programa.service'; 
import { TipoPrograma } from '../../models/tipo-programa.model';

@Component({
  selector: 'app-tipo-programa-list',
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
    MatDialogModule,
    ConfirmDialogComponent
  ],
  templateUrl: './tipo-programa-list.html',
  styleUrl: './tipo-programa-list.css'
})
export class TipoProgramaListComponent implements OnInit {
  private service = inject(TipoProgramaService);
  private dialog = inject(MatDialog);
  private snackbar = inject(MatSnackBar);

  listaTotal = signal<TipoPrograma[]>([]);
  terminoBusqueda = signal('');
  isLoading = signal(true);
  error = signal<string | null>(null);

  listaActivos = computed(() => {
    const busqueda = this.terminoBusqueda().toLowerCase();
    return this.listaTotal().filter(item => 
      item.estado === 'activo' && 
      item.nombre.toLowerCase().includes(busqueda)
    );
  });

  listaInactivos = computed(() => {
    const busqueda = this.terminoBusqueda().toLowerCase();
    return this.listaTotal().filter(item => 
      item.estado === 'inactivo' && 
      item.nombre.toLowerCase().includes(busqueda)
    );
  });

  columnas: string[] = ['id', 'nombre', 'cupo', 'estado', 'acciones'];

  ngOnInit(): void {
    this.cargarDatos();
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

  /**
   * Captura el cambio de estado. 
   * @param event El evento del MatSlideToggle para poder revertirlo si se cancela.
   * @param registro El objeto TipoPrograma a modificar.
   */
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

    dialogRef.afterClosed().subscribe((confirmado: boolean) => {
      if (confirmado) {
        this.ejecutarCambioEstado(registro, esActivoOriginal);
      } else {
        event.source.checked = esActivoOriginal;
      }
    });
  }

  private ejecutarCambioEstado(registro: TipoPrograma, esActivoAnterior: boolean): void {
    const nuevoEstado = esActivoAnterior ? 'inactivo' : 'activo';
    
    // El casting a Observable es necesario si el service devuelve unknown o un tipo genérico
    (this.service.update(registro.id_tipo_programa, { estado: nuevoEstado }) as Observable<TipoPrograma>)
      .subscribe({
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
        error: (err) => {
          console.error(err);
          this.snackbar.open('Error crítico: No se pudo actualizar el estado', 'Cerrar', { duration: 4000 });
          
          // Si falla el servidor, recargamos los datos para asegurar sincronía
          this.cargarDatos();
        }
      });
  }
}