import { Component, OnInit, signal, computed, inject, DestroyRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { InformeNotasService } from '../../services/informe-notas.service';
import { NavigationBackService } from '../../../../core/navigation/navigation-back.service';
import {
  InformePreviewResponse, InformeNotas, InformeContenido, InformeCarrera,
  InformeModulo, InformeAlumnoNota, CertificadoNotasInfo, InformeMatrizFila,
} from '../../models/informe-notas.model';

@Component({
  selector: 'app-informe-preview',
  standalone: true,
  imports: [CommonModule, MatButtonModule, MatIconModule, MatSnackBarModule, MatProgressSpinnerModule],
  templateUrl: './informe-preview.html',
  styleUrl: './informe-preview.css',
})
export class InformePreviewComponent implements OnInit {
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private service = inject(InformeNotasService);
  private snackBar = inject(MatSnackBar);
  private destroyRef = inject(DestroyRef);
  private navBack = inject(NavigationBackService);

  data = signal<InformePreviewResponse | InformeNotas | null>(null);
  cargando = signal(false);
  certificados = signal<CertificadoNotasInfo[]>([]);

  esDefinitivo = computed(() => {
    const d = this.data();
    return !!d && ('id_informe' in d);
  });

  contenido = computed<InformeContenido | null>(() => {
    const d = this.data();
    if (!d) return null;
    const def = this.esDefinitivo() ? (d as InformeNotas).contenido : (d as InformePreviewResponse);
    return def as InformeContenido | null;
  });

  esBorrador = computed(() => {
    const d = this.data();
    return !!d && 'es_borrador' in d && (d as InformePreviewResponse).es_borrador;
  });

  numeroTanda = computed(() => {
    const d = this.data();
    if (!d) return 0;
    return 'numero_tanda' in d ? (d as any).numero_tanda : 0;
  });

  tituloEmision = computed(() => {
    const d = this.data();
    if (!d) return '';
    if (this.esDefinitivo()) {
      const informe = d as InformeNotas;
      const ts = informe.generado_at || null;
      return ts ? this.fmtTs(ts) : `Em. ${this.fmtDia(informe.fecha_emision)}`;
    }
    const prev = d as InformePreviewResponse;
    return this.fmtTs(prev.timestamp);
  });

  totalCertificados = computed(() => {
    const d = this.data();
    if (d && 'certificados_count' in d) return (d as InformeNotas).certificados_count;
    return this.certificados().length;
  });

  ngOnInit(): void {
    const nav = this.router.getCurrentNavigation();
    const stateData = nav?.extras?.state?.['informe'] ?? history.state?.['informe'];
    if (stateData) {
      this.data.set(stateData);
      this.cargarCertificadosSiCorresponde();
      return;
    }

    const idParam = Number(this.route.snapshot.queryParamMap.get('id'));
    if (idParam) {
      this.cargando.set(true);
      this.service.getInforme(idParam).pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
        next: informe => {
          this.data.set(informe);
          this.cargando.set(false);
          this.cargarCertificadosSiCorresponde();
        },
        error: () => {
          this.cargando.set(false);
          this.snackBar.open('Informe no encontrado', 'Cerrar', { duration: 3000 });
          this.router.navigate(['/informes-notas']);
        },
      });
      return;
    }

    this.router.navigate(['/informes-notas']);
  }

  private cargarCertificadosSiCorresponde(): void {
    const d = this.data();
    if (!d || !this.esDefinitivo()) return;
    const informe = d as InformeNotas;
    const esFinal = (informe.contenido?.tipo || informe.tipo) === 'final';
    if (!esFinal && informe.certificados_count === 0) return;

    this.service.getCertificadosPorInforme(informe.id_informe).pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: res => this.certificados.set(res.certificados),
      error: () => this.certificados.set([]),
    });
  }

  volver(): void {
    this.navBack.retornar(['/informes-notas'], {
      queryParams: { edicion: this.contenido()?.id_programa_version_edicion ?? undefined },
    });
  }

  imprimir(): void {
    window.print();
  }

  fmtDia(iso: string): string {
    if (!iso) return '—';
    const d = new Date(iso + 'T00:00:00');
    return `${String(d.getDate()).padStart(2, '0')}/${String(d.getMonth() + 1).padStart(2, '0')}/${d.getFullYear()}`;
  }

  fmtTs(iso: string | null): string {
    if (!iso) return '—';
    const d = new Date(iso);
    if (isNaN(d.getTime())) return '—';
    const h = String(d.getHours()).padStart(2, '0');
    const min = String(d.getMinutes()).padStart(2, '0');
    return `${this.fmtDia(d.toISOString().slice(0, 10))} ${h}:${min}`;
  }

  promedio(notas: (number | null)[]): number | null {
    const validas = notas.filter((n): n is number => n != null);
    if (validas.length === 0) return null;
    const suma = validas.reduce((a, b) => a + b, 0);
    return Math.floor(suma / validas.length + 0.5);
  }

  moduloDocente(mod: InformeModulo): string {
    return mod.docente || '—';
  }

  notaEstado(fila: InformeMatrizFila): string {
    if (!fila.notas.length) return 'Sin notas';
    return fila.aprobada ? 'Aprobado' : 'Reprobado';
  }
}