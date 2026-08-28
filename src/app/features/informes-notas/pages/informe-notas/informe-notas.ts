import { Component, OnInit, signal, computed, inject, DestroyRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatDividerModule } from '@angular/material/divider';
import { MatChipsModule } from '@angular/material/chips';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { ProgramaService } from '../../../programa/services/programa.service';
import { ProgramaVersionService } from '../../../programa-version/services/programa-version.service';
import { EdicionService } from '../../../edicion/services/edicion.service';
import { DetalleService } from '../../../detalle-programa-modulo/services/detalle.service';
import { CarreraService } from '../../../carreras/services/carrera.service';
import { InformeNotasService } from '../../services/informe-notas.service';
import { Programa } from '../../../programa/models/programa.model';
import { ProgramaVersion } from '../../../programa-version/models/programa-version.model';
import { ProgramaVersionEdicion } from '../../../edicion/models/edicion.model';
import { DetalleProgramaModulo } from '../../../detalle-programa-modulo/models/detalle.model';
import { Carrera } from '../../../carreras/models/carrera.model';
import { InformeNotas } from '../../models/informe-notas.model';
import { ConfirmDialogComponent } from '../../../../shared/components/confirm-dialog/confirm-dialog';
import { AuthService } from '../../../../core/services/auth.service';

@Component({
  selector: 'app-informe-notas',
  standalone: true,
  imports: [
    CommonModule, FormsModule, RouterModule,
    MatButtonModule, MatIconModule, MatTooltipModule,
    MatFormFieldModule, MatSelectModule, MatCheckboxModule,
    MatDividerModule, MatChipsModule, MatProgressSpinnerModule,
    MatDialogModule, MatSnackBarModule,
  ],
  templateUrl: './informe-notas.html',
  styleUrl: './informe-notas.css',
})
export class InformeNotasComponent implements OnInit {
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private programaService = inject(ProgramaService);
  private versionService = inject(ProgramaVersionService);
  private edicionService = inject(EdicionService);
  private detalleService = inject(DetalleService);
  private carreraService = inject(CarreraService);
  private informeService = inject(InformeNotasService);
  private dialog = inject(MatDialog);
  private snackBar = inject(MatSnackBar);
  private destroyRef = inject(DestroyRef);
  private auth = inject(AuthService);

  puedeGenerar = computed(() => this.auth.hasPermiso('pagos.registrar'));
  puedeVer = computed(() => this.auth.hasPermiso('pagos.ver'));

  programas = signal<Programa[]>([]);
  versiones = signal<ProgramaVersion[]>([]);
  ediciones = signal<ProgramaVersionEdicion[]>([]);
  modulos = signal<DetalleProgramaModulo[]>([]);
  seleccionModulos = signal<number[]>([]);
  carreras = signal<Carrera[]>([]);

  selPrograma = signal<number | null>(null);
  selVersion = signal<number | null>(null);
  selEdicion = signal<number | null>(null);
  filtroCarrera = signal<number | null>(null);
  tipoInforme = signal<'parcial' | 'final'>('parcial');

  informes = signal<InformeNotas[]>([]);
  verGenerados = signal(false);
  elegibles = signal<number | null>(null);

  cargandoInicio = signal(true);
  cargandoModulos = signal(false);
  generando = signal(false);
  errorInicio = signal<string | null>(null);

  versionesDelPrograma = computed(() =>
    this.versiones().filter(v => v.id_programa === this.selPrograma()));

  edicionesDeVersion = computed(() =>
    this.ediciones().filter(e => e.id_programa_version === this.selVersion()));

  edicionSel = computed(() =>
    this.ediciones().find(e => e.id_programa_version_edicion === this.selEdicion()) ?? null);

  todosModulosSeleccionados = computed(() =>
    this.modulos().length > 0 && this.seleccionModulos().length === this.modulos().length);

  configValida = computed(() => {
    if (!this.selEdicion() || this.generando()) return false;
    if (this.tipoInforme() === 'final') return true;
    return this.seleccionModulos().length > 0;
  });

  ngOnInit(): void {
    const edicionParam = this.route.snapshot.queryParamMap.get('edicion');
    const moduloParam = this.route.snapshot.queryParamMap.get('modulo');
    this.edicionParam = edicionParam ? Number(edicionParam) : null;
    this.moduloParam = moduloParam ? Number(moduloParam) : null;

    this.carreraService.getAll(true).pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: c => this.carreras.set(c),
    });

    this.programaService.getAll().pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: p => { this.programas.set(p.filter(x => x.estado === 'activo')); this.cargarVersionesYEdiciones(); },
      error: () => { this.cargandoInicio.set(false); this.errorInicio.set('Error al cargar programas'); },
    });
  }

  private edicionParam: number | null = null;
  private moduloParam: number | null = null;

  private cargarVersionesYEdiciones(): void {
    this.versionService.getAll().pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: vs => {
        this.versiones.set(vs);
        this.cargarEdiciones();
      },
      error: () => { this.cargandoInicio.set(false); this.errorInicio.set('Error al cargar versiones'); },
    });
  }

  private cargarEdiciones(): void {
    this.edicionService.getAll().pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: eds => {
        this.ediciones.set(eds);
        this.cargandoInicio.set(false);
        this.resolverAutoload();
      },
      error: () => { this.cargandoInicio.set(false); this.errorInicio.set('Error al cargar ediciones'); },
    });
  }

  private resolverAutoload(): void {
    const id = this.edicionParam;
    if (!id) return;
    const pve = this.ediciones().find(e => e.id_programa_version_edicion === id);
    if (!pve) return;
    this.selPrograma.set(pve.programa_version?.programa?.id_programa ?? null);
    this.selVersion.set(pve.id_programa_version);
    this.onEdicionChange(id);
  }

  onProgramaChange(): void {
    this.selVersion.set(null);
    this.selEdicion.set(null);
    this.resetEdicionDependencias();
  }

  onVersionChange(): void {
    this.selEdicion.set(null);
    this.resetEdicionDependencias();
  }

  private resetEdicionDependencias(): void {
    this.modulos.set([]);
    this.seleccionModulos.set([]);
    this.informes.set([]);
    this.verGenerados.set(false);
  }

  onEdicionChange(id: number): void {
    this.selEdicion.set(id);
    if (!id) { this.resetEdicionDependencias(); return; }
    this.cargandoModulos.set(true);
    this.modulos.set([]);
    this.seleccionModulos.set([]);
    this.informes.set([]);

    this.detalleService.getAll(id).pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: mods => {
        this.modulos.set(mods);
        this.cargandoModulos.set(false);

        if (this.moduloParam) {
          const target = mods.find(m => m.id_detalle_programa_modulo === this.moduloParam);
          this.seleccionModulos.set(target ? [target.id_detalle_programa_modulo] : mods.map(m => m.id_detalle_programa_modulo));
        } else {
          this.seleccionModulos.set(mods.map(m => m.id_detalle_programa_modulo));
        }
      },
      error: () => { this.cargandoModulos.set(false); },
    });

    this.informeService.porEdicion(id).pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: inf => this.informes.set(inf),
    });

    this.cargarElegibles();
  }

  private cargarElegibles(): void {
    const id = this.selEdicion();
    if (!id) { this.elegibles.set(null); return; }
    this.informeService.getElegibles(id).pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: res => this.elegibles.set(res.total_elegibles),
      error: () => this.elegibles.set(null),
    });
  }

  toggleModulo(id: number): void {
    const actual = this.seleccionModulos();
    this.seleccionModulos.set(
      actual.includes(id) ? actual.filter(x => x !== id) : [...actual, id],
    );
  }

  toggleTodosModulos(): void {
    this.seleccionModulos.set(
      this.todosModulosSeleccionados()
        ? []
        : this.modulos().map(m => m.id_detalle_programa_modulo),
    );
  }

  setTipo(tipo: 'parcial' | 'final'): void {
    this.tipoInforme.set(tipo);
    if (tipo === 'final') this.cargarElegibles();
  }

  private armarRequest(): any {
    return {
      id_programa_version_edicion: this.selEdicion(),
      tipo: this.tipoInforme(),
      id_modulos: this.seleccionModulos(),
      id_carrera: this.filtroCarrera(),
    };
  }

  verPreview(): void {
    if (!this.configValida()) return;
    this.informeService.preview(this.armarRequest()).pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: informe => {
        this.router.navigate(['/informes-notas/preview'], { state: { informe } });
      },
      error: err => this.snackBar.open(err.error?.detail || 'Error al armar la vista previa', 'Cerrar', { duration: 4000 }),
    });
  }

  generar(): void {
    if (!this.configValida()) return;

    const esFinal = this.tipoInforme() === 'final';
    const confirmar = () => {
      const msg = esFinal
        ? 'Se generará el informe final de la edición (único). Los alumnos elegibles recibirán certificado de notas.'
        : `Se generará el informe parcial con ${this.seleccionModulos().length} módulo(s). No se emitirán certificados.`;

      const ref = this.dialog.open(ConfirmDialogComponent, {
        width: '440px',
        data: {
          titulo: esFinal ? 'Generar Informe Final' : 'Generar Informe Parcial',
          mensaje: msg,
          confirmText: 'Generar',
        },
      });
      ref.afterClosed().pipe(takeUntilDestroyed(this.destroyRef)).subscribe(confirmado => {
        if (confirmado) this.ejecutarGeneracion();
      });
    };

    const finalExistente = esFinal && this.informes().some(i => i.tipo === 'final');
    if (finalExistente) {
      this.snackBar.open('El informe final de esta edición ya fue generado', 'Cerrar', { duration: 4000 });
      return;
    }
    confirmar();
  }

  private ejecutarGeneracion(): void {
    this.generando.set(true);
    this.informeService.generar(this.armarRequest()).pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: informe => {
        this.generando.set(false);
        this.snackBar.open(informe.tipo === 'final' ? 'Informe final generado' : 'Informe parcial generado', 'Cerrar', { duration: 3000 });
        this.router.navigate(['/informes-notas/preview'], { state: { informe } });
      },
      error: err => {
        this.generando.set(false);
        this.snackBar.open(err.error?.detail || 'Error al generar el informe', 'Cerrar', { duration: 4000 });
      },
    });
  }

  verInforme(informe: InformeNotas): void {
    this.router.navigate(['/informes-notas/preview'], { state: { informe } });
  }

  estadoLabel(estado: string): string {
    const map: Record<string, string> = {
      enviado: 'Enviado',
      finalizado: 'Finalizado',
      borrador: 'Borrador',
    };
    return map[estado] || estado;
  }
}