import winston from 'winston';

const { combine, timestamp, printf, colorize, errors } = winston.format;

// ✅ Formato personalizado
const formatoPersonalizado = printf(
  (info: winston.Logform.TransformableInfo) => {
    const { level, message, timestamp: ts, stack, ...metadata } = info;

    let msg = `${ts} [${level}]: ${message}`;

    if (stack) {
      msg += `\n${stack}`;
    }

    const metadataKeys = Object.keys(metadata);
    if (metadataKeys.length > 0) {
      msg += `\n${JSON.stringify(metadata, null, 2)}`;
    }

    return msg;
  }
);

// ✅ Logger para desarrollo (con colores)
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

// ✅ Logger para producción (JSON, SOLO CONSOLE - sin archivos)
const loggerProduccion = winston.createLogger({
  level: 'info',
  format: combine(timestamp(), errors({ stack: true }), winston.format.json()),
  transports: [
    // ✅ SOLO Console (Vercel captura estos logs automáticamente)
    new winston.transports.Console(),
  ],
});

// ✅ Exportar según entorno
export const logger =
  process.env.NODE_ENV === 'production' ? loggerProduccion : loggerDesarrollo;

// ✅ Funciones helper
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
