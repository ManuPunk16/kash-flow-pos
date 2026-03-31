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
import { AbonosService } from '@core/services/abonos.service';
import type { AbonoCliente } from '@core/services/abonos.service';
import { AjusteConVenta } from '@core/models/venta.model';

type SeccionReporte = 'auditoria' | 'abonos';
type FiltroTipoAjuste = 'todos' | 'correccion' | 'anulacion';
type FiltroMetodoPago = 'todos' | 'efectivo' | 'transferencia' | 'cheque';

@Component({
  selector: 'app-reportes',
  templateUrl: './reportes.html',
  styleUrl: './reportes.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, FormsModule],
})
export class Reportes implements OnInit {
  private readonly ventasService = inject(VentasService);
  private readonly abonosService = inject(AbonosService);

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

  // Paginación ajustes
  protected readonly totalPaginasAjustes = computed(() =>
    Math.ceil(this.totalAjustes() / this.ajustesPorPagina),
  );

  // Estadísticas rápidas de ajustes
  protected readonly estadisticasAjustes = computed(() => {
    const lista = this.ajustes();
    return {
      correcciones: lista.filter((a) => a.ajuste.tipoAjuste === 'correccion')
        .length,
      anulaciones: lista.filter((a) => a.ajuste.tipoAjuste === 'anulacion')
        .length,
    };
  });

  // ─── Historial de abonos ───
  protected readonly abonos = signal<AbonoCliente[]>([]);
  protected readonly loadingAbonos = signal(false);
  protected readonly errorAbonos = signal<string | null>(null);
  protected readonly totalAbonos = signal(0);
  protected readonly paginaAbonos = signal(1);
  protected readonly abonosPorPagina = 20;

  // Filtros de abonos
  protected readonly filtroMetodoPago = signal<FiltroMetodoPago>('todos');
  protected readonly filtroAbonosDesde = signal('');
  protected readonly filtroAbonosHasta = signal('');

  // Paginación abonos
  protected readonly totalPaginasAbonos = computed(() =>
    Math.ceil(this.totalAbonos() / this.abonosPorPagina),
  );

  // Estadísticas rápidas de abonos
  protected readonly estadisticasAbonos = computed(() => {
    const lista = this.abonos();
    return {
      montoTotal: lista.reduce((sum, a) => sum + a.monto, 0),
      cantidadEfectivo: lista.filter((a) => a.metodoPago === 'efectivo').length,
      cantidadTransferencia: lista.filter(
        (a) => a.metodoPago === 'transferencia',
      ).length,
    };
  });

  ngOnInit(): void {
    this.cargarAjustes();
  }

  protected cambiarSeccion(seccion: SeccionReporte): void {
    this.seccionActiva.set(seccion);
    if (seccion === 'abonos' && this.abonos().length === 0) {
      this.cargarAbonos();
    }
  }

  // ─── Métodos de ajustes ───

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

  // ─── Métodos de abonos ───

  protected cargarAbonos(): void {
    this.loadingAbonos.set(true);
    this.errorAbonos.set(null);

    this.abonosService
      .obtenerHistorialPaginado({
        pagina: this.paginaAbonos(),
        limite: this.abonosPorPagina,
        metodoPago: this.filtroMetodoPago(),
        desde: this.filtroAbonosDesde() || undefined,
        hasta: this.filtroAbonosHasta() || undefined,
      })
      .subscribe({
        next: (respuesta) => {
          this.abonos.set(respuesta.abonos);
          this.totalAbonos.set(respuesta.total);
          this.loadingAbonos.set(false);
        },
        error: (err: Error) => {
          this.errorAbonos.set(err.message);
          this.loadingAbonos.set(false);
        },
      });
  }

  protected aplicarFiltrosAbonos(): void {
    this.paginaAbonos.set(1);
    this.cargarAbonos();
  }

  protected limpiarFiltrosAbonos(): void {
    this.filtroMetodoPago.set('todos');
    this.filtroAbonosDesde.set('');
    this.filtroAbonosHasta.set('');
    this.paginaAbonos.set(1);
    this.cargarAbonos();
  }

  protected cambiarPaginaAbonos(pagina: number): void {
    this.paginaAbonos.set(pagina);
    this.cargarAbonos();
  }

  protected obtenerIconoMetodoPago(metodo: string): string {
    const iconos: Record<string, string> = {
      efectivo: '💵',
      transferencia: '🏦',
      cheque: '📄',
    };
    return iconos[metodo] ?? '💳';
  }

  protected obtenerColorMetodoPago(metodo: string): string {
    const colores: Record<string, string> = {
      efectivo: 'bg-green-100 text-green-800',
      transferencia: 'bg-blue-100 text-blue-800',
      cheque: 'bg-purple-100 text-purple-800',
    };
    return colores[metodo] ?? 'bg-gray-100 text-gray-800';
  }
}
