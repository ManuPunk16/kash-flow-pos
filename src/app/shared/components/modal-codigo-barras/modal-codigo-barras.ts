import {
  Component,
  ChangeDetectionStrategy,
  input,
  output,
  inject,
  effect,
  signal,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { CodigosBarrasService } from '@core/services/codigos-barras.service';

@Component({
  selector: 'app-modal-codigo-barras',
  imports: [CommonModule],
  template: `
    <div
      class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50 animate-fadeIn"
      (click)="cerrar()"
    >
      <div
        class="bg-white rounded-xl p-6 max-w-md w-full shadow-2xl"
        (click)="$event.stopPropagation()"
      >
        <!-- Header -->
        <div class="flex items-center justify-between mb-4">
          <h2 class="text-xl font-bold text-gray-900">🏷️ Código de Barras</h2>
          <button
            (click)="cerrar()"
            class="text-gray-400 hover:text-gray-600 text-2xl"
            aria-label="Cerrar"
          >
            ✕
          </button>
        </div>

        <!-- Nombre del Producto -->
        <div class="mb-4 text-center">
          <p class="text-lg font-semibold text-gray-800">
            {{ nombreProducto() }}
          </p>
          <p class="text-sm text-gray-500 font-mono mt-1">
            {{ codigoBarrasService.formatearCodigoBarras(codigoBarras()) }}
          </p>
        </div>

        <!-- Imagen del Código de Barras -->
        @if (imagenCodigoBarras()) {
        <div class="mb-6 bg-gray-50 rounded-lg p-4 flex justify-center">
          <img
            [src]="imagenCodigoBarras()"
            [alt]="'Código de barras de ' + nombreProducto()"
            class="max-w-full h-auto"
          />
        </div>
        } @else {
        <div
          class="mb-6 bg-gray-50 rounded-lg p-8 flex items-center justify-center"
        >
          <p class="text-gray-500">Generando código de barras...</p>
        </div>
        }

        <!-- Acciones -->
        <div class="grid grid-cols-3 gap-3">
          <button
            (click)="descargar()"
            class="px-4 py-3 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg transition-colors flex flex-col items-center gap-1"
          >
            <span class="text-2xl">💾</span>
            <span class="text-xs">Descargar</span>
          </button>

          <button
            (click)="copiar()"
            [disabled]="copiando()"
            class="px-4 py-3 bg-green-600 hover:bg-green-700 disabled:bg-gray-400 text-white font-semibold rounded-lg transition-colors flex flex-col items-center gap-1"
          >
            <span class="text-2xl">{{ copiando() ? '✅' : '📋' }}</span>
            <span class="text-xs">{{ copiando() ? 'Copiado' : 'Copiar' }}</span>
          </button>

          <button
            (click)="imprimir()"
            class="px-4 py-3 bg-purple-600 hover:bg-purple-700 text-white font-semibold rounded-lg transition-colors flex flex-col items-center gap-1"
          >
            <span class="text-2xl">🖨️</span>
            <span class="text-xs">Imprimir</span>
          </button>
        </div>

        <!-- Mensaje de Confirmación -->
        @if (mensajeConfirmacion()) {
        <div
          class="mt-4 p-3 bg-green-100 text-green-800 rounded-lg text-center text-sm font-semibold animate-fadeIn"
        >
          {{ mensajeConfirmacion() }}
        </div>
        }
      </div>
    </div>
  `,
  styles: `
    :host {
      display: block;
    }

    @keyframes fadeIn {
      from { opacity: 0; }
      to { opacity: 1; }
    }

    .animate-fadeIn {
      animation: fadeIn 0.2s ease-out;
    }
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ModalCodigoBarras {
  protected readonly codigoBarrasService = inject(CodigosBarrasService);

  // Inputs
  readonly codigoBarras = input.required<string>();
  readonly nombreProducto = input.required<string>();

  // Outputs
  readonly onCerrar = output<void>();

  // Estado local
  protected readonly imagenCodigoBarras = signal<string>('');
  protected readonly copiando = signal(false);
  protected readonly mensajeConfirmacion = signal('');

  constructor() {
    // Generar imagen cuando cambie el código
    effect(() => {
      const codigo = this.codigoBarras();
      if (codigo) {
        const imagen =
          this.codigoBarrasService.generarImagenCodigoBarras(codigo);
        this.imagenCodigoBarras.set(imagen);
      }
    });
  }

  protected cerrar(): void {
    this.onCerrar.emit();
  }

  protected descargar(): void {
    this.codigoBarrasService.descargarImagenCodigoBarras(
      this.codigoBarras(),
      this.nombreProducto()
    );

    this.mostrarMensaje('✅ Código descargado');
  }

  protected async copiar(): Promise<void> {
    this.copiando.set(true);

    const exito = await this.codigoBarrasService.copiarImagenAlPortapapeles(
      this.codigoBarras()
    );

    if (exito) {
      this.mostrarMensaje('✅ Copiado al portapapeles');
    } else {
      this.mostrarMensaje('❌ Error al copiar');
    }

    setTimeout(() => {
      this.copiando.set(false);
    }, 2000);
  }

  protected imprimir(): void {
    this.codigoBarrasService.imprimirCodigoBarras(
      this.codigoBarras(),
      this.nombreProducto()
    );

    this.mostrarMensaje('🖨️ Enviado a impresora');
  }

  private mostrarMensaje(mensaje: string): void {
    this.mensajeConfirmacion.set(mensaje);

    setTimeout(() => {
      this.mensajeConfirmacion.set('');
    }, 3000);
  }
}

export default ModalCodigoBarras;
