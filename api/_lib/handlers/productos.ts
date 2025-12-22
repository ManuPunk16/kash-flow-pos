import { AuthenticatedRequest } from '../tipos/AuthenticatedRequest.js';
import { VercelResponse } from '@vercel/node';
import { verificarAutenticacion } from '../middleware/autenticacion.js';
import {
  esquemaCrearProducto,
  esquemaActualizarProducto,
} from '../validacion/schemas.js';
import { ProductosService } from '../services/ProductosService.js';
import { Producto } from '../models/index.js';
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
    // ✅ Conectar a MongoDB primero
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
    const rutaProducto = pathname.replace('/api/productos', '') || '/';

    console.log('🔍 Debug productos:', {
      urlCompleta: req.url,
      pathname,
      rutaProducto,
      metodo: req.method,
    });

    // ✅ Routing por método
    switch (req.method) {
      case 'GET':
        // GET /api/productos - Obtener todos
        if (rutaProducto === '/' || rutaProducto === '') {
          console.log('📦 Consultando productos...');
          const inicio = Date.now();

          // ✅ Extraer parámetros de paginación
          const { pagina, limite, skip } = obtenerOpcionesPaginacion(req);

          // ✅ Consulta con paginación
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

        // ID inválido
        res.status(400).json({
          exito: false,
          error: 'ID de producto inválido',
          mensaje:
            'El ID debe ser un ObjectId válido de MongoDB (24 caracteres hexadecimales)',
        });
        return;

      case 'POST':
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
            detalles: errorUpdate.details,
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

function obtenerOpcionesPaginacion(req: AuthenticatedRequest) {
  const pagina = parseInt(req.query.pagina as string) || 1;
  const limite = parseInt(req.query.limite as string) || 10;
  const skip = (pagina - 1) * limite;

  return { pagina, limite, skip };
}

function construirRespuestaPaginada(
  productos: any[],
  total: number,
  pagina: number,
  limite: number
) {
  const totalPaginas = Math.ceil(total / limite);

  return {
    exito: true,
    datos: productos,
    pagina,
    limite,
    total,
    totalPaginas,
  };
}
