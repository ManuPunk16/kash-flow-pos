import {
  Component,
  ChangeDetectionStrategy,
  input,
  output,
  signal,
  computed,
  inject,
  OnInit,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Proveedor } from '@core/models/proveedor.model';
import { Producto } from '@core/models/producto.model';
import { ProveedoresService } from '@core/services/proveedores.service';
import { HistorialPagosComponent } from '../historial-pagos/historial-pagos';
import { ModalPagoProveedorComponent } from '../modal-pago-proveedor/modal-pago-proveedor';
import {
  ETIQUETAS_CATEGORIAS,
  COLORES_CATEGORIAS,
} from '@core/enums/categorias-proveedor.enum';

interface ProductoConMetricas extends Producto {
  metricas: {
    cantidadVendida: number;
    ingresoTotal: number;
    rotacion: number;
    margenGanancia: number;
  };
}

@Component({
  selector: 'app-detalle-proveedor',
  templateUrl: './detalle-proveedor.html',
  styleUrl: './detalle-proveedor.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    CommonModule,
    FormsModule,
    HistorialPagosComponent,
    ModalPagoProveedorComponent,
  ],
})
export class DetalleProveedorComponent implements OnInit {
  private readonly proveedoresService = inject(ProveedoresService);

  proveedor = input.required<Proveedor>();
  onCerrar = output<void>();
  onActualizar = output<void>();

  // Estado
  protected readonly productos = signal<ProductoConMetricas[]>([]);
  protected readonly cargandoProductos = signal(false);
  protected readonly errorProductos = signal<string | null>(null);
  protected readonly busquedaProducto = signal('');
  protected readonly mostrarModalPago = signal(false);

  // Tabs
  protected readonly tabActiva = signal<'info' | 'productos' | 'pagos'>('info');

  // Productos filtrados
  protected readonly productosFiltrados = computed(() => {
    const termino = this.busquedaProducto().toLowerCase().trim();
    const lista = this.productos();

    if (!termino) return lista;

    return lista.filter(
      (p) =>
        p.nombre.toLowerCase().includes(termino) ||
        p.codigoBarras?.toLowerCase().includes(termino) ||
        p.categoria.toLowerCase().includes(termino)
    );
  });

  // Métricas de productos
  protected readonly totalProductos = computed(() => this.productos().length);

  protected readonly valorInventario = computed(() =>
    this.productos().reduce((sum, p) => sum + p.costoUnitario * p.stock, 0)
  );

  protected readonly productosBajoStock = computed(
    () => this.productos().filter((p) => p.stock <= p.stockMinimo).length
  );

  // Categorías
  protected readonly etiquetasCategorias = ETIQUETAS_CATEGORIAS;
  protected readonly coloresCategorias = COLORES_CATEGORIAS;

  ngOnInit(): void {
    if (this.tabActiva() === 'productos') {
      this.cargarProductos();
    }
  }

  protected cambiarTab(nuevaTab: 'info' | 'productos' | 'pagos'): void {
    this.tabActiva.set(nuevaTab);

    if (nuevaTab === 'productos' && this.productos().length === 0) {
      this.cargarProductos();
    }
  }

  protected cargarProductos(): void {
    this.cargandoProductos.set(true);
    this.errorProductos.set(null);

    this.proveedoresService
      .obtenerProductosPorProveedor(this.proveedor()._id)
      .subscribe({
        next: (respuesta) => {
          this.productos.set(respuesta.datos);
          this.cargandoProductos.set(false);
        },
        error: (err) => {
          this.errorProductos.set(err.message);
          this.cargandoProductos.set(false);
          console.error('❌ Error al cargar productos:', err);
        },
      });
  }

  protected cerrar(): void {
    this.onCerrar.emit();
  }

  protected abrirModalPago(): void {
    this.mostrarModalPago.set(true);
  }

  protected cerrarModalPago(): void {
    this.mostrarModalPago.set(false);
  }

  protected alPagoExitoso(): void {
    this.onActualizar.emit();
    this.cerrarModalPago();
  }

  protected obtenerColorStock(producto: ProductoConMetricas): string {
    if (producto.stock === 0) return 'text-red-600';
    if (producto.stock <= producto.stockMinimo) return 'text-yellow-600';
    return 'text-green-600';
  }

  protected obtenerIconoRotacion(rotacion: number): string {
    if (rotacion >= 1) return '🔥'; // Alta rotación
    if (rotacion >= 0.5) return '📈'; // Media
    if (rotacion > 0) return '📉'; // Baja
    return '💤'; // Sin ventas
  }
}
