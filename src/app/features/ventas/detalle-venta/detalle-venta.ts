import {
  Component,
  input,
  output,
  ChangeDetectionStrategy,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { Venta } from '@core/models/venta.model';

@Component({
  selector: 'app-detalle-venta',
  templateUrl: './detalle-venta.html',
  styleUrl: './detalle-venta.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule],
})
export class DetalleVenta {
  venta = input.required<Venta>();
  onCerrar = output<void>();

  protected cerrar(): void {
    this.onCerrar.emit();
  }

  protected obtenerIconoMetodoPago(metodo: string): string {
    const iconos: Record<string, string> = {
      efectivo: '💵',
      transferencia: '🏦',
      tarjeta: '💳',
      fiado: '📝',
      cheque: '📝',
    };
    return iconos[metodo] || '💰';
  }

  protected obtenerColorMetodoPago(metodo: string): string {
    const colores: Record<string, string> = {
      efectivo: 'bg-green-100 text-green-800',
      transferencia: 'bg-blue-100 text-blue-800',
      tarjeta: 'bg-purple-100 text-purple-800',
      fiado: 'bg-yellow-100 text-yellow-800',
      cheque: 'bg-orange-100 text-orange-800',
    };
    return colores[metodo] || 'bg-gray-100 text-gray-800';
  }
}
