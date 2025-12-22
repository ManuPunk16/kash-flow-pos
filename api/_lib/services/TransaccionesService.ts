import mongoose, { ClientSession } from 'mongoose';
import { logger } from '../utils/logger.js';

/**
 * Servicio para manejar transacciones de MongoDB
 */
export class TransaccionesService {
  /**
   * Ejecutar operación con transacción
   */
  static async ejecutarConTransaccion<T>(
    operacion: (session: ClientSession) => Promise<T>
  ): Promise<T> {
    const session = await mongoose.startSession();
    session.startTransaction();

    try {
      logger.debug('🔄 Iniciando transacción');

      const resultado = await operacion(session);

      await session.commitTransaction();
      logger.debug('✅ Transacción completada exitosamente');

      return resultado;
    } catch (error) {
      await session.abortTransaction();
      logger.error('❌ Transacción abortada', error as Error);

      throw error;
    } finally {
      session.endSession();
    }
  }

  /**
   * Reintentar operación en caso de error transitorio
   */
  static async reintentarTransaccion<T>(
    operacion: (session: ClientSession) => Promise<T>,
    maxReintentos: number = 3
  ): Promise<T> {
    for (let intento = 1; intento <= maxReintentos; intento++) {
      try {
        return await this.ejecutarConTransaccion(operacion);
      } catch (error) {
        const esErrorTransitorio =
          error instanceof Error &&
          (error.message.includes('TransientTransactionError') ||
            error.message.includes('WriteConflict'));

        if (!esErrorTransitorio || intento === maxReintentos) {
          throw error;
        }

        logger.warn(
          `Reintentando transacción (intento ${intento}/${maxReintentos})`
        );
        await new Promise((resolve) => setTimeout(resolve, 100 * intento));
      }
    }

    throw new Error('Transacción falló después de múltiples reintentos');
  }
}
