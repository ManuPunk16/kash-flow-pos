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
import { ProveedoresService } from '@core/services/proveedores.service';
import { Proveedor, CrearProveedorDTO } from '@core/models/proveedor.model';
import { TarjetaProveedorComponent } from './components/tarjeta-proveedor/tarjeta-proveedor';
import { ModalProveedorComponent } from './components/modal-proveedor/modal-proveedor';
import { DetalleProveedorComponent } from './components/detalle-proveedor/detalle-proveedor'; // ✅ NUEVO

type VistaProveedores = 'grid' | 'tabla';

@Component({
  selector: 'app-proveedores',
  templateUrl: './proveedores.html',
  styleUrl: './proveedores.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    CommonModule,
    FormsModule,
    TarjetaProveedorComponent,
    ModalProveedorComponent,
    DetalleProveedorComponent, // ✅ NUEVO
  ],
})
export class Proveedores implements OnInit {
  private readonly proveedoresService = inject(ProveedoresService);

  // Estado reactivo
  protected readonly proveedores = signal<Proveedor[]>([]);
  protected readonly cargando = signal(false);
  protected readonly error = signal<string | null>(null);
  protected readonly busqueda = signal('');
  protected readonly vista = signal<VistaProveedores>('grid');
  protected readonly mostrarModal = signal(false);
  protected readonly proveedorSeleccionado = signal<Proveedor | null>(null);
  protected readonly modoEdicion = signal(false);
  protected readonly mostrarDetalle = signal(false); // ✅ NUEVO

  // Estado derivado (computado)
  protected readonly proveedoresFiltrados = computed(() => {
    const termino = this.busqueda().toLowerCase().trim();
    const lista = this.proveedores();

    if (!termino) return lista;

    return lista.filter(
      (p) =>
        p.nombre.toLowerCase().includes(termino) ||
        p.contacto?.toLowerCase().includes(termino) ||
        p.nit?.toLowerCase().includes(termino) ||
        p.telefono?.toLowerCase().includes(termino)
    );
  });

  protected readonly proveedoresConDeuda = computed(() =>
    this.proveedores().filter((p) => p.saldoPendiente > 0)
  );

  protected readonly totalDeuda = computed(() =>
    this.proveedoresConDeuda().reduce((sum, p) => sum + p.saldoPendiente, 0)
  );

  protected readonly cantidadProveedores = computed(
    () => this.proveedores().length
  );

  protected readonly cantidadActivos = computed(
    () => this.proveedores().filter((p) => p.activo).length
  );

  ngOnInit(): void {
    this.cargarProveedores();
  }

  protected cargarProveedores(): void {
    this.cargando.set(true);
    this.error.set(null);

    this.proveedoresService.obtenerProveedores().subscribe({
      next: (proveedores) => {
        this.proveedores.set(proveedores);
        this.cargando.set(false);
        console.log('✅ Proveedores cargados:', proveedores.length);
      },
      error: (err) => {
        this.error.set(err.message);
        this.cargando.set(false);
        console.error('❌ Error al cargar proveedores:', err);
      },
    });
  }

  protected cambiarVista(nuevaVista: VistaProveedores): void {
    this.vista.set(nuevaVista);
  }

  protected abrirModalCrear(): void {
    this.proveedorSeleccionado.set(null);
    this.modoEdicion.set(false);
    this.mostrarModal.set(true);
  }

  protected abrirModalEditar(proveedor: Proveedor): void {
    this.proveedorSeleccionado.set(proveedor);
    this.modoEdicion.set(true);
    this.mostrarModal.set(true);
  }

  protected cerrarModal(): void {
    this.mostrarModal.set(false);
    this.proveedorSeleccionado.set(null);
    this.modoEdicion.set(false);
  }

  // ✅ NUEVO: Abrir vista detalle
  protected abrirDetalle(proveedor: Proveedor): void {
    this.proveedorSeleccionado.set(proveedor);
    this.mostrarDetalle.set(true);
  }

  // ✅ NUEVO: Cerrar vista detalle
  protected cerrarDetalle(): void {
    this.mostrarDetalle.set(false);
    this.proveedorSeleccionado.set(null);
  }

  // ✅ NUEVO: Actualizar después de un pago
  protected actualizarDespuesPago(): void {
    this.cargarProveedores();
  }

  protected guardarProveedor(datos: CrearProveedorDTO): void {
    if (this.modoEdicion() && this.proveedorSeleccionado()) {
      // Actualizar existente
      this.proveedoresService
        .actualizarProveedor(this.proveedorSeleccionado()!._id, datos)
        .subscribe({
          next: () => {
            this.cerrarModal();
            this.cargarProveedores();
          },
          error: (err) => {
            console.error('❌ Error al actualizar:', err);
            alert(`Error: ${err.message}`);
          },
        });
    } else {
      // Crear nuevo
      this.proveedoresService.crearProveedor(datos).subscribe({
        next: () => {
          this.cerrarModal();
          this.cargarProveedores();
        },
        error: (err) => {
          console.error('❌ Error al crear:', err);
          alert(`Error: ${err.message}`);
        },
      });
    }
  }

  protected eliminarProveedor(id: string): void {
    if (!confirm('¿Estás seguro de eliminar este proveedor?')) return;

    this.proveedoresService.eliminarProveedor(id).subscribe({
      next: () => {
        this.cargarProveedores();
      },
      error: (err) => {
        console.error('❌ Error al eliminar:', err);
        alert(`Error: ${err.message}`);
      },
    });
  }

  protected actualizarBusqueda(event: Event): void {
    const valor = (event.target as HTMLInputElement).value;
    this.busqueda.set(valor);
  }
}
