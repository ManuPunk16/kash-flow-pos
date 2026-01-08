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

// ✅ SERVICIOS
import { ProductosService } from '@core/services/productos.service';
import { AuthService } from '@core/services/auth.service';
import { ClientesService } from '@core/services/clientes.service';
import { VentasService } from '@core/services/ventas.service';
import { CarritoService } from '@core/services/carrito.service';

// ✅ MODELOS (SIN ENUMS)
import { Producto } from '@core/models/producto.model';
import { ItemCarrito, productoAItemCarrito } from '@core/models/carrito.model';
import { Cliente } from '@core/models/cliente.model';
import { RegistrarVentaDTO } from '@core/models/venta.model';

// ✅ ENUMS (DESDE UN SOLO LUGAR)
import {
  CategoriaProducto,
  CATEGORIAS_PRODUCTO_CATALOGO,
  obtenerInfoCategoria,
  MetodoPago,
} from '@core/enums';

// ✅ COMPONENTES
import { ModalClienteComponent } from '@features/clientes/modal-cliente/modal-cliente';

interface RespuestaAPI<T> {
  exito: boolean;
  mensaje?: string;
  datos?: T;
}

@Component({
  selector: 'app-pos',
  imports: [CommonModule, FormsModule, ModalClienteComponent],
  templateUrl: './pos.component.html',
  styleUrl: './pos.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PosComponent implements OnInit {
  private readonly productosService = inject(ProductosService);
  private readonly authService = inject(AuthService);
  private readonly clientesService = inject(ClientesService);
  private readonly ventasService = inject(VentasService);
  private readonly carritoService = inject(CarritoService);

  private readonly todosLosProductos = signal<Producto[]>([]);
  protected readonly terminoBusqueda = signal('');
  protected readonly categoriaSeleccionada = signal<
    CategoriaProducto | 'todas'
  >('todas');
  protected readonly mostrarCarritoMovil = signal(false);

  protected readonly carrito = computed(() =>
    this.carritoService.obtenerItems()
  );
  protected readonly clienteSeleccionado = signal<Cliente | null>(null);
  protected readonly loading = signal(false);
  protected readonly error = signal<string | null>(null);
  protected readonly mensajeAlerta = signal<string | null>(null);
  protected readonly todosLosClientes = signal<Cliente[]>([]);
  protected readonly busquedaCliente = signal('');
  protected readonly mostrarListaClientes = signal(false);

  protected readonly emailUsuario = computed(
    () => this.authService.obtenerUsuarioActual()?.email || 'Usuario'
  );

  protected readonly CATEGORIAS = [
    { valor: 'todas' as const, etiqueta: 'Todas', emoji: '🛒' },
    ...CATEGORIAS_PRODUCTO_CATALOGO,
  ];

  protected readonly productosFiltrados = computed(() => {
    const termino = this.terminoBusqueda().toLowerCase().trim();
    const categoria = this.categoriaSeleccionada();
    let resultado = this.todosLosProductos();

    if (categoria !== 'todas') {
      resultado = resultado.filter((p) => p.categoria === categoria);
    }

    if (termino) {
      resultado = resultado.filter((producto) => {
        const nombreCoincide = producto.nombre.toLowerCase().includes(termino);
        const codigoCoincide = producto.codigoBarras
          ?.toLowerCase()
          .includes(termino);
        return nombreCoincide || codigoCoincide;
      });
    }

    return resultado;
  });

  protected readonly productos = computed(() => {
    const productosFiltrados = this.productosFiltrados();
    const inicio = (this.paginaActual() - 1) * this.productosPorPagina();
    const fin = inicio + this.productosPorPagina();
    return productosFiltrados.slice(inicio, fin);
  });

  protected readonly total = computed(() => this.carritoService.subtotal());
  protected readonly cantidadItems = computed(() =>
    this.carritoService.cantidadItems()
  );
  protected readonly gananciaTotal = computed(() =>
    this.carritoService.gananciaTotal()
  );
  protected readonly totalConDescuento = computed(() =>
    this.carritoService.totalConDescuento()
  );
  protected readonly totalFinal = computed(() =>
    this.carritoService.totalFinal()
  );
  protected readonly cambioEfectivo = computed(() =>
    this.carritoService.cambioEfectivo()
  );
  protected readonly montoComisionTerminal = computed(() =>
    this.carritoService.montoComision()
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
  protected readonly descuento = signal(0);
  protected readonly comisionTerminal = signal(3.5);
  protected readonly montoPagadoEfectivo = signal(0);

  protected readonly METODOS_PAGO_DISPONIBLES = [
    { valor: MetodoPago.EFECTIVO, etiqueta: 'Efectivo', icono: '💵' },
    { valor: MetodoPago.TRANSFERENCIA, etiqueta: 'Transferencia', icono: '🏦' },
    { valor: MetodoPago.TARJETA, etiqueta: 'Tarjeta', icono: '💳' },
    { valor: MetodoPago.FIADO, etiqueta: 'Fiado', icono: '📝' },
  ] as const;

  protected readonly mostrarInputComision = signal(false);

  protected readonly esMontoPagadoSuficiente = computed(() => {
    if (this.metodoPago() !== MetodoPago.EFECTIVO) return true;
    return this.montoPagadoEfectivo() >= this.totalFinal();
  });

  protected readonly puedeVenderFiado = computed(() => {
    const cliente = this.clienteSeleccionado();
    if (!cliente) return false;

    const limiteCredito = cliente.limiteCredito ?? 100000;
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

    if (this.metodoPago() === MetodoPago.FIADO) {
      if (!this.clienteSeleccionado()) return false;
      if (!this.puedeVenderFiado()) return false;
    }

    return true;
  });

  protected readonly paginaActual = signal(1);
  protected readonly productosPorPagina = signal(20);

  protected readonly totalProductos = computed(
    () => this.productosFiltrados().length
  );

  protected readonly totalPaginas = computed(() => {
    const total = this.totalProductos();
    const porPagina = this.productosPorPagina();
    return total > 0 ? Math.ceil(total / porPagina) : 0;
  });

  protected readonly Math = Math;

  ngOnInit(): void {
    this.cargarProductos();
    this.cargarClientes();

    const cantidadRestaurada = this.carritoService.cantidadItems();
    if (cantidadRestaurada > 0) {
      this.mostrarAlerta(`✅ Carrito restaurado (${cantidadRestaurada} items)`);
    }
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
    this.paginaActual.set(1);
  }

  protected cambiarCategoria(categoria: CategoriaProducto | 'todas'): void {
    this.categoriaSeleccionada.set(categoria);
    this.paginaActual.set(1);
  }

  protected limpiarFiltros(): void {
    this.terminoBusqueda.set('');
    this.categoriaSeleccionada.set('todas');
    this.paginaActual.set(1);
  }

  protected alternarCarritoMovil(): void {
    this.mostrarCarritoMovil.update((v) => !v);
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
          `⚠️ Ya tienes todo el stock disponible de "${producto.nombre}" en el carrito`
        );
        return;
      }

      this.carritoService.incrementarCantidad(producto._id);
    } else {
      const nuevoItem = productoAItemCarrito(producto, 1);
      this.carritoService.agregarItem(nuevoItem);
    }
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

    this.carritoService.incrementarCantidad(productoId);
  }

  protected decrementarCantidad(productoId: string): void {
    this.carritoService.decrementarCantidad(productoId);
  }

  protected eliminarDelCarrito(productoId: string): void {
    this.carritoService.eliminarItem(productoId);
  }

  protected limpiarCarrito(): void {
    this.carritoService.limpiar();
    this.descuento.set(0);
    this.clienteSeleccionado.set(null);
    this.metodoPago.set(MetodoPago.EFECTIVO);
    this.comisionTerminal.set(3.5);
    this.montoPagadoEfectivo.set(0);
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

  protected obtenerEmojiCategoria(categoria: CategoriaProducto): string {
    const info = obtenerInfoCategoria(categoria);
    return info?.emoji || '📦';
  }

  protected obtenerNombreCategoria(categoria: CategoriaProducto): string {
    const categoriaInfo = CATEGORIAS_PRODUCTO_CATALOGO.find(
      (cat) => cat.valor === categoria
    );
    return categoriaInfo?.etiqueta || 'Sin categoría';
  }

  protected obtenerCategoriaCompleta(categoria: CategoriaProducto): string {
    const emoji = this.obtenerEmojiCategoria(categoria);
    const nombre = this.obtenerNombreCategoria(categoria);
    return `${emoji} ${nombre}`;
  }

  protected irAPaginaInput(event: Event): void {
    const input = event.target as HTMLInputElement;
    const pagina = parseInt(input.value, 10);

    if (isNaN(pagina)) {
      input.value = this.paginaActual().toString();
      return;
    }

    if (pagina < 1) {
      this.irAPagina(1);
      input.value = '1';
      return;
    }

    if (pagina > this.totalPaginas()) {
      this.irAPagina(this.totalPaginas());
      input.value = this.totalPaginas().toString();
      return;
    }

    this.irAPagina(pagina);
  }

  private scrollToTop(): void {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  protected actualizarBusquedaCliente(event: Event): void {
    const input = event.target as HTMLInputElement;
    this.busquedaCliente.set(input.value);
    this.mostrarListaClientes.set(input.value.length >= 2);
  }

  protected seleccionarCliente(cliente: Cliente): void {
    this.clienteSeleccionado.set(cliente);
    this.carritoService.establecerCliente(cliente._id);
    this.busquedaCliente.set('');
    this.mostrarListaClientes.set(false);
    console.log('✅ Cliente seleccionado:', cliente.nombre, cliente.apellido);
  }

  protected limpiarCliente(): void {
    this.clienteSeleccionado.set(null);
    this.carritoService.establecerCliente(null);
    this.busquedaCliente.set('');
    this.mostrarListaClientes.set(false);
  }

  protected cerrarListaClientes(): void {
    setTimeout(() => this.mostrarListaClientes.set(false), 200);
  }

  protected cambiarMetodoPago(metodo: MetodoPago): void {
    this.metodoPago.set(metodo);
    this.carritoService.establecerMetodoPago(metodo);

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
    this.carritoService.establecerMontoPagadoEfectivo(monto);
  }

  protected aplicarMontoExacto(): void {
    this.montoPagadoEfectivo.set(this.totalFinal());
    this.carritoService.establecerMontoPagadoEfectivo(this.totalFinal());
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
    this.carritoService.establecerDescuento(monto);
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
    this.mostrarCarritoMovil.set(false);
  }

  protected cerrarModalVenta(): void {
    if (this.loading()) {
      this.mostrarAlerta('⚠️ Espera a que termine el proceso');
      return;
    }

    this.mostrarModalVenta.set(false);
  }

  protected confirmarVenta(): void {
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

        this.limpiarCarrito();
        this.mostrarModalVenta.set(false);
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
      },
      complete: () => {
        this.loading.set(false);
      },
    });
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
    this.carritoService.establecerComisionTerminal(porcentaje);
  }

  protected readonly mostrarModalCrearCliente = signal(false);

  protected abrirModalCrearCliente(): void {
    this.mostrarModalCrearCliente.set(true);
  }

  protected cerrarModalCrearCliente(): void {
    this.mostrarModalCrearCliente.set(false);
  }

  protected guardarClienteNuevo(datos: any): void {
    this.clientesService.crearCliente(datos).subscribe({
      next: (clienteCreado) => {
        console.log('✅ Cliente creado desde POS:', clienteCreado);

        this.cargarClientes();

        setTimeout(() => {
          const cliente = this.todosLosClientes().find(
            (c) => c._id === clienteCreado._id
          );
          if (cliente) {
            this.seleccionarCliente(cliente);
            this.mostrarAlerta('✅ Cliente creado y seleccionado');
          }
        }, 300);

        this.cerrarModalCrearCliente();
      },
      error: (err) => {
        console.error('❌ Error al crear cliente desde POS:', err);
        this.mostrarAlerta(`❌ Error: ${err.message}`);
      },
    });
  }
}
