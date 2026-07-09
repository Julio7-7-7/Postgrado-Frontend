import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule } from '@angular/material/core';
import { MatDividerModule } from '@angular/material/divider';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { AlumnoService } from '../../services/alumno.service';
import { EdicionService } from '../../../edicion/services/edicion.service';
import { ModalidadAcademicaService } from '../../services/modalidad-academica.service';
import { TipoDescuentoService } from '../../services/tipo-descuento.service';
import { DetalleProgramaAlumnoService } from '../../services/detalle-programa-alumno.service';
import { Alumno, AlumnoUpdate, GeneroAlumno } from '../../models/alumno.model';
import { ModalidadAcademica } from '../../models/modalidad-academica.model';
import { TipoDescuento } from '../../models/tipo-descuento.model';
import { ProgramaVersionEdicion } from '../../../edicion/models/edicion.model';
import { environment } from '../../../../../environments/environment';

@Component({
  selector: 'app-inscribir',
  standalone: true,
  imports: [
    CommonModule, FormsModule, RouterModule,
    MatCardModule, MatButtonModule, MatIconModule, MatFormFieldModule,
    MatInputModule, MatSelectModule, MatDatepickerModule, MatNativeDateModule,
    MatDividerModule, MatSnackBarModule,
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

  // state
  edicion = signal<ProgramaVersionEdicion | null>(null);
  alumno = signal<Alumno | null>(null);
  modalidades = signal<ModalidadAcademica[]>([]);
  tiposDescuento = signal<TipoDescuento[]>([]);
  cargando = signal(true);
  guardando = signal(false);
  formTocado = signal(false);

  // form fields
  editData: AlumnoUpdate = {};
  selectedModalidad = signal<number | null>(null);
  selectedDescuento = signal<number | null>(null);

  generos: GeneroAlumno[] = ['masculino', 'femenino', 'otro'];
  apiUrl = environment.apiUrl;

  ngOnInit(): void {
    const id = Number(this.route.snapshot.paramMap.get('id'));
    if (!id) {
      this.snackBar.open('Edición no válida', 'Cerrar', { duration: 3000 });
      this.router.navigate(['/alumnos']);
      return;
    }
    this._cargarDatos(id);
  }

  private _cargarDatos(id: number): void {
    this.edicionService.getById(id).subscribe({
      next: (ed) => this.edicion.set(ed),
      error: () => {
        this.cargando.set(false);
        this.snackBar.open('Error al cargar programa', 'Cerrar', { duration: 4000 });
      },
    });

    this.alumnoService.getMiPerfil().subscribe({
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
      error: () => this.snackBar.open('Error al cargar perfil', 'Cerrar', { duration: 4000 }),
    });

    this.modalidadService.getAll().subscribe({
      next: (mods) => this.modalidades.set(mods.filter(m => m.estado === 'activo')),
    });

    this.descuentoService.getAll().subscribe({
      next: (desc) => this.tiposDescuento.set(desc.filter(d => d.estado === 'activo')),
    });

    this.cargando.set(false);
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

    const perfilActual = this.alumno();
    const hayCambios = perfilActual && (
      perfilActual.nombre !== this.editData.nombre ||
      perfilActual.apellido !== this.editData.apellido ||
      perfilActual.correo !== this.editData.correo ||
      perfilActual.ci !== this.editData.ci ||
      perfilActual.pasaporte !== this.editData.pasaporte ||
      perfilActual.fecha_nacimiento !== this.editData.fecha_nacimiento ||
      perfilActual.genero !== this.editData.genero ||
      perfilActual.celular !== this.editData.celular ||
      perfilActual.direccion !== this.editData.direccion
    );

    const actualizar$ = hayCambios
      ? this.alumnoService.actualizarMiPerfil(this.editData)
      : undefined;

    if (actualizar$) {
      actualizar$.subscribe({
        next: () => this._confirmarInscripcion(ed),
        error: (err) => {
          this.guardando.set(false);
          const msg = err.error?.detail || 'Error al guardar datos personales';
          this.snackBar.open(msg, 'Cerrar', { duration: 4000 });
        },
      });
    } else {
      this._confirmarInscripcion(ed);
    }
  }

  private _confirmarInscripcion(ed: ProgramaVersionEdicion): void {
    this.detalleService.autoInscribir({
      id_programa_version_edicion: ed.id_programa_version_edicion,
      id_modalidad_academica: this.selectedModalidad()!,
      id_tipo_descuento: this.selectedDescuento(),
    }).subscribe({
      next: () => {
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
