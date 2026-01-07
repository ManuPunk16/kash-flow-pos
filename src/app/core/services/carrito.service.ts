import { Injectable, inject, signal, computed, effect } from '@angular/core';
import { ItemCarrito } from '@core/models/carrito.model';
import { AlmacenamientoLocalService } from './almacenamiento-local.service';
import { MetodoPago } from '@core/enums';

interface EstadoCarrito {
  items: ItemCarrito[];
  descuento: number;
  metodoPago: MetodoPago;
  clienteId: string | null;
  comisionTerminal: number;
  montoPagadoEfectivo: number;
  fechaUltimaActualizacion: string;
}

@Injectable({
  providedIn: 'root',
})
export class CarritoService {
  private readonly almacenamiento = inject(AlmacenamientoLocalService);
  private readonly CLAVE_CARRITO = 'kashflow-pos-carrito';

  // 🔥 Signals para estado del carrito
  private readonly items = signal<ItemCarrito[]>([]);
  private readonly descuento = signal(0);
  private readonly metodoPago = signal<MetodoPago>(MetodoPago.EFECTIVO);
  private readonly clienteId = signal<string | null>(null);
  private readonly comisionTerminal = signal(3.5);
  private readonly montoPagadoEfectivo = signal(0);

  // 🧮 Computed signals
  readonly cantidadItems = computed(() =>
    this.items().reduce((sum, item) => sum + item.cantidad, 0)
  );

  readonly subtotal = computed(() =>
    this.items().reduce((sum, item) => sum + item.subtotal, 0)
  );

  readonly totalConDescuento = computed(() =>
    Math.max(0, this.subtotal() - this.descuento())
  );

  readonly montoComision = computed(() => {
    if (this.metodoPago() !== MetodoPago.TARJETA) return 0;
    return (this.totalConDescuento() * this.comisionTerminal()) / 100;
  });

  readonly totalFinal = computed(
    () => this.totalConDescuento() + this.montoComision()
  );

  readonly gananciaTotal = computed(() =>
    this.items().reduce((sum, item) => sum + item.ganancia, 0)
  );

  readonly cambioEfectivo = computed(() => {
    if (this.metodoPago() !== MetodoPago.EFECTIVO) return 0;
    return Math.max(0, this.montoPagadoEfectivo() - this.totalFinal());
  });

  constructor() {
    // ✅ Restaurar carrito al iniciar
    this.restaurarCarrito();

    // ✅ Guardar automáticamente cuando cambie algo
    effect(() => {
      const estado: EstadoCarrito = {
        items: this.items(),
        descuento: this.descuento(),
        metodoPago: this.metodoPago(),
        clienteId: this.clienteId(),
        comisionTerminal: this.comisionTerminal(),
        montoPagadoEfectivo: this.montoPagadoEfectivo(),
        fechaUltimaActualizacion: new Date().toISOString(),
      };

      // Solo guardar si hay items en el carrito
      if (estado.items.length > 0) {
        this.almacenamiento.guardar(this.CLAVE_CARRITO, estado);
      } else {
        // Si el carrito está vacío, eliminar del storage
        this.almacenamiento.eliminar(this.CLAVE_CARRITO);
      }
    });
  }

  /**
   * Restaurar carrito desde LocalStorage
   */
  private restaurarCarrito(): void {
    const estadoGuardado = this.almacenamiento.obtener<EstadoCarrito>(
      this.CLAVE_CARRITO
    );

    if (!estadoGuardado) {
      console.log('ℹ️ No hay carrito guardado');
      return;
    }

    // Validar que no sea muy antiguo (más de 24 horas)
    const fechaGuardado = new Date(estadoGuardado.fechaUltimaActualizacion);
    const ahora = new Date();
    const diferenciaHoras =
      (ahora.getTime() - fechaGuardado.getTime()) / (1000 * 60 * 60);

    if (diferenciaHoras > 24) {
      console.log('⚠️ Carrito guardado expiró (más de 24 horas)');
      this.almacenamiento.eliminar(this.CLAVE_CARRITO);
      return;
    }

    // Restaurar estado
    this.items.set(estadoGuardado.items);
    this.descuento.set(estadoGuardado.descuento);
    this.metodoPago.set(estadoGuardado.metodoPago);
    this.clienteId.set(estadoGuardado.clienteId);
    this.comisionTerminal.set(estadoGuardado.comisionTerminal);
    this.montoPagadoEfectivo.set(estadoGuardado.montoPagadoEfectivo);

    console.log('✅ Carrito restaurado desde LocalStorage:', {
      items: estadoGuardado.items.length,
      total: this.totalFinal(),
    });
  }

  /**
   * Obtener items del carrito
   */
  obtenerItems(): ItemCarrito[] {
    return this.items();
  }

  /**
   * Agregar item al carrito
   */
  agregarItem(item: ItemCarrito): void {
    const itemExistente = this.items().find(
      (i) => i.productoId === item.productoId
    );

    if (itemExistente) {
      this.incrementarCantidad(item.productoId);
    } else {
      this.items.update((items) => [...items, item]);
    }
  }

  /**
   * Incrementar cantidad de un item
   */
  incrementarCantidad(productoId: string): void {
    this.items.update((items) =>
      items.map((item) => {
        if (item.productoId !== productoId) return item;

        const nuevaCantidad = item.cantidad + 1;
        return {
          ...item,
          cantidad: nuevaCantidad,
          subtotal: item.precioUnitario * nuevaCantidad,
          ganancia: (item.precioUnitario - item.costoUnitario) * nuevaCantidad,
        };
      })
    );
  }

  /**
   * Decrementar cantidad de un item
   */
  decrementarCantidad(productoId: string): void {
    const item = this.items().find((i) => i.productoId === productoId);

    if (!item) return;

    if (item.cantidad === 1) {
      this.eliminarItem(productoId);
    } else {
      this.items.update((items) =>
        items.map((i) => {
          if (i.productoId !== productoId) return i;

          const nuevaCantidad = i.cantidad - 1;
          return {
            ...i,
            cantidad: nuevaCantidad,
            subtotal: i.precioUnitario * nuevaCantidad,
            ganancia: (i.precioUnitario - i.costoUnitario) * nuevaCantidad,
          };
        })
      );
    }
  }

  /**
   * Eliminar item del carrito
   */
  eliminarItem(productoId: string): void {
    this.items.update((items) =>
      items.filter((item) => item.productoId !== productoId)
    );
  }

  /**
   * Limpiar carrito completamente
   */
  limpiar(): void {
    this.items.set([]);
    this.descuento.set(0);
    this.metodoPago.set(MetodoPago.EFECTIVO);
    this.clienteId.set(null);
    this.comisionTerminal.set(3.5);
    this.montoPagadoEfectivo.set(0);
    this.almacenamiento.eliminar(this.CLAVE_CARRITO);
    console.log('🗑️ Carrito limpiado');
  }

  /**
   * Establecer descuento
   */
  establecerDescuento(monto: number): void {
    this.descuento.set(Math.max(0, monto));
  }

  /**
   * Establecer método de pago
   */
  establecerMetodoPago(metodo: MetodoPago): void {
    this.metodoPago.set(metodo);
  }

  /**
   * Establecer cliente
   */
  establecerCliente(clienteId: string | null): void {
    this.clienteId.set(clienteId);
  }

  /**
   * Establecer comisión de terminal
   */
  establecerComisionTerminal(porcentaje: number): void {
    this.comisionTerminal.set(Math.max(0, Math.min(10, porcentaje)));
  }

  /**
   * Establecer monto pagado en efectivo
   */
  establecerMontoPagadoEfectivo(monto: number): void {
    this.montoPagadoEfectivo.set(Math.max(0, monto));
  }

  /**
   * Obtener estado actual del carrito
   */
  obtenerEstado(): EstadoCarrito {
    return {
      items: this.items(),
      descuento: this.descuento(),
      metodoPago: this.metodoPago(),
      clienteId: this.clienteId(),
      comisionTerminal: this.comisionTerminal(),
      montoPagadoEfectivo: this.montoPagadoEfectivo(),
      fechaUltimaActualizacion: new Date().toISOString(),
    };
  }
}
