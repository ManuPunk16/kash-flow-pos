import { VercelResponse } from "@vercel/node";

/**
 * Utilidades para respuestas HTTP estándar
 */

export interface RespuestaExitosa<T = any> {
  exito: true;
  mensaje?: string;
  dato?: T;
  datos?: T[];
  cantidad?: number;
}

export interface RespuestaError {
  exito: false;
  error: string;
  mensaje?: string;
  detalles?: any;
}

export type Respuesta<T = any> = RespuestaExitosa<T> | RespuestaError;

/**
 * Respuesta exitosa GET
 */
export function respuestaExitosa<T>(
  res: VercelResponse,
  datos: T | T[],
  statusCode = 200,
  mensaje = "Operación exitosa"
): void {
  if (Array.isArray(datos)) {
    res.status(statusCode).json({
      exito: true,
      mensaje,
      datos,
      cantidad: datos.length,
    });
  } else {
    res.status(statusCode).json({
      exito: true,
      mensaje,
      dato: datos,
    });
  }
}

/**
 * Respuesta de error
 */
export function respuestaError(
  res: VercelResponse,
  error: string,
  mensaje: string,
  statusCode = 400,
  detalles?: any
): void {
  res.status(statusCode).json({
    exito: false,
    error,
    mensaje,
    ...(detalles && { detalles }),
  });
}

/**
 * Respuesta creado (201)
 */
export function respuestaCreado<T>(
  res: VercelResponse,
  dato: T,
  mensaje = "Creado exitosamente"
): void {
  res.status(201).json({
    exito: true,
    mensaje,
    dato,
  });
}
