import {
  Component,
  OnInit,
  AfterViewInit,
  signal,
  computed,
  inject,
  DestroyRef,
  viewChild,
  ElementRef,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';
import { MatInputModule } from '@angular/material/input';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule, provideNativeDateAdapter } from '@angular/material/core';
import { MatTabsModule } from '@angular/material/tabs';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { Chart, registerables } from 'chart.js';
import { AuthService } from '../../../../core/services/auth.service';
import { ReporteService } from '../../services/reporte.service';
import {
  OpcionesReportes,
  ReporteTab,
  PeriodoPreset,
  ReporteEconomico,
  ReportePoblacion,
  ReporteRendimiento,
} from '../../models/reporte.model';

Chart.register(...registerables);

const CLASIF_COLORS: Record<string, string> = {
  sobresaliente: '#4338ca',
  distinguido: '#047857',
  bueno: '#0369a1',
  suficiente: '#b45309',
  insuficiente: '#b91c1c',
  abandono: '#64748b',
};

const ESTADO_POB_COLORS: Record<string, string> = {
  inscrito: '#1e3a8a',
  incorporado: '#0e7490',
  finalizado: '#047857',
  graduado: '#4338ca',
  retirado: '#b45309',
  abandono: '#64748b',
};

@Component({
  selector: 'app-reportes',
  standalone: true,
  imports: [
    CommonModule, FormsModule,
    MatButtonModule, MatIconModule, MatTooltipModule,
    MatFormFieldModule, MatSelectModule, MatInputModule,
    MatDatepickerModule, MatNativeDateModule,
    MatTabsModule, MatProgressSpinnerModule,
  ],
  providers: [provideNativeDateAdapter()],
  templateUrl: './reportes.html',
  styleUrl: './reportes.css',
})
export class ReportesComponent implements OnInit, AfterViewInit {
  private reporteService = inject(ReporteService);
  private destroyRef = inject(DestroyRef);
  private auth = inject(AuthService);

  canvasEconomico = viewChild<ElementRef<HTMLCanvasElement>>('canvasEconomico');
  canvasPoblacion = viewChild<ElementRef<HTMLCanvasElement>>('canvasPoblacion');
  canvasRendimiento = viewChild<ElementRef<HTMLCanvasElement>>('canvasRendimiento');

  tab = signal<ReporteTab>('economico');
  opciones = signal<OpcionesReportes | null>(null);
  cargandoOpciones = signal(true);

  periodo = signal<PeriodoPreset>('anual');
  anio = signal<number>(new Date().getFullYear());
  semestre = signal<number>(new Date().getMonth() < 6 ? 1 : 2);
  desde = signal<Date>(this.inicioAno());
  hasta = signal<Date>(new Date());

  idCarrera = signal<number | null>(null);
  idPrograma = signal<number | null>(null);

  eco = signal<ReporteEconomico | null>(null);
  pob = signal<ReportePoblacion | null>(null);
  ren = signal<ReporteRendimiento | null>(null);

  cargando = signal(false);
  error = signal<string | null>(null);

  puedeGenerar = computed(() => this.auth.hasPermiso('reportes.generar'));

  puedeImprimir = computed(() => {
    const t = this.tab();
    if (t === 'economico') return !!this.eco();
    if (t === 'poblacion') return !!this.pob();
    return !!this.ren();
  });

  private charts: Chart[] = [];

  private inicioAno(): Date {
    return new Date(new Date().getFullYear(), 0, 1);
  }

  ngOnInit(): void {
    this.aplicarPeriodo(false);
    this.cargar();
    this.reporteService.opciones().pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: o => { this.opciones.set(o); this.cargandoOpciones.set(false); },
      error: () => { this.cargandoOpciones.set(false); this.error.set('No se pudieron cargar las opciones de reporte'); },
    });
  }

  ngAfterViewInit(): void {
    setTimeout(() => this.renderCharts(), 0);
  }

  onTabChange(idx: number): void {
    const map: ReporteTab[] = ['economico', 'poblacion', 'rendimiento'];
    this.tab.set(map[idx] ?? 'economico');
    this.cargar();
    setTimeout(() => this.renderCharts(), 0);
  }

  onAnioChange(): void {
    this.aplicarPeriodo(false);
  }

  onSemestreChange(): void {
    this.aplicarPeriodo(false);
  }

  onPeriodoChange(): void {
    if (this.periodo() === 'rango') return;
    this.aplicarPeriodo(true);
  }

  private aplicarPeriodo(recargar: boolean): void {
    const p = this.periodo();
    const y = this.anio();
    if (p === 'anual') {
      this.desde.set(new Date(y, 0, 1));
      this.hasta.set(new Date(y, 11, 31, 23, 59, 59));
    } else if (p === 'semestral') {
      const inicioMes = this.semestre() === 1 ? 0 : 6;
      const finMes = this.semestre() === 1 ? 5 : 11;
      this.desde.set(new Date(y, inicioMes, 1));
      this.hasta.set(new Date(y, finMes, 31, 23, 59, 59));
    }
    if (recargar) this.cargar();
  }

  aplicarRango(): void {
    if (this.desde() <= this.hasta()) this.cargar();
  }

  cargar(): void {
    this.cargando.set(true);
    this.error.set(null);
    const desde = this.iso(this.desde());
    const hasta = this.iso(this.hasta());
    const t = this.tab();

    if (t === 'economico') {
      this.reporteService.economico({ desde, hasta, id_carrera: this.idCarrera() }).pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
        next: r => { this.eco.set(r); this.cerrarCarga(); },
        error: e => this.manejarError(e),
      });
    } else if (t === 'poblacion') {
      this.reporteService.poblacion({ desde, hasta, id_programa: this.idPrograma() }).pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
        next: r => { this.pob.set(r); this.cerrarCarga(); },
        error: e => this.manejarError(e),
      });
    } else {
      this.reporteService.rendimiento({ desde, hasta, id_programa: this.idPrograma() }).pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
        next: r => { this.ren.set(r); this.cerrarCarga(); },
        error: e => this.manejarError(e),
      });
    }
  }

  private cerrarCarga(): void {
    this.cargando.set(false);
    setTimeout(() => this.renderCharts(), 20);
  }

  private manejarError(e: any): void {
    this.cargando.set(false);
    this.error.set(e.error?.detail || 'Error al generar el reporte');
  }

  private iso(d: Date): string {
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  }

  // ---- Formateo ----
  fmtBs(v: number | undefined | null): string {
    const n = Number(v ?? 0);
    return `Bs ${n.toLocaleString('es-BO', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  }

  fmtEntero(v: number | undefined | null): string {
    return new Intl.NumberFormat('es-BO').format(Number(v ?? 0));
  }

  fmtFecha(iso: string | undefined | null): string {
    if (!iso) return '—';
    return new Date(iso).toLocaleDateString('es-BO', { day: '2-digit', month: '2-digit', year: 'numeric' });
  }

  pctAprobados(): number {
    const ren = this.ren();
    if (!ren || ren.total_notas === 0) return 0;
    return Math.round((ren.aprobados / ren.total_notas) * 100);
  }

  pctDeuda(): number {
    const eco = this.eco();
    if (!eco) return 0;
    const ing = eco.ingresos.total;
    const deuda = eco.deuda.total;
    if (ing + deuda === 0) return 0;
    return Math.round((deuda / (ing + deuda)) * 100);
  }

  aniosDisponibles(): number[] {
    const y = new Date().getFullYear();
    return [y, y - 1, y - 2];
  }

  nombreClasif(c: string): string {
    const map: Record<string, string> = {
      sobresaliente: 'Sobresaliente', distinguido: 'Distinguido', bueno: 'Bueno',
      suficiente: 'Suficiente', insuficiente: 'Insuficiente', abandono: 'Abandono',
    };
    return map[c] ?? c;
  }

  clasifColor(c: string): string {
    return CLASIF_COLORS[c] ?? '#94a3b8';
  }

  // ---- Gráficas ----
  private destroyCharts(): void {
    this.charts.forEach(c => { try { c.destroy(); } catch { /* noop */ } });
    this.charts = [];
  }

  renderCharts(): void {
    this.destroyCharts();
    const t = this.tab();
    if (t === 'economico') this.renderEconomico();
    else if (t === 'poblacion') this.renderPoblacion();
    else this.renderRendimiento();
  }

  private renderEconomico(): void {
    const eco = this.eco();
    const canvas = this.canvasEconomico()?.nativeElement;
    if (!eco || !eco.ingresos.por_mes.length || !canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    this.charts.push(new Chart(ctx, {
      type: 'bar',
      data: {
        labels: eco.ingresos.por_mes.map(p => p.periodo),
        datasets: [{
          label: 'Ingresos (Bs)',
          data: eco.ingresos.por_mes.map(p => p.monto ?? 0),
          backgroundColor: '#15803d',
          borderRadius: 6,
        }],
      },
      options: { responsive: true, maintainAspectRatio: false, plugins: { legend: { display: false } }, scales: { y: { beginAtZero: true } } },
    }));
  }

  private renderPoblacion(): void {
    const pob = this.pob();
    const canvas = this.canvasPoblacion()?.nativeElement;
    if (!pob || !canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    const estados = pob.por_estado.filter(e => e.cantidad > 0);
    if (!estados.length) return;
    this.charts.push(new Chart(ctx, {
      type: 'doughnut',
      data: {
        labels: estados.map(e => e.label),
        datasets: [{ data: estados.map(e => e.cantidad), backgroundColor: estados.map(e => ESTADO_POB_COLORS[e.estado] ?? '#94a3b8') }],
      },
      options: { responsive: true, maintainAspectRatio: false, plugins: { legend: { position: 'right' } } },
    }));
  }

  private renderRendimiento(): void {
    const ren = this.ren();
    const canvas = this.canvasRendimiento()?.nativeElement;
    if (!ren || !canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    if (!ren.por_clasificacion.some(c => c.cantidad > 0)) return;
    this.charts.push(new Chart(ctx, {
      type: 'bar',
      data: {
        labels: ren.por_clasificacion.map(c => this.nombreClasif(c.clasificacion)),
        datasets: [{
          label: 'Notas',
          data: ren.por_clasificacion.map(c => c.cantidad),
          backgroundColor: ren.por_clasificacion.map(c => this.clasifColor(c.clasificacion)),
          borderRadius: 6,
        }],
      },
      options: { responsive: true, maintainAspectRatio: false, plugins: { legend: { display: false } }, scales: { y: { beginAtZero: true } } },
    }));
  }

  // ---- Impresión ----
  imprimir(): void {
    const t = this.tab();
    if (t === 'economico' && this.eco()) this.imprimirEconomico();
    else if (t === 'poblacion' && this.pob()) this.imprimirPoblacion();
    else if (t === 'rendimiento' && this.ren()) this.imprimirRendimiento();
  }

  private encabezadoHtml(titulo: string, periodo: string, orientacion: 'landscape' | 'portrait'): string {
    return `
      <style>
        @page { size: Letter ${orientacion}; margin: 12mm; }
        body { font-family: Arial, sans-serif; color: #0f172a; }
        h1 { font-size: 18px; margin: 0 0 2px; }
        .sub { color: #475569; font-size: 12px; margin-bottom: 14px; }
        h2 { font-size: 14px; margin: 16px 0 6px; border-bottom: 2px solid #1e3a8a; padding-bottom: 3px; }
        table { width: 100%; border-collapse: collapse; font-size: 11px; }
        th { background: #1e3a8a; color: #fff; text-align: left; padding: 6px 8px; }
        td { border: 1px solid #dbe1ea; padding: 5px 8px; }
        tr:nth-child(even) td { background: #f1f5f9; }
        .tot { font-weight: 700; text-align: right; }
        .kpis { display: flex; gap: 28px; margin-bottom: 12px; }
        .kpi b { display: block; font-size: 20px; color: #1e3a8a; }
        .kpi span { font-size: 11px; color: #475569; }
      </style>
      <h1>${titulo}</h1>
      <div class="sub">${periodo}</div>`;
  }

  private imprimirEconomico(): void {
    const eco = this.eco();
    if (!eco) return;
    let html = this.encabezadoHtml(
      'Reporte Económico',
      `Periodo del ${this.fmtFecha(eco.desde)} al ${this.fmtFecha(eco.hasta)}${eco.carrera ? ' · filtrado por carrera' : ''}`,
      'landscape',
    );
    html += `
      <div class="kpis">
        <div class="kpi"><b>${this.fmtBs(eco.ingresos.total)}</b><span>Ingresos en el periodo</span></div>
        <div class="kpi"><b>${this.fmtBs(eco.deuda.total)}</b><span>Deuda pendiente</span></div>
        <div class="kpi"><b>${this.fmtEntero(eco.deuda.cantidad_deudores)}</b><span>Deudores</span></div>
      </div>
      <h2>Ingresos por programa</h2>
      <table><thead><tr><th>Programa</th><th style="text-align:right">Ingresos (Bs)</th></tr></thead><tbody>
        ${eco.ingresos.por_edicion.map(e => `<tr><td>${e.programa}</td><td style="text-align:right">${(e.monto ?? 0).toFixed(2)}</td></tr>`).join('')}
      </tbody></table>
      <h2>Deuda por programa</h2>
      <table><thead><tr><th>Programa</th><th style="text-align:right">Deuda (Bs)</th></tr></thead><tbody>
        ${eco.deuda.por_programa.map(e => `<tr><td>${e.programa}</td><td style="text-align:right">${(e.deuda ?? 0).toFixed(2)}</td></tr>`).join('')}
      </tbody></table>
      <h2>Deudores por carrera (contacto)</h2>
      <table><thead><tr><th>Carrera</th><th>Alumno</th><th>CI</th><th>Teléfono</th><th>Correo</th><th style="text-align:right">Deuda (Bs)</th></tr></thead><tbody>
        ${eco.deudores_por_carrera.map(g => g.deudores.map(d => `
          <tr><td>${g.carrera}</td><td>${d.apellido} ${d.nombre}</td><td>${d.ci ?? '—'}</td><td>${d.celular ?? '—'}</td><td>${d.correo ?? '—'}</td><td style="text-align:right">${d.saldo.toFixed(2)}</td></tr>`).join('')).join('')}
      </tbody></table>`;
    this.abrirImpresion(html);
  }

  private imprimirPoblacion(): void {
    const pob = this.pob();
    if (!pob) return;
    let html = this.encabezadoHtml('Reporte de Población Estudiantil', `Periodo del ${this.fmtFecha(pob.desde)} al ${this.fmtFecha(pob.hasta)}`, 'portrait');
    html += `
      <div class="kpis">
        <div class="kpi"><b>${this.fmtEntero(pob.total)}</b><span>Inscripciones</span></div>
        <div class="kpi"><b>${this.fmtEntero(pob.incorporaciones)}</b><span>Incorporaciones</span></div>
        <div class="kpi"><b>${this.fmtEntero(pob.egresados.total)}</b><span>Egresados</span></div>
      </div>
      <h2>Distribución por estado</h2>
      <table><thead><tr><th>Estado</th><th style="text-align:right">Cantidad</th></tr></thead><tbody>
        ${pob.por_estado.map(e => `<tr><td>${e.label}</td><td style="text-align:right">${e.cantidad}</td></tr>`).join('')}
      </tbody></table>
      <h2>Por programa</h2>
      <table><thead><tr><th>Programa</th><th style="text-align:right">Inscritos</th><th style="text-align:right">Retirados</th><th style="text-align:right">Graduados</th></tr></thead><tbody>
        ${pob.por_programa.map(p => `<tr><td>${p.programa}</td><td style="text-align:right">${p.cantidad ?? 0}</td><td style="text-align:right">${p.retirados ?? 0}</td><td style="text-align:right">${p.graduados ?? 0}</td></tr>`).join('')}
      </tbody></table>`;
    this.abrirImpresion(html);
  }

  private imprimirRendimiento(): void {
    const ren = this.ren();
    if (!ren) return;
    let html = this.encabezadoHtml('Reporte de Rendimiento Académico', `Periodo del ${this.fmtFecha(ren.desde)} al ${this.fmtFecha(ren.hasta)}`, 'portrait');
    html += `
      <div class="kpis">
        <div class="kpi"><b>${ren.promedio_general.toFixed(2)}</b><span>Promedio general</span></div>
        <div class="kpi"><b>${this.fmtEntero(ren.aprobados)}</b><span>Aprobados</span></div>
        <div class="kpi"><b>${this.fmtEntero(ren.reprobados)}</b><span>Reprobados</span></div>
      </div>
      <h2>Distribución por clasificación</h2>
      <table><thead><tr><th>Clasificación</th><th style="text-align:right">Cantidad</th></tr></thead><tbody>
        ${ren.por_clasificacion.map(c => `<tr><td>${this.nombreClasif(c.clasificacion)}</td><td style="text-align:right">${c.cantidad}</td></tr>`).join('')}
      </tbody></table>
      <h2>Por módulo</h2>
      <table><thead><tr><th>Módulo</th><th style="text-align:right">Promedio</th><th style="text-align:right">Aprobados</th><th style="text-align:right">Reprobados</th></tr></thead><tbody>
        ${ren.por_modulo.map(m => `<tr><td>${m.nombre}</td><td style="text-align:right">${m.promedio}</td><td style="text-align:right">${m.aprobados}</td><td style="text-align:right">${m.reprobados}</td></tr>`).join('')}
      </tbody></table>`;
    this.abrirImpresion(html);
  }

  private abrirImpresion(html: string): void {
    const win = window.open('', '_blank', 'width=1200,height=800');
    if (!win) return;
    win.document.write(`<html><head><title>Reporte</title></head><body>${html}</body></html>`);
    win.document.close();
    win.focus();
    win.print();
  }
}
