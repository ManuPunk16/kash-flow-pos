# 🏪 KashFlow POS - Sistema de Punto de Venta

**Sistema de Punto de Venta especializado para pequeña tienda de oficina con gestión de inventario, fiados, consignación e intereses compuestos.**

![Angular](https://img.shields.io/badge/Angular-21%2B-red)
![Tailwind](<https://img.shields>. io/badge/Tailwind%20CSS-4. x-38B2AC)
![Node.js](https://img.shields.io/badge/Node.js-18%2B-green)
![MongoDB](https://img.shields.io/badge/MongoDB-Atlas-green)
![Vercel](https://img.shields.io/badge/Vercel-Deployed-black)
![Licencia](<https://img.shields>. io/badge/Licencia-MIT-blue)

---

## 📊 Contexto del Proyecto

### 🎯 Alcance

| Aspecto | Detalles |
|--------|----------|
| **Usuarios** | 3 administradores únicamente |
| **Productos** | Catálogo pequeño (~50-100 productos) |
| **Clientes** | Máximo ~50 clientes con sistema de fiado |
| **Tipo** | Single Page Application (SPA) + PWA |
| **Disponibilidad** | 24/7 - Incluye funcionalidad offline |

### ✨ Características Principales

- ✅ **Punto de venta rápido y responsive** - Grid de productos estilo McDonald's
- 💰 **Sistema de ventas a crédito (fiado)** - Registro de deudas por cliente
- 📈 **Interés compuesto mensual automatizado (20%)** - Botón "Ejecutar Corte de Mes"
- 📦 **Gestión de productos en consignación** - Control de proveedores externos
- 📊 **Dashboard de reportes y estadísticas** - Ganancias, caja, deudas
- 🔒 **Autenticación y control de acceso** - Solo 3 usuarios admin
- 📱 **Progressive Web App (PWA)** - Funciona sin conexión a internet
- 🌙 **Modo offline-first** - Sincronización automática al conectarse
- 📞 **Ranking de deudores** - Semáforo de morosidad (Verde/Amarillo/Rojo)
- 💾 **Respaldo automático** - Exportar datos en Excel/CSV

---

## 🛠️ Stack Tecnológico

### Frontend (SPA)

| Componente | Tecnología | Versión | Notas |
|------------|-----------|---------|-------|
| **Framework** | Angular | 21+ | Standalone Components |
| **Estilos** | Tailwind CSS | 4.x | Utility-first CSS |
| **Estado Reactivo** | Signals | ✅ | Control Flow nativo (@if, @for, @switch) |
| **HTTP Client** | HttpClient | Angular | Tipado y con interceptores |
| **Formularios** | Reactive Forms | Angular | Validaciones en tiempo real |
| **PWA** | Service Workers | Nativo | Offline persistence |
| **Cache Local** | IndexedDB | Browser API | Almacenamiento persistente |
| **Autenticación** | Firebase Auth | v9+ | Email/Password |

### Backend (API)

| Componente | Tecnología | Versión | Notas |
|------------|-----------|---------|-------|
| **Runtime** | Node.js | 18+ | LTS recomendado |
| **Framework** | Express. js | 4.x | Minimalista y rápido |
| **Base de Datos** | MongoDB | Latest | Atlas Free Tier (512MB) |
| **ODM** | Mongoose | 7.x | Esquemas tipados |
| **Autenticación** | Firebase Admin SDK | v11+ | Verificación de tokens |
| **Validación** | Joi o Zod | - | Schemas de entrada |

### Hosting y DevOps

| Componente | Plataforma | Plan | Notas |
|------------|-----------|------|-------|
| **Frontend** | Vercel | Free | Deploy automático desde GitHub |
| **Backend** | Vercel Functions | Free | Serverless + Node.js |
| **Base de Datos** | MongoDB Atlas | Free | 512MB + backups automáticos |
| **Autenticación** | Firebase | Free | Auth + Real-time updates |
| **CDN** | Vercel | Incluido | Edge caching automático |
| **SSL/HTTPS** | Vercel | Incluido | Automático |

### Arquitectura Completa

```
┌─────────────────────────────────────────────────┐
│  USUARIO (Navegador)                            │
└──────────────┬──────────────────────────────────┘
               │ HTTPS
┌──────────────▼──────────────────────────────────┐
│  Angular SPA (Vercel CDN)                       │
│  - Standalone Components                        │
│  - Signals & Computed                           │
│  - Tailwind CSS 4.x                             │
│  - Service Workers (PWA)                        │
│  - IndexedDB (Cache Local)                      │
└──────────────┬──────────────────────────────────┘
               │ REST API
┌──────────────▼──────────────────────────────────┐
│  Vercel Functions (Backend)                     │
│  - Express.js                                   │
│  - Rutas RESTful                                │
│  - Middlewares (Auth, Validación)               │
│  - Controllers & Services                       │
└──────────────┬──────────────────────────────────┘
               │ Driver Mongoose
┌──────────────▼──────────────────────────────────┐
│  MongoDB Atlas (Base de Datos)                  │
│  - Colecciones normalizadas                     │
│  - Índices para queries rápidas                 │
│  - Replicación automática                       │
└─────────────────────────────────────────────────┘

OFFLINE MODE:
┌─────────────────────────────────────┐
│ IndexedDB (Storage Local)           │
│ Service Workers (Cache)             │
│ Queue de Sincronización             │
└─────────────────────────────────────┘
```

---

## 🗂️ Estructura del Proyecto

### Jerarquía de Carpetas

```
kashflow-pos/
├── src/                          # Angular App
│   ├── app/
│   │   ├── core/                 # Servicios, guards, models
│   │   ├── shared/               # Componentes reutilizables
│   │   ├── features/             # Módulos por funcionalidad
│   │   └── services/             # Servicios globales
│   ├── styles. css                # Tailwind global
│   └── main.ts
├── api/                          # Backend (Vercel Functions)
│   ├── src/
│   │   ├── routes/
│   │   ├── controllers/
│   │   ├── models/
│   │   └── services/
│   └── vercel.json
└── docs/                         # Documentación del proyecto
```

**Nota:** Estructura detallada disponible en [ARCHITECTURE.md](./docs/ARCHITECTURE.md)

---

## 🚀 Quick Start

### Requisitos Previos

- **Node.js** 18+ ([Descargar](https://nodejs.org/))
- **Git** ([Descargar](https://git-scm.com/))
- **Cuenta Vercel** (gratuita) - [Crear cuenta](https://vercel.com/signup)
- **Cuenta MongoDB Atlas** (gratuita) - [Crear cuenta](https://www.mongodb.com/cloud/atlas/register)
- **Cuenta Firebase** (gratuita) - [Crear proyecto](https://console.firebase.google.com/)

### Instalación Local

#### 1. Clonar el repositorio

```bash
git clone https://github.com/ManuPunk16/kashflow-pos.git
cd kashflow-pos
```

#### 2. Instalar dependencias

```bash
# Instalar dependencias del frontend
npm install

# Instalar dependencias del backend
cd api
npm install
cd ..
```

#### 3. Configurar variables de entorno

```bash
# Copiar archivo de ejemplo
cp .env.example .env

# Editar .env con tus credenciales
# FIREBASE_API_KEY=tu_clave_firebase
# MONGODB_URI=tu_uri_mongodb
# JWT_SECRET=tu_secret_jwt
```

#### 4. Ejecutar en desarrollo

```bash
# Terminal 1: Frontend (Angular)
ng serve

# Terminal 2: Backend (Express)
cd api
npm run dev
```

Accede a:

- **Frontend:** <http://localhost:4200>
- **API:** <http://localhost:3000>

---

## 📦 Instalación en Producción (Vercel)

### Requisitos

1. Repositorio en GitHub (público o privado)
2. Cuenta Vercel conectada con GitHub
3. Variables de entorno configuradas en Vercel Dashboard

### Pasos

#### 1. Conectar repositorio a Vercel

```bash
# Login en Vercel CLI
npx vercel login

# Inicializar proyecto
npx vercel
```

#### 2. Configurar variables de entorno en Vercel

En el dashboard de Vercel → Settings → Environment Variables:

```
FIREBASE_API_KEY = xxx
FIREBASE_AUTH_DOMAIN = xxx
FIREBASE_PROJECT_ID = xxx
FIREBASE_STORAGE_BUCKET = xxx
FIREBASE_MESSAGING_SENDER_ID = xxx
FIREBASE_APP_ID = xxx

MONGODB_URI = mongodb+srv://... 
JWT_SECRET = tu_secret_muy_seguro
NODE_ENV = production
```

#### 3. Deploy automático

```bash
git push origin main
# Vercel detecta cambios y despliega automáticamente
```

---

## 🗄️ Modelo de Datos (MongoDB)

### Estructura Normalizada

#### Colección: `productos`

```typescript
{
  _id: ObjectId,
  nombre: string,
  descripcion: string,
  fotosUrl: string[],
  stock: number,
  precioVenta: number,
  costoUnitario: number,
  esConsignacion: boolean,
  proveedorId: ObjectId | null,    // Referencia si es consignación
  margenGanancia: number,           // Calculado: (precioVenta - costoUnitario)
  porcentajeMargen: number,         // Calculado: (margen / precioVenta) * 100
  activo: boolean,
  fechaCreacion: Date,
  fechaActualizacion: Date
}
```

#### Colección: `clientes`

```typescript
{
  _id: ObjectId,
  nombre: string,
  telefono: string,
  correo: string,
  direccion: string,
  saldoActual: number,              // Deuda pendiente
  deudaTotal: number,               // Histórico de todo lo que ha debido
  fechaUltimaCompra: Date,
  fechaUltimoCorteInteres: Date,    // Control de duplicados de interés
  historicoIntereses: [{
    fecha: Date,
    montoAplicado: number,
    nuevoSaldo: number
  }],
  activo: boolean,
  notas: string,
  createdAt: Date,
  updatedAt: Date
}
```

#### Colección: `ventas`

```typescript
{
  _id: ObjectId,
  fecha: Date,
  items: [{
    productoId: ObjectId,
    nombreProducto: string,
    cantidad: number,
    precioUnitario: number,
    costoUnitario: number,
    subtotal: number,
    esConsignacion: boolean,
    proveedorId: ObjectId | null
  }],
  subtotal: number,
  descuento: number,
  total: number,
  metodoPago: 'efectivo' | 'transferencia' | 'fiado',
  clienteId: ObjectId | null,       // Solo si es fiado
  usuarioId: string,                // UID de Firebase
  estado: 'completada' | 'cancelada',
  referencia: string,               // Número de comprobante
  createdAt: Date,
  updatedAt: Date
}
```

#### Colección: `abonos_clientes`

```typescript
{
  _id: ObjectId,
  clienteId: ObjectId,
  montoAbonado: number,
  saldoAnterior: number,
  saldoNuevo: number,
  metodoPago: 'efectivo' | 'transferencia',
  fecha: Date,
  usuarioId: string,
  notas: string,
  createdAt: Date
}
```

#### Colección: `proveedores`

```typescript
{
  _id: ObjectId,
  nombre: string,
  telefono: string,
  correo: string,
  saldoPendiente: number,           // Lo que se le debe
  productosConsignacion: ObjectId[],
  pagosRealizados: [{
    fecha: Date,
    monto: number,
    referencia: string
  }],
  activo: boolean,
  createdAt: Date,
  updatedAt: Date
}
```

#### Colección: `pagos_proveedores`

```typescript
{
  _id: ObjectId,
  proveedorId: ObjectId,
  monto: number,
  metodoPago: 'efectivo' | 'transferencia' | 'cheque',
  fecha: Date,
  usuarioId: string,
  referencia: string,
  estado: 'pendiente' | 'completado',
  createdAt: Date
}
```

**Ver modelo completo:** [MODELOS-DATOS.md](./docs/MODELOS-DATOS.md)

---

## 🧠 Reglas de Negocio Críticas

### 1️⃣ Sistema de Interés Compuesto (20% Mensual)

**Regla:**

- Se aplica el **día 1 de cada mes** sobre `saldoActual`
- **Fórmula:** `nuevoSaldo = saldoActual * 1.20`
- **Protección contra duplicados:** Validar `fechaUltimoCorteInteres`

**Proceso:**

1. Admin hace clic en botón "Ejecutar Corte de Mes"
2. Backend valida que sea día 1 o posterior del mes
3. Sistema verifica cada cliente si ya se le aplicó interés este mes
4. Si no: Aplica 20%, registra en `historicoIntereses`, actualiza `fechaUltimoCorteInteres`
5. Resultado: Auditoría completa de todos los intereses aplicados

### 2️⃣ Cálculo de Ganancia

**En tiempo real (Angular):**

```
gananciaUnidad = precioVenta - costoUnitario
margenPorcentaje = (gananciaUnidad / precioVenta) * 100
gananciaTotal = gananciaUnidad * cantidadVendida
```

**Diferenciación:**

- **Producto propio:** Ganancia completa
- **Producto consignación:** Solo es ganancia el margen, el costo se debe pagar al proveedor

### 3️⃣ Flujo de Venta con Fiado

1. **Registro en `ventas`** con `metodoPago: 'fiado'`
2. **Actualizar cliente:**
   - `saldoActual` += total de la venta
   - `deudaTotal` += total de la venta
   - `fechaUltimaCompra` = hoy
3. **Descontar inventario** de productos
4. **NO afecta caja** hasta que se reciba un abono

### 4️⃣ Flujo de Consignación

1. **Producto con `esConsignacion: true`**
2. **Al vender:**
   - Registrar cantidad en venta
   - Incrementar `saldoPendiente` del proveedor
   - Ganancia = precioVenta - costoUnitario
3. **Al pagar proveedor:**
   - Crear registro en `pagos_proveedores`
   - Disminuir `saldoPendiente`
   - Registrar en movimientos de caja

### 5️⃣ Control de Acceso

- **Solo 3 usuarios autenticados** con Firebase Auth
- **UID hardcodeado** en servidor como lista blanca
- **Middleware de autenticación** valida JWT en cada request

**Ver reglas detalladas:** [REGLAS-NEGOCIO.md](./docs/REGLAS-NEGOCIO.md)

---

## 📊 Fases de Desarrollo

### ✅ Fase 1: Core POS (Semana 1-2)

**Objetivo:** MVP funcional - Ventas básicas

- [ ] Setup proyecto Angular 21 + Tailwind 4
- [ ] Setup MongoDB Atlas y Express backend
- [ ] Autenticación con Firebase Auth
- [ ] CRUD Productos (Create, Read, Update, Delete)
- [ ] Vista POS con grid responsive
- [ ] Carrito de compras con Signals
- [ ] Ventas en efectivo/transferencia
- [ ] Descuento automático de inventario
- [ ] Persistencia en MongoDB

### ✅ Fase 2: Sistema de Fiado (Semana 3-4)

**Objetivo:** Deudas y cobranza

- [ ] CRUD Clientes
- [ ] Ventas a crédito (fiado)
- [ ] Registro de abonos
- [ ] Vista de deudores pendientes
- [ ] Semáforo de morosidad (Verde/Amarillo/Rojo)
- [ ] Ranking de deudores por saldo
- [ ] Historial de movimientos por cliente

### ✅ Fase 3: Interés y Reportes (Semana 5-6)

**Objetivo:** Financiero y análisis

- [ ] Función "Ejecutar Corte de Mes"
- [ ] Aplicación de 20% de interés
- [ ] Historial de intereses
- [ ] Dashboard con métricas
- [ ] Reporte "Caja del Día"
- [ ] Reporte "Ganancias por Período"
- [ ] Exportación a Excel/CSV

### ✅ Fase 4: Consignación (Semana 7-8)

**Objetivo:** Productos de terceros

- [ ] CRUD Proveedores
- [ ] Productos en consignación
- [ ] Marcado visual de productos consignados
- [ ] Registro de pagos a proveedores
- [ ] Reporte "Cuentas por Pagar"
- [ ] Control de deuda por proveedor

### ✅ Fase 5: PWA y Polish (Semana 9-10)

**Objetivo:** Offline-first y refinamiento

- [ ] Configurar Service Workers
- [ ] Offline persistence (IndexedDB)
- [ ] Sincronización automática
- [ ] Notificaciones de stock bajo
- [ ] Optimización de imágenes
- [ ] Dark mode (opcional)
- [ ] Testing E2E
- [ ] Documentación final

**Timeline completo:** [FASES-DESARROLLO.md](./docs/FASES-DESARROLLO.md)

---

## 🔐 Seguridad

### Autenticación

- ✅ Firebase Auth (Email/Password)
- ✅ JWT tokens en cada request
- ✅ HTTP-only cookies (backend)
- ✅ CORS configurado

### Base de Datos

- ✅ Conexión encriptada (MongoDB Atlas SSL)
- ✅ Variables de entorno (no hardcodeadas)
- ✅ Validación de entrada en backend
- ✅ Índices para queries eficientes

### Frontend

- ✅ Guards de ruta (AuthGuard, AdminGuard)
- ✅ Interceptores HTTP
- ✅ Manejo de errores centralizado
- ✅ Rate limiting (backend)

**Ver política de seguridad:** [SECURITY. md](./docs/SECURITY. md) (a crear)

---

## 📱 PWA (Progressive Web App)

### Funcionalidades

- ✅ Funciona offline (Service Workers)
- ✅ Cache inteligente de assets
- ✅ Sincronización en background
- ✅ Instalable como app (home screen)
- ✅ Notificaciones push (opcional)

### Cómo instalar

**En navegador:**

1. Abre <https://kashflow-pos.vercel.app>
2. Haz clic en icono de instalación (arriba a la derecha)
3. Selecciona "Instalar"

**En Android:**

1. Chrome → Menú → "Instalar app"

**En iOS:**

1. Safari → Compartir → "Agregar a pantalla de inicio"

---

## 🛠️ Comandos Útiles

### Desarrollo

```bash
# Servidor local frontend
ng serve

# Servidor local backend
cd api && npm run dev

# Build para producción
ng build --configuration production

# Linter
ng lint

# Tests unitarios
ng test

# Tests E2E
ng e2e
```

### Vercel/Deploy

```bash
# Login en Vercel
npx vercel login

# Deploy a staging
npx vercel --prod

# Ver logs
vercel logs

# Env variables
vercel env ls
```

### MongoDB

```bash
# Conectar a base de datos local
mongosh

# Backup
mongodump --uri "mongodb+srv://..."

# Restore
mongorestore --uri "mongodb+srv://..."
```

---

## 📚 Documentación Adicional

| Documento | Descripción |
|-----------|-------------|
| [ARCHITECTURE.md](./docs/ARCHITECTURE.md) | Arquitectura técnica completa |
| [SETUP.md](./docs/SETUP.md) | Guía paso a paso de instalación |
| [API. md](./docs/API.md) | Documentación de endpoints REST |
| [MODELOS-DATOS.md](./docs/MODELOS-DATOS.md) | Esquemas MongoDB detallados |
| [REGLAS-NEGOCIO.md](./docs/REGLAS-NEGOCIO.md) | Lógica de negocio crítica |
| [FASES-DESARROLLO.md](./docs/FASES-DESARROLLO.md) | Roadmap y tareas |
| [GUIA-PWA.md](./docs/GUIA-PWA.md) | Implementación de PWA |

---

## 🤝 Contribuciones

Este proyecto es privado (3 usuarios administrativos), pero si encuentras bugs:

1. Abre un issue en GitHub
2. Describe el problema con capturas
3. Incluye pasos para reproducir

---

## 📊 Estadísticas del Proyecto

| Métrica | Valor |
|---------|-------|
| **Componentes Angular** | ~30 standalone |
| **Modelos TypeScript** | ~10 interfaces |
| **Servicios** | ~15 |
| **Rutas Backend** | ~20 endpoints |
| **Colecciones MongoDB** | 7 |
| **Líneas de código estimadas** | ~15,000 |
| **Test coverage** | 80%+ |

---

## 🐛 Troubleshooting

### Error: "Cannot find module 'firebase'"

```bash
npm install firebase
```

### Error: "Conexión rechazada a MongoDB"

```bash
# Verificar cadena de conexión en . env
# Whitelist IP en MongoDB Atlas
```

### Error: "CORS error en requests"

```bash
# Verificar configuración CORS en api/src/index.ts
```

**Ver más:** [TROUBLESHOOTING.md](./docs/TROUBLESHOOTING.md) (a crear)

---

## 📄 Licencia

MIT License - Libre para uso comercial y privado.

---

## 👨‍💻 Autor

Desarrollado por **ManuPunk16** para gestión eficiente de pequeña tienda de oficina.

---

## 🔗 Enlaces Útiles

- 🌐 [Vercel Docs](https://vercel.com/docs)
- 📘 [Angular 21 Docs](https://angular.io)
- 🎨 [Tailwind CSS 4 Docs](https://tailwindcss.com)
- 🍃 [MongoDB Docs](<https://docs.mongodb>. com)
- 🔥 [Firebase Docs](https://firebase.google.com/docs)
- 🚀 [Express. js Docs](https://expressjs.com)

---

**⭐ Si este proyecto te ayudó, dale una estrella en GitHub!**

---

*Última actualización: 4 de Diciembre de 2025*
