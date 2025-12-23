import { AuthenticatedRequest } from '../tipos/AuthenticatedRequest.js';
import { VercelResponse } from '@vercel/node';
import { verificarAutenticacion } from '../middleware/autenticacion.js';
import { esquemaCrearVenta } from '../validacion/schemas.js';
import { VentasService } from '../services/VentasService.js';
import { ProductosService } from '../services/ProductosService.js';
import { Venta, Cliente, Usuario, Producto } from '../models/index.js';
import { conectarMongoDB } from '../config/database.js';
import { v4 as uuid } from 'uuid';

export default async (req: AuthenticatedRequest, res: VercelResponse) => {
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

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  try {
    // ✅ Conectar a MongoDB
    await conectarMongoDB();

    // ✅ Autenticación obligatoria
    let autenticado = false;
    await verificarAutenticacion(req, res, () => {
      autenticado = true;
    });

    if (!autenticado || !req.usuario) {
      return;
    }

    // ✅ Extraer ruta correctamente
    const { pathname } = new URL(req.url || '', `http://${req.headers.host}`);
    const rutaVenta = pathname.replace('/api/ventas', '') || '/';

    console.log('🔍 Debug ventas:', {
      urlCompleta: req.url,
      pathname,
      rutaVenta,
      metodo: req.method,
    });

    // ✅ Routing por método
    switch (req.method) {
      case 'GET':
        // GET /api/ventas - Obtener todas
        if (rutaVenta === '/' || rutaVenta === '') {
          const ventas = await VentasService.obtenerTodas();
          res.status(200).json({
            exito: true,
            datos: ventas,
            cantidad: ventas.length,
          });
          return;
        }

        // GET /api/ventas/cliente/[clienteId]
        if (rutaVenta.includes('/cliente/')) {
          const clienteId = rutaVenta.split('/cliente/')[1]?.split('/')[0];
          if (clienteId && /^[0-9a-fA-F]{24}$/.test(clienteId)) {
            const ventas = await VentasService.obtenerPorCliente(clienteId);
            res.status(200).json({
              exito: true,
              datos: ventas,
              cantidad: ventas.length,
            });
            return;
          }
        }

        // GET /api/ventas/periodo?fechaInicio=YYYY-MM-DD&fechaFin=YYYY-MM-DD
        if (rutaVenta.includes('/periodo')) {
          const { searchParams } = new URL(
            req.url || '',
            `http://${req.headers.host}`
          );
          const fechaInicioStr = searchParams.get('fechaInicio');
          const fechaFinStr = searchParams.get('fechaFin');

          if (!fechaInicioStr || !fechaFinStr) {
            res.status(400).json({
              exito: false,
              error: 'Parámetros requeridos',
              mensaje:
                'Debe proporcionar fechaInicio y fechaFin (formato: YYYY-MM-DD)',
            });
            return;
          }

          const fechaInicio = new Date(fechaInicioStr);
          const fechaFin = new Date(fechaFinStr);

          const ventas = await VentasService.obtenerPorFecha(
            fechaInicio,
            fechaFin
          );

          res.status(200).json({
            exito: true,
            datos: ventas,
            cantidad: ventas.length,
            periodo: {
              inicio: fechaInicio.toISOString(),
              fin: fechaFin.toISOString(),
            },
          });
          return;
        }

        // GET /api/ventas/[id]
        const ventaId = rutaVenta.replace('/', '');
        if (ventaId && /^[0-9a-fA-F]{24}$/.test(ventaId)) {
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

        res.status(400).json({
          exito: false,
          error: 'ID de venta inválido',
        });
        return;

      case 'POST':
        // POST /api/ventas/express - Venta directa de 1 producto
        if (rutaVenta.includes('/express')) {
          const {
            productoId,
            clienteId,
            usuarioId,
            cantidad = 1,
            metodoPago,
          } = req.body;

          if (!productoId || !clienteId || !usuarioId || !metodoPago) {
            res.status(400).json({
              exito: false,
              error: 'Datos incompletos',
              mensaje:
                'Se requiere: productoId, clienteId, usuarioId, metodoPago',
            });
            return;
          }

          // Validar stock
          const hayStock = await ProductosService.validarStock(
            productoId,
            cantidad
          );
          if (!hayStock) {
            res.status(400).json({
              exito: false,
              error: 'Stock insuficiente',
            });
            return;
          }

          // Obtener datos del producto
          const producto = await Producto.findById(productoId);
          if (!producto) {
            res.status(404).json({
              exito: false,
              error: 'Producto no encontrado',
            });
            return;
          }

          const cliente = await Cliente.findById(clienteId);
          const usuario = await Usuario.findById(usuarioId);

          if (!cliente || !usuario) {
            res.status(404).json({
              exito: false,
              error: 'Cliente o usuario no encontrado',
            });
            return;
          }

          // Calcular montos
          const subtotal = producto.precioVenta * cantidad;
          const ganancia =
            (producto.precioVenta - producto.costoUnitario) * cantidad;

          const datosVenta = {
            numeroVenta: `VTA-${new Date().toISOString().split('T')[0]}-${uuid()
              .substring(0, 8)
              .toUpperCase()}`,
            clienteId,
            nombreCliente: `${cliente.nombre} ${cliente.apellido}`,
            usuarioId,
            nombreUsuario: `${usuario.nombre} ${usuario.apellido}`,
            items: [
              {
                productoId,
                nombreProducto: producto.nombre,
                cantidad,
                precioUnitario: producto.precioVenta,
                costoUnitario: producto.costoUnitario,
                subtotal,
                ganancia,
                esConsignacion: producto.esConsignacion,
              },
            ],
            subtotal,
            descuento: 0,
            total: subtotal,
            metodoPago,
            gananciaTotal: ganancia,
            estado: 'completada' as const,
            fechaVenta: new Date(),
          };

          const ventaCreada = await VentasService.crear(datosVenta);

          res.status(201).json({
            exito: true,
            mensaje: '✅ Venta express registrada',
            dato: ventaCreada,
          });
          return;
        }

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

        if (!items || items.length === 0) {
          res.status(400).json({
            exito: false,
            error: 'Validación fallida',
            mensaje: 'La venta debe contener al menos un producto',
          });
          return;
        }

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
              nombreProducto: '',
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

        const cliente = await Cliente.findById(clienteId);
        const usuario = await Usuario.findById(usuarioId);

        if (!cliente || !usuario) {
          res.status(404).json({
            exito: false,
            error: 'Cliente o usuario no encontrado',
          });
          return;
        }

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
        const idVentaActualizar = rutaVenta.replace('/', '');
        if (
          !idVentaActualizar ||
          !/^[0-9a-fA-F]{24}$/.test(idVentaActualizar)
        ) {
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

        const ventaExistente = await Venta.findById(idVentaActualizar);

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
          mensaje: 'Venta anulada exitosamente ✅',
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
