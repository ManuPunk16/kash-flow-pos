/**
 * Constantes globales de la aplicación
 */

export const METODOS_PAGO = {
  EFECTIVO: "efectivo",
  TRANSFERENCIA: "transferencia",
  FIADO: "fiado",
  CHEQUE: "cheque",
} as const;

export const ESTADOS_VENTA = {
  COMPLETADA: "completada",
  ANULADA: "anulada",
} as const;

export const ROLES_USUARIO = {
  ADMIN: "admin",
  GERENTE: "gerente",
  VENDEDOR: "vendedor",
} as const;

export const INTERES_MENSUAL = 0.2; // 20%

export const CODIGO_VENTA_PREFIJO = "VTA";

export const VALIDACIONES = {
  NOMBRE_MIN: 2,
  NOMBRE_MAX: 100,
  DESCRIPCION_MAX: 500,
  CANTIDAD_MIN: 1,
  MONTO_MIN: 0,
  STOCK_MIN: 0,
} as const;

export const MENSAJES = {
  EXITO: {
    CREADO: "Creado exitosamente ✅",
    ACTUALIZADO: "Actualizado exitosamente ✅",
    ELIMINADO: "Eliminado exitosamente ✅",
    OPERACION: "Operación completada ✅",
  },
  ERROR: {
    VALIDACION: "Validación fallida",
    NO_ENCONTRADO: "Recurso no encontrado",
    NO_AUTORIZADO: "No autorizado",
    ACCESO_DENEGADO: "Acceso denegado",
    INTERNO: "Error interno del servidor",
  },
} as const;
