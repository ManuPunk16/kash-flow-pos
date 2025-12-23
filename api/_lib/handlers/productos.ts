import { AuthenticatedRequest } from '../tipos/AuthenticatedRequest.js';
import { VercelResponse } from '@vercel/node';
import { verificarAutenticacion } from '../middleware/autenticacion.js';
import {
  esquemaCrearProducto,
  esquemaActualizarProducto,
  esquemaRegistroRapidoProducto,
} from '../validacion/schemas.js';
import { ProductosService } from '../services/ProductosService.js';
import { Producto } from '../models/index.js';
import { conectarMongoDB } from '../config/database.js';
import {
  obtenerOpcionesPaginacion,
  construirRespuestaPaginada,
} from '../middleware/paginacion.js';

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
    const rutaProducto = pathname.replace('/api/productos', '') || '/';

    console.log('🔍 Debug productos:', {
      urlCompleta: req.url,
      pathname,
      rutaProducto,
      metodo: req.method,
    });

    switch (req.method) {
      case 'GET':
        // ✅ GET /api/productos/buscar?q=texto - NUEVO
        if (rutaProducto.includes('/buscar')) {
          const { searchParams } = new URL(
            req.url || '',
            `http://${req.headers.host}`
          );
          const query = searchParams.get('q')?.trim();

          if (!query || query.length < 2) {
            res.status(400).json({
              exito: false,
              error: 'Query muy corto',
              mensaje: 'Escribe al menos 2 caracteres para buscar',
            });
            return;
          }

          const productos = await Producto.find({
            activo: true,
            $or: [
              { nombre: { $regex: query, $options: 'i' } },
              { codigoBarras: { $regex: query, $options: 'i' } }, // ✅ CAMBIO
              { categoria: { $regex: query, $options: 'i' } },
              { descripcion: { $regex: query, $options: 'i' } },
            ],
          })
            .select('nombre codigoBarras precioVenta stock categoria') // ✅ CAMBIO
            .limit(20)
            .lean()
            .maxTimeMS(3000);

          res.status(200).json({
            exito: true,
            datos: productos,
            cantidad: productos.length,
            query,
          });
          return;
        }

        // ✅ GET /api/productos/validar-stock/:id?cantidad=X - NUEVO
        if (rutaProducto.includes('/validar-stock/')) {
          const productoId = rutaProducto
            .split('/validar-stock/')[1]
            ?.split('/')[0];
          const { searchParams } = new URL(
            req.url || '',
            `http://${req.headers.host}`
          );
          const cantidad = parseInt(searchParams.get('cantidad') || '1', 10);

          if (!productoId || !/^[0-9a-fA-F]{24}$/.test(productoId)) {
            res.status(400).json({
              exito: false,
              error: 'ID inválido',
            });
            return;
          }

          const producto = await Producto.findById(productoId)
            .select('nombre stock stockMinimo')
            .lean();

          if (!producto) {
            res.status(404).json({
              exito: false,
              error: 'Producto no encontrado',
            });
            return;
          }

          const disponible = producto.stock >= cantidad;
          const stockBajo = producto.stock < producto.stockMinimo;

          res.status(200).json({
            exito: true,
            disponible,
            stockActual: producto.stock,
            cantidadSolicitada: cantidad,
            faltante: disponible ? 0 : cantidad - producto.stock,
            stockBajo,
            mensaje: disponible
              ? '✅ Stock disponible'
              : `❌ Stock insuficiente. Faltan ${
                  cantidad - producto.stock
                } unidades`,
          });
          return;
        }

        // GET /api/productos - Obtener todos CON PAGINACIÓN
        if (rutaProducto === '/' || rutaProducto === '') {
          console.log('📦 Consultando productos...');
          const inicio = Date.now();

          const { pagina, limite, skip } = obtenerOpcionesPaginacion(req);

          const [productos, total] = await Promise.all([
            Producto.find({ activo: true })
              .select('-__v')
              .skip(skip)
              .limit(limite)
              .lean()
              .maxTimeMS(5000),
            Producto.countDocuments({ activo: true }),
          ]);

          const duracion = Date.now() - inicio;
          console.log(
            `✅ Productos obtenidos: ${productos.length}/${total} en ${duracion}ms`
          );

          res
            .status(200)
            .json(construirRespuestaPaginada(productos, total, pagina, limite));
          return;
        }

        // GET /api/productos/[id] - Obtener por ID
        const productoId = rutaProducto.replace('/', '');

        if (productoId && /^[0-9a-fA-F]{24}$/.test(productoId)) {
          const producto = await Producto.findById(productoId)
            .select('-__v')
            .lean()
            .maxTimeMS(3000);

          if (!producto) {
            res.status(404).json({
              exito: false,
              error: 'Producto no encontrado',
            });
            return;
          }

          res.status(200).json({
            exito: true,
            dato: producto,
          });
          return;
        }

        res.status(400).json({
          exito: false,
          error: 'ID de producto inválido',
          mensaje:
            'El ID debe ser un ObjectId válido de MongoDB (24 caracteres hexadecimales)',
        });
        return;

      case 'POST':
        // ✅ POST /api/productos/registro-rapido - NUEVO
        if (rutaProducto.includes('/registro-rapido')) {
          const { error, value } = esquemaRegistroRapidoProducto.validate(
            req.body,
            { abortEarly: false, stripUnknown: true }
          );

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

          const { codigoBarras, cantidad = 1 } = value;

          // Buscar producto existente
          let producto = await Producto.findOne({
            codigoBarras,
            activo: true,
          });

          if (producto) {
            // Si existe, incrementar stock
            producto.stock += cantidad;
            producto.fechaActualizacion = new Date();
            await producto.save();

            res.status(200).json({
              exito: true,
              mensaje: `Stock actualizado: +${cantidad} unidades`,
              dato: producto,
              esNuevo: false,
            });
          } else {
            // Si NO existe, crear nuevo con datos mínimos
            const nuevoProducto = new Producto({
              codigoBarras,
              nombre: `Producto ${codigoBarras}`, // Temporal
              descripcion: 'Pendiente de completar',
              costoUnitario: 0,
              precioVenta: 0,
              stock: cantidad,
              stockMinimo: 5,
              categoria: 'Sin categoría',
              activo: true,
              esConsignacion: false,
              pendienteCompletarDatos: true, // ✅ FLAG
              fechaCreacion: new Date(),
              fechaActualizacion: new Date(),
            });

            await nuevoProducto.save();

            res.status(201).json({
              exito: true,
              mensaje: '⚠️ Producto creado. Completar datos manualmente',
              dato: nuevoProducto,
              esNuevo: true,
              advertencia: 'Faltan datos: nombre, precio, costo',
            });
          }
          return;
        }

        // POST /api/productos - Crear producto normal
        const { error, value } = esquemaCrearProducto.validate(req.body, {
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

        const nuevoProducto = await ProductosService.crear({
          ...value,
          activo: true,
          fechaCreacion: new Date(),
          fechaActualizacion: new Date(),
        });

        res.status(201).json({
          exito: true,
          mensaje: 'Producto creado exitosamente ✅',
          dato: nuevoProducto,
        });
        return;

      case 'PUT':
        const idActualizar = rutaProducto.replace('/', '');

        if (!idActualizar || !/^[0-9a-fA-F]{24}$/.test(idActualizar)) {
          res.status(400).json({
            exito: false,
            error: 'ID de producto inválido',
          });
          return;
        }

        const { error: errorUpdate } = esquemaActualizarProducto.validate(
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

        const productoActualizado = await ProductosService.actualizar(
          idActualizar,
          {
            ...req.body,
            fechaActualizacion: new Date(),
          }
        );

        if (!productoActualizado) {
          res.status(404).json({
            exito: false,
            error: 'Producto no encontrado',
          });
          return;
        }

        res.status(200).json({
          exito: true,
          mensaje: 'Producto actualizado exitosamente ✅',
          dato: productoActualizado,
        });
        return;

      case 'DELETE':
        const idEliminar = rutaProducto.replace('/', '');

        if (!idEliminar || !/^[0-9a-fA-F]{24}$/.test(idEliminar)) {
          res.status(400).json({
            exito: false,
            error: 'ID de producto inválido',
          });
          return;
        }

        const productoDesactivado = await Producto.findByIdAndUpdate(
          idEliminar,
          {
            activo: false,
            fechaActualizacion: new Date(),
          },
          { new: true }
        ).maxTimeMS(3000);

        if (!productoDesactivado) {
          res.status(404).json({
            exito: false,
            error: 'Producto no encontrado',
          });
          return;
        }

        res.status(200).json({
          exito: true,
          mensaje: 'Producto desactivado exitosamente ✅',
          dato: productoDesactivado,
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
    console.error('❌ Error en productos API:', error);

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
