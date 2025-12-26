import { AuthenticatedRequest } from '../tipos/AuthenticatedRequest.js';
import { VercelResponse } from '@vercel/node';
import { verificarAutenticacion } from '../middleware/autenticacion.js';
import {
  esquemaCrearEgreso,
  esquemaActualizarEgreso,
} from '../validacion/schemas.js';
import { Egreso, Usuario } from '../models/index.js';
import { conectarMongoDB } from '../config/database.js';
import { v4 as uuid } from 'uuid';

export default async (req: AuthenticatedRequest, res: VercelResponse) => {
  // ✅ CORS
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

    // Autenticación obligatoria
    let autenticado = false;
    await verificarAutenticacion(req, res, () => {
      autenticado = true;
    });

    if (!autenticado || !req.usuario) {
      return;
    }

    const { pathname } = new URL(req.url || '', `http://${req.headers.host}`);
    const rutaEgreso = pathname.replace('/api/egresos', '') || '/';

    console.log('💸 Debug egresos:', {
      urlCompleta: req.url,
      pathname,
      rutaEgreso,
      metodo: req.method,
    });

    switch (req.method) {
      case 'GET':
        // GET /api/egresos - Obtener todos
        if (rutaEgreso === '/' || rutaEgreso === '') {
          const { searchParams } = new URL(
            req.url || '',
            `http://${req.headers.host}`
          );

          // Filtros opcionales
          const categoria = searchParams.get('categoria');
          const aprobado = searchParams.get('aprobado');
          const fechaInicio = searchParams.get('fechaInicio');
          const fechaFin = searchParams.get('fechaFin');

          const filtro: any = {};

          if (categoria) filtro.categoria = categoria;
          if (aprobado !== null) filtro.aprobado = aprobado === 'true';
          if (fechaInicio && fechaFin) {
            filtro.fechaEgreso = {
              $gte: new Date(fechaInicio),
              $lte: new Date(fechaFin),
            };
          }

          const egresos = await Egreso.find(filtro)
            .populate('usuarioId', 'nombre apellido email')
            .populate('aprobadoPor', 'nombre apellido')
            .sort({ fechaEgreso: -1 })
            .lean()
            .maxTimeMS(5000);

          const totalMonto = egresos.reduce((sum, e) => sum + e.monto, 0);

          res.status(200).json({
            exito: true,
            datos: egresos,
            cantidad: egresos.length,
            totalMonto,
            filtros: filtro,
          });
          return;
        }

        // GET /api/egresos/resumen - Estadísticas
        if (rutaEgreso.includes('/resumen')) {
          const hoy = new Date();
          const inicioMes = new Date(hoy.getFullYear(), hoy.getMonth(), 1);

          const totalMes = await Egreso.aggregate([
            {
              $match: {
                fechaEgreso: { $gte: inicioMes },
              },
            },
            {
              $group: {
                _id: null,
                total: { $sum: '$monto' },
              },
            },
          ]);

          const porCategoria = await Egreso.aggregate([
            {
              $match: {
                fechaEgreso: { $gte: inicioMes },
              },
            },
            {
              $group: {
                _id: '$categoria',
                total: { $sum: '$monto' },
                cantidad: { $sum: 1 },
              },
            },
            {
              $sort: { total: -1 },
            },
          ]);

          res.status(200).json({
            exito: true,
            resumen: {
              totalMes: totalMes[0]?.total || 0,
              porCategoria,
              mesActual: hoy.toLocaleDateString('es-ES', {
                month: 'long',
                year: 'numeric',
              }),
            },
          });
          return;
        }

        // GET /api/egresos/[id]
        const egresoId = rutaEgreso.replace('/', '');
        if (egresoId && /^[0-9a-fA-F]{24}$/.test(egresoId)) {
          const egreso = await Egreso.findById(egresoId)
            .populate('usuarioId', 'nombre apellido email')
            .populate('aprobadoPor', 'nombre apellido')
            .lean();

          if (!egreso) {
            res.status(404).json({
              exito: false,
              error: 'Egreso no encontrado',
            });
            return;
          }

          res.status(200).json({
            exito: true,
            dato: egreso,
          });
          return;
        }

        res.status(400).json({
          exito: false,
          error: 'ID de egreso inválido',
        });
        return;

      case 'POST':
        const { error, value } = esquemaCrearEgreso.validate(req.body, {
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

        // Obtener usuario
        const usuarioId = req.usuario.uid;
        const usuario = await Usuario.findOne({ firebaseUid: usuarioId });

        if (!usuario) {
          res.status(401).json({
            exito: false,
            error: 'Usuario no encontrado',
          });
          return;
        }

        const nuevoEgreso = new Egreso({
          ...value,
          numeroEgreso: `EGR-${new Date().toISOString().split('T')[0]}-${uuid()
            .substring(0, 8)
            .toUpperCase()}`,
          usuarioId: usuario._id,
          nombreUsuario: `${usuario.nombre} ${usuario.apellido}`,
          fechaEgreso: value.fechaEgreso || new Date(),
          aprobado: false,
          fechaCreacion: new Date(),
          fechaActualizacion: new Date(),
        });

        await nuevoEgreso.save();

        res.status(201).json({
          exito: true,
          mensaje: 'Egreso registrado exitosamente ✅',
          dato: nuevoEgreso,
        });
        return;

      case 'PUT':
        const idActualizar = rutaEgreso.replace('/', '');

        if (!idActualizar || !/^[0-9a-fA-F]{24}$/.test(idActualizar)) {
          res.status(400).json({
            exito: false,
            error: 'ID de egreso inválido',
          });
          return;
        }

        const { error: errorUpdate } = esquemaActualizarEgreso.validate(
          req.body,
          { abortEarly: false, stripUnknown: true }
        );

        if (errorUpdate) {
          res.status(400).json({
            exito: false,
            error: 'Validación fallida',
            detalles: errorUpdate.details,
          });
          return;
        }

        // Si se está aprobando
        if (req.body.aprobado === true) {
          const usuarioAprobador = await Usuario.findOne({
            firebaseUid: req.usuario.uid,
          });

          req.body.aprobadoPor = usuarioAprobador?._id;
          req.body.fechaAprobacion = new Date();
        }

        const egresoActualizado = await Egreso.findByIdAndUpdate(
          idActualizar,
          {
            ...req.body,
            fechaActualizacion: new Date(),
          },
          { new: true, runValidators: true }
        )
          .populate('usuarioId', 'nombre apellido')
          .populate('aprobadoPor', 'nombre apellido')
          .maxTimeMS(3000);

        if (!egresoActualizado) {
          res.status(404).json({
            exito: false,
            error: 'Egreso no encontrado',
          });
          return;
        }

        res.status(200).json({
          exito: true,
          mensaje: 'Egreso actualizado exitosamente ✅',
          dato: egresoActualizado,
        });
        return;

      case 'DELETE':
        const idEliminar = rutaEgreso.replace('/', '');

        if (!idEliminar || !/^[0-9a-fA-F]{24}$/.test(idEliminar)) {
          res.status(400).json({
            exito: false,
            error: 'ID de egreso inválido',
          });
          return;
        }

        const egresoEliminado = await Egreso.findByIdAndDelete(idEliminar);

        if (!egresoEliminado) {
          res.status(404).json({
            exito: false,
            error: 'Egreso no encontrado',
          });
          return;
        }

        res.status(200).json({
          exito: true,
          mensaje: 'Egreso eliminado exitosamente ✅',
          dato: egresoEliminado,
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
    console.error('❌ Error en egresos API:', error);
    res.status(500).json({
      exito: false,
      error: 'Error al procesar solicitud',
      mensaje: error instanceof Error ? error.message : 'Error desconocido',
    });
  }
};
