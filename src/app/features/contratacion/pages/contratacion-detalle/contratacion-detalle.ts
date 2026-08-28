import { Component, OnInit, signal, computed, inject, DestroyRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';

import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatCardModule } from '@angular/material/card';
import { MatDividerModule } from '@angular/material/divider';
import { MatSnackBarModule, MatSnackBar } from '@angular/material/snack-bar';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatDialogModule, MatDialog } from '@angular/material/dialog';
import { NavigationBackService } from '../../../../core/navigation/navigation-back.service';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatProgressBarModule } from '@angular/material/progress-bar';

import { ConfirmDialogComponent } from '../../../../shared/components/confirm-dialog/confirm-dialog';
import { UploadBoxComponent } from '../../../../shared/components/upload-box/upload-box';
import { ContratacionService } from '../../services/contratacion.service';
import { DocContratacionService } from '../../services/doc-contratacion.service';
import { DetalleService } from '../../../detalle-programa-modulo/services/detalle.service';
import { ContratacionDocente } from '../../models/contratacion.model';
import { ControlDocContratacion, EtapaContratacion } from '../../models/etapa.model';
import { EtapaService } from '../../services/etapa.service';
import { DetalleProgramaModulo } from '../../../detalle-programa-modulo/models/detalle.model';

@Component({
  selector: 'app-contratacion-detalle',
  standalone: true,
  imports: [
    CommonModule,
    MatButtonModule, MatIconModule, MatCardModule, MatDividerModule,
    MatSnackBarModule, MatProgressSpinnerModule, MatDialogModule, MatTooltipModule,
    MatProgressBarModule, UploadBoxComponent,
  ],
  templateUrl: './contratacion-detalle.html',
  styleUrl: './contratacion-detalle.css',
})
export class ContratacionDetalleComponent implements OnInit {
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private service = inject(ContratacionService);
  private docService = inject(DocContratacionService);
  private detalleService = inject(DetalleService);
  private etapaService = inject(EtapaService);
  private dialog = inject(MatDialog);
  private snackbar = inject(MatSnackBar);
  private destroyRef = inject(DestroyRef);
  private navBack = inject(NavigationBackService);

  contratacion = signal<ContratacionDocente | null>(null);
  documentos = signal<ControlDocContratacion[]>([]);
  detalle = signal<DetalleProgramaModulo | null>(null);
  etapas = signal<EtapaContratacion[]>([]);
  loading = signal(true);
  subiendo = signal<'ninguno' | 'file-read' | 'subiendo' | 'completado'>('ninguno');
  pendingFile = signal<File | null>(null);
  pendingFileName = signal('');
  pendingFileSize = signal('');
  pendingDocId = signal<number | null>(null);
  error = signal<string | null>(null);
  etapaExpandida = signal<number | null>(null);
  montoEditando = signal(false);
  montoInput = signal<number | null>(null);
  inicializandoDocs = signal(false);
  avanzando = signal(false);

  documentosPorEtapa = computed(() => {
    const map = new Map<number, ControlDocContratacion[]>();
    for (const doc of this.documentos()) {
      const arr = map.get(doc.id_etapa) ?? [];
      arr.push(doc);
      map.set(doc.id_etapa, arr);
    }
    return map;
  });

  etapasConEstado = computed(() => {
    const etapas = this.etapas();
    const docsPorEtapa = this.documentosPorEtapa();
    const etapaActual = this.contratacion()?.id_etapa_actual;

    return etapas.map(etapa => {
      const docs = docsPorEtapa.get(etapa.id_etapa) ?? [];
      const completados = docs.filter(d => d.estado === 'aceptado' || d.url_documento).length;
      const total = docs.length;
      const esActual = etapaActual === etapa.id_etapa;
      const estaCompletada = completados === total && total > 0;
      const estaBloqueada = etapaActual != null && etapa.orden > (etapas.find(e => e.id_etapa === etapaActual)?.orden ?? 0);

      return { etapa, docs, completados, total, esActual, estaCompletada, estaBloqueada };
    });
  });

  contratacionId = 0;

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('id');
    if (!id) {
      this.router.navigate(['/contrataciones']);
      return;
    }
    this.contratacionId = +id;
    this.cargarDatos();
  }

  cargarDatos(): void {
    this.loading.set(true);
    this.error.set(null);

    this.service.getById(this.contratacionId).pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: (c) => {
        this.contratacion.set(c);
        this.cargarDetalle(c.id_detalle_modulo);
        this.cargarEtapas(c.id_programa);
        this.cargarDocumentos();
      },
      error: () => {
        this.error.set('No se pudo cargar la contratación');
        this.loading.set(false);
      },
    });
  }

  private cargarDetalle(id: number): void {
    this.detalleService.getById(id).pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: (d) => {
        this.detalle.set(d);
        this.loading.set(false);
      },
      error: () => {
        this.loading.set(false);
      },
    });
  }

  private cargarEtapas(tipoProgramaId: number): void {
    this.etapaService.getAll(tipoProgramaId).pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: (etapas: EtapaContratacion[]) => {
        this.etapas.set(etapas.sort((a: EtapaContratacion, b: EtapaContratacion) => a.orden - b.orden));
        if (etapas.length > 0 && this.etapaExpandida() === null) {
          this.etapaExpandida.set(etapas[0].id_etapa);
        }
      },
    });
  }

  private cargarDocumentos(): void {
    this.docService.getAll(this.contratacionId).pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: (docs: ControlDocContratacion[]) => {
        this.documentos.set(docs);
        if (docs.length > 0) {
          const etapaIds = [...new Set(docs.map(d => d.id_etapa))];
          this.etapaExpandida.set(etapaIds[0] ?? null);
        }
      },
    });
  }

  inicializarDocumentos(): void {
    this.inicializandoDocs.set(true);
    this.docService.inicializar(this.contratacionId).pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: (docs) => {
        this.documentos.set(docs);
        this.snackbar.open('Documentos inicializados correctamente', 'OK', { duration: 3000 });
        this.inicializandoDocs.set(false);
        this.cargarDatos();
      },
      error: (err) => {
        this.snackbar.open(err.error?.detail || 'Error al inicializar documentos', 'Cerrar', { duration: 4000 });
        this.inicializandoDocs.set(false);
      },
    });
  }

  avanzarEtapa(): void {
    this.avanzando.set(true);
    this.docService.avanzarEtapa(this.contratacionId).pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: (docs) => {
        this.documentos.set(docs);
        this.snackbar.open('Etapa avanzada correctamente', 'OK', { duration: 3000 });
        this.avanzando.set(false);
        this.cargarDatos();
      },
      error: (err) => {
        this.snackbar.open(err.error?.detail || 'Error al avanzar etapa', 'Cerrar', { duration: 4000 });
        this.avanzando.set(false);
      },
    });
  }

  onFileSelected(file: File, docId?: number): void {
    if (file.type !== 'application/pdf') {
      this.snackbar.open('Solo se aceptan archivos PDF', 'Cerrar', { duration: 4000 });
      return;
    }

    this.pendingFile.set(file);
    this.pendingFileName.set(file.name);
    this.pendingFileSize.set(this.formatSize(file.size));
    this.pendingDocId.set(docId ?? null);
  }

  confirmUpload(): void {
    const file = this.pendingFile();
    const docId = this.pendingDocId();
    if (!file || !docId) return;

    this.pendingFile.set(null);
    this.pendingFileName.set('');
    this.pendingFileSize.set('');
    this.pendingDocId.set(null);

    this.subiendo.set('file-read');
    this.subiendo.set('subiendo');

    this.docService.subirDocumento(docId, file).pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: (doc) => {
        this.documentos.update(docs => {
          const idx = docs.findIndex(d => d.id_control_doc_contratacion === doc.id_control_doc_contratacion);
          if (idx >= 0) {
            const copy = [...docs];
            copy[idx] = doc;
            return copy;
          }
          return [...docs, doc];
        });
        this.subiendo.set('completado');
        this.snackbar.open('Documento subido correctamente', 'OK', { duration: 3000 });
        setTimeout(() => {
          this.subiendo.set('ninguno');
        }, 800);
      },
      error: (err) => {
        this.subiendo.set('ninguno');
        this.snackbar.open(err.error?.detail || 'Error al subir documento', 'Cerrar', { duration: 4000 });
      },
    });
  }

  cancelUpload(): void {
    this.pendingFile.set(null);
    this.pendingFileName.set('');
    this.pendingFileSize.set('');
    this.pendingDocId.set(null);
  }

  formatSize(bytes: number): string {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  }

  irADocente(id: number): void {
    this.router.navigate(['/docentes', id]);
  }

  irAModulo(d: DetalleProgramaModulo | null): void {
    if (!d) return;
    this.router.navigate([
      '/programas', d.id_programa,
      'versiones', d.id_programa_version,
      'ediciones', d.id_programa_version_edicion,
      'modulos',
    ], { queryParams: { destacar: d.id_detalle_programa_modulo } });
  }

  truncar(): void {
    const c = this.contratacion();
    if (!c) return;

    const dialogRef = this.dialog.open(ConfirmDialogComponent, {
      width: '420px',
      data: {
        titulo: 'Truncar contratación',
        mensaje: `¿Está seguro? Los documentos subidos quedarán como historial y podrá iniciar una nueva contratación para este módulo.`,
      },
    });

    dialogRef.afterClosed().pipe(takeUntilDestroyed(this.destroyRef)).subscribe((confirmado) => {
      if (confirmado) {
        this.service.truncar(this.contratacionId).pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
          next: () => {
            this.snackbar.open('Contratación truncada', 'OK', { duration: 3000 });
            this.cargarDatos();
          },
          error: (err) => {
            this.snackbar.open(err.error?.detail || 'Error al truncar', 'Cerrar', { duration: 4000 });
          },
        });
      }
    });
  }

  editarMonto(): void {
    this.montoInput.set(this.contratacion()?.monto ?? null);
    this.montoEditando.set(true);
  }

  cancelarMontoEdit(): void {
    this.montoEditando.set(false);
    this.montoInput.set(null);
  }

  guardarMonto(): void {
    const nuevo = this.montoInput();
    if (!this.contratacion()) return;
    this.service.update(this.contratacionId, { monto: nuevo }).pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: () => {
        this.snackbar.open('Monto actualizado', 'OK', { duration: 2000 });
        this.montoEditando.set(false);
        this.cargarDatos();
      },
      error: (err) => {
        this.snackbar.open(err.error?.detail || 'Error al actualizar monto', 'Cerrar', { duration: 4000 });
      },
    });
  }

  volver(): void {
    this.navBack.retornar(['/contrataciones']);
  }

  estadoLabel(estado: string): string {
    const map: Record<string, string> = {
      pendiente: 'Pendiente',
      en_curso: 'En curso',
      formalizado: 'Formalizado',
      truncado: 'Truncado',
      cancelado: 'Cancelado',
    };
    return map[estado] ?? estado;
  }

  totalDocs = computed(() => this.documentos().length);

  progresoGlobal = computed(() => {
    const total = this.totalDocs();
    if (total === 0) return 0;
    const completados = this.documentos().filter(d => d.estado === 'aceptado' || d.url_documento).length;
    return Math.round((completados / total) * 100);
  });

  puedeAvanzar = computed(() => {
    const c = this.contratacion();
    if (!c || c.estado === 'truncado' || c.estado === 'formalizado') return false;
    const etapaActual = c.id_etapa_actual;
    if (!etapaActual) return false;

    const docsEtapa = this.documentos().filter(d => d.id_etapa === etapaActual);
    const docsPendientes = docsEtapa.filter(d => d.estado !== 'aceptado' && !d.url_documento);
    return docsPendientes.length === 0;
  });

  hayDocumentos = computed(() => this.documentos().length > 0);

  protected readonly urlPdf = (ruta: string | null) => this.docService.urlPdf(ruta);
}
