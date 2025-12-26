/**
 * Métodos de pago aceptados en el sistema
 */
export enum MetodoPago {
  EFECTIVO = 'efectivo',
  TRANSFERENCIA = 'transferencia',
  FIADO = 'fiado',
  CHEQUE = 'cheque',
  TARJETA = 'tarjeta',
}

/**
 * Array de valores válidos
 */
export const METODOS_PAGO_VALORES = Object.values(MetodoPago);

/**
 * Metadata para visualización
 */
export const METODOS_PAGO_METADATA: Record<
  MetodoPago,
  {
    etiqueta: string;
    icono: string;
    descripcion: string;
    requiereReferencia: boolean;
  }
> = {
  [MetodoPago.EFECTIVO]: {
    etiqueta: 'Efectivo',
    icono: '💵',
    descripcion: 'Pago en efectivo',
    requiereReferencia: false,
  },
  [MetodoPago.TRANSFERENCIA]: {
    etiqueta: 'Transferencia',
    icono: '🏦',
    descripcion: 'Transferencia bancaria',
    requiereReferencia: true,
  },
  [MetodoPago.FIADO]: {
    etiqueta: 'Fiado',
    icono: '📝',
    descripcion: 'Crédito al cliente',
    requiereReferencia: false,
  },
  [MetodoPago.CHEQUE]: {
    etiqueta: 'Cheque',
    icono: '📄',
    descripcion: 'Pago con cheque',
    requiereReferencia: true,
  },
  [MetodoPago.TARJETA]: {
    etiqueta: 'Tarjeta',
    icono: '💳',
    descripcion: 'Tarjeta débito/crédito',
    requiereReferencia: true,
  },
};

/**
 * Validar método de pago
 */
export function esMetodoPagoValido(metodo: string): metodo is MetodoPago {
  return METODOS_PAGO_VALORES.includes(metodo as MetodoPago);
}
