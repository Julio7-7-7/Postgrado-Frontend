import { Component, OnInit, signal, inject, DestroyRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { DocumentacionService } from '../../services/documentacion.service';
import {
  ProgramaVersionEdicionResponse,
  PostulanteResponse,
  ControlDocumentacionResponse,
} from '../../models/documentacion.model';

@Component({
  selector: 'app-documentacion',
  standalone: true,
  imports: [
    CommonModule, FormsModule,
    MatIconModule, MatButtonModule, MatFormFieldModule,
    MatInputModule, MatSelectModule, MatProgressSpinnerModule,
    MatSnackBarModule,
  ],
  templateUrl: './documentacion.html',
  styleUrl: './documentacion.css',
})
export class DocumentacionComponent implements OnInit {
  private service = inject(DocumentacionService);
  private snackbar = inject(MatSnackBar);
  private destroyRef = inject(DestroyRef);

  ediciones = signal<ProgramaVersionEdicionResponse[]>([]);
  postulantes = signal<PostulanteResponse[]>([]);
  isLoading = signal(false);
  edicionSeleccionada = signal<number | null>(null);
  expandedId = signal<number | null>(null);

  ngOnInit(): void {
    this.service.getEdiciones().pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: data => this.ediciones.set(data),
      error: () => this.snackbar.open('Error al cargar ediciones', 'Cerrar', { duration: 3000 }),
    });
  }

  programaNombre(ed: ProgramaVersionEdicionResponse): string {
    return ed.programa_version?.programa?.nombre_programa || `Programa #${ed.programa_version?.id_programa_version}`;
  }

  cargarPostulantes(idEdicion: number): void {
    this.edicionSeleccionada.set(idEdicion);
    this.isLoading.set(true);
    this.expandedId.set(null);
    this.service.getPostulantesPorEdicion(idEdicion).pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: data => {
        this.postulantes.set(data);
        this.isLoading.set(false);
      },
      error: () => {
        this.isLoading.set(false);
        this.snackbar.open('Error al cargar postulantes', 'Cerrar', { duration: 3000 });
      },
    });
  }

  toggleExpand(id: number): void {
    this.expandedId.set(this.expandedId() === id ? null : id);
  }

  iniciales(p: PostulanteResponse): string {
    if (!p.alumno) return '??';
    return (p.alumno.nombre[0] + p.alumno.apellido[0]).toUpperCase();
  }

  cambiarEstado(doc: ControlDocumentacionResponse, estado: string): void {
    this.service.updateControlDocumentacion(doc.id_control_documentacion, { estado })
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: () => {
          doc.estado = estado;
          this.snackbar.open('Estado actualizado', 'Cerrar', { duration: 2000 });
          this.recargarPostulantes();
        },
        error: err => this.snackbar.open(err.error?.detail || 'Error', 'Cerrar', { duration: 3000 }),
      });
  }

  rechazar(doc: ControlDocumentacionResponse): void {
    const obs = prompt('Observaciones (requerido para rechazar):');
    if (obs === null) return;
    if (!obs.trim()) {
      this.snackbar.open('Las observaciones son requeridas', 'Cerrar', { duration: 3000 });
      return;
    }
    this.service.updateControlDocumentacion(doc.id_control_documentacion, {
      estado: 'rechazado',
      observaciones: obs,
    }).pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: () => {
        doc.estado = 'rechazado';
        doc.observaciones = obs;
        this.snackbar.open('Documento rechazado', 'Cerrar', { duration: 2000 });
        this.recargarPostulantes();
      },
      error: err => this.snackbar.open(err.error?.detail || 'Error', 'Cerrar', { duration: 3000 }),
    });
  }

  private recargarPostulantes(): void {
    const id = this.edicionSeleccionada();
    if (id) {
      this.service.getPostulantesPorEdicion(id).pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
        next: data => this.postulantes.set(data),
      });
    }
  }
}
