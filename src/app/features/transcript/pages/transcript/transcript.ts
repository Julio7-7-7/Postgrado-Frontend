import { Component, OnInit, signal, computed, inject, DestroyRef } from '@angular/core';
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
import { PagoService } from '../../../pagos/services/pago.service';
import { TranscriptResponse, InscripcionTranscript, ModuloTranscript } from '../../../inscripciones/models/inscripcion-edicion.model';
import { HistorialMovimiento } from '../../../notas/models/nota.model';
import { TransaccionTranscript, TranscriptPagosResponse } from '../../../pagos/models/pago.model';
import { clasificarNota } from '../../../../core/utils/nota-utils';

const CLASIF_LABELS: Record<string, string> = {
  'cal-abandono': 'Abandono',
  'cal-insuficiente': 'Insuficiente',
  'cal-suficiente': 'Suficiente',
  'cal-bueno': 'Bueno',
  'cal-distinguido': 'Distinguido',
  'cal-sobresaliente': 'Sobresaliente',
};

interface CaptionPart {
  t: string;
  hi: boolean;
}

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
  private pagoService = inject(PagoService);
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private snackbar = inject(MatSnackBar);
  private destroyRef = inject(DestroyRef);

  transcript = signal<TranscriptResponse | null>(null);
  movimientos = signal<HistorialMovimiento[]>([]);
  pagosData = signal<TranscriptPagosResponse | null>(null);
  isLoading = signal(true);
  idAlumno = 0;

  lastInscripcion = computed<InscripcionTranscript | null>(() => {
    const t = this.transcript();
    if (!t || t.inscripciones.length === 0) return null;
    return t.inscripciones[t.inscripciones.length - 1];
  });

  tieneTrayectoria = computed(() => {
    const t = this.transcript();
    return t !== null && t.inscripciones.length > 1;
  });

  migradasInfo = computed<{ de: number | null; cuantas: number } | null>(() => {
    const ins = this.lastInscripcion();
    if (!ins) return null;
    const migradas = ins.modulos.filter(m => m.es_migrada);
    if (migradas.length === 0) return null;
    return { de: migradas[0].edicion_origen_numero, cuantas: migradas.length };
  });

  stats = computed<{ icono: string; valor: number; label: string; clase: string }[]>(() => {
    const ins = this.lastInscripcion();
    if (!ins) return [];
    const aprobados = ins.modulos.filter(m => this.aprobado(m)).length;
    const pendientes = this.modulosPendientes(ins).length;
    const migrados = ins.modulos.filter(m => m.es_migrada).length;
    const enCurso = this.currentModIdx(ins) >= 0 ? 1 : 0;
    return [
      { icono: 'check_circle', valor: aprobados, label: 'Aprobados', clase: 'stat-aprobado' },
      { icono: 'play_circle', valor: enCurso, label: 'En curso', clase: 'stat-encurso' },
      { icono: 'schedule', valor: pendientes, label: 'Pendientes', clase: 'stat-pendiente' },
      { icono: 'swap_horiz', valor: migrados, label: 'Migrados', clase: 'stat-migrado' },
    ];
  });

  situacion = computed<{ icono: string; partes: CaptionPart[] }>(() => {
    const P = (t: string, hi = false): CaptionPart => ({ t, hi });
    const t = this.transcript();
    if (!t || t.inscripciones.length === 0) {
      return { icono: 'school', partes: [P('Este alumno no tiene inscripciones registradas.')] };
    }
    const ins = this.lastInscripcion()!;
    const ed = `Ed. ${ins.edicion_numero ?? ''}`;
    const total = ins.modulos.length;
    const aprobados = ins.modulos.filter(m => this.aprobado(m)).length;
    const migradas = ins.modulos.filter(m => m.es_migrada);
    const pendientes = this.modulosPendientes(ins);
    const cur = this.currentModOrden(ins);
    const origen = t.inscripciones[t.inscripciones.length - 2]?.edicion_numero ?? '';

    if (ins.estado === 'postulante' || ins.estado === 'observado') {
      return { icono: 'hourglass_empty', partes: [P('Postulante en la '), P(ed, true), P(' — aún no cursa módulos.')] };
    }
    if (ins.estado === 'retirado') {
      return { icono: 'person_off', partes: [P('Se retiró en la '), P(ed, true), P('.')] };
    }
    if (ins.estado === 'finalizado' || ins.estado === 'graduado') {
      const partes: CaptionPart[] = [
        P('Finalizó en la '), P(ed, true),
        P(' — completó '), P(`${aprobados} de ${total}`, true),
        P(' módulos'),
      ];
      if (t.promedio_general !== null) {
        partes.push(P(' con un promedio de '), P(String(this.round(t.promedio_general)), true));
      }
      partes.push(P('.'));
      return { icono: 'workspace_premium', partes };
    }
    if (migradas.length > 0 && this.tieneTrayectoria()) {
      const aprobadasMigradas = migradas.filter(m => this.aprobado(m)).length;
      const partes: CaptionPart[] = [
        P('Viene de la '), P(`Ed. ${origen}`, true),
        P(' — aprobó '), P(`${aprobadasMigradas} de ${total}`, true),
        P(' módulos que se migran'),
      ];
      if (pendientes.length > 0) {
        partes.push(P('; debe aprobar '), P(this.fmtLista(pendientes), true), P(' en la '), P(ed, true));
      }
      partes.push(P('.'));
      return { icono: 'swap_horiz', partes };
    }
    const partes: CaptionPart[] = [P('Inscrito en la '), P(ed, true), P(' — ')];
    if (aprobados === 0) {
      const hi = `Módulo ${ins.modulo_inicio}`;
      const arranque = ins.modulo_inicio > 1 ? `arrancó en el ${hi}` : `comenzará por el ${hi}`;
      const idx = arranque.indexOf(hi);
      partes.push(P(arranque.slice(0, idx)), P(hi, true), P(arranque.slice(idx + hi.length)));
    } else {
      partes.push(P('lleva '), P(`${aprobados} de ${total}`, true), P(' módulos aprobados'));
    }
    if (cur !== null) {
      partes.push(P('; cursa el '), P(`Módulo ${cur}`, true));
    }
    partes.push(P('.'));
    return { icono: 'flag', partes };
  });

  ngOnInit(): void {
    this.idAlumno = Number(this.route.snapshot.paramMap.get('idAlumno'));
    if (!this.idAlumno) {
      this.router.navigate(['/inscripciones']);
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
          this.loadPagos(idAlumno);
        },
        error: () => {
          this.isLoading.set(false);
          this.snackbar.open('Error al cargar transcript', 'Cerrar', { duration: 3000 });
        },
      });
  }

  private loadHistorial(idAlumno: number): void {
    this.notaService.getHistorialMovimientos(idAlumno)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: data => {
          this.movimientos.set(data.movimientos);
          this.isLoading.set(false);
        },
        error: () => {
          this.movimientos.set([]);
          this.isLoading.set(false);
        },
      });
  }

  private loadPagos(idAlumno: number): void {
    this.pagoService.getTranscriptPagos(idAlumno)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: data => this.pagosData.set(data),
        error: () => this.pagosData.set(null),
      });
  }

  fmt(n: number): string {
    return Number(n || 0).toLocaleString('es-BO', { minimumFractionDigits: 0, maximumFractionDigits: 2 });
  }

  fechaPago(iso: string): string {
    if (!iso) return '—';
    return new Date(`${iso}T00:00:00`).toLocaleDateString('es-BO');
  }

  volver(): void {
    this.router.navigate(['/inscripciones']);
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

  aprobado(mod: ModuloTranscript): boolean {
    return mod.nota !== null && mod.nota >= 66;
  }

  modulosPendientes(ins: InscripcionTranscript): number[] {
    return ins.modulos
      .filter(m => !this.aprobado(m) && m.modulo_orden >= ins.modulo_inicio)
      .map(m => m.modulo_orden)
      .sort((a, b) => a - b);
  }

  fmtLista(nums: number[]): string {
    const s = nums.map(n => `M${n}`);
    if (s.length <= 1) return s[0] ?? '';
    return s.slice(0, -1).join(', ') + ' y ' + s[s.length - 1];
  }

  currentModIdx(ins: InscripcionTranscript): number {
    if (ins.estado === 'postulante' || ins.estado === 'observado' || ins.estado === 'retirado') return -1;
    return ins.modulos.findIndex(
      m => m.nota === null && m.modulo_orden >= ins.modulo_inicio && !m.es_migrada
    );
  }

  currentModOrden(ins: InscripcionTranscript): number | null {
    const idx = this.currentModIdx(ins);
    return idx >= 0 ? ins.modulos[idx].modulo_orden : null;
  }

  modEstado(mod: ModuloTranscript, ins: InscripcionTranscript): string {
    if (mod.nota !== null) return mod.es_migrada ? 'migrada' : 'aprobado';
    if (mod.modulo_orden < ins.modulo_inicio) return 'saltado';
    const idx = ins.modulos.indexOf(mod);
    if (idx === this.currentModIdx(ins)) return 'en-curso';
    return 'pendiente';
  }

  hitoClass(mod: ModuloTranscript, ins: InscripcionTranscript): string {
    if (mod.nota !== null) {
      if (mod.es_migrada) return this.aprobado(mod) ? 'hito-migrada' : 'hito-migrada hito-reprobado';
      return this.aprobado(mod) ? 'hito-ok' : 'hito-reprobado';
    }
    if (mod.modulo_orden < ins.modulo_inicio) return 'hito-saltado';
    const idx = ins.modulos.indexOf(mod);
    if (idx === this.currentModIdx(ins)) return 'hito-curso';
    return 'hito-pend';
  }

  lastAprobadoIdx(ins: InscripcionTranscript): number {
    let last = -1;
    ins.modulos.forEach((m, i) => { if (this.aprobado(m)) last = i; });
    return last;
  }

  rutaFillPct(ins: InscripcionTranscript): number {
    const n = ins.modulos.length;
    if (n === 0) return 0;
    const cur = this.currentModIdx(ins);
    const idx = cur >= 0 ? cur : this.lastAprobadoIdx(ins);
    if (idx < 0) return 0;
    return Math.min(100, Math.max(0, ((idx + 0.5) / n) * 90));
  }

  rutaCols(n: number): string {
    return `repeat(${n}, 1fr)`;
  }

  progPct(ins: InscripcionTranscript): number {
    if (ins.modulos.length === 0) return 0;
    return Math.floor((ins.modulos.filter(m => this.aprobado(m)).length / ins.modulos.length) * 100);
  }

  progLabel(ins: InscripcionTranscript): string {
    const aprobados = ins.modulos.filter(m => this.aprobado(m)).length;
    return `${aprobados} de ${ins.modulos.length} · ${this.progPct(ins)}%`;
  }

  promRingBg(n: number | null): string {
    if (n === null) return '';
    const pct = Math.min(100, Math.max(0, Math.floor(n)));
    return `conic-gradient(var(--prom-color) ${pct}%, #eef2f6 ${pct}%)`;
  }

  promClasifLabel(n: number | null): string {
    if (n === null) return '';
    return CLASIF_LABELS[this.notaClass(n)] ?? '';
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

  tipoMovimientoLabel(tipo: string): string {
    const labels: Record<string, string> = {
      reincorporacion: 'Reincorporación',
      migracion: 'Migración',
      incorporacion: 'Incorporación',
      transferencia: 'Transferencia',
      retiro: 'Retiro',
    };
    return labels[tipo] || tipo;
  }

  movimientoSelf(tr: HistorialMovimiento): boolean {
    return tr.origen.id_detalle_programa_alumno === tr.destino.id_detalle_programa_alumno;
  }
}
