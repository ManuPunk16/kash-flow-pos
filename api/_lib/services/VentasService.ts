import { Venta, type IVenta, Cliente, Producto } from '../models';
import { ProductosService } from './ProductosService';
import { ClientesService } from './ClientesService';

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
   * Crear venta (flujo completo)
   */
  static async crear(datos: Partial<IVenta>): Promise<IVenta> {
    const venta = new Venta(datos);

    // Validar stock de todos los items
    for (const item of venta.items) {
      const hayStock = await ProductosService.validarStock(
        item.productoId.toString(),
        item.cantidad
      );
      if (!hayStock) {
        throw new Error(`Stock insuficiente para producto: ${item.nombreProducto}`);
      }
    }

    // Guardar venta
    await venta.save();

    // Descontar stock
    for (const item of venta.items) {
      await ProductosService.descontarStock(item.productoId.toString(), item.cantidad);
    }

    // Si es venta a fiado, actualizar saldo del cliente
    if (venta.metodoPago === 'fiado') {
      await ClientesService.actualizarSaldoVenta(venta.clienteId.toString(), venta.total);
    }

    return venta;
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
  static async obtenerPorFecha(fechaInicio: Date, fechaFin: Date): Promise<IVenta[]> {
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
  static async calcularGanancia(fechaInicio: Date, fechaFin: Date): Promise<number> {
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