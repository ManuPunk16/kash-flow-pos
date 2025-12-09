import { VercelRequest, VercelResponse } from '@vercel/node';
import '../../src/tipos/vercel';

// Importar rutas
import abonosHandler from './rutas/abonos';
import clientesHandler from './rutas/clientes';
import productosHandler from './rutas/productos';
import ventasHandler from './rutas/ventas';
import interesesHandler from './rutas/intereses';
import authHandler from './rutas/auth';

/**
 * Router principal que distribuye las peticiones
 */
export default async (req: VercelRequest, res: VercelResponse) => {
  const { pathname } = new URL(req.url || '', `http://${req.headers.host}`);

  // Establecer CORS
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

  // Enrutar según la ruta
  if (pathname.startsWith('/api/abonos')) {
    return abonosHandler(req, res);
  }
  if (pathname.startsWith('/api/clientes')) {
    return clientesHandler(req, res);
  }
  if (pathname.startsWith('/api/productos')) {
    return productosHandler(req, res);
  }
  if (pathname.startsWith('/api/ventas')) {
    return ventasHandler(req, res);
  }
  if (pathname.startsWith('/api/intereses')) {
    return interesesHandler(req, res);
  }
  if (pathname.startsWith('/api/auth')) {
    return authHandler(req, res);
  }

  // Ruta no encontrada
  res.status(404).json({
    error: 'Ruta no encontrada',
    pathname,
  });
};
