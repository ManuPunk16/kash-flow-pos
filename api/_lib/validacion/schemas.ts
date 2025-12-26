import Joi from 'joi';
import {
  CATEGORIAS_PRODUCTO_VALORES,
  METODOS_PAGO_VALORES,
  CATEGORIAS_EGRESO_VALORES,
} from '../enums/index.js';

/**
 * Esquemas de validación para todas las entidades
 */

// =====================
// PRODUCTOS
// =====================

export const esquemaCrearProducto = Joi.object({
  nombre: Joi.string().required().min(2).max(100).trim(),
  codigoBarras: Joi.string().optional().trim().uppercase(),
  descripcion: Joi.string().required().min(5).max(500).trim(),
  precioVenta: Joi.number().required().min(0),
  costoUnitario: Joi.number().required().min(0),
  stock: Joi.number().required().min(0).integer(),
  stockMinimo: Joi.number().optional().min(0).integer().default(5),
  esConsignacion: Joi.boolean().optional().default(false),
  proveedorId: Joi.string().optional().hex().length(24),
  categoria: Joi.string()
    .required()
    .valid(...CATEGORIAS_PRODUCTO_VALORES), // ✅ Usar enum
  activo: Joi.boolean().optional().default(true),
  imagen: Joi.string().optional(),
});

export const esquemaActualizarProducto = Joi.object({
  nombre: Joi.string().optional().min(2).max(100).trim(),
  codigoBarras: Joi.string().optional().trim().uppercase(),
  descripcion: Joi.string().optional().min(5).max(500).trim(),
  precioVenta: Joi.number().optional().min(0),
  costoUnitario: Joi.number().optional().min(0),
  stock: Joi.number().optional().min(0).integer(),
  stockMinimo: Joi.number().optional().min(0).integer(),
  esConsignacion: Joi.boolean().optional(),
  proveedorId: Joi.string().optional().allow(null).hex().length(24),
  categoria: Joi.string()
    .optional()
    .valid(...CATEGORIAS_PRODUCTO_VALORES), // ✅ Usar enum
  activo: Joi.boolean().optional(),
  imagen: Joi.string().optional().allow(null),
});

export const esquemaRegistroRapidoProducto = Joi.object({
  codigoBarras: Joi.string().required().trim().uppercase(),
  cantidad: Joi.number().optional().min(1).integer().default(1),
});

// =====================
// CLIENTES (sin cambios)
// =====================

export const esquemaCrearCliente = Joi.object({
  nombre: Joi.string().required().min(2).max(100),
  apellido: Joi.string().required().min(2).max(100),
  email: Joi.string().optional().email(),
  telefono: Joi.string().optional().min(7).max(20),
  identificacion: Joi.string()
    .required()
    .min(5)
    .max(20)
    .external(async (valor) => {
      const existe = await Cliente.findOne({ identificacion: valor });
      if (existe) {
        throw new Error('La identificación ya está registrada');
      }
    }),
  direccion: Joi.string().optional().max(200),
}).unknown(false);

export const esquemaActualizarCliente = Joi.object({
  nombre: Joi.string().optional().min(2).max(100),
  apellido: Joi.string().optional().min(2).max(100),
  email: Joi.string().optional().email(),
  telefono: Joi.string().optional().min(7).max(20),
  direccion: Joi.string().optional().max(200),
  activo: Joi.boolean().optional(),
})
  .unknown(false)
  .min(1);

// =====================
// VENTAS (sin cambios)
// =====================

export const esquemaCrearVenta = Joi.object({
  clienteId: Joi.string()
    .required()
    .regex(/^[0-9a-fA-F]{24}$/),
  usuarioId: Joi.string()
    .required()
    .regex(/^[0-9a-fA-F]{24}$/),
  items: Joi.array()
    .required()
    .min(1)
    .items(
      Joi.object({
        productoId: Joi.string()
          .required()
          .regex(/^[0-9a-fA-F]{24}$/),
        cantidad: Joi.number().required().positive().integer(),
        precioUnitario: Joi.number().required().positive().precision(2),
        costoUnitario: Joi.number().required().positive().precision(2),
      }).unknown(false)
    ),
  descuento: Joi.number().optional().min(0).precision(2).default(0),
  metodoPago: Joi.string()
    .required()
    .valid('fiado', 'efectivo', 'transferencia'),
  referenciaPago: Joi.string().optional().max(100),
  observaciones: Joi.string().optional().max(500),
}).unknown(false);

// =====================
// ABONOS (sin cambios)
// =====================

export const esquemaCrearAbono = Joi.object({
  clienteId: Joi.string()
    .required()
    .regex(/^[0-9a-fA-F]{24}$/),
  monto: Joi.number().required().positive().precision(2),
  metodoPago: Joi.string()
    .required()
    .valid('efectivo', 'transferencia', 'cheque'),
  referenciaPago: Joi.string().optional().max(100),
  observaciones: Joi.string().optional().max(500),
}).unknown(false);

// =====================
// PROVEEDORES (sin cambios)
// =====================

export const esquemaCrearProveedor = Joi.object({
  nombre: Joi.string().required().min(3).max(200),
  contacto: Joi.string().optional().min(2).max(100),
  email: Joi.string().optional().email(),
  telefono: Joi.string().optional().min(7).max(20),
  direccion: Joi.string().optional().max(200),
  nit: Joi.string()
    .required()
    .min(5)
    .max(20)
    .external(async (valor) => {
      const existe = await Proveedor.findOne({ nit: valor });
      if (existe) {
        throw new Error('El NIT del proveedor ya está registrado');
      }
    }),
  terminoPago: Joi.number().optional().min(1).max(180).integer().default(30),
}).unknown(false);

export const esquemaActualizarProveedor = Joi.object({
  nombre: Joi.string().optional().min(3).max(200),
  contacto: Joi.string().optional().min(2).max(100),
  email: Joi.string().optional().email(),
  telefono: Joi.string().optional().min(7).max(20),
  direccion: Joi.string().optional().max(200),
  terminoPago: Joi.number().optional().min(1).max(180).integer(),
  activo: Joi.boolean().optional(),
})
  .unknown(false)
  .min(1);

// =====================
// PAGOS A PROVEEDORES (sin cambios)
// =====================

export const esquemaCrearPagoProveedor = Joi.object({
  proveedorId: Joi.string()
    .required()
    .regex(/^[0-9a-fA-F]{24}$/),
  monto: Joi.number().required().positive().precision(2),
  metodoPago: Joi.string()
    .required()
    .valid('transferencia', 'efectivo', 'cheque'),
  referenciaPago: Joi.string().optional().max(100),
  observaciones: Joi.string().optional().max(500),
}).unknown(false);

// =====================
// EGRESOS
// =====================

// ✅ NUEVO: Esquema para crear egreso
export const esquemaCrearEgreso = Joi.object({
  concepto: Joi.string().required().min(3).max(200).trim(),
  descripcion: Joi.string().optional().max(500).trim(),
  monto: Joi.number().required().min(0),
  categoria: Joi.string()
    .required()
    .valid(...CATEGORIAS_EGRESO_VALORES), // ✅ Usar enum
  metodoPago: Joi.string()
    .required()
    .valid(...METODOS_PAGO_VALORES), // ✅ Usar enum
  referenciaPago: Joi.string().optional().trim(),
  beneficiario: Joi.string().optional().trim(),
  observaciones: Joi.string().optional().trim().allow(''),
  fechaEgreso: Joi.date()
    .optional()
    .default(() => new Date()),
});

// ✅ NUEVO: Esquema para actualizar egreso
export const esquemaActualizarEgreso = Joi.object({
  concepto: Joi.string().optional().min(3).max(200).trim(),
  descripcion: Joi.string().optional().max(500).trim(),
  monto: Joi.number().optional().min(0),
  categoria: Joi.string()
    .optional()
    .valid(...CATEGORIAS_EGRESO_VALORES), // ✅ Usar enum
  metodoPago: Joi.string()
    .optional()
    .valid(...METODOS_PAGO_VALORES), // ✅ Usar enum
  referenciaPago: Joi.string().optional().trim(),
  beneficiario: Joi.string().optional().trim(),
  observaciones: Joi.string().optional().trim().allow(''),
  aprobado: Joi.boolean().optional(),
  fechaEgreso: Joi.date().optional(),
});

// ✅ Cliente
export const esquemaCrearCliente = Joi.object({
  nombre: Joi.string().required().min(2).max(50).trim(),
  apellido: Joi.string().required().min(2).max(50).trim(),
  email: Joi.string().optional().email().lowercase().trim(),
  telefono: Joi.string().optional().trim(),
  identificacion: Joi.string().optional().trim(),
  direccion: Joi.string().optional().trim(),
});

export const esquemaActualizarCliente = Joi.object({
  nombre: Joi.string().optional().min(2).max(50).trim(),
  apellido: Joi.string().optional().min(2).max(50).trim(),
  email: Joi.string().optional().email().lowercase().trim(),
  telefono: Joi.string().optional().trim(),
  identificacion: Joi.string().optional().trim(),
  direccion: Joi.string().optional().trim(),
  activo: Joi.boolean().optional(),
});

// ✅ Proveedor
export const esquemaCrearProveedor = Joi.object({
  nombre: Joi.string().required().min(2).max(100).trim(),
  contacto: Joi.string().optional().trim(),
  email: Joi.string().optional().email().lowercase().trim(),
  telefono: Joi.string().optional().trim(),
  direccion: Joi.string().optional().trim(),
  nit: Joi.string().optional().trim(),
  terminoPago: Joi.number().optional().min(0).integer().default(30),
});

export const esquemaActualizarProveedor = Joi.object({
  nombre: Joi.string().optional().min(2).max(100).trim(),
  contacto: Joi.string().optional().trim(),
  email: Joi.string().optional().email().lowercase().trim(),
  telefono: Joi.string().optional().trim(),
  direccion: Joi.string().optional().trim(),
  nit: Joi.string().optional().trim(),
  terminoPago: Joi.number().optional().min(0).integer(),
  activo: Joi.boolean().optional(),
});

// ✅ Abono Cliente
export const esquemaCrearAbonoCliente = Joi.object({
  clienteId: Joi.string().required().hex().length(24),
  monto: Joi.number().required().min(0),
  metodoPago: Joi.string()
    .required()
    .valid(...METODOS_PAGO_VALORES), // ✅ Usar enum
  referenciaPago: Joi.string().optional().trim(),
  observaciones: Joi.string().optional().trim().allow(''),
  fechaPago: Joi.date()
    .optional()
    .default(() => new Date()),
});

// ✅ Pago Proveedor
export const esquemaCrearPagoProveedor = Joi.object({
  proveedorId: Joi.string().required().hex().length(24),
  monto: Joi.number().required().min(0),
  metodoPago: Joi.string()
    .required()
    .valid(...METODOS_PAGO_VALORES), // ✅ Usar enum
  referenciaPago: Joi.string().optional().trim(),
  observaciones: Joi.string().optional().trim().allow(''),
  comprobante: Joi.string().optional().trim(),
  fechaPago: Joi.date()
    .optional()
    .default(() => new Date()),
});
