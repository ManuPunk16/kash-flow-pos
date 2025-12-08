import express, {
  type Request,
  type Response,
  type NextFunction,
} from "express";
import cors from "cors";
import dotenv from "dotenv";
import mongoose from "mongoose";
import admin from "firebase-admin"; // ✅ Sin * as

// Cargar variables de entorno
dotenv.config();

// Importar modelos
import {
  Usuario,
  Producto,
  Cliente,
  Venta,
  AbonoCliente,
  Proveedor,
  PagoProveedor,
} from "./models";

// Importar rutas
import rutasAuth from "./rutas/auth";
import rutasProductos from "./rutas/productos";
import rutasClientes from "./rutas/clientes";
import rutasVentas from "./rutas/ventas";
import rutasAbonos from "./rutas/abonos";
import rutasIntereses from "./rutas/intereses";

const aplicacion = express();
const puerto = process.env.PORT || 3000;
const mongoUri = process.env.MONGODB_URI;

// ============================================
// INICIALIZAR FIREBASE ADMIN
// ============================================

function inicializarFirebase(): void {
  try {
    // Validar que las variables de entorno existan
    const requiredVars = [
      "FIREBASE_PROJECT_ID",
      "FIREBASE_PRIVATE_KEY",
      "FIREBASE_CLIENT_EMAIL",
    ];

    const faltanVariables = requiredVars.filter(
      (variable) => !process.env[variable]
    );

    if (faltanVariables.length > 0) {
      console.error(
        `❌ Faltan variables de entorno: ${faltanVariables.join(", ")}`
      );
      if (process.env.NODE_ENV === "production") {
        process.exit(1);
      }
      return;
    }

    // ✅ Validar que Firebase no esté ya inicializado
    if (admin.apps && admin.apps.length > 0) {
      console.log("✅ Firebase Admin SDK ya inicializado");
      return;
    }

    // ✅ Inicializar Firebase Admin SDK
    const serviceAccount = {
      projectId: process.env.FIREBASE_PROJECT_ID,
      privateKey: process.env.FIREBASE_PRIVATE_KEY!.replace(/\\n/g, "\n"),
      clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
    };

    admin.initializeApp({
      credential: admin.credential.cert(serviceAccount as any),
    });

    console.log("✅ Firebase Admin SDK inicializado correctamente");

    // ✅ Verificar que se inicializó correctamente
    if (!admin.auth()) {
      throw new Error("No se pudo inicializar admin.auth()");
    }
  } catch (error) {
    const mensaje =
      error instanceof Error ? error.message : "Error desconocido";
    console.error("❌ Error inicializando Firebase:", mensaje);

    // En desarrollo, permitir continuar
    if (process.env.NODE_ENV === "production") {
      process.exit(1);
    }
  }
}

// Inicializar Firebase ANTES de cualquier cosa
inicializarFirebase();

// ============================================
// MIDDLEWARES GLOBALES
// ============================================

// CORS configurado
aplicacion.use(
  cors({
    origin: process.env.CORS_ORIGIN || "http://localhost:4200",
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
  })
);

// Parsear JSON
aplicacion.use(express.json());
aplicacion.use(express.urlencoded({ extended: true }));

// Logger de requests
aplicacion.use(
  (solicitud: Request, respuesta: Response, siguiente: NextFunction) => {
    console.log(
      `📡 ${solicitud.method} ${solicitud.path} - ${new Date().toISOString()}`
    );
    siguiente();
  }
);

// ============================================
// CONECTAR A MONGODB
// ============================================

async function conectarBaseDatos(): Promise<void> {
  try {
    if (!mongoUri) {
      throw new Error(
        "❌ MONGODB_URI no está configurado en variables de entorno"
      );
    }

    await mongoose.connect(mongoUri);
    console.log("✅ Conectado a MongoDB Atlas");
  } catch (error) {
    console.error("❌ Error al conectar a MongoDB:", error);
    process.exit(1);
  }
}

// ============================================
// RUTAS PRINCIPALES
// ============================================

// Ruta raíz (health check)
aplicacion.get("/", (solicitud: Request, respuesta: Response) => {
  respuesta.json({
    mensaje: "KashFlow POS API ✅",
    version: "1.0.0",
    estado: "en línea",
    timestamp: new Date().toISOString(),
    modelos: {
      usuarios: Usuario.collection.name,
      productos: Producto.collection.name,
      clientes: Cliente.collection.name,
      ventas: Venta.collection.name,
      abonosClientes: AbonoCliente.collection.name,
      proveedores: Proveedor.collection.name,
      pagosProveedores: PagoProveedor.collection.name,
    },
  });
});

// Ruta de salud
aplicacion.get("/api/salud", (solicitud: Request, respuesta: Response) => {
  respuesta.json({
    estado: "API funcionando ✅",
    timestamp: new Date().toISOString(),
    servicio: "kashflow-pos-api",
    bdConectada: mongoose.connection.readyState === 1,
  });
});

// ============================================
// RUTAS API
// ============================================

// ✅ AGREGAR ESTA LÍNEA PRIMERO (sin autenticación)
aplicacion.use("/api/auth", rutasAuth);

// El resto de rutas con autenticación
aplicacion.use("/api/productos", rutasProductos);
aplicacion.use("/api/clientes", rutasClientes);
aplicacion.use("/api/ventas", rutasVentas);
aplicacion.use("/api/abonos", rutasAbonos);
aplicacion.use("/api/intereses", rutasIntereses);

// ============================================
// MANEJO DE ERRORES 404
// ============================================

aplicacion.use((solicitud: Request, respuesta: Response) => {
  respuesta.status(404).json({
    error: "Ruta no encontrada",
    ruta: solicitud.path,
    metodo: solicitud.method,
    mensaje: "El endpoint solicitado no existe",
  });
});

// ============================================
// ERROR HANDLER GLOBAL
// ============================================

aplicacion.use(
  (
    error: Error,
    solicitud: Request,
    respuesta: Response,
    siguiente: NextFunction
  ) => {
    console.error("❌ Error interno:", error.message);
    respuesta.status(500).json({
      error: "Error interno del servidor",
      mensaje: error.message,
    });
  }
);

// ============================================
// INICIAR SERVIDOR
// ============================================

async function iniciarServidor(): Promise<void> {
  await conectarBaseDatos();

  aplicacion.listen(puerto, () => {
    console.log(`
╔════════════════════════════════════════════════╗
║        🚀 KashFlow POS API (Express)           ║
╠════════════════════════════════════════════════╣
║   Puerto: ${puerto}                              ║
║   URL: http://localhost:${puerto}                ║
║   Health: http://localhost:${puerto}/api/salud   ║
║   Base de Datos: MongoDB Atlas (kashflowdb)   ║
║   Autenticación: Firebase Auth                 ║
╚════════════════════════════════════════════════╝
    `);
  });
}

// Manejar errores no capturados
process.on("unhandledRejection", (razon, promesa) => {
  console.error("❌ Promesa rechazada no manejada:", razon);
  process.exit(1);
});

iniciarServidor();
