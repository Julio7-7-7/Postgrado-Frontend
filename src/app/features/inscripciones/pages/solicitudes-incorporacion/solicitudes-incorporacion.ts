import { Component, OnInit, inject, signal, computed, DestroyRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSelectModule } from '@angular/material/select';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatBadgeModule } from '@angular/material/badge';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { InscripcionEdicionService } from '../../services/inscripcion-edicion.service';
import { SolicitudIncorporacionConDetalle } from '../../../alumno/models/solicitud-incorporacion.model';
import { ConfirmDialogComponent } from '../../../../shared/components/confirm-dialog/confirm-dialog';
import { environment } from '../../../../../environments/environment';

@Component({
  selector: 'app-solicitudes-incorporacion',
  standalone: true,
  imports: [
    CommonModule, FormsModule,
    MatIconModule, MatButtonModule, MatTooltipModule,
    MatProgressSpinnerModule, MatSelectModule, MatFormFieldModule, MatInputModule,
    MatBadgeModule, MatSnackBarModule, MatDialogModule,
  ],
  template: `
    <div class="page-container">
      <div class="header-section">
        <div class="header-left">
          <button mat-icon-button (click)="volver()" class="back-btn" matTooltip="Volver a inscripciones">
            <mat-icon>arrow_back</mat-icon>
          </button>
          <div>
            <h1><mat-icon>school</mat-icon> Solicitudes de Incorporación</h1>
            <p class="subtitle">Gestionar solicitudes de alumnos para incorporarse a ediciones en curso</p>
          </div>
        </div>
        <div class="header-right">
          <span class="total-count">{{ total() }} solicitud{{ total() !== 1 ? 'es' : '' }}</span>
        </div>
      </div>

      <div class="stats-row">
        <div class="stat-chip pendiente" (click)="onFiltroEstado('pendiente')"
             [class.active]="filtroEstado() === 'pendiente'">
          <mat-icon>schedule</mat-icon>
          <span>{{ countPendientes() }} pendientes</span>
        </div>
        <div class="stat-chip aceptado" (click)="onFiltroEstado('aceptado')"
             [class.active]="filtroEstado() === 'aceptado'">
          <mat-icon>check_circle</mat-icon>
          <span>{{ countAceptados() }} aceptadas</span>
        </div>
        <div class="stat-chip rechazado" (click)="onFiltroEstado('rechazado')"
             [class.active]="filtroEstado() === 'rechazado'">
          <mat-icon>cancel</mat-icon>
          <span>{{ countRechazadas() }} rechazadas</span>
        </div>
        @if (filtroEstado()) {
          <button class="clear-filter" (click)="onFiltroEstado('')">
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
          <p>{{ filtroEstado() ? 'No se encontraron solicitudes con este filtro.' : 'No hay solicitudes de incorporación registradas.' }}</p>
        </div>
      } @else {
        <div class="table-container">
          <table class="fich-table solicitudes-table">
            <thead>
              <tr>
                <th class="col-alumno">Alumno</th>
                <th class="col-programa">Programa / Edición</th>
                <th class="col-documento">Documento</th>
                <th class="col-fecha">Fecha</th>
                <th class="col-estado">Estado</th>
                <th class="col-acciones">Acciones</th>
              </tr>
            </thead>
            <tbody>
              @for (item of items(); track item.id_solicitud) {
                <tr class="table-row" [class.row-pendiente]="item.estado === 'pendiente'">
                  <td class="col-alumno">
                    <div class="alumno-cell">
                      <div class="avatar-sm">{{ iniciales(item) }}</div>
                      <div class="alumno-text">
                        <span class="alumno-nombre">{{ item.alumno_nombre }} {{ item.alumno_apellido }}</span>
                        <span class="alumno-ci">{{ item.alumno_ci || 'Sin CI' }}</span>
                      </div>
                    </div>
                  </td>
                  <td class="col-programa">
                    <div class="programa-cell">
                      <span class="programa-name">{{ item.programa_nombre }}</span>
                      <span class="edicion-label">Ed. {{ item.edicion_numero }} — {{ item.edicion_semestre }}-{{ item.edicion_anio }}</span>
                    </div>
                  </td>
                  <td class="col-documento">
                    <div class="doc-cell">
                      <mat-icon class="doc-icon">description</mat-icon>
                      <span>{{ item.tipo_documento }}</span>
                    </div>
                  </td>
                  <td class="col-fecha">{{ convertirFecha(item.created_at) }}</td>
                  <td class="col-estado">
                    <span class="estado-pill" [class]="estadoClass(item.estado)">{{ item.estado }}</span>
                  </td>
                  <td class="col-acciones">
                    <div class="acciones-cell">
                      @if (item.url_documento) {
                        <a class="action-icon view-icon" [href]="getDocUrl(item.url_documento)" target="_blank"
                           matTooltip="Ver carta de solicitud">
                          <mat-icon>visibility</mat-icon>
                        </a>
                      }
                      @if (item.estado === 'pendiente') {
                        <button mat-icon-button class="action-icon reject-icon"
                                (click)="rechazar(item)" matTooltip="Rechazar solicitud">
                          <mat-icon>close</mat-icon>
                        </button>
                        <button mat-icon-button class="action-icon approve-icon"
                                (click)="aprobar(item)" matTooltip="Aprobar solicitud">
                          <mat-icon>check</mat-icon>
                        </button>
                      }
                      @if (item.estado === 'aceptado') {
                        <span class="approved-badge">
                          <mat-icon>verified</mat-icon>
                          Aprobada
                        </span>
                      }
                      @if (item.estado === 'rechazado') {
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

  apiUrl = environment.apiUrl;
  items = signal<SolicitudIncorporacionConDetalle[]>([]);
  allItems = signal<SolicitudIncorporacionConDetalle[]>([]);
  isLoading = signal(true);
  filtroEstado = signal('');

  total = computed(() => this.items().length);
  countPendientes = computed(() => this.allItems().filter(i => i.estado === 'pendiente').length);
  countAceptados = computed(() => this.allItems().filter(i => i.estado === 'aceptado').length);
  countRechazadas = computed(() => this.allItems().filter(i => i.estado === 'rechazado').length);

  ngOnInit(): void {
    this.cargarTodas();
  }

  cargarTodas(): void {
    this.isLoading.set(true);
    this.service.getSolicitudesIncorporacion()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: data => {
          this.allItems.set(data);
          this.aplicarFiltro();
          this.isLoading.set(false);
        },
        error: () => {
          this.isLoading.set(false);
          this.snackBar.open('Error al cargar solicitudes', 'Cerrar', { duration: 3000 });
        },
      });
  }

  aplicarFiltro(): void {
    const estado = this.filtroEstado();
    if (!estado) {
      this.items.set(this.allItems());
    } else {
      this.items.set(this.allItems().filter(i => i.estado === estado));
    }
  }

  onFiltroEstado(value: string): void {
    this.filtroEstado.set(value);
    this.aplicarFiltro();
  }

  volver(): void {
    this.router.navigate(['/admin/inscripciones']);
  }

  iniciales(item: SolicitudIncorporacionConDetalle): string {
    const n = item.alumno_nombre || '?';
    const a = item.alumno_apellido || '';
    return (n[0] + a[0]).toUpperCase();
  }

  estadoClass(estado: string): string {
    return 'pill-' + estado;
  }

  convertirFecha(fecha: string): string {
    if (!fecha) return '—';
    const d = new Date(fecha);
    return d.toLocaleDateString('es-BO', { day: '2-digit', month: 'short', year: 'numeric' });
  }

  getDocUrl(url: string | null): string {
    return url ? `${this.apiUrl}${url}` : '#';
  }

  aprobar(item: SolicitudIncorporacionConDetalle): void {
    const dialogRef = this.dialog.open(ConfirmDialogComponent, {
      data: {
        titulo: 'Aprobar solicitud',
        mensaje: `¿Aprobar la solicitud de incorporación de ${item.alumno_nombre} ${item.alumno_apellido}? El alumno podrá inscribirse a la edición.`,
      },
    });
    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        this.service.aprobarSolicitud(item.id_solicitud)
          .pipe(takeUntilDestroyed(this.destroyRef))
          .subscribe({
            next: () => {
              this.snackBar.open('Solicitud aprobada', 'Cerrar', { duration: 3000 });
              this.cargarTodas();
            },
            error: (err) => {
              this.snackBar.open(err.error?.detail || 'Error al aprobar', 'Cerrar', { duration: 4000 });
            },
          });
      }
    });
  }

  rechazar(item: SolicitudIncorporacionConDetalle): void {
    const dialogRef = this.dialog.open(ConfirmDialogComponent, {
      data: {
        titulo: 'Rechazar solicitud',
        mensaje: `¿Rechazar la solicitud de incorporación de ${item.alumno_nombre} ${item.alumno_apellido}? El alumno no podrá inscribirse a esta edición.`,
      },
    });
    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        this.service.rechazarSolicitud(item.id_solicitud, 'Solicitud rechazada por el administrador')
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
