import { Request, Response, NextFunction } from "express";
import admin from "firebase-admin"; // ✅ Importar así (no como * as admin)

// Extender tipos de Express para incluir usuario
declare global {
  namespace Express {
    interface Request {
      usuario?: {
        uid: string;
        email: string;
        esAdmin: boolean;
      };
    }
  }
}

/**
 * Middleware de autenticación Firebase
 * Valida el JWT y verifica que el usuario esté en la lista de admins
 */
export async function verificarAutenticacion(
  solicitud: Request,
  respuesta: Response,
  siguiente: NextFunction
): Promise<void> {
  try {
    // ✅ Verificar que Firebase esté inicializado
    if (!admin.apps || admin.apps.length === 0) {
      respuesta.status(500).json({
        error: "Error interno",
        mensaje: "Firebase no está inicializado",
      });
      return;
    }

    // Obtener token del header Authorization
    const token = solicitud.headers.authorization?.split(" ")[1];

    if (!token) {
      respuesta.status(401).json({
        error: "No autorizado",
        mensaje: "Token no proporcionado",
      });
      return;
    }

    // ✅ Usar admin.auth() correctamente
    const decodificado = await admin.auth().verifyIdToken(token);

    // Validar que el usuario esté en la lista blanca (ADMIN_UIDS)
    const adminUids = (process.env.ADMIN_UIDS || "")
      .split(",")
      .map((uid) => uid.trim());
    const esAdmin = adminUids.includes(decodificado.uid);

    if (!esAdmin) {
      respuesta.status(403).json({
        error: "Acceso denegado",
        mensaje: `El usuario ${decodificado.email} no tiene permisos de administrador`,
      });
      return;
    }

    // Adjuntar datos del usuario al objeto request
    solicitud.usuario = {
      uid: decodificado.uid,
      email: decodificado.email || "",
      esAdmin: true,
    };

    siguiente();
  } catch (error) {
    console.error(
      "❌ Error de autenticación:",
      error instanceof Error ? error.message : error
    );

    respuesta.status(401).json({
      error: "Token inválido",
      mensaje:
        error instanceof Error
          ? error.message
          : "No se pudo verificar el token",
    });
  }
}

/**
 * Middleware para verificar solo autenticación (sin validar admin)
 * Útil para rutas que pueden consultar datos públicos
 */
export async function verificarAutenticacionOpcional(
  solicitud: Request,
  respuesta: Response,
  siguiente: NextFunction
): Promise<void> {
  try {
    if (!admin.apps || admin.apps.length === 0) {
      siguiente();
      return;
    }

    const token = solicitud.headers.authorization?.split(" ")[1];

    if (token) {
      const decodificado = await admin.auth().verifyIdToken(token);
      solicitud.usuario = {
        uid: decodificado.uid,
        email: decodificado.email || "",
        esAdmin: false,
      };
    }

    siguiente();
  } catch (error) {
    // Si el token es inválido, continuamos sin usuario
    console.warn(
      "⚠️ Token inválido en autenticación opcional, continuando sin usuario"
    );
    siguiente();
  }
}
