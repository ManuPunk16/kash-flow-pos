import {
  Component,
  ChangeDetectionStrategy,
  input,
  output,
  computed,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { Proveedor } from '@core/models/proveedor.model';
import {
  ETIQUETAS_CATEGORIAS,
  COLORES_CATEGORIAS,
} from '@core/enums/categorias-proveedor.enum'; // ✅ NUEVO

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
  onVerDetalle = output<Proveedor>(); // ✅ NUEVO

  // ✅ NUEVO: Agregar acceso a etiquetas y colores de categorías
  protected readonly etiquetasCategorias = ETIQUETAS_CATEGORIAS;
  protected readonly coloresCategorias = COLORES_CATEGORIAS;

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

  // ✅ NUEVO: Método para ver detalle
  protected verDetalle(): void {
    this.onVerDetalle.emit(this.proveedor());
  }
}
