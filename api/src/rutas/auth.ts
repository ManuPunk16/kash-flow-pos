import { Router, Request, Response } from "express";
import admin from "firebase-admin";
import axios from "axios";

const enrutador = Router();

/**
 * POST /api/auth/login-testing
 * Generar idToken REAL usando Firebase REST API
 *
 * Body: { "email": "admin@kashflow.com", "password": "123456" }
 */
enrutador.post(
  "/login-testing",
  async (solicitud: Request, respuesta: Response) => {
    try {
      const { email, password } = solicitud.body;

      // Validar entrada
      if (!email || !password) {
        respuesta.status(400).json({
          exito: false,
          error: "Email y contraseña requeridos",
          mensaje:
            'Envía { "email": "tu@email.com", "password": "123456" } en el body',
        });
        return;
      }

      // Obtener Firebase API Key (pública, está en .env)
      const firebaseApiKey = process.env.FIREBASE_API_KEY;

      if (!firebaseApiKey) {
        respuesta.status(500).json({
          exito: false,
          error: "Error de configuración",
          mensaje: "FIREBASE_API_KEY no está configurado en .env",
        });
        return;
      }

      // Usar Firebase REST API para obtener idToken
      // Este endpoint devuelve un idToken real, no un customToken
      const endpoint = `https://identitytoolkit.googleapis.com/v1/accounts:signInWithPassword?key=${firebaseApiKey}`;

      const datosLogin = {
        email,
        password,
        returnSecureToken: true, // ← Devuelve el idToken
      };

      // Llamar a Firebase REST API
      const { data } = await axios.post(endpoint, datosLogin);

      // ✅ data.idToken es un idToken REAL que tu API puede verificar
      const idToken = data.idToken;
      const uid = data.localId;

      // Verificar el token para asegurar que es válido
      const decodificado = await admin.auth().verifyIdToken(idToken);

      // Validar que el usuario esté en la lista blanca
      const adminUids = (process.env.ADMIN_UIDS || "")
        .split(",")
        .map((id) => id.trim());

      if (!adminUids.includes(decodificado.uid)) {
        respuesta.status(403).json({
          exito: false,
          error: "Acceso denegado",
          mensaje: `El usuario ${email} no tiene permisos de administrador`,
          uid: decodificado.uid,
          adminUidsValidos: adminUids.length,
        });
        return;
      }

      // ✅ Éxito - Devolver idToken válido
      respuesta.json({
        exito: true,
        mensaje: "Login exitoso ✅",
        token: idToken, // ← idToken válido para usar en requests
        uid,
        email: decodificado.email,
        expiresIn: data.expiresIn, // "3600" (1 hora)
        instrucciones: {
          paso1: "Copia el valor de 'token'",
          paso2: "En Insomnia, ve a Headers en cualquier request",
          paso3: "Agrega: Authorization: Bearer [PEGA_EL_TOKEN_AQUI]",
          paso4: "¡Listo! Ya puedes hacer requests autenticados",
        },
      });
    } catch (error) {
      // Manejar errores específicos de Firebase
      const mensaje =
        error instanceof Error ? error.message : "Error desconocido";

      if (
        mensaje.includes("INVALID_LOGIN_CREDENTIALS") ||
        mensaje.includes("invalid password")
      ) {
        respuesta.status(401).json({
          exito: false,
          error: "Credenciales inválidas",
          mensaje: "Email o contraseña incorrectos",
        });
        return;
      }

      if (mensaje.includes("USER_DISABLED")) {
        respuesta.status(403).json({
          exito: false,
          error: "Usuario deshabilitado",
          mensaje: "Este usuario ha sido deshabilitado",
        });
        return;
      }

      if (mensaje.includes("EMAIL_NOT_FOUND")) {
        respuesta.status(404).json({
          exito: false,
          error: "Usuario no encontrado",
          mensaje: `No existe cuenta con el email: ${solicitud.body.email}`,
        });
        return;
      }

      // Error genérico
      respuesta.status(400).json({
        exito: false,
        error: "Error al generar token",
        mensaje,
      });
    }
  }
);

export default enrutador;
