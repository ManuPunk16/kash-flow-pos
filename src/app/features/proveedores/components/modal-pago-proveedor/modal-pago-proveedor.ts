import {
  Component,
  ChangeDetectionStrategy,
  input,
  output,
  signal,
  computed,
  inject,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Proveedor } from '@core/models/proveedor.model';
import { CrearPagoProveedorDTO } from '@core/models/pago-proveedor.model';
import { MetodoPago } from '@core/enums';
import { PagosProveedoresService } from '@core/services/pagos-proveedores.service';

@Component({
  selector: 'app-modal-pago-proveedor',
  templateUrl: './modal-pago-proveedor.html',
  styleUrl: './modal-pago-proveedor.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, FormsModule],
})
export class ModalPagoProveedorComponent {
  private readonly pagosService = inject(PagosProveedoresService);

  proveedor = input.required<Proveedor>();
  onCerrar = output<void>();
  onPagoExitoso = output<void>();

  // Estado del formulario
  protected readonly monto = signal(0);
  protected readonly metodoPago = signal<MetodoPago>(MetodoPago.TRANSFERENCIA);
  protected readonly referenciaPago = signal('');
  protected readonly observaciones = signal('');
  protected readonly procesando = signal(false);
  protected readonly error = signal<string | null>(null);

  // Métodos de pago disponibles
  protected readonly metodosPago = [
    { valor: MetodoPago.TRANSFERENCIA, etiqueta: '🏦 Transferencia' },
    { valor: MetodoPago.EFECTIVO, etiqueta: '💵 Efectivo' },
    { valor: MetodoPago.CHEQUE, etiqueta: '📝 Cheque' },
  ];

  protected readonly formularioValido = computed(() => {
    const montoValido =
      this.monto() > 0 && this.monto() <= this.proveedor().saldoPendiente;
    return montoValido && !this.procesando();
  });

  protected readonly montoMaximo = computed(
    () => this.proveedor().saldoPendiente
  );

  protected cerrar(): void {
    this.onCerrar.emit();
  }

  protected establecerMontoCompleto(): void {
    this.monto.set(this.proveedor().saldoPendiente);
  }

  protected registrarPago(): void {
    if (!this.formularioValido()) return;

    this.procesando.set(true);
    this.error.set(null);

    const pago: CrearPagoProveedorDTO = {
      proveedorId: this.proveedor()._id,
      monto: this.monto(),
      metodoPago: this.metodoPago(),
      referenciaPago: this.referenciaPago().trim() || undefined,
      observaciones: this.observaciones().trim() || undefined,
      fechaPago: new Date(),
    };

    this.pagosService.registrarPago(pago).subscribe({
      next: () => {
        console.log('✅ Pago registrado exitosamente');
        this.procesando.set(false);
        this.onPagoExitoso.emit();
        this.cerrar();
      },
      error: (err) => {
        console.error('❌ Error al registrar pago:', err);
        this.error.set(err.message);
        this.procesando.set(false);
      },
    });
  }
}
