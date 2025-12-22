import {
  Venta,
  Cliente,
  Producto,
  Proveedor,
  AbonoCliente,
  PagoProveedor,
} from '../models/index.js';
import { logger } from '../utils/logger.js';

export interface ResumenDashboard {
  ventasHoy: {
    cantidad: number;
    total: number;
    ganancia: number;
  };
  ventasMes: {
    cantidad: number;
    total: number;
    ganancia: number;
  };
  clientes: {
    total: number;
    deudores: number;
    montoTotalDeuda: number;
  };
  productos: {
    total: number;
    stockBajo: number;
    sinStock: number;
  };
  proveedores: {
    total: number;
    conDeuda: number;
    montoTotalDeuda: number;
  };
}

export interface TopProducto {
  _id: string;
  nombre: string;
  cantidadVendida: number;
  totalVentas: number;
  gananciaTotal: number;
}

export class ReportesService {
  /**
   * Obtener resumen completo del dashboard
   */
  static async obtenerResumenDashboard(): Promise<ResumenDashboard> {
    const hoy = new Date();
    hoy.setHours(0, 0, 0, 0);

    const primerDiaMes = new Date(hoy.getFullYear(), hoy.getMonth(), 1);
    const ultimoDiaMes = new Date(hoy.getFullYear(), hoy.getMonth() + 1, 0);

    logger.debug('Generando resumen dashboard', {
      fecha: hoy,
      mes: primerDiaMes,
    });

    // Ventas del día
    const ventasHoy = await Venta.aggregate([
      {
        $match: {
          fechaVenta: { $gte: hoy },
          estado: 'completada',
        },
      },
      {
        $group: {
          _id: null,
          cantidad: { $sum: 1 },
          total: { $sum: '$total' },
          ganancia: { $sum: '$gananciaTotal' },
        },
      },
    ]);

    // Ventas del mes
    const ventasMes = await Venta.aggregate([
      {
        $match: {
          fechaVenta: { $gte: primerDiaMes, $lte: ultimoDiaMes },
          estado: 'completada',
        },
      },
      {
        $group: {
          _id: null,
          cantidad: { $sum: 1 },
          total: { $sum: '$total' },
          ganancia: { $sum: '$gananciaTotal' },
        },
      },
    ]);

    // Clientes
    const [clientesTotal, clientesDeudores] = await Promise.all([
      Cliente.countDocuments({ activo: true }),
      Cliente.find({ activo: true, saldoActual: { $gt: 0 } }).lean(),
    ]);

    const montoTotalDeuda = clientesDeudores.reduce(
      (sum, c) => sum + c.saldoActual,
      0
    );

    // Productos
    const [productosTotal, productosStockBajo, productosSinStock] =
      await Promise.all([
        Producto.countDocuments({ activo: true }),
        Producto.countDocuments({
          activo: true,
          $expr: { $lt: ['$stock', '$stockMinimo'] },
          stock: { $gt: 0 },
        }),
        Producto.countDocuments({ activo: true, stock: 0 }),
      ]);

    // Proveedores
    const [proveedoresTotal, proveedoresConDeuda] = await Promise.all([
      Proveedor.countDocuments({ activo: true }),
      Proveedor.find({ activo: true, saldoPendiente: { $gt: 0 } }).lean(),
    ]);

    const montoTotalDeudaProveedores = proveedoresConDeuda.reduce(
      (sum, p) => sum + p.saldoPendiente,
      0
    );

    return {
      ventasHoy: ventasHoy[0] || { cantidad: 0, total: 0, ganancia: 0 },
      ventasMes: ventasMes[0] || { cantidad: 0, total: 0, ganancia: 0 },
      clientes: {
        total: clientesTotal,
        deudores: clientesDeudores.length,
        montoTotalDeuda,
      },
      productos: {
        total: productosTotal,
        stockBajo: productosStockBajo,
        sinStock: productosSinStock,
      },
      proveedores: {
        total: proveedoresTotal,
        conDeuda: proveedoresConDeuda.length,
        montoTotalDeuda: montoTotalDeudaProveedores,
      },
    };
  }

  /**
   * Top 10 productos más vendidos
   */
  static async obtenerTopProductos(
    limite: number = 10
  ): Promise<TopProducto[]> {
    return await Venta.aggregate([
      { $match: { estado: 'completada' } },
      { $unwind: '$items' },
      {
        $group: {
          _id: '$items.productoId',
          nombre: { $first: '$items.nombreProducto' },
          cantidadVendida: { $sum: '$items.cantidad' },
          totalVentas: { $sum: '$items.subtotal' },
          gananciaTotal: { $sum: '$items.ganancia' },
        },
      },
      { $sort: { cantidadVendida: -1 } },
      { $limit: limite },
    ]);
  }

  /**
   * Ventas por período
   */
  static async obtenerVentasPorPeriodo(
    fechaInicio: Date,
    fechaFin: Date
  ): Promise<any[]> {
    return await Venta.find({
      fechaVenta: { $gte: fechaInicio, $lte: fechaFin },
      estado: 'completada',
    })
      .populate('clienteId', 'nombre apellido')
      .populate('usuarioId', 'nombre apellido')
      .select('-items')
      .sort({ fechaVenta: -1 })
      .lean();
  }

  /**
   * Flujo de caja (entradas vs salidas)
   */
  static async obtenerFlujoCaja(fechaInicio: Date, fechaFin: Date) {
    const [ventas, abonos, pagosProveedores] = await Promise.all([
      Venta.aggregate([
        {
          $match: {
            fechaVenta: { $gte: fechaInicio, $lte: fechaFin },
            estado: 'completada',
            metodoPago: { $in: ['efectivo', 'transferencia'] },
          },
        },
        { $group: { _id: null, total: { $sum: '$total' } } },
      ]),

      AbonoCliente.aggregate([
        {
          $match: {
            fechaPago: { $gte: fechaInicio, $lte: fechaFin },
            confirmado: true,
          },
        },
        { $group: { _id: null, total: { $sum: '$monto' } } },
      ]),

      PagoProveedor.aggregate([
        {
          $match: {
            fechaPago: { $gte: fechaInicio, $lte: fechaFin },
            estado: 'pagado',
          },
        },
        { $group: { _id: null, total: { $sum: '$monto' } } },
      ]),
    ]);

    const ingresos = (ventas[0]?.total || 0) + (abonos[0]?.total || 0);
    const egresos = pagosProveedores[0]?.total || 0;

    return {
      ingresos,
      egresos,
      balance: ingresos - egresos,
    };
  }
}
