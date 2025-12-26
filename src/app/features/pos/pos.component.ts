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
import { Producto } from '@core/models/producto.model';

interface RespuestaAPI<T> {
  exito: boolean;
  mensaje?: string;
  datos?: T;
}

interface ItemCarrito {
  productoId: string;
  nombreProducto: string;
  cantidad: number;
  precioUnitario: number;
  costoUnitario: number;
  subtotal: number;
  esConsignacion: boolean;
  proveedorId: string | null;
  stockDisponible: number;
}

interface Cliente {
  id: string;
  nombre: string;
  apellido: string;
  saldoActual: number;
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

  // 🔥 Estado con signals
  private readonly todosLosProductos = signal<Producto[]>([]);
  protected readonly terminoBusqueda = signal('');
  protected readonly carrito = signal<ItemCarrito[]>([]);
  protected readonly clienteSeleccionado = signal<Cliente | null>(null);
  protected readonly loading = signal(false);
  protected readonly error = signal<string | null>(null);
  protected readonly mensajeAlerta = signal<string | null>(null);

  // 📧 Email del usuario
  protected readonly emailUsuario = computed(
    () => this.authService.obtenerUsuarioActual()?.email || 'Usuario'
  );

  // 🔍 Productos filtrados por búsqueda
  protected readonly productos = computed(() => {
    const termino = this.terminoBusqueda().toLowerCase().trim();

    if (!termino) {
      return this.todosLosProductos();
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
    });
  });

  // 🧮 Estado derivado
  protected readonly total = computed(() =>
    this.carrito().reduce((sum, item) => sum + item.subtotal, 0)
  );

  protected readonly cantidadItems = computed(() =>
    this.carrito().reduce((sum, item) => sum + item.cantidad, 0)
  );

  ngOnInit(): void {
    this.cargarProductos();
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

  protected actualizarBusqueda(event: Event): void {
    const input = event.target as HTMLInputElement;
    this.terminoBusqueda.set(input.value);
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
              }
            : item
        )
      );

      console.log(
        `➕ Incrementado: ${producto.nombre} → ${cantidadEnCarrito + 1}/${
          producto.stock
        }`
      );
    } else {
      const nuevoItem: ItemCarrito = {
        productoId: producto._id,
        nombreProducto: producto.nombre,
        cantidad: 1,
        precioUnitario: producto.precioVenta,
        costoUnitario: producto.costoUnitario,
        subtotal: producto.precioVenta,
        esConsignacion: producto.esConsignacion,
        proveedorId: producto.proveedorId ?? null,
        stockDisponible: producto.stock,
      };

      this.carrito.update((items) => [...items, nuevoItem]);
      console.log(`➕ Agregado: ${producto.nombre} → 1/${producto.stock}`);
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
}
