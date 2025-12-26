/**
 * Estados de venta - Sincronizado con backend
 */
export enum EstadoVenta {
  COMPLETADA = 'completada',
  ANULADA = 'anulada',
  PENDIENTE = 'pendiente',
}

/**
 * Type-safe array
 */
export const ESTADOS_VENTA_LISTA: readonly EstadoVenta[] =
  Object.values(EstadoVenta);

/**
 * Metadata para UI
 */
export interface EstadoVentaInfo {
  valor: EstadoVenta;
  etiqueta: string;
  icono: string;
  descripcion: string;
  colorBg: string;
  colorTexto: string;
}

export const ESTADOS_VENTA_CATALOGO: readonly EstadoVentaInfo[] = [
  {
    valor: EstadoVenta.COMPLETADA,
    etiqueta: 'Completada',
    icono: '✅',
    descripcion: 'Venta finalizada correctamente',
    colorBg: 'bg-green-100',
    colorTexto: 'text-green-800',
  },
  {
    valor: EstadoVenta.ANULADA,
    etiqueta: 'Anulada',
    icono: '❌',
    descripcion: 'Venta cancelada',
    colorBg: 'bg-red-100',
    colorTexto: 'text-red-800',
  },
  {
    valor: EstadoVenta.PENDIENTE,
    etiqueta: 'Pendiente',
    icono: '⏳',
    descripcion: 'Venta en proceso',
    colorBg: 'bg-yellow-100',
    colorTexto: 'text-yellow-800',
  },
] as const;

/**
 * Obtener info de estado
 */
export function obtenerInfoEstado(
  estado: EstadoVenta
): EstadoVentaInfo | undefined {
  return ESTADOS_VENTA_CATALOGO.find((e) => e.valor === estado);
}

/**
 * Validar estado
 */
export function esEstadoValido(estado: string): estado is EstadoVenta {
  return ESTADOS_VENTA_LISTA.includes(estado as EstadoVenta);
}
