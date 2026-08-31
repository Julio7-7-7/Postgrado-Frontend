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

  @ViewChild('matrizWrap', { read: ElementRef }) private matrizWrap!: ElementRef<HTMLElement>;

  data = signal<PagosEdicionData | null>(null);
  isLoading = signal(true);
  refreshing = signal(false);
  showRetirados = signal(false);
  mostrarInforme = signal(false);
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

  toggleInforme(): void {
    this.mostrarInforme.set(!this.mostrarInforme());
  }

  imprimirInforme(): void {
    window.print();
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
