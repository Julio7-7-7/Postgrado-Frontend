import { Component, OnInit, signal, inject, computed, DestroyRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';

import { MatTableModule } from '@angular/material/table';
import { MatPaginatorModule, PageEvent } from '@angular/material/paginator';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBarModule, MatSnackBar } from '@angular/material/snack-bar';
import { MatChipsModule } from '@angular/material/chips';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';

import { PersonaService } from '../../services/persona.service';
import { Persona } from '../../models/persona.model';

@Component({
  selector: 'app-persona-list',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MatTableModule,
    MatPaginatorModule,
    MatButtonModule,
    MatIconModule,
    MatTooltipModule,
    MatFormFieldModule,
    MatInputModule,
    MatProgressSpinnerModule,
    MatSnackBarModule,
    MatChipsModule,
    MatSlideToggleModule,
  ],
  templateUrl: './persona-list.html',
  styleUrl: './persona-list.css'
})
export class PersonaListComponent implements OnInit {
  private service = inject(PersonaService);
  private snackbar = inject(MatSnackBar);
  private destroyRef = inject(DestroyRef);

  listaTotal = signal<Persona[]>([]);
  terminoBusqueda = signal('');
  filtroRol = signal<string>('');
  isLoading = signal(true);
  error = signal<string | null>(null);
  totalItems = signal(0);
  pageIndex = signal(0);
  pageSize = signal(20);

  columnas: string[] = ['nombre', 'email', 'ci', 'roles', 'perfiles', 'estado', 'acciones'];

  ngOnInit(): void {
    this.cargarDatos();
  }

  cargarDatos(): void {
    this.isLoading.set(true);
    this.error.set(null);

    this.service.getAll(
      this.terminoBusqueda() || undefined,
      this.filtroRol() || undefined,
      this.pageIndex() + 1,
      this.pageSize()
    ).pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: (data) => {
        this.listaTotal.set(data.items);
        this.totalItems.set(data.total);
        this.isLoading.set(false);
      },
      error: (err) => {
        console.error('Error al cargar personas:', err);
        this.error.set('No se pudo establecer conexión con el servidor.');
        this.isLoading.set(false);
        this.snackbar.open('Error al sincronizar datos', 'Cerrar', { duration: 4000 });
      }
    });
  }

  onSearch(): void {
    this.pageIndex.set(0);
    this.cargarDatos();
  }

  onFilterRol(rol: string): void {
    this.filtroRol.set(this.filtroRol() === rol ? '' : rol);
    this.pageIndex.set(0);
    this.cargarDatos();
  }

  onPageChange(event: PageEvent): void {
    this.pageIndex.set(event.pageIndex);
    this.pageSize.set(event.pageSize);
    this.cargarDatos();
  }

  toggleActivo(persona: Persona, event: Event): void {
    event.stopPropagation();
    this.service.actualizarRoles(persona.id_usuario, persona.roles.map(r => r.id_rol)).subscribe({
      next: () => {
        this.snackbar.open('Estado actualizado', 'OK', { duration: 2000 });
        this.cargarDatos();
      },
      error: (err) => {
        this.snackbar.open(err.error?.detail || 'Error al actualizar', 'Cerrar', { duration: 4000 });
      }
    });
  }

  getNombre(persona: Persona): string {
    if (persona.alumno) return `${persona.alumno.apellido} ${persona.alumno.nombre}`;
    if (persona.docente) return `${persona.docente.apellido} ${persona.docente.nombre}`;
    if (persona.administrativo) return `${persona.administrativo.apellido} ${persona.administrativo.nombre}`;
    return '---';
  }

  getCI(persona: Persona): string {
    if (persona.alumno?.ci) return persona.alumno.ci;
    if (persona.docente?.ci) return persona.docente.ci;
    if (persona.administrativo?.ci) return persona.administrativo.ci;
    return '---';
  }

  getIniciales(persona: Persona): string {
    const nombre = this.getNombre(persona);
    const partes = nombre.split(' ').filter(Boolean);
    if (partes.length >= 2) return (partes[0][0] + partes[1][0]).toUpperCase();
    return nombre.substring(0, 2).toUpperCase();
  }

  rolLabel(rol: string): string {
    const labels: Record<string, string> = {
      'adm_informatico': 'Info',
      'adm_legal': 'Legal',
      'adm_contable': 'Conta',
      'adm_director': 'Director',
      'adm_pasante': 'Pasante',
      'docente': 'Docente',
      'alumno': 'Alumno',
    };
    return labels[rol] || rol;
  }

  rolColor(rol: string): string {
    const colors: Record<string, string> = {
      'adm_informatico': '#7c3aed',
      'adm_legal': '#0369a1',
      'adm_contable': '#b45309',
      'adm_director': '#1e3a8a',
      'adm_pasante': '#64748b',
      'docente': '#0f766e',
      'alumno': '#0e7490',
    };
    return colors[rol] || '#64748b';
  }

  formatDate(dateStr: string): string {
    if (!dateStr) return '---';
    const d = new Date(dateStr);
    return d.toLocaleDateString('es-BO', { day: '2-digit', month: '2-digit', year: 'numeric' });
  }
}
