import { Component, OnInit, inject, signal, computed, DestroyRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule } from '@angular/material/core';
import { MatDividerModule } from '@angular/material/divider';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { AlumnoService } from '../../services/alumno.service';
import { EdicionService } from '../../../edicion/services/edicion.service';
import { ModalidadAcademicaService } from '../../services/modalidad-academica.service';
import { TipoDescuentoService } from '../../services/tipo-descuento.service';
import { DetalleProgramaAlumnoService } from '../../services/detalle-programa-alumno.service';
import { Alumno, AlumnoUpdate, GeneroAlumno } from '../../models/alumno.model';
import { ModalidadAcademica } from '../../models/modalidad-academica.model';
import { TipoDescuento } from '../../models/tipo-descuento.model';
import { RequisitoResumen } from '../../models/modalidad-academica.model';
import { ProgramaVersionEdicion } from '../../../edicion/models/edicion.model';
import { DetalleProgramaAlumno } from '../../models/detalle-programa-alumno.model';
import { Solicitud, DocumentoSolicitud } from '../../models/solicitud-incorporacion.model';
import { environment } from '../../../../../environments/environment';
import { UploadBoxComponent } from '../../../../shared/components/upload-box/upload-box';

@Component({
  selector: 'app-inscribir',
  standalone: true,
  imports: [
    CommonModule, FormsModule, RouterModule,
    MatCardModule, MatButtonModule, MatIconModule, MatFormFieldModule,
    MatInputModule, MatSelectModule, MatDatepickerModule, MatNativeDateModule,
    MatDividerModule, MatTooltipModule, MatProgressSpinnerModule, MatProgressBarModule,
    MatSnackBarModule, UploadBoxComponent,
  ],
  templateUrl: './inscribir.html',
  styleUrl: './inscribir.css',
})
export class InscribirComponent implements OnInit {
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private alumnoService = inject(AlumnoService);
  private edicionService = inject(EdicionService);
  private modalidadService = inject(ModalidadAcademicaService);
  private descuentoService = inject(TipoDescuentoService);
  private detalleService = inject(DetalleProgramaAlumnoService);
  private snackBar = inject(MatSnackBar);
  private destroyRef = inject(DestroyRef);

  edicion = signal<ProgramaVersionEdicion | null>(null);
  alumno = signal<Alumno | null>(null);
  modalidades = signal<ModalidadAcademica[]>([]);
  tiposDescuento = signal<TipoDescuento[]>([]);
  inscripciones = signal<DetalleProgramaAlumno[]>([]);
  cargando = signal(true);
  guardando = signal(false);
  formTocado = signal(false);

  editData: AlumnoUpdate = {};
  selectedModalidad = signal<number | null>(null);
  selectedDescuento = signal<number | null>(null);
  requisitosModalidad = signal<RequisitoResumen[]>([]);

  generos: GeneroAlumno[] = ['masculino', 'femenino'];
  apiUrl = environment.apiUrl;

  currentStep = signal(1);
  esIncorporacion = signal(false);
  solicitud = signal<Solicitud | null>(null);
  dpaId = signal<number | null>(null);

  descuentosDisponibles = computed(() => {
    const modId = this.selectedModalidad();
    if (!modId) return [];
    return this.tiposDescuento().filter(d =>
      d.modalidades.some(m => m.id_modalidad_academica === modId)
    );
  });

  solicitudAceptada = computed(() => this.solicitud()?.estado === 'aprobado' || this.solicitud()?.estado === 'aceptado');
  solicitudRechazada = computed(() => {
    const sol = this.solicitud();
    return sol?.estado === 'rechazado' ? sol.motivo_rechazo : null;
  });

  expandedDocId = signal<number | null>(null);
  uploadFile = signal<File | null>(null);
  uploadFileName = signal('');
  uploadFileSize = signal('');
  subiendoDoc = signal(false);

  documentosProgreso = computed(() => {
    const sol = this.solicitud();
    if (!sol || !sol.documentos) return { subidos: 0, total: 0, pct: 0 };
    const subidos = sol.documentos.filter(d => !!d.url_documento).length;
    const total = sol.documentos.length;
    return { subidos, total, pct: total > 0 ? Math.round((subidos / total) * 100) : 0 };
  });

  descuentosUsados = computed(() => {
    const usados = new Set<number>();
    for (const insc of this.inscripciones()) {
      if (
        insc.id_tipo_descuento != null &&
        !['postulante', 'observado'].includes(insc.estado)
      ) {
        usados.add(insc.id_tipo_descuento);
      }
    }
    return usados;
  });

  ngOnInit(): void {
    const id = Number(this.route.snapshot.paramMap.get('id'));
    if (!id) {
      this.snackBar.open('Edición no válida', 'Cerrar', { duration: 3000 });
      this.router.navigate(['/alumnos']);
      return;
    }
    this._cargarDatos(id);
  }

  private _cargarDatos(idEdicion: number): void {
    const total = 5;
    let completados = 0;
    const onComplete = () => {
      if (++completados >= total) {
        this._detectarEstadoInicial(idEdicion);
      }
    };

    this.edicionService.getById(idEdicion).pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: (ed) => {
        this.edicion.set(ed);
        const idTipoPrograma = ed.programa_version.programa.id_tipo_programa;
        this.modalidadService.getAll(idTipoPrograma).pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
          next: (mods) => this.modalidades.set(mods.filter(m => m.estado === 'activo')),
          error: () => { this.snackBar.open('Error al cargar modalidades', 'Cerrar', { duration: 4000 }); onComplete(); },
          complete: onComplete,
        });
        this.descuentoService.getAll(idTipoPrograma).pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
          next: (desc) => this.tiposDescuento.set(desc.filter(d => d.estado === 'activo')),
          error: () => { this.snackBar.open('Error al cargar descuentos', 'Cerrar', { duration: 4000 }); onComplete(); },
          complete: onComplete,
        });
      },
      error: () => {
        this.snackBar.open('Error al cargar programa', 'Cerrar', { duration: 4000 });
        onComplete();
      },
      complete: onComplete,
    });

    this.alumnoService.getMiPerfil().pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: (a) => {
        this.alumno.set(a);
        this.editData = {
          ci: a.ci,
          pasaporte: a.pasaporte,
          nombre: a.nombre,
          apellido: a.apellido,
          fecha_nacimiento: a.fecha_nacimiento,
          genero: a.genero,
          celular: a.celular,
          correo: a.correo,
          direccion: a.direccion,
        };
      },
      error: () => {
        this.snackBar.open('Error al cargar perfil', 'Cerrar', { duration: 4000 });
        onComplete();
      },
      complete: onComplete,
    });

    this.detalleService.getMisInscripciones().pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: (insc) => this.inscripciones.set(insc),
      complete: onComplete,
    });
  }

  private _detectarEstadoInicial(idEdicion: number): void {
    const ed = this.edicion();
    if (!ed) { this.cargando.set(false); return; }

    if (ed.estado !== 'en_curso') {
      this.esIncorporacion.set(false);
      this.cargando.set(false);
      return;
    }

    this.esIncorporacion.set(true);

    this.detalleService.getMisSolicitudes().pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: (solicitudes) => {
        const sol = solicitudes.find(
          s => s.incorporacion?.id_programa_version_edicion === idEdicion
        );
        if (sol) {
          this.solicitud.set(sol);
          const allUploaded = sol.documentos && sol.documentos.length > 0 && sol.documentos.every(d => !!d.url_documento);
          if (allUploaded || sol.estado !== 'pendiente') {
            this.currentStep.set(4);
          } else {
            this.currentStep.set(3);
          }
        } else {
          this.currentStep.set(1);
        }
        this.cargando.set(false);
      },
      error: () => { this.cargando.set(false); },
    });
  }

  avANextStep(): void {
    this.currentStep.update(s => s + 1);
  }

  onModalidadChange(idModalidad: number | null): void {
    this.selectedModalidad.set(idModalidad);
    if (!idModalidad) {
      this.requisitosModalidad.set([]);
      return;
    }
    const mod = this.modalidades().find(m => m.id_modalidad_academica === idModalidad);
    this.requisitosModalidad.set(mod?.requisitos ?? []);

    const descActual = this.selectedDescuento();
    if (descActual) {
      const disponible = this.descuentosDisponibles().some(d => d.id_tipo_descuento === descActual);
      if (!disponible) {
        this.selectedDescuento.set(null);
      }
    }
  }

  onDescuentoChange(idDescuento: number | null): void {
    this.selectedDescuento.set(idDescuento);
  }

  descuentoUsado(desc: TipoDescuento): boolean {
    return desc.uso_unico && this.descuentosUsados().has(desc.id_tipo_descuento);
  }

  requisitosDescuento(): RequisitoResumen[] {
    const id = this.selectedDescuento();
    if (!id) return [];
    const desc = this.descuentosDisponibles().find(d => d.id_tipo_descuento === id);
    return desc?.requisitos ?? [];
  }

  inscribir(): void {
    this.formTocado.set(true);

    const idModalidad = this.selectedModalidad();
    if (!idModalidad) {
      this.snackBar.open('Seleccioná una modalidad académica', 'Cerrar', { duration: 3000 });
      return;
    }

    const ed = this.edicion();
    if (!ed) return;

    this.guardando.set(true);

    this._confirmarInscripcion(ed);
  }

  private _confirmarInscripcion(ed: ProgramaVersionEdicion): void {
    if (ed.estado === 'en_curso') {
      this.detalleService.solicitar({
        id_programa_version_edicion: ed.id_programa_version_edicion,
        id_modalidad_academica: this.selectedModalidad()!,
        id_tipo_descuento: this.selectedDescuento(),
      }).pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
        next: (sol) => {
          this.guardando.set(false);
          this.solicitud.set(sol);
          this.currentStep.set(3);
        },
        error: (err) => {
          this.guardando.set(false);
          const msg = err.error?.detail || 'Error al crear solicitud';
          this.snackBar.open(msg, 'Cerrar', { duration: 5000 });
        },
      });
    } else {
      this.detalleService.autoInscribir({
        id_programa_version_edicion: ed.id_programa_version_edicion,
        id_modalidad_academica: this.selectedModalidad()!,
        id_tipo_descuento: this.selectedDescuento(),
      }).subscribe({
        next: (dpa) => {
          this.guardando.set(false);
          this.snackBar.open('¡Inscripción exitosa! Revisá la documentación pendiente.', 'Cerrar', { duration: 5000 });
          this.router.navigate(['/alumnos', 'inscripciones']);
        },
        error: (err) => {
          this.guardando.set(false);
          const msg = err.error?.detail || 'Error al inscribirte';
          this.snackBar.open(msg, 'Cerrar', { duration: 5000 });
        },
      });
    }
  }

  toggleDocExpand(docId: number): void {
    this.expandedDocId.update(v => v === docId ? null : docId);
    this.limpiarUpload();
  }

  onDocUploadFileSelected(file: File): void {
    this._procesarDocUpload(file);
  }

  private _procesarDocUpload(file: File): void {
    if (file.size > 10 * 1024 * 1024) {
      this.snackBar.open('El archivo no puede superar 10 MB', 'Cerrar', { duration: 3000 });
      return;
    }
    const allowed = ['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'application/pdf'];
    if (!allowed.includes(file.type)) {
      this.snackBar.open('Formato no permitido', 'Cerrar', { duration: 3000 });
      return;
    }

    this.uploadFile.set(file);
    this.uploadFileName.set(file.name);
    this.uploadFileSize.set(this._formatSize(file.size));
  }

  limpiarUpload(): void {
    this.uploadFile.set(null);
    this.uploadFileName.set('');
    this.uploadFileSize.set('');
    this.subiendoDoc.set(false);
  }

  confirmarSubida(): void {
    const file = this.uploadFile();
    const docId = this.expandedDocId();
    const sol = this.solicitud();
    if (!file || !docId || !sol) return;

    this.subiendoDoc.set(true);
    const reader = new FileReader();
    reader.onload = () => {
      const base64 = reader.result as string;
      this.detalleService.subirDocumentoSolicitud(sol.id_solicitud, docId, base64)
        .pipe(takeUntilDestroyed(this.destroyRef))
        .subscribe({
          next: (updatedSol) => {
            this.subiendoDoc.set(false);
            this.solicitud.set(updatedSol);
            this.expandedDocId.set(null);
            this.limpiarUpload();
            this.snackBar.open('Documento subido correctamente', 'Cerrar', { duration: 2000 });
            const pct = this.documentosProgreso();
            if (pct.subidos === pct.total) {
              this.snackBar.open('¡Todos los documentos subidos!', 'Cerrar', { duration: 3000 });
              this.currentStep.set(4);
            }
          },
          error: (err) => {
            this.subiendoDoc.set(false);
            this.snackBar.open(err.error?.detail || 'Error al subir documento', 'Cerrar', { duration: 4000 });
          },
        });
    };
    reader.onerror = () => {
      this.subiendoDoc.set(false);
      this.snackBar.open('Error al leer el archivo', 'Cerrar', { duration: 4000 });
    };
    reader.readAsDataURL(file);
  }

  private _formatSize(bytes: number): string {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  }

  getBannerColor(edicion: ProgramaVersionEdicion): string {
    switch (edicion.estado) {
      case 'en_curso': return 'linear-gradient(135deg, #0d9488, #0f766e)';
      case 'programado': return 'linear-gradient(135deg, #1e3a8a, #1e40af)';
      case 'reprogramado': return 'linear-gradient(135deg, #ca8a04, #a16207)';
      case 'finalizado': return 'linear-gradient(135deg, #64748b, #475569)';
      default: return 'linear-gradient(135deg, #1e3a8a, #7c3aed)';
    }
  }

  convertirFecha(fecha: string | null): string {
    if (!fecha) return '—';
    const d = new Date(fecha + 'T12:00:00');
    return d.toLocaleDateString('es-BO', { day: '2-digit', month: '2-digit', year: 'numeric' });
  }
}
