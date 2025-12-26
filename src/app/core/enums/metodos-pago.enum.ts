/**
 * Métodos de pago - Sincronizado con backend
 */
export enum MetodoPago {
  EFECTIVO = 'efectivo',
  TRANSFERENCIA = 'transferencia',
  FIADO = 'fiado',
  CHEQUE = 'cheque',
  TARJETA = 'tarjeta',
}

/**
 * Type-safe array
 */
export const METODOS_PAGO_LISTA: readonly MetodoPago[] =
  Object.values(MetodoPago);

/**
 * Metadata para UI
 */
export interface MetodoPagoInfo {
  valor: MetodoPago;
  etiqueta: string;
  icono: string;
  descripcion: string;
  requiereReferencia: boolean;
  color: string;
}

export const METODOS_PAGO_CATALOGO: readonly MetodoPagoInfo[] = [
  {
    valor: MetodoPago.EFECTIVO,
    etiqueta: 'Efectivo',
    icono: '💵',
    descripcion: 'Pago en efectivo',
    requiereReferencia: false,
    color: 'green',
  },
  {
    valor: MetodoPago.TRANSFERENCIA,
    etiqueta: 'Transferencia',
    icono: '🏦',
    descripcion: 'Transferencia bancaria',
    requiereReferencia: true,
    color: 'blue',
  },
  {
    valor: MetodoPago.FIADO,
    etiqueta: 'Fiado',
    icono: '📝',
    descripcion: 'Crédito al cliente',
    requiereReferencia: false,
    color: 'orange',
  },
  {
    valor: MetodoPago.CHEQUE,
    etiqueta: 'Cheque',
    icono: '📄',
    descripcion: 'Pago con cheque',
    requiereReferencia: true,
    color: 'purple',
  },
  {
    valor: MetodoPago.TARJETA,
    etiqueta: 'Tarjeta',
    icono: '💳',
    descripcion: 'Tarjeta débito/crédito',
    requiereReferencia: true,
    color: 'indigo',
  },
] as const;

/**
 * Obtener info de método de pago
 */
export function obtenerInfoMetodoPago(
  metodo: MetodoPago
): MetodoPagoInfo | undefined {
  return METODOS_PAGO_CATALOGO.find((m) => m.valor === metodo);
}

/**
 * Validar método de pago
 */
export function esMetodoPagoValido(metodo: string): metodo is MetodoPago {
  return METODOS_PAGO_LISTA.includes(metodo as MetodoPago);
}
