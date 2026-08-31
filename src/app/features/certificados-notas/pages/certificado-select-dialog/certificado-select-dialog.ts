import { Component, Inject, OnInit, signal, computed, inject, DestroyRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatDialogModule, MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { CertificadoService } from '../../services/certificado.service';
import {
  CertificadoElegibleAlumno,
  CertificadoSelGrupo,
} from '../../models/certificado.model';

export interface CertificadoSelectDialogData {
  id_programa_version_edicion: number;
}

@Component({
  selector: 'app-certificado-select-dialog',
  standalone: true,
  imports: [
    CommonModule, FormsModule,
    MatButtonModule, MatIconModule, MatCheckboxModule, MatTooltipModule,
    MatFormFieldModule, MatInputModule, MatProgressSpinnerModule,
    MatDialogModule, MatSnackBarModule,
  ],
  templateUrl: './certificado-select-dialog.html',
  styleUrl: './certificado-select-dialog.css',
})
export class CertificadoSelectDialogComponent implements OnInit {
  dialogRef = inject(MatDialogRef<CertificadoSelectDialogComponent>);
  private service = inject(CertificadoService);
  private snackBar = inject(MatSnackBar);
  private destroyRef = inject(DestroyRef);
  @Inject(MAT_DIALOG_DATA) data: CertificadoSelectDialogData = inject(MAT_DIALOG_DATA);

  alumnos = signal<CertificadoElegibleAlumno[]>([]);
  cargando = signal(true);
  emitiendo = signal(false);
  error = signal<string | null>(null);
  buscador = signal('');
  seleccion = signal<number[]>([]);

  grupos = computed<CertificadoSelGrupo[]>(() => {
    const sinEducContinua = this.alumnos().filter(a => !a.educacion_continua);
    const map = new Map<string, CertificadoSelGrupo>();
    for (const a of sinEducContinua) {
      const mod = a.modalidad || 'Sin modalidad';
      if (!map.has(mod)) map.set(mod, { modalidad: mod, alumnos: [] });
      map.get(mod)!.alumnos.push(a);
    }
    return [...map.values()].sort((x, y) => x.modalidad.localeCompare(y.modalidad, 'es'));
  });

  gruposFiltrados = computed(() => {
    const q = this.buscador().trim().toLowerCase();
    if (!q) return this.grupos();
    return this.grupos().map(g => ({
      ...g,
      alumnos: g.alumnos.filter(a =>
        `${a.apellido} ${a.nombre}`.toLowerCase().includes(q) ||
        (a.ci ?? '').toLowerCase().includes(q)),
    })).filter(g => g.alumnos.length > 0);
  });

  totalElegibles = computed(() =>
    this.alumnos().filter(a => !a.educacion_continua && a.elegible).length);

  seleccionadosElegibles = computed(() => this.seleccion().length);

  puedeEmitir = computed(() => this.seleccion().length > 0 && !this.emitiendo());

  ngOnInit(): void {
    this.service.elegibles(this.data.id_programa_version_edicion)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: res => {
          this.alumnos.set(res.alumnos);
          this.cargando.set(false);
        },
        error: err => {
          this.cargando.set(false);
          this.error.set(err.error?.detail || 'Error al cargar los alumnos elegibles');
        },
      });
  }

  toggle(id: number, checked: boolean): void {
    const actual = this.seleccion();
    this.seleccion.set(
      checked ? [...actual, id] : actual.filter(x => x !== id),
    );
  }

  toggleGrupo(g: CertificadoSelGrupo): void {
    const elegibles = g.alumnos.filter(a => a.elegible).map(a => a.id_alumno);
    const todosMarcados = elegibles.length > 0 && elegibles.every(id => this.seleccion().includes(id));
    const set = new Set(this.seleccion());
    if (todosMarcados) {
      elegibles.forEach(id => set.delete(id));
    } else {
      elegibles.forEach(id => set.add(id));
    }
    this.seleccion.set([...set]);
  }

  grupoCompleto(g: CertificadoSelGrupo): boolean {
    const elegibles = g.alumnos.filter(a => a.elegible);
    return elegibles.length > 0 && elegibles.every(a => this.seleccion().includes(a.id_alumno));
  }

  emitir(): void {
    if (!this.puedeEmitir()) return;
    this.emitiendo.set(true);
    this.service.emitir({
      id_programa_version_edicion: this.data.id_programa_version_edicion,
      alumnos_ids: this.seleccion(),
    }).pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: res => {
        this.emitiendo.set(false);
        const om = res.omitidos.length;
        const msg = `${res.emitidos.length} certificado(s) emitido(s)`
          + (om ? ` · ${om} omitido(s)` : '');
        this.snackBar.open(msg, 'Cerrar', { duration: 3500 });
        this.dialogRef.close(true);
      },
      error: err => {
        this.emitiendo.set(false);
        this.snackBar.open(err.error?.detail || 'Error al emitir certificados', 'Cerrar', { duration: 4000 });
      },
    });
  }
}