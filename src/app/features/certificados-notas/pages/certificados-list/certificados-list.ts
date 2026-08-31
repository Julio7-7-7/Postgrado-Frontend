import { Component, OnInit, signal, computed, inject, DestroyRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';
import { MatChipsModule } from '@angular/material/chips';
import { MatInputModule } from '@angular/material/input';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { ProgramaService } from '../../../programa/services/programa.service';
import { ProgramaVersionService } from '../../../programa-version/services/programa-version.service';
import { EdicionService } from '../../../edicion/services/edicion.service';
import { CertificadoService } from '../../services/certificado.service';
import { CertificadoSelectDialogComponent } from '../certificado-select-dialog/certificado-select-dialog';
import { Programa } from '../../../programa/models/programa.model';
import { ProgramaVersion } from '../../../programa-version/models/programa-version.model';
import { ProgramaVersionEdicion } from '../../../edicion/models/edicion.model';
import { CertificadoNotas, CertificadoGrupo } from '../../models/certificado.model';
import { AuthService } from '../../../../core/services/auth.service';

@Component({
  selector: 'app-certificados-list',
  standalone: true,
  imports: [
    CommonModule, FormsModule,
    MatButtonModule, MatIconModule, MatTooltipModule,
    MatFormFieldModule, MatSelectModule, MatChipsModule, MatInputModule,
    MatProgressSpinnerModule, MatDialogModule, MatSnackBarModule,
  ],
  templateUrl: './certificados-list.html',
  styleUrl: './certificados-list.css',
})
export class CertificadosListComponent implements OnInit {
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private programaService = inject(ProgramaService);
  private versionService = inject(ProgramaVersionService);
  private edicionService = inject(EdicionService);
  private certService = inject(CertificadoService);
  private dialog = inject(MatDialog);
  private snackBar = inject(MatSnackBar);
  private destroyRef = inject(DestroyRef);
  private auth = inject(AuthService);

  puedeRegistrar = computed(() => this.auth.hasPermiso('pagos.registrar'));

  programas = signal<Programa[]>([]);
  versiones = signal<ProgramaVersion[]>([]);
  ediciones = signal<ProgramaVersionEdicion[]>([]);

  selPrograma = signal<number | null>(null);
  selVersion = signal<number | null>(null);
  selEdicion = signal<number | null>(null);

  certificados = signal<CertificadoNotas[]>([]);
  buscador = signal('');

  cargandoInicio = signal(true);
  cargando = signal(false);
  errorInicio = signal<string | null>(null);

  versionesDelPrograma = computed(() =>
    this.versiones().filter(v => v.id_programa === this.selPrograma()));

  edicionesDeVersion = computed(() =>
    this.ediciones().filter(e => e.id_programa_version === this.selVersion()));

  edicionSel = computed(() =>
    this.ediciones().find(e => e.id_programa_version_edicion === this.selEdicion()) ?? null);

  edicionFinalizada = computed(() => this.edicionSel()?.estado === 'finalizado');

  totalCertificados = computed(() => this.certificados().length);

  grupos = computed<CertificadoGrupo[]>(() => {
    const map = new Map<string, CertificadoGrupo>();
    for (const c of this.certificados()) {
      const modalidad = c.modalidad || 'Sin modalidad';
      const carrera = c.carrera || null;
      const clave = `${modalidad}##${carrera ?? ''}`;
      if (!map.has(clave)) {
        map.set(clave, { clave, modalidad, carrera, certificados: [] });
      }
      map.get(clave)!.certificados.push(c);
    }
    return [...map.values()].sort((a, b) => a.modalidad.localeCompare(b.modalidad, 'es'));
  });

  filtrados = computed(() => {
    const q = this.buscador().trim().toLowerCase();
    if (!q) return this.grupos();
    return this.grupos().map(g => ({
      ...g,
      certificados: g.certificados.filter(c => {
        const nombre = `${c.alumno?.apellido ?? ''} ${c.alumno?.nombre ?? ''}`.toLowerCase();
        const ci = (c.alumno?.ci ?? '').toLowerCase();
        const codigo = (c.codigo ?? '').toLowerCase();
        return nombre.includes(q) || ci.includes(q) || codigo.includes(q);
      }),
    })).filter(g => g.certificados.length > 0);
  });

  ngOnInit(): void {
    const edicionParam = this.route.snapshot.queryParamMap.get('edicion');
    this.edicionParam = edicionParam ? Number(edicionParam) : null;

    this.programaService.getAll().pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: p => { this.programas.set(p.filter(x => x.estado === 'activo')); this.cargarVersionesYEdiciones(); },
      error: () => { this.cargandoInicio.set(false); this.errorInicio.set('Error al cargar programas'); },
    });
  }

  private edicionParam: number | null = null;

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
    this.certificados.set([]);
  }

  onVersionChange(): void {
    this.selEdicion.set(null);
    this.certificados.set([]);
  }

  onEdicionChange(id: number): void {
    this.selEdicion.set(id);
    if (!id) { this.certificados.set([]); return; }
    this.cargando.set(true);
    this.certificados.set([]);
    this.certService.porEdicion(id).pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: certs => { this.certificados.set(certs); this.cargando.set(false); },
      error: () => { this.cargando.set(false); },
    });
  }

  abrirSelector(): void {
    const id = this.selEdicion();
    if (!id || !this.edicionFinalizada()) return;
    const ref = this.dialog.open(CertificadoSelectDialogComponent, {
      width: '640px',
      maxHeight: '86vh',
      data: { id_programa_version_edicion: id },
    });
    ref.afterClosed().pipe(takeUntilDestroyed(this.destroyRef)).subscribe(emitio => {
      if (emitio) this.onEdicionChange(id);
    });
  }

  verCertificado(cert: CertificadoNotas): void {
    this.router.navigate(['/certificados-notas/preview'], { queryParams: { id: cert.id_certificado } });
  }

  procedenciaLabel(p: string): string {
    return p === 'individual' ? 'Individual' : 'Informe final';
  }

  iniciales(cert: CertificadoNotas): string {
    const a = cert.alumno?.apellido || '';
    const n = cert.alumno?.nombre || '';
    return `${(a[0] || '').toUpperCase()}${(n[0] || '').toUpperCase()}`;
  }

  fmtDia(iso: string | null): string {
    if (!iso) return '—';
    const d = new Date(iso + 'T00:00:00');
    return `${String(d.getDate()).padStart(2, '0')}/${String(d.getMonth() + 1).padStart(2, '0')}/${d.getFullYear()}`;
  }
}