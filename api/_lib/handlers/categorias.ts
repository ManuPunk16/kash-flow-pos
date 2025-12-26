import { AuthenticatedRequest } from '../tipos/AuthenticatedRequest.js';
import { VercelResponse } from '@vercel/node';
import { verificarAutenticacion } from '../middleware/autenticacion.js';
import {
  CATEGORIAS_PRODUCTO_METADATA,
  CATEGORIAS_EGRESO_METADATA,
  METODOS_PAGO_METADATA,
  ESTADOS_VENTA_METADATA,
  ROLES_USUARIO_METADATA,
} from '../enums/index.js';

export default async (req: AuthenticatedRequest, res: VercelResponse) => {
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Origin', process.env.CORS_ORIGIN || '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS');
  res.setHeader(
    'Access-Control-Allow-Headers',
    'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version, Authorization'
  );

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  try {
    let autenticado = false;
    await verificarAutenticacion(req, res, () => {
      autenticado = true;
    });

    if (!autenticado) {
      return;
    }

    const { pathname } = new URL(req.url || '', `http://${req.headers.host}`);
    const rutaCatalogo = pathname.replace('/api/categorias', '') || '/';

    switch (req.method) {
      case 'GET':
        // ✅ GET /api/categorias - Retornar todos los catálogos
        if (rutaCatalogo === '/' || rutaCatalogo === '') {
          res.status(200).json({
            exito: true,
            datos: {
              productos: CATEGORIAS_PRODUCTO_METADATA,
              egresos: CATEGORIAS_EGRESO_METADATA,
              metodosPago: METODOS_PAGO_METADATA,
              estadosVenta: ESTADOS_VENTA_METADATA,
              roles: ROLES_USUARIO_METADATA,
            },
          });
          return;
        }

        // ✅ GET /api/categorias/productos
        if (rutaCatalogo === '/productos') {
          res.status(200).json({
            exito: true,
            datos: CATEGORIAS_PRODUCTO_METADATA,
          });
          return;
        }

        // ✅ GET /api/categorias/egresos
        if (rutaCatalogo === '/egresos') {
          res.status(200).json({
            exito: true,
            datos: CATEGORIAS_EGRESO_METADATA,
          });
          return;
        }

        // ✅ GET /api/categorias/metodos-pago
        if (rutaCatalogo === '/metodos-pago') {
          res.status(200).json({
            exito: true,
            datos: METODOS_PAGO_METADATA,
          });
          return;
        }

        // ✅ GET /api/categorias/estados-venta
        if (rutaCatalogo === '/estados-venta') {
          res.status(200).json({
            exito: true,
            datos: ESTADOS_VENTA_METADATA,
          });
          return;
        }

        // ✅ GET /api/categorias/roles
        if (rutaCatalogo === '/roles') {
          res.status(200).json({
            exito: true,
            datos: ROLES_USUARIO_METADATA,
          });
          return;
        }

        res.status(404).json({
          exito: false,
          error: 'Catálogo no encontrado',
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
    console.error('❌ Error en categorías API:', error);

    res.status(500).json({
      exito: false,
      error: 'Error al procesar solicitud',
      mensaje: error instanceof Error ? error.message : 'Error desconocido',
    });
  }
};
