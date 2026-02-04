import {
  Component,
  ChangeDetectionStrategy,
  input,
  output,
  signal,
  computed,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { Cliente } from '@core/models/cliente.model';
import { HistorialAbonosComponent } from '../historial-abonos/historial-abonos';

type PestanaDetalle = 'resumen' | 'abonos' | 'ventas';

@Component({
  selector: 'app-detalle-cliente',
  templateUrl: './detalle-cliente.html',
  styleUrl: './detalle-cliente.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, HistorialAbonosComponent],
})
export class DetalleClienteComponent {
  readonly cliente = input.required<Cliente>();
  readonly onCerrar = output<void>();
  readonly onAbono = output<Cliente>();

  // ✅ NUEVO: Pestañas de navegación
  protected readonly pestanaActiva = signal<PestanaDetalle>('resumen');

  protected readonly nombreCompleto = computed(
    () => `${this.cliente().nombre} ${this.cliente().apellido}`,
  );

  protected cambiarPestana(pestana: PestanaDetalle): void {
    this.pestanaActiva.set(pestana);
  }

  protected cerrar(): void {
    this.onCerrar.emit();
  }

  protected registrarAbono(): void {
    this.onAbono.emit(this.cliente());
  }

  protected formatearMoneda(valor: number): string {
    return new Intl.NumberFormat('es-MX', {
      style: 'currency',
      currency: 'MXN',
    }).format(valor);
  }

  // ✅ CORREGIDO: Aceptar string | null en lugar de Date | null
  protected formatearFecha(fecha: string | null): string {
    if (!fecha) return 'Nunca';

    // ✅ Convertir string ISO 8601 a Date
    const fechaDate = new Date(fecha);

    // ✅ Validar que sea una fecha válida
    if (isNaN(fechaDate.getTime())) return 'Fecha inválida';

    return fechaDate.toLocaleDateString('es-MX', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    });
  }
}
