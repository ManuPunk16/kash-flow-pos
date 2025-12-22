import { Venta, type IVenta } from '../models/index.js';
import { ProductosService } from './ProductosService.js';
import { ClientesService } from './ClientesService.js';
import { TransaccionesService } from './TransaccionesService.js';
import { ClientSession } from 'mongoose';
import { logger } from '../utils/logger.js';

export class VentasService {
  /**
   * Obtener todas las ventas
   */
  static async obtenerTodas(): Promise<IVenta[]> {
    return await Venta.find()
      .populate('clienteId')
      .populate('usuarioId')
      .populate('items.productoId')
      .lean();
  }

  /**
   * Crear venta CON TRANSACCIÓN (flujo completo)
   */
  static async crear(datos: Partial<IVenta>): Promise<IVenta> {
    logger.info('Iniciando creación de venta', {
      clienteId: datos.clienteId,
      metodoPago: datos.metodoPago,
      total: datos.total,
    });

    return await TransaccionesService.reintentarTransaccion(
      async (session: ClientSession) => {
        const venta = new Venta(datos);

        // ✅ 1. Validar stock de TODOS los items
        for (const item of venta.items) {
          const hayStock = await ProductosService.validarStock(
            item.productoId.toString(),
            item.cantidad
          );

          if (!hayStock) {
            throw new Error(
              `Stock insuficiente para producto: ${item.nombreProducto}`
            );
          }
        }

        // ✅ 2. Guardar venta
        await venta.save({ session });
        logger.debug('Venta guardada en BD', { ventaId: venta._id });

        // ✅ 3. Descontar stock de TODOS los productos
        for (const item of venta.items) {
          await ProductosService.descontarStockConSesion(
            item.productoId.toString(),
            item.cantidad,
            session
          );
        }
        logger.debug('Stock descontado correctamente');

        // ✅ 4. Si es venta a fiado, actualizar saldo del cliente
        if (venta.metodoPago === 'fiado') {
          await ClientesService.actualizarSaldoVentaConSesion(
            venta.clienteId.toString(),
            venta.total,
            session
          );
          logger.debug('Saldo cliente actualizado', {
            clienteId: venta.clienteId,
            nuevoSaldo: venta.total,
          });
        }

        logger.info('✅ Venta creada exitosamente', {
          ventaId: venta._id,
          numeroVenta: venta.numeroVenta,
        });

        return venta;
      }
    );
  }

  /**
   * Obtener ventas por cliente
   */
  static async obtenerPorCliente(clienteId: string): Promise<IVenta[]> {
    return await Venta.find({ clienteId }).lean();
  }

  /**
   * Obtener ventas por fecha
   */
  static async obtenerPorFecha(
    fechaInicio: Date,
    fechaFin: Date
  ): Promise<IVenta[]> {
    return await Venta.find({
      fechaVenta: {
        $gte: fechaInicio,
        $lte: fechaFin,
      },
    }).lean();
  }

  /**
   * Calcular ganancia total de un período
   */
  static async calcularGanancia(
    fechaInicio: Date,
    fechaFin: Date
  ): Promise<number> {
    const resultado = await Venta.aggregate([
      {
        $match: {
          fechaVenta: {
            $gte: fechaInicio,
            $lte: fechaFin,
          },
        },
      },
      {
        $group: {
          _id: null,
          gananciaTotalAcumulada: { $sum: '$gananciaTotal' },
        },
      },
    ]);

    return resultado[0]?.gananciaTotalAcumulada || 0;
  }
}
