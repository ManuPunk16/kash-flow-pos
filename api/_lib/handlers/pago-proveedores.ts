import { AuthenticatedRequest } from '../tipos/AuthenticatedRequest.js';
import { VercelResponse } from '@vercel/node';
import { verificarAutenticacion } from '../middleware/autenticacion.js';
import { esquemaCrearPagoProveedor } from '../validacion/schemas.js';
import { PagoProveedor, Proveedor, Usuario } from '../models/index.js';
import { conectarMongoDB } from '../config/database.js';

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
    const rutaPago = pathname.replace('/api/pagos-proveedores', '') || '/';

    console.log('🔍 Debug pagos-proveedores:', {
      urlCompleta: req.url,
      pathname,
      rutaPago,
      metodo: req.method,
    });

    // ✅ Routing por método
    switch (req.method) {
      case 'GET':
        // GET /api/pagos-proveedores - Obtener todos
        if (rutaPago === '/' || rutaPago === '') {
          console.log('💰 Consultando pagos a proveedores...');
          const inicio = Date.now();

          const pagos = await PagoProveedor.find()
            .populate('proveedorId', 'nombre nit')
            .populate('usuarioId', 'nombre apellido email')
            .sort({ fechaPago: -1 })
            .lean()
            .maxTimeMS(5000);

          const duracion = Date.now() - inicio;
          console.log(`✅ Pagos obtenidos: ${pagos.length} en ${duracion}ms`);

          res.status(200).json({
            exito: true,
            datos: pagos,
            cantidad: pagos.length,
            tiempoConsulta: `${duracion}ms`,
          });
          return;
        }

        // GET /api/pagos-proveedores/proveedor/[proveedorId]
        if (rutaPago.includes('/proveedor/')) {
          const proveedorId = rutaPago.split('/proveedor/')[1]?.split('/')[0];

          if (proveedorId && /^[0-9a-fA-F]{24}$/.test(proveedorId)) {
            const pagos = await PagoProveedor.find({ proveedorId })
              .sort({ fechaPago: -1 })
              .lean()
              .maxTimeMS(5000);

            const totalPagado = pagos.reduce((sum, p) => sum + p.monto, 0);

            res.status(200).json({
              exito: true,
              datos: pagos,
              cantidad: pagos.length,
              totalPagado,
            });
            return;
          }
        }

        // GET /api/pagos-proveedores/pendientes
        if (rutaPago.includes('/pendientes')) {
          const pagosPendientes = await PagoProveedor.find({
            estado: 'pendiente',
          })
            .populate('proveedorId', 'nombre nit')
            .populate('usuarioId', 'nombre apellido')
            .sort({ fechaPago: -1 })
            .lean()
            .maxTimeMS(5000);

          res.status(200).json({
            exito: true,
            datos: pagosPendientes,
            cantidad: pagosPendientes.length,
            montoPendiente: pagosPendientes.reduce(
              (sum, p) => sum + p.monto,
              0
            ),
          });
          return;
        }

        // GET /api/pagos-proveedores/[id]
        const pagoId = rutaPago.replace('/', '');

        if (pagoId && /^[0-9a-fA-F]{24}$/.test(pagoId)) {
          const pago = await PagoProveedor.findById(pagoId)
            .populate('proveedorId')
            .populate('usuarioId')
            .lean()
            .maxTimeMS(3000);

          if (!pago) {
            res.status(404).json({
              exito: false,
              error: 'Pago no encontrado',
            });
            return;
          }

          res.status(200).json({
            exito: true,
            dato: pago,
          });
          return;
        }

        res.status(400).json({
          exito: false,
          error: 'Ruta inválida',
        });
        return;

      case 'POST':
        const { error, value } = esquemaCrearPagoProveedor.validate(req.body, {
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
          proveedorId,
          monto,
          metodoPago,
          referenciaPago,
          observaciones,
        } = value;

        // ✅ Validar proveedor
        const proveedor = await Proveedor.findById(proveedorId);

        if (!proveedor) {
          res.status(404).json({
            exito: false,
            error: 'Proveedor no encontrado',
          });
          return;
        }

        if (!proveedor.activo) {
          res.status(400).json({
            exito: false,
            error: 'Proveedor inactivo',
            mensaje: 'No se pueden registrar pagos a proveedores inactivos',
          });
          return;
        }

        if (proveedor.saldoPendiente === 0) {
          res.status(400).json({
            exito: false,
            error: 'Sin deuda pendiente',
            mensaje: 'Este proveedor no tiene saldo pendiente',
          });
          return;
        }

        if (monto > proveedor.saldoPendiente) {
          res.status(400).json({
            exito: false,
            error: 'Monto excede deuda',
            mensaje: `El proveedor tiene $${proveedor.saldoPendiente} de saldo. Máximo: $${proveedor.saldoPendiente}`,
          });
          return;
        }

        // ✅ Obtener usuario
        const usuarioId = req.usuario.uid;
        const usuario = await Usuario.findOne({ firebaseUid: usuarioId });

        if (!usuario) {
          res.status(401).json({
            exito: false,
            error: 'Usuario no encontrado',
          });
          return;
        }

        // ✅ Calcular nuevo saldo
        const saldoAnterior = proveedor.saldoPendiente;
        const nuevoSaldo = saldoAnterior - monto;

        // ✅ Crear pago
        const nuevoPago = new PagoProveedor({
          proveedorId,
          nombreProveedor: proveedor.nombre,
          usuarioId: usuario._id,
          nombreUsuario: `${usuario.nombre} ${usuario.apellido}`,
          monto,
          metodoPago,
          referenciaPago,
          observaciones,
          saldoAnterior,
          nuevoSaldo,
          estado: 'pagado',
          fechaPago: new Date(),
          fechaCreacion: new Date(),
        });

        await nuevoPago.save();

        // ✅ Actualizar saldo del proveedor
        proveedor.saldoPendiente = nuevoSaldo;
        proveedor.fechaUltimoAbono = new Date();
        await proveedor.save();

        res.status(201).json({
          exito: true,
          mensaje: 'Pago registrado exitosamente ✅',
          dato: {
            pago: nuevoPago,
            saldoAnterior,
            nuevoSaldo,
            proveedorInfo: {
              nombre: proveedor.nombre,
              nit: proveedor.nit,
            },
          },
        });
        return;

      case 'PUT':
        const idActualizar = rutaPago.replace('/', '');

        if (!idActualizar || !/^[0-9a-fA-F]{24}$/.test(idActualizar)) {
          res.status(400).json({
            exito: false,
            error: 'ID de pago requerido',
          });
          return;
        }

        const { estado } = req.body;

        // Solo permitir cambiar estado a 'pagado' o 'pendiente'
        if (!['pagado', 'pendiente'].includes(estado)) {
          res.status(400).json({
            exito: false,
            error: 'Estado inválido',
            mensaje: 'El estado debe ser "pagado" o "pendiente"',
          });
          return;
        }

        const pagoExistente = await PagoProveedor.findById(idActualizar);

        if (!pagoExistente) {
          res.status(404).json({
            exito: false,
            error: 'Pago no encontrado',
          });
          return;
        }

        pagoExistente.estado = estado;
        await pagoExistente.save();

        res.status(200).json({
          exito: true,
          mensaje: `Pago actualizado a "${estado}" ✅`,
          dato: pagoExistente,
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
    console.error('❌ Error en pagos-proveedores API:', error);

    if (error instanceof Error && error.name === 'MongooseError') {
      res.status(503).json({
        exito: false,
        error: 'Error de base de datos',
        mensaje: 'No se pudo conectar a MongoDB. Intenta nuevamente.',
      });
      return;
    }

    res.status(500).json({
      exito: false,
      error: 'Error al procesar solicitud',
      mensaje: error instanceof Error ? error.message : 'Error desconocido',
    });
  }
};
