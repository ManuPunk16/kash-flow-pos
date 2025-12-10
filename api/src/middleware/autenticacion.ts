import { VercelRequest, VercelResponse } from '@vercel/node';
import { AuthenticatedRequest } from '../tipos/AuthenticatedRequest';
import admin from 'firebase-admin';

/**
 * Middleware de autenticación usando Firebase Admin SDK
 * Valida el token JWT de Firebase y verifica permisos de admin
 */

function inicializarFirebase() {
  try {
    if (!admin.apps || admin.apps.length === 0) {
      const serviceAccount = {
        projectId: process.env.FIREBASE_PROJECT_ID,
        privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
        clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
      };

      admin.initializeApp({
        credential: admin.credential.cert(serviceAccount as any),
      });

      console.log('✅ Firebase Admin inicializado correctamente');
    }
  } catch (error) {
    console.error('❌ Error inicializando Firebase Admin:', error);
    throw error;
  }
}

// Cambiar firmas de Request/Response/NextFunction a tipos compatibles
export async function verificarAutenticacion(
  solicitud: AuthenticatedRequest,
  respuesta: VercelResponse,
  siguiente: () => void
): Promise<void> {
  try {
    inicializarFirebase();

    const authHeader = solicitud.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      respuesta.status(401).json({
        error: 'No autorizado',
        mensaje: 'Token no proporcionado',
      });
      return;
    }

    const token = authHeader.split('Bearer ')[1];
    const decodificado = await admin.auth().verifyIdToken(token);

    // Validar que el UID esté en la lista de admins
    const adminUids = (process.env.ADMIN_UIDS || '')
      .split(',')
      .map((id) => id.trim());

    if (!adminUids.includes(decodificado.uid)) {
      respuesta.status(403).json({
        error: 'Acceso denegado',
        mensaje: 'Usuario sin permisos de administrador',
      });
      return;
    }

    // Inyectar usuario en request
    solicitud.usuario = {
      uid: decodificado.uid,
      email: decodificado.email || '',
      esAdmin: adminUids.includes(decodificado.uid),
    };

    siguiente();
  } catch (error) {
    console.error('❌ Error verificando token:', error);
    respuesta.status(401).json({
      error: 'Token inválido',
      mensaje: error instanceof Error ? error.message : 'Error desconocido',
    });
  }
}
