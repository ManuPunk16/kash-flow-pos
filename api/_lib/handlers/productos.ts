import { AuthenticatedRequest } from '../tipos/AuthenticatedRequest.js';
import { VercelRequest, VercelResponse } from '@vercel/node';
import { verificarAutenticacion } from '../middleware/autenticacion.js';
import { validar } from '../validacion/validador.js';
import {
  esquemaCrearProducto,
  esquemaActualizarProducto,
} from '../validacion/schemas.js';
import { ProductosService } from '../services/ProductosService.js';
import { Producto } from '../models';

/**
 * Vercel Function - Productos API
 * Maneja GET, POST, PUT, DELETE para productos
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
    // ✅ Autenticación (excepto para rutas públicas)
    await verificarAutenticacion(req, res, () => {});

    if (!req.usuario) {
      res.status(401).json({
        error: 'No autorizado',
        mensaje: 'Token no proporcionado o inválido',
      });
      return;
    }

    // ✅ Routing por método
    switch (req.method) {
      case 'GET':
        // GET /api/productos - Obtener todos
        if (!req.url || req.url === '/') {
          const productos = await ProductosService.obtenerTodos();
          res.status(200).json({
            exito: true,
            datos: productos,
            cantidad: productos.length,
            usuario: req.usuario.email,
          });
          return;
        }

        // GET /api/productos/[id] - Obtener por ID
        const id = req.url?.split('/')[1];
        if (id) {
          const producto = await ProductosService.obtenerPorId(id);
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
        break;

      case 'POST':
        // Validar entrada
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

        // Crear producto
        const nuevoProducto = await ProductosService.crear({
          ...value,
          activo: true,
          fechaCreacion: new Date(),
          fechaActualizacion: new Date(),
        });

        res.status(201).json({
          exito: true,
          mensaje: 'Producto creado exitosamente',
          dato: nuevoProducto,
        });
        return;

      case 'PUT':
        // PUT /api/productos/[id]
        const productoId = req.url?.split('/')[1];
        if (!productoId) {
          res.status(400).json({
            exito: false,
            error: 'ID de producto requerido',
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
          productoId,
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
          mensaje: 'Producto actualizado exitosamente',
          dato: productoActualizado,
        });
        return;

      case 'DELETE':
        // DELETE /api/productos/[id]
        const delId = req.url?.split('/')[1];
        if (!delId) {
          res.status(400).json({
            exito: false,
            error: 'ID de producto requerido',
          });
          return;
        }

        const productoDesactivado = await Producto.findByIdAndUpdate(
          delId,
          {
            activo: false,
            fechaActualizacion: new Date(),
          },
          { new: true }
        );

        if (!productoDesactivado) {
          res.status(404).json({
            exito: false,
            error: 'Producto no encontrado',
          });
          return;
        }

        res.status(200).json({
          exito: true,
          mensaje: 'Producto desactivado exitosamente',
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
    res.status(500).json({
      exito: false,
      error: 'Error al procesar solicitud',
      mensaje: error instanceof Error ? error.message : 'Error desconocido',
    });
  }
};
