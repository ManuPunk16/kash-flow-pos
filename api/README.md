# 🔧 KashFlow POS - API Backend

API REST con Express.js + MongoDB + Firebase Authentication

## 🚀 Quick Start

### Instalar dependencias

```bash
npm install
```

### Configurar variables de entorno

```bash
cp .env.example .env
# Editar .env con tus credenciales
```

### Iniciar en desarrollo

```bash
npm run dev
```

API disponible en: **http://localhost:3000**

---

## 📡 Endpoints Disponibles

### Autenticación (Sin protección)

```http
POST /api/auth/login-testing
Content-Type: application/json

{
  "email": "admin@kashflow.com",
  "password": "123456"
}
```

**Respuesta:**

```json
{
  "exito": true,
  "token": "eyJhbGc...",
  "uid": "...",
  "email": "...",
  "expiresIn": "3600"
}
```

### Productos (Protegido)

#### Obtener todos

```http
GET /api/productos
Authorization: Bearer {token}
```

#### Crear producto

```http
POST /api/productos
Authorization: Bearer {token}
Content-Type: application/json

{
  "codigo": "P001",
  "nombre": "Producto ejemplo",
  "descripcion": "Descripción",
  "precioVenta": 50000,
  "costoUnitario": 30000,
  "stock": 10,
  "categoria": "Electrónica"
}
```

#### Actualizar

```http
PUT /api/productos/{id}
Authorization: Bearer {token}
```

#### Eliminar (soft delete)

```http
DELETE /api/productos/{id}
Authorization: Bearer {token}
```

### Clientes (Protegido)

#### Obtener todos

```http
GET /api/clientes
Authorization: Bearer {token}
```

#### Obtener deudores

```http
GET /api/clientes/deudores/listado
Authorization: Bearer {token}
```

#### Crear cliente

```http
POST /api/clientes
Authorization: Bearer {token}
Content-Type: application/json

{
  "nombre": "Juan",
  "apellido": "Pérez",
  "identificacion": "12345678",
  "email": "juan@email.com",
  "telefono": "+573001234567"
}
```

### Ventas (Protegido)

#### Obtener todas

```http
GET /api/ventas
Authorization: Bearer {token}
```

#### Obtener ventas de cliente

```http
GET /api/ventas/cliente/{clienteId}
Authorization: Bearer {token}
```

#### Registrar venta

```http
POST /api/ventas
Authorization: Bearer {token}
Content-Type: application/json

{
  "clienteId": "...",
  "usuarioId": "...",
  "items": [
    {
      "productoId": "...",
      "cantidad": 2,
      "precioUnitario": 50000,
      "costoUnitario": 30000
    }
  ],
  "metodoPago": "fiado",
  "descuento": 0
}
```

### Abonos (Protegido)

#### Registrar abono

```http
POST /api/abonos
Authorization: Bearer {token}
Content-Type: application/json

{
  "clienteId": "...",
  "monto": 50000,
  "metodoPago": "efectivo"
}
```

### Intereses (Protegido)

#### Ejecutar corte de mes

```http
POST /api/intereses/corte
Authorization: Bearer {token}
```

---

## 🗂️ Estructura

```
api/
├── src/
│   ├── models/          (Esquemas MongoDB + Interfaces)
│   ├── rutas/           (Endpoints)
│   ├── services/        (Lógica de negocio)
│   ├── middleware/      (Autenticación, validación)
│   ├── validacion/      (Schemas Joi)
│   └── index.ts         (Servidor principal)
├── .env                 (Variables de entorno)
└── package.json
```

---

## 🔐 Autenticación

Todos los endpoints (excepto `/api/auth/login-testing`) requieren:

```
Authorization: Bearer {idToken}
```

El token expira en **1 hora**.

---

## 📝 Notas para Desarrollo

- La ruta `/api/auth/login-testing` es **solo para testing** en Insomnia
- En producción, los tokens se obtienen desde el frontend (Angular)
- Los usuarios deben estar en `ADMIN_UIDS` del `.env`
- Todos los datos se validan con **Joi** antes de guardarse
- Soft deletes: se marca `activo: false`, no se borra de la BD

---

## 🆘 Troubleshooting

### Error: "Firebase no está inicializado"

- Verifica que `FIREBASE_PRIVATE_KEY` esté correcto en `.env`
- Usa `\n` literal para saltos de línea

### Error: "Token inválido"

- Obtén uno nuevo del endpoint `/api/auth/login-testing`
- Verifica que uses `Bearer` antes del token

### Error: "MongoDB connection failed"

- Verifica la `MONGODB_URI`
- Asegúrate de que la IP está whitelisted en Atlas

---

**Última actualización:** 8 de Diciembre de 2024
