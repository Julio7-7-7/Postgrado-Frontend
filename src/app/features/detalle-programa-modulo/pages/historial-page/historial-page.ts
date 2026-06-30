import { Component, OnInit, signal, computed, inject, DestroyRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';

import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatCardModule } from '@angular/material/card';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatTooltipModule } from '@angular/material/tooltip';

import { HistorialService } from '../../services/historial.service';
import { HistorialModulo } from '../../models/historial.model';

interface Diff {
  campo: string;
  label: string;
  valor_anterior: string | null;
  valor_nuevo: string | null;
}

@Component({
  selector: 'app-historial-page',
  standalone: true,
  imports: [
    CommonModule,
    MatButtonModule, MatIconModule, MatCardModule,
    MatProgressSpinnerModule, MatTooltipModule,
  ],
  templateUrl: './historial-page.html',
  styleUrl: './historial-page.css',
})
export class HistorialPageComponent implements OnInit {
  private service = inject(HistorialService);
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private destroyRef = inject(DestroyRef);

  detalleId = signal(0);
  historiales = signal<HistorialModulo[]>([]);
  isLoading = signal(true);
  error = signal<string | null>(null);

  contexto = computed<HistorialModulo['detalle']>(() => {
    const h = this.historiales();
    if (h.length === 0) return null;
    for (const entry of h) {
      if (entry.detalle) return entry.detalle;
    }
    return null;
  });

  entradasConDiff = computed(() =>
    this.historiales().map(h => ({
      ...h,
      diffs: this.extraerDiffs(h),
      tipos: this.detectarTipos(h),
    }))
  );

  private extraerDiffs(h: HistorialModulo): Diff[] {
    const diffs: Diff[] = [];
    if (h.estado_anterior !== null && h.estado_nuevo !== null) {
      diffs.push({
        campo: 'estado',
        label: 'Estado',
        valor_anterior: this.estadoLabel(h.estado_anterior),
        valor_nuevo: this.estadoLabel(h.estado_nuevo),
      });
    }
    if (h.fecha_inicio_original !== null && h.fecha_inicio_nuevo !== null) {
      diffs.push({
        campo: 'fecha_inicio',
        label: 'Fecha inicio',
        valor_anterior: this.formatDate(h.fecha_inicio_original),
        valor_nuevo: this.formatDate(h.fecha_inicio_nuevo),
      });
    }
    if (h.fecha_fin_original !== null && h.fecha_fin_nuevo !== null) {
      diffs.push({
        campo: 'fecha_fin',
        label: 'Fecha fin',
        valor_anterior: this.formatDate(h.fecha_fin_original),
        valor_nuevo: this.formatDate(h.fecha_fin_nuevo),
      });
    }
    return diffs;
  }

  private detectarTipos(h: HistorialModulo): string[] {
    const tipos: string[] = [];
    if (h.estado_anterior !== null || h.estado_nuevo !== null) {
      tipos.push('estado');
    }
    if (h.fecha_inicio_original !== null || h.fecha_fin_original !== null) {
      tipos.push('fechas');
    }
    return tipos;
  }

  tipoCambioLabel(tipos: string[]): string {
    if (tipos.includes('estado') && tipos.includes('fechas')) {
      return 'Cambio de estado y fechas';
    }
    if (tipos.includes('estado')) {
      return 'Cambio de estado';
    }
    if (tipos.includes('fechas')) {
      return 'Modificación de fechas';
    }
    return 'Cambio';
  }

  tipoCambioIcon(tipos: string[]): string {
    if (tipos.includes('estado') && tipos.includes('fechas')) {
      return 'swap_horiz';
    }
    if (tipos.includes('estado')) {
      return 'loop';
    }
    if (tipos.includes('fechas')) {
      return 'calendar_month';
    }
    return 'info';
  }

  tipoCambioClass(tipos: string[]): string {
    if (tipos.includes('estado') && tipos.includes('fechas')) {
      return 'tipo-mixto';
    }
    if (tipos.includes('estado')) {
      return 'tipo-estado';
    }
    if (tipos.includes('fechas')) {
      return 'tipo-fechas';
    }
    return 'tipo-default';
  }

  isManual(h: HistorialModulo): boolean {
    return h.motivo.startsWith('Cambio manual') || h.motivo.startsWith('Modificación de');
  }

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('detalleId');
    if (!id) {
      this.router.navigate(['/contrataciones']);
      return;
    }
    this.detalleId.set(+id);
    this.cargarDatos();
  }

  cargarDatos(): void {
    this.isLoading.set(true);
    this.error.set(null);

    this.service.getByDetalleEnriquecido(this.detalleId()).pipe(
      takeUntilDestroyed(this.destroyRef)
    ).subscribe({
      next: (data) => {
        this.historiales.set(data);
        this.isLoading.set(false);
      },
      error: () => {
        this.error.set('No se pudo cargar el historial');
        this.isLoading.set(false);
      },
    });
  }

  volver(): void {
    const url = this.router.url.replace(/\/modulos\/.*/, '/modulos');
    this.router.navigateByUrl(url);
  }

  formatDate(d: string | null): string {
    if (!d) return '—';
    const date = new Date(d + 'T00:00:00');
    return date.toLocaleDateString('es-BO', { day: '2-digit', month: '2-digit', year: 'numeric' });
  }

  formatDateTime(d: string): string {
    const date = new Date(d);
    return date.toLocaleDateString('es-BO', {
      day: '2-digit', month: '2-digit', year: 'numeric',
      hour: '2-digit', minute: '2-digit',
    });
  }

  timeAgo(d: string): string {
    const now = new Date();
    const date = new Date(d);
    const diffMs = now.getTime() - date.getTime();
    const mins = Math.floor(diffMs / 60000);
    const hrs = Math.floor(mins / 60);
    const days = Math.floor(hrs / 24);

    if (mins < 1) return 'ahora';
    if (mins < 60) return `hace ${mins} min`;
    if (hrs < 24) return `hace ${hrs} h`;
    if (days < 30) return `hace ${days} d`;
    return this.formatDateTime(d);
  }

  private estadoLabel(e: string): string {
    const map: Record<string, string> = {
      programado: 'Programado', en_curso: 'En curso',
      reprogramado: 'Reprogramado', finalizado: 'Finalizado',
    };
    return map[e] || e;
  }
}
