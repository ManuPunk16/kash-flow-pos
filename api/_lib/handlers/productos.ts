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
        // ✅ GET /api/productos/buscar?q=texto
        if (rutaProducto.includes('/buscar')) {
          const { searchParams } = new URL(
            req.url || '',
            `http://${req.headers.host}`
          );
          const query = searchParams.get('q')?.trim();

          if (!query || query.length < 2) {
            res.status(400).json({
              exito: false,
              error: 'Query de búsqueda inválida',
              mensaje: 'Debe proporcionar al menos 2 caracteres',
            });
            return;
          }

          // ✅ POPULATE en búsqueda
          const productos = await Producto.find({
            activo: true,
            $or: [
              { nombre: { $regex: query, $options: 'i' } },
              { codigoBarras: { $regex: query, $options: 'i' } },
              { categoria: { $regex: query, $options: 'i' } },
              { descripcion: { $regex: query, $options: 'i' } },
            ],
          })
            .populate('proveedorId', 'nombre contacto email telefono nit') // ✅ POPULATE
            .select(
              'nombre codigoBarras precioVenta stock categoria proveedorId'
            )
            .limit(20)
            .lean()
            .maxTimeMS(3000);

          // ✅ Transformar respuesta
          const productosFormateados = productos.map((p: any) => ({
            ...p,
            proveedor: p.proveedorId, // Mongoose reemplaza proveedorId con el objeto
            proveedorId: p.proveedorId?._id?.toString() || null, // Mantener el ID
          }));

          res.status(200).json({
            exito: true,
            datos: productosFormateados,
            cantidad: productosFormateados.length,
            query,
          });
          return;
        }

        // ✅ GET /api/productos/validar-stock/:id?cantidad=X
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
              error: 'ID de producto inválido',
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

        // ✅ GET /api/productos - Obtener todos CON POPULATE
        if (rutaProducto === '/' || rutaProducto === '') {
          console.log('📦 Consultando productos CON POPULATE...');
          const inicio = Date.now();

          const { pagina, limite, skip } = obtenerOpcionesPaginacion(req);

          // ✅ POPULATE en listado principal
          const [productosRaw, total] = await Promise.all([
            Producto.find({ activo: true })
              .populate('proveedorId', 'nombre contacto email telefono nit') // ✅ POPULATE
              .select('-__v')
              .skip(skip)
              .limit(limite)
              .lean()
              .maxTimeMS(5000),
            Producto.countDocuments({ activo: true }),
          ]);

          // ✅ Transformar respuesta para mantener compatibilidad
          const productos = productosRaw.map((p: any) => ({
            ...p,
            proveedor: p.proveedorId, // Información completa del proveedor
            proveedorId: p.proveedorId?._id?.toString() || null, // Mantener ID
          }));

          const duracion = Date.now() - inicio;
          console.log(
            `✅ Productos obtenidos CON POPULATE: ${productos.length}/${total} en ${duracion}ms`
          );

          res
            .status(200)
            .json(construirRespuestaPaginada(productos, total, pagina, limite));
          return;
        }

        // ✅ GET /api/productos/[id] - Obtener por ID CON POPULATE
        const productoId = rutaProducto.replace('/', '');

        if (productoId && /^[0-9a-fA-F]{24}$/.test(productoId)) {
          const productoRaw = await Producto.findById(productoId)
            .populate(
              'proveedorId',
              'nombre contacto email telefono nit direccion'
            ) // ✅ POPULATE completo
            .select('-__v')
            .lean()
            .maxTimeMS(3000);

          if (!productoRaw) {
            res.status(404).json({
              exito: false,
              error: 'Producto no encontrado',
            });
            return;
          }

          // ✅ Transformar respuesta
          const producto: any = {
            ...productoRaw,
            proveedor: (productoRaw as any).proveedorId,
            proveedorId:
              (productoRaw as any).proveedorId?._id?.toString() || null,
          };

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
        // ✅ POST /api/productos/registro-rapido
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

          // Buscar producto existente CON POPULATE
          let producto = await Producto.findOne({
            codigoBarras,
            activo: true,
          })
            .populate('proveedorId', 'nombre')
            .lean();

          if (producto) {
            // Actualizar stock
            const productoActualizado = await Producto.findByIdAndUpdate(
              producto._id,
              { $inc: { stock: cantidad } },
              { new: true }
            )
              .populate('proveedorId', 'nombre contacto email telefono nit')
              .lean();

            res.status(200).json({
              exito: true,
              mensaje: `✅ Stock actualizado: +${cantidad} unidades`,
              dato: {
                ...(productoActualizado as any),
                proveedor: (productoActualizado as any).proveedorId,
                proveedorId:
                  (productoActualizado as any).proveedorId?._id?.toString() ||
                  null,
              },
            });
          } else {
            // Crear producto incompleto
            const nuevoProducto = await ProductosService.crear({
              nombre: `Producto ${codigoBarras}`,
              codigoBarras,
              descripcion: 'Pendiente de completar datos',
              precioVenta: 0,
              costoUnitario: 0,
              stock: cantidad,
              stockMinimo: 5,
              esConsignacion: false,
              categoria: 'otros',
              activo: true,
              pendienteCompletarDatos: true, // ✅ Marcar para completar
              fechaCreacion: new Date(),
              fechaActualizacion: new Date(),
            });

            const productoConProveedor = await Producto.findById(
              nuevoProducto._id
            )
              .populate('proveedorId', 'nombre contacto email telefono nit')
              .lean();

            res.status(201).json({
              exito: true,
              mensaje: '⚠️ Producto creado. Completa los datos pendientes',
              dato: {
                ...(productoConProveedor as any),
                proveedor: (productoConProveedor as any).proveedorId,
                proveedorId:
                  (productoConProveedor as any).proveedorId?._id?.toString() ||
                  null,
              },
            });
          }
          return;
        }

        // ✅ POST /api/productos - Crear producto normal
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

        // ✅ Obtener producto con populate
        const productoCreado = await Producto.findById(nuevoProducto._id)
          .populate('proveedorId', 'nombre contacto email telefono nit')
          .lean();

        res.status(201).json({
          exito: true,
          mensaje: 'Producto creado exitosamente ✅',
          dato: {
            ...(productoCreado as any),
            proveedor: (productoCreado as any).proveedorId,
            proveedorId:
              (productoCreado as any).proveedorId?._id?.toString() || null,
          },
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

        // ✅ Obtener producto actualizado con populate
        const productoConProveedor = await Producto.findById(
          productoActualizado._id
        )
          .populate('proveedorId', 'nombre contacto email telefono nit')
          .lean();

        res.status(200).json({
          exito: true,
          mensaje: 'Producto actualizado exitosamente ✅',
          dato: {
            ...(productoConProveedor as any),
            proveedor: (productoConProveedor as any).proveedorId,
            proveedorId:
              (productoConProveedor as any).proveedorId?._id?.toString() ||
              null,
          },
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
        )
          .populate('proveedorId', 'nombre')
          .lean()
          .maxTimeMS(3000);

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
          dato: {
            ...(productoDesactivado as any),
            proveedor: (productoDesactivado as any).proveedorId,
            proveedorId:
              (productoDesactivado as any).proveedorId?._id?.toString() || null,
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
