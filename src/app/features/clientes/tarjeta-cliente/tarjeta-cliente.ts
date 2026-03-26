import {
  Component,
  ChangeDetectionStrategy,
  input,
  output,
  computed,
  signal,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { Cliente } from '@core/models/cliente.model';
import { environment } from '@environments/environment';

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

  protected readonly mensajeCopiado = signal(false);

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

  protected copiarMensajeWhatsapp(): void {
    const { nombre, apellido, saldoActual } = this.cliente();
    const saldo = saldoActual.toLocaleString('es-MX');

    // Datos de transferencia
    const beneficiario = 'Luis Adrián Hernández Soto';
    const clabe = '638180000130769710';
    const banco = 'Nu México';

    const mensaje =
      `Hola, ${nombre} ${apellido}. 👋\n\n` +
      `Esperamos que te encuentres muy bien. Te enviamos este recordatorio cordial sobre tu saldo pendiente de *$${saldo}* en la tiendita.\n\n` +
      `*Información importante:* 💡\n` +
      `Para evitar cargos adicionales, te recordamos realizar tu pago antes del día primero de cada mes. A partir de esa fecha, se aplica un cargo del 20% por concepto de retraso sobre el saldo acumulado.\n\n` +
      `Si deseas realizar tu pago vía transferencia, aquí tienes los datos:\n` +
      `━━━━━━━━━━━━━━━━━━\n` +
      `👤 *Beneficiario:* ${beneficiario}\n` +
      `🏦 *Banco:* ${banco}\n` +
      `🔢 *CLABE:* ${clabe}\n` +
      `━━━━━━━━━━━━━━━━━━\n\n` +
      `También puedes liquidarlo en efectivo. ¡Muchas gracias por tu comprensión y preferencia! 😊`;

    navigator.clipboard.writeText(mensaje).then(() => {
      this.mensajeCopiado.set(true);
      setTimeout(() => this.mensajeCopiado.set(false), 2500);
    });
  }
}
