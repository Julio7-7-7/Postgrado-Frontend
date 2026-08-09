import { Component, OnInit, inject, signal, computed, DestroyRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatDividerModule } from '@angular/material/divider';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { DetalleProgramaAlumnoService } from '../../services/detalle-programa-alumno.service';
import { DetalleProgramaAlumno, ControlDocumentacionAlumno, EstadoDetalleAlumno } from '../../models/detalle-programa-alumno.model';
import { Solicitud, DocumentoSolicitud } from '../../models/solicitud-incorporacion.model';
import { SolicitudRequisitoService } from '../../../inscripciones/services/solicitud-requisito.service';
import { SolicitudRequisito } from '../../../inscripciones/models/solicitud-requisito.model';
import { InscripcionEdicionService } from '../../../inscripciones/services/inscripcion-edicion.service';
import { InscripcionTranscript, ModuloTranscript } from '../../../inscripciones/models/inscripcion-edicion.model';
import { PagoService } from '../../../pagos/services/pago.service';
import { TranscriptPagosInscripcion, TransaccionTranscript } from '../../../pagos/models/pago.model';
import { AuthService } from '../../../../core/services/auth.service';
import { clasificarNota } from '../../../../core/utils/nota-utils';
import { ConfirmDialogComponent } from '../../../../shared/components/confirm-dialog/confirm-dialog';
import { environment } from '../../../../../environments/environment';

const ESTADO_HITOS: { estado: EstadoDetalleAlumno; titulo: string; descripcion: string; icono: string }[] = [
  { estado: 'postulante', titulo: 'Postulación', descripcion: 'Tu solicitud fue recibida', icono: 'how_to_reg' },
  { estado: 'inscrito', titulo: 'Admisión', descripcion: 'Documentación aprobada, estás cursando', icono: 'verified' },
  { estado: 'incorporado', titulo: 'Incorporación', descripcion: 'Ingresaste por transferencia', icono: 'swap_horiz' },
  { estado: 'finalizado', titulo: 'Finalización', descripcion: 'Completaste el plan de estudios', icono: 'flag' },
  { estado: 'graduado', titulo: 'Egreso', descripcion: 'Recibiste tu título de postgrado', icono: 'workspaces' },
];

const ESTADO_LABELS: Record<string, string> = {
  postulante: 'Postulante',
  observado: 'Observado',
  inscrito: 'Inscrito',
  incorporado: 'Incorporado',
  finalizado: 'Finalizado',
  graduado: 'Graduado',
  retirado: 'Retirado',
};

const ESTADO_COLORS: Record<string, string> = {
  postulante: '#f59e0b',
  observado: '#f97316',
  inscrito: '#3b82f6',
  incorporado: '#0ea5e9',
  finalizado: '#10b981',
  graduado: '#8b5cf6',
  retirado: '#ef4444',
};

const EDICION_ESTADO_LABELS: Record<string, string> = {
  programado: 'Programada',
  en_curso: 'En curso',
  reprogramado: 'Reprogramada',
  finalizado: 'Finalizada',
};

const EDICION_ESTADO_COLORS: Record<string, string> = {
  programado: '#64748b',
  en_curso: '#10b981',
  reprogramado: '#d97706',
  finalizado: '#6366f1',
};

const CLASIF_LABELS: Record<string, string> = {
  'cal-sobresaliente': 'Sobresaliente',
  'cal-distinguido': 'Distinguido',
  'cal-bueno': 'Bueno',
  'cal-suficiente': 'Suficiente',
  'cal-insuficiente': 'Insuficiente',
  'cal-abandono': 'Abandono',
};

const CLASIF_COLOR: Record<string, string> = {
  'cal-sobresaliente': '#4338ca',
  'cal-distinguido': '#047857',
  'cal-bueno': '#0369a1',
  'cal-suficiente': '#b45309',
  'cal-insuficiente': '#b91c1c',
  'cal-abandono': '#64748b',
};

const TRANSACCION_ESTADO_LABELS: Record<string, string> = {
  confirmado: 'Confirmado',
  pendiente: 'Pendiente',
  anulado: 'Anulado',
};

@Component({
  selector: 'app-inscripcion-detail',
  standalone: true,
  imports: [
    CommonModule,
    MatCardModule, MatButtonModule, MatIconModule,
    MatDividerModule, MatProgressSpinnerModule, MatProgressBarModule,
    MatTooltipModule, MatSnackBarModule, MatDialogModule,
  ],
  templateUrl: './inscripcion-detail.html',
  styleUrl: './inscripcion-detail.css',
})
export class InscripcionDetailComponent implements OnInit {
  private route = inject(ActivatedRoute);
  private detalleService = inject(DetalleProgramaAlumnoService);
  private solicitudRequisitoService = inject(SolicitudRequisitoService);
  private inscripcionEdicionService = inject(InscripcionEdicionService);
  private pagoService = inject(PagoService);
  private auth = inject(AuthService);
  private snackBar = inject(MatSnackBar);
  private dialog = inject(MatDialog);
  private destroyRef = inject(DestroyRef);
  router = inject(Router);

  apiUrl = environment.apiUrl;

  inscripcion = signal<DetalleProgramaAlumno | null>(null);
  solicitud = signal<Solicitud | null>(null);
  solicitudReincorporacion = signal<Solicitud | null>(null);
  cargando = signal(true);
  motivoReincorporacion = signal('');
  enviandoReincorporacion = signal(false);

  uploadingDocId = signal<number | null>(null);
  uploadState = signal<'ninguno' | 'leyendo' | 'subiendo' | 'completado'>('ninguno');
  uploadProgress = signal(0);
  uploadedFileName = signal<string | null>(null);

  pendingFile = signal<File | null>(null);
  pendingDocId = signal<number | null>(null);
  pendingFileName = signal('');
  pendingFileSize = signal('');

  pendingReincFile = signal<File | null>(null);
  pendingReincDocId = signal<number | null>(null);
  pendingReincFileName = signal('');
  pendingReincFileSize = signal('');
  uploadingReincDocId = signal<number | null>(null);
  uploadReincState = signal<'ninguno' | 'leyendo' | 'subiendo' | 'completado'>('ninguno');
  uploadReincProgress = signal(0);

  requisitosReincorporacion = signal<SolicitudRequisito[]>([]);
  reincReqFiles = signal<Record<number, { file: File; name: string; size: string }>>({});
  reincorporacionExpandida = signal(false);

  puedeMigrar = signal<boolean | null>(null);
  showMigracionForm = signal(false);
  motivoMigracion = signal('');
  enviandoMigracion = signal(false);
  solicitudMigracion = signal<Solicitud | null>(null);

  requisitosMigracion = signal<SolicitudRequisito[]>([]);
  migrReqFiles = signal<Record<number, { file: File; name: string; size: string }>>({});

  misNotas = signal<InscripcionTranscript | null>(null);
  misPagos = signal<TranscriptPagosInscripcion | null>(null);
  cargandoNotas = signal(false);
  cargandoPagos = signal(false);
  errorNotas = signal(false);
  errorPagos = signal(false);

  financiero = computed(() => this.misPagos()?.financiero ?? null);
  pctPagos = computed(() => {
    const f = this.financiero();
    if (!f || !f.total_esperado) return 0;
    return Math.min(100, Math.round((f.total_pagado / f.total_esperado) * 100));
  });

  hitos = computed(() => {
    const ins = this.inscripcion();
    if (!ins) return [];
    const base = ins.es_incorporacion
      ? ESTADO_HITOS
      : ESTADO_HITOS.filter(h => h.estado !== 'incorporado');
    const actual = ins.estado === 'observado' ? 'postulante' : ins.estado;
    const currentIdx = base.findIndex(h => h.estado === actual);
    if (ins.estado === 'retirado') {
      return base.map(h => ({ ...h, completado: false, actual: false, pendiente: false }));
    }
    return base.map((hito, idx) => ({
      ...hito,
      completado: currentIdx > idx,
      actual: currentIdx === idx,
      pendiente: currentIdx < idx,
    }));
  });

  esObservado = computed(() => this.inscripcion()?.estado === 'observado');
  esRetirado = computed(() => this.inscripcion()?.estado === 'retirado');

  edicionEstado = computed(() => this.inscripcion()?.programa_version_edicion.estado ?? null);
  edicionActiva = computed(() => {
    const e = this.edicionEstado();
    return e === 'en_curso' || e === 'reprogramado';
  });

  mostrarReincorporacion = computed(() => {
    return this.esRetirado() && this.edicionActiva()
      && !this.tieneSolicitudPendiente() && !this.tieneSolicitudRechazada()
      && !this.tieneSolicitudAprobada();
  });

  rangoFechas = computed(() => {
    const pve = this.inscripcion()?.programa_version_edicion;
    if (!pve?.fecha_inicio && !pve?.fecha_fin) return '—';
    const ini = pve.fecha_inicio ? this.convertirFecha(pve.fecha_inicio) : '?';
    const fin = pve.fecha_fin ? this.convertirFecha(pve.fecha_fin) : 'en curso';
    return `${ini} — ${fin}`;
  });

  textoMigracion = computed(() => {
    if (this.esRetirado()) {
      return 'La edición finalizó y no pudiste completarla. Solicitá migrar a una nueva edición para continuar tu plan de estudios.';
    }
    return 'Esta edición finalizó. Solicitá migrar a una nueva edición para continuar tu plan de estudios.';
  });

  docsObligatorios = computed(() => {
    const ins = this.inscripcion();
    if (!ins) return [];
    return ins.control_documentacion.filter(c => {
      if (!c.obligatorio) return false;
      if (!ins.es_incorporacion && c.requisito?.nombre === 'Carta de Solicitud de Incorporación') return false;
      return true;
    });
  });

  docsExtras = computed(() => {
    const ins = this.inscripcion();
    if (!ins) return [];
    return ins.control_documentacion.filter(c => !c.obligatorio);
  });

  progresoDocs = computed(() => {
    const obligatorios = this.docsObligatorios();
    if (obligatorios.length === 0) return { total: 0, aceptados: 0, pct: 0 };
    const aceptados = obligatorios.filter(c => c.estado === 'aceptado').length;
    return { total: obligatorios.length, aceptados, pct: Math.round((aceptados / obligatorios.length) * 100) };
  });

  cartaDoc = computed((): DocumentoSolicitud | null => {
    const sol = this.solicitud();
    if (!sol || !sol.documentos || sol.documentos.length === 0) return null;
    return sol.documentos[sol.documentos.length - 1];
  });

  ngOnInit(): void {
    const id = Number(this.route.snapshot.paramMap.get('id'));
    if (!id) {
      this.router.navigate(['/alumnos/inscripciones']);
      return;
    }
    this.cargarInscripcion(id);
  }

  private cargarInscripcion(id: number): void {
    this.cargando.set(true);
    this.detalleService.getMiInscripcion(id).pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: (data) => {
        this.inscripcion.set(data);
        if (data.es_incorporacion) {
          this._cargarSolicitud(data.id_programa_version_edicion);
        } else {
          this.cargando.set(false);
          if (data.estado === 'retirado') {
            this._cargarSolicitudReincorporacion();
            this._cargarRequisitosReincorporacion();
          }
        }
        this._cargarPuedeMigrar(data.id_detalle_programa_alumno);
        this._cargarSolicitudMigracion();
        this._cargarRequisitosMigracion();
        this._cargarNotasYPagos(data.id_detalle_programa_alumno);
      },
      error: () => {
        this.cargando.set(false);
        this.snackBar.open('Inscripción no encontrada', 'Cerrar', { duration: 4000 });
        this.router.navigate(['/alumnos/inscripciones']);
      },
    });
  }

  private _cargarSolicitud(idEdicion: number): void {
    this.detalleService.getMisSolicitudes().pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: (solicitudes) => {
        const sol = solicitudes.find(s => s.incorporacion?.id_programa_version_edicion === idEdicion);
        if (sol) {
          this.solicitud.set(sol);
        }
        this.cargando.set(false);
      },
      error: () => { this.cargando.set(false); },
    });
  }

  estadoColor(estado: string): string {
    return ESTADO_COLORS[estado] || '#6b7280';
  }

  estadoLabel(estado: string): string {
    return ESTADO_LABELS[estado] || estado;
  }

  edicionEstadoLabel(estado: string | null): string {
    if (!estado) return '—';
    return EDICION_ESTADO_LABELS[estado] || estado;
  }

  edicionEstadoColor(estado: string | null): string {
    if (!estado) return '#64748b';
    return EDICION_ESTADO_COLORS[estado] || '#64748b';
  }

  convertirFecha(fecha: string | null): string {
    if (!fecha) return '—';
    const d = new Date(fecha + 'T12:00:00');
    return d.toLocaleDateString('es-BO', { day: '2-digit', month: 'long', year: 'numeric' });
  }

  docEstadoIcon(estado: string): string {
    const icons: Record<string, string> = {
      pendiente: 'radio_button_unchecked',
      entregado: 'schedule',
      aceptado: 'check_circle',
      rechazado: 'cancel',
    };
    return icons[estado] || 'help';
  }

  docEstadoColor(estado: string): string {
    const colors: Record<string, string> = {
      pendiente: '#94a3b8',
      entregado: '#f59e0b',
      aceptado: '#10b981',
      rechazado: '#ef4444',
    };
    return colors[estado] || '#94a3b8';
  }

  docEstadoLabel(estado: string): string {
    const labels: Record<string, string> = {
      pendiente: 'Pendiente',
      entregado: 'Entregado',
      aceptado: 'Aceptado',
      rechazado: 'Rechazado',
    };
    return labels[estado] || estado;
  }

  isUploading(docId: number): boolean {
    return this.uploadingDocId() === docId;
  }

  onFileSelected(event: Event, doc: ControlDocumentacionAlumno): void {
    const input = event.target as HTMLInputElement;
    if (!input.files || !input.files[0]) return;

    const file = input.files[0];
    const validTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'application/pdf'];
    if (!validTypes.includes(file.type)) {
      this.snackBar.open('Solo se aceptan imágenes (JPG, PNG, GIF, WebP) o PDF', 'Cerrar', { duration: 4000 });
      input.value = '';
      return;
    }

    if (file.size > 10 * 1024 * 1024) {
      this.snackBar.open('El archivo no puede superar 10 MB', 'Cerrar', { duration: 4000 });
      input.value = '';
      return;
    }

    this.pendingFile.set(file);
    this.pendingDocId.set(doc.id_control_documentacion);
    this.pendingFileName.set(file.name);
    this.pendingFileSize.set(this.formatSize(file.size));
    input.value = '';
  }

  retirar(): void {
    const ins = this.inscripcion();
    if (!ins) return;

    const dialogRef = this.dialog.open(ConfirmDialogComponent, {
      data: {
        titulo: 'Retirarse de la inscripción',
        mensaje: `¿Estás seguro que deseas retirarte de "${ins.programa_version_edicion.programa_version.programa.nombre_programa}"? Esta acción no se puede deshacer.`,
      },
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        this.detalleService.retirar(ins.id_detalle_programa_alumno)
          .pipe(takeUntilDestroyed(this.destroyRef))
          .subscribe({
            next: () => {
              this.snackBar.open('Te has retirado de la inscripción', 'Cerrar', { duration: 3000 });
              this.inscripcion.update(i => i ? { ...i, estado: 'retirado' } : i);
            },
            error: (err) => {
              this.snackBar.open(err.error?.detail || 'Error al retirarse', 'Cerrar', { duration: 4000 });
            },
          });
      }
    });
  }

  puedeRetirarse(): boolean {
    const ins = this.inscripcion();
    if (!ins) return false;
    if (this.edicionEstado() === 'finalizado') return false;
    return !['retirado', 'finalizado', 'graduado'].includes(ins.estado);
  }

  solicitarReincorporacion(): void {
    this.solicitudReincorporacion.set(null);
    this.reincReqFiles.set({});
    this.reincorporacionExpandida.set(true);
  }

  onReincReqFileSelected(event: Event, idRequisito: number): void {
    const input = event.target as HTMLInputElement;
    if (!input.files || !input.files[0]) return;
    const file = input.files[0];
    const validTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'application/pdf'];
    if (!validTypes.includes(file.type)) {
      this.snackBar.open('Solo se aceptan imágenes (JPG, PNG, GIF, WebP) o PDF', 'Cerrar', { duration: 4000 });
      input.value = '';
      return;
    }
    if (file.size > 10 * 1024 * 1024) {
      this.snackBar.open('El archivo no puede superar 10 MB', 'Cerrar', { duration: 4000 });
      input.value = '';
      return;
    }
    this.reincReqFiles.update(files => ({
      ...files,
      [idRequisito]: { file, name: file.name, size: this.formatSize(file.size) },
    }));
    input.value = '';
  }

  quitarReincReqFile(idRequisito: number): void {
    this.reincReqFiles.update(files => {
      const copy = { ...files };
      delete copy[idRequisito];
      return copy;
    });
  }

  reincReqSubidos = computed(() => Object.keys(this.reincReqFiles()).length);

  confirmarReincorporacion(): void {
    const ins = this.inscripcion();
    if (!ins) return;

    this.enviandoReincorporacion.set(true);
    this.detalleService.solicitar({
      id_programa_version_edicion: ins.id_programa_version_edicion,
      motivo: this.motivoReincorporacion() || undefined,
    }).pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: (sol) => {
        this.solicitudReincorporacion.set(sol);
        this.motivoReincorporacion.set('');
        this._subirReincReqFiles(sol);
      },
      error: (err) => {
        this.enviandoReincorporacion.set(false);
        this.snackBar.open(err.error?.detail || 'Error al enviar solicitud', 'Cerrar', { duration: 4000 });
      },
    });
  }

  private _subirReincReqFiles(sol: Solicitud): void {
    const pending = this.reincReqFiles();
    const entries = Object.entries(pending);
    if (entries.length === 0) {
      this.enviandoReincorporacion.set(false);
      this.snackBar.open('Solicitud enviada. Esperá la respuesta del administrador.', 'Cerrar', { duration: 4000 });
      return;
    }

    const uploadNext = (idx: number): void => {
      if (idx >= entries.length) {
        this.reincReqFiles.set({});
        this.enviandoReincorporacion.set(false);
        this.snackBar.open('Solicitud enviada con documentos. Esperá la respuesta del administrador.', 'Cerrar', { duration: 4000 });
        return;
      }
      const [idReqStr, entry] = entries[idx];
      const doc = sol.documentos?.find(d => d.id_requisito === Number(idReqStr));
      if (!doc) {
        uploadNext(idx + 1);
        return;
      }
      const reader = new FileReader();
      reader.onload = () => {
        const base64 = reader.result as string;
        this.detalleService.subirDocumentoSolicitud(sol.id_solicitud, doc.id_solicitud_documento, base64)
          .pipe(takeUntilDestroyed(this.destroyRef))
          .subscribe({
            next: (updatedSol) => {
              this.solicitudReincorporacion.set(updatedSol);
              uploadNext(idx + 1);
            },
            error: () => uploadNext(idx + 1),
          });
      };
      reader.onerror = () => uploadNext(idx + 1);
      reader.readAsDataURL(entry.file);
    };
    uploadNext(0);
  }

  tieneSolicitudPendiente(): boolean {
    return this.solicitudReincorporacion()?.estado === 'pendiente';
  }

  tieneSolicitudRechazada(): boolean {
    return this.solicitudReincorporacion()?.estado === 'rechazado';
  }

  tieneSolicitudAprobada(): boolean {
    return this.solicitudReincorporacion()?.estado === 'aprobado';
  }

  reincDocs = computed((): DocumentoSolicitud[] => {
    return this.solicitudReincorporacion()?.documentos || [];
  });

  reincDocsPendientes = computed(() => {
    return this.reincDocs().filter(d => d.estado === 'pendiente').length;
  });

  private _cargarSolicitudReincorporacion(): void {
    this.detalleService.getMisSolicitudes().pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: (solicitudes) => {
        const ins = this.inscripcion();
        if (ins) {
          const sol = solicitudes.find(
            s => s.tipo_codigo === 'reincorporacion' && s.id_detalle_origen === ins.id_detalle_programa_alumno
          );
          if (sol) this.solicitudReincorporacion.set(sol);
        }
      },
      error: () => {},
    });
  }

  private _cargarRequisitosReincorporacion(): void {
    this.solicitudRequisitoService.getRequisitosConfigurados(3).pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: (reqs) => this.requisitosReincorporacion.set(reqs),
      error: () => {},
    });
  }

  private _cargarPuedeMigrar(idDpa: number): void {
    this.detalleService.puedeMigrar(idDpa).pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: (res) => {
        this.puedeMigrar.set(res.puede);
      },
      error: () => {
        this.puedeMigrar.set(false);
      },
    });
  }

  private _cargarSolicitudMigracion(): void {
    this.detalleService.getMisSolicitudes().pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: (solicitudes) => {
        const sol = solicitudes.find(s => s.tipo_codigo === 'migracion' && s.estado === 'pendiente');
        if (sol) this.solicitudMigracion.set(sol);
      },
      error: () => {},
    });
  }

  private _cargarRequisitosMigracion(): void {
    this.solicitudRequisitoService.getRequisitosConfigurados(2).pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: (reqs) => this.requisitosMigracion.set(reqs),
      error: () => {},
    });
  }

  private _cargarNotasYPagos(idDpa: number): void {
    const user = this.auth.user();
    const idAlumno = user && user.profile_type === 'alumno' ? user.id_profile : null;
    if (!idAlumno) return;

    this.cargandoNotas.set(true);
    this.cargandoPagos.set(true);

    this.inscripcionEdicionService.getTranscript(idAlumno).pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: (resp) => {
        this.misNotas.set(resp.inscripciones.find(i => i.id_detalle_programa_alumno === idDpa) ?? null);
        this.cargandoNotas.set(false);
      },
      error: () => {
        this.cargandoNotas.set(false);
        this.errorNotas.set(true);
      },
    });

    this.pagoService.getTranscriptPagos(idAlumno).pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: (resp) => {
        this.misPagos.set(resp.inscripciones.find(i => i.id_detalle_programa_alumno === idDpa) ?? null);
        this.cargandoPagos.set(false);
      },
      error: () => {
        this.cargandoPagos.set(false);
        this.errorPagos.set(true);
      },
    });
  }

  notaDe(mod: ModuloTranscript): number | null {
    if (mod.nota == null) return null;
    return Math.floor(Number(mod.nota) + 0.5);
  }

  notaClase(nota: number | null): string {
    if (nota == null) return '';
    return clasificarNota(nota);
  }

  notaLabel(nota: number | null): string {
    if (nota == null) return '';
    return CLASIF_LABELS[clasificarNota(nota)] || '';
  }

  aprobado(mod: ModuloTranscript): boolean {
    const n = this.notaDe(mod);
    return n != null && n >= 66;
  }

  aprobadosCount(): number {
    const notas = this.misNotas()?.modulos || [];
    return notas.filter(m => this.aprobado(m)).length;
  }

  promedioRedondo(): number | null {
    const n = this.misNotas()?.promedio;
    if (n == null) return null;
    return Math.floor(Number(n) + 0.5);
  }

  promClasifKey(): string {
    const n = this.promedioRedondo();
    if (n == null) return '';
    return clasificarNota(n);
  }

  promLabel(): string {
    const key = this.promClasifKey();
    return key ? CLASIF_LABELS[key] || '' : '';
  }

  promColor(): string {
    const key = this.promClasifKey();
    return key ? CLASIF_COLOR[key] || '#0891b2' : '#0891b2';
  }

  promRingBg(): string {
    const n = this.promedioRedondo();
    if (n == null) return '';
    return `conic-gradient(${this.promColor()} ${Math.min(100, n) * 3.6}deg, #e2e8f0 0deg)`;
  }

  transaccionEstadoLabel(estado: string): string {
    return TRANSACCION_ESTADO_LABELS[estado] || estado;
  }

  fmt(monto: number | null | undefined): string {
    const n = Number(monto ?? 0);
    return n.toLocaleString('es-BO', { minimumFractionDigits: 0, maximumFractionDigits: 2 });
  }

  fechaPago(iso: string): string {
    const d = new Date(iso + (iso.includes('T') ? '' : 'T12:00:00'));
    return d.toLocaleDateString('es-BO', { day: '2-digit', month: 'short', year: 'numeric' });
  }

  pctBar(esperado: number, pagado: number): number {
    if (!esperado || esperado <= 0) return 0;
    return Math.min(100, Math.round((pagado / esperado) * 100));
  }

  saldoAFavor(): boolean {
    const f = this.misPagos()?.financiero;
    return !!f && f.saldo < 0;
  }

  showMigracionCard = computed(() => {
    return this.puedeMigrar() === true
      && (!this.solicitudMigracion() || this.showMigracionForm());
  });

  showMigracionPendiente = computed(() => {
    return this.solicitudMigracion()?.estado === 'pendiente';
  });

  showMigracionRechazada = computed(() => {
    return this.solicitudMigracion()?.estado === 'rechazado' && !this.showMigracionForm();
  });

  getSolicitudRechazoMotivo(): string | null {
    return this.solicitudMigracion()?.motivo_rechazo || null;
  }

  solicitarMigracion(): void {
    this.migrReqFiles.set({});
    this.showMigracionForm.set(true);
  }

  confirmarMigracion(): void {
    this.enviandoMigracion.set(true);
    this.detalleService.solicitar({ motivo: this.motivoMigracion() || undefined })
      .pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
        next: (sol) => {
          this.solicitudMigracion.set(sol);
          this.motivoMigracion.set('');
          this._subirMigrReqFiles(sol);
        },
        error: (err) => {
          this.enviandoMigracion.set(false);
          this.snackBar.open(err.error?.detail || 'Error al enviar solicitud', 'Cerrar', { duration: 4000 });
        },
      });
  }

  cancelarMigracion(): void {
    this.showMigracionForm.set(false);
    this.motivoMigracion.set('');
    this.migrReqFiles.set({});
  }

  onMigrReqFileSelected(event: Event, idRequisito: number): void {
    const input = event.target as HTMLInputElement;
    if (!input.files || !input.files[0]) return;
    const file = input.files[0];
    const validTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'application/pdf'];
    if (!validTypes.includes(file.type)) {
      this.snackBar.open('Solo se aceptan imágenes (JPG, PNG, GIF, WebP) o PDF', 'Cerrar', { duration: 4000 });
      input.value = '';
      return;
    }
    if (file.size > 10 * 1024 * 1024) {
      this.snackBar.open('El archivo no puede superar 10 MB', 'Cerrar', { duration: 4000 });
      input.value = '';
      return;
    }
    this.migrReqFiles.update(files => ({
      ...files,
      [idRequisito]: { file, name: file.name, size: this.formatSize(file.size) },
    }));
    input.value = '';
  }

  quitarMigrReqFile(idRequisito: number): void {
    this.migrReqFiles.update(files => {
      const copy = { ...files };
      delete copy[idRequisito];
      return copy;
    });
  }

  migrReqSubidos = computed(() => Object.keys(this.migrReqFiles()).length);

  private _subirMigrReqFiles(sol: Solicitud): void {
    const pending = this.migrReqFiles();
    const entries = Object.entries(pending);
    if (entries.length === 0) {
      this.showMigracionForm.set(false);
      this.enviandoMigracion.set(false);
      this.puedeMigrar.set(false);
      this.snackBar.open('Solicitud de migración enviada. Esperá la respuesta del administrador.', 'Cerrar', { duration: 4000 });
      return;
    }

    const uploadNext = (idx: number): void => {
      if (idx >= entries.length) {
        this.migrReqFiles.set({});
        this.showMigracionForm.set(false);
        this.enviandoMigracion.set(false);
        this.puedeMigrar.set(false);
        this.snackBar.open('Solicitud de migración enviada con documentos. Esperá la respuesta del administrador.', 'Cerrar', { duration: 4000 });
        return;
      }
      const [idReqStr, entry] = entries[idx];
      const doc = sol.documentos?.find(d => d.id_requisito === Number(idReqStr));
      if (!doc) {
        uploadNext(idx + 1);
        return;
      }
      const reader = new FileReader();
      reader.onload = () => {
        const base64 = reader.result as string;
        this.detalleService.subirDocumentoSolicitud(sol.id_solicitud, doc.id_solicitud_documento, base64)
          .pipe(takeUntilDestroyed(this.destroyRef))
          .subscribe({
            next: (updatedSol) => {
              this.solicitudMigracion.set(updatedSol);
              uploadNext(idx + 1);
            },
            error: () => uploadNext(idx + 1),
          });
      };
      reader.onerror = () => uploadNext(idx + 1);
      reader.readAsDataURL(entry.file);
    };
    uploadNext(0);
  }

  verRequisito(id: number): void {
    window.open(`/requisitos/${id}`, '_blank');
  }

  irASubirCarta(): void {
    const ins = this.inscripcion();
    if (ins) {
      this.router.navigate(['/alumnos', 'inscribir', ins.id_programa_version_edicion]);
    }
  }

  needsCartaUpload(): boolean {
    const ins = this.inscripcion();
    if (!ins || !ins.es_incorporacion || ins.estado !== 'postulante') return false;
    const sol = this.solicitud();
    if (!sol) return true;
    if (sol.estado === 'rechazado') return false;
    if (!sol.documentos || sol.documentos.length === 0) return true;
    return !sol.documentos.every(d => !!d.url_documento);
  }

  cartaEnRevision(): boolean {
    const doc = this.cartaDoc();
    return !!doc && !!doc.url_documento && doc.estado === 'pendiente';
  }

  cartaAprobada(): boolean {
    const sol = this.solicitud();
    return !!sol && sol.estado === 'aprobado';
  }

  cartaRechazada(): boolean {
    const sol = this.solicitud();
    return !!sol && sol.estado === 'rechazado';
  }

  getDocUrl(url: string | null): string {
    return url ? `${this.apiUrl}${url}` : '#';
  }

  formatSize(bytes: number): string {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  }

  confirmUpload(): void {
    const file = this.pendingFile();
    const docId = this.pendingDocId();
    if (!file || !docId) return;

    this.pendingFile.set(null);
    this.pendingDocId.set(null);
    this.pendingFileName.set('');
    this.pendingFileSize.set('');

    this.uploadingDocId.set(docId);
    this.uploadedFileName.set(file.name);
    this.uploadState.set('leyendo');
    this.uploadProgress.set(0);

    const reader = new FileReader();
    reader.onprogress = (e) => {
      if (e.lengthComputable) {
        this.uploadProgress.set(Math.round((e.loaded / e.total) * 30));
      }
    };
    reader.onload = () => {
      this.uploadProgress.set(30);
      this.uploadState.set('subiendo');
      const base64 = reader.result as string;
      this.detalleService.subirDocumento(docId, base64)
        .pipe(takeUntilDestroyed(this.destroyRef))
        .subscribe({
          next: (updatedDoc) => {
            this.uploadProgress.set(70);
            this.inscripcion.update(ins => {
              if (!ins) return ins;
              return {
                ...ins,
                control_documentacion: ins.control_documentacion.map(c =>
                  c.id_control_documentacion === updatedDoc.id_control_documentacion
                    ? { ...c, ...updatedDoc }
                    : c
                ),
              };
            });
            this.uploadProgress.set(100);
            this.uploadState.set('completado');
            this.snackBar.open('Documento subido correctamente', 'Cerrar', { duration: 3000 });
            setTimeout(() => {
              this.uploadingDocId.set(null);
              this.uploadState.set('ninguno');
              this.uploadProgress.set(0);
              this.uploadedFileName.set(null);
            }, 1200);
          },
          error: (err) => {
            this.uploadingDocId.set(null);
            this.uploadState.set('ninguno');
            this.uploadProgress.set(0);
            this.uploadedFileName.set(null);
            this.snackBar.open(err.error?.detail || 'Error al subir documento', 'Cerrar', { duration: 4000 });
          },
        });
    };
    reader.onerror = () => {
      this.uploadingDocId.set(null);
      this.uploadState.set('ninguno');
      this.uploadProgress.set(0);
      this.uploadedFileName.set(null);
      this.snackBar.open('Error al leer el archivo', 'Cerrar', { duration: 4000 });
    };
    reader.readAsDataURL(file);
  }

  cancelUpload(): void {
    this.pendingFile.set(null);
    this.pendingDocId.set(null);
    this.pendingFileName.set('');
    this.pendingFileSize.set('');
  }

  isReincUploading(docId: number): boolean {
    return this.uploadingReincDocId() === docId;
  }

  onReincFileSelected(event: Event, doc: DocumentoSolicitud): void {
    const input = event.target as HTMLInputElement;
    if (!input.files || !input.files[0]) return;
    const file = input.files[0];
    const validTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'application/pdf'];
    if (!validTypes.includes(file.type)) {
      this.snackBar.open('Solo se aceptan imágenes (JPG, PNG, GIF, WebP) o PDF', 'Cerrar', { duration: 4000 });
      input.value = '';
      return;
    }
    if (file.size > 10 * 1024 * 1024) {
      this.snackBar.open('El archivo no puede superar 10 MB', 'Cerrar', { duration: 4000 });
      input.value = '';
      return;
    }
    this.pendingReincFile.set(file);
    this.pendingReincDocId.set(doc.id_solicitud_documento);
    this.pendingReincFileName.set(file.name);
    this.pendingReincFileSize.set(this.formatSize(file.size));
    input.value = '';
  }

  confirmReincUpload(): void {
    const file = this.pendingReincFile();
    const docId = this.pendingReincDocId();
    const sol = this.solicitudReincorporacion();
    if (!file || !docId || !sol) return;

    this.pendingReincFile.set(null);
    this.pendingReincDocId.set(null);
    this.pendingReincFileName.set('');
    this.pendingReincFileSize.set('');

    this.uploadingReincDocId.set(docId);
    this.uploadReincState.set('leyendo');
    this.uploadReincProgress.set(0);

    const reader = new FileReader();
    reader.onprogress = (e) => {
      if (e.lengthComputable) {
        this.uploadReincProgress.set(Math.round((e.loaded / e.total) * 30));
      }
    };
    reader.onload = () => {
      this.uploadReincProgress.set(30);
      this.uploadReincState.set('subiendo');
      const base64 = reader.result as string;
      this.detalleService.subirDocumentoSolicitud(
        sol.id_solicitud, docId, base64
      ).pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
        next: (updatedSol) => {
          this.uploadReincProgress.set(100);
          this.uploadReincState.set('completado');
          this.solicitudReincorporacion.set(updatedSol);
          this.snackBar.open('Documento subido correctamente', 'Cerrar', { duration: 3000 });
          setTimeout(() => {
            this.uploadingReincDocId.set(null);
            this.uploadReincState.set('ninguno');
            this.uploadReincProgress.set(0);
          }, 1200);
        },
        error: (err) => {
          this.uploadingReincDocId.set(null);
          this.uploadReincState.set('ninguno');
          this.uploadReincProgress.set(0);
          this.snackBar.open(err.error?.detail || 'Error al subir documento', 'Cerrar', { duration: 4000 });
        },
      });
    };
    reader.onerror = () => {
      this.uploadingReincDocId.set(null);
      this.uploadReincState.set('ninguno');
      this.uploadReincProgress.set(0);
      this.snackBar.open('Error al leer el archivo', 'Cerrar', { duration: 4000 });
    };
    reader.readAsDataURL(file);
  }

  cancelReincUpload(): void {
    this.pendingReincFile.set(null);
    this.pendingReincDocId.set(null);
    this.pendingReincFileName.set('');
    this.pendingReincFileSize.set('');
  }
}
