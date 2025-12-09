import '../../../src/tipos/vercel';
import { VercelRequest, VercelResponse } from '@vercel/node';
import admin from 'firebase-admin';
import axios from 'axios';

// ✅ Inicializar Firebase una sola vez
function inicializarFirebase() {
  if (admin.apps && admin.apps.length > 0) {
    return;
  }

  const serviceAccount = {
    projectId: process.env.FIREBASE_PROJECT_ID,
    privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
    clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
  };

  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount as any),
  });
}

export default async (req: VercelRequest, res: VercelResponse) => {
  // ✅ CORS
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Origin', process.env.CORS_ORIGIN || '*');
  res.setHeader(
    'Access-Control-Allow-Methods',
    'GET,OPTIONS,PATCH,DELETE,POST,PUT'
  );
  res.setHeader(
    'Access-Control-Allow-Headers',
    'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version, Authorization'
  );

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  // ✅ Solo POST a /api/auth/login-testing
  if (req.method !== 'POST' || !req.url?.includes('login-testing')) {
    res.status(405).json({ exito: false, error: 'Método no permitido' });
    return;
  }

  try {
    inicializarFirebase();

    const { email, password } = req.body;

    if (!email || !password) {
      res.status(400).json({
        exito: false,
        error: 'Email y contraseña requeridos',
      });
      return;
    }

    const firebaseApiKey = process.env.FIREBASE_API_KEY;
    if (!firebaseApiKey) {
      res.status(500).json({
        exito: false,
        error: 'Error de configuración',
        mensaje: 'FIREBASE_API_KEY no está configurado',
      });
      return;
    }

    // ✅ Obtener idToken de Firebase
    const endpoint = `https://identitytoolkit.googleapis.com/v1/accounts:signInWithPassword?key=${firebaseApiKey}`;
    const { data } = await axios.post(endpoint, {
      email,
      password,
      returnSecureToken: true,
    });

    const idToken = data.idToken;
    const uid = data.localId;

    // ✅ Verificar token
    const decodificado = await admin.auth().verifyIdToken(idToken);

    // ✅ Validar que sea admin
    const adminUids = (process.env.ADMIN_UIDS || '')
      .split(',')
      .map((id) => id.trim());

    if (!adminUids.includes(decodificado.uid)) {
      res.status(403).json({
        exito: false,
        error: 'Acceso denegado',
        mensaje: `El usuario ${email} no tiene permisos de administrador`,
      });
      return;
    }

    res.status(200).json({
      exito: true,
      mensaje: 'Login exitoso ✅',
      token: idToken,
      uid,
      email: decodificado.email,
      expiresIn: data.expiresIn,
    });
  } catch (error) {
    const mensaje =
      error instanceof Error ? error.message : 'Error desconocido';

    if (
      mensaje.includes('INVALID_LOGIN_CREDENTIALS') ||
      mensaje.includes('invalid password')
    ) {
      res.status(401).json({
        exito: false,
        error: 'Credenciales inválidas',
        mensaje: 'Email o contraseña incorrectos',
      });
      return;
    }

    res.status(400).json({
      exito: false,
      error: 'Error al generar token',
      mensaje,
    });
  }
};
