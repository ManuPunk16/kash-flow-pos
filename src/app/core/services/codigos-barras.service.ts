import { Injectable } from '@angular/core';
import JsBarcode from 'jsbarcode';

@Injectable({
  providedIn: 'root',
})
export class CodigosBarrasService {
  /**
   * Generar código de barras único (EAN-13 compatible)
   */
  generarCodigoBarras(): string {
    const timestamp = Date.now().toString();
    const random = Math.floor(Math.random() * 10000)
      .toString()
      .padStart(4, '0');
    const codigo = `${timestamp.slice(-8)}${random}`.slice(0, 12);

    // Calcular dígito verificador EAN-13
    const digitoVerificador = this.calcularDigitoVerificadorEAN13(codigo);
    return `${codigo}${digitoVerificador}`;
  }

  /**
   * Formatear código de barras para visualización (agregar guiones)
   */
  formatearCodigoBarras(codigo: string): string {
    if (!codigo || codigo.length < 8) return codigo;

    // Formato: XXXX-XXXX-XXXX-X
    return codigo.replace(/(\d{4})(?=\d)/g, '$1-');
  }

  /**
   * Generar imagen de código de barras
   * @param codigo - Código a convertir en imagen
   * @returns Data URL de la imagen generada
   */
  generarImagenCodigoBarras(codigo: string): string {
    const canvas = document.createElement('canvas');

    try {
      JsBarcode(canvas, codigo, {
        format: 'CODE128', // Formato compatible universal
        width: 2,
        height: 80,
        displayValue: true,
        fontSize: 14,
        margin: 10,
        background: '#ffffff',
        lineColor: '#000000',
      });

      return canvas.toDataURL('image/png');
    } catch (error) {
      console.error('❌ Error al generar código de barras:', error);
      return '';
    }
  }

  /**
   * Descargar imagen de código de barras
   */
  descargarImagenCodigoBarras(codigo: string, nombreProducto: string): void {
    const dataUrl = this.generarImagenCodigoBarras(codigo);

    if (!dataUrl) {
      console.error('❌ No se pudo generar la imagen');
      return;
    }

    const link = document.createElement('a');
    link.href = dataUrl;
    link.download = `codigo-barras-${nombreProducto
      .toLowerCase()
      .replace(/\s+/g, '-')}.png`;
    link.click();

    console.log('✅ Código de barras descargado:', nombreProducto);
  }

  /**
   * Copiar imagen al portapapeles
   */
  async copiarImagenAlPortapapeles(codigo: string): Promise<boolean> {
    try {
      const dataUrl = this.generarImagenCodigoBarras(codigo);

      // Convertir data URL a Blob
      const response = await fetch(dataUrl);
      const blob = await response.blob();

      // Copiar al portapapeles
      await navigator.clipboard.write([
        new ClipboardItem({ 'image/png': blob }),
      ]);

      console.log('✅ Código de barras copiado al portapapeles');
      return true;
    } catch (error) {
      console.error('❌ Error al copiar al portapapeles:', error);
      return false;
    }
  }

  /**
   * Imprimir código de barras directamente
   */
  imprimirCodigoBarras(codigo: string, nombreProducto: string): void {
    const dataUrl = this.generarImagenCodigoBarras(codigo);

    if (!dataUrl) {
      console.error('❌ No se pudo generar la imagen');
      return;
    }

    // Crear ventana de impresión
    const ventanaImpresion = window.open('', '_blank', 'width=600,height=400');

    if (!ventanaImpresion) {
      alert('⚠️ Habilita las ventanas emergentes para imprimir');
      return;
    }

    ventanaImpresion.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>Imprimir Código de Barras - ${nombreProducto}</title>
          <style>
            body {
              margin: 0;
              padding: 20px;
              display: flex;
              flex-direction: column;
              align-items: center;
              justify-content: center;
              font-family: Arial, sans-serif;
            }
            h2 {
              margin-bottom: 10px;
              color: #333;
            }
            img {
              border: 1px solid #ddd;
              padding: 10px;
              background: white;
            }
            p {
              margin-top: 10px;
              color: #666;
              font-size: 14px;
            }
          </style>
        </head>
        <body>
          <h2>${nombreProducto}</h2>
          <img src="${dataUrl}" alt="Código de Barras" />
          <p>Código: ${this.formatearCodigoBarras(codigo)}</p>
        </body>
      </html>
    `);

    ventanaImpresion.document.close();
    ventanaImpresion.focus();

    // Imprimir automáticamente después de cargar
    ventanaImpresion.onload = () => {
      ventanaImpresion.print();
      // ventanaImpresion.close(); // Opcional: cerrar después de imprimir
    };
  }

  /**
   * Calcular dígito verificador EAN-13
   */
  private calcularDigitoVerificadorEAN13(codigo: string): number {
    const digitos = codigo.split('').map(Number);
    let suma = 0;

    for (let i = 0; i < digitos.length; i++) {
      suma += digitos[i] * (i % 2 === 0 ? 1 : 3);
    }

    const residuo = suma % 10;
    return residuo === 0 ? 0 : 10 - residuo;
  }
}
