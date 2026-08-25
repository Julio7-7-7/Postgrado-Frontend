import { Component, OnInit, signal, computed, inject, DestroyRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink, Router, ActivatedRoute } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBarModule, MatSnackBar } from '@angular/material/snack-bar';
import { MatCardModule } from '@angular/material/card';
import { MatChipsModule } from '@angular/material/chips';
import { MatDialogModule, MatDialog } from '@angular/material/dialog';

import { ProgramaService } from '../../services/programa.service';
import { Programa } from '../../models/programa.model';
import { ProgramaFormComponent } from '../programa-form/programa-form';
import { ProgramaVersionService } from '../../../programa-version/services/programa-version.service';
import { ProgramaVersion } from '../../../programa-version/models/programa-version.model';
import { ProgramaVersionFormComponent } from '../../../programa-version/pages/programa-version-form/programa-version-form';
import { EdicionService } from '../../../edicion/services/edicion.service';
import { ProgramaVersionEdicion } from '../../../edicion/models/edicion.model';
import { ConfirmDialogComponent } from '../../../../shared/components/confirm-dialog/confirm-dialog';
import { AuthService } from '../../../../core/services/auth.service';
import { environment } from '../../../../../environments/environment';

const VERSIONES_POR_PAGINA = 20;
const EDICIONES_POR_PAGINA = 8;

interface Paginacion<T> {
  items: T[];
  page: number;
  total: number;
  pages: number;
}

function paginacionVacia<T>(): Paginacion<T> {
  return { items: [], page: 0, total: 0, pages: 0 };
}

@Component({
  selector: 'app-programa-explorer',
  standalone: true,
  imports: [
    CommonModule,
    RouterLink,
    FormsModule,
    MatButtonModule,
    MatIconModule,
    MatTooltipModule,
    MatFormFieldModule,
    MatInputModule,
    MatProgressSpinnerModule,
    MatSnackBarModule,
    MatCardModule,
    MatChipsModule,
    MatDialogModule,
  ],
  templateUrl: './programa-explorer.html',
  styleUrl: './programa-explorer.css',
})
export class ProgramaExplorerComponent implements OnInit {
  private programaService = inject(ProgramaService);
  private versionService = inject(ProgramaVersionService);
  private edicionService = inject(EdicionService);
  private auth = inject(AuthService);
  private snackbar = inject(MatSnackBar);
  private dialog = inject(MatDialog);
  private router = inject(Router);
  private route = inject(ActivatedRoute);
  private destroyRef = inject(DestroyRef);

  apiUrl = environment.apiUrl;

  get canCrear(): boolean {
    return this.auth.hasPermiso('programas.crear');
  }

  get canEditar(): boolean {
    return this.auth.hasPermiso('programas.editar');
  }

  listaTotal = signal<Programa[]>([]);
  terminoBusqueda = signal('');
  isLoading = signal(true);
  error = signal<string | null>(null);
  showInactivos = signal(false);

  expandidosProgramas = signal<Set<number>>(new Set());
  expandidosVersiones = signal<Set<number>>(new Set());
  versionesMap = signal<Record<number, Paginacion<ProgramaVersion>>>({});
  edicionesMap = signal<Record<number, Paginacion<ProgramaVersionEdicion>>>({});
  cargandoVersionesMap = signal<Record<number, boolean>>({});
  cargandoEdicionesMap = signal<Record<number, boolean>>({});

  listaActivos = computed(() =>
    this.listaTotal()
      .filter(p => p.estado === 'activo' && p.nombre_programa.toLowerCase().includes(this.terminoBusqueda().toLowerCase()))
      .sort((a, b) => a.nombre_programa.localeCompare(b.nombre_programa)),
  );

  listaInactivos = computed(() =>
    this.listaTotal()
      .filter(p => p.estado === 'inactivo' && p.nombre_programa.toLowerCase().includes(this.terminoBusqueda().toLowerCase()))
      .sort((a, b) => a.nombre_programa.localeCompare(b.nombre_programa)),
  );

  totalProgramas = computed(() => this.listaTotal().length);

  totalVersiones = computed(() =>
    Object.values(this.versionesMap()).reduce((acc, pag) => acc + pag.total, 0),
  );

  totalEdiciones = computed(() =>
    Object.values(this.versionesMap()).reduce(
      (acc, pag) => acc + pag.items.reduce((a, v) => a + (v.ediciones_count ?? 0), 0),
      0,
    ),
  );

  ngOnInit(): void {
    this.cargarDatos();
    this.route.queryParamMap.subscribe(() => this.aplicarDeepLink());
  }

  cargarDatos(): void {
    this.isLoading.set(true);
    this.error.set(null);
    this.programaService.getAll().pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: data => {
        this.listaTotal.set(data);
        this.precargarVersiones();
      },
      error: () => {
        this.error.set('No se pudo establecer conexión con el servidor.');
        this.isLoading.set(false);
        this.snackbar.open('Error al sincronizar datos', 'Cerrar', { duration: 4000 });
      },
    });
  }

  private precargarVersiones(): void {
    this.versionService.getAll().pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: vers => {
        const map: Record<number, Paginacion<ProgramaVersion>> = {};
        for (const v of vers) {
          const pid = v.id_programa;
          const pag = (map[pid] ??= { items: [], page: 1, total: 0, pages: 1 });
          pag.items.push(v);
          pag.total++;
        }
        this.versionesMap.set(map);
        this.isLoading.set(false);
        this.aplicarDeepLink();
      },
      error: () => {
        this.isLoading.set(false);
        this.aplicarDeepLink();
      },
    });
  }

  abrirFormulario(programa?: Programa): void {
    const ref = this.dialog.open(ProgramaFormComponent, {
      width: '640px',
      data: programa ?? null,
    });
    ref.afterClosed().pipe(takeUntilDestroyed(this.destroyRef)).subscribe(result => {
      if (result) this.cargarDatos();
    });
  }

  editarPrograma(programa: Programa): void {
    this.abrirFormulario(programa);
  }

  getFotoUrl(foto: string | null): string {
    return foto ? `${this.apiUrl}${foto}` : '';
  }

  onImgError(event: Event): void {
    (event.target as HTMLImageElement).style.display = 'none';
  }

  esProgramaExpandido(id: number): boolean {
    return this.expandidosProgramas().has(id);
  }

  esVersionExpandida(id: number): boolean {
    return this.expandidosVersiones().has(id);
  }

  versionesDe(programaId: number): ProgramaVersion[] {
    return this.versionesMap()[programaId]?.items ?? [];
  }

  edicionesDe(versionId: number): ProgramaVersionEdicion[] {
    return this.edicionesMap()[versionId]?.items ?? [];
  }

  paginacionVersiones(programaId: number): Paginacion<ProgramaVersion> {
    return this.versionesMap()[programaId] ?? paginacionVacia();
  }

  paginacionEdiciones(versionId: number): Paginacion<ProgramaVersionEdicion> {
    return this.edicionesMap()[versionId] ?? paginacionVacia();
  }

  cargandoVersiones(programaId: number): boolean {
    return !!this.cargandoVersionesMap()[programaId];
  }

  cargandoEdiciones(versionId: number): boolean {
    return !!this.cargandoEdicionesMap()[versionId];
  }

  togglePrograma(programa: Programa): void {
    if (this.esProgramaExpandido(programa.id_programa)) {
      this.expandidosProgramas.update(s => {
        const next = new Set(s);
        next.delete(programa.id_programa);
        return next;
      });
      return;
    }
    this.expandidosProgramas.update(s => new Set(s).add(programa.id_programa));
    const pag = this.paginacionVersiones(programa.id_programa);
    if (pag.items.length === 0) this.cargarVersiones(programa.id_programa, 1);
  }

  toggleVersion(version: ProgramaVersion): void {
    if (this.esVersionExpandida(version.id_programa_version)) {
      this.expandidosVersiones.update(s => {
        const next = new Set(s);
        next.delete(version.id_programa_version);
        return next;
      });
      return;
    }
    this.expandidosVersiones.update(s => new Set(s).add(version.id_programa_version));
    const pag = this.paginacionEdiciones(version.id_programa_version);
    if (pag.items.length === 0) this.cargarEdiciones(version.id_programa_version, 1);
  }

  cargarVersiones(programaId: number, page: number): void {
    this.cargandoVersionesMap.update(m => ({ ...m, [programaId]: true }));
    this.versionService.getPaginadas(programaId, page, VERSIONES_POR_PAGINA)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: res => {
          this.versionesMap.update(m => {
            const prev = m[programaId] ?? paginacionVacia<ProgramaVersion>();
            return {
              ...m,
              [programaId]: {
                items: page === 1 ? res.items : [...prev.items, ...res.items],
                page: res.page,
                total: res.total,
                pages: res.pages,
              },
            };
          });
          this.cargandoVersionesMap.update(m => ({ ...m, [programaId]: false }));
        },
        error: () => {
          this.cargandoVersionesMap.update(m => ({ ...m, [programaId]: false }));
          this.snackbar.open('Error al cargar versiones', 'Cerrar', { duration: 4000 });
        },
      });
  }

  cargarMasVersiones(programaId: number): void {
    const pag = this.paginacionVersiones(programaId);
    if (pag.page < pag.pages) this.cargarVersiones(programaId, pag.page + 1);
  }

  cargarEdiciones(versionId: number, page: number): void {
    this.cargandoEdicionesMap.update(m => ({ ...m, [versionId]: true }));
    this.edicionService.getPaginadas(versionId, page, EDICIONES_POR_PAGINA)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: res => {
          this.edicionesMap.update(m => {
            const prev = m[versionId] ?? paginacionVacia<ProgramaVersionEdicion>();
            return {
              ...m,
              [versionId]: {
                items: page === 1 ? res.items : [...prev.items, ...res.items],
                page: res.page,
                total: res.total,
                pages: res.pages,
              },
            };
          });
          this.cargandoEdicionesMap.update(m => ({ ...m, [versionId]: false }));
        },
        error: () => {
          this.cargandoEdicionesMap.update(m => ({ ...m, [versionId]: false }));
          this.snackbar.open('Error al cargar ediciones', 'Cerrar', { duration: 4000 });
        },
      });
  }

  cargarMasEdiciones(versionId: number): void {
    const pag = this.paginacionEdiciones(versionId);
    if (pag.page < pag.pages) this.cargarEdiciones(versionId, pag.page + 1);
  }

  private aplicarDeepLink(): void {
    if (this.isLoading()) return;
    const params = this.route.snapshot.queryParamMap;
    const pid = Number(params.get('programa'));
    if (!pid) return;
    this.expandirDesdeDeepLink(pid, Number(params.get('version')) || undefined);
  }

  private expandirDesdeDeepLink(programaId: number, versionId?: number): void {
    const programa = this.listaTotal().find(p => p.id_programa === programaId);
    if (!programa) return;
    this.expandidosProgramas.update(s => new Set(s).add(programaId));
    if (!versionId) return;
    const version = this.versionesDe(programaId).find(v => v.id_programa_version === versionId);
    if (version) {
      this.expandirVersion(versionId);
    } else {
      setTimeout(() => {
        const v = this.versionesDe(programaId).find(x => x.id_programa_version === versionId);
        if (v && this.esProgramaExpandido(programaId)) this.expandirVersion(versionId);
      }, 600);
    }
  }

  private expandirVersion(versionId: number): void {
    this.expandidosVersiones.update(s => new Set(s).add(versionId));
    const pag = this.paginacionEdiciones(versionId);
    if (pag.items.length === 0) this.cargarEdiciones(versionId, 1);
  }

  irAModulos(programaId: number, versionId: number, edicionId: number): void {
    this.router.navigate(['/programas', programaId, 'versiones', versionId, 'ediciones', edicionId, 'modulos']);
  }

  irAModulosVersion(programaId: number, versionId: number): void {
    this.router.navigate(['/programas', programaId, 'versiones', versionId, 'modulos']);
  }

  editarEdicion(programaId: number, versionId: number, edicionId: number): void {
    this.router.navigate(['/programas', programaId, 'versiones', versionId, 'ediciones', 'editar', edicionId]);
  }

  verPostulantes(programaId: number, versionId: number, edicionId: number): void {
    this.router.navigate(['/programas', programaId, 'versiones', versionId, 'ediciones', edicionId, 'postulantes']);
  }

  verHistorial(programaId: number, versionId: number, edicionId: number): void {
    this.router.navigate(['/programas', programaId, 'versiones', versionId, 'ediciones', edicionId, 'historial']);
  }

  nuevaEdicion(programaId: number, versionId: number): void {
    this.router.navigate(['/programas', programaId, 'versiones', versionId, 'ediciones', 'nuevo']);
  }

  nuevaVersion(programa: Programa): void {
    const ref = this.dialog.open(ProgramaVersionFormComponent, {
      width: '640px',
      data: { id_programa: programa.id_programa, version: null },
    });
    ref.afterClosed().pipe(takeUntilDestroyed(this.destroyRef)).subscribe(result => {
      if (result) this.precargarVersiones();
    });
  }

  editarVersion(programa: Programa, version: ProgramaVersion): void {
    const ref = this.dialog.open(ProgramaVersionFormComponent, {
      width: '640px',
      data: { id_programa: programa.id_programa, version },
    });
    ref.afterClosed().pipe(takeUntilDestroyed(this.destroyRef)).subscribe(result => {
      if (result) this.precargarVersiones();
    });
  }

  toggleVigente(version: ProgramaVersion, programa: Programa): void {
    const accion = version.vigente ? 'desactivar' : 'activar';
    const dialogRef = this.dialog.open(ConfirmDialogComponent, {
      width: '420px',
      data: {
        titulo: 'Confirmar Cambio de Estado',
        mensaje: `¿Está seguro de que desea ${accion} la V${version.version} del programa?`,
      },
    });

    dialogRef.afterClosed().pipe(takeUntilDestroyed(this.destroyRef)).subscribe((confirmado: boolean) => {
      if (!confirmado) return;

      this.versionService.update(version.id_programa_version, { vigente: !version.vigente })
        .pipe(takeUntilDestroyed(this.destroyRef))
        .subscribe({
          next: (actualizada: ProgramaVersion) => {
            this.versionesMap.update(m => {
              const pag = m[programa.id_programa];
              if (!pag) return m;
              return {
                ...m,
                [programa.id_programa]: {
                  ...pag,
                  items: pag.items.map(v =>
                    v.id_programa_version === version.id_programa_version ? actualizada : v,
                  ),
                },
              };
            });
            this.snackbar.open(
              `V${version.version} ${version.vigente ? 'desactivada' : 'activada'} con éxito`,
              'OK',
              { duration: 3000 },
            );
          },
          error: () => {
            this.snackbar.open('Error al actualizar el estado de la versión', 'Cerrar', { duration: 4000 });
          },
        });
    });
  }

  estadoClass(estado: string): string {
    const map: Record<string, string> = {
      programado: 'programado',
      en_curso: 'en-curso',
      reprogramado: 'reprogramado',
      finalizado: 'finalizado',
    };
    return map[estado] || '';
  }

  estadoLabel(estado: string): string {
    const map: Record<string, string> = {
      programado: 'Programado',
      en_curso: 'En Curso',
      reprogramado: 'Reprogramado',
      finalizado: 'Finalizado',
    };
    return map[estado] || estado;
  }

  modalidadIcono(modalidad: string): string {
    const map: Record<string, string> = {
      presencial: 'groups',
      virtual: 'videocam',
      semipresencial: 'laptop',
    };
    return map[modalidad] || 'school';
  }

  modalidadLabel(modalidad: string): string {
    const map: Record<string, string> = {
      presencial: 'Presencial',
      virtual: 'Virtual',
      semipresencial: 'Semipresencial',
    };
    return map[modalidad] || modalidad;
  }

  edicionColor(edicion: ProgramaVersionEdicion): string {
    const map: Record<string, string> = {
      programado: '#f59e0b',
      en_curso: '#10b981',
      reprogramado: '#6366f1',
      finalizado: '#64748b',
    };
    return map[edicion.estado] || '#64748b';
  }
}
