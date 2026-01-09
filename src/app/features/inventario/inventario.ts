import {
  Component,
  ChangeDetectionStrategy,
  signal,
  computed,
  inject,
  OnInit,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

// ✅ SERVICIOS
import { ProductosService } from '@core/services/productos.service';
import { ProveedoresService } from '@core/services/proveedores.service';
import { PreferenciasService } from '@core/services/preferencias.service';
import { CodigosBarrasService } from '@core/services/codigos-barras.service';

// ✅ MODELOS (SIN ENUMS)
import { Producto } from '@core/models/producto.model';
import { Proveedor } from '@core/models/proveedor.model';

// ✅ ENUMS (DESDE BARREL EXPORT)
import { CategoriaProducto, CATEGORIAS_PRODUCTO_CATALOGO } from '@core/enums';

// ✅ COMPONENTES
import { ModalCodigoBarras } from '@shared/components/modal-codigo-barras/modal-codigo-barras';
import { ModalProductoComponent } from './components/modal-producto/modal-producto';

interface CategoriaInfo {
  valor: CategoriaProducto | 'todas';
  etiqueta: string;
  emoji: string;
}

@Component({
  selector: 'app-inventario',
  templateUrl: './inventario.html',
  styleUrl: './inventario.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    CommonModule,
    FormsModule,
    ModalCodigoBarras,
    ModalProductoComponent,
  ],
})
export class Inventario implements OnInit {
  private readonly productosService = inject(ProductosService);
  private readonly proveedoresService = inject(ProveedoresService);
  private readonly preferenciasService = inject(PreferenciasService);
  private readonly codigosBarrasService = inject(CodigosBarrasService);

  // Estado de UI
  protected readonly productos = signal<Producto[]>([]);
  protected readonly proveedores = signal<Proveedor[]>([]);
  protected readonly cargando = signal(false);
  protected readonly error = signal('');
  protected readonly modalAbierto = signal(false);
  protected readonly productoSeleccionado = signal<Producto | null>(null);

  // Filtros
  protected readonly busqueda = signal('');
  protected readonly categoriaSeleccionada = signal<
    CategoriaProducto | 'todas'
  >('todas');
  protected readonly proveedorSeleccionado = signal<string | 'todos'>('todos');
  protected readonly soloStockBajo = signal(false);
  protected readonly soloConsignacion = signal(false);

  // Preferencias (sincronizadas con localStorage)
  protected readonly preferencias = this.preferenciasService.preferencias;
  protected readonly vistaActual = computed(
    () => this.preferencias().inventario.vistaActual
  );
  protected readonly mostrarProveedores = computed(
    () => this.preferencias().inventario.mostrarProveedores
  );
  protected readonly mostrarCodigosBarras = computed(
    () => this.preferencias().inventario.mostrarCodigosBarras
  );

  // ✅ MEJORADO: Usar catálogo desde enum
  protected readonly categorias: CategoriaInfo[] = [
    { valor: 'todas', etiqueta: 'Todas', emoji: '🛒' },
    ...CATEGORIAS_PRODUCTO_CATALOGO.map((cat) => ({
      valor: cat.valor,
      etiqueta: cat.etiqueta,
      emoji: cat.emoji,
    })),
  ];

  // Productos filtrados
  protected readonly productosFiltrados = computed(() => {
    const productosArray = this.productos();

    if (!Array.isArray(productosArray)) {
      console.error('⚠️ productos() no es un array:', productosArray);
      return [];
    }

    let resultado = productosArray;

    // Filtro de búsqueda
    const terminoBusqueda = this.busqueda().toLowerCase().trim();
    if (terminoBusqueda) {
      resultado = resultado.filter(
        (p) =>
          p.nombre.toLowerCase().includes(terminoBusqueda) ||
          p.descripcion.toLowerCase().includes(terminoBusqueda) ||
          p.codigoBarras?.toLowerCase().includes(terminoBusqueda) ||
          p.proveedor?.nombre.toLowerCase().includes(terminoBusqueda)
      );
    }

    // Filtro de categoría
    if (this.categoriaSeleccionada() !== 'todas') {
      resultado = resultado.filter(
        (p) => p.categoria === this.categoriaSeleccionada()
      );
    }

    // Filtro de proveedor
    if (this.proveedorSeleccionado() !== 'todos') {
      resultado = resultado.filter(
        (p) => p.proveedorId === this.proveedorSeleccionado()
      );
    }

    // Filtro de stock bajo
    if (this.soloStockBajo()) {
      resultado = resultado.filter(
        (p) => p.stock <= p.stockMinimo && p.stock > 0
      );
    }

    // Filtro de consignación
    if (this.soloConsignacion()) {
      resultado = resultado.filter((p) => p.esConsignacion);
    }

    return resultado;
  });

  // Estadísticas
  protected readonly estadisticas = computed(() => {
    const prods = this.productos();

    if (!Array.isArray(prods)) {
      console.error('⚠️ productos() no es un array en estadísticas:', prods);
      return {
        total: 0,
        stockBajo: 0,
        sinStock: 0,
        consignacion: 0,
        valorInventario: 0,
      };
    }

    return {
      total: prods.length,
      stockBajo: prods.filter((p) => p.stock <= p.stockMinimo && p.stock > 0)
        .length,
      sinStock: prods.filter((p) => p.stock === 0).length,
      consignacion: prods.filter((p) => p.esConsignacion).length,
      valorInventario: prods.reduce(
        (sum, p) => sum + p.costoUnitario * p.stock,
        0
      ),
    };
  });

  ngOnInit(): void {
    this.cargarDatos();
  }

  protected cargarDatos(): void {
    this.cargarProductos();
    this.cargarProveedores();
  }

  protected cargarProductos(): void {
    this.cargando.set(true);
    this.error.set('');

    this.productosService.obtenerProductos().subscribe({
      next: (productos: Producto[]) => {
        console.log('✅ Productos recibidos:', productos);

        if (Array.isArray(productos)) {
          this.productos.set(productos);
        } else {
          console.error('⚠️ La respuesta no es un array:', productos);
          this.productos.set([]);
          this.error.set('Formato de respuesta inválido del servidor');
        }

        this.cargando.set(false);
      },
      error: (err: Error) => {
        console.error('❌ Error al cargar productos:', err);
        this.error.set('Error al cargar el inventario. Intenta nuevamente.');
        this.productos.set([]);
        this.cargando.set(false);
      },
    });
  }

  protected cargarProveedores(): void {
    this.proveedoresService.obtenerProveedores().subscribe({
      next: (proveedores: Proveedor[]) => {
        console.log('✅ Proveedores cargados:', proveedores.length);
        this.proveedores.set(proveedores);
      },
      error: (err: Error) => {
        console.error('❌ Error al cargar proveedores:', err);
      },
    });
  }

  protected cambiarVista(vista: 'grid' | 'lista'): void {
    this.preferenciasService.actualizarVistaInventario(vista);
  }

  protected toggleMostrarProveedores(): void {
    this.preferenciasService.actualizarMostrarProveedores(
      !this.mostrarProveedores()
    );
  }

  protected toggleMostrarCodigosBarras(): void {
    this.preferenciasService.actualizarMostrarCodigosBarras(
      !this.mostrarCodigosBarras()
    );
  }

  protected limpiarFiltros(): void {
    this.busqueda.set('');
    this.categoriaSeleccionada.set('todas');
    this.proveedorSeleccionado.set('todos');
    this.soloStockBajo.set(false);
    this.soloConsignacion.set(false);
  }

  protected abrirModalNuevo(): void {
    this.productoSeleccionado.set(null);
    this.modalAbierto.set(true);
  }

  protected abrirModalEditar(producto: Producto): void {
    this.productoSeleccionado.set(producto);
    this.modalAbierto.set(true);
  }

  protected cerrarModal(): void {
    this.modalAbierto.set(false);
    this.productoSeleccionado.set(null);
  }

  protected eliminarProducto(producto: Producto): void {
    if (!confirm(`¿Estás seguro de eliminar "${producto.nombre}"?`)) {
      return;
    }

    this.productosService.eliminarProducto(producto._id).subscribe({
      next: () => {
        this.cargarProductos();
      },
      error: (err: Error) => {
        console.error('❌ Error al eliminar producto:', err);
        alert('Error al eliminar el producto. Intenta nuevamente.');
      },
    });
  }

  protected generarCodigoBarras(): string {
    return this.codigosBarrasService.generarCodigoBarras();
  }

  protected formatearCodigoBarras(codigo: string): string {
    return this.codigosBarrasService.formatearCodigoBarras(codigo);
  }

  protected obtenerEmojiCategoria(categoria: CategoriaProducto): string {
    return this.categorias.find((c) => c.valor === categoria)?.emoji || '📦';
  }

  protected obtenerClaseEstadoStock(producto: Producto): string {
    if (producto.stock === 0) {
      return 'bg-red-100 text-red-800';
    }
    if (producto.stock <= producto.stockMinimo) {
      return 'bg-yellow-100 text-yellow-800';
    }
    return 'bg-green-100 text-green-800';
  }

  protected obtenerTextoEstadoStock(producto: Producto): string {
    if (producto.stock === 0) {
      return 'Sin stock';
    }
    if (producto.stock <= producto.stockMinimo) {
      return 'Stock bajo';
    }
    return 'Disponible';
  }

  protected formatearMoneda(valor: number): string {
    return new Intl.NumberFormat('es-MX', {
      style: 'currency',
      currency: 'MXN',
      minimumFractionDigits: 2,
    }).format(valor);
  }

  protected calcularMargenGanancia(producto: Producto): number {
    if (producto.precioVenta === 0) return 0;
    return (
      ((producto.precioVenta - producto.costoUnitario) / producto.precioVenta) *
      100
    );
  }

  // Estado para modal de código de barras
  protected readonly modalCodigoBarrasAbierto = signal(false);
  protected readonly productoCodigoBarras = signal<Producto | null>(null);

  // Abrir modal de código de barras
  protected abrirModalCodigoBarras(producto: Producto): void {
    if (!producto.codigoBarras) {
      alert('⚠️ Este producto no tiene código de barras asignado');
      return;
    }

    this.productoCodigoBarras.set(producto);
    this.modalCodigoBarrasAbierto.set(true);
  }

  // Cerrar modal de código de barras
  protected cerrarModalCodigoBarras(): void {
    this.modalCodigoBarrasAbierto.set(false);
    this.productoCodigoBarras.set(null);
  }

  // ✅ AGREGAR MÉTODO PARA GUARDAR PRODUCTO NUEVO
  protected guardarProductoNuevo(datos: any): void {
    this.productosService.crearProducto(datos).subscribe({
      next: (productoCreado) => {
        console.log('✅ Producto creado:', productoCreado);
        this.cargarProductos();
        this.cerrarModal();
      },
      error: (err: Error) => {
        console.error('❌ Error al crear producto:', err);
        alert(`Error al crear producto: ${err.message}`);
      },
    });
  }

  // ✅ AGREGAR MÉTODO PARA GUARDAR PRODUCTO EDITADO
  protected guardarProductoEditado(datos: any): void {
    const productoId = this.productoSeleccionado()?._id;
    if (!productoId) {
      alert('⚠️ Error: No se encontró el ID del producto');
      return;
    }

    this.productosService.actualizarProducto(productoId, datos).subscribe({
      next: (productoActualizado) => {
        console.log('✅ Producto actualizado:', productoActualizado);
        this.cargarProductos();
        this.cerrarModal();
      },
      error: (err: Error) => {
        console.error('❌ Error al actualizar producto:', err);
        alert(`Error al actualizar producto: ${err.message}`);
      },
    });
  }

  // ✅ MÉTODO UNIFICADO PARA MANEJAR GUARDADO
  protected manejarGuardarProducto(datos: any): void {
    if (this.productoSeleccionado()) {
      this.guardarProductoEditado(datos);
    } else {
      this.guardarProductoNuevo(datos);
    }
  }
}

export default Inventario;
