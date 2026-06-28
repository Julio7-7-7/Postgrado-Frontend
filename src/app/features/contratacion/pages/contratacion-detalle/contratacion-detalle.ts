import { Component, OnInit, signal, computed, inject, DestroyRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';

import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatCardModule } from '@angular/material/card';
import { MatDividerModule } from '@angular/material/divider';
import { MatSnackBarModule, MatSnackBar } from '@angular/material/snack-bar';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatDialogModule, MatDialog } from '@angular/material/dialog';
import { MatTooltipModule } from '@angular/material/tooltip';

import { ConfirmDialogComponent } from '../../../../shared/components/confirm-dialog/confirm-dialog';
import { ContratacionService } from '../../services/contratacion.service';
import { DocumentoService } from '../../services/documento.service';
import { DetalleService } from '../../../detalle-programa-modulo/services/detalle.service';
import { ContratacionDocente } from '../../models/contratacion.model';
import { DocumentoContratacion, RUTA_DOCUMENTAL, TipoDocumentoContrato } from '../../models/documento.model';
import { DetalleProgramaModulo } from '../../../detalle-programa-modulo/models/detalle.model';

@Component({
  selector: 'app-contratacion-detalle',
  standalone: true,
  imports: [
    CommonModule, RouterLink,
    MatButtonModule, MatIconModule, MatCardModule, MatDividerModule,
    MatSnackBarModule, MatProgressSpinnerModule, MatDialogModule, MatTooltipModule,
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
  subiendo = signal(false);
  error = signal<string | null>(null);

  documentosMap = computed(() => {
    const map = new Map<TipoDocumentoContrato, DocumentoContratacion>();
    for (const doc of this.documentos()) {
      map.set(doc.tipo, doc);
    }
    return map;
  });

  siguientePaso = computed(() => {
    const docs = this.documentos();
    return docs.length;
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
      next: (docs) => this.documentos.set(docs),
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

  pasoCompletado(idx: number): boolean {
    return idx < this.siguientePaso();
  }

  pasoActual(idx: number): boolean {
    return idx === this.siguientePaso() && this.siguientePaso() < RUTA_DOCUMENTAL.length
      && this.contratacion()?.estado !== 'truncado'
      && this.contratacion()?.estado !== 'formalizado';
  }

  pasosBloqueados(): boolean {
    const c = this.contratacion();
    return !c || c.estado === 'truncado' || c.estado === 'formalizado';
  }

  onFileSelected(event: Event, tipo: TipoDocumentoContrato): void {
    const input = event.target as HTMLInputElement;
    if (!input.files || input.files.length === 0) return;

    const file = input.files[0];
    if (file.type !== 'application/pdf') {
      this.snackbar.open('Solo se aceptan archivos PDF', 'Cerrar', { duration: 4000 });
      return;
    }

    this.subiendo.set(true);

    const reader = new FileReader();
    reader.onload = () => {
      const base64 = reader.result as string;
      this.documentoService.create({
        id_contratacion: this.contratacionId,
        tipo,
        archivo_pdf_base64: base64,
      }).pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
        next: () => {
          this.snackbar.open('Documento subido correctamente', 'OK', { duration: 3000 });
          this.cargarDatos();
          this.subiendo.set(false);
        },
        error: (err) => {
          this.snackbar.open(err.error?.detail || 'Error al subir documento', 'Cerrar', { duration: 4000 });
          this.subiendo.set(false);
        },
      });
    };
    reader.onerror = () => {
      this.snackbar.open('Error al leer el archivo', 'Cerrar', { duration: 4000 });
      this.subiendo.set(false);
    };
    reader.readAsDataURL(file);
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

  volver(): void {
    this.router.navigate(['/contrataciones']);
  }

  protected readonly RUTA_DOCUMENTAL = RUTA_DOCUMENTAL;
}
