import { AuthenticatedRequest } from '../tipos/AuthenticatedRequest.js';
import { VercelResponse } from '@vercel/node';
import { verificarAutenticacion } from '../middleware/autenticacion.js';
import { esquemaCrearAbono } from '../validacion/schemas.js';
import { ClientesService } from '../services/ClientesService.js';
import { AbonoCliente, Cliente, Usuario } from '../models/index.js';
import { conectarMongoDB } from '../config/database.js';

/**
 * Vercel Function - Abonos API
 * Maneja GET, POST para abonos a clientes
 */
export default async (req: AuthenticatedRequest, res: VercelResponse) => {
  // ✅ CORS headers
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Origin', process.env.CORS_ORIGIN || '*');
  res.setHeader(
    'Access-Control-Allow-Methods',
    'GET,OPTIONS,PATCH,DELETE,POST,PUT',
  );
  res.setHeader(
    'Access-Control-Allow-Headers',
    'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version, Authorization',
  );

  // ✅ Handle preflight
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
    const rutaAbono = pathname.replace('/api/abonos', '') || '/';

    console.log('🔍 Debug abonos:', {
      urlCompleta: req.url,
      pathname,
      rutaAbono,
      metodo: req.method,
    });

    // ✅ Routing por método
    switch (req.method) {
      case 'GET':
        // GET /api/abonos - Obtener con paginación y filtros
        if (rutaAbono === '/' || rutaAbono === '') {
          const { searchParams } = new URL(
            req.url || '',
            `http://${req.headers.host}`,
          );

          // Paginación (límite máximo 20 para respetar plan gratuito Vercel/Atlas)
          const pagina = Math.max(
            1,
            parseInt(searchParams.get('pagina') || '1', 10),
          );
          const limite = Math.min(
            20,
            Math.max(1, parseInt(searchParams.get('limite') || '20', 10)),
          );
          const skip = (pagina - 1) * limite;

          // Filtros opcionales
          const desde = searchParams.get('desde');
          const hasta = searchParams.get('hasta');
          const metodoPago = searchParams.get('metodoPago');

          // Construir query
          const query: Record<string, unknown> = {};

          if (desde || hasta) {
            const rangFecha: Record<string, Date> = {};
            if (desde) rangFecha.$gte = new Date(desde);
            if (hasta) {
              // Incluir todo el día "hasta"
              const fechaHasta = new Date(hasta);
              fechaHasta.setHours(23, 59, 59, 999);
              rangFecha.$lte = fechaHasta;
            }
            query.fechaPago = rangFecha;
          }

          if (
            metodoPago &&
            ['efectivo', 'transferencia', 'cheque'].includes(metodoPago)
          ) {
            query.metodoPago = metodoPago;
          }

          const [abonos, total] = await Promise.all([
            AbonoCliente.find(query)
              .sort({ fechaPago: -1 })
              .skip(skip)
              .limit(limite)
              .lean(),
            AbonoCliente.countDocuments(query),
          ]);

          res.status(200).json({
            exito: true,
            datos: abonos,
            cantidad: abonos.length,
            total,
            pagina,
            totalPaginas: Math.ceil(total / limite),
          });
          return;
        }

        // GET /api/abonos/cliente/[clienteId]
        if (rutaAbono.includes('/cliente/')) {
          const clienteId = rutaAbono.split('/cliente/')[1]?.split('/')[0];
          if (clienteId && /^[0-9a-fA-F]{24}$/.test(clienteId)) {
            const abonos = await AbonoCliente.find({ clienteId })
              .sort({ fechaPago: -1 })
              .lean();

            res.status(200).json({
              exito: true,
              datos: abonos,
              cantidad: abonos.length,
            });
            return;
          }
        }

        res.status(400).json({
          exito: false,
          error: 'Ruta inválida',
        });
        return;

      case 'POST':
        const { error, value } = esquemaCrearAbono.validate(req.body, {
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

        const { clienteId, monto, metodoPago, referenciaPago, observaciones } =
          value;

        const cliente = await Cliente.findById(clienteId);

        if (!cliente) {
          res.status(404).json({
            exito: false,
            error: 'Cliente no encontrado',
          });
          return;
        }

        if (cliente.saldoActual === 0) {
          res.status(400).json({
            exito: false,
            error: 'Cliente sin deuda',
            mensaje: 'Este cliente no tiene saldo pendiente',
          });
          return;
        }

        if (monto > cliente.saldoActual) {
          res.status(400).json({
            exito: false,
            error: 'Monto mayor que deuda',
            mensaje: `El cliente debe $${cliente.saldoActual}. Máximo: $${cliente.saldoActual}`,
          });
          return;
        }

        const usuarioId = req.usuario.uid;
        const usuario = await Usuario.findOne({ firebaseUid: usuarioId });

        if (!usuario) {
          res.status(401).json({
            exito: false,
            error: 'Usuario no encontrado',
          });
          return;
        }

        const saldoAnterior = cliente.saldoActual;
        const nuevoSaldo = saldoAnterior - monto;

        const nuevoAbono = new AbonoCliente({
          clienteId,
          nombreCliente: `${cliente.nombre} ${cliente.apellido}`,
          usuarioId: usuario._id,
          nombreUsuario: `${usuario.nombre} ${usuario.apellido}`,
          monto,
          metodoPago,
          referenciaPago,
          observaciones,
          saldoAnterior,
          nuevoSaldo,
          confirmado: true,
          fechaPago: new Date(),
        });

        await nuevoAbono.save();
        await ClientesService.registrarAbono(clienteId, monto);

        res.status(201).json({
          exito: true,
          mensaje: 'Abono registrado exitosamente ✅',
          dato: {
            abono: nuevoAbono,
            saldoAnterior,
            nuevoSaldo,
            clienteInfo: {
              nombre: cliente.nombre,
              apellido: cliente.apellido,
            },
          },
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
    console.error('❌ Error en abonos API:', error);
    res.status(500).json({
      exito: false,
      error: 'Error al procesar solicitud',
      mensaje: error instanceof Error ? error.message : 'Error desconocido',
    });
  }
};
