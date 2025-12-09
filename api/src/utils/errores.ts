/**
 * Errores personalizados de la aplicación
 */

export class ErrorValidacion extends Error {
  constructor(public detalles: any[], mensaje = "Validación fallida") {
    super(mensaje);
    this.name = "ErrorValidacion";
  }
}

export class ErrorNoEncontrado extends Error {
  constructor(entidad: string) {
    super(`${entidad} no encontrado`);
    this.name = "ErrorNoEncontrado";
  }
}

export class ErrorNoAutorizado extends Error {
  constructor(mensaje = "No autorizado") {
    super(mensaje);
    this.name = "ErrorNoAutorizado";
  }
}

export class ErrorAccesoDenegado extends Error {
  constructor(mensaje = "Acceso denegado") {
    super(mensaje);
    this.name = "ErrorAccesoDenegado";
  }
}

export class ErrorStockInsuficiente extends Error {
  constructor(producto: string, stock: number) {
    super(`Stock insuficiente para ${producto}. Disponible: ${stock}`);
    this.name = "ErrorStockInsuficiente";
  }
}

/**
 * Mapear errores a códigos HTTP
 */
export function mapearError(error: Error): {
  statusCode: number;
  mensaje: string;
} {
  switch (error.name) {
    case "ErrorValidacion":
      return { statusCode: 400, mensaje: error.message };
    case "ErrorNoEncontrado":
      return { statusCode: 404, mensaje: error.message };
    case "ErrorNoAutorizado":
      return { statusCode: 401, mensaje: error.message };
    case "ErrorAccesoDenegado":
      return { statusCode: 403, mensaje: error.message };
    case "ErrorStockInsuficiente":
      return { statusCode: 400, mensaje: error.message };
    default:
      return { statusCode: 500, mensaje: "Error interno del servidor" };
  }
}
