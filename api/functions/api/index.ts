import { VercelRequest, VercelResponse } from '@vercel/node';
import { AuthenticatedRequest } from '../../_lib/tipos/AuthenticatedRequest.js';
import { conectarMongoDB } from '../../_lib/config/database.js';

// Importar handlers
import abonosHandler from '../../_lib/handlers/abonos.js';
import clientesHandler from '../../_lib/handlers/clientes.js';
import productosHandler from '../../_lib/handlers/productos.js';
import ventasHandler from '../../_lib/handlers/ventas.js';
import interesesHandler from '../../_lib/handlers/intereses.js';
import authHandler from '../../_lib/handlers/auth.js';

export default async (req: AuthenticatedRequest, res: VercelResponse) => {
  const { pathname } = new URL(req.url || '', `http://${req.headers.host}`);

  // CORS Global
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
    // ✅ Conectar a MongoDB antes de procesar requests
    if (!pathname.includes('/auth/')) {
      await conectarMongoDB();
    }

    // Health check
    if (pathname === '/api' || pathname === '/api/') {
      res.status(200).json({
        exito: true,
        mensaje: '✅ KashFlow POS API funcionando correctamente',
        version: '1.0.0',
        timestamp: new Date().toISOString(),
      });
      return;
    }

    if (pathname.startsWith('/api/abonos'))
      return await abonosHandler(req, res);
    if (pathname.startsWith('/api/clientes'))
      return await clientesHandler(req, res);
    if (pathname.startsWith('/api/productos'))
      return await productosHandler(req, res);
    if (pathname.startsWith('/api/ventas'))
      return await ventasHandler(req, res);
    if (pathname.startsWith('/api/intereses'))
      return await interesesHandler(req, res);
    if (pathname.startsWith('/api/auth')) return await authHandler(req, res);

    res.status(404).json({
      error: 'Ruta no encontrada',
      pathname,
    });
  } catch (error) {
    console.error('❌ Error en API:', error);
    res.status(500).json({
      error: 'Error interno del servidor',
      mensaje: error instanceof Error ? error.message : 'Error desconocido',
    });
  }
};
