export interface PagoProveedor {
  _id: string;
  proveedorId: string;
  nombreProveedor: string;
  usuarioId: string;
  nombreUsuario: string;
  monto: number;
  metodoPago: 'efectivo' | 'transferencia' | 'cheque';
  referenciaPago?: string;
  saldoAnterior: number;
  nuevoSaldo: number;
  observaciones?: string;
  comprobante?: string;
  estado: 'pagado' | 'pendiente';
  fechaPago: Date;
  fechaCreacion: Date;
}

/**
 * DTO para registrar pago
 */
export interface RegistrarPagoProveedorDTO {
  proveedorId: string;
  monto: number;
  metodoPago: 'efectivo' | 'transferencia' | 'cheque';
  referenciaPago?: string;
  observaciones?: string;
  comprobante?: string;
}
