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
import { MatDividerModule } from '@angular/material/divider';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { PersonaService } from '../../../persona/services/persona.service';
import { ModalidadAcademicaService } from '../../../alumno/services/modalidad-academica.service';
import { TipoDescuentoService } from '../../../alumno/services/tipo-descuento.service';
import { DetalleProgramaAlumnoService } from '../../../alumno/services/detalle-programa-alumno.service';
import { EdicionService } from '../../../edicion/services/edicion.service';
import { InscripcionEdicionService } from '../../services/inscripcion-edicion.service';
import { CarreraService } from '../../../carreras/services/carrera.service';
import { Persona } from '../../../persona/models/persona.model';
import { ModalidadAcademica } from '../../../alumno/models/modalidad-academica.model';
import { TipoDescuento } from '../../../alumno/models/tipo-descuento.model';
import { Carrera } from '../../../carreras/models/carrera.model';
import { ProgramaVersionEdicion } from '../../../edicion/models/edicion.model';
import { environment } from '../../../../../environments/environment';
import { nombreCompleto } from '../../../../core/utils/nombre-utils';

const ITEMS_POR_PAGINA = 10;

@Component({
  selector: 'app-inscribir-alumno',
  standalone: true,
  imports: [
    CommonModule, FormsModule, RouterModule,
    MatCardModule, MatButtonModule, MatIconModule, MatFormFieldModule,
    MatInputModule, MatSelectModule, MatDividerModule, MatTooltipModule,
    MatProgressSpinnerModule, MatSnackBarModule,
  ],
  templateUrl: './inscribir-alumno.html',
  styleUrl: './inscribir-alumno.css',
})
export class InscribirAlumnoComponent implements OnInit {
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private personaService = inject(PersonaService);
  private modalidadService = inject(ModalidadAcademicaService);
  private descuentoService = inject(TipoDescuentoService);
  private detalleService = inject(DetalleProgramaAlumnoService);
  private edicionService = inject(EdicionService);
  private inscripcionService = inject(InscripcionEdicionService);
  private carreraService = inject(CarreraService);
  private snackBar = inject(MatSnackBar);
  private destroyRef = inject(DestroyRef);

  readonly ITEMS_POR_PAGINA = ITEMS_POR_PAGINA;

  nombreCompleto = nombreCompleto;

  edicion = signal<ProgramaVersionEdicion | null>(null);
  cargandoEdicion = signal(true);
  apiUrl = environment.apiUrl;

  currentStep = signal(1);

  allAlumnos = signal<Persona[]>([]);
  alumnosInscritosIds = signal<Set<number>>(new Set());
  busqueda = signal('');
  cargandoAlumnos = signal(true);
  paginaActual = signal(0);

  alumnoSeleccionado = signal<Persona | null>(null);
  creandoAlumno = signal(false);
  formAlumno = signal({
    email: '',
    ci: '',
    nombre: '',
    apellido: '',
    celular: '',
  });

  modalidades = signal<ModalidadAcademica[]>([]);
  tiposDescuento = signal<TipoDescuento[]>([]);
  carreras = signal<Carrera[]>([]);
  selectedModalidad = signal<number | null>(null);
  selectedDescuento = signal<number | null>(null);
  selectedCarrera = signal<number | null>(null);

  inscribiendo = signal(false);
  resultadoInscripcion = signal<any>(null);

  alumnosSorted = computed(() => {
    const all = this.allAlumnos();
    const inscritos = this.alumnosInscritosIds();
    const withStatus = all.map(p => ({
      persona: p,
      inscrito: p.alumno?.id_alumno != null && inscritos.has(p.alumno.id_alumno),
    }));
    withStatus.sort((a, b) => {
      if (a.inscrito !== b.inscrito) return a.inscrito ? 1 : -1;
      const na = a.persona.alumno;
      const nb = b.persona.alumno;
      const cmp = (na?.apellido || '').localeCompare(nb?.apellido || '', 'es');
      return cmp !== 0 ? cmp : (na?.nombre || '').localeCompare(nb?.nombre || '', 'es');
    });
    return withStatus;
  });

  alumnosVisibles = computed(() => {
    const q = this.busqueda().toLowerCase().trim();
    const sorted = this.alumnosSorted();
    if (q) {
      return sorted.filter(({ persona: p }) => {
        const a = p.alumno;
        if (!a) return false;
        return (
          a.nombre.toLowerCase().includes(q) ||
          a.apellido.toLowerCase().includes(q) ||
          (a.ci || '').toLowerCase().includes(q) ||
          p.email.toLowerCase().includes(q) ||
          `${a.nombre} ${a.apellido}`.toLowerCase().includes(q) ||
          `${a.apellido} ${a.nombre}`.toLowerCase().includes(q)
        );
      });
    }
    return sorted.filter(item => !item.inscrito);
  });

  totalPaginas = computed(() => Math.max(1, Math.ceil(this.alumnosVisibles().length / ITEMS_POR_PAGINA)));

  alumnosPaginados = computed(() => {
    const start = this.paginaActual() * ITEMS_POR_PAGINA;
    return this.alumnosVisibles().slice(start, start + ITEMS_POR_PAGINA);
  });

  paginasArr = computed(() => Array.from({ length: this.totalPaginas() }, (_, i) => i));

  esEnCurso = computed(() => this.edicion()?.estado === 'en_curso');

  descuentosDisponibles = computed(() => {
    const modId = this.selectedModalidad();
    if (!modId) return [];
    return this.tiposDescuento().filter(d =>
      d.modalidades?.some((m: any) => m.id_modalidad_academica === modId)
    );
  });

  modalidadSeleccionada = computed(() => {
    const modId = this.selectedModalidad();
    return this.modalidades().find(m => m.id_modalidad_academica === modId) ?? null;
  });

  esEducacionContinua = computed(() =>
    this.modalidadSeleccionada()?.nombre_modalidad.trim().toLowerCase() === 'educación continua'
  );

  pasaPaso2 = computed(() => {
    if (!this.selectedModalidad()) return false;
    if (this.esEducacionContinua() && !this.selectedCarrera()) return false;
    return true;
  });

  formAlumnoValido = computed(() => {
    const f = this.formAlumno();
    return f.email.includes('@') && f.ci.length >= 5 && f.nombre.length >= 2 && f.apellido.length >= 2;
  });

  ngOnInit() {
    const idEdicion = Number(this.route.snapshot.paramMap.get('idEdicion'));
    if (!idEdicion) {
      this.router.navigate(['/inscripciones']);
      return;
    }

    this.edicionService.getById(idEdicion).pipe(
      takeUntilDestroyed(this.destroyRef),
    ).subscribe({
      next: (edicion) => {
        this.edicion.set(edicion);
        this.cargandoEdicion.set(false);
        this.cargarModalidades();
        this.cargarInscritos();
      },
      error: () => {
        this.snackBar.open('Edición no encontrada', 'Cerrar', { duration: 3000 });
        this.router.navigate(['/inscripciones']);
      },
    });

    this.cargarAlumnos();
    this.cargarCarreras();
  }

  cargarCarreras() {
    this.carreraService.getAll(true).pipe(
      takeUntilDestroyed(this.destroyRef),
    ).subscribe({
      next: carreras => this.carreras.set(carreras),
    });
  }

  cargarAlumnos() {
    this.cargandoAlumnos.set(true);
    this.personaService.getAll(undefined, 'alumno', 1, 100).pipe(
      takeUntilDestroyed(this.destroyRef),
    ).subscribe({
      next: (res) => {
        this.allAlumnos.set(res.items);
        this.cargandoAlumnos.set(false);
      },
      error: () => {
        this.cargandoAlumnos.set(false);
      },
    });
  }

  cargarInscritos() {
    const idEd = this.edicion()?.id_programa_version_edicion;
    if (!idEd) return;
    this.inscripcionService.getPorEdicion(idEd, 1, 500).pipe(
      takeUntilDestroyed(this.destroyRef),
    ).subscribe({
      next: (res) => {
        const ids = new Set<number>();
        for (const item of res.items) {
          ids.add(item.alumno.id_alumno);
        }
        this.alumnosInscritosIds.set(ids);
      },
    });
  }

  cargarModalidades() {
    const ed = this.edicion();
    if (!ed) return;
    const idTipoPrograma = ed.programa_version?.programa?.id_tipo_programa;
    this.modalidadService.getAll(idTipoPrograma).pipe(
      takeUntilDestroyed(this.destroyRef),
    ).subscribe(m => this.modalidades.set(m));

    this.descuentoService.getAll(idTipoPrograma).pipe(
      takeUntilDestroyed(this.destroyRef),
    ).subscribe(d => this.tiposDescuento.set(d));
  }

  onBusqueda(valor: string) {
    this.busqueda.set(valor);
    this.paginaActual.set(0);
  }

  irAPagina(p: number) {
    this.paginaActual.set(Math.max(0, Math.min(p, this.totalPaginas() - 1)));
  }

  seleccionarAlumno(persona: Persona) {
    this.alumnoSeleccionado.set(persona);
    this.currentStep.set(2);
    this.selectedModalidad.set(null);
    this.selectedDescuento.set(null);
    this.selectedCarrera.set(null);
  }

  abrirCrearAlumno() {
    this.creandoAlumno.set(true);
    const q = this.busqueda().trim();
    if (q.length >= 2) {
      const parts = q.split(' ');
      this.formAlumno.set({
        email: '',
        ci: '',
        nombre: parts[0] || '',
        apellido: parts.slice(1).join(' ') || '',
        celular: '',
      });
    }
  }

  cancelarCrearAlumno() {
    this.creandoAlumno.set(false);
  }

  crearAlumno() {
    if (!this.formAlumnoValido()) return;
    const f = this.formAlumno();
    this.detalleService.crearConUsuario({
      email: f.email,
      ci: f.ci,
      nombre: f.nombre,
      apellido: f.apellido,
      celular: f.celular || undefined,
    }).pipe(
      takeUntilDestroyed(this.destroyRef),
    ).subscribe({
      next: (res) => {
        const persona: Persona = {
          id_usuario: res.id_usuario,
          email: res.email,
          alumno: res.perfiles?.find((p: any) => p.type === 'alumno') || null,
        } as Persona;
        this.cargarAlumnos();
        this.alumnoSeleccionado.set(persona);
        this.creandoAlumno.set(false);
        this.currentStep.set(2);
        this.snackBar.open(
          `Alumno creado. Password inicial: ${res.password_inicial}`,
          'Cerrar',
          { duration: 8000 },
        );
      },
      error: (err) => {
        this.snackBar.open(err.error?.detail || 'Error al crear alumno', 'Cerrar', { duration: 4000 });
      },
    });
  }

  volverAPaso1() {
    this.currentStep.set(1);
    this.alumnoSeleccionado.set(null);
    this.selectedModalidad.set(null);
    this.selectedDescuento.set(null);
    this.selectedCarrera.set(null);
  }

  inscribir() {
    const ed = this.edicion();
    const alumno = this.alumnoSeleccionado();
    if (!ed || !alumno || !this.selectedModalidad()) return;

    const idAlumno = alumno.alumno?.id_alumno;
    if (!idAlumno) {
      this.snackBar.open('El alumno seleccionado no tiene perfil de estudiante', 'Cerrar', { duration: 3000 });
      return;
    }

    if (this.esEducacionContinua() && !this.selectedCarrera()) {
      this.snackBar.open('Debe seleccionar la carrera de origen', 'Cerrar', { duration: 3000 });
      return;
    }

    this.inscribiendo.set(true);

    const data: any = {
      id_alumno: idAlumno,
      id_programa_version_edicion: ed.id_programa_version_edicion,
      id_modalidad_academica: this.selectedModalidad(),
    };
    if (this.selectedDescuento()) {
      data.id_tipo_descuento = this.selectedDescuento();
    }
    if (this.esEducacionContinua()) {
      data.id_carrera = this.selectedCarrera();
    }

    this.detalleService.inscribirAdmin(data).pipe(
      takeUntilDestroyed(this.destroyRef),
    ).subscribe({
      next: (res) => {
        this.resultadoInscripcion.set(res);
        this.inscribiendo.set(false);
        this.currentStep.set(4);
        this.snackBar.open('Inscripción registrada exitosamente', 'Cerrar', { duration: 3000 });
      },
      error: (err) => {
        this.inscribiendo.set(false);
        this.snackBar.open(err.error?.detail || 'Error al inscribir', 'Cerrar', { duration: 4000 });
      },
    });
  }

  irAEdition() {
    const ed = this.edicion();
    if (ed) {
      this.router.navigate(['/inscripciones', ed.id_programa_version_edicion]);
    }
  }

  irANuevaInscripcion() {
    this.currentStep.set(1);
    this.alumnoSeleccionado.set(null);
    this.selectedModalidad.set(null);
    this.selectedDescuento.set(null);
    this.selectedCarrera.set(null);
    this.resultadoInscripcion.set(null);
    this.busqueda.set('');
    this.paginaActual.set(0);
  }

  getNombreAlumno(): string {
    const a = this.alumnoSeleccionado();
    if (!a) return '';
    if (a.alumno) return `${a.alumno.nombre} ${a.alumno.apellido}`;
    if (a.docente) return `${a.docente.nombre} ${a.docente.apellido}`;
    if (a.administrativo) return `${a.administrativo.nombre} ${a.administrativo.apellido}`;
    return a.email || '';
  }

  getCiAlumno(): string {
    const a = this.alumnoSeleccionado();
    if (!a) return '';
    return a.alumno?.ci || a.docente?.ci || a.administrativo?.ci || '';
  }

  getEmailAlumno(): string {
    const a = this.alumnoSeleccionado();
    if (!a) return '';
    return a.email || '';
  }

  getNombrePrograma(): string {
    return this.edicion()?.programa_version?.programa?.nombre_programa || '';
  }

  getEdicionTexto(): string {
    const ed = this.edicion();
    if (!ed) return '';
    return `Ed. ${ed.edicion} · ${ed.anio} · Sem. ${ed.semestre}`;
  }

  getPrecioModalidad(): string {
    const ed = this.edicion();
    if (ed?.precio) return `Bs ${ed.precio}`;
    return 'Consultar';
  }
}
