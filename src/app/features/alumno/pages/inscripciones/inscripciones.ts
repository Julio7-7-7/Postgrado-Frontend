import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatChipsModule } from '@angular/material/chips';
import { MatDividerModule } from '@angular/material/divider';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { DetalleProgramaAlumnoService } from '../../services/detalle-programa-alumno.service';
import { DetalleProgramaAlumno, EstadoDetalleAlumno } from '../../models/detalle-programa-alumno.model';
import { Solicitud } from '../../models/solicitud-incorporacion.model';

@Component({
  selector: 'app-inscripciones',
  standalone: true,
  imports: [
    CommonModule,
    MatCardModule, MatButtonModule, MatIconModule, MatChipsModule,
    MatDividerModule, MatProgressSpinnerModule, MatSnackBarModule,
  ],
  templateUrl: './inscripciones.html',
  styleUrl: './inscripciones.css',
})
export class InscripcionesComponent implements OnInit {
  private detalleService = inject(DetalleProgramaAlumnoService);
  private snackBar = inject(MatSnackBar);
  private router = inject(Router);

  inscripciones = signal<DetalleProgramaAlumno[]>([]);
  solicitudes = signal<Solicitud[]>([]);
  cargando = signal(true);

  ngOnInit(): void {
    this.cargarInscripciones();
  }

  private cargarInscripciones(): void {
    this.cargando.set(true);
    let completadas = 0;
    const total = 2;
    const onComplete = () => {
      if (++completadas >= total) this.cargando.set(false);
    };

    this.detalleService.getMisInscripciones().subscribe({
      next: (data) => { this.inscripciones.set(data); onComplete(); },
      error: () => { this.cargando.set(false); this.snackBar.open('Error al cargar inscripciones', 'Cerrar', { duration: 4000 }); },
    });

    this.detalleService.getMisSolicitudes().subscribe({
      next: (data) => { this.solicitudes.set(data); onComplete(); },
      error: onComplete,
    });
  }

  verDetalle(ins: DetalleProgramaAlumno): void {
    if (ins.es_incorporacion && ins.estado === 'postulante') {
      const sol = this.solicitudes().find(s => s.incorporacion?.id_programa_version_edicion === ins.id_programa_version_edicion);
      const allUploaded = sol && sol.documentos && sol.documentos.length > 0 && sol.documentos.every(d => !!d.url_documento);
      if (!allUploaded) {
        this.router.navigate(['/alumnos', 'inscribir', ins.id_programa_version_edicion]);
        return;
      }
    }
    this.router.navigate(['/alumnos/inscripciones', ins.id_detalle_programa_alumno]);
  }

  estadoColor(estado: EstadoDetalleAlumno): string {
    const colors: Record<string, string> = {
      postulante: '#f59e0b',
      observado: '#f97316',
      inscrito: '#3b82f6',
      incorporado: '#0ea5e9',
      finalizado: '#6b7280',
      graduado: '#8b5cf6',
      retirado: '#ef4444',
    };
    return colors[estado] || '#6b7280';
  }

  convertirFecha(fecha: string | null): string {
    if (!fecha) return '—';
    const d = new Date(fecha + 'T12:00:00');
    return d.toLocaleDateString('es-BO', { day: '2-digit', month: 'long', year: 'numeric' });
  }

  docsProgreso(ins: DetalleProgramaAlumno): string {
    if (!ins.control_documentacion || ins.control_documentacion.length === 0) return '';
    const total = ins.control_documentacion.filter(c => c.obligatorio).length;
    const aceptados = ins.control_documentacion.filter(c => c.obligatorio && c.estado === 'aceptado').length;
    return `${aceptados}/${total}`;
  }
}
