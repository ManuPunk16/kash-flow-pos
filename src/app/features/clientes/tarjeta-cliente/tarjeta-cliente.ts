import {
  Component,
  ChangeDetectionStrategy,
  input,
  output,
  computed,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { Cliente } from '@core/models/cliente.model';

@Component({
  selector: 'app-tarjeta-cliente',
  templateUrl: './tarjeta-cliente.html',
  styleUrl: './tarjeta-cliente.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule],
})
export class TarjetaClienteComponent {
  cliente = input.required<Cliente>();
  onEditar = output<Cliente>();
  onEliminar = output<string>();
  onAbono = output<Cliente>();
  onVerDetalle = output<Cliente>();

  protected readonly colorBorde = computed(() => {
    const cliente = this.cliente();
    if (cliente.esMoroso) return 'border-red-500';
    if (cliente.saldoActual > 0) return 'border-yellow-500';
    return 'border-green-500';
  });

  protected readonly estadoCliente = computed(() => {
    const cliente = this.cliente();
    if (cliente.esMoroso) {
      return {
        texto: 'Moroso',
        emoji: '⚠️',
        clases: 'bg-red-100 text-red-800',
      };
    }
    if (cliente.saldoActual > 0) {
      return {
        texto: 'Deudor',
        emoji: '💰',
        clases: 'bg-yellow-100 text-yellow-800',
      };
    }
    return {
      texto: 'Al día',
      emoji: '✅',
      clases: 'bg-green-100 text-green-800',
    };
  });

  protected readonly diasSinPagar = computed(() => {
    const dias = this.cliente().diasSinPagar;
    if (dias === 0) return 'Hoy';
    if (dias === 1) return '1 día';
    return `${dias} días`;
  });

  protected editar(): void {
    this.onEditar.emit(this.cliente());
  }

  protected eliminar(): void {
    this.onEliminar.emit(this.cliente()._id);
  }

  protected registrarAbono(): void {
    this.onAbono.emit(this.cliente());
  }

  protected verDetalle(): void {
    this.onVerDetalle.emit(this.cliente());
  }
}
