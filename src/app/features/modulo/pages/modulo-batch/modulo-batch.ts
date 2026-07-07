import { Component, OnInit, signal, inject, DestroyRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatSnackBarModule, MatSnackBar } from '@angular/material/snack-bar';
import { MatTooltipModule } from '@angular/material/tooltip';
import { ModuloService } from '../../services/modulo.service';
import { ProgramaVersionService } from '../../../programa-version/services/programa-version.service';
import { ModuloCreate } from '../../models/modulo.model';
import { concatMap, from, of } from 'rxjs';

@Component({
  selector: 'app-modulo-batch',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatButtonModule,
    MatCardModule,
    MatIconModule,
    MatSnackBarModule,
    MatTooltipModule,
  ],
  templateUrl: './modulo-batch.html',
  styleUrl: './modulo-batch.css',
})
export class ModuloBatchComponent implements OnInit {
  private fb = inject(FormBuilder);
  private moduloService = inject(ModuloService);
  private versionService = inject(ProgramaVersionService);
  private router = inject(Router);
  private snackbar = inject(MatSnackBar);
  private destroyRef = inject(DestroyRef);

  idPrograma = signal<number>(0);
  idVersion = signal<number>(0);
  infoVersion = signal('');
  formularios = signal<FormGroup[]>([]);
  guardando = signal(false);
  errorVersion = signal(false);

  ngOnInit(): void {
    const match = this.router.url.match(/\/versiones\/(\d+)\/modulos/);
    if (!match) {
      this.snackbar.open('Versión no especificada', 'Cerrar', { duration: 4000 });
      this.router.navigate(['/programas']);
      return;
    }
    this.idVersion.set(+match[1]);

    const progMatch = this.router.url.match(/\/programas\/(\d+)\/versiones/);
    this.idPrograma.set(progMatch ? +progMatch[1] : 0);

    this.cargarVersion(this.idVersion());
    this.agregarFormulario();
  }

  modulosExistentes = signal(0);

  private cargarVersion(id: number) {
    this.versionService.getById(id).pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: (data) => {
        this.infoVersion.set(`${data.programa.nombre_programa} — V${data.version}`);
        if (data.ediciones_count > 0) {
          this.snackbar.open('Esta versión ya tiene ediciones registradas. No es posible añadir nuevos módulos.', 'Cerrar', { duration: 5000 });
          this.errorVersion.set(true);
        }
      },
      error: () => {
        this.snackbar.open('Error al cargar la versión', 'Cerrar', { duration: 4000 });
        this.errorVersion.set(true);
      },
    });

    this.moduloService.getAll(id).pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: (data) => {
        this.modulosExistentes.set(data.length);
      },
    });
  }

  crearFormulario(): FormGroup {
    return this.fb.group({
      sigla: ['', [Validators.required, Validators.maxLength(20)]],
      nombre_modulo: ['', [Validators.required, Validators.minLength(3), Validators.maxLength(200)]],
      horas_academicas: [null, [Validators.required, Validators.min(1)]],
      creditos: [null, [Validators.required, Validators.min(1)]],
      descripcion: ['', [Validators.maxLength(500)]],
      estado: ['activo'],
    });
  }

  agregarFormulario(): void {
    this.formularios.update(lista => [...lista, this.crearFormulario()]);
  }

  eliminarFormulario(index: number): void {
    this.formularios.update(lista => lista.filter((_, i) => i !== index));
  }

  fc(form: FormGroup, field: string) {
    return form.get(field) as import('@angular/forms').FormControl;
  }

  formularioValido(index: number): boolean {
    return this.formularios()[index].valid;
  }

  get puedeGuardar(): boolean {
    return this.formularios().length > 0
      && this.formularios().every(f => f.valid)
      && !this.guardando()
      && !this.errorVersion();
  }

  guardarTodo(): void {
    if (!this.puedeGuardar) return;

    this.guardando.set(true);
    const forms = this.formularios();
    const total = forms.length;
    let exitosos = 0;

    const peticiones = forms.map((form, i) => {
      const datos: ModuloCreate = {
        ...form.value,
        id_programa_version: this.idVersion(),
      };
      return { datos, index: i };
    });

    from(peticiones).pipe(
      concatMap(({ datos, index }) =>
        this.moduloService.create(datos).pipe(
          concatMap(() => {
            exitosos++;
            const numAbs = this.modulosExistentes() + exitosos;
            this.snackbar.open(`Módulo #${numAbs} creado (${exitosos}/${total})`, 'OK', { duration: 2000 });
            return of(null);
          })
        )
      )
    ).pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      error: (err) => {
        this.guardando.set(false);
        this.snackbar.open(
          `Error en el módulo #${this.modulosExistentes() + exitosos + 1}: ${err.error?.detail || err.message || 'Error desconocido'}`,
          'Cerrar',
          { duration: 8000 }
        );
      },
      complete: () => {
        this.guardando.set(false);
        const primero = this.modulosExistentes() + 1;
        const ultimo = this.modulosExistentes() + total;
        this.snackbar.open(`Módulos #${primero}–#${ultimo} creados con éxito`, 'OK', { duration: 4000 });
        this.router.navigate(
          ['/programas', this.idPrograma(), 'versiones', this.idVersion(), 'modulos'],
          { replaceUrl: true }
        );
      },
    });
  }

  volverALista(): void {
    const idx = this.router.url.indexOf('/modulos');
    if (idx !== -1) {
      this.router.navigateByUrl(this.router.url.substring(0, idx + '/modulos'.length));
    } else {
      this.router.navigate(['/programas']);
    }
  }
}
