import { Component, OnInit, signal, inject, DestroyRef, ViewChild, ElementRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink, Router } from '@angular/router';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatCardModule } from '@angular/material/card';
import { MatDividerModule } from '@angular/material/divider';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { ProgramaService } from '../../programa/services/programa.service';
import { DocenteService } from '../../docente/services/docente.service';
import { EdicionService } from '../../edicion/services/edicion.service';
import { ProgramaVersionEdicion } from '../../edicion/models/edicion.model';
import { environment } from '../../../../environments/environment';

interface NavCard {
  path: string;
  icon: string;
  title: string;
  desc: string;
  bg: string;
}

const CARD_STEP = 380;

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [
    CommonModule, RouterLink,
    MatButtonModule, MatIconModule, MatCardModule, MatDividerModule,
    MatTooltipModule, MatSnackBarModule,
  ],
  templateUrl: './home.html',
  styleUrl: './home.css',
})
export class HomeComponent implements OnInit {
  private programaService = inject(ProgramaService);
  private docenteService = inject(DocenteService);
  private edicionService = inject(EdicionService);
  private router = inject(Router);
  private snackBar = inject(MatSnackBar);
  private destroyRef = inject(DestroyRef);

  @ViewChild('track', { static: false }) trackRef!: ElementRef<HTMLElement>;

  apiUrl = environment.apiUrl;

  totalProgramas = signal(0);
  totalDocentes = signal(0);

  edicionesActivas = signal<ProgramaVersionEdicion[]>([]);

  fechaHoy = '';

  private offset = 0;
  private autoScrollId: number | null = null;
  private scrollTimeout: ReturnType<typeof setTimeout> | null = null;

  cards: NavCard[] = [
    { path: '/programas', icon: 'menu_book', title: 'Programas', desc: 'Maestrías, diplomados y cursos', bg: 'linear-gradient(135deg, #eef2ff, #dbeafe)' },
    { path: '/docentes', icon: 'person_pin', title: 'Docentes', desc: 'Banco de docentes y asignaciones', bg: 'linear-gradient(135deg, #f0fdfa, #ccfbf1)' },
    { path: '/alumnos', icon: 'people', title: 'Alumnos', desc: 'Inscripciones y perfiles', bg: 'linear-gradient(135deg, #ecfeff, #cffafe)' },
    { path: '/tipos-programa', icon: 'category', title: 'Tipos de Programa', desc: 'Categorías académicas', bg: 'linear-gradient(135deg, #f5f3ff, #ede9fe)' },
  ];

  ngOnInit(): void {
    this.fechaHoy = new Date().toLocaleDateString('es-BO', {
      day: '2-digit', month: 'long', year: 'numeric',
    });
    this.cargarStats();
    this.cargarEdiciones();
    this.destroyRef.onDestroy(() => this.detenerAutoScroll());
  }

  private cargarStats() {
    this.programaService.getAll().pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: (data) => this.totalProgramas.set(data.length),
    });
    this.docenteService.getAll().pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: (data) => this.totalDocentes.set(data.length),
    });
  }

  private cargarEdiciones() {
    this.edicionService.getAll(undefined, true).pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: (data) => {
        this.edicionesActivas.set(data);
        setTimeout(() => this.iniciarAutoScroll());
      },
      error: () => {
        this.snackBar.open('Error al cargar ediciones activas', 'Cerrar', { duration: 4000 });
      },
    });
  }

  getFotoUrl(foto: string | null): string {
    return foto ? `${this.apiUrl}${foto}` : '';
  }

  onImgError(event: Event): void {
    (event.target as HTMLImageElement).style.display = 'none';
  }

  getBannerGradient(estado: string): string {
    switch (estado) {
      case 'en_curso': return 'linear-gradient(135deg, #0d9488, #0f766e)';
      case 'programado': return 'linear-gradient(135deg, #1e3a8a, #1e40af)';
      case 'reprogramado': return 'linear-gradient(135deg, #ca8a04, #a16207)';
      case 'finalizado': return 'linear-gradient(135deg, #64748b, #475569)';
      default: return 'linear-gradient(135deg, #1e3a8a, #7c3aed)';
    }
  }

  private get track(): HTMLElement | null {
    return this.trackRef?.nativeElement ?? null;
  }

  private get totalWidth(): number {
    return this.edicionesActivas().length * CARD_STEP;
  }

  private aplicarTransform(): void {
    const el = this.track;
    if (el) el.style.transform = `translateX(${this.offset}px)`;
  }

  scrollCarousel(dir: number): void {
    this.detenerAutoScroll();
    this.offset += dir * CARD_STEP;
    this.clampOffset();
    this.aplicarTransform();
    if (this.scrollTimeout) clearTimeout(this.scrollTimeout);
    this.scrollTimeout = setTimeout(() => this.iniciarAutoScroll(), 2500);
  }

  onWheel(event: WheelEvent): void {
    event.preventDefault();
    this.detenerAutoScroll();
    this.offset -= event.deltaY || event.deltaX;
    this.clampOffset();
    this.aplicarTransform();
    if (this.scrollTimeout) clearTimeout(this.scrollTimeout);
    this.scrollTimeout = setTimeout(() => this.iniciarAutoScroll(), 1800);
  }

  private clampOffset(): void {
    const max = 0;
    const min = -this.totalWidth;
    this.offset = Math.max(min, Math.min(max, this.offset));
  }

  private iniciarAutoScroll(): void {
    this.detenerAutoScroll();
    if (!this.track || this.totalWidth === 0) return;
    const step = () => {
      this.offset -= 0.5;
      if (this.offset <= -this.totalWidth) {
        this.offset = 0;
      }
      this.aplicarTransform();
      this.autoScrollId = requestAnimationFrame(step);
    };
    this.autoScrollId = requestAnimationFrame(step);
  }

  private detenerAutoScroll(): void {
    if (this.autoScrollId !== null) {
      cancelAnimationFrame(this.autoScrollId);
      this.autoScrollId = null;
    }
    if (this.scrollTimeout !== null) {
      clearTimeout(this.scrollTimeout);
      this.scrollTimeout = null;
    }
  }

  irAModulos(edicion: ProgramaVersionEdicion): void {
    const programa = edicion.programa_version.programa;
    this.router.navigate([
      '/programas', programa.id_programa,
      'versiones', edicion.programa_version.id_programa_version,
      'ediciones', edicion.id_programa_version_edicion,
      'modulos',
    ]);
  }

  convertirFecha(fecha: string | null): string {
    if (!fecha) return '—';
    const d = new Date(fecha + 'T12:00:00');
    return d.toLocaleDateString('es-BO', { day: '2-digit', month: '2-digit', year: 'numeric' });
  }
}