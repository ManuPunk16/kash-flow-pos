import { AuthenticatedRequest } from '../tipos/AuthenticatedRequest.js';
import { VercelRequest, VercelResponse } from '@vercel/node';
import { verificarAutenticacion } from '../middleware/autenticacion.js';
import { esquemaCrearAbono } from '../validacion/schemas.js';
import { ClientesService } from '../services/ClientesService.js';
import { AbonoCliente, Cliente, Usuario } from '../models/index.js';

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
    // ✅ Autenticación obligatoria para todos los abonos
    await verificarAutenticacion(req, res, () => {});

    if (!req.usuario) {
      res.status(401).json({ error: 'No autorizado' });
      return;
    }

    const ruta = req.url || '/';

    // ✅ GET /api/abonos
    if (req.method === 'GET') {
      if (ruta === '/' || ruta === '') {
        const abonos = await AbonoCliente.find()
          .populate('clienteId')
          .populate('usuarioId')
          .sort({ fechaPago: -1 })
          .lean();

        res.status(200).json({
          exito: true,
          datos: abonos,
          cantidad: abonos.length,
        });
        return;
      }

      // GET /api/abonos/cliente/[clienteId]
      if (ruta.includes('/cliente/')) {
        const clienteId = ruta.split('/cliente/')[1]?.split('/')[0];
        if (clienteId) {
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
    }

    // ✅ POST /api/abonos - Registrar abono
    if (req.method === 'POST') {
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

      // Validar cliente
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

      // Obtener usuario desde token
      const usuarioId = req.usuario.uid;
      const usuario = await Usuario.findOne({ firebaseUid: usuarioId });

      if (!usuario) {
        res.status(401).json({
          exito: false,
          error: 'Usuario no encontrado',
        });
        return;
      }

      // Calcular nuevo saldo
      const saldoAnterior = cliente.saldoActual;
      const nuevoSaldo = saldoAnterior - monto;

      // Crear abono
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

      // Actualizar saldo cliente
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
    }

    res.status(405).json({ exito: false, error: 'Método no permitido' });
  } catch (error) {
    console.error('❌ Error en abonos API:', error);
    res.status(500).json({
      exito: false,
      error: 'Error al procesar solicitud',
      mensaje: error instanceof Error ? error.message : 'Error desconocido',
    });
  }
};
