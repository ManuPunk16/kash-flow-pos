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

export default async (req: AuthenticatedRequest, res: VercelResponse) => {
  const { pathname } = new URL(req.url || '', `http://${req.headers.host}`);

  // ✅ CORS - PERMITIR LOCALHOST SIEMPRE
  const origin = req.headers.origin || '';

  console.log('📍 Origin recibido:', origin);

  // Lista de orígenes permitidos
  const origenesPermitidos = [
    'http://localhost:4200',
    'http://localhost:3000',
    'http://127.0.0.1:4200',
    'http://127.0.0.1:3000',
    'https://kash-flow-pos.vercel.app',
  ];

  // Verificar si el origin está en la lista O si es localhost con cualquier puerto
  if (
    origenesPermitidos.includes(origin) ||
    origin.startsWith('http://localhost') ||
    origin.startsWith('http://127.0.0.1')
  ) {
    res.setHeader('Access-Control-Allow-Origin', origin);
    console.log('✅ CORS permitido para:', origin);
  } else {
    // Fallback: permitir el dominio de producción
    res.setHeader(
      'Access-Control-Allow-Origin',
      'https://kash-flow-pos.vercel.app'
    );
    console.log('⚠️ Origin no reconocido, usando producción');
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

  // ✅ Manejar preflight OPTIONS
  if (req.method === 'OPTIONS') {
    console.log('✅ Preflight OPTIONS procesado');
    res.status(200).end();
    return;
  }

  try {
    // Conectar a MongoDB
    if (!pathname.includes('/auth/')) {
      await conectarMongoDB();
    }

    // Health check
    if (pathname === '/api' || pathname === '/api/') {
      res.status(200).json({
        exito: true,
        mensaje: '✅ KashFlow POS API funcionando correctamente',
        version: '2.4.0',
        timestamp: new Date().toISOString(),
        endpoints: {
          auth: 'POST /api/auth/login-testing',
          productos:
            'GET /api/productos, GET /api/productos/buscar, POST /api/productos/registro-rapido',
          clientes: 'GET /api/clientes, GET /api/clientes/deudores',
          ventas: 'GET /api/ventas, POST /api/ventas, POST /api/ventas/express',
          abonos: 'GET /api/abonos, POST /api/abonos',
          intereses: 'GET /api/intereses, POST /api/intereses/corte',
          proveedores: 'GET /api/proveedores, GET /api/proveedores/con-deuda',
          pagosProveedores: 'GET /api/pagos-proveedores',
          reportes: 'GET /api/reportes, GET /api/reportes/top-productos',
          categorias: 'GET /api/categorias',
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
    if (pathname.startsWith('/api/auth')) return await authHandler(req, res);

    // 404
    res.status(404).json({
      error: 'Ruta no encontrada',
      pathname,
      rutasDisponibles: [
        'GET  /api',
        'POST /api/auth/login-testing',
        'GET  /api/productos',
        'GET  /api/productos/buscar?q=texto',
        'GET  /api/productos/validar-stock/:id?cantidad=X',
        'POST /api/productos/registro-rapido',
        'GET  /api/clientes',
        'GET  /api/clientes/deudores',
        'GET  /api/ventas',
        'POST /api/ventas/express',
        'GET  /api/ventas/periodo?fechaInicio&fechaFin',
        'GET  /api/abonos',
        'GET  /api/intereses',
        'POST /api/intereses/corte',
        'GET  /api/proveedores',
        'GET  /api/proveedores/con-deuda',
        'GET  /api/pagos-proveedores',
        'GET  /api/reportes',
        'GET  /api/reportes/top-productos',
        'GET  /api/reportes/flujo-caja',
        'GET  /api/categorias',
      ],
    });
  } catch (error) {
    console.error('❌ Error en API:', error);
    res.status(500).json({
      error: 'Error interno del servidor',
      mensaje: error instanceof Error ? error.message : 'Error desconocido',
    });
  }
};
