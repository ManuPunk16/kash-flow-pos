import {
  Component,
  ChangeDetectionStrategy,
  input,
  output,
  signal,
  inject,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { Venta } from '@core/models/venta.model';
import { TicketsService } from '@core/services/tickets.service';

@Component({
  selector: 'app-modal-ticket',
  imports: [CommonModule],
  templateUrl: './modal-ticket.html',
  styleUrl: './modal-ticket.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ModalTicket {
  private readonly ticketsService = inject(TicketsService);

  // Inputs
  venta = input.required<Venta>();

  // Outputs
  onCerrar = output<void>();

  // Estado local
  protected readonly cargando = signal(false);
  protected readonly mensajeExito = signal<string | null>(null);
  protected readonly mensajeError = signal<string | null>(null);

  protected cerrar(): void {
    this.onCerrar.emit();
  }

  protected async imprimir(): Promise<void> {
    this.cargando.set(true);
    this.limpiarMensajes();

    try {
      await this.ticketsService.imprimirTicket(this.venta());
      this.mostrarExito('✅ Enviado a impresora');
    } catch (error) {
      this.mostrarError(
        '❌ Error al imprimir. Verifica que no haya bloqueadores de pop-ups.'
      );
    } finally {
      this.cargando.set(false);
    }
  }

  protected async descargarPDF(): Promise<void> {
    this.cargando.set(true);
    this.limpiarMensajes();

    try {
      await this.ticketsService.descargarPDF(this.venta());
      this.mostrarExito('✅ PDF descargado');
    } catch (error) {
      this.mostrarError('❌ Error al generar PDF');
    } finally {
      this.cargando.set(false);
    }
  }

  protected async descargarImagen(): Promise<void> {
    this.cargando.set(true);
    this.limpiarMensajes();

    try {
      await this.ticketsService.descargarImagen(this.venta());
      this.mostrarExito('✅ Imagen descargada');
    } catch (error) {
      this.mostrarError('❌ Error al generar imagen');
    } finally {
      this.cargando.set(false);
    }
  }

  protected async copiarImagen(): Promise<void> {
    this.cargando.set(true);
    this.limpiarMensajes();

    try {
      await this.ticketsService.copiarImagenAlPortapapeles(this.venta());
      this.mostrarExito('✅ Imagen copiada al portapapeles');
    } catch (error) {
      this.mostrarError(
        '❌ Error al copiar imagen. Verifica permisos del navegador.'
      );
    } finally {
      this.cargando.set(false);
    }
  }

  private mostrarExito(mensaje: string): void {
    this.mensajeExito.set(mensaje);
    setTimeout(() => this.mensajeExito.set(null), 3000);
  }

  private mostrarError(mensaje: string): void {
    this.mensajeError.set(mensaje);
    setTimeout(() => this.mensajeError.set(null), 3000);
  }

  private limpiarMensajes(): void {
    this.mensajeExito.set(null);
    this.mensajeError.set(null);
  }
}
