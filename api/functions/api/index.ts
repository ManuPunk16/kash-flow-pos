import { VercelRequest, VercelResponse } from '@vercel/node';
import { AuthenticatedRequest } from '../../src/tipos/AuthenticatedRequest';

// Importar handlers desde src/handlers
import abonosHandler from '../../src/handlers/abonos';
import clientesHandler from '../../src/handlers/clientes';
import productosHandler from '../../src/handlers/productos';
import ventasHandler from '../../src/handlers/ventas';
import interesesHandler from '../../src/handlers/intereses';
import authHandler from '../../src/handlers/auth';

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

    res.status(404).json({ error: 'Ruta no encontrada', pathname });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
};
