import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatChipsModule } from '@angular/material/chips';
import { MatDividerModule } from '@angular/material/divider';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { DetalleProgramaAlumnoService } from '../../services/detalle-programa-alumno.service';
import { DetalleProgramaAlumno, EstadoDetalleAlumno } from '../../models/detalle-programa-alumno.model';

@Component({
  selector: 'app-inscripciones',
  standalone: true,
  imports: [
    CommonModule,
    MatCardModule, MatButtonModule, MatIconModule, MatChipsModule,
    MatDividerModule, MatSnackBarModule,
  ],
  templateUrl: './inscripciones.html',
  styleUrl: './inscripciones.css',
})
export class InscripcionesComponent implements OnInit {
  private detalleService = inject(DetalleProgramaAlumnoService);
  private snackBar = inject(MatSnackBar);

  inscripciones = signal<DetalleProgramaAlumno[]>([]);
  cargando = signal(true);

  ngOnInit(): void {
    this.cargarInscripciones();
  }

  private cargarInscripciones(): void {
    this.cargando.set(true);
    this.detalleService.getMisInscripciones().subscribe({
      next: (data) => {
        this.inscripciones.set(data);
        this.cargando.set(false);
      },
      error: () => {
        this.cargando.set(false);
        this.snackBar.open('Error al cargar inscripciones', 'Cerrar', { duration: 4000 });
      },
    });
  }

  estadoColor(estado: EstadoDetalleAlumno): string {
    const colors: Record<string, string> = {
      postulante: '#f59e0b',
      inscrito: '#3b82f6',
      en_curso: '#10b981',
      finalizado: '#6b7280',
      graduado: '#8b5cf6',
      titulado: '#1d4ed8',
      retirado: '#ef4444',
      observado: '#f97316',
    };
    return colors[estado] || '#6b7280';
  }

  convertirFecha(fecha: string | null): string {
    if (!fecha) return '—';
    const d = new Date(fecha + 'T12:00:00');
    return d.toLocaleDateString('es-BO', { day: '2-digit', month: 'long', year: 'numeric' });
  }
}
