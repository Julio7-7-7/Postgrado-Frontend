import { Component, OnInit, signal, computed, inject, DestroyRef, ViewChild, ElementRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { PagoService } from '../../services/pago.service';
import { AlumnoPagosMatrix, CuotaPagos, PagosEdicionData } from '../../models/pago.model';
import { OrdenPagoDialog } from '../orden-pago-dialog/orden-pago-dialog';
import { BoletasAlumnoDialog } from '../boletas-alumno-dialog/boletas-alumno-dialog';
import { AuthService } from '../../../../core/services/auth.service';
import { PersonaService } from '../../../persona/services/persona.service';
import { SortDir, sortItems } from '../../../../core/utils/sort-utils';
import { maxTextWidth } from '../../../../core/utils/measure-text';
import { NavigationBackService } from '../../../../core/navigation/navigation-back.service';
import { EdicionContextoComponent } from '../../../../shared/components/edicion-contexto/edicion-contexto';

@Component({
  selector: 'app-pagos-edicion',
  standalone: true,
  imports: [
    CommonModule,
    MatIconModule, MatButtonModule, MatTooltipModule,
    MatProgressSpinnerModule, MatSnackBarModule, MatDialogModule,
    EdicionContextoComponent,
  ],
  templateUrl: './pagos-edicion.html',
  styleUrl: './pagos-edicion.css',
})
export class PagosEdicionComponent implements OnInit {
  private service = inject(PagoService);
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private snackbar = inject(MatSnackBar);
  private dialog = inject(MatDialog);
  private destroyRef = inject(DestroyRef);
  private navBack = inject(NavigationBackService);
  private auth = inject(AuthService);
  private personaService = inject(PersonaService);

  @ViewChild('matrizWrap', { read: ElementRef }) private matrizWrap!: ElementRef<HTMLElement>;

  data = signal<PagosEdicionData | null>(null);
  isLoading = signal(true);
  refreshing = signal(false);
  showRetirados = signal(false);
  usuarioSesion = signal('');
  idEdicion = 0;
  alumnoWidth = signal('auto');

  nombreDir = signal<SortDir>('asc');

  matriculaEdicion = computed(() => this.data()?.matricula ?? 0);

  modulos = computed(() => {
    const mods = this.data()?.modulos ?? [];
    return [...mods].sort((a, b) => a.orden - b.orden);
  });

  alumnos = computed(() => this.data()?.alumnos ?? []);

  activos = computed(() => this.sortAlumnos(this.alumnos().filter(a => a.estado !== 'retirado')));
  retirados = computed(() => this.sortAlumnos(this.alumnos().filter(a => a.estado === 'retirado')));

  sortAlumnos(items: AlumnoPagosMatrix[]): AlumnoPagosMatrix[] {
    return sortItems(items, a => `${a.alumno?.apellido || ''} ${a.alumno?.nombre || ''}`, this.nombreDir());
  }

  toggleOrden(): void {
    this.nombreDir.set(this.nombreDir() === 'asc' ? 'desc' : 'asc');
  }

  ngOnInit(): void {
    this.idEdicion = Number(this.route.snapshot.paramMap.get('idEdicion'));
    if (!this.idEdicion) {
      this.router.navigate(['/pagos']);
      return;
    }
    this.cargarDatos();
    this.cargarUsuarioSesion();
  }

  private cargarUsuarioSesion(): void {
    const idUsuario = this.auth.user()?.id_usuario;
    if (!idUsuario) return;
    this.personaService.getById(idUsuario).pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: (p: any) => {
        const perfil = p?.administrativo || p?.alumno || p?.docente;
        if (perfil?.nombre || perfil?.apellido) {
          this.usuarioSesion.set(`${perfil.apellido || ''} ${perfil.nombre || ''}`.trim());
        }
      },
    });
  }

  cargarDatos(): void {
    const primeraCarga = this.data() === null;
    if (primeraCarga) {
      this.isLoading.set(true);
    } else {
      this.refreshing.set(true);
    }
    this.service.getPagosPorEdicion(this.idEdicion).pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: data => {
        this.data.set(data);
        this.isLoading.set(false);
        this.refreshing.set(false);
        requestAnimationFrame(() => this.medirColumnaAlumno());
      },
      error: () => {
        this.isLoading.set(false);
        this.refreshing.set(false);
        this.snackbar.open('Error al cargar pagos', 'Cerrar', { duration: 3000 });
      },
    });
  }

  private medirColumnaAlumno(): void {
    const el = this.matrizWrap?.nativeElement;
    if (!el) return;
    const max = maxTextWidth(Array.from(el.querySelectorAll<HTMLElement>('.alumno-nombre')));
    if (max > 0) {
      const AVATAR = 36, GAP = 10, PADDING = 20;
      this.alumnoWidth.set(`${max + AVATAR + GAP + PADDING + 12}px`);
    }
  }

  cuotaDe(a: AlumnoPagosMatrix, idDpm: number): CuotaPagos | undefined {
    return a.cuotas.find(c => c.id_detalle_programa_modulo === idDpm);
  }

  bubbleClass(pagado: number, esperado: number): string {
    if (esperado <= 0) return 'pago-bubble-vacia';
    const pct = (pagado / esperado) * 100;
    if (pagado <= 0) return 'pago-bubble-vacia';
    if (pct > 100) return 'pago-bubble-sobre';
    if (pct >= 100) return 'pago-bubble-full';
    return 'pago-bubble-parcial';
  }

  pctClamped(pagado: number, esperado: number): number {
    if (esperado <= 0 || pagado <= 0) return 0;
    return Math.min(100, Math.round((pagado / esperado) * 100));
  }

  sobrePagado(pagado: number, esperado: number): boolean {
    return esperado > 0 && pagado > esperado;
  }

  private conSaldo(t: string, pagado: number, esperado: number): string {
    if (this.sobrePagado(pagado, esperado)) {
      return `${t}\nSaldo a favor: ${this.fmt(pagado - esperado)} Bs`;
    }
    return t;
  }

  bubbleTooltip(c: CuotaPagos): string {
    return this.conSaldo(this.entryTooltip(`Cuota ${c.orden} — ${c.nombre}`, c.esperado, c.pagado, c.pct, c.pagos), c.pagado, c.esperado);
  }

  matriculaTooltip(a: AlumnoPagosMatrix): string {
    return this.conSaldo(this.entryTooltip('Matrícula', a.matricula.esperado, a.matricula.pagado, a.matricula.pct, a.matricula.pagos), a.matricula.pagado, a.matricula.esperado);
  }

  private entryTooltip(
    titulo: string,
    esperado: number,
    pagado: number,
    pct: number,
    pagos: { monto: number; fecha_pago: string; estado: string; origen: { edicion: number; anio: number; semestre: number } | null }[],
  ): string {
    const lines = [
      titulo,
      `Pagado ${this.fmt(pagado)} de ${this.fmt(esperado)} Bs (${pct}%)`,
    ];
    for (const p of pagos) {
      const fecha = p.fecha_pago ? new Date(p.fecha_pago).toLocaleDateString('es-AR') : '—';
      let linea = `• ${this.fmt(p.monto)} Bs — ${fecha}`;
      if (p.estado !== 'confirmado') linea += ` (${p.estado})`;
      if (p.origen) linea += ` · desde Ed. ${p.origen.edicion} ${p.origen.anio}/${p.origen.semestre}`;
      lines.push(linea);
    }
    return lines.join('\n');
  }

  pctTotal(a: AlumnoPagosMatrix): number {
    return Math.min(100, Math.round(a.pct_total));
  }

  ringBg(a: AlumnoPagosMatrix): string {
    const p = Math.min(100, Math.round(a.pct_total));
    return `conic-gradient(var(--prom-color) ${p}%, var(--fich-border) 0)`;
  }

  totalTooltip(a: AlumnoPagosMatrix): string {
    return `Pagado ${this.fmt(a.total_pagado)} de ${this.fmt(a.total_esperado)} Bs (${this.pctTotal(a)}%)`;
  }

  fmt(n: number): string {
    return Number(n || 0).toLocaleString('es-BO', { minimumFractionDigits: 0, maximumFractionDigits: 2 });
  }

  abrirOrden(a: AlumnoPagosMatrix, event: MouseEvent): void {
    event.stopPropagation();
    const dialogRef = this.dialog.open(OrdenPagoDialog, {
      width: '560px',
      data: {
        alumno: a,
        modulos: this.modulos(),
        matricula: a.matricula.esperado,
        precio: this.data()?.precio ?? 0,
        orden: a.orden_activa,
      },
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) this.cargarDatos();
    });
  }

  verBoletas(a: AlumnoPagosMatrix, event: MouseEvent): void {
    event.stopPropagation();
    if (!a.alumno) return;
    const dialogRef = this.dialog.open(BoletasAlumnoDialog, {
      width: '560px',
      data: {
        idAlumno: a.alumno.id_alumno,
        idDetalleProgramaAlumno: a.id_detalle_programa_alumno,
        nombre: `${a.alumno.apellido} ${a.alumno.nombre}`,
        edicion: `Edición #${this.idEdicion}`,
        becaActiva: a.beca_activa,
        becaTipo: a.beca_tipo || null,
      },
    });

    dialogRef.afterClosed().subscribe((result: boolean | undefined) => {
      if (result) this.cargarDatos();
    });
  }

  iniciales(a: AlumnoPagosMatrix): string {
    const ap = (a.alumno?.apellido || '').trim();
    const nm = (a.alumno?.nombre || '').trim();
    return `${ap.charAt(0)}${nm.charAt(0)}`.toUpperCase() || '—';
  }

  nombreAlumno(a: AlumnoPagosMatrix): string {
    return a.alumno ? `${a.alumno.apellido} ${a.alumno.nombre}` : 'Alumno sin datos';
  }

  volver(): void {
    this.navBack.retornar(['/pagos']);
  }

  imprimirInforme(): void {
    const iframe = document.createElement('iframe');
    iframe.setAttribute('style', 'position:fixed;right:0;bottom:0;width:0;height:0;border:0;visibility:hidden;');
    document.body.appendChild(iframe);
    const doc = iframe.contentDocument;
    if (!doc) return;

    doc.open();
    doc.write(this.htmlInforme());
    doc.close();

    iframe.onload = () => {
      iframe.contentWindow?.focus();
      iframe.contentWindow?.print();
      setTimeout(() => iframe.remove(), 1000);
    };
  }

  private htmlInforme(): string {
    const rows = this.activos()
      .map(a => this.htmlFilaInforme(a))
      .join('');
    const t = this.informeTotales();
    const modThs = this.modulos()
      .map(m => `<th class="monto">M${m.orden}</th>`)
      .join('');
    const modTds = this.modulos()
      .map(() => `<td></td>`)
      .join('');

    return `<!DOCTYPE html><html><head><meta charset="utf-8">
<style>
  @page { size: Letter landscape; margin: 12mm; }
  * { box-sizing: border-box; }
  body { font-family: 'Segoe UI', Roboto, Arial, sans-serif; color: #0f172a; margin: 0; }
  .head { display: flex; align-items: center; gap: 14px; border-bottom: 3px solid #1e3a8a; padding-bottom: 10px; margin-bottom: 14px; }
  .logo { width: 52px; height: 52px; border-radius: 12px; background: linear-gradient(135deg,#1e3a8a,#15803d); color:#fff; display:flex; align-items:center; justify-content:center; font-weight:800; font-size:1.1rem; letter-spacing:.05em; }
  .head-txt { line-height: 1.25; }
  .institucion { font-size: 1.05rem; font-weight: 800; color: #1e3a8a; }
  .sub { font-size: 0.8rem; color: #475569; }
  .titulo { text-align:center; font-size:1rem; font-weight:800; letter-spacing:.12em; color:#1e3a8a; margin: 0 0 4px; }
  .numero { text-align:center; font-size:0.8rem; color:#475569; margin-bottom: 12px; }
  table { width: 100%; border-collapse: collapse; font-size: 0.72rem; }
  th { background: #1e3a8a; color: #fff; padding: 7px 8px; text-align: left; font-weight: 700; border: 1px solid #1e3a8a; }
  th.monto, td.monto { text-align: right; }
  td { padding: 6px 8px; border: 1px solid #cbd5e1; }
  tbody tr:nth-child(even) td { background: #f8fafc; }
  tfoot td { font-weight: 800; background: #eef2ff; border-top: 2px solid #1e3a8a; }
  tfoot td.monto { color: #1e3a8a; }
  .deuda { font-weight: 700; color: #b91c1c; }
  .deuda.ok { color: #15803d; }
  .firmas { display: flex; justify-content: space-between; margin-top: 44px; }
  .firma { width: 42%; border-top: 1px solid #94a3b8; padding-top: 8px; text-align: center; font-size: 0.72rem; color: #334155; }
</style></head><body>
  <div class="head">
    <div class="logo">FICH</div>
    <div class="head-txt">
      <div class="institucion">Facultad Integral del Chaco — FICH</div>
      <div class="sub">Unidad de Postgrado Chaco</div>
    </div>
  </div>
  <div class="titulo">INFORME ECONÓMICO DE LA EDICIÓN</div>
  <div class="numero">Edición #${this.idEdicion}</div>
  <table>
    <thead><tr><th>Alumno</th><th>Beca</th>${modThs}<th class="monto">Matrícula</th><th class="monto">Subtotal</th><th class="monto">Deuda</th></tr></thead>
    <tbody>${rows}</tbody>
    <tfoot><tr><td colspan="2">TOTALES</td>${modTds}<td></td><td class="monto">${this.fmt(t.pagado)}</td><td class="monto">${this.fmt(t.deuda)}</td></tr></tfoot>
  </table>
  <div class="firmas">
    <div class="firma">Firma y sello de caja</div>
    <div class="firma">${this.usuarioSesion() || 'Firma del responsable'}</div>
  </div>
</body></html>`;
  }

  private htmlFilaInforme(a: AlumnoPagosMatrix): string {
    const celdas = this.modulos().map(m => {
      const c = this.cuotaDe(a, m.id_detalle_programa_modulo);
      const v = c && c.pagado > 0 ? this.fmt(c.pagado) : '—';
      return `<td class="monto">${v}</td>`;
    }).join('');
    const deuda = this.deudaAlumno(a);
    const deudaCls = deuda === 0 ? 'deuda ok' : 'deuda';
    return `<tr>
      <td>${this.nombreAlumno(a)}</td>
      <td>${this.becaLabel(a)}</td>
      ${celdas}
      <td class="monto">${this.fmt(a.matricula.pagado)}</td>
      <td class="monto">${this.fmt(a.total_pagado)}</td>
      <td class="monto"><span class="${deudaCls}">${this.fmt(deuda)}</span></td>
    </tr>`;
  }

  deudaAlumno(a: AlumnoPagosMatrix): number {
    return Math.max(0, Math.round((a.total_esperado - a.total_pagado) * 100) / 100);
  }

  becaLabel(a: AlumnoPagosMatrix): string {
    const tipo = a.beca_tipo || (a.beca_activa ? 'Beca' : null);
    if (a.beca_activa) return tipo ? `Beca activa · ${tipo}` : 'Beca activa';
    if (a.beca_motivo) return tipo ? `Beca perdida · ${tipo}` : 'Beca perdida';
    return 'Sin beca';
  }

  informeTotales(): { esperado: number; pagado: number; deuda: number } {
    let esperado = 0, pagado = 0;
    for (const a of this.alumnos()) {
      esperado += a.total_esperado;
      pagado += a.total_pagado;
    }
    return { esperado, pagado, deuda: Math.max(0, esperado - pagado) };
  }
}
