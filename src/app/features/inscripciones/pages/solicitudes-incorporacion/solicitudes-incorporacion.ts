import { Component, OnInit, inject, signal, computed, DestroyRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatBadgeModule } from '@angular/material/badge';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { InscripcionEdicionService } from '../../services/inscripcion-edicion.service';
import { SolicitudConDetalle, SolicitudAdminItem, TipoSolicitud } from '../../../alumno/models/solicitud-incorporacion.model';
import { ConfirmDialogComponent } from '../../../../shared/components/confirm-dialog/confirm-dialog';
import { SortDir, sortItems } from '../../../../core/utils/sort-utils';

@Component({
  selector: 'app-solicitudes-incorporacion',
  standalone: true,
  imports: [
    CommonModule, FormsModule,
    MatIconModule, MatButtonModule, MatTooltipModule,
    MatProgressSpinnerModule, MatBadgeModule, MatSnackBarModule, MatDialogModule,
  ],
  template: `
    <div class="page-container">
      <div class="header-section">
        <div class="header-left">
          <button mat-icon-button (click)="volver()" class="back-btn" matTooltip="Volver a inscripciones">
            <mat-icon>arrow_back</mat-icon>
          </button>
          <div>
            <h1><mat-icon>school</mat-icon> Solicitudes</h1>
            <p class="subtitle">Gestionar solicitudes de incorporación, migración y reincorporación</p>
          </div>
        </div>
        <div class="header-right">
          <button mat-stroked-button class="config-btn" (click)="irARequisitos()" matTooltip="Configurar documentos requeridos">
            <mat-icon>settings</mat-icon> Documentos
          </button>
          @if (total() > 0) {
            <span class="total-count">{{ startIndex() }}&ndash;{{ endIndex() }} de {{ total() }} solicitud{{ total() !== 1 ? 'es' : '' }}</span>
          } @else {
            <span class="total-count">0 solicitudes</span>
          }
        </div>
      </div>

      <div class="stats-row">
        <div class="stat-chip incorporacion" (click)="onFiltroTipo('incorporacion')"
             [class.active]="filtroTipo() === 'incorporacion'">
          <mat-icon>school</mat-icon>
          <span>{{ countIncorporaciones() }} incorporación</span>
        </div>
        <div class="stat-chip migracion" (click)="onFiltroTipo('migracion')"
             [class.active]="filtroTipo() === 'migracion'">
          <mat-icon>swap_horiz</mat-icon>
          <span>{{ countMigraciones() }} migración</span>
        </div>
        <div class="stat-chip reincorporacion" (click)="onFiltroTipo('reincorporacion')"
             [class.active]="filtroTipo() === 'reincorporacion'">
          <mat-icon>restart_alt</mat-icon>
          <span>{{ countReincorporaciones() }} reincorporación</span>
        </div>
        <span class="filter-sep">·</span>
        <div class="stat-chip pendiente" (click)="onFiltroEstado('pendiente')"
             [class.active]="filtroEstado() === 'pendiente'">
          <mat-icon>schedule</mat-icon>
          <span>{{ countPendientes() }} pendientes</span>
        </div>
        <div class="stat-chip aceptado" (click)="onFiltroEstado('aprobado')"
             [class.active]="filtroEstado() === 'aprobado'">
          <mat-icon>check_circle</mat-icon>
          <span>{{ countAprobados() }} aprobadas</span>
        </div>
        <div class="stat-chip rechazado" (click)="onFiltroEstado('rechazado')"
             [class.active]="filtroEstado() === 'rechazado'">
          <mat-icon>cancel</mat-icon>
          <span>{{ countRechazadas() }} rechazadas</span>
        </div>
        @if (filtroTipo() || filtroEstado()) {
          <button class="clear-filter" (click)="limpiarFiltros()">
            <mat-icon>close</mat-icon>
            Limpiar
          </button>
        }
      </div>

      @if (isLoading()) {
        <div class="loading-state">
          <mat-spinner diameter="36"></mat-spinner>
          <span>Cargando solicitudes...</span>
        </div>
      } @else if (items().length === 0) {
        <div class="empty-state">
          <mat-icon>inbox</mat-icon>
          <h4>No hay solicitudes</h4>
          <p>{{ (filtroTipo() || filtroEstado()) ? 'No se encontraron solicitudes con estos filtros.' : 'No hay solicitudes registradas.' }}</p>
        </div>
      } @else {
        <div class="table-container">
          <table class="solicitudes-table">
            <thead>
              <tr>
                <th class="col-alumno"><button class="sort-btn" [class.active]="sortKey() === 'alumno'" (click)="onSort('alumno')">Alumno <mat-icon>{{ sortIcon('alumno') }}</mat-icon></button></th>
                <th class="col-solicitud"><button class="sort-btn" [class.active]="sortKey() === 'solicitud'" (click)="onSort('solicitud')">Solicitud <mat-icon>{{ sortIcon('solicitud') }}</mat-icon></button></th>
                <th class="col-docs"><button class="sort-btn" [class.active]="sortKey() === 'docs'" (click)="onSort('docs')">Docs <mat-icon>{{ sortIcon('docs') }}</mat-icon></button></th>
                <th class="col-estado"><button class="sort-btn" [class.active]="sortKey() === 'estado'" (click)="onSort('estado')">Estado <mat-icon>{{ sortIcon('estado') }}</mat-icon></button></th>
              </tr>
            </thead>
            <tbody>
              @for (item of paginatedItems(); track item.id) {
                <tr class="table-row" [class.pending-row]="item.estado === 'pendiente'"
                    (click)="abrirDetalle(item)">
                  <td class="col-alumno">
                    <div class="alumno-cell">
                      <div class="avatar-sm" [class]="'avatar-' + item.tipo">{{ iniciales(item) }}</div>
                      <div class="alumno-info">
                        <span class="alumno-name">{{ item.alumno_nombre }} {{ item.alumno_apellido }}</span>
                        <span class="alumno-ci">{{ item.alumno_ci || '&mdash;' }}</span>
                      </div>
                    </div>
                  </td>
                  <td class="col-solicitud">
                    <div class="solicitud-cell">
                      <div class="solicitud-top">
                        <span class="tipo-badge" [class]="'tipo-' + item.tipo">{{ tipoLabel(item) }}</span>
                        <span class="prog-name">{{ item.programa_nombre || 'Sin programa' }}</span>
                      </div>
                      <span class="solicitud-meta">
                        @if (item.edicion_numero) { Ed. {{ item.edicion_numero }} &mdash; {{ item.edicion_semestre }}-{{ item.edicion_anio }} &middot; }
                        {{ convertirFecha(item.created_at) }}
                      </span>
                    </div>
                  </td>
                  <td class="col-docs">
                    <div class="docs-cell">
                      @if (item.documentos && item.documentos.length > 0) {
                        <div class="doc-dots">
                          @for (doc of item.documentos; track $index) {
                            <span class="doc-dot" [class.uploaded]="!!doc.url_documento"
                                  [matTooltip]="(doc.nombre_requisito || 'Documento') + (doc.url_documento ? ' — recibido' : ' — pendiente')"></span>
                          }
                        </div>
                        <span class="doc-text">{{ docsSubidos(item) }}/{{ item.documentos.length }}</span>
                      } @else {
                        <span class="no-docs">&mdash;</span>
                      }
                    </div>
                  </td>
                  <td class="col-estado" (click)="$event.stopPropagation()">
                    @if (item.estado === 'pendiente') {
                      <div class="action-btns">
                        <button class="btn-icon btn-reject" (click)="rechazar(item)" matTooltip="Rechazar solicitud">
                          <mat-icon>close</mat-icon>
                        </button>
                        <button class="btn-icon btn-approve" (click)="aprobar(item)" matTooltip="Revisar y aprobar">
                          <mat-icon>check</mat-icon>
                        </button>
                      </div>
                    } @else if (item.estado === 'aprobado') {
                      <span class="estado-badge badge-aprobado">
                        <mat-icon>check_circle</mat-icon>
                        <span>aprobado</span>
                      </span>
                    } @else {
                      <span class="estado-badge badge-rechazado">
                        <mat-icon>cancel</mat-icon>
                        <span>rechazado</span>
                      </span>
                    }
                  </td>
                </tr>
              }
            </tbody>
          </table>
          <div class="paginator">
            <div class="paginator-info">
              {{ startIndex() }}&ndash;{{ endIndex() }} de {{ total() }}
            </div>
            <div class="paginator-controls">
              <button class="paginator-btn" (click)="prevPage()" [disabled]="page() === 0" matTooltip="Anterior">
                <mat-icon>chevron_left</mat-icon>
              </button>
              @for (p of pagesArr(); track $index) {
                <button class="paginator-page" [class.active]="p === page()" (click)="page.set(p)">
                  {{ p + 1 }}
                </button>
              }
              <button class="paginator-btn" (click)="nextPage()" [disabled]="page() >= totalPages() - 1" matTooltip="Siguiente">
                <mat-icon>chevron_right</mat-icon>
              </button>
              <select class="paginator-perpage" [ngModel]="perPage()" (ngModelChange)="cambiarPerPage($event)">
                @for (opt of perPageOptions; track opt) {
                  <option [value]="opt">{{ opt }} por p&aacute;g.</option>
                }
              </select>
            </div>
          </div>
        </div>
      }
    </div>
  `,
  styleUrl: './solicitudes-incorporacion.css',
})
export class SolicitudesIncorporacionComponent implements OnInit {
  private service = inject(InscripcionEdicionService);
  private router = inject(Router);
  private snackBar = inject(MatSnackBar);
  private dialog = inject(MatDialog);
  private destroyRef = inject(DestroyRef);

  allItems = signal<SolicitudAdminItem[]>([]);
  items = signal<SolicitudAdminItem[]>([]);
  isLoading = signal(true);
  filtroEstado = signal('');
  filtroTipo = signal<TipoSolicitud | ''>('');

  page = signal(0);
  perPage = signal(20);
  perPageOptions = [10, 20, 50];
  sortKey = signal<string>('fecha');
  sortDir = signal<SortDir>('desc');

  total = computed(() => this.items().length);
  totalPages = computed(() => Math.max(1, Math.ceil(this.items().length / this.perPage())));
  sortedItems = computed(() => this.sortItemsBy(this.items()));
  paginatedItems = computed(() => {
    const start = this.page() * this.perPage();
    return this.sortedItems().slice(start, start + this.perPage());
  });
  startIndex = computed(() => this.items().length === 0 ? 0 : this.page() * this.perPage() + 1);
  endIndex = computed(() => Math.min((this.page() + 1) * this.perPage(), this.items().length));
  pagesArr = computed(() => Array.from({ length: this.totalPages() }, (_, i) => i));

  countIncorporaciones = computed(() => this.allItems().filter(i => i.tipo === 'incorporacion').length);
  countMigraciones = computed(() => this.allItems().filter(i => i.tipo === 'migracion').length);
  countReincorporaciones = computed(() => this.allItems().filter(i => i.tipo === 'reincorporacion').length);
  countPendientes = computed(() => this.allItems().filter(i => i.estado === 'pendiente').length);
  countAprobados = computed(() => this.allItems().filter(i => i.estado === 'aprobado').length);
  countRechazadas = computed(() => this.allItems().filter(i => i.estado === 'rechazado').length);

  ngOnInit(): void {
    this.cargarTodas();
  }

  cargarTodas(): void {
    this.isLoading.set(true);
    this.service.getSolicitudes()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: data => {
          const all: SolicitudAdminItem[] = data.map(s => this.mapSolicitud(s));
          all.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
          this.allItems.set(all);
          this.aplicarFiltros();
          this.isLoading.set(false);
        },
        error: () => {
          this.isLoading.set(false);
        },
      });
  }

  mapSolicitud(s: SolicitudConDetalle): SolicitudAdminItem {
    return {
      tipo: s.tipo_codigo as TipoSolicitud,
      id: s.id_solicitud,
      estado: s.estado,
      created_at: s.created_at,
      id_alumno: s.id_alumno,
      alumno_nombre: s.alumno_nombre,
      alumno_apellido: s.alumno_apellido,
      alumno_ci: s.alumno_ci,
      id_detalle_programa_alumno: s.id_detalle_origen,
      dpa_estado: s.dpa_estado,
      edicion_numero: s.edicion_numero,
      edicion_anio: s.edicion_anio,
      edicion_semestre: s.edicion_semestre,
      programa_nombre: s.programa_nombre,
      documentos: s.documentos,
      motivo_rechazo: s.motivo_rechazo,
    };
  }

  aplicarFiltros(): void {
    let result = this.allItems();
    const tipo = this.filtroTipo();
    const estado = this.filtroEstado();
    if (tipo) result = result.filter(i => i.tipo === tipo);
    if (estado) result = result.filter(i => i.estado === estado);
    this.items.set(result);
    this.page.set(0);
  }

  onFiltroTipo(value: TipoSolicitud | ''): void {
    this.filtroTipo.set(this.filtroTipo() === value ? '' : value);
    this.aplicarFiltros();
  }

  onFiltroEstado(value: string): void {
    this.filtroEstado.set(this.filtroEstado() === value ? '' : value);
    this.aplicarFiltros();
  }

  limpiarFiltros(): void {
    this.filtroTipo.set('');
    this.filtroEstado.set('');
    this.aplicarFiltros();
  }

  nextPage(): void {
    if (this.page() < this.totalPages() - 1) this.page.update(p => p + 1);
  }

  prevPage(): void {
    if (this.page() > 0) this.page.update(p => p - 1);
  }

  cambiarPerPage(n: number): void {
    this.perPage.set(n);
    this.page.set(0);
  }

  sortItemsBy(items: SolicitudAdminItem[]): SolicitudAdminItem[] {
    const key = this.sortKey();
    const dir = this.sortDir();
    const accessors: Record<string, (i: SolicitudAdminItem) => unknown> = {
      alumno: i => `${i.alumno_apellido} ${i.alumno_nombre}`,
      solicitud: i => i.tipo,
      fecha: i => new Date(i.created_at).getTime(),
      docs: i => this.docsSubidos(i),
      estado: i => i.estado,
    };
    return sortItems(items, accessors[key] || accessors['fecha'], dir);
  }

  onSort(key: string): void {
    if (this.sortKey() === key) {
      this.sortDir.set(this.sortDir() === 'asc' ? 'desc' : 'asc');
    } else {
      this.sortKey.set(key);
      this.sortDir.set('asc');
    }
    this.page.set(0);
  }

  sortIcon(key: string): string {
    if (this.sortKey() !== key) return 'unfold_more';
    return this.sortDir() === 'asc' ? 'arrow_upward' : 'arrow_downward';
  }

  volver(): void {
    this.router.navigate(['/admin/inscripciones']);
  }

  irARequisitos(): void {
    this.router.navigate(['/admin/requisitos-incorporacion']);
  }

  tipoLabel(item: SolicitudAdminItem): string {
    switch (item.tipo) {
      case 'incorporacion': return 'Incorporación';
      case 'migracion': return 'Migración';
      case 'reincorporacion': return 'Reincorporación';
      default: return item.tipo;
    }
  }

  iniciales(item: SolicitudAdminItem): string {
    const n = item.alumno_nombre || '?';
    const a = item.alumno_apellido || '';
    return (n[0] + a[0]).toUpperCase();
  }

  convertirFecha(fecha: string): string {
    if (!fecha) return '—';
    const d = new Date(fecha);
    return d.toLocaleDateString('es-BO', { day: '2-digit', month: 'short', year: 'numeric' });
  }

  docsSubidos(item: SolicitudAdminItem): number {
    return item.documentos?.filter(d => !!d.url_documento).length || 0;
  }

  abrirDetalle(item: SolicitudAdminItem): void {
    this.router.navigate(['/admin/solicitudes-incorporacion', item.id, 'revisar']);
  }

  aprobar(item: SolicitudAdminItem): void {
    if (item.tipo === 'reincorporacion') {
      const dialogRef = this.dialog.open(ConfirmDialogComponent, {
        data: {
          titulo: 'Aprobar reincorporación',
          mensaje: `¿Aprobar la reincorporación de ${item.alumno_nombre} ${item.alumno_apellido}? El alumno volverá al estado "Inscrito" en la edición.`,
        },
      });
      dialogRef.afterClosed().subscribe(result => {
        if (result) {
          this.service.aprobarSolicitud(item.id)
            .pipe(takeUntilDestroyed(this.destroyRef))
            .subscribe({
              next: () => {
                this.snackBar.open('Reincorporación aprobada', 'Cerrar', { duration: 3000 });
                this.cargarTodas();
              },
              error: (err) => {
                this.snackBar.open(err.error?.detail || 'Error al aprobar', 'Cerrar', { duration: 4000 });
              },
            });
        }
      });
      return;
    }
    this.router.navigate(['/admin/solicitudes-incorporacion', item.id, 'revisar']);
  }

  rechazar(item: SolicitudAdminItem): void {
    const dialogRef = this.dialog.open(ConfirmDialogComponent, {
      data: {
        titulo: 'Rechazar solicitud',
        mensaje: `¿Rechazar la solicitud de ${item.tipo} de ${item.alumno_nombre} ${item.alumno_apellido}?`,
      },
    });
    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        this.service.rechazarSolicitud(item.id, 'Solicitud rechazada por el administrador')
          .pipe(takeUntilDestroyed(this.destroyRef))
          .subscribe({
            next: () => {
              this.snackBar.open('Solicitud rechazada', 'Cerrar', { duration: 3000 });
              this.cargarTodas();
            },
            error: (err) => {
              this.snackBar.open(err.error?.detail || 'Error al rechazar', 'Cerrar', { duration: 4000 });
            },
          });
      }
    });
  }
}
