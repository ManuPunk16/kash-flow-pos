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
import { ClientesService } from '@core/services/clientes.service';
import { Cliente } from '@core/models/cliente.model';
import { TarjetaClienteComponent } from './tarjeta-cliente/tarjeta-cliente';
import { ModalClienteComponent } from './modal-cliente/modal-cliente';
import { ModalAbonoComponent } from './modal-abono/modal-abono';
import { DetalleClienteComponent } from './detalle-cliente/detalle-cliente';
import { ModalCorteInteresComponent } from './modal-corte-interes/modal-corte-interes';

type VistaClientes = 'grid' | 'tabla';
type FiltroEstado = 'todos' | 'deudores' | 'morosos' | 'al-dia';

@Component({
  selector: 'app-clientes',
  templateUrl: './clientes.html',
  styleUrl: './clientes.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    CommonModule,
    FormsModule,
    TarjetaClienteComponent,
    ModalClienteComponent,
    ModalAbonoComponent,
    DetalleClienteComponent,
    ModalCorteInteresComponent,
  ],
})
export class Clientes implements OnInit {
  private readonly clientesService = inject(ClientesService);

  protected readonly clientes = signal<Cliente[]>([]);
  protected readonly cargando = signal(false);
  protected readonly error = signal<string | null>(null);
  protected readonly busqueda = signal('');
  protected readonly vista = signal<VistaClientes>('grid');
  protected readonly filtroEstado = signal<FiltroEstado>('todos');
  protected readonly mostrarModalCliente = signal(false);
  protected readonly mostrarModalAbono = signal(false);
  protected readonly mostrarDetalle = signal(false);
  protected readonly mostrarModalCorteInteres = signal(false);
  protected readonly clienteSeleccionado = signal<Cliente | null>(null);
  protected readonly modoEdicion = signal(false);

  protected readonly clientesFiltrados = computed(() => {
    const termino = this.busqueda().toLowerCase().trim();
    const estado = this.filtroEstado();
    let lista = this.clientes();

    if (estado === 'deudores') lista = lista.filter((c) => c.saldoActual > 0);
    else if (estado === 'morosos') lista = lista.filter((c) => c.esMoroso);
    else if (estado === 'al-dia')
      lista = lista.filter((c) => c.saldoActual === 0);

    if (!termino)
      return lista.slice().sort((a, b) => b.saldoActual - a.saldoActual);

    return lista
      .filter(
        (c) =>
          c.nombre.toLowerCase().includes(termino) ||
          c.apellido.toLowerCase().includes(termino) ||
          c.identificacion?.toLowerCase().includes(termino) ||
          c.telefono?.toLowerCase().includes(termino) ||
          c.email?.toLowerCase().includes(termino),
      )
      .sort((a, b) => b.saldoActual - a.saldoActual);
  });

  protected readonly clientesDeudores = computed(() =>
    this.clientes().filter((c) => c.saldoActual > 0),
  );

  protected readonly clientesMorosos = computed(() =>
    this.clientes().filter((c) => c.esMoroso),
  );

  protected readonly totalAdeudado = computed(() =>
    this.clientesDeudores().reduce((sum, c) => sum + c.saldoActual, 0),
  );

  protected readonly cantidadClientes = computed(() => this.clientes().length);

  protected readonly cantidadActivos = computed(
    () => this.clientes().filter((c) => c.activo).length,
  );

  protected readonly proximoCorte = computed(() => {
    const hoy = new Date();
    const primerDia = new Date(hoy.getFullYear(), hoy.getMonth() + 1, 1);
    const diasFaltantes = Math.ceil(
      (primerDia.getTime() - hoy.getTime()) / (1000 * 60 * 60 * 24),
    );
    return { fecha: primerDia, diasFaltantes };
  });

  ngOnInit(): void {
    this.cargarClientes();
  }

  protected cargarClientes(): void {
    this.cargando.set(true);
    this.error.set(null);

    this.clientesService.obtenerClientes().subscribe({
      next: (clientes) => {
        this.clientes.set(clientes);
        this.cargando.set(false);
      },
      error: (err) => {
        this.error.set(err.message);
        this.cargando.set(false);
      },
    });
  }

  protected cambiarVista(nuevaVista: VistaClientes): void {
    this.vista.set(nuevaVista);
  }

  protected cambiarFiltroEstado(nuevoFiltro: FiltroEstado): void {
    this.filtroEstado.set(nuevoFiltro);
  }

  protected abrirModalCrear(): void {
    this.clienteSeleccionado.set(null);
    this.modoEdicion.set(false);
    this.mostrarModalCliente.set(true);
  }

  protected abrirModalEditar(cliente: Cliente): void {
    this.clienteSeleccionado.set(cliente);
    this.modoEdicion.set(true);
    this.mostrarModalCliente.set(true);
  }

  protected cerrarModalCliente(): void {
    this.mostrarModalCliente.set(false);
    this.clienteSeleccionado.set(null);
    this.modoEdicion.set(false);
  }

  protected guardarCliente(datos: unknown): void {
    if (this.modoEdicion() && this.clienteSeleccionado()) {
      this.clientesService
        .actualizarCliente(this.clienteSeleccionado()!._id, datos as any)
        .subscribe({
          next: () => {
            this.cerrarModalCliente();
            this.cargarClientes();
          },
          error: (err) => alert(`Error: ${err.message}`),
        });
    } else {
      this.clientesService.crearCliente(datos as any).subscribe({
        next: () => {
          this.cerrarModalCliente();
          this.cargarClientes();
        },
        error: (err) => alert(`Error: ${err.message}`),
      });
    }
  }

  protected eliminarCliente(id: string): void {
    if (!confirm('¿Estás seguro de eliminar este cliente?')) return;
    this.clientesService.eliminarCliente(id).subscribe({
      next: () => this.cargarClientes(),
      error: (err) => alert(`Error: ${err.message}`),
    });
  }

  protected abrirModalAbono(cliente: Cliente): void {
    this.mostrarDetalle.set(false);
    setTimeout(() => {
      this.clienteSeleccionado.set(cliente);
      this.mostrarModalAbono.set(true);
    }, 100);
  }

  protected verDetalle(cliente: Cliente): void {
    this.mostrarModalAbono.set(false);
    this.mostrarModalCliente.set(false);
    setTimeout(() => {
      this.clienteSeleccionado.set(cliente);
      this.mostrarDetalle.set(true);
    }, 100);
  }

  protected cerrarDetalle(): void {
    this.mostrarDetalle.set(false);
    setTimeout(() => this.clienteSeleccionado.set(null), 150);
  }

  protected cerrarModalAbono(): void {
    this.mostrarModalAbono.set(false);
    setTimeout(() => this.clienteSeleccionado.set(null), 150);
  }

  protected registrarAbono(datos: unknown): void {
    this.clientesService.registrarAbono(datos as any).subscribe({
      next: () => {
        this.cerrarModalAbono();
        this.cargarClientes();
      },
      error: (err) => alert(`Error: ${err.message}`),
    });
  }

  // ── Corte de Interés ──────────────────────────────────────────────────────

  protected abrirModalCorteInteres(): void {
    this.mostrarModalCorteInteres.set(true);
  }

  protected cerrarModalCorteInteres(): void {
    this.mostrarModalCorteInteres.set(false);
  }

  protected onCorteEjecutado(): void {
    // Recargar clientes para reflejar nuevos saldos
    this.cargarClientes();
  }

  protected actualizarBusqueda(event: Event): void {
    this.busqueda.set((event.target as HTMLInputElement).value);
  }
}
