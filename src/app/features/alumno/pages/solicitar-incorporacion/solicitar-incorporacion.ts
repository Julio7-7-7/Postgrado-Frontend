import { Component, OnInit, inject, signal, DestroyRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatTooltipModule } from '@angular/material/tooltip';
import { DetalleProgramaAlumnoService } from '../../services/detalle-programa-alumno.service';
import { EdicionService } from '../../../edicion/services/edicion.service';
import { ProgramaVersionEdicion } from '../../../edicion/models/edicion.model';
import { SolicitudIncorporacion } from '../../models/solicitud-incorporacion.model';

@Component({
  selector: 'app-solicitar-incorporacion',
  standalone: true,
  imports: [
    CommonModule,
    MatCardModule, MatButtonModule, MatIconModule,
    MatProgressBarModule, MatProgressSpinnerModule,
    MatSnackBarModule, MatTooltipModule,
  ],
  template: `
    <div class="solicitud-container">
      <button class="back-btn" (click)="volver()">
        <mat-icon>arrow_back</mat-icon>
        <span>Volver a Inscripciones</span>
      </button>

      @if (cargando()) {
        <div class="loading">
          <mat-spinner diameter="36"></mat-spinner>
          <span>Cargando información...</span>
        </div>
      }

      @if (!cargando()) {
        @if (esMigracion()) {
          <div class="header-card migration">
            <mat-icon class="header-icon">swap_horiz</mat-icon>
            <div class="header-text">
              <h1>Solicitar Migración</h1>
              <p>Solicitá trasladar tu inscripción a otra edición del mismo programa</p>
            </div>
          </div>
        } @else if (edicion(); as ed) {
          <div class="header-card" [style.background]="getBannerColor(ed)">
            <mat-icon class="header-icon">school</mat-icon>
            <div class="header-text">
              <h1>Solicitar Incorporación</h1>
              <p>{{ ed.programa_version?.programa?.nombre_programa }} — Ed. {{ ed.edicion }} ({{ ed.gestion }})</p>
            </div>
          </div>
        }

        @if (esMigracion()) {
          <div class="steps-card">
            <div class="steps-header">
              <mat-icon [style.color]="'#7c3aed'">info</mat-icon>
              <h3>¿Cómo funciona la migración?</h3>
            </div>
            <div class="steps-grid">
              <div class="step active-step">
                <div class="step-num">1</div>
                <div class="step-text">
                  <strong>Subí tu carta</strong>
                  <span>Carta dirigida al director solicitando la migración</span>
                </div>
              </div>
              <div class="step">
                <div class="step-num">2</div>
                <div class="step-text">
                  <strong>Revisión admin</strong>
                  <span>El admin elige la edición y aproba tu solicitud</span>
                </div>
              </div>
              <div class="step">
                <div class="step-num">3</div>
                <div class="step-text">
                  <strong>Inscripción</strong>
                  <span>Quedás inscrito directamente en la edición destino</span>
                </div>
              </div>
            </div>
          </div>
        }

        @if (!yaInscribio() && !esMigracion()) {
          <div class="steps-card">
            <div class="steps-header">
              <mat-icon [style.color]="'#0d9488'">info</mat-icon>
              <h3>¿Cómo funciona?</h3>
            </div>
            <div class="steps-grid">
              <div class="step active-step">
                <div class="step-num">1</div>
                <div class="step-text">
                  <strong>Inscribite</strong>
                  <span>Elegí modalidad, descuento y completá tus datos</span>
                </div>
              </div>
              <div class="step">
                <div class="step-num">2</div>
                <div class="step-text">
                  <strong>Subí tu carta</strong>
                  <span>Carta dirigida al director de la escuela de postgrado</span>
                </div>
              </div>
              <div class="step">
                <div class="step-num">3</div>
                <div class="step-text">
                  <strong>Revisión admin</strong>
                  <span>El administrador revisa y aprueba tu solicitud</span>
                </div>
              </div>
              <div class="step">
                <div class="step-num">4</div>
                <div class="step-text">
                  <strong>Documentación</strong>
                  <span>Subí los documentos requeridos</span>
                </div>
              </div>
            </div>
          </div>

          <div class="action-card">
            <div class="inscribir-prompt">
              <mat-icon>school</mat-icon>
              <div class="prompt-text">
                <h3>Primero inscribite al programa</h3>
                <p>Completá el formulario de inscripción con tu modalidad y datos personales. Después vas a poder subir la carta.</p>
              </div>
              <button mat-flat-button color="primary" (click)="irAInscribir()">
                <mat-icon>arrow_forward</mat-icon>
                Inscribirme ahora
              </button>
            </div>
          </div>
        }

        @if (yaInscribio()) {
          @if (solicitudConCarta()) {
            @if (estadoSolicitud() === 'aceptado') {
              <div class="action-card">
                <div class="status-box aprobada">
                  <div class="status-icon-circle aprobada">
                    <mat-icon>check_circle</mat-icon>
                  </div>
                  <div class="status-content">
                    <h3>Solicitud aprobada</h3>
                    <p>Tu solicitud fue aprobada. El administrador procesó tu incorporación.</p>
                  </div>
                </div>
              </div>
            } @else if (estadoSolicitud() === 'rechazado') {
              <div class="action-card">
                <div class="status-box rechazada">
                  <div class="status-icon-circle rechazada">
                    <mat-icon>close</mat-icon>
                  </div>
                  <div class="status-content">
                    <h3>Solicitud rechazada</h3>
                    <p>Tu solicitud fue rechazada. Podés enviar una nueva carta.</p>
                  </div>
                  <label class="reenviar-btn" matTooltip="Enviar nueva carta">
                    <mat-icon>replay</mat-icon>
                    Enviar nueva solicitud
                    <input type="file" accept="image/jpeg,image/png,image/gif,image/webp,application/pdf"
                           hidden (change)="onFileSelected($event)">
                  </label>
                </div>
              </div>
            } @else {
              <div class="action-card">
                <div class="status-box pendiente">
                  <div class="status-icon-circle pendiente">
                    <mat-icon>schedule</mat-icon>
                  </div>
                  <div class="status-content">
                    <h3>Solicitud pendiente</h3>
                    <p>Tu solicitud está siendo revisada. Te notificaremos cuando sea aprobada.</p>
                  </div>
                </div>
              </div>
            }
          } @else {
            <div class="upload-card">
              <div class="upload-card-header">
                <mat-icon [style.color]="'#0d9488'">description</mat-icon>
                <h3>Subí tu carta de solicitud de incorporación</h3>
              </div>
              @if (subiendo()) {
                <div class="uploading-state">
                  <mat-spinner diameter="40"></mat-spinner>
                  <h3>Subiendo carta...</h3>
                  <p>{{ nombreArchivo() }} — {{ tamanoArchivo() }}</p>
                  <mat-progress-bar mode="indeterminate"></mat-progress-bar>
                </div>
              } @else if (archivoSeleccionado()) {
                <div class="file-preview">
                  @if (esPdf()) {
                    <div class="file-icon pdf">
                      <mat-icon>picture_as_pdf</mat-icon>
                    </div>
                  } @else {
                    <img [src]="previewUrl()" class="file-thumb" (error)="$event.target.style.display='none'">
                  }
                  <div class="file-info">
                    <h3>{{ nombreArchivo() }}</h3>
                    <p>{{ tamanoArchivo() }}</p>
                  </div>
                  <div class="file-actions">
                    <button mat-icon-button class="remove-btn" (click)="limpiarArchivo()" matTooltip="Quitar archivo">
                      <mat-icon>close</mat-icon>
                    </button>
                  </div>
                </div>
                <div class="upload-confirm">
                  <button mat-flat-button color="primary" (click)="enviarCarta()" class="enviar-btn">
                    <mat-icon>send</mat-icon>
                    Enviar carta
                  </button>
                </div>
              } @else {
                <label class="drop-area" for="fileInput">
                  <div class="drop-icon">
                    <mat-icon>cloud_upload</mat-icon>
                  </div>
                  <h3>Subí tu carta de solicitud</h3>
                  <p>Hacé click aquí para seleccionar tu archivo</p>
                  <span class="formats">PDF, JPG, PNG, GIF o WebP — máx. 10 MB</span>
                  <input id="fileInput" type="file" accept="image/jpeg,image/png,image/gif,image/webp,application/pdf"
                         hidden (change)="onFileSelected($event)">
                </label>
              }
            </div>
          }
        }

        @if (!yaInscribio() && esMigracion()) {
          @if (solicitudMigracionPendiente()) {
            <div class="action-card">
              <div class="status-box pendiente">
                <div class="status-icon-circle pendiente">
                  <mat-icon>schedule</mat-icon>
                </div>
                <div class="status-content">
                  <h3>Solicitud de migración pendiente</h3>
                  <p>Tu solicitud está siendo revisada. El administrador elegirá la edición destino.</p>
                </div>
              </div>
            </div>
          } @else if (solicitudMigracionAceptada()) {
            <div class="action-card">
              <div class="status-box aprobada">
                <div class="status-icon-circle aprobada">
                  <mat-icon>check_circle</mat-icon>
                </div>
                <div class="status-content">
                  <h3>Migración aprobada</h3>
                  <p>Tu solicitud fue aprobada. El administrador te inscribió en la edición destino.</p>
                </div>
              </div>
            </div>
          } @else if (solicitudMigracionRechazada()) {
            <div class="action-card">
              <div class="status-box rechazada">
                <div class="status-icon-circle rechazada">
                  <mat-icon>close</mat-icon>
                </div>
                <div class="status-content">
                  <h3>Solicitud rechazada</h3>
                  <p>Tu solicitud de migración fue rechazada.</p>
                </div>
                <label class="reenviar-btn" matTooltip="Enviar nueva carta">
                  <mat-icon>replay</mat-icon>
                  Enviar nueva solicitud
                  <input type="file" accept="image/jpeg,image/png,image/gif,image/webp,application/pdf"
                         hidden (change)="onFileSelected($event)">
                </label>
              </div>
            </div>
          } @else {
            <div class="upload-card">
              <div class="upload-card-header">
                <mat-icon [style.color]="'#7c3aed'">description</mat-icon>
                <h3>Carta de solicitud de migración</h3>
              </div>
              @if (subiendo()) {
                <div class="uploading-state">
                  <mat-spinner diameter="40"></mat-spinner>
                  <h3>Subiendo carta...</h3>
                  <p>{{ nombreArchivo() }} — {{ tamanoArchivo() }}</p>
                  <mat-progress-bar mode="indeterminate"></mat-progress-bar>
                </div>
              } @else if (archivoSeleccionado()) {
                <div class="file-preview">
                  @if (esPdf()) {
                    <div class="file-icon pdf">
                      <mat-icon>picture_as_pdf</mat-icon>
                    </div>
                  } @else {
                    <img [src]="previewUrl()" class="file-thumb" (error)="$event.target.style.display='none'">
                  }
                  <div class="file-info">
                    <h3>{{ nombreArchivo() }}</h3>
                    <p>{{ tamanoArchivo() }}</p>
                  </div>
                  <div class="file-actions">
                    <button mat-icon-button class="remove-btn" (click)="limpiarArchivo()" matTooltip="Quitar archivo">
                      <mat-icon>close</mat-icon>
                    </button>
                  </div>
                </div>
                <div class="upload-confirm">
                  <button mat-flat-button color="primary" (click)="enviarCarta()" class="enviar-btn">
                    <mat-icon>send</mat-icon>
                    Enviar carta
                  </button>
                </div>
              } @else {
                <label class="drop-area" for="fileInput">
                  <div class="drop-icon">
                    <mat-icon>cloud_upload</mat-icon>
                  </div>
                  <h3>Subí tu carta de solicitud</h3>
                  <p>Hacé click aquí para seleccionar tu archivo</p>
                  <span class="formats">PDF, JPG, PNG, GIF o WebP — máx. 10 MB</span>
                  <input id="fileInput" type="file" accept="image/jpeg,image/png,image/gif,image/webp,application/pdf"
                         hidden (change)="onFileSelected($event)">
                </label>
              }
            </div>
          }
        }
      }
    </div>
  `,
  styleUrl: './solicitar-incorporacion.css',
})
export class SolicitarIncorporacionComponent implements OnInit {
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private snackBar = inject(MatSnackBar);
  private detalleService = inject(DetalleProgramaAlumnoService);
  private edicionService = inject(EdicionService);
  private destroyRef = inject(DestroyRef);

  edicion = signal<ProgramaVersionEdicion | null>(null);
  cargando = signal(true);
  subiendo = signal(false);
  solicitud = signal<SolicitudIncorporacion | null>(null);

  archivoSeleccionado = signal<File | null>(null);
  nombreArchivo = signal('');
  tamanoArchivo = signal('');
  previewUrl = signal('');
  esPdf = signal(false);

  esMigracion = signal(false);
  yaInscribio = signal(false);
  idEdicion = 0;

  solicitudConCarta = signal(false);
  estadoSolicitud = signal('');
  solicitudMigracionPendiente = signal(false);
  solicitudMigracionAceptada = signal(false);
  solicitudMigracionRechazada = signal(false);

  ngOnInit(): void {
    this.idEdicion = Number(this.route.snapshot.paramMap.get('idEdicion'));
    this.esMigracion.set(!this.idEdicion);

    if (this.idEdicion) {
      this._cargarDatosConEdicion();
    } else {
      this._cargarDatosMigracion();
    }
  }

  private _cargarDatosConEdicion(): void {
    let completados = 0;
    const total = 2;
    const onComplete = () => {
      if (++completados >= total) {
        this.verificarSolicitudExistente();
      }
    };

    this.edicionService.getById(this.idEdicion).pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: (ed) => this.edicion.set(ed),
      error: () => { this.snackBar.open('Error al cargar edición', 'Cerrar', { duration: 4000 }); onComplete(); },
      complete: onComplete,
    });

    this.detalleService.getMisSolicitudes().pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      complete: onComplete,
    });
  }

  private _cargarDatosMigracion(): void {
    this.detalleService.getMisSolicitudes().pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: (solicitudes) => {
        const mig = solicitudes.find(s => !s.id_programa_version_edicion);
        if (mig) {
          this.yaInscribio.set(true);
          this.solicitud.set(mig);
          this.solicitudMigracionPendiente.set(mig.estado === 'pendiente');
          this.solicitudMigracionAceptada.set(mig.estado === 'aceptado');
          this.solicitudMigracionRechazada.set(mig.estado === 'rechazado');
        }
        this.cargando.set(false);
      },
      error: () => { this.cargando.set(false); },
    });
  }

  private verificarSolicitudExistente(): void {
    this.detalleService.getMisSolicitudes().pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: (solicitudes) => {
        const existente = solicitudes.find(
          s => s.id_programa_version_edicion === this.idEdicion
        );
        if (existente) {
          this.yaInscribio.set(true);
          this.solicitud.set(existente);
          this.estadoSolicitud.set(existente.estado);
          this.solicitudConCarta.set(!!existente.url_documento);
        }
        this.cargando.set(false);
      },
      error: () => { this.cargando.set(false); },
    });
  }

  irAInscribir(): void {
    this.router.navigate(['/alumnos', 'inscribir', this.idEdicion]);
  }

  onFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (!input.files || !input.files[0]) return;

    const file = input.files[0];
    const validTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'application/pdf'];
    if (!validTypes.includes(file.type)) {
      this.snackBar.open('Formato no soportado. Use JPG, PNG, GIF, WebP o PDF.', 'Cerrar', { duration: 4000 });
      input.value = '';
      return;
    }

    if (file.size > 10 * 1024 * 1024) {
      this.snackBar.open('El archivo no puede superar 10 MB', 'Cerrar', { duration: 4000 });
      input.value = '';
      return;
    }

    this.archivoSeleccionado.set(file);
    this.nombreArchivo.set(file.name);
    this.tamanoArchivo.set(this._formatSize(file.size));
    this.esPdf.set(file.type === 'application/pdf');

    if (!this.esPdf()) {
      const reader = new FileReader();
      reader.onload = () => this.previewUrl.set(reader.result as string);
      reader.readAsDataURL(file);
    } else {
      this.previewUrl.set('');
    }

    input.value = '';
  }

  limpiarArchivo(): void {
    this.archivoSeleccionado.set(null);
    this.nombreArchivo.set('');
    this.tamanoArchivo.set('');
    this.previewUrl.set('');
    this.esPdf.set(false);
  }

  enviarCarta(): void {
    const file = this.archivoSeleccionado();
    if (!file) return;

    this.subiendo.set(true);
    const reader = new FileReader();
    reader.onload = () => {
      const base64 = reader.result as string;
      const payload: any = { url_documento: base64 };

      if (!this.esMigracion()) {
        payload.id_programa_version_edicion = this.idEdicion;
      }

      this.detalleService.solicitarIncorporacion(payload)
        .pipe(takeUntilDestroyed(this.destroyRef))
        .subscribe({
          next: () => {
            this.subiendo.set(false);
            this.solicitudConCarta.set(true);
            this.estadoSolicitud.set('pendiente');
            if (this.esMigracion()) {
              this.solicitudMigracionPendiente.set(true);
            }
            this.limpiarArchivo();
            this.snackBar.open('¡Carta enviada! Esperá la aprobación del administrador.', 'Cerrar', { duration: 5000 });
          },
          error: (err) => {
            this.subiendo.set(false);
            this.snackBar.open(err.error?.detail || 'Error al enviar la carta', 'Cerrar', { duration: 5000 });
          },
        });
    };
    reader.onerror = () => {
      this.subiendo.set(false);
      this.snackBar.open('Error al leer el archivo', 'Cerrar', { duration: 4000 });
    };
    reader.readAsDataURL(file);
  }

  volver(): void {
    this.router.navigate(['/alumnos/inscripciones']);
  }

  getBannerColor(edicion: ProgramaVersionEdicion): string {
    switch (edicion.estado) {
      case 'en_curso': return 'linear-gradient(135deg, #0d9488, #0f766e)';
      case 'programado': return 'linear-gradient(135deg, #1e3a8a, #1e40af)';
      default: return 'linear-gradient(135deg, #64748b, #475569)';
    }
  }

  private _formatSize(bytes: number): string {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  }
}
