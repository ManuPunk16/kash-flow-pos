import winston from 'winston';

const { combine, timestamp, printf, colorize, errors } = winston.format;

// ✅ Formato personalizado
const formatoPersonalizado = printf(
  ({ level, message, timestamp, stack, ...metadata }) => {
    let msg = `${timestamp} [${level}]: ${message}`;

    // Agregar stack trace si existe
    if (stack) {
      msg += `\n${stack}`;
    }

    // Agregar metadata si existe
    if (Object.keys(metadata).length > 0) {
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

// ✅ Funciones helper
export const logInfo = (mensaje: string, metadata?: any) => {
  logger.info(mensaje, metadata);
};

export const logError = (mensaje: string, error?: Error, metadata?: any) => {
  logger.error(mensaje, {
    error: error?.message,
    stack: error?.stack,
    ...metadata,
  });
};

export const logWarning = (mensaje: string, metadata?: any) => {
  logger.warn(mensaje, metadata);
};

export const logDebug = (mensaje: string, metadata?: any) => {
  logger.debug(mensaje, metadata);
};
