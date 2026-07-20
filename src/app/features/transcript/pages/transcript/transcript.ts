import { Component, OnInit, signal, inject, DestroyRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { InscripcionEdicionService } from '../../../inscripciones/services/inscripcion-edicion.service';
import { TranscriptResponse } from '../../../inscripciones/models/inscripcion-edicion.model';

@Component({
  selector: 'app-transcript',
  standalone: true,
  imports: [
    CommonModule,
    MatIconModule, MatButtonModule, MatTooltipModule,
    MatProgressSpinnerModule, MatSnackBarModule,
  ],
  templateUrl: './transcript.html',
  styleUrl: './transcript.css',
})
export class TranscriptComponent implements OnInit {
  private service = inject(InscripcionEdicionService);
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private snackbar = inject(MatSnackBar);
  private destroyRef = inject(DestroyRef);

  transcript = signal<TranscriptResponse | null>(null);
  isLoading = signal(true);

  ngOnInit(): void {
    const idAlumno = Number(this.route.snapshot.paramMap.get('idAlumno'));
    if (!idAlumno) {
      this.router.navigate(['/admin/inscripciones']);
      return;
    }
    this.loadTranscript(idAlumno);
  }

  loadTranscript(idAlumno: number): void {
    this.isLoading.set(true);
    this.service.getTranscript(idAlumno)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: data => {
          this.transcript.set(data);
          this.isLoading.set(false);
        },
        error: () => {
          this.isLoading.set(false);
          this.snackbar.open('Error al cargar transcript', 'Cerrar', { duration: 3000 });
        },
      });
  }

  volver(): void {
    this.router.navigate(['/admin/inscripciones']);
  }

  estadoClass(estado: string): string {
    const map: Record<string, string> = {
      postulante: 'estado-postulante',
      inscrito: 'estado-inscrito',
      en_curso: 'estado-en_curso',
      incorporado: 'estado-incorporado',
      finalizado: 'estado-finalizado',
      observado: 'estado-observado',
      retirado: 'estado-retirado',
      graduado: 'estado-graduado',
      titulado: 'estado-titulado',
    };
    return map[estado] || '';
  }

  estadoLabel(estado: string): string {
    const map: Record<string, string> = {
      postulante: 'Postulante',
      inscrito: 'Inscrito',
      en_curso: 'En Curso',
      incorporado: 'Incorporado',
      finalizado: 'Finalizado',
      observado: 'Observado',
      retirado: 'Retirado',
      graduado: 'Graduado',
      titulado: 'Titulado',
    };
    return map[estado] || estado;
  }

  semestreLabel(s: number | null): string {
    if (!s) return '';
    return s === 1 ? 'I' : 'II';
  }

  notaClass(nota: number | null): string {
    if (nota === null) return '';
    if (nota >= 70) return 'nota-aprobado';
    if (nota >= 51) return 'nota-regular';
    return 'nota-reprobado';
  }
}
