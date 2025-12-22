import winston from 'winston';

const { combine, timestamp, printf, colorize, errors } = winston.format;

// ✅ CORRECTO - Tipar parámetros explícitamente
const formatoPersonalizado = printf(
  (info: winston.Logform.TransformableInfo) => {
    const { level, message, timestamp: ts, stack, ...metadata } = info;

    let msg = `${ts} [${level}]: ${message}`;

    // Agregar stack trace si existe
    if (stack) {
      msg += `\n${stack}`;
    }

    // Agregar metadata si existe
    const metadataKeys = Object.keys(metadata);
    if (metadataKeys.length > 0) {
      msg += `\n${JSON.stringify(metadata, null, 2)}`;
    }

    return msg;
  }
);

// ✅ Logger para desarrollo
const loggerDesarrollo = winston.createLogger({
  level: 'debug',
  format: combine(
    colorize(),
    timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
    errors({ stack: true }),
    formatoPersonalizado
  ),
  transports: [new winston.transports.Console()],
});

// ✅ Logger para producción
const loggerProduccion = winston.createLogger({
  level: 'info',
  format: combine(timestamp(), errors({ stack: true }), winston.format.json()),
  transports: [
    new winston.transports.Console(),
    new winston.transports.File({
      filename: 'logs/error.log',
      level: 'error',
    }),
    new winston.transports.File({ filename: 'logs/combined.log' }),
  ],
});

// ✅ Exportar logger según el entorno
export const logger =
  process.env.NODE_ENV === 'production' ? loggerProduccion : loggerDesarrollo;

// ✅ Funciones helper con tipado explícito
export const logInfo = (
  mensaje: string,
  metadata?: Record<string, unknown>
): void => {
  logger.info(mensaje, metadata);
};

export const logError = (
  mensaje: string,
  error?: Error,
  metadata?: Record<string, unknown>
): void => {
  logger.error(mensaje, {
    error: error?.message,
    stack: error?.stack,
    ...metadata,
  });
};

export const logWarning = (
  mensaje: string,
  metadata?: Record<string, unknown>
): void => {
  logger.warn(mensaje, metadata);
};

export const logDebug = (
  mensaje: string,
  metadata?: Record<string, unknown>
): void => {
  logger.debug(mensaje, metadata);
};
