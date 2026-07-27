import { Component, OnInit, inject, signal, computed, DestroyRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSelectModule } from '@angular/material/select';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { InscripcionEdicionService } from '../../services/inscripcion-edicion.service';
import {
  SolicitudIncorporacionConDetalle,
  PreviewMigracion,
} from '../../../alumno/models/solicitud-incorporacion.model';
import { EdicionBasica } from '../../models/inscripcion-edicion.model';
import { environment } from '../../../../../environments/environment';

@Component({
  selector: 'app-revisar-incorporacion',
  standalone: true,
  imports: [
    CommonModule, FormsModule,
    MatIconModule, MatButtonModule, MatTooltipModule,
    MatProgressSpinnerModule, MatSelectModule, MatFormFieldModule, MatInputModule,
    MatSnackBarModule,
  ],
  templateUrl: './revisar-incorporacion.html',
  styleUrl: './revisar-incorporacion.css',
})
export class RevisarIncorporacionComponent implements OnInit {
  private service = inject(InscripcionEdicionService);
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private snackBar = inject(MatSnackBar);
  private destroyRef = inject(DestroyRef);

  apiUrl = environment.apiUrl;

  solicitud = signal<SolicitudIncorporacionConDetalle | null>(null);
  isLoading = signal(true);
  isPreviewLoading = signal(false);
  isApproving = signal(false);

  ediciones = signal<EdicionBasica[]>([]);
  edicionSeleccionada = signal<number | null>(null);
  modalidadSeleccionada = signal<number | null>(null);
  motivo = signal('');

  preview = signal<PreviewMigracion | null>(null);

  esMigracion = computed(() => this.solicitud()?.es_migracion ?? false);

  ngOnInit(): void {
    const id = Number(this.route.snapshot.paramMap.get('idSolicitud'));
    if (!id) {
      this.router.navigate(['/admin/solicitudes-incorporacion']);
      return;
    }
    this.cargarSolicitud(id);
    this.cargarEdiciones();
  }

  cargarSolicitud(id: number): void {
    this.isLoading.set(true);
    this.service.getSolicitudesIncorporacion()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (items) => {
          const sol = items.find(s => s.id_solicitud === id);
          if (sol) {
            this.solicitud.set(sol);
          } else {
            this.snackBar.open('Solicitud no encontrada', 'Cerrar', { duration: 3000 });
            this.router.navigate(['/admin/solicitudes-incorporacion']);
          }
          this.isLoading.set(false);
        },
        error: () => {
          this.isLoading.set(false);
          this.snackBar.open('Error al cargar solicitud', 'Cerrar', { duration: 3000 });
        },
      });
  }

  cargarEdiciones(): void {
    this.service.getEdicionesDisponibles()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (eds) => this.ediciones.set(eds),
      });
  }

  get nombreCompleto(): string {
    const sol = this.solicitud();
    return sol ? `${sol.alumno_nombre || ''} ${sol.alumno_apellido || ''}`.trim() : '';
  }

  get iniciales(): string {
    const sol = this.solicitud();
    if (!sol) return '?';
    const n = sol.alumno_nombre || '?';
    const a = sol.alumno_apellido || '';
    return (n[0] + a[0]).toUpperCase();
  }

  onEdicionChange(idEdicion: number): void {
    this.edicionSeleccionada.set(idEdicion);
    this.preview.set(null);
    this.modalidadSeleccionada.set(null);

    const ed = this.ediciones().find(e => e.id_programa_version_edicion === idEdicion);
    if (ed && this.solicitud()) {
      this.isPreviewLoading.set(true);
      this.service.previewMigracion(this.solicitud()!.id_solicitud, idEdicion, 1)
        .pipe(takeUntilDestroyed(this.destroyRef))
        .subscribe({
          next: (p) => {
            this.preview.set(p);
            if (p.destino.modalidades.length > 0) {
              this.modalidadSeleccionada.set(p.destino.modalidades[0].id);
            }
            this.isPreviewLoading.set(false);
          },
          error: (err) => {
            this.isPreviewLoading.set(false);
            this.snackBar.open(err.error?.detail || 'Error al cargar preview', 'Cerrar', { duration: 4000 });
          },
        });
    }
  }

  onModalidadChange(idModalidad: number): void {
    this.modalidadSeleccionada.set(idModalidad);
    if (this.edicionSeleccionada() && this.solicitud()) {
      this.isPreviewLoading.set(true);
      this.service.previewMigracion(this.solicitud()!.id_solicitud, this.edicionSeleccionada()!, idModalidad)
        .pipe(takeUntilDestroyed(this.destroyRef))
        .subscribe({
          next: (p) => {
            this.preview.set(p);
            this.isPreviewLoading.set(false);
          },
          error: (err) => {
            this.isPreviewLoading.set(false);
            this.snackBar.open(err.error?.detail || 'Error al cargar preview', 'Cerrar', { duration: 4000 });
          },
        });
    }
  }

  verDocumento(url: string): void {
    window.open(`${this.apiUrl}${url}`, '_blank');
  }

  docsSubidos(): number {
    const sol = this.solicitud();
    return sol?.documentos?.filter(d => !!d.url_documento).length || 0;
  }

  semestreLabel(semestre: number | null): string {
    if (semestre === 1) return '1S';
    if (semestre === 2) return '2S';
    return `${semestre || '?'}`;
  }

  estadoClass(estado: string): string {
    return 'pill-' + estado;
  }

  notaClass(nota: number): string {
    if (nota >= 90) return 'nota-sobresaliente';
    if (nota >= 80) return 'nota-distinguido';
    if (nota >= 70) return 'nota-bueno';
    if (nota >= 60) return 'nota-suficiente';
    return 'nota-insuficiente';
  }

  round(nota: number): number {
    return Math.floor(nota + 0.5);
  }

  formatMonto(monto: number): string {
    return new Intl.NumberFormat('es-BO', { style: 'currency', currency: 'USD' }).format(monto);
  }

  puedeAprobar(): boolean {
    if (this.isApproving()) return false;
    const sol = this.solicitud();
    if (!sol || sol.estado !== 'pendiente') return false;
    if (this.esMigracion()) {
      return !!(this.edicionSeleccionada() && this.modalidadSeleccionada() && this.motivo().trim());
    }
    return true;
  }

  aprobar(): void {
    if (!this.puedeAprobar()) return;
    const sol = this.solicitud()!;
    this.isApproving.set(true);

    const data: any = {};
    if (this.esMigracion()) {
      data.id_programa_version_edicion = this.edicionSeleccionada();
      data.id_modalidad_academica = this.modalidadSeleccionada();
      data.motivo = this.motivo();
    }

    this.service.aprobarSolicitud(sol.id_solicitud, data)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: () => {
          this.isApproving.set(false);
          this.snackBar.open('Solicitud aprobada correctamente', 'Cerrar', { duration: 3000 });
          this.router.navigate(['/admin/solicitudes-incorporacion']);
        },
        error: (err) => {
          this.isApproving.set(false);
          this.snackBar.open(err.error?.detail || 'Error al aprobar', 'Cerrar', { duration: 4000 });
        },
      });
  }

  rechazar(): void {
    const sol = this.solicitud()!;
    this.isApproving.set(true);
    this.service.rechazarSolicitud(sol.id_solicitud, 'Solicitud rechazada por el administrador')
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: () => {
          this.isApproving.set(false);
          this.snackBar.open('Solicitud rechazada', 'Cerrar', { duration: 3000 });
          this.router.navigate(['/admin/solicitudes-incorporacion']);
        },
        error: (err) => {
          this.isApproving.set(false);
          this.snackBar.open(err.error?.detail || 'Error al rechazar', 'Cerrar', { duration: 4000 });
        },
      });
  }

  volver(): void {
    this.router.navigate(['/admin/solicitudes-incorporacion']);
  }
}
