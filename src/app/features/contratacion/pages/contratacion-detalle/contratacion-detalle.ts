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
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatExpansionModule } from '@angular/material/expansion';

import { ConfirmDialogComponent } from '../../../../shared/components/confirm-dialog/confirm-dialog';
import { ContratacionService } from '../../services/contratacion.service';
import { DocumentoService } from '../../services/documento.service';
import { DetalleService } from '../../../detalle-programa-modulo/services/detalle.service';
import { ContratacionDocente } from '../../models/contratacion.model';
import { DocumentoContratacion, ETAPAS_DOCUMENTALES } from '../../models/documento.model';
import { DetalleProgramaModulo } from '../../../detalle-programa-modulo/models/detalle.model';

@Component({
  selector: 'app-contratacion-detalle',
  standalone: true,
  imports: [
    CommonModule,
    MatButtonModule, MatIconModule, MatCardModule, MatDividerModule,
    MatSnackBarModule, MatProgressSpinnerModule, MatDialogModule, MatTooltipModule,
    MatProgressBarModule, MatExpansionModule,
  ],
  templateUrl: './contratacion-detalle.html',
  styleUrl: './contratacion-detalle.css',
})
export class ContratacionDetalleComponent implements OnInit {
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private service = inject(ContratacionService);
  private documentoService = inject(DocumentoService);
  private detalleService = inject(DetalleService);
  private dialog = inject(MatDialog);
  private snackbar = inject(MatSnackBar);
  private destroyRef = inject(DestroyRef);

  contratacion = signal<ContratacionDocente | null>(null);
  documentos = signal<DocumentoContratacion[]>([]);
  detalle = signal<DetalleProgramaModulo | null>(null);
  loading = signal(true);
  subiendo = signal<'ninguno' | 'file-read' | 'subiendo' | 'completado'>('ninguno');
  progresoSubida = signal(0);
  error = signal<string | null>(null);
  etapaExpandida = signal<string | null>(null);
  montoEditando = signal(false);
  montoInput = signal<number | null>(null);

  documentosPorOrden = computed(() => {
    const map = new Map<number, DocumentoContratacion>();
    for (const doc of this.documentos()) {
      map.set(doc.orden, doc);
    }
    return map;
  });

  versionesPorOrden = computed(() => {
    const map = new Map<number, DocumentoContratacion[]>();
    for (const doc of this.documentos()) {
      const arr = map.get(doc.orden) ?? [];
      arr.push(doc);
      map.set(doc.orden, arr);
    }
    return map;
  });

  siguienteOrden = computed(() => this.documentos().length);

  versionesAnteriores(orden: number): DocumentoContratacion[] {
    const docs = this.versionesPorOrden().get(orden) ?? [];
    if (docs.length <= 1) return [];
    return docs.slice(0, -1);
  }

  mostrarVersionesAnteriores = signal<number | null>(null);

  toggleVersiones(orden: number): void {
    this.mostrarVersionesAnteriores.set(
      this.mostrarVersionesAnteriores() === orden ? null : orden
    );
  }

  etapasConEstado = computed(() => {
    const docsPorOrden = this.documentosPorOrden();
    const orden = this.siguienteOrden();
    let docIdx = 0;
    return ETAPAS_DOCUMENTALES.map(etapa => {
      const inicioEtapa = docIdx;
      const docsEnEtapa = etapa.documentos.map((d, i) => ({
        info: d,
        doc: docsPorOrden.get(inicioEtapa + i) ?? null,
        ordenGlobal: inicioEtapa + i,
      }));
      docIdx += etapa.documentos.length;

      const completados = docsEnEtapa.filter(d => d.doc !== null).length;
      const total = docsEnEtapa.length;
      const todosCompletados = completados === total;
      const algunoCompletado = completados > 0;
      const activa = !todosCompletados && algunoCompletado
        ? false
        : orden >= inicioEtapa && (orden < inicioEtapa + total || todosCompletados);
      const esActual = orden >= inicioEtapa && orden < inicioEtapa + total && !todosCompletados;
      const bloqueada = orden <= inicioEtapa ? false : orden > inicioEtapa + total;

      return { etapa, docsEnEtapa, completados, total, esActual, bloqueada, activa };
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
      },
      error: () => {
        this.error.set('No se pudo cargar la contratación');
        this.loading.set(false);
      },
    });

    this.documentoService.getAll(this.contratacionId).pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: (docs) => {
        this.documentos.set(docs);
        this.autoExpandirEtapa();
      },
    });
  }

  private autoExpandirEtapa(): void {
    const orden = this.siguienteOrden();
    let docIdx = 0;
    for (const etapa of ETAPAS_DOCUMENTALES) {
      if (orden >= docIdx && orden < docIdx + etapa.documentos.length) {
        this.etapaExpandida.set(etapa.nombre);
        return;
      }
      docIdx += etapa.documentos.length;
    }
    if (orden >= docIdx) {
      this.etapaExpandida.set(ETAPAS_DOCUMENTALES[ETAPAS_DOCUMENTALES.length - 1]?.nombre ?? null);
    }
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

  pasoActual(orden: number): boolean {
    return orden === this.siguienteOrden()
      && this.contratacion()?.estado !== 'truncado'
      && this.contratacion()?.estado !== 'formalizado';
  }

  pasosBloqueados(): boolean {
    const c = this.contratacion();
    return !c || c.estado === 'truncado' || c.estado === 'formalizado';
  }

  onFileSelected(event: Event, ordenReemplazo?: number): void {
    const input = event.target as HTMLInputElement;
    if (!input.files || input.files.length === 0) return;

    const file = input.files[0];
    if (file.type !== 'application/pdf') {
      this.snackbar.open('Solo se aceptan archivos PDF', 'Cerrar', { duration: 4000 });
      return;
    }

    this.subiendo.set('file-read');

    const reader = new FileReader();
    reader.onprogress = (e) => {
      if (e.lengthComputable) {
        this.progresoSubida.set(Math.round((e.loaded / e.total) * 40));
      }
    };
    reader.onload = () => {
      this.progresoSubida.set(40);
      this.subiendo.set('subiendo');
      this.documentoService.subirPdf(this.contratacionId, file, ordenReemplazo).pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
        next: () => {
          this.progresoSubida.set(100);
          this.subiendo.set('completado');
          this.snackbar.open('Documento subido correctamente', 'OK', { duration: 3000 });
          setTimeout(() => {
            this.subiendo.set('ninguno');
            this.progresoSubida.set(0);
            this.cargarDatos();
          }, 800);
        },
        error: (err) => {
          this.subiendo.set('ninguno');
          this.progresoSubida.set(0);
          this.snackbar.open(err.error?.detail || 'Error al subir documento', 'Cerrar', { duration: 4000 });
        },
      });
    };
    reader.onerror = () => {
      this.subiendo.set('ninguno');
      this.progresoSubida.set(0);
      this.snackbar.open('Error al leer el archivo', 'Cerrar', { duration: 4000 });
    };
    reader.readAsDataURL(file);
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
    this.router.navigate(['/contrataciones']);
  }

  estadoLabel(estado: string): string {
    const map: Record<string, string> = {
      pendiente: 'Pendiente',
      verificacion: 'Verificación Presupuestaria',
      convocatoria: 'Convocatoria',
      seleccion: 'Selección',
      resolucion: 'Resolución',
      legal: 'Gestión Legal',
      formalizado: 'Formalizado',
      truncado: 'Truncado',
    };
    return map[estado] ?? estado;
  }

  totalDocs = computed(() =>
    ETAPAS_DOCUMENTALES.reduce((acc, e) => acc + e.documentos.length, 0)
  );

  progresoGlobal = computed(() => {
    const total = this.totalDocs();
    if (total === 0) return 0;
    return Math.round((this.documentos().length / total) * 100);
  });

  protected readonly ETAPAS_DOCUMENTALES = ETAPAS_DOCUMENTALES;
  protected readonly urlPdf = (ruta: string | null) => this.documentoService.urlPdf(ruta);
}
