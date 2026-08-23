import { Component, OnInit, signal, inject, computed, DestroyRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';

import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatInputModule } from '@angular/material/input';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBarModule, MatSnackBar } from '@angular/material/snack-bar';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { MatDividerModule } from '@angular/material/divider';
import { MatBadgeModule } from '@angular/material/badge';

import { EtapaService } from '../../../contratacion/services/etapa.service';
import { EtapaContratacion, EtapaRequisitoAsignar } from '../../../contratacion/models/etapa.model';
import { RequisitoService } from '../../../requisitos/services/requisito.service';
import { RequisitoResponse } from '../../../requisitos/models/requisito.model';
import { ConfirmDialogComponent } from '../../../../shared/components/confirm-dialog/confirm-dialog';
import { MatDialog } from '@angular/material/dialog';
import { EtapaRequisitoInfo } from '../../../contratacion/models/etapa.model';

@Component({
  selector: 'app-ruta-documental',
  standalone: true,
  imports: [
    CommonModule, FormsModule,
    MatIconModule, MatButtonModule, MatInputModule, MatFormFieldModule,
    MatProgressSpinnerModule, MatSnackBarModule, MatTooltipModule,
    MatSlideToggleModule, MatDividerModule, MatBadgeModule,
  ],
  templateUrl: './ruta-documental.html',
  styleUrl: './ruta-documental.css',
})
export class RutaDocumentalComponent implements OnInit {
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private etapaService = inject(EtapaService);
  private requisitoService = inject(RequisitoService);
  private snackbar = inject(MatSnackBar);
  private destroyRef = inject(DestroyRef);
  private dialog = inject(MatDialog);

  tipoProgramaId = 0;
  tipoProgramaNombre = signal('');

  etapas = signal<EtapaContratacion[]>([]);
  todosRequisitos = signal<RequisitoResponse[]>([]);
  loading = signal(true);
  guardando = signal(false);

  etapaSeleccionadaId = signal<number | null>(null);
  etapaSeleccionada = computed(() => {
    const id = this.etapaSeleccionadaId();
    return this.etapas().find(e => e.id_etapa === id) ?? null;
  });

  nuevaEtapaNombre = signal('');
  editandoEtapaId = signal<number | null>(null);
  editandoEtapaNombre = signal('');

  busquedaRequisito = signal('');
  requisitosFiltrados = computed(() => {
    const term = this.busquedaRequisito().toLowerCase().trim();
    const todos = this.todosRequisitos();
    if (!term) return todos;
    return todos.filter(r => r.nombre.toLowerCase().includes(term));
  });

  asociadosIds = computed(() => {
    const etapa = this.etapaSeleccionada();
    if (!etapa) return new Set<number>();
    return new Set(etapa.requisitos.map(r => r.id_requisito));
  });

  noAsociados = computed(() => {
    const ids = this.asociadosIds();
    return this.requisitosFiltrados().filter(r => !ids.has(r.id_requisito));
  });

  ngOnInit(): void {
    this.tipoProgramaId = Number(this.route.snapshot.paramMap.get('id'));
    this.cargarDatos();
  }

  private cargarDatos(): void {
    this.loading.set(true);
    this.etapaService.getAll(this.tipoProgramaId).pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: (etapas) => {
        this.etapas.set(etapas.sort((a, b) => a.orden - b.orden));
        this.loading.set(false);
        if (etapas.length > 0 && !this.etapaSeleccionadaId()) {
          this.etapaSeleccionadaId.set(etapas[0].id_etapa);
        }
      },
      error: () => this.loading.set(false),
    });

    this.requisitoService.getAll().pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: (requisitos) => {
        this.todosRequisitos.set(requisitos.filter(r => r.estado === 'activo'));
        if (requisitos.length > 0) {
          this.tipoProgramaNombre.set('Tipo de Programa');
        }
      },
    });
  }

  seleccionarEtapa(id: number): void {
    this.etapaSeleccionadaId.set(id);
    this.busquedaRequisito.set('');
  }

  irAtras(): void {
    this.router.navigate(['/tipos-programa']);
  }

  agregarEtapa(): void {
    const nombre = this.nuevaEtapaNombre().trim();
    if (!nombre) return;

    this.guardando.set(true);
    this.etapaService.create({ id_tipo_programa: this.tipoProgramaId, nombre })
      .pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
        next: (etapa) => {
          this.etapas.update(e => [...e, etapa].sort((a, b) => a.orden - b.orden));
          this.nuevaEtapaNombre.set('');
          this.etapaSeleccionadaId.set(etapa.id_etapa);
          this.guardando.set(false);
          this.snackbar.open('Etapa creada', 'OK', { duration: 2000 });
        },
        error: (err) => {
          this.guardando.set(false);
          this.snackbar.open(err.error?.detail || 'Error al crear', 'Cerrar', { duration: 4000 });
        },
      });
  }

  iniciarEdicion(etapa: EtapaContratacion, event: Event): void {
    event.stopPropagation();
    this.editandoEtapaId.set(etapa.id_etapa);
    this.editandoEtapaNombre.set(etapa.nombre);
  }

  cancelarEdicion(): void {
    this.editandoEtapaId.set(null);
    this.editandoEtapaNombre.set('');
  }

  guardarEdicion(etapa: EtapaContratacion): void {
    const nombre = this.editandoEtapaNombre().trim();
    if (!nombre) return;

    this.guardando.set(true);
    this.etapaService.update(etapa.id_etapa, { nombre })
      .pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
        next: (actualizada) => {
          this.etapas.update(list => list.map(e => e.id_etapa === actualizada.id_etapa ? actualizada : e));
          this.cancelarEdicion();
          this.guardando.set(false);
          this.snackbar.open('Etapa actualizada', 'OK', { duration: 2000 });
        },
        error: (err) => {
          this.guardando.set(false);
          this.snackbar.open(err.error?.detail || 'Error', 'Cerrar', { duration: 4000 });
        },
      });
  }

  eliminarEtapa(etapa: EtapaContratacion, event: Event): void {
    event.stopPropagation();
    const dialogRef = this.dialog.open(ConfirmDialogComponent, {
      width: '420px',
      data: {
        titulo: 'Eliminar etapa',
        mensaje: `¿Eliminar la etapa "${etapa.nombre}"? Se desasociarán todos sus requisitos.`,
      },
    });

    dialogRef.afterClosed().pipe(takeUntilDestroyed(this.destroyRef)).subscribe(ok => {
      if (!ok) return;
      this.etapaService.delete(etapa.id_etapa).pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
        next: () => {
          this.etapas.update(list => list.filter(e => e.id_etapa !== etapa.id_etapa));
          if (this.etapaSeleccionadaId() === etapa.id_etapa) {
            const rest = this.etapas();
            this.etapaSeleccionadaId.set(rest.length > 0 ? rest[0].id_etapa : null);
          }
          this.snackbar.open('Etapa eliminada', 'OK', { duration: 2000 });
        },
        error: (err) => {
          this.snackbar.open(err.error?.detail || 'Error', 'Cerrar', { duration: 4000 });
        },
      });
    });
  }

  moverEtapa(etapa: EtapaContratacion, direccion: -1 | 1, event: Event): void {
    event.stopPropagation();
    const lista = [...this.etapas()];
    const idx = lista.findIndex(e => e.id_etapa === etapa.id_etapa);
    const targetIdx = idx + direccion;
    if (targetIdx < 0 || targetIdx >= lista.length) return;

    [lista[idx], lista[targetIdx]] = [lista[targetIdx], lista[idx]];
    const reorder = lista.map((e, i) => ({ ...e, orden: i + 1 }));
    this.etapas.set(reorder);

    const requisitos = reorder.map(e => ({
      id_etapa: e.id_etapa,
      orden: e.orden,
    }));

    // We don't have a bulk reorder endpoint, so we update each etapa's order
    this.guardando.set(true);
    let done = 0;
    for (const e of reorder) {
      this.etapaService.update(e.id_etapa, { nombre: e.nombre })
        .pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
          next: () => {
            done++;
            if (done === reorder.length) {
              this.guardando.set(false);
              this.cargarEtapas();
            }
          },
          error: () => {
            done++;
            if (done === reorder.length) {
              this.guardando.set(false);
              this.cargarEtapas();
            }
          },
        });
    }
  }

  private cargarEtapas(): void {
    this.etapaService.getAll(this.tipoProgramaId).pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: (etapas) => {
        this.etapas.set(etapas.sort((a, b) => a.orden - b.orden));
      },
    });
  }

  toggleRequisito(requisito: RequisitoResponse): void {
    const etapa = this.etapaSeleccionada();
    if (!etapa) return;

    const current = new Set(etapa.requisitos.map(r => r.id_requisito));
    let nuevos: EtapaRequisitoAsignar[];

    if (current.has(requisito.id_requisito)) {
      nuevos = etapa.requisitos
        .filter(r => r.id_requisito !== requisito.id_requisito)
        .map((r, i) => ({ id_requisito: r.id_requisito, orden: i + 1 }));
    } else {
      nuevos = [
        ...etapa.requisitos.map((r, i) => ({ id_requisito: r.id_requisito, orden: i + 1 })),
        { id_requisito: requisito.id_requisito, orden: etapa.requisitos.length + 1 },
      ];
    }

    this.guardarRequisitos(etapa.id_etapa, nuevos);
  }

  moverRequisito(requisito: EtapaRequisitoInfo, direccion: -1 | 1): void {
    const etapa = this.etapaSeleccionada();
    if (!etapa) return;

    const lista = [...etapa.requisitos];
    const idx = lista.findIndex(r => r.id_requisito === requisito.id_requisito);
    const targetIdx = idx + direccion;
    if (targetIdx < 0 || targetIdx >= lista.length) return;

    [lista[idx], lista[targetIdx]] = [lista[targetIdx], lista[idx]];
    const nuevos = lista.map((r, i) => ({ id_requisito: r.id_requisito, orden: i + 1 }));

    this.guardarRequisitos(etapa.id_etapa, nuevos);
  }

  private guardarRequisitos(etapaId: number, requisitos: EtapaRequisitoAsignar[]): void {
    this.guardando.set(true);
    this.etapaService.updateRequisitos(etapaId, requisitos)
      .pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
        next: (etapa) => {
          this.etapas.update(list => list.map(e => e.id_etapa === etapa.id_etapa ? etapa : e));
          this.guardando.set(false);
        },
        error: (err) => {
          this.guardando.set(false);
          this.snackbar.open(err.error?.detail || 'Error al guardar', 'Cerrar', { duration: 4000 });
          this.cargarEtapas();
        },
      });
  }
}
