import { AuthenticatedRequest } from '../tipos/AuthenticatedRequest.js';
import { VercelResponse } from '@vercel/node';
import { verificarAutenticacion } from '../middleware/autenticacion.js';
import { Egreso, Usuario } from '../models/index.js';
import { conectarMongoDB } from '../config/database.js';
import {
  CategoriaEgreso,
  CATEGORIAS_EGRESO_VALORES,
  esCategoriaEgresoValida,
  MetodoPago,
  METODOS_PAGO_VALORES,
  esMetodoPagoValido,
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
    const rutaEgreso = pathname.replace('/api/egresos', '') || '/';

    switch (req.method) {
      case 'GET':
        // GET /api/egresos
        if (rutaEgreso === '/' || rutaEgreso === '') {
          const { searchParams } = new URL(
            req.url || '',
            `http://${req.headers.host}`
          );
          const categoria = searchParams.get('categoria');
          const aprobado = searchParams.get('aprobado');

          let query: Record<string, any> = {};

          // ✅ Validar categoría usando enum
          if (categoria && esCategoriaEgresoValida(categoria)) {
            query.categoria = categoria;
          }

          if (aprobado !== null) {
            query.aprobado = aprobado === 'true';
          }

          const egresos = await Egreso.find(query)
            .sort({ fechaEgreso: -1 })
            .limit(100)
            .lean();

          res.status(200).json({
            exito: true,
            datos: egresos,
            cantidad: egresos.length,
          });
          return;
        }

        // GET /api/egresos/:id
        const egresoId = rutaEgreso.replace('/', '');
        if (egresoId && /^[0-9a-fA-F]{24}$/.test(egresoId)) {
          const egreso = await Egreso.findById(egresoId).lean();

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
        const {
          concepto,
          descripcion,
          monto,
          categoria,
          metodoPago,
          referenciaPago,
          beneficiario,
          observaciones,
        } = req.body;

        // ✅ Validar categoría usando enum
        if (!categoria || !esCategoriaEgresoValida(categoria)) {
          res.status(400).json({
            exito: false,
            error: 'Categoría inválida',
            categorias_validas: CATEGORIAS_EGRESO_VALORES,
          });
          return;
        }

        // ✅ Validar método de pago usando enum
        if (!metodoPago || !esMetodoPagoValido(metodoPago)) {
          res.status(400).json({
            exito: false,
            error: 'Método de pago inválido',
            metodos_validos: METODOS_PAGO_VALORES,
          });
          return;
        }

        // Validaciones básicas
        if (!concepto || !monto || monto <= 0) {
          res.status(400).json({
            exito: false,
            error: 'Datos de egreso incompletos o inválidos',
          });
          return;
        }

        // Obtener usuario
        const usuario = await Usuario.findOne({ firebaseUid: req.usuario.uid });
        if (!usuario) {
          res.status(404).json({
            exito: false,
            error: 'Usuario no encontrado',
          });
          return;
        }

        // Generar número de egreso único
        const ultimoEgreso = await Egreso.findOne()
          .sort({ fechaCreacion: -1 })
          .lean();
        const ultimoNumero = ultimoEgreso
          ? parseInt(ultimoEgreso.numeroEgreso.split('-')[1], 10)
          : 0;
        const numeroEgreso = `EG-${String(ultimoNumero + 1).padStart(6, '0')}`;

        // Crear egreso
        const nuevoEgreso = new Egreso({
          numeroEgreso,
          concepto,
          descripcion: descripcion || '',
          monto,
          categoria,
          metodoPago,
          referenciaPago: referenciaPago || '',
          beneficiario: beneficiario || '',
          usuarioId: usuario._id,
          nombreUsuario: `${usuario.nombre} ${usuario.apellido}`,
          fechaEgreso: new Date(),
          observaciones: observaciones || '',
          aprobado: false, // Por defecto requiere aprobación
        });

        await nuevoEgreso.save();

        res.status(201).json({
          exito: true,
          mensaje: 'Egreso registrado exitosamente ✅',
          dato: nuevoEgreso,
        });
        return;

      case 'PUT':
        const egresoIdActualizar = rutaEgreso.replace('/', '');

        if (
          !egresoIdActualizar ||
          !/^[0-9a-fA-F]{24}$/.test(egresoIdActualizar)
        ) {
          res.status(400).json({
            exito: false,
            error: 'ID de egreso inválido',
          });
          return;
        }

        const egresoActualizar = await Egreso.findById(egresoIdActualizar);
        if (!egresoActualizar) {
          res.status(404).json({
            exito: false,
            error: 'Egreso no encontrado',
          });
          return;
        }

        // ✅ Validar categoría si se proporciona
        if (
          req.body.categoria &&
          !esCategoriaEgresoValida(req.body.categoria)
        ) {
          res.status(400).json({
            exito: false,
            error: 'Categoría inválida',
            categorias_validas: CATEGORIAS_EGRESO_VALORES,
          });
          return;
        }

        // ✅ Validar método de pago si se proporciona
        if (req.body.metodoPago && !esMetodoPagoValido(req.body.metodoPago)) {
          res.status(400).json({
            exito: false,
            error: 'Método de pago inválido',
            metodos_validos: METODOS_PAGO_VALORES,
          });
          return;
        }

        // Actualizar campos
        Object.assign(egresoActualizar, req.body);
        egresoActualizar.fechaActualizacion = new Date();

        await egresoActualizar.save();

        res.status(200).json({
          exito: true,
          mensaje: 'Egreso actualizado exitosamente ✅',
          dato: egresoActualizar,
        });
        return;

      case 'DELETE':
        const egresoIdEliminar = rutaEgreso.replace('/', '');

        if (!egresoIdEliminar || !/^[0-9a-fA-F]{24}$/.test(egresoIdEliminar)) {
          res.status(400).json({
            exito: false,
            error: 'ID de egreso inválido',
          });
          return;
        }

        const egresoEliminar = await Egreso.findByIdAndDelete(egresoIdEliminar);
        if (!egresoEliminar) {
          res.status(404).json({
            exito: false,
            error: 'Egreso no encontrado',
          });
          return;
        }

        res.status(200).json({
          exito: true,
          mensaje: 'Egreso eliminado exitosamente ✅',
          dato: egresoEliminar,
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
