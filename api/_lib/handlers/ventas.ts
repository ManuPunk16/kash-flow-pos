import { AuthenticatedRequest } from '../tipos/AuthenticatedRequest.js';
import { VercelResponse } from '@vercel/node';
import { verificarAutenticacion } from '../middleware/autenticacion.js';
import { Venta, Cliente, Producto, Usuario } from '../models/index.js';
import { conectarMongoDB } from '../config/database.js';
import {
  MetodoPago,
  METODOS_PAGO_VALORES,
  esMetodoPagoValido,
  EstadoVenta,
} from '../enums/index.js';

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
    await conectarMongoDB();

    let autenticado = false;
    await verificarAutenticacion(req, res, () => {
      autenticado = true;
    });

    if (!autenticado || !req.usuario) {
      return;
    }

    const { pathname } = new URL(req.url || '', `http://${req.headers.host}`);
    const rutaVenta = pathname.replace('/api/ventas', '') || '/';

    switch (req.method) {
      case 'GET':
        // ✅ GET /api/ventas - Lista con paginación y filtros
        if (rutaVenta === '/' || rutaVenta === '') {
          const { searchParams } = new URL(
            req.url || '',
            `http://${req.headers.host}`
          );

          // ✅ Parámetros de paginación
          const pagina = parseInt(searchParams.get('pagina') || '1', 10);
          const limite = parseInt(searchParams.get('limite') || '20', 10);
          const skip = (pagina - 1) * limite;

          // ✅ Filtros opcionales
          const desde = searchParams.get('desde');
          const hasta = searchParams.get('hasta');
          const metodoPago = searchParams.get('metodoPago');
          const usuarioId = searchParams.get('usuarioId');
          const clienteId = searchParams.get('clienteId');

          // ✅ Construir query
          const query: any = {};

          if (desde || hasta) {
            query.fechaVenta = {};
            if (desde) query.fechaVenta.$gte = new Date(desde);
            if (hasta) query.fechaVenta.$lte = new Date(hasta);
          }

          if (metodoPago && esMetodoPagoValido(metodoPago)) {
            query.metodoPago = metodoPago;
          }

          if (usuarioId) {
            query.usuarioId = usuarioId;
          }

          if (clienteId) {
            query.clienteId = clienteId;
          }

          // ✅ Consultar ventas con paginación
          const [ventas, total] = await Promise.all([
            Venta.find(query)
              .sort({ fechaVenta: -1 })
              .skip(skip)
              .limit(limite)
              .lean(),
            Venta.countDocuments(query),
          ]);

          // ✅ Respuesta con estructura de paginación
          res.status(200).json({
            exito: true,
            datos: {
              ventas,
              total,
              pagina,
              limite,
              totalPaginas: Math.ceil(total / limite),
            },
          });
          return;
        }

        // GET /api/ventas/:id - Detalle de venta
        const ventaId = rutaVenta.replace('/', '');
        if (ventaId && /^[0-9a-fA-F]{24}$/.test(ventaId)) {
          const venta = await Venta.findById(ventaId).lean();

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
        const { clienteId, items, metodoPago, descuento, observaciones } =
          req.body;

        // Validar método de pago
        if (!metodoPago || !esMetodoPagoValido(metodoPago)) {
          res.status(400).json({
            exito: false,
            error: 'Método de pago inválido',
            metodos_validos: METODOS_PAGO_VALORES,
          });
          return;
        }

        // Cliente obligatorio solo para fiado
        if (metodoPago === MetodoPago.FIADO && !clienteId) {
          res.status(400).json({
            exito: false,
            error: 'Cliente requerido para venta a crédito',
          });
          return;
        }

        // Validaciones básicas
        if (!items || !Array.isArray(items) || items.length === 0) {
          res.status(400).json({
            exito: false,
            error: 'Debe haber al menos un producto en la venta',
          });
          return;
        }

        // Cliente puede ser null para efectivo/tarjeta
        let cliente: any = null;
        let nombreCliente = 'Cliente de mostrador';

        if (clienteId) {
          cliente = await Cliente.findById(clienteId);
          if (!cliente) {
            res.status(404).json({
              exito: false,
              error: 'Cliente no encontrado',
            });
            return;
          }
          nombreCliente = `${cliente.nombre} ${cliente.apellido}`;
        }

        // Validar stock de productos
        for (const item of items) {
          const producto = await Producto.findById(item.productoId);
          if (!producto) {
            res.status(404).json({
              exito: false,
              error: `Producto ${item.nombreProducto} no encontrado`,
            });
            return;
          }

          if (producto.stock < item.cantidad) {
            res.status(400).json({
              exito: false,
              error: `Stock insuficiente para ${producto.nombre}. Disponible: ${producto.stock}`,
            });
            return;
          }
        }

        // Calcular totales
        const subtotal = items.reduce(
          (sum: number, item: any) => sum + item.subtotal,
          0
        );
        const descuentoAplicado = descuento || 0;
        const total = subtotal - descuentoAplicado;
        const gananciaTotal = items.reduce(
          (sum: number, item: any) => sum + item.ganancia,
          0
        );

        // Generar número de venta único
        const ultimaVenta = await Venta.findOne()
          .sort({ fechaCreacion: -1 })
          .lean();
        const ultimoNumero = ultimaVenta
          ? parseInt(ultimaVenta.numeroVenta.split('-')[1], 10)
          : 0;
        const numeroVenta = `V-${String(ultimoNumero + 1).padStart(6, '0')}`;

        // Obtener usuario
        const usuario = await Usuario.findOne({ firebaseUid: req.usuario.uid });
        if (!usuario) {
          res.status(404).json({
            exito: false,
            error: 'Usuario no encontrado',
          });
          return;
        }

        // Registrar saldo anterior
        const saldoAnterior = cliente?.saldoActual || 0;

        // Actualizar saldo si es fiado
        if (metodoPago === MetodoPago.FIADO && cliente) {
          cliente.saldoActual += total;
          cliente.saldoHistorico += total;
          cliente.ultimaCompra = new Date();
          await cliente.save();
        }

        // Crear venta
        const nuevaVenta = new Venta({
          numeroVenta,
          clienteId: clienteId || null,
          nombreCliente,
          usuarioId: usuario._id,
          nombreUsuario: `${usuario.nombre} ${usuario.apellido}`,
          items,
          subtotal,
          descuento: descuentoAplicado,
          total,
          metodoPago,
          saldoClienteAntes: saldoAnterior,
          saldoClienteDespues: cliente?.saldoActual || 0,
          gananciaTotal,
          observaciones: observaciones || '',
          estado: EstadoVenta.COMPLETADA,
          fechaVenta: new Date(),
        });

        await nuevaVenta.save();

        // Actualizar stock de productos
        for (const item of items) {
          await Producto.findByIdAndUpdate(item.productoId, {
            $inc: { stock: -item.cantidad },
          });
        }

        res.status(201).json({
          exito: true,
          mensaje: 'Venta registrada exitosamente ✅',
          dato: nuevaVenta,
        });
        return;

      case 'DELETE':
        // Anular venta
        const ventaIdEliminar = rutaVenta.replace('/', '');

        if (!ventaIdEliminar || !/^[0-9a-fA-F]{24}$/.test(ventaIdEliminar)) {
          res.status(400).json({
            exito: false,
            error: 'ID de venta inválido',
          });
          return;
        }

        const ventaAnular = await Venta.findById(ventaIdEliminar);
        if (!ventaAnular) {
          res.status(404).json({
            exito: false,
            error: 'Venta no encontrada',
          });
          return;
        }

        if (ventaAnular.estado === EstadoVenta.ANULADA) {
          res.status(400).json({
            exito: false,
            error: 'La venta ya fue anulada',
          });
          return;
        }

        // Revertir stock
        for (const item of ventaAnular.items) {
          await Producto.findByIdAndUpdate(item.productoId, {
            $inc: { stock: item.cantidad },
          });
        }

        // Si era fiado, revertir saldo
        if (ventaAnular.metodoPago === MetodoPago.FIADO) {
          await Cliente.findByIdAndUpdate(ventaAnular.clienteId, {
            $inc: {
              saldoActual: -ventaAnular.total,
              saldoHistorico: -ventaAnular.total,
            },
          });
        }

        ventaAnular.estado = EstadoVenta.ANULADA;
        await ventaAnular.save();

        res.status(200).json({
          exito: true,
          mensaje: 'Venta anulada exitosamente ✅',
          dato: ventaAnular,
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
