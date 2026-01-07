import { MetodoPago } from '@core/enums';

export interface Abono {
  _id: string;
  clienteId: string;
  nombreCliente: string;
  usuarioId: string;
  nombreUsuario: string;
  monto: number;
  metodoPago: 'efectivo' | 'transferencia' | 'cheque'; // ⚠️ Backend usa subset de MetodoPago
  referenciaPago?: string;
  saldoAnterior: number;
  nuevoSaldo: number;
  observaciones?: string;
  confirmado: boolean;
  fechaPago: Date;
  fechaCreacion: Date;
}

/**
 * DTO para registrar un abono
 */
export interface RegistrarAbonoDTO {
  clienteId: string;
  monto: number;
  metodoPago: 'efectivo' | 'transferencia' | 'cheque';
  referenciaPago?: string;
  observaciones?: string;
}

/**
 * Respuesta del servidor
 */
export interface RespuestaAbono {
  abono: Abono;
  clienteActualizado: {
    _id: string;
    saldoActual: number;
  };
}
