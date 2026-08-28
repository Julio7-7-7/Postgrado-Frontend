import { Component, OnInit, signal, computed, inject, DestroyRef, ViewChild, ElementRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatTableModule } from '@angular/material/table';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { NotaService } from '../../../notas/services/nota.service';
import { AuthService } from '../../../../core/services/auth.service';
import { DocenteModuloDetalle, NotaItem, NotaResponse } from '../../../notas/models/nota.model';
import { SortDir, sortItems } from '../../../../core/utils/sort-utils';
import { clasificarNota } from '../../../../core/utils/nota-utils';
import { maxTextWidth } from '../../../../core/utils/measure-text';
import { NavigationBackService } from '../../../../core/navigation/navigation-back.service';
import { AlumnoCalificar, NotaDialog, NotaDialogData, NotaDialogResult } from './nota-dialog';

@Component({
  selector: 'app-docente-calificar',
  standalone: true,
  imports: [
    CommonModule,
    MatButtonModule, MatIconModule, MatProgressSpinnerModule,
    MatSnackBarModule, MatTableModule, MatTooltipModule, MatDialogModule,
  ],
  templateUrl: './docente-calificar.html',
  styleUrl: './docente-calificar.css',
})
export class DocenteCalificarComponent implements OnInit {
  private service = inject(NotaService);
  private auth = inject(AuthService);
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private navBack = inject(NavigationBackService);
  private snackbar = inject(MatSnackBar);
  private dialog = inject(MatDialog);
  private destroyRef = inject(DestroyRef);

  @ViewChild('tablaWrap', { read: ElementRef }) private tablaWrap!: ElementRef<HTMLElement>;

  readonly columnas = ['alumno', 'nota', 'clasificacion', 'accion'];

  datos = signal<DocenteModuloDetalle | null>(null);
  isLoading = signal(true);
  idDpm = 0;
  idDocente = 0;
  nombreDir = signal<SortDir>('asc');
  alumnoWidth = signal('auto');

  alumnosOrdenados = computed(() => {
    const d = this.datos();
    if (!d) return [];
    return sortItems(d.alumnos, a => `${a.alumno?.apellido || ''} ${a.alumno?.nombre || ''}`, this.nombreDir());
  });

  alumnosSinNota = computed(() => {
    const d = this.datos();
    if (!d) return [];
    return d.alumnos.filter(a => a.notas.length === 0);
  });

  calificados = computed(() => {
    const d = this.datos();
    if (!d) return 0;
    return d.alumnos.filter(a => a.notas.length > 0).length;
  });

  moduloEnCurso = computed(() => this.datos()?.modulo.estado === 'en_curso');

  ngOnInit(): void {
    this.idDpm = Number(this.route.snapshot.paramMap.get('idDpm'));
    this.idDocente = Number(this.auth.user()?.id_profile) || 0;
    if (!this.idDpm) {
      this.router.navigate(['/docente']);
      return;
    }
    this.cargarDatos();
  }

  cargarDatos(): void {
    this.isLoading.set(true);
    this.service.getNotasPorModulo(this.idDpm).pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: data => {
        this.datos.set(data);
        this.isLoading.set(false);
        requestAnimationFrame(() => this.medirColumnaAlumno());
      },
      error: () => {
        this.isLoading.set(false);
        this.snackbar.open('Error al cargar datos del módulo', 'Cerrar', { duration: 3000 });
      },
    });
  }

  private medirColumnaAlumno(): void {
    const el = this.tablaWrap?.nativeElement;
    if (!el) return;
    const max = maxTextWidth(Array.from(el.querySelectorAll<HTMLElement>('.alumno-nombre')));
    if (max > 0) {
      const AVATAR = 32, GAP = 10, PADDING = 32;
      this.alumnoWidth.set(`${max + AVATAR + GAP + PADDING + 12}px`);
    }
  }

  notaDe(a: AlumnoCalificar): number | null {
    const n = a.notas[0]?.nota;
    if (n === undefined || n === null) return null;
    return Math.floor(Number(n) + 0.5);
  }

  calClase(a: AlumnoCalificar): string {
    const n = this.notaDe(a);
    return n === null ? 'sin-nota' : clasificarNota(Math.floor(n + 0.5)).replace('cal-', '');
  }

  calTexto(a: AlumnoCalificar): string {
    const n = this.notaDe(a);
    return n === null ? '—' : this.calClase(a);
  }

  abrirDialogAgregar(): void {
    const candidatos = this.alumnosSinNota();
    if (candidatos.length === 0) return;
    this.abrirDialog({ modo: 'crear', alumnos: candidatos, idDpm: this.idDpm }, 'Nota registrada');
  }

  abrirDialogAgregarAlumno(a: AlumnoCalificar): void {
    if (a.notas.length > 0) return;
    this.abrirDialog({ modo: 'crear', alumnos: [a], fijo: true, idDpm: this.idDpm }, 'Nota registrada');
  }

  abrirDialogEditar(a: AlumnoCalificar): void {
    if (a.notas.length === 0) return;
    this.abrirDialog({ modo: 'editar', alumno: a, idDpm: this.idDpm }, 'Nota actualizada');
  }

  private abrirDialog(data: NotaDialogData, mensajeExito: string): void {
    const d = this.datos();
    if (d && !data.contexto) {
      data = {
        ...data,
        contexto: {
          sigla: d.modulo.sigla,
          edicion: `${d.edicion.programa_nombre} — Ed. ${d.edicion.edicion_numero}`,
        },
      };
    }
    this.dialog.open(NotaDialog, { width: '460px', data })
      .afterClosed().pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((res: NotaDialogResult | null) => {
        if (!res) return;
        this.patchearNotaEnDatos(res.dpaId, res.nota);
        this.snackbar.open(mensajeExito, 'OK', { duration: 2000 });
      });
  }

  private patchearNotaEnDatos(idDpa: number, resp: NotaResponse): void {
    this.datos.update(d => {
      if (!d) return d;
      const alumnos = d.alumnos.map(x => {
        if (x.id_detalle_programa_alumno !== idDpa) return x;
        const item: NotaItem = {
          id_nota: resp.id_nota,
          nota: Number(resp.nota),
          calificacion: resp.calificacion,
          fecha: resp.fecha,
          created_at: resp.created_at,
          updated_at: resp.updated_at,
        };
        return { ...x, notas: [item] };
      });
      return { ...d, alumnos };
    });
  }

  trackByDpa(_: number, a: AlumnoCalificar): number {
    return a.id_detalle_programa_alumno;
  }

  onSort(): void {
    this.nombreDir.set(this.nombreDir() === 'asc' ? 'desc' : 'asc');
  }

  sortIcon(): string {
    return this.nombreDir() === 'asc' ? 'arrow_upward' : 'arrow_downward';
  }

  iniciales(a: AlumnoCalificar): string {
    if (!a.alumno) return '??';
    return (a.alumno.nombre[0] + a.alumno.apellido[0]).toUpperCase();
  }

  volver(): void {
    this.navBack.retornar(['/docente/mis-modulos']);
  }
}
