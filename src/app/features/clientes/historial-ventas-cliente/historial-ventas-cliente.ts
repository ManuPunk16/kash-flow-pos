import {
  Component,
  ChangeDetectionStrategy,
  input,
  signal,
  computed,
  inject,
  OnInit,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { VentasService } from '@core/services/ventas.service';
import { Venta } from '@core/models/venta.model';
import { MetodoPago } from '@core/enums';

@Component({
  selector: 'app-historial-ventas-cliente',
  templateUrl: './historial-ventas-cliente.html',
  styleUrl: './historial-ventas-cliente.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule],
})
export class HistorialVentasClienteComponent implements OnInit {
  private readonly ventasService = inject(VentasService);

  readonly clienteId = input.required<string>();
  readonly nombreCliente = input.required<string>();

  protected readonly ventas = signal<Venta[]>([]);
  protected readonly cargando = signal(false);
  protected readonly error = signal<string | null>(null);
  protected readonly totalVentas = signal(0);

  protected readonly totalComprado = computed(() =>
    this.ventas().reduce((sum, v) => sum + v.total, 0),
  );

  protected readonly cantidadVentas = computed(() => this.totalVentas());

  ngOnInit(): void {
    this.cargarVentas();
  }

  protected cargarVentas(): void {
    this.cargando.set(true);
    this.error.set(null);

    this.ventasService
      .obtenerVentasConFiltros({ clienteId: this.clienteId(), limite: 100 })
      .subscribe({
        next: (respuesta) => {
          this.ventas.set(respuesta.ventas);
          this.totalVentas.set(respuesta.total);
          this.cargando.set(false);
        },
        error: (err) => {
          this.error.set(err.message || 'Error al cargar ventas');
          this.cargando.set(false);
        },
      });
  }

  protected formatearMoneda(valor: number): string {
    return new Intl.NumberFormat('es-MX', {
      style: 'currency',
      currency: 'MXN',
    }).format(valor);
  }

  protected formatearFecha(fecha: Date | string): string {
    return new Date(fecha).toLocaleDateString('es-MX', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  }

  protected obtenerIconoMetodoPago(metodo: string): string {
    const iconos: Record<string, string> = {
      [MetodoPago.EFECTIVO]: '💵',
      [MetodoPago.TRANSFERENCIA]: '🏦',
      [MetodoPago.TARJETA]: '💳',
      [MetodoPago.FIADO]: '📝',
    };
    return iconos[metodo] || '💰';
  }

  protected obtenerColorMetodoPago(metodo: string): string {
    const colores: Record<string, string> = {
      [MetodoPago.EFECTIVO]: 'bg-green-100 text-green-800',
      [MetodoPago.TRANSFERENCIA]: 'bg-blue-100 text-blue-800',
      [MetodoPago.TARJETA]: 'bg-purple-100 text-purple-800',
      [MetodoPago.FIADO]: 'bg-yellow-100 text-yellow-800',
    };
    return colores[metodo] || 'bg-gray-100 text-gray-800';
  }
}
