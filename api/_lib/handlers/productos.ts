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
import { CategoriaProducto } from '../enums/index.js'; // ✅ Importar enum

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

    switch (req.method) {
      case 'GET':
        if (rutaProducto.includes('/buscar')) {
          const { searchParams } = new URL(
            req.url || '',
            `http://${req.headers.host}`
          );
          const query = searchParams.get('q')?.trim();

          if (!query || query.length < 2) {
            res.status(400).json({
              exito: false,
              error: 'Query inválido',
              mensaje: 'Debe proporcionar al menos 2 caracteres',
            });
            return;
          }

          const productos = await Producto.find({
            activo: true,
            $or: [
              { nombre: { $regex: query, $options: 'i' } },
              { codigoBarras: { $regex: query, $options: 'i' } },
              { categoria: { $regex: query, $options: 'i' } },
              { descripcion: { $regex: query, $options: 'i' } },
            ],
          })
            .populate('proveedorId', 'nombre contacto email telefono nit')
            .select(
              'nombre codigoBarras precioVenta stock categoria proveedorId'
            )
            .limit(20)
            .lean()
            .maxTimeMS(3000);

          const productosFormateados = productos.map((p: any) => ({
            ...p,
            proveedor: p.proveedorId,
            proveedorId: p.proveedorId?._id?.toString() || null,
          }));

          res.status(200).json({
            exito: true,
            datos: productosFormateados,
            cantidad: productosFormateados.length,
            query,
          });
          return;
        }

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
            producto: {
              nombre: producto.nombre,
              stock: producto.stock,
              stockMinimo: producto.stockMinimo,
            },
            validacion: {
              disponible,
              stockBajo,
              cantidadSolicitada: cantidad,
            },
          });
          return;
        }

        if (rutaProducto === '/' || rutaProducto === '') {
          const productos = await Producto.find({ activo: true })
            .populate('proveedorId', 'nombre contacto email telefono nit')
            .select('-__v')
            .lean()
            .maxTimeMS(5000);

          const productosFormateados = productos.map((p: any) => ({
            ...p,
            proveedor: p.proveedorId,
            proveedorId: p.proveedorId?._id?.toString() || null,
          }));

          res.status(200).json({
            exito: true,
            datos: productosFormateados,
            cantidad: productosFormateados.length,
          });
          return;
        }

        const productoId = rutaProducto.replace('/', '');

        if (productoId && /^[0-9a-fA-F]{24}$/.test(productoId)) {
          const producto = await Producto.findById(productoId)
            .populate('proveedorId', 'nombre contacto email telefono nit')
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

          const productoFormateado = {
            ...(producto as any),
            proveedor: (producto as any).proveedorId,
            proveedorId: (producto as any).proveedorId?._id?.toString() || null,
          };

          res.status(200).json({
            exito: true,
            dato: productoFormateado,
          });
          return;
        }

        res.status(400).json({
          exito: false,
          error: 'ID de producto inválido',
        });
        return;

      case 'POST':
        if (rutaProducto.includes('/registro-rapido')) {
          const { error: errorRapido, value: valueRapido } =
            esquemaRegistroRapidoProducto.validate(req.body, {
              abortEarly: false,
              stripUnknown: true,
            });

          if (errorRapido) {
            res.status(400).json({
              exito: false,
              error: 'Validación fallida',
              detalles: errorRapido.details.map((d) => ({
                campo: d.path.join('.'),
                mensaje: d.message,
              })),
            });
            return;
          }

          const { codigoBarras, cantidad = 1 } = valueRapido;

          // ✅ CORREGIDO: Usar enum en lugar de string literal
          const nuevoProducto = await ProductosService.crear({
            nombre: `Producto ${codigoBarras}`,
            codigoBarras,
            descripcion: 'Pendiente completar datos',
            precioVenta: 0,
            costoUnitario: 0,
            stock: cantidad,
            stockMinimo: 5,
            esConsignacion: false,
            proveedorId: null,
            categoria: CategoriaProducto.OTROS, // ✅ Usar enum
            activo: true,
            imagen: '',
            pendienteCompletarDatos: true,
            fechaCreacion: new Date(),
            fechaActualizacion: new Date(),
          });

          res.status(201).json({
            exito: true,
            mensaje: 'Producto registrado temporalmente ✅',
            advertencia:
              'Recuerda completar los datos del producto (nombre, precio, etc.)',
            dato: nuevoProducto,
          });
          return;
        }

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
