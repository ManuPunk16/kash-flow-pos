import Joi from 'joi';
import { Cliente, Producto, Proveedor } from '../models/index.js';

/**
 * Esquemas de validación para todas las entidades
 */

// =====================
// PRODUCTOS
// =====================

export const esquemaCrearProducto = Joi.object({
  codigoBarras: Joi.string() // ✅ CAMBIO: codigo → codigoBarras
    .optional()
    .min(3)
    .max(50)
    .external(async (valor) => {
      const existe = await Producto.findOne({ codigoBarras: valor });
      if (existe) {
        throw new Error('El código de barras ya existe');
      }
    }),
  nombre: Joi.string().required().min(3).max(200),
  descripcion: Joi.string().optional().max(500),
  precioVenta: Joi.number().required().positive().precision(2),
  costoUnitario: Joi.number().required().positive().precision(2),
  stock: Joi.number().required().min(0).integer(),
  stockMinimo: Joi.number().optional().min(0).integer().default(5),
  esConsignacion: Joi.boolean().optional().default(false),
  proveedorId: Joi.string()
    .optional()
    .regex(/^[0-9a-fA-F]{24}$/),
  categoria: Joi.string().required().min(2).max(100),
  imagen: Joi.string().optional().uri(),
}).unknown(false);

export const esquemaActualizarProducto = Joi.object({
  codigoBarras: Joi.string().optional().min(3).max(50), // ✅ CAMBIO
  nombre: Joi.string().optional().min(3).max(200),
  descripcion: Joi.string().optional().max(500),
  precioVenta: Joi.number().optional().positive().precision(2),
  costoUnitario: Joi.number().optional().positive().precision(2),
  stock: Joi.number().optional().min(0).integer(),
  stockMinimo: Joi.number().optional().min(0).integer(),
  esConsignacion: Joi.boolean().optional(),
  proveedorId: Joi.string()
    .optional()
    .regex(/^[0-9a-fA-F]{24}$/),
  categoria: Joi.string().optional().min(2).max(100),
  imagen: Joi.string().optional().uri(),
  activo: Joi.boolean().optional(),
})
  .unknown(false)
  .min(1);

// ✅ NUEVO: Esquema para registro rápido
export const esquemaRegistroRapidoProducto = Joi.object({
  codigoBarras: Joi.string().required().min(3).max(50),
  cantidad: Joi.number().optional().min(1).integer().default(1),
}).unknown(false);

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
  concepto: Joi.string().required().trim().min(3).max(200).messages({
    'string.empty': 'El concepto es obligatorio',
    'string.min': 'El concepto debe tener al menos 3 caracteres',
  }),
  descripcion: Joi.string().trim().allow('').max(500),
  monto: Joi.number().required().min(1).messages({
    'number.base': 'El monto debe ser un número',
    'number.min': 'El monto debe ser mayor a 0',
  }),
  categoria: Joi.string()
    .required()
    .valid(
      'servicios',
      'nomina',
      'insumos',
      'mantenimiento',
      'transporte',
      'otros'
    )
    .messages({
      'any.only': 'Categoría inválida',
    }),
  metodoPago: Joi.string()
    .required()
    .valid('efectivo', 'transferencia', 'tarjeta')
    .messages({
      'any.only': 'Método de pago inválido',
    }),
  referenciaPago: Joi.string().trim().allow('').max(100),
  beneficiario: Joi.string().trim().allow('').max(200),
  observaciones: Joi.string().trim().allow('').max(500),
  fechaEgreso: Joi.date().iso().optional(),
});

// ✅ NUEVO: Esquema para actualizar egreso
export const esquemaActualizarEgreso = Joi.object({
  concepto: Joi.string().trim().min(3).max(200),
  descripcion: Joi.string().trim().allow('').max(500),
  monto: Joi.number().min(1),
  categoria: Joi.string().valid(
    'servicios',
    'nomina',
    'insumos',
    'mantenimiento',
    'transporte',
    'otros'
  ),
  metodoPago: Joi.string().valid('efectivo', 'transferencia', 'tarjeta'),
  referenciaPago: Joi.string().trim().allow('').max(100),
  beneficiario: Joi.string().trim().allow('').max(200),
  observaciones: Joi.string().trim().allow('').max(500),
  aprobado: Joi.boolean(),
}).min(1);
