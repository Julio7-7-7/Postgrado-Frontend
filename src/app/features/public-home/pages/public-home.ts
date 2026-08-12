import { Component, OnInit, AfterViewInit, inject, signal, DestroyRef, ElementRef, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatCardModule } from '@angular/material/card';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { EdicionService } from '../../edicion/services/edicion.service';
import { DetalleProgramaAlumnoService } from '../../alumno/services/detalle-programa-alumno.service';
import { ProgramaVersionEdicion } from '../../edicion/models/edicion.model';
import { environment } from '../../../../environments/environment';

interface Pilar {
  icon: string;
  titulo: string;
  desc: string;
  color: string;
}

@Component({
  selector: 'app-public-home',
  standalone: true,
  imports: [
    CommonModule, RouterModule,
    MatButtonModule, MatIconModule, MatCardModule, MatSnackBarModule,
  ],
  templateUrl: './public-home.html',
  styleUrl: './public-home.css',
})
export class PublicHomeComponent implements OnInit, AfterViewInit {
  private edicionService = inject(EdicionService);
  private detalleService = inject(DetalleProgramaAlumnoService);
  private snackBar = inject(MatSnackBar);
  private router = inject(Router);
  private auth = inject(AuthService);
  private destroyRef = inject(DestroyRef);

  @ViewChild('carouselTrack') trackRef!: ElementRef<HTMLElement>;

  ediciones = signal<ProgramaVersionEdicion[]>([]);
  cargando = signal(true);

  apiUrl = environment.apiUrl;

  currentSlide = signal(0);
  private autoScrollId: ReturnType<typeof setInterval> | null = null;

  pilares: Pilar[] = [
    {
      icon: 'verified',
      titulo: 'Transparencia',
      desc: 'Procesos administrativos y académicos abiertos, con información clara y accesible para toda la comunidad universitaria.',
      color: '#1e3a8a',
    },
    {
      icon: 'assured_workload',
      titulo: 'Gestión de la Calidad',
      desc: 'Estándares académicos rigurosos, mejora continua y seguimiento personalizado para asegurar la excelencia educativa.',
      color: '#0f766e',
    },
    {
      icon: 'laptop',
      titulo: 'Virtualidad',
      desc: 'Plataformas digitales modernas que facilitan el aprendizaje remoto y la interacción en tiempo real con docentes y pares.',
      color: '#7c3aed',
    },
    {
      icon: 'automation',
      titulo: 'Digitalización',
      desc: 'Gestión documental y de trámites 100% digital, eliminando barreras burocráticas y agilizando los procesos institucionales.',
      color: '#b45309',
    },
  ];

  ngOnInit(): void {
    this.edicionService.getActivas().pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: (data) => {
        this.ediciones.set(data);
        this.cargando.set(false);
      },
      error: () => {
        this.cargando.set(false);
        this.snackBar.open('Error al cargar oferta académica', 'Cerrar', { duration: 4000 });
      },
    });
  }

  ngAfterViewInit(): void {
    this.iniciarAutoScroll();
    this.destroyRef.onDestroy(() => this.detenerAutoScroll());
  }

  private iniciarAutoScroll(): void {
    this.detenerAutoScroll();
    this.autoScrollId = setInterval(() => {
      const total = this.ediciones().length;
      if (total === 0) return;
      this.currentSlide.update(i => (i + 1) % total);
      this.desplazar();
    }, 7000);
  }

  private detenerAutoScroll(): void {
    if (this.autoScrollId !== null) {
      clearInterval(this.autoScrollId);
      this.autoScrollId = null;
    }
  }

  irASlide(index: number): void {
    this.currentSlide.set(index);
    this.desplazar();
    this.detenerAutoScroll();
    setTimeout(() => this.iniciarAutoScroll(), 5000);
  }

  private desplazar(): void {
    const el = this.trackRef?.nativeElement;
    if (!el) return;
    const card = el.children[this.currentSlide()] as HTMLElement;
    if (card) {
      card.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' });
    }
  }

  inscribirse(edicion: ProgramaVersionEdicion): void {
    const esEnCurso = edicion.estado === 'en_curso';

    if (this.auth.isLogged()) {
      this.detalleService.getMisInscripciones().subscribe({
        next: (inscripciones) => {
          const yaInscripto = inscripciones.some(
            i => i.id_programa_version_edicion === edicion.id_programa_version_edicion
          );
          if (yaInscripto) {
            this.router.navigate(['/alumnos/inscripciones']);
          } else {
            this.router.navigate(['/alumnos', 'inscribir', edicion.id_programa_version_edicion]);
          }
        },
        error: () => {
          this.router.navigate(['/alumnos', 'inscribir', edicion.id_programa_version_edicion]);
        },
      });
    } else {
      if (esEnCurso) {
        this.router.navigate(['/login'], {
          queryParams: { incorporar: edicion.id_programa_version_edicion },
        });
      } else {
        this.router.navigate(['/login'], {
          queryParams: { inscribir: edicion.id_programa_version_edicion },
        });
      }
    }
  }

  getFotoUrl(foto: string | null): string {
    return foto ? `${this.apiUrl}${foto}` : '';
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

  convertirFecha(fecha: string | null): string {
    if (!fecha) return '—';
    const d = new Date(fecha + 'T12:00:00');
    return d.toLocaleDateString('es-BO', { day: '2-digit', month: '2-digit', year: 'numeric' });
  }
}
