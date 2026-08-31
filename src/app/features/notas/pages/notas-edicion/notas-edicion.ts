import { Component, OnInit, signal, computed, inject, DestroyRef, ViewChild, ElementRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { NotaService } from '../../services/nota.service';
import { AlumnoNotas, NotasEdicionData, NotaResponse } from '../../models/nota.model';
import { SortDir, sortItems } from '../../../../core/utils/sort-utils';
import { maxTextWidth } from '../../../../core/utils/measure-text';
import { AuthService } from '../../../../core/services/auth.service';
import { NavigationBackService } from '../../../../core/navigation/navigation-back.service';
import { EdicionContextoComponent } from '../../../../shared/components/edicion-contexto/edicion-contexto';

@Component({
  selector: 'app-notas-edicion',
  standalone: true,
  imports: [
    CommonModule,
    MatIconModule, MatButtonModule, MatTooltipModule,
    MatProgressSpinnerModule, MatSnackBarModule,
    EdicionContextoComponent,
  ],
  templateUrl: './notas-edicion.html',
  styleUrl: './notas-edicion.css',
})
export class NotasEdicionComponent implements OnInit {
  private service = inject(NotaService);
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private snackbar = inject(MatSnackBar);
  private destroyRef = inject(DestroyRef);
  private auth = inject(AuthService);
  private navBack = inject(NavigationBackService);

  @ViewChild('matrizWrap', { read: ElementRef }) private matrizWrap!: ElementRef<HTMLElement>;

  data = signal<NotasEdicionData | null>(null);
  isLoading = signal(true);
  showRetirados = signal(false);
  idEdicion = 0;
  alumnoWidth = signal('auto');
  moduloDestacado = signal<number | null>(null);

  puedeVerAlumnos = computed(() => this.auth.hasPermiso('alumnos.ver'));
  puedeVerInformes = computed(() => this.auth.hasPermiso('pagos.ver'));

  verInforme(): void {
    this.navBack.setReturn(this.router.url);
    const destacado = this.moduloDestacado();
    if (destacado) {
      this.router.navigate(['/informes-notas'], {
        queryParams: { edicion: this.idEdicion, modulo: destacado },
      });
    } else {
      this.router.navigate(['/informes-notas'], { queryParams: { edicion: this.idEdicion } });
    }
  }

  verCertificados(): void {
    this.navBack.setReturn(this.router.url);
    this.router.navigate(['/certificados-notas'], { queryParams: { edicion: this.idEdicion } });
  }

  nombreDir = signal<SortDir>('asc');

  modulos = computed(() => {
    const mods = this.data()?.modulos ?? [];
    return [...mods].sort((a, b) => a.orden - b.orden);
  });

  alumnos = computed(() => this.data()?.alumnos ?? []);

  activos = computed(() => this.sortAlumnos(this.alumnos().filter(a => a.estado !== 'retirado')));
  retirados = computed(() => this.sortAlumnos(this.alumnos().filter(a => a.estado === 'retirado')));

  sortAlumnos(items: AlumnoNotas[]): AlumnoNotas[] {
    return sortItems(items, a => `${a.alumno?.apellido || ''} ${a.alumno?.nombre || ''}`, this.nombreDir());
  }

  toggleOrden(): void {
    this.nombreDir.set(this.nombreDir() === 'asc' ? 'desc' : 'asc');
  }

  ngOnInit(): void {
    this.idEdicion = Number(this.route.snapshot.paramMap.get('idEdicion'));
    if (!this.idEdicion) {
      this.router.navigate(['/notas']);
      return;
    }
    const modParam = Number(this.route.snapshot.queryParamMap.get('modulo'));
    if (modParam) {
      this.moduloDestacado.set(modParam);
    }
    this.cargarDatos();
  }

  private scrollAColumna(): void {
    const el = this.matrizWrap?.nativeElement;
    const id = this.moduloDestacado();
    if (!el || !id) return;
    requestAnimationFrame(() => {
      const th = el.querySelector<HTMLElement>(`thead th[data-dpm="${id}"]`);
      th?.scrollIntoView({ inline: 'center', block: 'nearest' });
    });
  }

  cargarDatos(): void {
    this.isLoading.set(true);
    this.service.getNotasPorEdicion(this.idEdicion).pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: data => {
        this.data.set(data);
        this.isLoading.set(false);
        requestAnimationFrame(() => this.medirColumnaAlumno());
        this.scrollAColumna();
      },
      error: () => {
        this.isLoading.set(false);
        this.snackbar.open('Error al cargar notas', 'Cerrar', { duration: 3000 });
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

  notaDe(a: AlumnoNotas, idDpm: number): NotaResponse | undefined {
    return a.notas.find(n => n.id_detalle_programa_modulo === idDpm);
  }

  notaValor(a: AlumnoNotas, idDpm: number): number | null {
    const nota = this.notaDe(a, idDpm);
    return nota ? this.displayNota(nota.nota) : null;
  }

  displayNota(n: number): number {
    return Math.floor(Number(n) + 0.5);
  }

  cellClass(a: AlumnoNotas, idDpm: number): string {
    const nota = this.notaDe(a, idDpm);
    return nota ? `cal-${nota.calificacion}` : '';
  }

  cellTooltip(a: AlumnoNotas, idDpm: number): string {
    const nota = this.notaDe(a, idDpm);
    if (!nota) return 'Sin nota';
    const fecha = nota.fecha ? new Date(nota.fecha).toLocaleDateString('es-AR') : '';
    return `Nota ${this.displayNota(nota.nota)} — ${nota.calificacion}${fecha ? ` (${fecha})` : ''}`;
  }

  promedioValor(a: AlumnoNotas): number | null {
    return a.notas.length > 0 ? this.displayNota(a.promedio) : null;
  }

  promedioClass(a: AlumnoNotas): string {
    return a.notas.length > 0 ? `cal-${this.clasificarProm(a.promedio)}` : '';
  }

  private clasificarProm(promedio: number): string {
    const n = this.displayNota(promedio);
    if (n === 0) return 'abandono';
    if (n <= 65) return 'insuficiente';
    if (n <= 70) return 'suficiente';
    if (n <= 80) return 'bueno';
    if (n <= 90) return 'distinguido';
    return 'sobresaliente';
  }

  initials(a: AlumnoNotas): string {
    const ap = (a.alumno?.apellido || '').trim();
    const nm = (a.alumno?.nombre || '').trim();
    return `${ap.charAt(0)}${nm.charAt(0)}`.toUpperCase() || '—';
  }

  promBg(a: AlumnoNotas): string {
    const p = this.promedioValor(a);
    return `conic-gradient(var(--prom-color) ${p}%, var(--fich-border) 0)`;
  }

  promLabel(a: AlumnoNotas): string {
    if (!a.notas.length) return '';
    const labels: Record<string, string> = {
      abandono: 'Abandono',
      insuficiente: 'Insuficiente',
      suficiente: 'Suficiente',
      bueno: 'Bueno',
      distinguido: 'Distinguido',
      sobresaliente: 'Sobresaliente',
    };
    return labels[this.clasificarProm(a.promedio)] ?? '';
  }

  nombreAlumno(a: AlumnoNotas): string {
    return a.alumno ? `${a.alumno.apellido} ${a.alumno.nombre}` : 'Alumno sin datos';
  }

  esColumnaDestacada(idDpm: number): boolean {
    return this.moduloDestacado() === idDpm;
  }

  verTranscript(a: AlumnoNotas): void {
    if (!a.alumno) return;
    this.navBack.setReturn(this.router.url);
    this.router.navigate(['/transcript', a.alumno.id_alumno], {
      queryParams: { idDpa: a.id_detalle_programa_alumno },
    });
  }

  volver(): void {
    this.navBack.retornar(['/notas']);
  }
}
