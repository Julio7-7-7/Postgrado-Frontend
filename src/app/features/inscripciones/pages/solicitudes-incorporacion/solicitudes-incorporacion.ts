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
import { SolicitudIncorporacionConDetalle, SolicitudReincorporacionConDetalle, SolicitudAdminItem, TipoSolicitud } from '../../../alumno/models/solicitud-incorporacion.model';
import { ConfirmDialogComponent } from '../../../../shared/components/confirm-dialog/confirm-dialog';

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
            <p class="subtitle">Gestionar solicitudes de incorporación y reincorporación de alumnos</p>
          </div>
        </div>
        <div class="header-right">
          <button mat-stroked-button class="config-btn" (click)="irARequisitos()" matTooltip="Configurar documentos requeridos">
            <mat-icon>settings</mat-icon> Documentos
          </button>
          <span class="total-count">{{ total() }} solicitud{{ total() !== 1 ? 'es' : '' }}</span>
        </div>
      </div>

      <div class="stats-row">
        <div class="stat-chip incorporacion" (click)="onFiltroTipo('incorporacion')"
             [class.active]="filtroTipo() === 'incorporacion'">
          <mat-icon>school</mat-icon>
          <span>{{ countIncorporaciones() }} incorporación</span>
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
        <div class="stat-chip aceptado" (click)="onFiltroEstado('aceptado')"
             [class.active]="filtroEstado() === 'aceptado'">
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
          <table class="fich-table solicitudes-table">
            <thead>
              <tr>
                <th class="col-alumno">Alumno</th>
                <th class="col-tipo">Tipo</th>
                <th class="col-programa">Programa / Edición</th>
                <th class="col-documento">Documentos</th>
                <th class="col-fecha">Fecha</th>
                <th class="col-estado">Estado</th>
                <th class="col-acciones">Acciones</th>
              </tr>
            </thead>
            <tbody>
              @for (item of items(); track item.id) {
                <tr class="table-row clickable-row" [class.row-pendiente]="item.estado === 'pendiente'"
                    (click)="abrirDetalle(item)">
                  <td class="col-alumno">
                    <div class="alumno-cell">
                      <div class="avatar-sm" [class.avatar-inc]="item.tipo === 'incorporacion'"
                           [class.avatar-reinc]="item.tipo === 'reincorporacion'">
                        {{ iniciales(item) }}
                      </div>
                      <div class="alumno-text">
                        <span class="alumno-nombre">{{ item.alumno_nombre }} {{ item.alumno_apellido }}</span>
                        <span class="alumno-ci">{{ item.alumno_ci || 'Sin CI' }}</span>
                      </div>
                    </div>
                  </td>
                  <td class="col-tipo">
                    <span class="tipo-chip" [class]="'tipo-' + item.tipo">
                      @if (item.tipo === 'incorporacion') {
                        <mat-icon>school</mat-icon>
                        Incorporación
                      } @else {
                        <mat-icon>restart_alt</mat-icon>
                        Reincorporación
                      }
                    </span>
                  </td>
                  <td class="col-programa">
                    <div class="programa-cell">
                      <span class="programa-name">{{ item.programa_nombre }}</span>
                      <span class="edicion-label">Ed. {{ item.edicion_numero }} — {{ item.edicion_semestre }}-{{ item.edicion_anio }}</span>
                    </div>
                  </td>
                  <td class="col-documento">
                    <div class="doc-cell">
                      @if (item.tipo === 'incorporacion' && item.documentos && item.documentos.length > 0) {
                        @if (docsSubidos(item) > 0) {
                          <span class="doc-count uploaded">{{ docsSubidos(item) }}/{{ item.documentos!.length }}</span>
                        } @else {
                          <span class="doc-count pending">{{ item.documentos!.length }} pendiente{{ item.documentos!.length !== 1 ? 's' : '' }}</span>
                        }
                      } @else if (item.tipo === 'reincorporacion') {
                        @if (item.motivo) {
                          <span class="motivo-pill" [matTooltip]="item.motivo">Con motivo</span>
                        } @else {
                          <span class="no-docs">Sin motivo</span>
                        }
                      } @else {
                        <span class="no-docs">Sin docs</span>
                      }
                    </div>
                  </td>
                  <td class="col-fecha">{{ convertirFecha(item.created_at) }}</td>
                  <td class="col-estado">
                    <span class="estado-pill" [class]="estadoClass(item.estado)">{{ item.estado }}</span>
                  </td>
                  <td class="col-acciones">
                    <div class="acciones-cell">
                      @if (item.estado === 'pendiente') {
                        <button mat-icon-button class="action-icon reject-icon"
                                (click)="rechazar(item); $event.stopPropagation()" matTooltip="Rechazar solicitud">
                          <mat-icon>close</mat-icon>
                        </button>
                        <button mat-icon-button class="action-icon approve-icon"
                                (click)="aprobar(item); $event.stopPropagation()"
                                [matTooltip]="item.tipo === 'incorporacion' ? 'Revisar y aprobar' : 'Aprobar — restaurar a inscrito'">
                          <mat-icon>check</mat-icon>
                        </button>
                      }
                      @if (item.estado === 'aceptado' || item.estado === 'aprobada') {
                        <span class="approved-badge">
                          <mat-icon>verified</mat-icon>
                          Aprobada
                        </span>
                      }
                      @if (item.estado === 'rechazado' || item.estado === 'rechazada') {
                        <span class="rejected-badge">
                          <mat-icon>block</mat-icon>
                          Rechazada
                        </span>
                      }
                    </div>
                  </td>
                </tr>
              }
            </tbody>
          </table>
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

  total = computed(() => this.items().length);
  countIncorporaciones = computed(() => this.allItems().filter(i => i.tipo === 'incorporacion').length);
  countReincorporaciones = computed(() => this.allItems().filter(i => i.tipo === 'reincorporacion').length);
  countPendientes = computed(() => this.allItems().filter(i => i.estado === 'pendiente').length);
  countAprobados = computed(() => this.allItems().filter(i => i.estado === 'aceptado' || i.estado === 'aprobada').length);
  countRechazadas = computed(() => this.allItems().filter(i => i.estado === 'rechazado' || i.estado === 'rechazada').length);

  ngOnInit(): void {
    this.cargarTodas();
  }

  cargarTodas(): void {
    this.isLoading.set(true);
    let loaded = 0;
    const all: SolicitudAdminItem[] = [];
    const done = () => {
      loaded++;
      if (loaded < 2) return;
      all.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
      this.allItems.set(all);
      this.aplicarFiltros();
      this.isLoading.set(false);
    };

    this.service.getSolicitudesIncorporacion()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: data => {
          for (const s of data) {
            all.push(this.mapIncorporacion(s));
          }
          done();
        },
        error: () => done(),
      });

    this.service.getSolicitudesReincorporacion()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: data => {
          for (const s of data) {
            all.push(this.mapReincorporacion(s));
          }
          done();
        },
        error: () => done(),
      });
  }

  mapIncorporacion(s: SolicitudIncorporacionConDetalle): SolicitudAdminItem {
    return {
      tipo: 'incorporacion',
      id: s.id_solicitud,
      estado: s.estado,
      created_at: s.created_at,
      id_alumno: s.id_alumno,
      alumno_nombre: s.alumno_nombre,
      alumno_apellido: s.alumno_apellido,
      alumno_ci: s.alumno_ci,
      id_detalle_programa_alumno: s.id_detalle_programa_alumno,
      dpa_estado: s.dpa_estado,
      edicion_numero: s.edicion_numero,
      edicion_anio: s.edicion_anio,
      edicion_semestre: s.edicion_semestre,
      programa_nombre: s.programa_nombre,
      documentos: s.documentos,
      es_migracion: s.es_migracion,
    };
  }

  mapReincorporacion(s: SolicitudReincorporacionConDetalle): SolicitudAdminItem {
    return {
      tipo: 'reincorporacion',
      id: s.id_solicitud_reincorporacion,
      estado: s.estado,
      created_at: s.created_at,
      id_alumno: s.id_alumno,
      alumno_nombre: s.alumno_nombre,
      alumno_apellido: s.alumno_apellido,
      alumno_ci: s.alumno_ci,
      id_detalle_programa_alumno: s.id_detalle_programa_alumno,
      dpa_estado: s.dpa_estado,
      edicion_numero: s.edicion_numero,
      edicion_anio: s.edicion_anio,
      edicion_semestre: s.edicion_semestre,
      programa_nombre: s.programa_nombre,
      motivo: s.motivo,
      motivo_rechazo: s.motivo_rechazo,
    };
  }

  aplicarFiltros(): void {
    let result = this.allItems();
    const tipo = this.filtroTipo();
    const estado = this.filtroEstado();
    if (tipo) result = result.filter(i => i.tipo === tipo);
    if (estado) {
      if (estado === 'aceptado') {
        result = result.filter(i => i.estado === 'aceptado' || i.estado === 'aprobada');
      } else if (estado === 'rechazado') {
        result = result.filter(i => i.estado === 'rechazado' || i.estado === 'rechazada');
      } else {
        result = result.filter(i => i.estado === estado);
      }
    }
    this.items.set(result);
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

  volver(): void {
    this.router.navigate(['/admin/inscripciones']);
  }

  irARequisitos(): void {
    this.router.navigate(['/admin/requisitos-incorporacion']);
  }

  iniciales(item: SolicitudAdminItem): string {
    const n = item.alumno_nombre || '?';
    const a = item.alumno_apellido || '';
    return (n[0] + a[0]).toUpperCase();
  }

  estadoClass(estado: string): string {
    if (estado === 'aprobada') return 'pill-aceptado';
    if (estado === 'rechazada') return 'pill-rechazado';
    return 'pill-' + estado;
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
    if (item.tipo === 'incorporacion') {
      this.router.navigate(['/admin/solicitudes-incorporacion', item.id, 'revisar']);
    }
  }

  aprobar(item: SolicitudAdminItem): void {
    if (item.tipo === 'incorporacion') {
      this.router.navigate(['/admin/solicitudes-incorporacion', item.id, 'revisar']);
      return;
    }

    const dialogRef = this.dialog.open(ConfirmDialogComponent, {
      data: {
        titulo: 'Aprobar reincorporación',
        mensaje: `¿Aprobar la reincorporación de ${item.alumno_nombre} ${item.alumno_apellido}? El alumno volverá al estado "Inscrito" en la edición.`,
      },
    });
    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        this.service.aprobarReincorporacion(item.id)
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
  }

  rechazar(item: SolicitudAdminItem): void {
    if (item.tipo === 'incorporacion') {
      const dialogRef = this.dialog.open(ConfirmDialogComponent, {
        data: {
          titulo: 'Rechazar solicitud',
          mensaje: `¿Rechazar la solicitud de incorporación de ${item.alumno_nombre} ${item.alumno_apellido}?`,
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
      return;
    }

    const dialogRef = this.dialog.open(ConfirmDialogComponent, {
      data: {
        titulo: 'Rechazar reincorporación',
        mensaje: `¿Rechazar la solicitud de reincorporación de ${item.alumno_nombre} ${item.alumno_apellido}? El alumno permanecerá en estado "Retirado".`,
      },
    });
    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        this.service.rechazarReincorporacion(item.id, 'Solicitud rechazada por el administrador')
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
