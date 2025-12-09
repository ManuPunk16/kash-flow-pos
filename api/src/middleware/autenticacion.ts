import { VercelRequest, VercelResponse } from '@vercel/node';
import admin from 'firebase-admin';
import '../tipos/vercel'; // Importante para reconocer .usuario

// Cambiar firmas de Request/Response/NextFunction a tipos compatibles
export async function verificarAutenticacion(
  solicitud: VercelRequest,
  respuesta: VercelResponse,
  siguiente: () => void
): Promise<void> {
  try {
    if (!admin.apps || admin.apps.length === 0) {
      respuesta.status(500).json({
        error: 'Error interno',
        mensaje: 'Firebase no inicializado',
      });
      return;
    }

    const token = solicitud.headers.authorization?.split(' ')[1];
    if (!token) {
      respuesta.status(401).json({
        error: 'No autorizado',
        mensaje: 'Token faltante',
      });
      return;
    }

    const decodificado = await admin.auth().verifyIdToken(token);
    const adminUids = (process.env.ADMIN_UIDS || '')
      .split(',')
      .map((uid) => uid.trim());

    if (!adminUids.includes(decodificado.uid)) {
      respuesta.status(403).json({ error: 'Acceso denegado' });
      return;
    }

    // Ahora TypeScript no se quejará gracias a vercel.d.ts
    solicitud.usuario = {
      uid: decodificado.uid,
      email: decodificado.email || '',
      esAdmin: true,
    };

    siguiente();
  } catch (error) {
    console.error('Auth error:', error);
    respuesta.status(401).json({ error: 'Token inválido' });
  }
}
