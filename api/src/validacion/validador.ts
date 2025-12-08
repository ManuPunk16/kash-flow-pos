import { Request, Response, NextFunction } from "express";
import { Schema } from "joi";

/**
 * Middleware validador genérico
 * Valida el body contra un esquema Joi
 */
export function validar(esquema: Schema) {
  return (
    solicitud: Request,
    respuesta: Response,
    siguiente: NextFunction
  ): void => {
    const { error, value } = esquema.validate(solicitud.body, {
      abortEarly: false,
      stripUnknown: true,
    });

    if (error) {
      const mensajes = error.details.map((detalle) => ({
        campo: detalle.path.join("."),
        error: detalle.message,
      }));

      respuesta.status(400).json({
        error: "Validación fallida",
        detalles: mensajes,
      });
      return;
    }

    // Reemplazar body con datos validados y limpios
    solicitud.body = value;
    siguiente();
  };
}
