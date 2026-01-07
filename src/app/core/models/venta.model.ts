import { MetodoPago, EstadoVenta } from '@core/enums';

export interface ItemVenta {
  productoId: string;
  nombreProducto: string;
  cantidad: number;
  precioUnitario: number;
  costoUnitario: number;
  subtotal: number;
  ganancia: number;
  esConsignacion: boolean;
  proveedorId?: string;
}

export interface Venta {
  _id: string;
  numeroVenta: string;
  clienteId: string;
  nombreCliente: string;
  usuarioId: string;
  nombreUsuario: string;
  items: ItemVenta[];
  subtotal: number;
  descuento: number;
  total: number;
  metodoPago: MetodoPago;
  referenciaPago?: string;
  saldoClienteAntes?: number;
  saldoClienteDespues?: number;
  gananciaTotal: number;
  observaciones?: string;
  estado: EstadoVenta;
  fechaVenta: Date;
  fechaCreacion: Date;
}

/**
 * DTO para registrar una nueva venta
 */
export interface RegistrarVentaDTO {
  clienteId?: string | null; // ✅ Puede ser null para efectivo/tarjeta

  items: Array<{
    productoId: string;
    nombreProducto: string; // ✅ REQUERIDO
    cantidad: number;
    precioUnitario: number;
    costoUnitario: number;
    subtotal: number; // ✅ REQUERIDO
    ganancia: number; // ✅ REQUERIDO
    esConsignacion: boolean; // ✅ REQUERIDO
  }>;

  metodoPago: MetodoPago;
  descuento?: number;
  observaciones?: string;

  // ✅ OPCIONAL: Campos para pago con tarjeta
  comisionTerminal?: number;
  montoComision?: number;
}

/**
 * Respuesta del servidor al listar ventas
 */
export interface RespuestaListaVentas {
  ventas: Venta[];
  total: number;
  pagina: number;
  limite: number;
}

/**
 * Filtros para búsqueda de ventas
 */
export interface FiltrosVentas {
  fechaInicio?: Date;
  fechaFin?: Date;
  clienteId?: string;
  metodoPago?: MetodoPago;
  estado?: EstadoVenta;
  busqueda?: string;
}
