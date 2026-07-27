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
import { NotaService } from '../../../notas/services/nota.service';
import { TranscriptResponse, InscripcionTranscript, ModuloTranscript } from '../../../inscripciones/models/inscripcion-edicion.model';
import { HistorialTransferencia } from '../../../notas/models/nota.model';
import { clasificarNota } from '../../../../core/utils/nota-utils';

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
  private notaService = inject(NotaService);
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private snackbar = inject(MatSnackBar);
  private destroyRef = inject(DestroyRef);

  transcript = signal<TranscriptResponse | null>(null);
  transferencias = signal<HistorialTransferencia[]>([]);
  isLoading = signal(true);
  idAlumno = 0;

  ngOnInit(): void {
    this.idAlumno = Number(this.route.snapshot.paramMap.get('idAlumno'));
    if (!this.idAlumno) {
      this.router.navigate(['/admin/inscripciones']);
      return;
    }
    this.loadTranscript(this.idAlumno);
  }

  loadTranscript(idAlumno: number): void {
    this.isLoading.set(true);
    this.service.getTranscript(idAlumno)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: data => {
          this.transcript.set(data);
          this.loadHistorial(idAlumno);
        },
        error: () => {
          this.isLoading.set(false);
          this.snackbar.open('Error al cargar transcript', 'Cerrar', { duration: 3000 });
        },
      });
  }

  private loadHistorial(idAlumno: number): void {
    this.notaService.getHistorialTransferencias(idAlumno)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: data => {
          this.transferencias.set(data.transferencias);
          this.isLoading.set(false);
        },
        error: () => {
          this.transferencias.set([]);
          this.isLoading.set(false);
        },
      });
  }

  volver(): void {
    this.router.navigate(['/admin/inscripciones']);
  }

  estadoClass(estado: string): string {
    const map: Record<string, string> = {
      postulante: 'estado-postulante',
      observado: 'estado-observado',
      inscrito: 'estado-inscrito',
      incorporado: 'estado-incorporado',
      finalizado: 'estado-finalizado',
      retirado: 'estado-retirado',
      graduado: 'estado-graduado',
    };
    return map[estado] || '';
  }

  estadoLabel(estado: string): string {
    const map: Record<string, string> = {
      postulante: 'Postulante',
      observado: 'Observado',
      inscrito: 'Inscrito',
      incorporado: 'Incorporado',
      finalizado: 'Finalizado',
      retirado: 'Retirado',
      graduado: 'Graduado',
    };
    return map[estado] || estado;
  }

  semestreLabel(s: number | null): string {
    if (!s) return '';
    return s === 1 ? 'I' : 'II';
  }

  round(n: number): number {
    return Math.floor(n + 0.5);
  }

  notaClass(nota: number | null): string {
    if (nota === null) return '';
    return clasificarNota(nota);
  }

  blockClass(idx: number, total: number): string {
    if (total <= 1) return '';
    return `block-${Math.min(idx + 1, 3)}`;
  }

  currentModIdx(ins: InscripcionTranscript): number {
    return ins.modulos.findIndex(
      m => m.nota === null && m.modulo_orden >= ins.modulo_inicio
    );
  }

  gridCols(n: number): string {
    return `repeat(${n}, 1fr)`;
  }

  modTypeClass(mod: ModuloTranscript, ins: InscripcionTranscript): string {
    if (mod.nota === null && mod.modulo_orden < ins.modulo_inicio) return 'gc-skipped';
    if (mod.nota === null) {
      const firstNull = this.currentModIdx(ins);
      const mi = ins.modulos.indexOf(mod);
      if (mi === firstNull) return 'gc-current';
      return 'gc-future';
    }
    return 'gc-done';
  }

  cellTooltip(mod: ModuloTranscript, ins: InscripcionTranscript): string {
    if (mod.modulo_orden < ins.modulo_inicio) {
      return 'Módulo no cursado (incorporación)';
    }
    if (mod.nota !== null) {
      const cal = mod.calificacion ? mod.calificacion.charAt(0).toUpperCase() + mod.calificacion.slice(1) : '';
      const base = `${mod.modulo_nombre}: ${Math.floor(mod.nota + 0.5)} (${cal})`;
      const parts = [base];
      if (mod.es_migrada && mod.edicion_origen_numero !== null) {
        parts.push(`Migrada de Ed. ${mod.edicion_origen_numero} (${mod.edicion_origen_semestre}-${mod.edicion_origen_anio})`);
      }
      if (mod.migrado_a_edicion_numero !== null) {
        parts.push(`Migrada a Ed. ${mod.migrado_a_edicion_numero} (${mod.migrado_a_edicion_semestre}-${mod.migrado_a_edicion_anio})`);
      }
      return parts.join('\n');
    }
    return `${mod.modulo_nombre} — pendiente`;
  }

  snakeWidth(ins: InscripcionTranscript): string {
    if (ins.modulos.length === 0) return '0%';
    const completed = ins.modulos.filter(m => m.nota !== null).length;
    return `${(completed / ins.modulos.length) * 100}%`;
  }
}
