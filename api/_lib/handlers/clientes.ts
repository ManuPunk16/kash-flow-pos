import { AuthenticatedRequest } from '../tipos/AuthenticatedRequest.js';
import { VercelResponse } from '@vercel/node';
import { verificarAutenticacion } from '../middleware/autenticacion.js';
import {
  esquemaCrearCliente,
  esquemaActualizarCliente,
} from '../validacion/schemas.js';
import { ClientesService } from '../services/ClientesService.js';
import { Cliente } from '../models/index.js';
import { conectarMongoDB } from '../config/database.js';

export default async (req: AuthenticatedRequest, res: VercelResponse) => {
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

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  try {
    // ✅ Conectar a MongoDB
    await conectarMongoDB();

    // ✅ Autenticación
    let autenticado = false;
    await verificarAutenticacion(req, res, () => {
      autenticado = true;
    });

    if (!autenticado || !req.usuario) {
      return;
    }

    // ✅ Extraer ruta correctamente
    const { pathname } = new URL(req.url || '', `http://${req.headers.host}`);
    const rutaCliente = pathname.replace('/api/clientes', '') || '/';

    console.log('🔍 Debug clientes:', {
      urlCompleta: req.url,
      pathname,
      rutaCliente,
      metodo: req.method,
    });

    // ✅ Routing por método
    switch (req.method) {
      case 'GET':
        // GET /api/clientes - Obtener todos
        if (rutaCliente === '/' || rutaCliente === '') {
          const clientes = await ClientesService.obtenerTodos();
          res.status(200).json({
            exito: true,
            datos: clientes,
            cantidad: clientes.length,
          });
          return;
        }

        // GET /api/clientes/deudores/listado
        if (rutaCliente.includes('/deudores')) {
          const deudores = await ClientesService.obtenerDeudores();
          res.status(200).json({
            exito: true,
            datos: deudores,
            cantidad: deudores.length,
          });
          return;
        }

        // GET /api/clientes/[id]
        const clienteId = rutaCliente.replace('/', '');
        if (clienteId && /^[0-9a-fA-F]{24}$/.test(clienteId)) {
          const cliente = await ClientesService.obtenerPorId(clienteId);
          if (!cliente) {
            res.status(404).json({
              exito: false,
              error: 'Cliente no encontrado',
            });
            return;
          }
          res.status(200).json({ exito: true, dato: cliente });
          return;
        }

        res.status(400).json({
          exito: false,
          error: 'ID de cliente inválido',
        });
        return;

      case 'POST':
        // ✅ CORREGIDO: Usar validateAsync() para esquemas con .external()
        try {
          const value = await esquemaCrearCliente.validateAsync(req.body, {
            abortEarly: false,
            stripUnknown: true,
          });

          const nuevoCliente = await ClientesService.crear({
            ...value,
            activo: true,
            saldoActual: 0,
            saldoHistorico: 0,
            esMoroso: false,
            diasSinPagar: 0,
            historicoIntereses: [],
            fechaCreacion: new Date(),
            fechaActualizacion: new Date(),
          });

          res.status(201).json({
            exito: true,
            mensaje: 'Cliente creado exitosamente ✅',
            dato: nuevoCliente,
          });
          return;
        } catch (error: any) {
          // ✅ Manejar errores de validación de Joi
          if (error.isJoi) {
            res.status(400).json({
              exito: false,
              error: 'Validación fallida',
              detalles: error.details.map((d: any) => ({
                campo: d.path.join('.'),
                mensaje: d.message,
              })),
            });
            return;
          }
          throw error; // Re-lanzar errores no-Joi
        }

      case 'PUT':
        const idActualizar = rutaCliente.replace('/', '');
        if (!idActualizar || !/^[0-9a-fA-F]{24}$/.test(idActualizar)) {
          res.status(400).json({
            exito: false,
            error: 'ID de cliente inválido',
          });
          return;
        }

        // ✅ esquemaActualizarCliente NO tiene .external(), puede usar .validate()
        const { error: errorUpdate } = esquemaActualizarCliente.validate(
          req.body,
          { abortEarly: false, stripUnknown: true },
        );

        if (errorUpdate) {
          res.status(400).json({
            exito: false,
            error: 'Validación fallida',
            detalles: errorUpdate.details,
          });
          return;
        }

        const clienteActualizado = await Cliente.findByIdAndUpdate(
          idActualizar,
          { ...req.body, fechaActualizacion: new Date() },
          { new: true },
        );

        if (!clienteActualizado) {
          res.status(404).json({
            exito: false,
            error: 'Cliente no encontrado',
          });
          return;
        }

        res.status(200).json({
          exito: true,
          mensaje: 'Cliente actualizado exitosamente ✅',
          dato: clienteActualizado,
        });
        return;

      case 'DELETE':
        const idEliminar = rutaCliente.replace('/', '');
        if (!idEliminar || !/^[0-9a-fA-F]{24}$/.test(idEliminar)) {
          res.status(400).json({
            exito: false,
            error: 'ID de cliente inválido',
          });
          return;
        }

        const clienteDesactivado = await Cliente.findByIdAndUpdate(
          idEliminar,
          { activo: false, fechaActualizacion: new Date() },
          { new: true },
        );

        if (!clienteDesactivado) {
          res.status(404).json({
            exito: false,
            error: 'Cliente no encontrado',
          });
          return;
        }

        res.status(200).json({
          exito: true,
          mensaje: 'Cliente desactivado exitosamente ✅',
          dato: clienteDesactivado,
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
    console.error('❌ Error en clientes API:', error);
    res.status(500).json({
      exito: false,
      error: 'Error al procesar solicitud',
      mensaje: error instanceof Error ? error.message : 'Error desconocido',
    });
  }
};
