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
import { MatRadioModule } from '@angular/material/radio';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { InscripcionEdicionService } from '../../services/inscripcion-edicion.service';
import { DetalleService } from '../../../detalle-programa-modulo/services/detalle.service';
import {
  SolicitudConDetalle,
  PreviewMigracion,
  DestinoRecomendado,
  ModuloPendiente,
} from '../../../alumno/models/solicitud-incorporacion.model';
import { EdicionBasica } from '../../models/inscripcion-edicion.model';
import { DetalleProgramaModulo } from '../../../detalle-programa-modulo/models/detalle.model';
import { HistorialMovimiento, InscripcionBasica } from '../../../notas/models/nota.model';
import { environment } from '../../../../../environments/environment';
import { aDate } from '../../../../core/utils/date-utils';

interface OpcionModulo {
  mod: DetalleProgramaModulo;
  etiqueta: string;
  recomendado: boolean;
  pct: number | null;
  aviso?: string;
}

@Component({
  selector: 'app-revisar-incorporacion',
  standalone: true,
  imports: [
    CommonModule, FormsModule,
    MatIconModule, MatButtonModule, MatTooltipModule,
    MatProgressSpinnerModule, MatSelectModule, MatFormFieldModule, MatInputModule,
    MatRadioModule, MatSnackBarModule,
  ],
  templateUrl: './revisar-incorporacion.html',
  styleUrl: './revisar-incorporacion.css',
})
export class RevisarIncorporacionComponent implements OnInit {
  private service = inject(InscripcionEdicionService);
  private detalleService = inject(DetalleService);
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private snackBar = inject(MatSnackBar);
  private destroyRef = inject(DestroyRef);

  apiUrl = environment.apiUrl;

  solicitud = signal<SolicitudConDetalle | null>(null);
  isLoading = signal(true);
  isPreviewLoading = signal(false);
  isApproving = signal(false);

  ediciones = signal<EdicionBasica[]>([]);
  edicionSeleccionada = signal<number | null>(null);
  motivo = signal('');

  destinos = signal<DestinoRecomendado[]>([]);
  pendientesDestino = signal<ModuloPendiente[]>([]);
  destinosLoading = signal(false);

  modulosEdicion = signal<DetalleProgramaModulo[]>([]);
  idModuloInicio = signal<number | null>(null);

  opcionesModulo = computed<OpcionModulo[]>(() => {
    const mods = this.modulosEdicion();
    if (!mods.length) return [];

    const enCurso = mods.find(m => m.estado === 'en_curso');
    if (enCurso) {
      const pct = this.progresoModulo(enCurso);
      const siguiente = mods.find(m => m.orden > enCurso.orden) || null;
      const irAlSiguiente = pct !== null && pct >= 50 && !!siguiente;
      const opciones: OpcionModulo[] = [{
        mod: enCurso,
        etiqueta: 'Módulo en curso',
        recomendado: !irAlSiguiente,
        pct,
      }];
      if (siguiente) {
        opciones.push({
          mod: siguiente,
          etiqueta: 'Siguiente módulo',
          recomendado: irAlSiguiente,
          pct: null,
        });
      }
      return opciones;
    }

    const siguiente = mods.find(m => m.estado !== 'finalizado');
    if (!siguiente) return [];

    const sinFecha = !siguiente.fecha_inicio;
    return [{
      mod: siguiente,
      etiqueta: 'Próximo módulo',
      recomendado: true,
      pct: null,
      aviso: sinFecha
        ? 'Este módulo aún no tiene fecha de inicio asignada. El alumno iniciará cuando se defina.'
        : undefined,
    }];
  });

  preview = signal<PreviewMigracion | null>(null);

  historial = signal<HistorialMovimiento[]>([]);
  inscripcionesHistorial = signal<InscripcionBasica[]>([]);
  isLoadingHistorial = signal(false);

  esMigracion = computed(() => this.solicitud()?.tipo_codigo === 'migracion');
  esReincorporacion = computed(() => this.solicitud()?.tipo_codigo === 'reincorporacion');
  esPendiente = computed(() => this.solicitud()?.estado === 'pendiente');

  moduloAsignado = computed<DetalleProgramaModulo | null>(() => {
    const sol = this.solicitud();
    if (!sol) return null;
    if (sol.dpa_id_modulo_inicio) {
      return this.modulosEdicion().find(m => m.id_detalle_programa_modulo === sol.dpa_id_modulo_inicio) || null;
    }
    if (sol.dpa_modulo_inicio) {
      return this.modulosEdicion().find(m => m.orden === sol.dpa_modulo_inicio) || null;
    }
    return null;
  });

  edicionDestinoLabel = computed(() => {
    const sol = this.solicitud();
    if (!sol) return '—';
    const destino = sol.migracion?.id_edicion_destino;
    if (destino) {
      const ed = this.ediciones().find(e => e.id_programa_version_edicion === destino);
      if (ed) return `${ed.programa_nombre} — Ed. ${ed.edicion}`;
    }
    if (sol.edicion_numero) {
      return `${sol.programa_nombre || ''} — Ed. ${sol.edicion_numero}`;
    }
    return '—';
  });

  ngOnInit(): void {
    const id = Number(this.route.snapshot.paramMap.get('idSolicitud'));
    if (!id) {
      this.router.navigate(['/solicitudes']);
      return;
    }
    this.cargarSolicitud(id);
    this.cargarEdiciones();
  }

  cargarSolicitud(id: number): void {
    this.isLoading.set(true);
    this.service.getSolicitudes()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (items) => {
          const sol = items.find(s => s.id_solicitud === id);
          if (sol) {
            this.solicitud.set(sol);
            if (sol.incorporacion?.id_programa_version_edicion) {
              this.cargarModulos(sol.incorporacion.id_programa_version_edicion);
            }
            if (sol.id_alumno) {
              this.cargarHistorial(sol.id_alumno);
            }
            this.cargarDestinosRecomendados();
          } else {
            this.snackBar.open('Solicitud no encontrada', 'Cerrar', { duration: 3000 });
            this.router.navigate(['/solicitudes']);
          }
          this.isLoading.set(false);
        },
        error: () => {
          this.isLoading.set(false);
          this.snackBar.open('Error al cargar solicitud', 'Cerrar', { duration: 3000 });
        },
      });
  }

  cargarHistorial(idAlumno: number): void {
    this.isLoadingHistorial.set(true);
    this.service.getHistorialMovimientos(idAlumno)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (h) => {
          this.historial.set(h.movimientos);
          this.inscripcionesHistorial.set(h.inscripciones);
          this.isLoadingHistorial.set(false);
        },
        error: () => {
          this.isLoadingHistorial.set(false);
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

  cargarDestinosRecomendados(): void {
    const sol = this.solicitud();
    if (!sol || !this.esMigracion() || !this.esPendiente()) return;

    this.destinosLoading.set(true);
    this.service.destinosRecomendados(sol.id_solicitud)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (res) => {
          this.destinos.set(res.destinos);
          this.pendientesDestino.set(res.pendientes);
          this.destinosLoading.set(false);

          const recomendado = res.destinos.find(d => d.recomendado);
          if (recomendado && !this.edicionSeleccionada()) {
            this.onEdicionChange(recomendado.id_programa_version_edicion);
          }
        },
        error: () => {
          this.destinosLoading.set(false);
          this.destinos.set([]);
          this.pendientesDestino.set([]);
        },
      });
  }

  destinoTitulo(d: DestinoRecomendado): string {
    const prog = this.ediciones().find(e => e.id_programa_version_edicion === d.id_programa_version_edicion)?.programa_nombre;
    return `${prog || 'Programa'} — Ed. ${d.edicion ?? '?'}`;
  }

  destinoPeriodo(d: DestinoRecomendado): string {
    return `${this.semestreLabel(d.semestre)}-${d.anio ?? '?'}`;
  }

  destinoCupo(d: DestinoRecomendado): string {
    if (d.cupo_disponible === null || d.cupo_disponible === undefined) return '—';
    return `${d.cupo_disponible} cupo${d.cupo_disponible === 1 ? '' : 's'} libre${d.cupo_disponible === 1 ? '' : 's'}`;
  }

  destinoNoAprovechables(d: DestinoRecomendado): string[] {
    return d.coincidencias.filter(c => !c.disponible).map(c => c.nombre_modulo);
  }

  moduloInicioLabel(moduloInicio: number | null): string {
    if (moduloInicio === null || moduloInicio === undefined) return '—';
    return `Módulo ${moduloInicio}`;
  }

  cargarModulos(edicionId: number): void {
    this.detalleService.getAll(edicionId)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (modulos) => {
          const sorted = [...modulos].sort((a, b) => a.orden - b.orden);
          this.modulosEdicion.set(sorted);
          if (sorted.length > 0 && !this.idModuloInicio()) {
            const recomendado = this.opcionesModulo().find(o => o.recomendado);
            this.idModuloInicio.set(
              recomendado ? recomendado.mod.id_detalle_programa_modulo : sorted[0].id_detalle_programa_modulo
            );
          }
        },
      });
  }

  progresoModulo(mod: DetalleProgramaModulo): number | null {
    const ini = aDate(mod.fecha_inicio);
    const fin = aDate(mod.fecha_fin);
    if (!ini || !fin || fin.getTime() <= ini.getTime()) return null;
    const pct = ((Date.now() - ini.getTime()) / (fin.getTime() - ini.getTime())) * 100;
    return Math.round(Math.min(100, Math.max(0, pct)));
  }

  fechaModulo(fecha: string | null): string {
    if (!fecha) return '—';
    const d = aDate(fecha);
    return d ? d.toLocaleDateString('es-BO', { day: '2-digit', month: 'short', year: 'numeric' }) : '—';
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
    this.idModuloInicio.set(null);
    this.cargarModulos(idEdicion);

    const ed = this.ediciones().find(e => e.id_programa_version_edicion === idEdicion);
    if (ed && this.solicitud()) {
      this.isPreviewLoading.set(true);
      this.service.previewMigracion(this.solicitud()!.id_solicitud, idEdicion)
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

  movimientoLabel(tipo: string): string {
    switch (tipo) {
      case 'reincorporacion': return 'Reincorporación';
      case 'incorporacion': return 'Incorporación';
      case 'migracion': return 'Migración';
      case 'transferencia': return 'Transferencia';
      case 'retiro': return 'Retiro';
      default: return tipo;
    }
  }

  formatFecha(fecha: string): string {
    if (!fecha) return '—';
    return new Date(fecha).toLocaleDateString('es-BO', { day: '2-digit', month: 'short', year: 'numeric' });
  }

  esUltimoMovimiento(mov: HistorialMovimiento): boolean {
    const movs = this.historial();
    return movs.length > 0 && mov.id_historial === movs[movs.length - 1].id_historial;
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
      return !!(this.edicionSeleccionada() && this.motivo().trim());
    }
    return true;
  }

  aprobar(): void {
    if (!this.puedeAprobar()) return;
    const sol = this.solicitud()!;
    this.isApproving.set(true);

    const modulos = this.modulosEdicion();
    const data: any = { id_modulo_inicio: modulos.length > 0 ? this.idModuloInicio() : null };
    if (this.esMigracion()) {
      data.id_programa_version_edicion = this.edicionSeleccionada();
      data.motivo = this.motivo();
    }

    this.service.aprobarSolicitud(sol.id_solicitud, data)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: () => {
          this.isApproving.set(false);
          this.snackBar.open('Solicitud aprobada correctamente', 'Cerrar', { duration: 3000 });
          this.router.navigate(['/solicitudes']);
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
          this.router.navigate(['/solicitudes']);
        },
        error: (err) => {
          this.isApproving.set(false);
          this.snackBar.open(err.error?.detail || 'Error al rechazar', 'Cerrar', { duration: 4000 });
        },
      });
  }

  volver(): void {
    this.router.navigate(['/solicitudes']);
  }
}
