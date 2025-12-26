/**
 * Estados posibles de una venta
 */
export enum EstadoVenta {
  COMPLETADA = 'completada',
  ANULADA = 'anulada',
  PENDIENTE = 'pendiente',
}

/**
 * Array de valores válidos
 */
export const ESTADOS_VENTA_VALORES = Object.values(EstadoVenta);

/**
 * Metadata para visualización
 */
export const ESTADOS_VENTA_METADATA: Record<
  EstadoVenta,
  {
    etiqueta: string;
    color: string;
    icono: string;
    descripcion: string;
  }
> = {
  [EstadoVenta.COMPLETADA]: {
    etiqueta: 'Completada',
    color: 'green',
    icono: '✅',
    descripcion: 'Venta finalizada correctamente',
  },
  [EstadoVenta.ANULADA]: {
    etiqueta: 'Anulada',
    color: 'red',
    icono: '❌',
    descripcion: 'Venta cancelada',
  },
  [EstadoVenta.PENDIENTE]: {
    etiqueta: 'Pendiente',
    color: 'yellow',
    icono: '⏳',
    descripcion: 'Venta en proceso',
  },
};

/**
 * Validar estado de venta
 */
export function esEstadoVentaValido(estado: string): estado is EstadoVenta {
  return ESTADOS_VENTA_VALORES.includes(estado as EstadoVenta);
}
