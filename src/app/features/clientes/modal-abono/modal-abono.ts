import {
  Component,
  ChangeDetectionStrategy,
  input,
  output,
  signal,
  computed,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Cliente } from '@core/models/cliente.model';

type MetodoPago = 'efectivo' | 'transferencia' | 'tarjeta';

@Component({
  selector: 'app-modal-abono',
  templateUrl: './modal-abono.html',
  styleUrl: './modal-abono.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, FormsModule],
})
export class ModalAbonoComponent {
  // ✅ Cambiar a input opcional con validación en template
  cliente = input<Cliente | null>(null);
  onCerrar = output<void>();
  onGuardar = output<any>();

  protected readonly montoAbono = signal(0);
  protected readonly metodoPago = signal<MetodoPago>('efectivo');
  protected readonly notas = signal('');

  protected readonly nuevoSaldo = computed(() => {
    const clienteActual = this.cliente();
    if (!clienteActual) return 0;
    const saldoActual = clienteActual.saldoActual;
    const abono = this.montoAbono();
    return Math.max(0, saldoActual - abono);
  });

  protected readonly formularioValido = computed(() => {
    const clienteActual = this.cliente();
    if (!clienteActual) return false;
    const abono = this.montoAbono();
    const saldo = clienteActual.saldoActual;
    return abono > 0 && abono <= saldo;
  });

  protected readonly porcentajePagado = computed(() => {
    const clienteActual = this.cliente();
    if (!clienteActual) return 0;
    const abono = this.montoAbono();
    const saldo = clienteActual.saldoActual;
    if (saldo === 0) return 0;
    return Math.min(100, (abono / saldo) * 100);
  });

  protected cerrar(): void {
    this.onCerrar.emit();
  }

  protected guardar(): void {
    const clienteActual = this.cliente();
    if (!clienteActual || !this.formularioValido()) return;

    const datos = {
      clienteId: clienteActual._id,
      monto: this.montoAbono(),
      metodoPago: this.metodoPago(),
      notas: this.notas().trim() || undefined,
    };

    this.onGuardar.emit(datos);
  }

  protected seleccionarMetodoPago(metodo: MetodoPago): void {
    this.metodoPago.set(metodo);
  }

  protected pagarTodo(): void {
    const clienteActual = this.cliente();
    if (!clienteActual) return;
    this.montoAbono.set(clienteActual.saldoActual);
  }
}
