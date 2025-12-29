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
import { Cliente } from '@core/models/cliente.model';

@Component({
  selector: 'app-modal-cliente',
  templateUrl: './modal-cliente.html',
  styleUrl: './modal-cliente.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, FormsModule],
})
export class ModalClienteComponent {
  cliente = input<Cliente | null>(null);
  modoEdicion = input(false);
  onCerrar = output<void>();
  onGuardar = output<any>();

  // Estado del formulario
  protected readonly nombre = signal('');
  protected readonly apellido = signal('');
  protected readonly identificacion = signal('');
  protected readonly email = signal('');
  protected readonly telefono = signal('');
  protected readonly direccion = signal('');

  protected readonly titulo = computed(() =>
    this.modoEdicion() ? 'Editar Cliente' : 'Nuevo Cliente'
  );

  protected readonly formularioValido = computed(() => {
    return (
      this.nombre().trim().length >= 2 &&
      this.apellido().trim().length >= 2 &&
      this.identificacion().trim().length >= 6
    );
  });

  constructor() {
    effect(() => {
      const clienteActual = this.cliente();

      if (clienteActual) {
        this.nombre.set(clienteActual.nombre);
        this.apellido.set(clienteActual.apellido);
        this.identificacion.set(clienteActual.identificacion || '');
        this.email.set(clienteActual.email || '');
        this.telefono.set(clienteActual.telefono || '');
        this.direccion.set(clienteActual.direccion || '');
      } else {
        this.resetearFormulario();
      }
    });
  }

  protected cerrar(): void {
    this.onCerrar.emit();
  }

  protected guardar(): void {
    if (!this.formularioValido()) return;

    const datos = {
      nombre: this.nombre().trim(),
      apellido: this.apellido().trim(),
      identificacion: this.identificacion().trim(),
      email: this.email().trim() || undefined,
      telefono: this.telefono().trim() || undefined,
      direccion: this.direccion().trim() || undefined,
    };

    this.onGuardar.emit(datos);
  }

  private resetearFormulario(): void {
    this.nombre.set('');
    this.apellido.set('');
    this.identificacion.set('');
    this.email.set('');
    this.telefono.set('');
    this.direccion.set('');
  }
}
