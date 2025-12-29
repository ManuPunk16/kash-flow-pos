import {
  Component,
  ChangeDetectionStrategy,
  input,
  output,
  computed,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { Proveedor } from '@core/models/proveedor.model';

@Component({
  selector: 'app-tarjeta-proveedor',
  templateUrl: './tarjeta-proveedor.html',
  styleUrl: './tarjeta-proveedor.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule],
})
export class TarjetaProveedorComponent {
  proveedor = input.required<Proveedor>();
  onEditar = output<Proveedor>();
  onEliminar = output<string>();

  protected readonly tieneDeuda = computed(
    () => this.proveedor().saldoPendiente > 0
  );

  protected readonly colorBorde = computed(() =>
    this.tieneDeuda() ? 'border-red-500' : 'border-green-500'
  );

  protected editar(): void {
    this.onEditar.emit(this.proveedor());
  }

  protected eliminar(): void {
    this.onEliminar.emit(this.proveedor()._id);
  }
}
