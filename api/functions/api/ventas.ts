import '../../src/tipos/vercel';
import { VercelRequest, VercelResponse } from '@vercel/node';
import { verificarAutenticacion } from '../../src/middleware/autenticacion';
import { validar } from '../../src/validacion/validador';
import { esquemaCrearVenta } from '../../src/validacion/schemas';
import { VentasService } from '../../src/services/VentasService';
import { Venta, Cliente, Usuario } from '../../src/models';
import { v4 as uuid } from 'uuid';

/**
 * Vercel Function - Ventas API
 * Maneja GET, POST, PUT para ventas
 */
export default async (req: VercelRequest, res: VercelResponse) => {
  // ✅ CORS headers
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Origin', process.env.CORS_ORIGIN || '*');
  res.setHeader(
    'Access-Control-Allow-Methods',
    'GET,OPTIONS,PATCH,DELETE,POST,PUT'
  );
  res.setHeader(
    'Access-Control-Allow-Headers',
    'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version, Authorization'
  );

  // ✅ Handle preflight
  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  try {
    // ✅ Permitir GET /api/ventas/cliente/:clienteId sin autenticación (opcional)
    const ruta = req.url || '/';
    if (req.method === 'GET' && ruta.includes('/cliente/')) {
      const clienteId = ruta.split('/cliente/')[1]?.split('/')[0];
      if (clienteId) {
        const ventas = await VentasService.obtenerPorCliente(clienteId);
        res.status(200).json({
          exito: true,
          datos: ventas,
          cantidad: ventas.length,
        });
        return;
      }
    }

    // ✅ Autenticación obligatoria para el resto
    await verificarAutenticacion(req, res, () => {});

    if (!req.usuario) {
      res.status(401).json({
        error: 'No autorizado',
        mensaje: 'Token no proporcionado o inválido',
      });
      return;
    }

    // ✅ Routing por método
    switch (req.method) {
      case 'GET':
        // GET /api/ventas - Obtener todas las ventas
        if (!ruta || ruta === '/') {
          const ventas = await VentasService.obtenerTodas();
          res.status(200).json({
            exito: true,
            datos: ventas,
            cantidad: ventas.length,
          });
          return;
        }

        // GET /api/ventas/[id] - Obtener venta específica
        const ventaId = ruta.split('/')[1];
        if (ventaId && !ventaId.includes('cliente')) {
          const venta = await Venta.findById(ventaId)
            .populate('clienteId')
            .populate('usuarioId')
            .populate('items.productoId')
            .lean();

          if (!venta) {
            res.status(404).json({
              exito: false,
              error: 'Venta no encontrada',
            });
            return;
          }

          res.status(200).json({
            exito: true,
            dato: venta,
          });
          return;
        }
        break;

      case 'POST':
        // POST /api/ventas - Crear nueva venta
        const { error, value } = esquemaCrearVenta.validate(req.body, {
          abortEarly: false,
          stripUnknown: true,
        });

        if (error) {
          res.status(400).json({
            exito: false,
            error: 'Validación fallida',
            detalles: error.details.map((d) => ({
              campo: d.path.join('.'),
              mensaje: d.message,
            })),
          });
          return;
        }

        const {
          clienteId,
          usuarioId,
          items,
          descuento = 0,
          metodoPago,
          referenciaPago,
          observaciones,
        } = value;

        // Validar que haya al menos un item
        if (!items || items.length === 0) {
          res.status(400).json({
            exito: false,
            error: 'Validación fallida',
            mensaje: 'La venta debe contener al menos un producto',
          });
          return;
        }

        // Calcular totales
        let subtotal = 0;
        let gananciaTotal = 0;

        const itemsProcesados = items.map(
          (item: {
            productoId: string;
            cantidad: number;
            precioUnitario: number;
            costoUnitario: number;
          }) => {
            const cantidad = item.cantidad;
            const precioUnitario = item.precioUnitario;
            const costoUnitario = item.costoUnitario;

            const subtotalItem = cantidad * precioUnitario;
            const gananciaItem = (precioUnitario - costoUnitario) * cantidad;

            subtotal += subtotalItem;
            gananciaTotal += gananciaItem;

            return {
              productoId: item.productoId,
              nombreProducto: '', // Se llena desde BD
              cantidad,
              precioUnitario,
              costoUnitario,
              subtotal: subtotalItem,
              ganancia: gananciaItem,
              esConsignacion: false,
            };
          }
        );

        const total = subtotal - descuento;

        // Obtener datos del cliente y usuario
        const cliente = await Cliente.findById(clienteId);
        const usuario = await Usuario.findById(usuarioId);

        if (!cliente || !usuario) {
          res.status(404).json({
            exito: false,
            error: 'Cliente o usuario no encontrado',
          });
          return;
        }

        // Crear venta
        const datosVenta = {
          numeroVenta: `VTA-${new Date().toISOString().split('T')[0]}-${uuid()
            .substring(0, 8)
            .toUpperCase()}`,
          clienteId,
          nombreCliente: `${cliente.nombre} ${cliente.apellido}`,
          usuarioId,
          nombreUsuario: `${usuario.nombre} ${usuario.apellido}`,
          items: itemsProcesados,
          subtotal,
          descuento,
          total,
          metodoPago,
          referenciaPago,
          gananciaTotal,
          observaciones,
          estado: 'completada' as const,
          fechaVenta: new Date(),
        };

        const ventaCreada = await VentasService.crear(datosVenta);

        res.status(201).json({
          exito: true,
          mensaje: 'Venta registrada exitosamente ✅',
          dato: ventaCreada,
        });
        return;

      case 'PUT':
        // PUT /api/ventas/[id] - Anular venta
        const idVenta = ruta.split('/')[1];
        if (!idVenta) {
          res.status(400).json({
            exito: false,
            error: 'ID de venta requerido',
          });
          return;
        }

        const { estado } = req.body;

        if (estado !== 'anulada') {
          res.status(400).json({
            exito: false,
            error: 'Operación no permitida',
            mensaje:
              'Solo se puede cambiar el estado a "anulada". Para editar, cree una nueva venta',
          });
          return;
        }

        const ventaExistente = await Venta.findById(idVenta);

        if (!ventaExistente) {
          res.status(404).json({
            exito: false,
            error: 'Venta no encontrada',
          });
          return;
        }

        if (ventaExistente.estado === 'anulada') {
          res.status(400).json({
            exito: false,
            error: 'Venta ya anulada',
          });
          return;
        }

        ventaExistente.estado = 'anulada';
        await ventaExistente.save();

        res.status(200).json({
          exito: true,
          mensaje: 'Venta anulada exitosamente',
          dato: ventaExistente,
        });
        return;

      default:
        res.status(405).json({
          exito: false,
          error: 'Método no permitido',
          metodo: req.method,
        });
        return;
    }
  } catch (error) {
    console.error('❌ Error en ventas API:', error);
    res.status(500).json({
      exito: false,
      error: 'Error al procesar solicitud',
      mensaje: error instanceof Error ? error.message : 'Error desconocido',
    });
  }
};
