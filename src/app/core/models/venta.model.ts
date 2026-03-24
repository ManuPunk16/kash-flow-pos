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
  ajustes?: AjusteVenta[];
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

// ✅ Interface de un campo modificado en un ajuste
export interface CampoModificado {
  campo: string;
  valorAnterior: string | number | boolean | null;
  valorNuevo: string | number | boolean | null;
}

// ✅ Interface de registro de ajuste (auditoría)
export interface AjusteVenta {
  _id?: string;
  fecha: Date | string;
  usuarioUid: string;
  nombreUsuario: string;
  emailUsuario: string;
  razon: string;
  tipoAjuste: 'correccion' | 'anulacion';
  camposModificados: CampoModificado[];
}

// ✅ DTO para solicitar un ajuste
export interface AjustarVentaDTO {
  razon: string;
  accion: 'correccion' | 'anulacion';
  metodoPago?: MetodoPago;
  descuento?: number;
  observaciones?: string;
  referenciaPago?: string;
}
