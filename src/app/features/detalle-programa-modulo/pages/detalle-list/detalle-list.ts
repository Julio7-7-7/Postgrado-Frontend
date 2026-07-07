import { Component, OnInit, signal, computed, inject, DestroyRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, ActivatedRoute, RouterLink } from '@angular/router';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { forkJoin } from 'rxjs';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBarModule, MatSnackBar } from '@angular/material/snack-bar';
import { MatDividerModule } from '@angular/material/divider';
import { MatDialogModule, MatDialog } from '@angular/material/dialog';
import { DetalleService } from '../../services/detalle.service';
import { HorarioService } from '../../../horario/services/horario.service';
import { DetalleProgramaModulo } from '../../models/detalle.model';
import { Horario } from '../../../horario/models/horario.model';
import { ReordenarModulosDialogComponent, ReordenarModulosData } from '../../components/reordenar-modulos-dialog/reordenar-modulos-dialog';

@Component({
  selector: 'app-detalle-list',
  standalone: true,
  imports: [
    CommonModule, RouterLink,
    MatCardModule, MatButtonModule, MatIconModule, MatTooltipModule,
    MatProgressSpinnerModule, MatSnackBarModule,
    MatDividerModule, MatDialogModule,
  ],
  templateUrl: './detalle-list.html',
  styleUrl: './detalle-list.css',
})
export class DetalleListComponent implements OnInit {
  private detalleService = inject(DetalleService);
  private horarioService = inject(HorarioService);
  private snackbar = inject(MatSnackBar);
  private dialog = inject(MatDialog);
  private router = inject(Router);
  private route = inject(ActivatedRoute);
  private destroyRef = inject(DestroyRef);

  idEdicion = signal<number>(0);
  detalles = signal<DetalleProgramaModulo[]>([]);
  currentIndex = signal(0);
  isLoading = signal(true);
  error = signal<string | null>(null);

  horarios = signal<Record<number, Horario[]>>({});

  contexto = computed(() => {
    const d = this.detalles();
    if (d.length === 0) return null;
    const primero = d[0];
    return {
      programa: primero.programa_nombre,
      version: primero.programa_version_numero,
      edicion: primero.edicion,
    };
  });

  ngOnInit(): void {
    const match = this.router.url.match(/\/ediciones\/(\d+)\/modulos/);
    if (!match) {
      this.error.set('Edición no especificada');
      this.isLoading.set(false);
      return;
    }
    this.idEdicion.set(+match[1]);
    this.cargarDetalles();
  }

  cargarDetalles() {
    this.isLoading.set(true);
    this.error.set(null);
    this.detalleService.getAll(this.idEdicion()).pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: (data) => {
        const ordenados = data.sort((a, b) => a.orden - b.orden);
        this.detalles.set(ordenados);
        this.isLoading.set(false);

        const destacarId = Number(this.route.snapshot.queryParamMap.get('destacar'));
        if (destacarId) {
          const idx = ordenados.findIndex(d => d.id_detalle_programa_modulo === destacarId);
          this.currentIndex.set(idx >= 0 ? idx : 0);
        } else {
          this.currentIndex.set(0);
        }

        this.cargarTodosHorarios();
        setTimeout(() => this.ajustarAltura(), 150);
      },
      error: () => {
        this.error.set('No se pudieron cargar los módulos de la edición.');
        this.isLoading.set(false);
        this.snackbar.open('Error al sincronizar datos', 'Cerrar', { duration: 4000 });
      },
    });
  }

  anterior() {
    if (this.currentIndex() > 0) {
      this.currentIndex.update(i => i - 1);
      setTimeout(() => this.ajustarAltura());
    }
  }

  siguiente() {
    if (this.currentIndex() < this.detalles().length - 1) {
      this.currentIndex.update(i => i + 1);
      setTimeout(() => this.ajustarAltura());
    }
  }

  irA(index: number) {
    if (index >= 0 && index < this.detalles().length && index !== this.currentIndex()) {
      this.currentIndex.set(index);
      setTimeout(() => this.ajustarAltura());
    }
  }

  private ajustarAltura() {
    const activeCard = document.querySelector<HTMLElement>('.modulo-card.active');
    const stage = document.querySelector<HTMLElement>('.carousel-stage');
    if (activeCard && stage) {
      stage.style.minHeight = activeCard.offsetHeight + 'px';
    }
  }

  empezarContratacion(detalle: DetalleProgramaModulo) {
    this.router.navigate(['/contrataciones/nuevo'], {
      queryParams: { id_detalle_modulo: detalle.id_detalle_programa_modulo }
    });
  }

  abrirGestionar(detalle: DetalleProgramaModulo) {
    const base = this.router.url.replace(/\/modulos.*/, '/modulos');
    this.router.navigate([`${base}/gestionar/${detalle.id_detalle_programa_modulo}`]);
  }

  abrirReordenar() {
    const dialogRef = this.dialog.open(ReordenarModulosDialogComponent, {
      width: '600px',
      data: {
        idEdicion: this.idEdicion(),
        modulos: this.detalles(),
      } satisfies ReordenarModulosData,
    });
    dialogRef.afterClosed().pipe(takeUntilDestroyed(this.destroyRef)).subscribe((result: boolean | undefined) => {
      if (result) {
        this.cargarDetalles();
      }
    });
  }

  verHistorial(detalle: DetalleProgramaModulo) {
    const base = this.router.url.replace(/\/modulos.*/, '/modulos');
    this.router.navigate([`${base}/historial/${detalle.id_detalle_programa_modulo}`]);
  }

  private cargarTodosHorarios() {
    const ids = this.detalles().map(d => d.id_detalle_programa_modulo);
    if (ids.length === 0) return;
    forkJoin(
      ids.map(id =>
        this.horarioService.getAll(id).pipe(takeUntilDestroyed(this.destroyRef))
      )
    ).pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: (results) => {
        this.horarios.update(current => {
          const next = { ...current };
          for (let i = 0; i < ids.length; i++) {
            next[ids[i]] = results[i];
          }
          return next;
        });
        setTimeout(() => this.ajustarAltura(), 100);
      },
      error: () => console.error('Error al cargar horarios'),
    });
  }

  private readonly ORDEN_DIAS: Record<string, number> = {
    lunes: 1, martes: 2, miercoles: 3, jueves: 4,
    viernes: 5, sabado: 6, domingo: 7,
  };

  horariosDe(detalle: DetalleProgramaModulo): Horario[] {
    const lista = this.horarios()[detalle.id_detalle_programa_modulo] || [];
    return [...lista].sort((a, b) => (this.ORDEN_DIAS[a.dia] ?? 99) - (this.ORDEN_DIAS[b.dia] ?? 99));
  }

  diaLabel(dia: string): string {
    const map: Record<string, string> = {
      lunes: 'Lun', martes: 'Mar', miercoles: 'Mié',
      jueves: 'Jue', viernes: 'Vie', sabado: 'Sáb', domingo: 'Dom',
    };
    return map[dia] || dia;
  }

  estadoLabel(estado: string): string {
    const map: Record<string, string> = {
      programado: 'Programado', en_curso: 'En Curso',
      reprogramado: 'Reprogramado', finalizado: 'Finalizado',
    };
    return map[estado] || estado;
  }

  contratacionEstadoLabel(estado: string): string {
    const map: Record<string, string> = {
      pendiente: 'Pendiente', en_curso: 'En Proceso',
      formalizado: 'Formalizado', truncado: 'Truncado',
    };
    return map[estado] || estado;
  }

  volverAEdiciones(): void {
    const idx = this.router.url.indexOf('/modulos');
    if (idx !== -1) {
      this.router.navigateByUrl(this.router.url.substring(0, idx));
    }
  }
}
