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

  informes = signal<InformeNotas[]>([]);

  cargandoInicio = signal(true);
  cargandoModulos = signal(false);
  generando = signal<'borrador' | 'final' | null>(null);
  errorInicio = signal<string | null>(null);

  versionesDelPrograma = computed(() =>
    this.versiones().filter(v => v.id_programa === this.selPrograma()));

  edicionesDeVersion = computed(() =>
    this.ediciones().filter(e => e.id_programa_version === this.selVersion()));

  edicionSel = computed(() =>
    this.ediciones().find(e => e.id_programa_version_edicion === this.selEdicion()) ?? null);

  todosModulosSeleccionados = computed(() =>
    this.modulos().length > 0 && this.seleccionModulos().length === this.modulos().length);

  edicionFinalizada = computed(() => this.edicionSel()?.estado === 'finalizado');

  borradorValido = computed(() =>
    !!this.selEdicion() && this.seleccionModulos().length > 0 && !this.generando());

  finalDisponible = computed(() => this.edicionFinalizada());

  mostrarConfig = signal(false);

  abrirConfig(): void {
    this.mostrarConfig.set(true);
  }

  cerrarConfig(): void {
    this.mostrarConfig.set(false);
  }

  tieneInformes = computed(() => this.informes().length > 0);

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
  }

  onEdicionChange(id: number): void {
    this.selEdicion.set(id);
    if (!id) { this.resetEdicionDependencias(); return; }
    this.cargandoModulos.set(true);
    this.modulos.set([]);
    this.seleccionModulos.set([]);
    this.informes.set([]);
    this.mostrarConfig.set(false);

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
      next: inf => {
        this.informes.set(inf);
        if (inf.length === 0) this.mostrarConfig.set(true);
      },
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

  private armarRequest(tipo: 'borrador' | 'final'): any {
    return {
      id_programa_version_edicion: this.selEdicion(),
      tipo,
      id_modulos: this.seleccionModulos(),
      id_carrera: this.filtroCarrera(),
    };
  }

  generarBorrador(): void {
    if (!this.borradorValido()) return;

    const ref = this.dialog.open(ConfirmDialogComponent, {
      width: '460px',
      data: {
        titulo: 'Generar Borrador',
        mensaje: `Se guardará un borrador con ${this.seleccionModulos().length} módulo(s). Quedará disponible para imprimir desde "Informes generados".`,
        confirmText: 'Generar borrador',
      },
    });
    ref.afterClosed().pipe(takeUntilDestroyed(this.destroyRef)).subscribe(confirmado => {
      if (confirmado) this.ejecutarGeneracion('borrador');
    });
  }

  generarFinal(): void {
    if (!this.selEdicion()) return;
    if (!this.edicionFinalizada()) {
      this.snackBar.open('El informe final requiere que la edición esté finalizada', 'Cerrar', { duration: 4000 });
      return;
    }

    const ref = this.dialog.open(ConfirmDialogComponent, {
      width: '480px',
      data: {
        titulo: 'Emitir informe final',
        mensaje: 'Se emitirá una tanda del informe final con TODOS los módulos de la edición. Cada alumno que cumple con la totalidad de notas y pagos recibirá su certificado. Quedará disponible para imprimir desde "Informes generados".',
        confirmText: 'Emitir informe final',
      },
    });
    ref.afterClosed().pipe(takeUntilDestroyed(this.destroyRef)).subscribe(confirmado => {
      if (confirmado) this.ejecutarGeneracion('final');
    });
  }

  private ejecutarGeneracion(tipo: 'borrador' | 'final'): void {
    this.generando.set(tipo);
    this.informeService.generar(this.armarRequest(tipo)).pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: informe => {
        this.generando.set(null);
        this.snackBar.open(tipo === 'final' ? 'Informe final emitido' : 'Borrador generado', 'Cerrar', { duration: 3000 });
        this.recargarInformes();
        this.router.navigate(['/informes-notas/preview'], { state: { informe } });
      },
      error: err => {
        this.generando.set(null);
        this.snackBar.open(err.error?.detail || 'Error al generar el informe', 'Cerrar', { duration: 4000 });
      },
    });
  }

  private recargarInformes(): void {
    const id = this.selEdicion();
    if (!id) return;
    this.informeService.porEdicion(id).pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: inf => this.informes.set(inf),
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