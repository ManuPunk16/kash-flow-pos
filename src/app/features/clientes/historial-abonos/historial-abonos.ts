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
import {
  AbonosService,
  type AbonoCliente,
} from '@core/services/abonos.service';

@Component({
  selector: 'app-historial-abonos',
  templateUrl: './historial-abonos.html',
  styleUrl: './historial-abonos.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule],
})
export class HistorialAbonosComponent implements OnInit {
  private readonly abonosService = inject(AbonosService);

  // Inputs
  readonly clienteId = input.required<string>();
  readonly nombreCliente = input.required<string>();

  // Estado reactivo
  protected readonly abonos = signal<AbonoCliente[]>([]);
  protected readonly cargando = signal(false);
  protected readonly error = signal<string | null>(null);

  // Estado derivado
  protected readonly totalAbonado = computed(() =>
    this.abonos().reduce((sum, abono) => sum + abono.monto, 0),
  );

  protected readonly cantidadAbonos = computed(() => this.abonos().length);

  protected readonly abonosPorMes = computed(() => {
    const abonosPorMes = new Map<string, AbonoCliente[]>();

    this.abonos().forEach((abono) => {
      const fecha = new Date(abono.fechaPago);
      const mesAnio = `${fecha.toLocaleDateString('es-MX', { month: 'long' })} ${fecha.getFullYear()}`;

      if (!abonosPorMes.has(mesAnio)) {
        abonosPorMes.set(mesAnio, []);
      }

      abonosPorMes.get(mesAnio)!.push(abono);
    });

    // Convertir a array y ordenar por fecha descendente
    return Array.from(abonosPorMes.entries())
      .map(([mes, abonos]) => ({
        mes,
        abonos: abonos.sort(
          (a, b) =>
            new Date(b.fechaPago).getTime() - new Date(a.fechaPago).getTime(),
        ),
        totalMes: abonos.reduce((sum, a) => sum + a.monto, 0),
      }))
      .sort((a, b) => {
        const [mesA, anioA] = a.mes.split(' ');
        const [mesB, anioB] = b.mes.split(' ');
        return (
          new Date(`${mesB} 1, ${anioB}`).getTime() -
          new Date(`${mesA} 1, ${anioA}`).getTime()
        );
      });
  });

  ngOnInit(): void {
    this.cargarAbonos();
  }

  protected cargarAbonos(): void {
    this.cargando.set(true);
    this.error.set(null);

    this.abonosService.obtenerPorCliente(this.clienteId()).subscribe({
      next: (abonos) => {
        this.abonos.set(abonos);
        this.cargando.set(false);
      },
      error: (err) => {
        this.error.set(err.message);
        this.cargando.set(false);
        console.error('❌ Error al cargar abonos:', err);
      },
    });
  }

  protected formatearMoneda(valor: number): string {
    return new Intl.NumberFormat('es-MX', {
      style: 'currency',
      currency: 'MXN',
    }).format(valor);
  }

  protected formatearFecha(fecha: Date): string {
    return new Date(fecha).toLocaleDateString('es-MX', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  }

  protected formatearFechaCorta(fecha: Date): string {
    return new Date(fecha).toLocaleDateString('es-MX', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    });
  }

  protected obtenerIconoMetodoPago(metodo: string): string {
    const iconos: Record<string, string> = {
      efectivo: '💵',
      transferencia: '🏦',
      cheque: '📝',
      tarjeta: '💳',
    };
    return iconos[metodo] || '💰';
  }

  protected obtenerColorMetodoPago(metodo: string): string {
    const colores: Record<string, string> = {
      efectivo: 'text-green-600 bg-green-100',
      transferencia: 'text-blue-600 bg-blue-100',
      cheque: 'text-purple-600 bg-purple-100',
      tarjeta: 'text-yellow-600 bg-yellow-100',
    };
    return colores[metodo] || 'text-gray-600 bg-gray-100';
  }
}
