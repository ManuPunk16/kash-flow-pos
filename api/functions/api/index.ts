import { VercelRequest, VercelResponse } from '@vercel/node';
import { AuthenticatedRequest } from '../../_lib/tipos/AuthenticatedRequest.js';

// Importar handlers desde _lib/handlers
import abonosHandler from '../../_lib/handlers/abonos.js';
import clientesHandler from '../../_lib/handlers/clientes.js';
import productosHandler from '../../_lib/handlers/productos.js';
import ventasHandler from '../../_lib/handlers/ventas.js';
import interesesHandler from '../../_lib/handlers/intereses.js';
import authHandler from '../../_lib/handlers/auth.js';

export default async (req: AuthenticatedRequest, res: VercelResponse) => {
  const { pathname } = new URL(req.url || '', `http://${req.headers.host}`);

  // 🛡️ MITIGACIÓN 1: Limitar longitud de URL (previene ReDoS en path-to-regexp)
  if (pathname.length > 2000) {
    res.status(414).json({
      error: 'URI demasiado largo',
      mensaje: 'La URL excede el límite permitido',
    });
    return;
  }

  // 🛡️ MITIGACIÓN 2: Validar patrones sospechosos
  const patronesSospechosos = [
    /\$\{/, // Template strings
    /(.{50,})\1{5,}/, // Repeticiones excesivas
    /<script/i, // XSS
    /javascript:/i, // XSS
    /on\w+\s*=/i, // Event handlers
  ];

  if (patronesSospechosos.some((patron) => patron.test(pathname))) {
    res.status(400).json({
      error: 'Patrón de URL no permitido',
      mensaje: 'La URL contiene caracteres sospechosos',
    });
    return;
  }

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
    // 🛡️ MITIGACIÓN 3: Timeout de 10 segundos para evitar requests colgados
    const timeout = new Promise((_, reject) =>
      setTimeout(() => reject(new Error('Request timeout')), 10000)
    );

    const handleRequest = async () => {
      // ✅ NUEVO: Health check endpoint
      if (pathname === '/api' || pathname === '/api/') {
        res.status(200).json({
          exito: true,
          mensaje: '✅ KashFlow POS API funcionando correctamente',
          version: '1.0.0',
          endpoints: {
            auth: '/api/auth/login-testing',
            productos: '/api/productos',
            clientes: '/api/clientes',
            ventas: '/api/ventas',
            abonos: '/api/abonos',
            intereses: '/api/intereses',
          },
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
        sugerencia: 'Prueba con /api/productos, /api/clientes, etc.',
      });
    };

    await Promise.race([handleRequest(), timeout]);
  } catch (error) {
    console.error('❌ Error en API:', error);

    if (error instanceof Error && error.message === 'Request timeout') {
      res.status(408).json({
        error: 'Timeout',
        mensaje: 'La solicitud tardó demasiado tiempo',
      });
      return;
    }

    res.status(500).json({
      error: 'Error interno del servidor',
      mensaje: error instanceof Error ? error.message : 'Error desconocido',
    });
  }
};
