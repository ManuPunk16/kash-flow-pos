import rateLimit from 'express-rate-limit';
import { VercelRequest, VercelResponse } from '@vercel/node';
import { logger } from '../utils/logger.js';

// ✅ Configuración global (más permisiva)
export const rateLimiterGlobal = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutos
  max: 100, // 100 requests por IP
  message: {
    exito: false,
    error: 'Demasiadas solicitudes',
    mensaje:
      'Has excedido el límite de 100 requests cada 15 minutos. Intenta más tarde.',
  },
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req: VercelRequest, res: VercelResponse) => {
    logger.warn('Rate limit excedido', {
      ip: req.headers['x-forwarded-for'] || req.socket?.remoteAddress,
      url: req.url,
      method: req.method,
    });

    res.status(429).json({
      exito: false,
      error: 'Demasiadas solicitudes',
      mensaje: 'Has excedido el límite de requests. Intenta en 15 minutos.',
      retryAfter: 15 * 60, // segundos
    });
  },
});

// ✅ Rate limiter para autenticación (más estricto)
export const rateLimiterAuth = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10, // Solo 10 intentos de login cada 15 min
  skipSuccessfulRequests: true,
  message: {
    exito: false,
    error: 'Demasiados intentos de login',
    mensaje: 'Has excedido el límite de intentos. Espera 15 minutos.',
  },
});

// ✅ Rate limiter para operaciones críticas
export const rateLimiterCritico = rateLimit({
  windowMs: 1 * 60 * 1000, // 1 minuto
  max: 10, // 10 requests por minuto
  message: {
    exito: false,
    error: 'Operación limitada',
    mensaje: 'Esta operación está limitada a 10 requests por minuto.',
  },
});

// ✅ Helper para aplicar rate limit en Vercel Functions
export function aplicarRateLimit(
  limiter: any,
  req: VercelRequest,
  res: VercelResponse
): Promise<boolean> {
  return new Promise((resolve) => {
    limiter(req, res, (resultado: any) => {
      if (resultado) {
        resolve(false); // Rate limit excedido
      } else {
        resolve(true); // OK
      }
    });
  });
}
