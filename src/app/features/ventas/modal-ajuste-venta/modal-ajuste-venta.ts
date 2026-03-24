import {
  Component,
  input,
  output,
  signal,
  computed,
  inject,
  ChangeDetectionStrategy,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Venta, AjustarVentaDTO } from '@core/models/venta.model';
import { VentasService } from '@core/services/ventas.service';
import { MetodoPago } from '@core/enums';

@Component({
  selector: 'app-modal-ajuste-venta',
  templateUrl: './modal-ajuste-venta.html',
  styleUrl: './modal-ajuste-venta.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, FormsModule],
})
export class ModalAjusteVenta {
  private readonly ventasService = inject(VentasService);

  venta = input.required<Venta>();
  onCerrar = output<void>();
  onAjusteCompletado = output<Venta>();

  // Estado del formulario
  protected readonly accion = signal<'correccion' | 'anulacion'>('correccion');
  protected readonly razon = signal('');
  protected readonly nuevoMetodoPago = signal<MetodoPago | ''>('');
  protected readonly nuevoDescuento = signal<number | null>(null);
  protected readonly nuevasObservaciones = signal('');
  protected readonly nuevaReferencia = signal('');

  // Estado UI
  protected readonly enviando = signal(false);
  protected readonly error = signal<string | null>(null);
  protected readonly confirmandoAnulacion = signal(false);

  // Opciones de método de pago
  protected readonly metodosPago = Object.values(MetodoPago);

  // Validación
  protected readonly formularioValido = computed(() => {
    const razonTrim = this.razon().trim();
    if (razonTrim.length < 10) return false;

    if (this.accion() === 'anulacion') {
      return this.confirmandoAnulacion();
    }

    // Para corrección, al menos un campo debe tener valor
    const tieneCambios =
      this.nuevoMetodoPago() !== '' ||
      this.nuevoDescuento() !== null ||
      this.nuevasObservaciones().trim() !== '' ||
      this.nuevaReferencia().trim() !== '';

    return tieneCambios;
  });

  protected cambiarAccion(nuevaAccion: 'correccion' | 'anulacion'): void {
    this.accion.set(nuevaAccion);
    this.confirmandoAnulacion.set(false);
    this.error.set(null);
  }

  protected toggleConfirmacionAnulacion(): void {
    this.confirmandoAnulacion.update((v) => !v);
  }

  protected cerrar(): void {
    if (!this.enviando()) {
      this.onCerrar.emit();
    }
  }

  protected async enviar(): Promise<void> {
    if (!this.formularioValido() || this.enviando()) return;

    this.enviando.set(true);
    this.error.set(null);

    const dto: AjustarVentaDTO = {
      razon: this.razon().trim(),
      accion: this.accion(),
    };

    if (this.accion() === 'correccion') {
      if (this.nuevoMetodoPago())
        dto.metodoPago = this.nuevoMetodoPago() as MetodoPago;
      if (this.nuevoDescuento() !== null)
        dto.descuento = this.nuevoDescuento()!;
      if (this.nuevasObservaciones().trim())
        dto.observaciones = this.nuevasObservaciones().trim();
      if (this.nuevaReferencia().trim())
        dto.referenciaPago = this.nuevaReferencia().trim();
    }

    this.ventasService.ajustarVenta(this.venta()._id, dto).subscribe({
      next: (ventaActualizada) => {
        this.enviando.set(false);
        this.onAjusteCompletado.emit(ventaActualizada);
      },
      error: (err: Error) => {
        this.enviando.set(false);
        this.error.set(err.message);
      },
    });
  }
}
