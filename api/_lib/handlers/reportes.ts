import { AuthenticatedRequest } from '../tipos/AuthenticatedRequest.js';
import { VercelResponse } from '@vercel/node';
import { verificarAutenticacion } from '../middleware/autenticacion.js';
import { ReportesService } from '../services/ReportesService.js';
import { conectarMongoDB } from '../config/database.js';
import { logger } from '../utils/logger.js';

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

  // Solo GET
  if (req.method !== 'GET') {
    res.status(405).json({
      exito: false,
      error: 'Método no permitido',
    });
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

    const { pathname, searchParams } = new URL(
      req.url || '',
      `http://${req.headers.host}`
    );
    const rutaReporte = pathname.replace('/api/reportes', '') || '/';

    logger.info('Generando reporte', {
      ruta: rutaReporte,
      usuario: req.usuario.email,
    });

    // GET /api/reportes - Dashboard completo
    if (rutaReporte === '/' || rutaReporte === '') {
      const resumen = await ReportesService.obtenerResumenDashboard();

      res.status(200).json({
        exito: true,
        datos: resumen,
        timestamp: new Date().toISOString(),
      });
      return;
    }

    // GET /api/reportes/top-productos
    if (rutaReporte.includes('/top-productos')) {
      const limite = parseInt(searchParams.get('limite') || '10', 10);
      const topProductos = await ReportesService.obtenerTopProductos(limite);

      res.status(200).json({
        exito: true,
        datos: topProductos,
        cantidad: topProductos.length,
      });
      return;
    }

    // GET /api/reportes/flujo-caja?fechaInicio=YYYY-MM-DD&fechaFin=YYYY-MM-DD
    if (rutaReporte.includes('/flujo-caja')) {
      const fechaInicioStr = searchParams.get('fechaInicio');
      const fechaFinStr = searchParams.get('fechaFin');

      if (!fechaInicioStr || !fechaFinStr) {
        res.status(400).json({
          exito: false,
          error: 'Parámetros requeridos',
          mensaje:
            'Debe proporcionar fechaInicio y fechaFin (formato: YYYY-MM-DD)',
        });
        return;
      }

      const fechaInicio = new Date(fechaInicioStr);
      const fechaFin = new Date(fechaFinStr);

      const flujo = await ReportesService.obtenerFlujoCaja(
        fechaInicio,
        fechaFin
      );

      res.status(200).json({
        exito: true,
        datos: flujo,
        periodo: {
          inicio: fechaInicio.toISOString(),
          fin: fechaFin.toISOString(),
        },
      });
      return;
    }

    res.status(404).json({
      exito: false,
      error: 'Ruta no encontrada',
      rutasDisponibles: [
        'GET /api/reportes',
        'GET /api/reportes/top-productos?limite=10',
        'GET /api/reportes/flujo-caja?fechaInicio=YYYY-MM-DD&fechaFin=YYYY-MM-DD',
      ],
    });
  } catch (error) {
    logger.error('Error en reportes API', error as Error);

    res.status(500).json({
      exito: false,
      error: 'Error al generar reporte',
      mensaje: error instanceof Error ? error.message : 'Error desconocido',
    });
  }
};
