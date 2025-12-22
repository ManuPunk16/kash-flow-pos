import { VercelRequest, VercelResponse } from '@vercel/node';
import { Types } from 'mongoose';
import { logger } from '../utils/logger.js';

/**
 * Middleware para validar ObjectId de MongoDB
 */
export function validarObjectId(nombreCampo: string = 'id') {
  return (req: VercelRequest, res: VercelResponse, next: () => void): void => {
    const { pathname } = new URL(req.url || '', `http://${req.headers.host}`);
    const segmentos = pathname.split('/').filter(Boolean);
    const id = segmentos[segmentos.length - 1];

    if (!id) {
      res.status(400).json({
        exito: false,
        error: 'ID requerido',
        mensaje: `El parámetro ${nombreCampo} es requerido`,
      });
      return;
    }

    if (!Types.ObjectId.isValid(id)) {
      logger.warn('ObjectId inválido', {
        campo: nombreCampo,
        valor: id,
        url: req.url,
      });

      res.status(400).json({
        exito: false,
        error: 'ID inválido',
        mensaje: `El ${nombreCampo} debe ser un ObjectId válido de MongoDB (24 caracteres hexadecimales)`,
        ejemplo: '507f1f77bcf86cd799439011',
      });
      return;
    }

    next();
  };
}

/**
 * Validar múltiples ObjectIds en el body
 */
export function validarObjectIdsEnBody(campos: string[]) {
  return (req: VercelRequest, res: VercelResponse, next: () => void): void => {
    const errores: string[] = [];

    for (const campo of campos) {
      const valor = req.body[campo];

      if (valor && !Types.ObjectId.isValid(valor)) {
        errores.push(`${campo} debe ser un ObjectId válido`);
      }
    }

    if (errores.length > 0) {
      res.status(400).json({
        exito: false,
        error: 'Validación fallida',
        detalles: errores,
      });
      return;
    }

    next();
  };
}

/**
 * Helper para validar manualmente
 */
export function esObjectIdValido(id: string): boolean {
  return Types.ObjectId.isValid(id);
}
