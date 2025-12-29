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
  selector: 'app-detalle-cliente',
  templateUrl: './detalle-cliente.html',
  styleUrl: './detalle-cliente.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule],
})
export class DetalleClienteComponent {
  // ✅ Mantener como required
  cliente = input.required<Cliente>();
  onCerrar = output<void>();
  onAbono = output<Cliente>();

  protected readonly estadoFinanciero = computed(() => {
    const clienteActual = this.cliente();

    if (clienteActual.esMoroso) {
      return { texto: 'MOROSO', color: 'text-red-600', emoji: '⚠️' };
    }
    if (clienteActual.saldoActual > 0) {
      return { texto: 'DEUDOR', color: 'text-yellow-600', emoji: '💰' };
    }
    return { texto: 'AL DÍA', color: 'text-green-600', emoji: '✅' };
  });

  protected readonly historicoOrdenado = computed(() => {
    return [...this.cliente().historicoIntereses].sort(
      (a, b) => new Date(b.fecha).getTime() - new Date(a.fecha).getTime()
    );
  });

  protected cerrar(): void {
    this.onCerrar.emit();
  }

  protected registrarAbono(): void {
    this.onAbono.emit(this.cliente());
  }
}
