import { AuthenticatedRequest } from '../tipos/AuthenticatedRequest.js';
import { VercelResponse } from '@vercel/node';
import { verificarAutenticacion } from '../middleware/autenticacion.js';
import {
  esquemaCrearProveedor,
  esquemaActualizarProveedor,
} from '../validacion/schemas.js';
import { Proveedor } from '../models/index.js';
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
    const rutaProveedor = pathname.replace('/api/proveedores', '') || '/';

    console.log('🔍 Debug proveedores:', {
      urlCompleta: req.url,
      pathname,
      rutaProveedor,
      metodo: req.method,
    });

    // ✅ Routing por método
    switch (req.method) {
      case 'GET':
        // GET /api/proveedores - Obtener todos
        if (rutaProveedor === '/' || rutaProveedor === '') {
          console.log('📦 Consultando proveedores...');
          const inicio = Date.now();

          const proveedores = await Proveedor.find({ activo: true })
            .select('-__v')
            .lean()
            .maxTimeMS(5000);

          const duracion = Date.now() - inicio;
          console.log(
            `✅ Proveedores obtenidos: ${proveedores.length} en ${duracion}ms`
          );

          res.status(200).json({
            exito: true,
            datos: proveedores,
            cantidad: proveedores.length,
            usuario: req.usuario.email,
            tiempoConsulta: `${duracion}ms`,
          });
          return;
        }

        // GET /api/proveedores/con-deuda - Proveedores con saldo pendiente
        if (rutaProveedor.includes('/con-deuda')) {
          const proveedoresConDeuda = await Proveedor.find({
            activo: true,
            saldoPendiente: { $gt: 0 },
          })
            .select('-__v')
            .sort({ saldoPendiente: -1 })
            .lean()
            .maxTimeMS(5000);

          res.status(200).json({
            exito: true,
            datos: proveedoresConDeuda,
            cantidad: proveedoresConDeuda.length,
            totalDeuda: proveedoresConDeuda.reduce(
              (sum, p) => sum + p.saldoPendiente,
              0
            ),
          });
          return;
        }

        // GET /api/proveedores/[id] - Obtener por ID
        const proveedorId = rutaProveedor.replace('/', '');

        if (proveedorId && /^[0-9a-fA-F]{24}$/.test(proveedorId)) {
          const proveedor = await Proveedor.findById(proveedorId)
            .select('-__v')
            .lean()
            .maxTimeMS(3000);

          if (!proveedor) {
            res.status(404).json({
              exito: false,
              error: 'Proveedor no encontrado',
            });
            return;
          }

          res.status(200).json({
            exito: true,
            dato: proveedor,
          });
          return;
        }

        // ID inválido
        res.status(400).json({
          exito: false,
          error: 'ID de proveedor inválido',
          mensaje:
            'El ID debe ser un ObjectId válido de MongoDB (24 caracteres hexadecimales)',
        });
        return;

      case 'POST':
        const { error, value } = esquemaCrearProveedor.validate(req.body, {
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

        const nuevoProveedor = new Proveedor({
          ...value,
          activo: true,
          saldoPendiente: 0,
          productosCargados: 0,
          fechaUltimoAbono: null,
          fechaCreacion: new Date(),
          fechaActualizacion: new Date(),
        });

        await nuevoProveedor.save();

        res.status(201).json({
          exito: true,
          mensaje: 'Proveedor creado exitosamente ✅',
          dato: nuevoProveedor,
        });
        return;

      case 'PUT':
        const idActualizar = rutaProveedor.replace('/', '');

        if (!idActualizar || !/^[0-9a-fA-F]{24}$/.test(idActualizar)) {
          res.status(400).json({
            exito: false,
            error: 'ID de proveedor inválido',
          });
          return;
        }

        const { error: errorUpdate } = esquemaActualizarProveedor.validate(
          req.body,
          { abortEarly: false, stripUnknown: true }
        );

        if (errorUpdate) {
          res.status(400).json({
            exito: false,
            error: 'Validación fallida',
            detalles: errorUpdate.details.map((d) => ({
              campo: d.path.join('.'),
              mensaje: d.message,
            })),
          });
          return;
        }

        const proveedorActualizado = await Proveedor.findByIdAndUpdate(
          idActualizar,
          {
            ...req.body,
            fechaActualizacion: new Date(),
          },
          { new: true, runValidators: true }
        ).maxTimeMS(3000);

        if (!proveedorActualizado) {
          res.status(404).json({
            exito: false,
            error: 'Proveedor no encontrado',
          });
          return;
        }

        res.status(200).json({
          exito: true,
          mensaje: 'Proveedor actualizado exitosamente ✅',
          dato: proveedorActualizado,
        });
        return;

      case 'DELETE':
        const idEliminar = rutaProveedor.replace('/', '');

        if (!idEliminar || !/^[0-9a-fA-F]{24}$/.test(idEliminar)) {
          res.status(400).json({
            exito: false,
            error: 'ID de proveedor inválido',
          });
          return;
        }

        const proveedorDesactivado = await Proveedor.findByIdAndUpdate(
          idEliminar,
          {
            activo: false,
            fechaActualizacion: new Date(),
          },
          { new: true }
        ).maxTimeMS(3000);

        if (!proveedorDesactivado) {
          res.status(404).json({
            exito: false,
            error: 'Proveedor no encontrado',
          });
          return;
        }

        res.status(200).json({
          exito: true,
          mensaje: 'Proveedor desactivado exitosamente ✅',
          dato: proveedorDesactivado,
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
    console.error('❌ Error en proveedores API:', error);

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
