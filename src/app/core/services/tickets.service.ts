import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import html2canvas from 'html2canvas';
import { jsPDF } from 'jspdf';
import { Venta } from '@core/models/venta.model';
import { environment } from '@environments/environment';

export interface ConfiguracionTicket {
  incluirLogo: boolean;
  incluirGanancias: boolean;
  anchoMM: number;
  formatoImpresion: 'termica' | 'carta';
  margenPixels?: number;
}

@Injectable({
  providedIn: 'root',
})
export class TicketsService {
  private readonly http = inject(HttpClient);

  private readonly DATOS_NEGOCIO = {
    nombre: environment.nombreNegocio,
    direccion: environment.direccionNegocio,
    telefono: environment.telefonoNegocio,
    email: environment.emailNegocio,
    rfc: environment.rfcNegocio,
    logo: environment.logoNegocio,
  };

  private readonly CONFIG_DEFAULT: ConfiguracionTicket = {
    incluirLogo: false,
    incluirGanancias: false,
    anchoMM: 80,
    formatoImpresion: 'termica',
    margenPixels: 30, // ✅ Margen generoso
  };

  /**
   * ✅ Generar contenido HTML del ticket (SIN etiquetas html/body)
   */
  private generarContenidoTicket(
    venta: Venta,
    config: Partial<ConfiguracionTicket> = {}
  ): string {
    const cfg = { ...this.CONFIG_DEFAULT, ...config };
    const margen = cfg.margenPixels || 30;

    let contenido = `
      <div style="
        font-family: 'Courier New', 'Consolas', monospace;
        background: white;
        padding: ${margen}px;
        width: ${Math.floor((cfg.anchoMM / 25.4) * 96)}px;
        color: #000;
        font-size: 12px;
        line-height: 1.5;
        text-align: center;
      ">
    `;

    // Logo (opcional)
    if (cfg.incluirLogo && this.DATOS_NEGOCIO.logo) {
      contenido += `<img src="${this.DATOS_NEGOCIO.logo}" alt="Logo" style="max-width: 120px; margin-bottom: 12px;" />`;
    }

    // Datos del negocio
    contenido += `
      <div style="font-size: 18px; font-weight: bold; margin-bottom: 6px; text-transform: uppercase; letter-spacing: 1.5px;">${
        this.DATOS_NEGOCIO.nombre
      }</div>
      <div style="font-size: 11px; margin-bottom: 3px; color: #333;">${
        this.DATOS_NEGOCIO.direccion
      }</div>
      <div style="font-size: 11px; margin-bottom: 3px; color: #333;">Tel: ${
        this.DATOS_NEGOCIO.telefono
      }</div>
      ${
        this.DATOS_NEGOCIO.rfc
          ? `<div style="font-size: 11px; margin-bottom: 3px; color: #333;">RFC: ${this.DATOS_NEGOCIO.rfc}</div>`
          : ''
      }
      <div style="border-top: 2px solid #000; margin: 12px 0;"></div>
    `;

    // Folio y fecha
    const fecha = new Date(venta.fechaVenta);
    contenido += `
      <div style="font-size: 20px; font-weight: bold; margin: 12px 0; letter-spacing: 2px;">TICKET #${
        venta.numeroVenta
      }</div>
      <div style="font-size: 11px; margin-bottom: 12px; color: #555;">${this.formatearFecha(
        fecha
      )}</div>
      <div style="border-top: 1px dashed #000; margin: 12px 0;"></div>
    `;

    // Cliente
    if (venta.nombreCliente && venta.nombreCliente !== 'Cliente de mostrador') {
      contenido += `
        <div style="background: #f5f5f5; padding: 10px; margin: 12px 0; border-radius: 6px; text-align: left;">
          <div style="font-size: 10px; font-weight: bold; color: #666; margin-bottom: 4px;">CLIENTE:</div>
          <div style="font-size: 13px; font-weight: bold;">${venta.nombreCliente}</div>
        </div>
      `;
    }

    // Items
    contenido += `<div style="margin: 15px 0;">`;
    for (const item of venta.items) {
      contenido += `
        <div style="display: flex; justify-content: space-between; font-size: 11px; margin-bottom: 8px; padding: 6px 0; border-bottom: 1px dotted #ddd;">
          <div style="flex: 1; padding-right: 10px; font-weight: 600; text-align: left;">${
            item.nombreProducto
          }</div>
          <div style="display: flex; gap: 10px; align-items: center;">
            <div style="min-width: 40px; text-align: center; font-weight: bold;">${
              item.cantidad
            }x</div>
            <div style="min-width: 80px; text-align: right; font-weight: bold;">$${this.formatearMoneda(
              item.subtotal
            )}</div>
          </div>
        </div>
      `;
    }
    contenido += `</div>`;

    // Totales
    contenido += `<div style="border-top: 2px solid #000; margin: 12px 0;"></div>`;
    contenido += `
      <div style="display: flex; justify-content: space-between; font-size: 12px; margin-bottom: 8px; padding: 4px 0;">
        <span>Subtotal:</span>
        <span>$${this.formatearMoneda(venta.subtotal)}</span>
      </div>
    `;

    if (venta.descuento > 0) {
      contenido += `
        <div style="display: flex; justify-content: space-between; font-size: 12px; margin-bottom: 8px; padding: 4px 0; color: #4caf50;">
          <span>Descuento:</span>
          <span>-$${this.formatearMoneda(venta.descuento)}</span>
        </div>
      `;
    }

    contenido += `
      <div style="font-size: 20px; font-weight: bold; margin: 15px 0; padding: 15px; background: #000; color: #fff; border-radius: 8px;">
        <div style="display: flex; justify-content: space-between; align-items: center;">
          <span>TOTAL:</span>
          <span>$${this.formatearMoneda(venta.total)}</span>
        </div>
      </div>
    `;

    // Método de pago
    const metodoPagoTexto = this.obtenerTextoMetodoPago(venta.metodoPago);
    contenido += `<div style="background: #e8f5e9; padding: 10px; margin: 12px 0; border-radius: 6px; font-size: 14px; font-weight: bold; border: 2px solid #4caf50;">${metodoPagoTexto}</div>`;

    // Ganancias (solo para admin)
    if (cfg.incluirGanancias && venta.gananciaTotal) {
      contenido += `
        <div style="background: #fff3cd; border: 2px dashed #ffc107; padding: 12px; margin: 12px 0; border-radius: 8px;">
          <div style="font-size: 11px; color: #666; margin-bottom: 6px;">SOLO ADMINISTRADOR</div>
          <div style="display: flex; justify-content: space-between; font-weight: bold; color: #ff9800;">
            <span>Ganancia:</span>
            <span>$${this.formatearMoneda(venta.gananciaTotal)}</span>
          </div>
        </div>
      `;
    }

    // Footer
    contenido += `
      <div style="border-top: 1px dashed #000; margin: 12px 0;"></div>
      <div style="margin-top: 25px; font-size: 11px; text-align: center; color: #555; padding-top: 12px; border-top: 1px solid #ddd;">
        <div style="font-size: 14px; font-weight: bold; margin-bottom: 8px;">¡Gracias por su compra!</div>
        ${
          this.DATOS_NEGOCIO.email
            ? `<div>${this.DATOS_NEGOCIO.email}</div>`
            : ''
        }
        <div style="margin-top: 10px; font-size: 10px; color: #999;">Powered by KashFlow POS</div>
      </div>
    `;

    contenido += `</div>`;

    return contenido;
  }

  /**
   * ✅ Generar imagen PNG (MÉTODO SIMPLE COMO CÓDIGO DE BARRAS)
   */
  async generarImagenTicket(
    venta: Venta,
    config: Partial<ConfiguracionTicket> = {}
  ): Promise<Blob> {
    // ✅ Crear contenedor temporal
    const container = document.createElement('div');
    container.innerHTML = this.generarContenidoTicket(venta, config);
    container.style.position = 'absolute';
    container.style.left = '-9999px';
    container.style.top = '0';

    document.body.appendChild(container);

    try {
      // ✅ Esperar renderizado
      await new Promise((resolve) => setTimeout(resolve, 100));

      // ✅ Capturar con html2canvas
      const canvas = await html2canvas(container, {
        scale: 2,
        logging: false,
        backgroundColor: '#ffffff',
        useCORS: true,
        allowTaint: false,
      });

      // ✅ Convertir a blob
      return new Promise((resolve, reject) => {
        canvas.toBlob((blob) => {
          if (blob) {
            resolve(blob);
          } else {
            reject(new Error('Error al generar imagen del ticket'));
          }
        }, 'image/png');
      });
    } finally {
      document.body.removeChild(container);
    }
  }

  /**
   * ✅ Generar PDF del ticket
   */
  async generarPDFTicket(
    venta: Venta,
    config: Partial<ConfiguracionTicket> = {}
  ): Promise<Blob> {
    const cfg = { ...this.CONFIG_DEFAULT, ...config };

    // ✅ Crear contenedor temporal
    const container = document.createElement('div');
    container.innerHTML = this.generarContenidoTicket(venta, cfg);
    container.style.position = 'absolute';
    container.style.left = '-9999px';
    container.style.top = '0';

    document.body.appendChild(container);

    try {
      await new Promise((resolve) => setTimeout(resolve, 100));

      const canvas = await html2canvas(container, {
        scale: 2,
        logging: false,
        backgroundColor: '#ffffff',
        useCORS: true,
        allowTaint: false,
      });

      const imgData = canvas.toDataURL('image/png');

      // ✅ Calcular dimensiones del PDF
      const margenMM = ((cfg.margenPixels || 30) * 25.4) / 96;
      const anchoConMargenMM = cfg.anchoMM + margenMM * 2;
      const alturaMM = (canvas.height * anchoConMargenMM) / canvas.width;

      const pdf = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: [anchoConMargenMM, alturaMM],
      });

      pdf.addImage(imgData, 'PNG', 0, 0, anchoConMargenMM, alturaMM);

      return pdf.output('blob');
    } finally {
      document.body.removeChild(container);
    }
  }

  /**
   * ✅ Copiar imagen al portapapeles
   */
  async copiarImagenAlPortapapeles(venta: Venta): Promise<void> {
    const blob = await this.generarImagenTicket(venta);

    const clipboardItem = new ClipboardItem({
      'image/png': blob,
    });

    await navigator.clipboard.write([clipboardItem]);
  }

  /**
   * ✅ Imprimir ticket
   */
  async imprimirTicket(
    venta: Venta,
    config: Partial<ConfiguracionTicket> = {}
  ): Promise<void> {
    const contenido = this.generarContenidoTicket(venta, config);

    const html = `
      <!DOCTYPE html>
      <html lang="es">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Ticket ${venta.numeroVenta}</title>
        <style>
          body {
            margin: 0;
            padding: 0;
          }
          @media print {
            @page {
              size: ${config.anchoMM || 80}mm auto;
              margin: 0;
            }
          }
        </style>
      </head>
      <body>
        ${contenido}
      </body>
      </html>
    `;

    const ventanaImpresion = window.open('', '_blank', 'width=400,height=600');

    if (!ventanaImpresion) {
      throw new Error('No se pudo abrir ventana de impresión');
    }

    ventanaImpresion.document.write(html);
    ventanaImpresion.document.close();

    ventanaImpresion.onload = () => {
      ventanaImpresion.focus();
      setTimeout(() => {
        ventanaImpresion.print();
      }, 250);
    };
  }

  /**
   * ✅ Descargar como PDF
   */
  async descargarPDF(
    venta: Venta,
    config: Partial<ConfiguracionTicket> = {}
  ): Promise<void> {
    const blob = await this.generarPDFTicket(venta, config);
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `ticket-${venta.numeroVenta}.pdf`;
    a.click();
    URL.revokeObjectURL(url);
  }

  /**
   * ✅ Descargar como imagen
   */
  async descargarImagen(
    venta: Venta,
    config: Partial<ConfiguracionTicket> = {}
  ): Promise<void> {
    const blob = await this.generarImagenTicket(venta, config);
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `ticket-${venta.numeroVenta}.png`;
    a.click();
    URL.revokeObjectURL(url);
  }

  // ===========================
  // MÉTODOS PRIVADOS
  // ===========================

  private formatearFecha(fecha: Date): string {
    return new Intl.DateTimeFormat('es-MX', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    }).format(fecha);
  }

  private formatearMoneda(valor: number): string {
    return valor.toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ',');
  }

  private obtenerTextoMetodoPago(metodo: string): string {
    const metodos: Record<string, string> = {
      efectivo: '💵 Efectivo',
      transferencia: '🏦 Transferencia',
      tarjeta: '💳 Tarjeta',
      fiado: '📝 Crédito',
    };
    return metodos[metodo] || metodo;
  }
}
