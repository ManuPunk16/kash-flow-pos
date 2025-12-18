import mongoose from 'mongoose';

let isConnected = false;

export async function conectarMongoDB(): Promise<void> {
  if (isConnected) {
    console.log('✅ Usando conexión existente a MongoDB');
    return;
  }

  try {
    const mongoUri = process.env.MONGODB_URI;

    if (!mongoUri) {
      throw new Error(
        'MONGODB_URI no está configurado en las variables de entorno'
      );
    }

    await mongoose.connect(mongoUri, {
      serverSelectionTimeoutMS: 5000, // ✅ Timeout de 5 segundos
      socketTimeoutMS: 5000,
      maxPoolSize: 10, // ✅ Pool de conexiones
      minPoolSize: 2,
      retryWrites: true,
      w: 'majority',
    });

    isConnected = true;
    console.log('✅ Conectado a MongoDB Atlas');
  } catch (error) {
    console.error('❌ Error conectando a MongoDB:', error);
    throw error;
  }
}

export async function desconectarMongoDB(): Promise<void> {
  if (!isConnected) return;

  await mongoose.disconnect();
  isConnected = false;
  console.log('✅ Desconectado de MongoDB');
}
