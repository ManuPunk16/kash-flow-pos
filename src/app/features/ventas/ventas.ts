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
import { Venta } from '@core/models/venta.model';
import { VentasService } from '@core/services/ventas.service';
import { MetodoPago } from '@core/enums';
import { DetalleVenta } from './detalle-venta/detalle-venta';
import { ModalTicket } from '@shared/components/modal-ticket/modal-ticket'; // ✅ NUEVO

type VistaVentas = 'tabla' | 'cards';

@Component({
  selector: 'app-ventas',
  imports: [CommonModule, FormsModule, DetalleVenta, ModalTicket], // ✅ NUEVO: Agregar ModalTicket
  templateUrl: './ventas.html',
  styleUrl: './ventas.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Ventas implements OnInit {
  private readonly ventasService = inject(VentasService);

  // 🔥 Estado con signals
  protected readonly ventas = signal<Venta[]>([]);
  protected readonly ventaSeleccionada = signal<Venta | null>(null);
  protected readonly ventaParaTicket = signal<Venta | null>(null); // ✅ NUEVO: Venta para mostrar ticket
  protected readonly loading = signal(false);
  protected readonly error = signal<string | null>(null);

  // 🎨 Vista
  protected readonly vista = signal<VistaVentas>('cards');

  // 🔍 Filtros
  protected readonly terminoBusqueda = signal('');
  protected readonly filtroMetodoPago = signal<MetodoPago | 'todos'>('todos');
  protected readonly filtroFechaDesde = signal('');
  protected readonly filtroFechaHasta = signal('');

  // 📄 Paginación
  protected readonly paginaActual = signal(1);
  protected readonly ventasPorPagina = signal(20);
  protected readonly totalVentas = signal(0);

  // 🧮 Computed
  protected readonly totalPaginas = computed(() => {
    const total = this.totalVentas();
    const porPagina = this.ventasPorPagina();
    return total > 0 ? Math.ceil(total / porPagina) : 0;
  });

  protected readonly ventasFiltradas = computed(() => {
    const termino = this.terminoBusqueda().toLowerCase();
    let resultado = this.ventas();

    if (!Array.isArray(resultado)) {
      console.error('❌ ventas() no es array:', resultado);
      return [];
    }

    if (termino) {
      resultado = resultado.filter(
        (venta) =>
          venta?.numeroVenta?.toLowerCase().includes(termino) ||
          venta?.nombreCliente?.toLowerCase().includes(termino)
      );
    }

    return resultado;
  });

  protected readonly estadisticasVista = computed(() => {
    const ventas = this.ventasFiltradas();

    if (!Array.isArray(ventas) || ventas.length === 0) {
      return {
        cantidad: 0,
        totalVendido: 0,
        totalGanancia: 0,
        promedioVenta: 0,
      };
    }

    const cantidad = ventas.length;
    const totalVendido = ventas.reduce((sum, v) => sum + (v?.total || 0), 0);
    const totalGanancia = ventas.reduce(
      (sum, v) => sum + (v?.gananciaTotal || 0),
      0
    );

    return {
      cantidad,
      totalVendido,
      totalGanancia,
      promedioVenta: cantidad > 0 ? totalVendido / cantidad : 0,
    };
  });

  // 📊 Métodos de pago disponibles para filtros
  protected readonly METODOS_PAGO_FILTRO = [
    { valor: 'todos' as const, etiqueta: 'Todos los métodos' },
    { valor: MetodoPago.EFECTIVO, etiqueta: 'Efectivo' },
    { valor: MetodoPago.TRANSFERENCIA, etiqueta: 'Transferencia' },
    { valor: MetodoPago.TARJETA, etiqueta: 'Tarjeta' },
    { valor: MetodoPago.FIADO, etiqueta: 'Fiado' },
  ];

  // ✅ Math para template
  protected readonly Math = Math;

  ngOnInit(): void {
    this.cargarVentas();
  }

  protected cargarVentas(): void {
    this.loading.set(true);
    this.error.set(null);

    const filtros = {
      pagina: this.paginaActual(),
      limite: this.ventasPorPagina(),
      desde: this.filtroFechaDesde() || undefined,
      hasta: this.filtroFechaHasta() || undefined,
      metodoPago:
        this.filtroMetodoPago() !== 'todos'
          ? this.filtroMetodoPago()
          : undefined,
    };

    this.ventasService.obtenerVentasConFiltros(filtros).subscribe({
      next: (respuesta) => {
        if (!respuesta || typeof respuesta !== 'object') {
          this.error.set('Respuesta del servidor inválida');
          this.ventas.set([]);
          this.totalVentas.set(0);
          return;
        }

        if (!Array.isArray(respuesta.ventas)) {
          this.error.set('Formato de datos incorrecto');
          this.ventas.set([]);
          this.totalVentas.set(0);
          return;
        }

        this.ventas.set(respuesta.ventas);
        this.totalVentas.set(respuesta.total || 0);
      },
      error: (err) => {
        this.error.set(err.message || 'Error al cargar ventas');
        this.ventas.set([]);
        this.totalVentas.set(0);
      },
      complete: () => {
        this.loading.set(false);
      },
    });
  }

  protected cambiarVista(nuevaVista: VistaVentas): void {
    this.vista.set(nuevaVista);
  }

  protected actualizarBusqueda(event: Event): void {
    const input = event.target as HTMLInputElement;
    this.terminoBusqueda.set(input.value);
  }

  protected cambiarFiltroMetodoPago(metodo: MetodoPago | 'todos'): void {
    this.filtroMetodoPago.set(metodo);
    this.paginaActual.set(1);
    this.cargarVentas();
  }

  protected aplicarFiltrosFecha(): void {
    this.paginaActual.set(1);
    this.cargarVentas();
  }

  protected limpiarFiltros(): void {
    this.terminoBusqueda.set('');
    this.filtroMetodoPago.set('todos');
    this.filtroFechaDesde.set('');
    this.filtroFechaHasta.set('');
    this.paginaActual.set(1);
    this.cargarVentas();
  }

  protected verDetalleVenta(venta: Venta): void {
    this.ventaSeleccionada.set(venta);
  }

  protected cerrarDetalleVenta(): void {
    this.ventaSeleccionada.set(null);
  }

  // ✅ NUEVO: Abrir modal de ticket
  protected verTicket(venta: Venta): void {
    this.ventaParaTicket.set(venta);
  }

  // ✅ NUEVO: Cerrar modal de ticket
  protected cerrarTicket(): void {
    this.ventaParaTicket.set(null);
  }

  protected paginaAnterior(): void {
    if (this.paginaActual() > 1) {
      this.paginaActual.update((p) => p - 1);
      this.cargarVentas();
    }
  }

  protected paginaSiguiente(): void {
    if (this.paginaActual() < this.totalPaginas()) {
      this.paginaActual.update((p) => p + 1);
      this.cargarVentas();
    }
  }

  protected obtenerIconoMetodoPago(metodo: MetodoPago): string {
    const iconos: Record<string, string> = {
      [MetodoPago.EFECTIVO]: '💵',
      [MetodoPago.TRANSFERENCIA]: '🏦',
      [MetodoPago.TARJETA]: '💳',
      [MetodoPago.FIADO]: '📝',
      [MetodoPago.CHEQUE]: '📝',
    };
    return iconos[metodo] || '💰';
  }

  protected obtenerColorMetodoPago(metodo: MetodoPago): string {
    const colores: Record<string, string> = {
      [MetodoPago.EFECTIVO]: 'bg-green-100 text-green-800',
      [MetodoPago.TRANSFERENCIA]: 'bg-blue-100 text-blue-800',
      [MetodoPago.TARJETA]: 'bg-purple-100 text-purple-800',
      [MetodoPago.FIADO]: 'bg-yellow-100 text-yellow-800',
      [MetodoPago.CHEQUE]: 'bg-orange-100 text-orange-800',
    };
    return colores[metodo] || 'bg-gray-100 text-gray-800';
  }
}
