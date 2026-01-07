import {
  Component,
  signal,
  computed,
  inject,
  ChangeDetectionStrategy,
  OnInit,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ProductosService } from '@core/services/productos.service';
import { AuthService } from '@core/services/auth.service';
import { ClientesService } from '@core/services/clientes.service';
import { VentasService } from '@core/services/ventas.service';
import { Producto } from '@core/models/producto.model';
import { ItemCarrito, productoAItemCarrito } from '@core/models/carrito.model';
import { Cliente } from '@core/models/cliente.model';
import { MetodoPago } from '@core/enums';
import { RegistrarVentaDTO } from '@core/models/venta.model';

interface RespuestaAPI<T> {
  exito: boolean;
  mensaje?: string;
  datos?: T;
}

@Component({
  selector: 'app-pos',
  imports: [CommonModule, FormsModule],
  templateUrl: './pos.component.html',
  styleUrl: './pos.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PosComponent implements OnInit {
  private readonly productosService = inject(ProductosService);
  private readonly authService = inject(AuthService);
  private readonly clientesService = inject(ClientesService);
  private readonly ventasService = inject(VentasService);

  // 🔥 Estado con signals
  private readonly todosLosProductos = signal<Producto[]>([]);
  protected readonly terminoBusqueda = signal('');
  protected readonly carrito = signal<ItemCarrito[]>([]);
  protected readonly clienteSeleccionado = signal<Cliente | null>(null);
  protected readonly loading = signal(false);
  protected readonly error = signal<string | null>(null);
  protected readonly mensajeAlerta = signal<string | null>(null);
  protected readonly todosLosClientes = signal<Cliente[]>([]);
  protected readonly busquedaCliente = signal('');
  protected readonly mostrarListaClientes = signal(false);

  // 📧 Email del usuario
  protected readonly emailUsuario = computed(
    () => this.authService.obtenerUsuarioActual()?.email || 'Usuario'
  );

  // 🔍 Productos filtrados por búsqueda
  protected readonly productos = computed(() => {
    const termino = this.terminoBusqueda().toLowerCase().trim();

    // Filtrar por búsqueda
    let productosFiltrados = termino
      ? this.todosLosProductos().filter((producto) => {
          const nombreCoincide = producto.nombre
            .toLowerCase()
            .includes(termino);
          const codigoCoincide = producto.codigoBarras
            ?.toLowerCase()
            .includes(termino);
          const categoriaCoincide = producto.categoria
            ?.toLowerCase()
            .includes(termino);
          return nombreCoincide || codigoCoincide || categoriaCoincide;
        })
      : this.todosLosProductos();

    const inicio = (this.paginaActual() - 1) * this.productosPorPagina();
    const fin = inicio + this.productosPorPagina();

    return productosFiltrados.slice(inicio, fin);
  });

  // 🧮 Estado derivado
  protected readonly total = computed(() =>
    this.carrito().reduce((sum, item) => sum + item.subtotal, 0)
  );

  protected readonly cantidadItems = computed(() =>
    this.carrito().reduce((sum, item) => sum + item.cantidad, 0)
  );

  protected readonly gananciaTotal = computed(() =>
    this.carrito().reduce((sum, item) => sum + item.ganancia, 0)
  );

  protected readonly gananciaPorItem = computed(() =>
    this.carrito().map((item) => ({
      productoId: item.productoId,
      nombreProducto: item.nombreProducto,
      gananciaUnidad: item.precioUnitario - item.costoUnitario,
      gananciaTotal: item.ganancia,
      margenPorcentaje:
        ((item.precioUnitario - item.costoUnitario) / item.precioUnitario) *
        100,
    }))
  );

  protected readonly clientesFiltrados = computed(() => {
    const termino = this.busquedaCliente().toLowerCase().trim();

    if (!termino || termino.length < 2) {
      return [];
    }

    return this.todosLosClientes()
      .filter((cliente) => {
        const nombreCompleto =
          `${cliente.nombre} ${cliente.apellido}`.toLowerCase();
        const identificacion = cliente.identificacion?.toLowerCase() || '';

        return (
          nombreCompleto.includes(termino) || identificacion.includes(termino)
        );
      })
      .slice(0, 10);
  });

  protected readonly metodoPago = signal<MetodoPago>(MetodoPago.EFECTIVO);

  protected readonly METODOS_PAGO_DISPONIBLES = [
    { valor: MetodoPago.EFECTIVO, etiqueta: 'Efectivo', icono: '💵' },
    { valor: MetodoPago.TRANSFERENCIA, etiqueta: 'Transferencia', icono: '🏦' },
    { valor: MetodoPago.TARJETA, etiqueta: 'Tarjeta', icono: '💳' },
    { valor: MetodoPago.FIADO, etiqueta: 'Fiado', icono: '📝' },
  ] as const;

  protected readonly descuento = signal(0);

  protected readonly comisionTerminal = signal(3.5);
  protected readonly mostrarInputComision = signal(false);

  protected readonly montoPagadoEfectivo = signal(0);

  protected readonly cambioEfectivo = computed(() => {
    if (this.metodoPago() !== MetodoPago.EFECTIVO) return 0;
    const montoPagado = this.montoPagadoEfectivo();
    const totalAPagar = this.totalFinal();
    return Math.max(0, montoPagado - totalAPagar);
  });

  protected readonly esMontoPagadoSuficiente = computed(() => {
    if (this.metodoPago() !== MetodoPago.EFECTIVO) return true;
    return this.montoPagadoEfectivo() >= this.totalFinal();
  });

  protected readonly totalConDescuento = computed(() => {
    const subtotal = this.total();
    const desc = this.descuento();
    return Math.max(0, subtotal - desc);
  });

  protected readonly montoComisionTerminal = computed(() => {
    if (this.metodoPago() !== MetodoPago.TARJETA) return 0;
    return (this.totalConDescuento() * this.comisionTerminal()) / 100;
  });

  protected readonly totalFinal = computed(() => {
    const base = this.totalConDescuento();
    const comision = this.montoComisionTerminal();
    return base + comision;
  });

  protected readonly puedeVenderFiado = computed(() => {
    const cliente = this.clienteSeleccionado();
    if (!cliente) return false;

    // ⚠️ Si el backend NO tiene limiteCredito, usar un valor por defecto
    const limiteCredito = cliente.limiteCredito ?? 100000; // $100,000 por defecto
    const nuevoSaldo = cliente.saldoActual + this.totalConDescuento();

    return nuevoSaldo <= limiteCredito;
  });

  protected readonly saldoDisponibleFiado = computed(() => {
    const cliente = this.clienteSeleccionado();
    if (!cliente) return 0;

    const limiteCredito = cliente.limiteCredito ?? 100000;
    return Math.max(0, limiteCredito - cliente.saldoActual);
  });

  protected readonly puedeFinalizarVenta = computed(() => {
    if (this.carrito().length === 0) return false;
    if (this.loading()) return false;

    // Si es fiado, debe haber cliente y no exceder límite
    if (this.metodoPago() === MetodoPago.FIADO) {
      if (!this.clienteSeleccionado()) return false;
      if (!this.puedeVenderFiado()) return false;
    }

    return true;
  });

  protected readonly paginaActual = signal(1);
  protected readonly productosPorPagina = signal(20);

  protected readonly totalProductos = computed(() => {
    const termino = this.terminoBusqueda().toLowerCase().trim();

    if (!termino) {
      return this.todosLosProductos().length;
    }

    return this.todosLosProductos().filter((producto) => {
      const nombreCoincide = producto.nombre.toLowerCase().includes(termino);
      const codigoCoincide = producto.codigoBarras
        ?.toLowerCase()
        .includes(termino);
      const categoriaCoincide = producto.categoria
        ?.toLowerCase()
        .includes(termino);
      return nombreCoincide || codigoCoincide || categoriaCoincide;
    }).length;
  });

  protected readonly totalPaginas = computed(() =>
    Math.ceil(this.totalProductos() / this.productosPorPagina())
  );

  ngOnInit(): void {
    this.cargarProductos();
    this.cargarClientes();
  }

  private cargarProductos(): void {
    this.loading.set(true);
    this.error.set(null);

    this.productosService.obtenerTodos().subscribe({
      next: (respuesta: RespuestaAPI<Producto[]>) => {
        if (respuesta.exito && respuesta.datos) {
          this.todosLosProductos.set(respuesta.datos);
          console.log('✅ Productos cargados:', respuesta.datos.length);
        } else {
          this.error.set('No se encontraron productos');
        }
      },
      error: (err: Error) => {
        console.error('❌ Error al cargar productos:', err);
        this.error.set('Error al conectar con el servidor');
      },
      complete: () => {
        this.loading.set(false);
      },
    });
  }

  private cargarClientes(): void {
    this.clientesService.obtenerClientes().subscribe({
      next: (clientes) => {
        this.todosLosClientes.set(clientes);
        console.log('✅ Clientes cargados:', clientes.length);
      },
      error: (err) => {
        console.error('❌ Error al cargar clientes:', err);
      },
    });
  }

  protected actualizarBusqueda(event: Event): void {
    const input = event.target as HTMLInputElement;
    this.terminoBusqueda.set(input.value);
    this.paginaActual.set(1);
  }

  protected limpiarBusqueda(): void {
    this.terminoBusqueda.set('');
  }

  protected agregarAlCarrito(producto: Producto): void {
    if (producto.stock === 0) {
      this.mostrarAlerta('⚠️ Producto sin stock');
      return;
    }

    const itemExistente = this.carrito().find(
      (item) => item.productoId === producto._id
    );

    if (itemExistente) {
      const cantidadEnCarrito = itemExistente.cantidad;
      const stockRestante = producto.stock - cantidadEnCarrito;

      if (stockRestante === 0) {
        this.mostrarAlerta(
          `⚠️ Ya tienes todo el stock disponible de "${producto.nombre}" en el carrito (${producto.stock} unidades)`
        );
        return;
      }

      this.carrito.update((items) =>
        items.map((item) =>
          item.productoId === producto._id
            ? {
                ...item,
                cantidad: item.cantidad + 1,
                subtotal: item.precioUnitario * (item.cantidad + 1),
                ganancia:
                  (item.precioUnitario - item.costoUnitario) *
                  (item.cantidad + 1),
              }
            : item
        )
      );
    } else {
      const nuevoItem = productoAItemCarrito(producto, 1);
      this.carrito.update((items) => [...items, nuevoItem]);
    }

    setTimeout(() => this.mensajeAlerta.set(null), 3000);
  }

  protected incrementarCantidad(productoId: string): void {
    const item = this.carrito().find((i) => i.productoId === productoId);

    if (!item) return;

    if (item.cantidad >= item.stockDisponible) {
      this.mostrarAlerta(
        `⚠️ No puedes agregar más. Stock máximo: ${item.stockDisponible}`
      );
      return;
    }

    this.carrito.update((items) =>
      items.map((i) =>
        i.productoId === productoId
          ? {
              ...i,
              cantidad: i.cantidad + 1,
              subtotal: i.precioUnitario * (i.cantidad + 1),
              ganancia: (i.precioUnitario - i.costoUnitario) * (i.cantidad + 1),
            }
          : i
      )
    );
  }

  protected decrementarCantidad(productoId: string): void {
    const item = this.carrito().find((i) => i.productoId === productoId);

    if (!item) return;

    if (item.cantidad === 1) {
      this.eliminarDelCarrito(productoId);
    } else {
      this.carrito.update((items) =>
        items.map((i) =>
          i.productoId === productoId
            ? {
                ...i,
                cantidad: i.cantidad - 1,
                subtotal: i.precioUnitario * (i.cantidad - 1),
                ganancia:
                  (i.precioUnitario - i.costoUnitario) * (i.cantidad - 1),
              }
            : i
        )
      );
    }
  }

  protected eliminarDelCarrito(productoId: string): void {
    this.carrito.update((items) =>
      items.filter((item) => item.productoId !== productoId)
    );
  }

  protected limpiarCarrito(): void {
    this.carrito.set([]);
  }

  protected recargarProductos(): void {
    this.cargarProductos();
  }

  private mostrarAlerta(mensaje: string): void {
    this.mensajeAlerta.set(mensaje);
    setTimeout(() => this.mensajeAlerta.set(null), 3000);
  }

  protected puedeAgregarMas(producto: Producto): boolean {
    const itemEnCarrito = this.carrito().find(
      (item) => item.productoId === producto._id
    );

    if (!itemEnCarrito) {
      return producto.stock > 0;
    }

    return itemEnCarrito.cantidad < producto.stock;
  }

  protected obtenerCantidadEnCarrito(productoId: string): number {
    const item = this.carrito().find((i) => i.productoId === productoId);
    return item?.cantidad || 0;
  }

  protected actualizarBusquedaCliente(event: Event): void {
    const input = event.target as HTMLInputElement;
    this.busquedaCliente.set(input.value);
    this.mostrarListaClientes.set(input.value.length >= 2);
  }

  protected seleccionarCliente(cliente: Cliente): void {
    this.clienteSeleccionado.set(cliente);
    this.busquedaCliente.set('');
    this.mostrarListaClientes.set(false);
    console.log('✅ Cliente seleccionado:', cliente.nombre, cliente.apellido);
  }

  protected limpiarCliente(): void {
    this.clienteSeleccionado.set(null);
    this.busquedaCliente.set('');
    this.mostrarListaClientes.set(false);
  }

  protected cerrarListaClientes(): void {
    // Cerrar con delay para permitir click en item
    setTimeout(() => this.mostrarListaClientes.set(false), 200);
  }

  protected cambiarMetodoPago(metodo: MetodoPago): void {
    this.metodoPago.set(metodo);

    if (metodo === MetodoPago.FIADO && !this.clienteSeleccionado()) {
      this.mostrarAlerta(
        '⚠️ Debes seleccionar un cliente para venta a crédito'
      );
    }

    if (metodo === MetodoPago.TARJETA) {
      this.mostrarInputComision.set(true);
    } else {
      this.mostrarInputComision.set(false);
    }

    if (metodo === MetodoPago.EFECTIVO) {
      this.montoPagadoEfectivo.set(0);
    }

    console.log('✅ Método de pago cambiado a:', metodo);
  }

  protected actualizarMontoPagadoEfectivo(event: Event): void {
    const input = event.target as HTMLInputElement;
    const monto = parseFloat(input.value) || 0;

    if (monto < 0) {
      this.mostrarAlerta('⚠️ El monto no puede ser negativo');
      this.montoPagadoEfectivo.set(0);
      return;
    }

    this.montoPagadoEfectivo.set(monto);
    console.log('✅ Monto pagado actualizado:', monto);
  }

  protected aplicarMontoExacto(): void {
    this.montoPagadoEfectivo.set(this.totalFinal());
  }

  protected aplicarDescuento(monto: number): void {
    if (monto < 0) {
      this.mostrarAlerta('⚠️ El descuento no puede ser negativo');
      this.descuento.set(0);
      return;
    }

    if (monto > this.total()) {
      this.mostrarAlerta('⚠️ El descuento no puede ser mayor al total');
      this.descuento.set(this.total());
      return;
    }

    this.descuento.set(monto);
    console.log('✅ Descuento aplicado: $', monto);
  }

  protected actualizarDescuento(event: Event): void {
    const input = event.target as HTMLInputElement;
    const monto = parseFloat(input.value) || 0;
    this.aplicarDescuento(monto);
  }

  protected readonly mostrarModalVenta = signal(false);

  protected abrirModalVenta(): void {
    if (this.carrito().length === 0) {
      this.mostrarAlerta('⚠️ El carrito está vacío');
      return;
    }

    this.mostrarModalVenta.set(true);
    console.log('✅ Modal de venta abierto');
  }

  protected cerrarModalVenta(): void {
    if (this.loading()) {
      this.mostrarAlerta('⚠️ Espera a que termine el proceso');
      return;
    }

    this.mostrarModalVenta.set(false);
    console.log('❌ Modal de venta cerrado');
  }

  protected confirmarVenta(): void {
    // Validaciones
    if (!this.puedeFinalizarVenta()) {
      this.mostrarAlerta('⚠️ Completa todos los datos requeridos');
      return;
    }

    if (
      this.metodoPago() === MetodoPago.EFECTIVO &&
      !this.esMontoPagadoSuficiente()
    ) {
      this.mostrarAlerta('⚠️ El monto pagado es insuficiente');
      return;
    }

    this.loading.set(true);

    const ventaDTO: RegistrarVentaDTO = {
      clienteId: this.clienteSeleccionado()?._id || null,
      items: this.carrito().map((item) => ({
        productoId: item.productoId,
        nombreProducto: item.nombreProducto,
        cantidad: item.cantidad,
        precioUnitario: item.precioUnitario,
        costoUnitario: item.costoUnitario,
        subtotal: item.subtotal,
        ganancia: item.ganancia,
        esConsignacion: item.esConsignacion,
      })),
      metodoPago: this.metodoPago(),
      descuento: this.descuento(),
      observaciones: '',
    };

    console.log('📤 Enviando DTO de venta:', JSON.stringify(ventaDTO, null, 2));

    this.ventasService.registrarVenta(ventaDTO).subscribe({
      next: (venta) => {
        console.log('✅ Venta registrada:', venta);

        if (
          this.metodoPago() === MetodoPago.EFECTIVO &&
          this.cambioEfectivo() > 0
        ) {
          this.mostrarAlerta(
            `✅ Venta registrada. Cambio: $${this.cambioEfectivo().toLocaleString(
              'es-MX'
            )}`
          );
        } else {
          this.mostrarAlerta('✅ Venta registrada exitosamente');
        }

        // Limpiar carrito y resetear estado
        this.limpiarCarrito();
        this.descuento.set(0);
        this.clienteSeleccionado.set(null);
        this.metodoPago.set(MetodoPago.EFECTIVO);
        this.mostrarModalVenta.set(false);
        this.comisionTerminal.set(3.5);
        this.mostrarInputComision.set(false);
        this.montoPagadoEfectivo.set(0);

        // Recargar productos (actualizar stock)
        this.cargarProductos();
      },
      error: (error) => {
        console.error('❌ Error al registrar venta:', error);
        const mensajeError =
          error.error?.mensaje ||
          error.error?.error ||
          error.message ||
          'Error desconocido';
        this.mostrarAlerta(`❌ Error: ${mensajeError}`);
        console.log('📋 DTO enviado:', JSON.stringify(ventaDTO, null, 2));
        console.log('📋 Error completo:', JSON.stringify(error, null, 2));
      },
      complete: () => {
        this.loading.set(false);
      },
    });
  }

  protected paginaAnterior(): void {
    if (this.paginaActual() > 1) {
      this.paginaActual.update((p) => p - 1);
      this.scrollToTop();
    }
  }

  protected paginaSiguiente(): void {
    if (this.paginaActual() < this.totalPaginas()) {
      this.paginaActual.update((p) => p + 1);
      this.scrollToTop();
    }
  }

  protected irAPagina(pagina: number): void {
    if (pagina >= 1 && pagina <= this.totalPaginas()) {
      this.paginaActual.set(pagina);
      this.scrollToTop();
    }
  }

  private scrollToTop(): void {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  protected actualizarComisionTerminal(event: Event): void {
    const input = event.target as HTMLInputElement;
    const porcentaje = parseFloat(input.value) || 0;

    if (porcentaje < 0) {
      this.mostrarAlerta('⚠️ La comisión no puede ser negativa');
      this.comisionTerminal.set(0);
      return;
    }

    if (porcentaje > 10) {
      this.mostrarAlerta('⚠️ La comisión no puede ser mayor al 10%');
      this.comisionTerminal.set(10);
      return;
    }

    this.comisionTerminal.set(porcentaje);
    console.log('✅ Comisión de terminal actualizada:', porcentaje, '%');
  }
}
