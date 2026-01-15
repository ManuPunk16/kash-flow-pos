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
import { PagoProveedor } from '@core/models/pago-proveedor.model';
import { PagosProveedoresService } from '@core/services/pagos-proveedores.service';

@Component({
  selector: 'app-historial-pagos',
  templateUrl: './historial-pagos.html',
  styleUrl: './historial-pagos.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule],
})
export class HistorialPagosComponent implements OnInit {
  private readonly pagosService = inject(PagosProveedoresService);

  proveedorId = input.required<string>();

  protected readonly pagos = signal<PagoProveedor[]>([]);
  protected readonly cargando = signal(false);
  protected readonly error = signal<string | null>(null);

  protected readonly totalPagado = computed(() =>
    this.pagos().reduce((sum, p) => sum + p.monto, 0)
  );

  protected readonly cantidadPagos = computed(() => this.pagos().length);

  ngOnInit(): void {
    this.cargarHistorial();
  }

  protected cargarHistorial(): void {
    this.cargando.set(true);
    this.error.set(null);

    this.pagosService.obtenerPagosPorProveedor(this.proveedorId()).subscribe({
      next: (respuesta) => {
        this.pagos.set(respuesta.datos);
        this.cargando.set(false);
      },
      error: (err) => {
        this.error.set(err.message);
        this.cargando.set(false);
        console.error('❌ Error al cargar historial:', err);
      },
    });
  }

  protected obtenerIconoMetodoPago(metodo: string): string {
    const iconos: Record<string, string> = {
      transferencia: '🏦',
      efectivo: '💵',
      cheque: '📝',
      tarjeta: '💳',
    };
    return iconos[metodo] || '💰';
  }

  protected obtenerColorEstado(estado: string): string {
    return estado === 'pagado'
      ? 'bg-green-100 text-green-800'
      : 'bg-yellow-100 text-yellow-800';
  }
}
