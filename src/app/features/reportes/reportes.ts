import {
  Component,
  signal,
  computed,
  inject,
  OnInit,
  ChangeDetectionStrategy,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { VentasService } from '@core/services/ventas.service';
import { AjusteConVenta } from '@core/models/venta.model';

type SeccionReporte = 'auditoria';
type FiltroTipoAjuste = 'todos' | 'correccion' | 'anulacion';

@Component({
  selector: 'app-reportes',
  templateUrl: './reportes.html',
  styleUrl: './reportes.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, FormsModule],
})
export class Reportes implements OnInit {
  private readonly ventasService = inject(VentasService);

  // 🗂️ Sección activa
  protected readonly seccionActiva = signal<SeccionReporte>('auditoria');

  // ─── Auditoría de ajustes ───
  protected readonly ajustes = signal<AjusteConVenta[]>([]);
  protected readonly loadingAjustes = signal(false);
  protected readonly errorAjustes = signal<string | null>(null);
  protected readonly totalAjustes = signal(0);
  protected readonly paginaAjustes = signal(1);
  protected readonly ajustesPorPagina = 20;

  // Filtros de auditoría
  protected readonly filtroTipoAjuste = signal<FiltroTipoAjuste>('todos');
  protected readonly filtroDesde = signal('');
  protected readonly filtroHasta = signal('');

  // Paginación
  protected readonly totalPaginasAjustes = computed(() =>
    Math.ceil(this.totalAjustes() / this.ajustesPorPagina),
  );

  // Estadísticas rápidas
  protected readonly estadisticasAjustes = computed(() => {
    const lista = this.ajustes();
    return {
      correcciones: lista.filter((a) => a.ajuste.tipoAjuste === 'correccion')
        .length,
      anulaciones: lista.filter((a) => a.ajuste.tipoAjuste === 'anulacion')
        .length,
    };
  });

  ngOnInit(): void {
    this.cargarAjustes();
  }

  protected cargarAjustes(): void {
    this.loadingAjustes.set(true);
    this.errorAjustes.set(null);

    this.ventasService
      .obtenerHistorialAjustes({
        pagina: this.paginaAjustes(),
        limite: this.ajustesPorPagina,
        tipoAjuste: this.filtroTipoAjuste(),
        desde: this.filtroDesde() || undefined,
        hasta: this.filtroHasta() || undefined,
      })
      .subscribe({
        next: (respuesta) => {
          this.ajustes.set(respuesta.ajustes);
          this.totalAjustes.set(respuesta.total);
          this.loadingAjustes.set(false);
        },
        error: (err: Error) => {
          this.errorAjustes.set(err.message);
          this.loadingAjustes.set(false);
        },
      });
  }

  protected aplicarFiltros(): void {
    this.paginaAjustes.set(1);
    this.cargarAjustes();
  }

  protected limpiarFiltros(): void {
    this.filtroTipoAjuste.set('todos');
    this.filtroDesde.set('');
    this.filtroHasta.set('');
    this.paginaAjustes.set(1);
    this.cargarAjustes();
  }

  protected cambiarPaginaAjustes(pagina: number): void {
    this.paginaAjustes.set(pagina);
    this.cargarAjustes();
  }

  protected obtenerEtiquetaCampo(campo: string): string {
    const etiquetas: Record<string, string> = {
      metodoPago: 'Método de Pago',
      descuento: 'Descuento',
      total: 'Total',
      observaciones: 'Observaciones',
      referenciaPago: 'Referencia de Pago',
      estado: 'Estado',
    };
    return etiquetas[campo] ?? campo;
  }
}
