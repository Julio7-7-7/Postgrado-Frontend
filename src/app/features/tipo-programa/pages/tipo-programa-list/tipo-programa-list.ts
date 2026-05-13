import { Component, OnInit, signal, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';

// Angular Material
import { MatTableModule } from '@angular/material/table';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatTooltipModule } from '@angular/material/tooltip';

// Servicios y modelos
import { TipoProgramaService } from '../../services/tipo-programa.service';
import { TipoPrograma } from '../../models/tipo-programa.model';

@Component({
  selector: 'app-tipo-programa-list',
  standalone: true,
  imports: [
    CommonModule,
    RouterLink,
    MatTableModule,
    MatButtonModule,
    MatIconModule,
    MatTooltipModule
  ],
  templateUrl: './tipo-programa-list.html',
  styleUrl: './tipo-programa-list.css'
})
export class TipoProgramaListComponent implements OnInit {

  private service = inject(TipoProgramaService);

  // Signal reactivo
  tiposPrograma = signal<TipoPrograma[]>([]);

  // Columnas de la tabla (deben coincidir con matColumnDef en el HTML)
  columnas: string[] = [
    'id',
    'nombre',
    'estado',
    'cupo',
    'acciones'
  ];

  ngOnInit(): void {
    this.cargarDatos();
  }

  cargarDatos(): void {
    this.service.getAll().subscribe({
      next: (data) => {
        console.log('Datos recibidos:', data);
        this.tiposPrograma.set(data);
      },
      error: (err) => {
        console.error('Error al cargar datos:', err);
      }
    });
  }

  eliminar(id: number): void {
    const confirmado = confirm('¿Estás seguro de eliminar este registro?');
    if (!confirmado) return;

    this.service.delete(id).subscribe({
      next: () => {
        this.tiposPrograma.update(actual =>
          actual.filter(item => item.id_tipo_programa !== id)
        );
      },
      error: (err) => {
        console.error(err);
        alert('Error al eliminar el registro');
      }
    });
  }
}