import { Injectable } from '@angular/core';
import { ConfiguracionCodigoBarras } from '@core/models/producto.model';

@Injectable({
  providedIn: 'root',
})
export class CodigosBarrasService {
  private readonly configuracion: ConfiguracionCodigoBarras = {
    prefijo: 'KASH',
    longitudNumero: 8,
    incluirChecksum: true,
  };

  /**
   * Genera un código de barras único
   * Formato: PREFIJO + TIMESTAMP + RANDOM + CHECKSUM
   * Ejemplo: KASH12345678C
   */
  generarCodigoBarras(): string {
    // Timestamp simplificado (últimos 6 dígitos)
    const timestamp = Date.now().toString().slice(-6);

    // Número aleatorio de 2 dígitos
    const random = Math.floor(Math.random() * 100)
      .toString()
      .padStart(2, '0');

    // Combinar
    const numeroBase = timestamp + random;

    // Generar código completo
    let codigo = this.configuracion.prefijo + numeroBase;

    // Agregar checksum si está configurado
    if (this.configuracion.incluirChecksum) {
      const checksum = this.calcularChecksum(numeroBase);
      codigo += checksum;
    }

    return codigo;
  }

  /**
   * Valida formato de código de barras
   */
  validarCodigoBarras(codigo: string): boolean {
    if (!codigo || codigo.length < 8) {
      return false;
    }

    // Si tiene prefijo, validar que coincida
    if (codigo.startsWith(this.configuracion.prefijo)) {
      const numeroBase = codigo.slice(this.configuracion.prefijo.length, -1);
      const checksumRecibido = codigo.slice(-1);
      const checksumCalculado = this.calcularChecksum(numeroBase);

      return checksumRecibido === checksumCalculado;
    }

    // Códigos sin prefijo son válidos (productos importados)
    return /^[A-Z0-9]{8,}$/.test(codigo);
  }

  /**
   * Calcula checksum Luhn (mod 10)
   * @param numero String numérico
   * @returns Dígito de verificación
   */
  private calcularChecksum(numero: string): string {
    let suma = 0;
    let alternar = false;

    // Iterar de derecha a izquierda
    for (let i = numero.length - 1; i >= 0; i--) {
      let digito = parseInt(numero.charAt(i), 10);

      if (alternar) {
        digito *= 2;
        if (digito > 9) {
          digito -= 9;
        }
      }

      suma += digito;
      alternar = !alternar;
    }

    // Calcular dígito verificador
    const checksum = (10 - (suma % 10)) % 10;
    return checksum.toString();
  }

  /**
   * Formatea código de barras para visualización
   * KASH12345678C → KASH-1234-5678-C
   */
  formatearCodigoBarras(codigo: string): string {
    if (!codigo || codigo.length < 8) {
      return codigo;
    }

    // Si tiene prefijo KASH
    if (codigo.startsWith('KASH')) {
      const prefijo = codigo.slice(0, 4);
      const parte1 = codigo.slice(4, 8);
      const parte2 = codigo.slice(8, 12);
      const checksum = codigo.slice(12);

      return `${prefijo}-${parte1}-${parte2}${checksum ? '-' + checksum : ''}`;
    }

    // Formato genérico: grupos de 4
    return codigo.match(/.{1,4}/g)?.join('-') || codigo;
  }

  /**
   * Genera múltiples códigos únicos
   */
  generarCodigosEnLote(cantidad: number): string[] {
    const codigos = new Set<string>();

    while (codigos.size < cantidad) {
      const codigo = this.generarCodigoBarras();
      codigos.add(codigo);
    }

    return Array.from(codigos);
  }
}
