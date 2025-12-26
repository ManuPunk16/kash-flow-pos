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
import proveedoresHandler from '../../_lib/handlers/proveedores.js';
import pagosProveedoresHandler from '../../_lib/handlers/pagos-proveedores.js';
import reportesHandler from '../../_lib/handlers/reportes.js';
import categoriasHandler from '../../_lib/handlers/categorias.js';
import egresosHandler from '../../_lib/handlers/egresos.js'; // ✅ NUEVO

export default async (req: AuthenticatedRequest, res: VercelResponse) => {
  const { pathname } = new URL(req.url || '', `http://${req.headers.host}`);

  // ✅ CORS DINÁMICO
  const origin = req.headers.origin || '';

  const origenesPermitidos = [
    'http://localhost:4200',
    'http://localhost:3000',
    'http://127.0.0.1:4200',
    'http://127.0.0.1:3000',
    'https://kash-flow-pos.vercel.app',
  ];

  if (
    origenesPermitidos.includes(origin) ||
    origin.startsWith('http://localhost') ||
    origin.startsWith('http://127.0.0.1')
  ) {
    res.setHeader('Access-Control-Allow-Origin', origin);
  } else {
    res.setHeader(
      'Access-Control-Allow-Origin',
      'https://kash-flow-pos.vercel.app'
    );
  }

  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader(
    'Access-Control-Allow-Methods',
    'GET,OPTIONS,PATCH,DELETE,POST,PUT'
  );
  res.setHeader(
    'Access-Control-Allow-Headers',
    'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version, Authorization'
  );

  // ✅ DESHABILITAR CACHÉ DE VERCEL
  res.setHeader(
    'Cache-Control',
    'no-store, no-cache, must-revalidate, proxy-revalidate'
  );
  res.setHeader('Pragma', 'no-cache');
  res.setHeader('Expires', '0');
  res.setHeader('Surrogate-Control', 'no-store');

  // ✅ Preflight OPTIONS
  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  try {
    if (!pathname.includes('/auth/')) {
      await conectarMongoDB();
    }

    // Health check
    if (pathname === '/api' || pathname === '/api/') {
      res.status(200).json({
        exito: true,
        mensaje: '✅ KashFlow POS API funcionando',
        version: '2.5.1',
        timestamp: new Date().toISOString(),
        cors: {
          originRecibido: origin,
          permitido: origin.includes('localhost') ? 'localhost' : 'producción',
        },
      });
      return;
    }

    // Routing
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
    if (pathname.startsWith('/api/proveedores'))
      return await proveedoresHandler(req, res);
    if (pathname.startsWith('/api/pagos-proveedores'))
      return await pagosProveedoresHandler(req, res);
    if (pathname.startsWith('/api/reportes'))
      return await reportesHandler(req, res);
    if (pathname.startsWith('/api/categorias'))
      return await categoriasHandler(req, res);
    if (pathname.startsWith('/api/egresos'))
      return await egresosHandler(req, res);
    if (pathname.startsWith('/api/auth')) return await authHandler(req, res);

    // 404
    res.status(404).json({ error: 'Ruta no encontrada', pathname });
  } catch (error) {
    console.error('❌ Error en API:', error);
    res.status(500).json({
      error: 'Error interno del servidor',
      mensaje: error instanceof Error ? error.message : 'Error desconocido',
    });
  }
};
