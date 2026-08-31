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
  InformeNotas, InformeContenido, CertificadoNotasInfo, InformeMatrizFila,
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

  data = signal<InformeNotas | null>(null);
  cargando = signal(false);
  certificados = signal<CertificadoNotasInfo[]>([]);

  esBorrador = computed(() => {
    const d = this.data();
    if (!d) return false;
    return (d.contenido?.tipo || d.tipo) === 'borrador';
  });

  contenido = computed<InformeContenido | null>(() => {
    const d = this.data();
    return d?.contenido ?? null;
  });

  numeroTanda = computed(() => this.data()?.numero_tanda ?? 0);

  tituloEmision = computed(() => {
    const d = this.data();
    if (!d) return '';
    const ts = d.generado_at || null;
    return ts ? this.fmtTs(ts) : `Em. ${this.fmtDia(d.fecha_emision)}`;
  });

  emitidoPor = computed(() => this.data()?.emitido_por_nombre ?? null);

  totalCertificados = computed(() => this.data()?.certificados_count ?? this.certificados().length);

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
    if (!d) return;
    const esFinal = (d.contenido?.tipo || d.tipo) === 'final';
    if (!esFinal) return;

    this.service.getCertificadosPorInforme(d.id_informe).pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
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

  estadoClass(estado: string): string {
    const ok = ['Completo', 'completo'];
    if (ok.includes(estado)) return 'est-completo';
    if (estado === 'Notas pendientes') return 'est-pendiente';
    if (estado === 'Notas reprobadas') return 'est-reprobado';
    if (estado === 'Pagos incompletos') return 'est-pagos';
    if (estado === 'Con certificado previo') return 'est-previo';
    if (estado === 'Retirado') return 'est-retirado';
    return 'est-otro';
  }

  estadoNotasClass(estado: string): string {
    if (estado === 'Aprobadas') return 'est-completo';
    if (estado === 'Reprobadas') return 'est-reprobado';
    if (estado === 'Retirado') return 'est-retirado';
    return 'est-pendiente';
  }

  estadoPagosClass(estado: string): string {
    if (estado === 'Completo') return 'est-completo';
    if (estado === 'Retirado') return 'est-retirado';
    return 'est-pagos';
  }

  estadoTooltip(fila: InformeMatrizFila): string {
    if (fila.estado === 'Completo') {
      return 'Completo: todas las notas aprobadas y pagos al día. Elegible para certificado.';
    }
    if (fila.estado === 'Con certificado previo') {
      return 'Ya cuenta con certificado emitido para esta edición.';
    }
    return fila.estado;
  }
}