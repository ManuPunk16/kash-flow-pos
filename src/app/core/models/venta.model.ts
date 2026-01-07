import { MetodoPago, EstadoVenta } from '@core/enums';

// ✅ Interface de item de venta
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

// ✅ Interface principal de venta
export interface Venta {
  _id: string;
  numeroVenta: string;
  fechaVenta: Date | string;
  usuarioId: string;
  nombreUsuario: string;
  clienteId?: string | null;
  nombreCliente: string;
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
  fechaCreacion?: Date | string;
}

// ✅ DTO para registrar venta (lo que envías al backend)
export interface RegistrarVentaDTO {
  clienteId?: string | null;
  items: ItemVenta[];
  metodoPago: MetodoPago;
  descuento?: number;
  observaciones?: string;
  referenciaPago?: string;
}

// ✅ Interface para respuesta de lista paginada
export interface RespuestaListaVentas {
  ventas: Venta[];
  total: number;
  pagina: number;
  limite: number;
  totalPaginas: number;
}

// ✅ Interface genérica de respuesta API
export interface RespuestaAPI<T = any> {
  exito: boolean;
  mensaje?: string;
  datos?: T;
  dato?: T;
  error?: string;
}
