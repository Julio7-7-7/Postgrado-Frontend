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
import { ConfirmDialogComponent } from '../../../../shared/components/confirm-dialog/confirm-dialog';
import { environment } from '../../../../../environments/environment';

const ESTADO_ORDEN: EstadoDetalleAlumno[] = [
  'postulante', 'observado', 'inscrito', 'incorporado', 'finalizado', 'graduado'
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
  finalizado: '#6b7280',
  graduado: '#8b5cf6',
  retirado: '#ef4444',
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
  private snackBar = inject(MatSnackBar);
  private dialog = inject(MatDialog);
  private destroyRef = inject(DestroyRef);
  router = inject(Router);

  apiUrl = environment.apiUrl;

  inscripcion = signal<DetalleProgramaAlumno | null>(null);
  solicitud = signal<Solicitud | null>(null);
  solicitudReincorporacion = signal<Solicitud | null>(null);
  cargando = signal(true);
  showMotivoForm = signal(false);
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

  puedeMigrar = signal<boolean | null>(null);
  motivoMigrar = signal<string | null>(null);
  showMigracionForm = signal(false);
  motivoMigracion = signal('');
  enviandoMigracion = signal(false);
  solicitudMigracion = signal<Solicitud | null>(null);

  stepperSteps = computed(() => {
    const ins = this.inscripcion();
    if (!ins) return [];
    const currentIdx = ESTADO_ORDEN.indexOf(ins.estado);
    return ESTADO_ORDEN.map((estado, idx) => ({
      estado,
      label: ESTADO_LABELS[estado],
      color: ESTADO_COLORS[estado],
      completado: currentIdx > idx && ins.estado !== 'retirado',
      actual: ins.estado === estado,
      pendiente: currentIdx < idx && ins.estado !== 'retirado',
    }));
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
          }
        }
        this._cargarPuedeMigrar(data.id_detalle_programa_alumno);
        this._cargarSolicitudMigracion();
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
    return !['retirado', 'finalizado', 'graduado'].includes(ins.estado);
  }

  solicitarReincorporacion(): void {
    const ins = this.inscripcion();
    if (!ins) return;
    this.showMotivoForm.set(true);
  }

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
        this.showMotivoForm.set(false);
        this.motivoReincorporacion.set('');
        this.enviandoReincorporacion.set(false);
        this.snackBar.open('Solicitud enviada. Esperá la respuesta del administrador.', 'Cerrar', { duration: 4000 });
      },
      error: (err) => {
        this.enviandoReincorporacion.set(false);
        this.snackBar.open(err.error?.detail || 'Error al enviar solicitud', 'Cerrar', { duration: 4000 });
      },
    });
  }

  cancelarReincorporacion(): void {
    this.showMotivoForm.set(false);
    this.motivoReincorporacion.set('');
  }

  tieneSolicitudPendiente(): boolean {
    return this.solicitudReincorporacion()?.estado === 'pendiente';
  }

  tieneSolicitudRechazada(): boolean {
    return this.solicitudReincorporacion()?.estado === 'rechazado';
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

  private _cargarPuedeMigrar(idDpa: number): void {
    this.detalleService.puedeMigrar(idDpa).pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: (res) => {
        this.puedeMigrar.set(res.puede);
        this.motivoMigrar.set(res.motivo);
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

  showMigracionCard = computed(() => {
    return this.puedeMigrar() === true && !this.solicitudMigracion();
  });

  showMigracionPendiente = computed(() => {
    return this.solicitudMigracion()?.estado === 'pendiente';
  });

  showMigracionRechazada = computed(() => {
    return this.solicitudMigracion()?.estado === 'rechazado';
  });

  getSolicitudRechazoMotivo(): string | null {
    return this.solicitudMigracion()?.motivo_rechazo || null;
  }

  solicitarMigracion(): void {
    this.showMigracionForm.set(true);
  }

  confirmarMigracion(): void {
    this.enviandoMigracion.set(true);
    this.detalleService.solicitar({ motivo: this.motivoMigracion() || undefined })
      .pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
        next: (sol) => {
          this.solicitudMigracion.set(sol);
          this.showMigracionForm.set(false);
          this.motivoMigracion.set('');
          this.enviandoMigracion.set(false);
          this.puedeMigrar.set(false);
          this.snackBar.open('Solicitud de migración enviada. Esperá la respuesta del administrador.', 'Cerrar', { duration: 4000 });
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
