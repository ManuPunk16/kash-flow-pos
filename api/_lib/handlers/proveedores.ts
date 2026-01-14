import { AuthenticatedRequest } from '../tipos/AuthenticatedRequest.js';
import { VercelResponse } from '@vercel/node';
import { verificarAutenticacion } from '../middleware/autenticacion.js';
import {
  esquemaCrearProveedor,
  esquemaActualizarProveedor,
} from '../validacion/schemas.js';
import { Proveedor } from '../models/index.js';
import { Producto } from '../models/index.js';
import { conectarMongoDB } from '../config/database.js';
import { CategoriaProveedor } from '../enums/categorias-proveedor.enum.js';

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
    const rutaProveedor = pathname.replace('/api/proveedores', '') || '/';

    console.log('🔍 Debug proveedores:', {
      pathname,
      rutaProveedor,
      metodo: req.method,
    });

    switch (req.method) {
      case 'GET':
        // GET /api/proveedores - Obtener todos con filtros
        if (rutaProveedor === '/' || rutaProveedor === '') {
          console.log('📦 Consultando proveedores...');
          const inicio = Date.now();

          // ✅ NUEVO: Construir filtros dinámicos
          const filtros: any = { activo: true };

          // Filtro por categoría desde query params
          const { categoria } = req.query as { categoria?: string };
          if (
            categoria &&
            Object.values(CategoriaProveedor).includes(
              categoria as CategoriaProveedor
            )
          ) {
            filtros.categorias = categoria;
          }

          const proveedores = await Proveedor.find(filtros)
            .select('-__v')
            .lean()
            .maxTimeMS(5000);

          const proveedoresConProductos = await Promise.all(
            proveedores.map(async (proveedor) => {
              const conteoProductos = await Producto.countDocuments({
                proveedorId: proveedor._id,
                activo: true,
              });

              return {
                ...proveedor,
                productosCargados: conteoProductos,
              };
            })
          );

          const duracion = Date.now() - inicio;
          console.log(
            `✅ Proveedores obtenidos: ${proveedoresConProductos.length} en ${duracion}ms`
          );

          res.status(200).json({
            exito: true,
            datos: proveedoresConProductos,
            cantidad: proveedoresConProductos.length,
            usuario: req.usuario.email,
            tiempoConsulta: `${duracion}ms`,
          });
          return;
        }

        // GET /api/proveedores/con-deuda
        if (rutaProveedor.includes('/con-deuda')) {
          const proveedoresConDeuda = await Proveedor.find({
            activo: true,
            saldoPendiente: { $gt: 0 },
          })
            .select('-__v')
            .sort({ saldoPendiente: -1 })
            .lean()
            .maxTimeMS(5000);

          // ✅ Agregar conteo de productos
          const proveedoresConProductos = await Promise.all(
            proveedoresConDeuda.map(async (proveedor) => {
              const conteoProductos = await Producto.countDocuments({
                proveedorId: proveedor._id,
                activo: true,
              });

              return {
                ...proveedor,
                productosCargados: conteoProductos,
              };
            })
          );

          res.status(200).json({
            exito: true,
            datos: proveedoresConProductos,
            cantidad: proveedoresConProductos.length,
            totalDeuda: proveedoresConProductos.reduce(
              (sum, p) => sum + p.saldoPendiente,
              0
            ),
          });
          return;
        }

        // GET /api/proveedores/[id]
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

          // ✅ Calcular productos del proveedor
          const conteoProductos = await Producto.countDocuments({
            proveedorId: proveedor._id,
            activo: true,
          });

          res.status(200).json({
            exito: true,
            dato: {
              ...proveedor,
              productosCargados: conteoProductos,
            },
          });
          return;
        }

        res.status(400).json({
          exito: false,
          error: 'ID de proveedor inválido',
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
          productosCargados: 0, // ✅ Inicialmente 0
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

        // ✅ Agregar conteo actualizado
        const conteoProductosActualizado = await Producto.countDocuments({
          proveedorId: proveedorActualizado._id,
          activo: true,
        });

        res.status(200).json({
          exito: true,
          mensaje: 'Proveedor actualizado exitosamente ✅',
          dato: {
            ...proveedorActualizado.toObject(),
            productosCargados: conteoProductosActualizado,
          },
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
