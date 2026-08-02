import { Component, OnInit, signal, computed, inject, DestroyRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { InscripcionEdicionService } from '../../services/inscripcion-edicion.service';
import { InscripcionEdicionItem } from '../../models/inscripcion-edicion.model';
import { SortDir, sortItems } from '../../../../core/utils/sort-utils';

@Component({
  selector: 'app-inscripciones-edicion',
  standalone: true,
  imports: [
    CommonModule, FormsModule,
    MatIconModule, MatButtonModule, MatTooltipModule,
    MatProgressSpinnerModule, MatFormFieldModule, MatInputModule,
    MatSnackBarModule,
  ],
  templateUrl: './inscripcion-edicion.html',
  styleUrl: './inscripcion-edicion.css',
})
export class InscripcionesEdicionComponent implements OnInit {
  private service = inject(InscripcionEdicionService);
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private snackbar = inject(MatSnackBar);
  private destroyRef = inject(DestroyRef);

  allItems = signal<InscripcionEdicionItem[]>([]);
  items = signal<InscripcionEdicionItem[]>([]);
  isLoading = signal(true);

  filtroEstado = signal<string>('');
  busqueda = signal('');
  sortKey = signal<string>('alumno');
  sortDir = signal<SortDir>('asc');

  sortableKeys = ['alumno', 'ci', 'estado', 'modalidad', 'docs', 'modulo', 'descuento'];

  estados = [
    { codigo: 'postulante', label: 'postulantes' },
    { codigo: 'observado', label: 'observados' },
    { codigo: 'inscrito', label: 'inscritos' },
    { codigo: 'incorporado', label: 'incorporados' },
    { codigo: 'finalizado', label: 'finalizados' },
    { codigo: 'graduado', label: 'graduados' },
    { codigo: 'retirado', label: 'retirados' },
  ];

  page = signal(0);
  perPage = signal(20);
  perPageOptions = [10, 20, 50, 100];

  total = computed(() => this.items().length);
  totalPages = computed(() => Math.max(1, Math.ceil(this.items().length / this.perPage())));
  sortedItems = computed(() => this.sortItemsBy(this.items()));
  paginatedItems = computed(() => {
    const start = this.page() * this.perPage();
    return this.sortedItems().slice(start, start + this.perPage());
  });
  startIndex = computed(() => this.items().length === 0 ? 0 : this.page() * this.perPage() + 1);
  endIndex = computed(() => Math.min((this.page() + 1) * this.perPage(), this.items().length));
  pagesArr = computed(() => Array.from({ length: this.totalPages() }, (_, i) => i));

  countPorEstado = computed(() => {
    const counts: Record<string, number> = {};
    for (const item of this.allItems()) {
      counts[item.estado] = (counts[item.estado] || 0) + 1;
    }
    return counts;
  });

  idEdicion = 0;

  ngOnInit(): void {
    this.idEdicion = Number(this.route.snapshot.paramMap.get('idEdicion'));
    if (!this.idEdicion) {
      this.router.navigate(['/admin/inscripciones']);
      return;
    }
    this.cargarDatos();
  }

  cargarDatos(): void {
    this.isLoading.set(true);
    this.service.getPorEdicion(this.idEdicion, 1, 500)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: data => {
          this.allItems.set(data.items);
          this.aplicarFiltros();
          this.isLoading.set(false);
        },
        error: () => {
          this.isLoading.set(false);
          this.snackbar.open('Error al cargar inscripciones', 'Cerrar', { duration: 3000 });
        },
      });
  }

  sortItemsBy(items: InscripcionEdicionItem[]): InscripcionEdicionItem[] {
    const key = this.sortKey();
    const dir = this.sortDir();
    const accessors: Record<string, (i: InscripcionEdicionItem) => unknown> = {
      alumno: i => `${i.alumno.apellido} ${i.alumno.nombre}`,
      ci: i => i.alumno.ci || '',
      estado: i => i.estado,
      modalidad: i => i.modalidad,
      docs: i => (i.docs_total > 0 ? i.docs_completados / i.docs_total : -1),
      modulo: i => i.modulo_inicio,
      descuento: i => i.descuento_aplicado,
    };
    return sortItems(items, accessors[key] || accessors['alumno'], dir);
  }

  onSort(key: string): void {
    if (this.sortKey() === key) {
      this.sortDir.set(this.sortDir() === 'asc' ? 'desc' : 'asc');
    } else {
      this.sortKey.set(key);
      this.sortDir.set('asc');
    }
    this.page.set(0);
  }

  sortIcon(key: string): string {
    if (this.sortKey() !== key) return 'unfold_more';
    return this.sortDir() === 'asc' ? 'arrow_upward' : 'arrow_downward';
  }

  aplicarFiltros(): void {
    let result = this.allItems();
    const estado = this.filtroEstado();
    const busqueda = this.busqueda().trim().toLowerCase();
    if (estado) result = result.filter(i => i.estado === estado);
    if (busqueda) {
      result = result.filter(i =>
        i.alumno.nombre.toLowerCase().includes(busqueda) ||
        i.alumno.apellido.toLowerCase().includes(busqueda) ||
        (i.alumno.ci || '').toLowerCase().includes(busqueda) ||
        (i.alumno.correo || '').toLowerCase().includes(busqueda)
      );
    }
    this.items.set(result);
    this.page.set(0);
  }

  onBusqueda(value: string): void {
    this.busqueda.set(value);
    this.aplicarFiltros();
  }

  onFiltroEstado(value: string): void {
    this.filtroEstado.set(this.filtroEstado() === value ? '' : value);
    this.aplicarFiltros();
  }

  limpiarFiltros(): void {
    this.filtroEstado.set('');
    this.busqueda.set('');
    this.aplicarFiltros();
  }

  nextPage(): void {
    if (this.page() < this.totalPages() - 1) this.page.update(p => p + 1);
  }

  prevPage(): void {
    if (this.page() > 0) this.page.update(p => p - 1);
  }

  cambiarPerPage(n: number): void {
    this.perPage.set(n);
    this.page.set(0);
  }

  volver(): void {
    this.router.navigate(['/admin/inscripciones']);
  }

  iniciales(item: InscripcionEdicionItem): string {
    return (item.alumno.nombre[0] + item.alumno.apellido[0]).toUpperCase();
  }

  estadoClass(estado: string): string {
    const map: Record<string, string> = {
      postulante: 'estado-postulante',
      observado: 'estado-observado',
      inscrito: 'estado-inscrito',
      incorporado: 'estado-incorporado',
      finalizado: 'estado-finalizado',
      retirado: 'estado-retirado',
      graduado: 'estado-graduado',
    };
    return map[estado] || '';
  }

  chipClass(estado: string): string {
    return 'chip-' + estado;
  }

  estadoLabel(estado: string): string {
    const map: Record<string, string> = {
      postulante: 'Postulante',
      observado: 'Observado',
      inscrito: 'Inscrito',
      incorporado: 'Incorporado',
      finalizado: 'Finalizado',
      retirado: 'Retirado',
      graduado: 'Graduado',
    };
    return map[estado] || estado;
  }

  estadoIcon(estado: string): string {
    const map: Record<string, string> = {
      postulante: 'assignment_ind',
      observado: 'report_problem',
      inscrito: 'how_to_reg',
      incorporado: 'swap_horiz',
      finalizado: 'flag',
      retirado: 'person_remove',
      graduado: 'school',
    };
    return map[estado] || 'circle';
  }

  verTranscript(item: InscripcionEdicionItem): void {
    this.router.navigate(['/admin/transcript', item.alumno.id_alumno]);
  }
}
