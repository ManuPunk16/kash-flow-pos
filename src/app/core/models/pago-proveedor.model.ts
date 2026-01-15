import { MetodoPago } from '@core/enums';

export interface PagoProveedor {
  _id: string;
  proveedorId: string;
  nombreProveedor: string;
  usuarioId: string;
  nombreUsuario: string;
  monto: number;
  metodoPago: MetodoPago;
  referenciaPago?: string;
  saldoAnterior: number;
  nuevoSaldo: number;
  observaciones?: string;
  comprobante?: string;
  estado: 'pagado' | 'pendiente';
  fechaPago: string;
  fechaCreacion: string;
}

export interface CrearPagoProveedorDTO {
  proveedorId: string;
  monto: number;
  metodoPago: MetodoPago;
  referenciaPago?: string;
  observaciones?: string;
  comprobante?: string;
  fechaPago?: Date;
}

export interface RespuestaHistorialPagos {
  exito: boolean;
  datos: PagoProveedor[];
  cantidad: number;
  totalPagado: number;
}
