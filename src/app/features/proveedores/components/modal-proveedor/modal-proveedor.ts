import {
  Component,
  ChangeDetectionStrategy,
  input,
  output,
  signal,
  computed,
  effect,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Proveedor, CrearProveedorDTO } from '@core/models/proveedor.model';

@Component({
  selector: 'app-modal-proveedor',
  templateUrl: './modal-proveedor.html',
  styleUrl: './modal-proveedor.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, FormsModule],
})
export class ModalProveedorComponent {
  proveedor = input<Proveedor | null>(null);
  modoEdicion = input(false);
  onCerrar = output<void>();
  onGuardar = output<CrearProveedorDTO>();

  // Estado del formulario
  protected readonly nombre = signal('');
  protected readonly contacto = signal('');
  protected readonly email = signal('');
  protected readonly telefono = signal('');
  protected readonly direccion = signal('');
  protected readonly nit = signal('');
  protected readonly terminoPago = signal(30);

  protected readonly titulo = computed(() =>
    this.modoEdicion() ? 'Editar Proveedor' : 'Nuevo Proveedor'
  );

  protected readonly formularioValido = computed(() => {
    return this.nombre().trim().length >= 3;
  });

  constructor() {
    // ✅ Usar effect para cargar datos cuando el proveedor cambie
    effect(() => {
      const proveedorActual = this.proveedor();

      if (proveedorActual) {
        this.nombre.set(proveedorActual.nombre);
        this.contacto.set(proveedorActual.contacto || '');
        this.email.set(proveedorActual.email || '');
        this.telefono.set(proveedorActual.telefono || '');
        this.direccion.set(proveedorActual.direccion || '');
        this.nit.set(proveedorActual.nit || '');
        this.terminoPago.set(proveedorActual.terminoPago);
      } else {
        // Resetear formulario si no hay proveedor
        this.nombre.set('');
        this.contacto.set('');
        this.email.set('');
        this.telefono.set('');
        this.direccion.set('');
        this.nit.set('');
        this.terminoPago.set(30);
      }
    });
  }

  protected cerrar(): void {
    this.onCerrar.emit();
  }

  protected guardar(): void {
    if (!this.formularioValido()) return;

    const datos: CrearProveedorDTO = {
      nombre: this.nombre().trim(),
      contacto: this.contacto().trim() || undefined,
      email: this.email().trim() || undefined,
      telefono: this.telefono().trim() || undefined,
      direccion: this.direccion().trim() || undefined,
      nit: this.nit().trim() || undefined,
      terminoPago: this.terminoPago(),
    };

    this.onGuardar.emit(datos);
  }
}
