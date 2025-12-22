import { Cliente, type ICliente } from '../models/index.js';

export class ClientesService {
  /**
   * Obtener todos los clientes activos
   */
  static async obtenerTodos(): Promise<ICliente[]> {
    return await Cliente.find({ activo: true }).lean();
  }

  /**
   * Obtener cliente por ID
   */
  static async obtenerPorId(id: string): Promise<ICliente | null> {
    return await Cliente.findById(id).lean();
  }

  /**
   * Obtener deudores (con saldo > 0)
   */
  static async obtenerDeudores(): Promise<ICliente[]> {
    return await Cliente.find({
      activo: true,
      saldoActual: { $gt: 0 },
    })
      .sort({ saldoActual: -1 })
      .lean();
  }

  /**
   * Crear nuevo cliente
   */
  static async crear(datos: Partial<ICliente>): Promise<ICliente> {
    const cliente = new Cliente(datos);
    return await cliente.save();
  }

  /**
   * Actualizar saldo después de venta a crédito
   */
  static async actualizarSaldoVenta(id: string, monto: number): Promise<void> {
    await Cliente.findByIdAndUpdate(id, {
      $inc: { saldoActual: monto },
      $set: { ultimaCompra: new Date() },
    });
  }

  /**
   * Actualizar saldo CON SESIÓN (para transacciones)
   */
  static async actualizarSaldoVentaConSesion(
    id: string,
    monto: number,
    session: ClientSession
  ): Promise<void> {
    await Cliente.findByIdAndUpdate(
      id,
      {
        $inc: { saldoActual: monto },
        $set: { ultimaCompra: new Date() },
      },
      { session }
    );
  }

  /**
   * Registrar abono (pago a la deuda)
   */
  static async registrarAbono(id: string, monto: number): Promise<void> {
    await Cliente.findByIdAndUpdate(id, {
      $inc: { saldoActual: -monto },
    });
  }

  /**
   * Aplicar interés mensual (20%)
   */
  static async aplicarInteres(id: string): Promise<void> {
    const cliente = await Cliente.findById(id);
    if (!cliente) return;

    // Validar que no se haya aplicado interés este mes
    const hoy = new Date();
    if (
      cliente.fechaUltimoCorteInteres &&
      cliente.fechaUltimoCorteInteres.getMonth() === hoy.getMonth() &&
      cliente.fechaUltimoCorteInteres.getFullYear() === hoy.getFullYear()
    ) {
      return; // Ya se aplicó interés este mes
    }

    // Aplicar 20% de interés
    const montoInteres = cliente.saldoActual * 0.2;
    const nuevoSaldo = cliente.saldoActual + montoInteres;

    await Cliente.findByIdAndUpdate(id, {
      saldoActual: nuevoSaldo,
      fechaUltimoCorteInteres: hoy,
      $push: {
        historicoIntereses: {
          fecha: hoy,
          montoAplicado: montoInteres,
          nuevoSaldo,
          descripcion: `Interés mes ${hoy.toLocaleDateString('es-ES')}`,
        },
      },
    });
  }
}
