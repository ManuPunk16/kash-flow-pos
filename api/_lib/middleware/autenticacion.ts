import { VercelResponse } from '@vercel/node';
import { AuthenticatedRequest } from '../tipos/AuthenticatedRequest.js';
import admin from 'firebase-admin';

let firebaseInicializado = false;

function inicializarFirebase() {
  if (firebaseInicializado) return;

  try {
    const projectId = process.env.FIREBASE_PROJECT_ID;
    const privateKey = process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n');
    const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;

    // ✅ Validar que todas las variables existan
    if (!projectId || !privateKey || !clientEmail) {
      throw new Error(
        `Variables de Firebase faltantes: ${
          !projectId ? 'FIREBASE_PROJECT_ID ' : ''
        }${!privateKey ? 'FIREBASE_PRIVATE_KEY ' : ''}${
          !clientEmail ? 'FIREBASE_CLIENT_EMAIL' : ''
        }`
      );
    }

    if (!admin.apps || admin.apps.length === 0) {
      admin.initializeApp({
        credential: admin.credential.cert({
          projectId,
          privateKey,
          clientEmail,
        }),
      });
    }

    firebaseInicializado = true;
    console.log('✅ Firebase Admin inicializado correctamente');
  } catch (error) {
    console.error('❌ Error inicializando Firebase Admin:', error);
    throw error;
  }
}

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

    solicitud.usuario = {
      uid: decodificado.uid,
      email: decodificado.email || '',
      esAdmin: true,
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
