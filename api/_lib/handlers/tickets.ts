import { VercelRequest, VercelResponse } from '@vercel/node';
import { conectarMongoDB } from '../config/database.js';
import { Venta } from '../models/index.js';

/**
 * ✅ Handler para consulta pública de tickets (sin autenticación)
 * Ruta: GET /api/tickets/:ventaId
 */
export default async (req: VercelRequest, res: VercelResponse) => {
  // ✅ CORS
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Origin', process.env.CORS_ORIGIN || '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS');
  res.setHeader(
    'Access-Control-Allow-Headers',
    'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version'
  );

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  try {
    await conectarMongoDB();

    const { pathname } = new URL(req.url || '', `http://${req.headers.host}`);
    const ventaId = pathname.replace('/api/tickets/', '');

    // ✅ Validar ID de MongoDB
    if (!ventaId || !/^[0-9a-fA-F]{24}$/.test(ventaId)) {
      res.status(400).json({
        exito: false,
        error: 'ID de venta inválido',
      });
      return;
    }

    // ✅ Buscar venta
    const venta = await Venta.findById(ventaId).lean();

    if (!venta) {
      res.status(404).json({
        exito: false,
        error: 'Ticket no encontrado',
      });
      return;
    }

    // ✅ Respuesta con datos básicos (sin información sensible)
    res.status(200).json({
      exito: true,
      dato: {
        numeroVenta: venta.numeroVenta,
        fechaVenta: venta.fechaVenta,
        nombreCliente: venta.nombreCliente,
        items: venta.items.map((item) => ({
          nombreProducto: item.nombreProducto,
          cantidad: item.cantidad,
          subtotal: item.subtotal,
        })),
        subtotal: venta.subtotal,
        descuento: venta.descuento,
        total: venta.total,
        metodoPago: venta.metodoPago,
        estado: venta.estado,
      },
    });
  } catch (error) {
    console.error('❌ Error en tickets API:', error);

    res.status(500).json({
      exito: false,
      error: 'Error al consultar ticket',
      mensaje: error instanceof Error ? error.message : 'Error desconocido',
    });
  }
};
