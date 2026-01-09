import Joi from 'joi';
import {
  CATEGORIAS_PRODUCTO_VALORES,
  METODOS_PAGO_VALORES,
  CATEGORIAS_EGRESO_VALORES,
} from '../enums/index.js';
import { Cliente } from '../models/Cliente.js'; // ✅ Importar modelo
import { Proveedor } from '../models/Proveedor.js'; // ✅ Importar modelo

// ========================================
// ✅ PRODUCTOS
// ========================================

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
    .valid(...CATEGORIAS_PRODUCTO_VALORES),
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
    .valid(...CATEGORIAS_PRODUCTO_VALORES),
  activo: Joi.boolean().optional(),
  imagen: Joi.string().optional().allow(null),
});

export const esquemaRegistroRapidoProducto = Joi.object({
  codigoBarras: Joi.string().required().trim().uppercase(),
  cantidad: Joi.number().optional().min(1).integer().default(1),
});

// ========================================
// ✅ CLIENTES
// ========================================

export const esquemaCrearCliente = Joi.object({
  nombre: Joi.string().required().min(2).max(50).trim(),
  apellido: Joi.string().required().min(2).max(50).trim(),
  email: Joi.string().optional().email().lowercase().trim(),
  telefono: Joi.string().optional().trim(),
  identificacion: Joi.string()
    .optional()
    .trim()
    .external(async (valor: string) => {
      if (!valor) return valor;

      const existente = await Cliente.findOne({ identificacion: valor });
      if (existente) {
        throw new Error('Ya existe un cliente con esta identificación');
      }
      return valor;
    }),
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

// ========================================
// ✅ VENTAS
// ========================================

export const esquemaCrearVenta = Joi.object({
  clienteId: Joi.string().required().hex().length(24),
  items: Joi.array()
    .required()
    .min(1)
    .items(
      Joi.object({
        productoId: Joi.string().required().hex().length(24),
        nombreProducto: Joi.string().required(),
        cantidad: Joi.number().required().min(1).integer(),
        precioUnitario: Joi.number().required().min(0),
        costoUnitario: Joi.number().required().min(0),
        subtotal: Joi.number().required().min(0),
        ganancia: Joi.number().required().min(0),
        esConsignacion: Joi.boolean().default(false),
      })
    ),
  metodoPago: Joi.string()
    .required()
    .valid(...METODOS_PAGO_VALORES),
  referenciaPago: Joi.string().optional().trim(),
  descuento: Joi.number().optional().min(0).default(0),
  observaciones: Joi.string().optional().trim().allow(''),
});

// ========================================
// ✅ ABONOS
// ========================================

export const esquemaCrearAbono = Joi.object({
  clienteId: Joi.string().required().hex().length(24),
  monto: Joi.number().required().min(0),
  metodoPago: Joi.string()
    .required()
    .valid(...METODOS_PAGO_VALORES),
  referenciaPago: Joi.string().optional().trim(),
  observaciones: Joi.string().optional().trim().allow(''),
  fechaPago: Joi.date()
    .optional()
    .default(() => new Date()),
});

// ========================================
// ✅ PROVEEDORES
// ========================================

export const esquemaCrearProveedor = Joi.object({
  nombre: Joi.string().required().min(2).max(100).trim(),
  empresa: Joi.string().optional(),
  contacto: Joi.string().optional().trim(),
  email: Joi.string().optional().email().lowercase().trim(),
  telefono: Joi.string().optional().trim(),
  direccion: Joi.string().optional().trim(),
  nit: Joi.string()
    .optional()
    .trim()
    .external(async (valor: string) => {
      if (!valor) return valor;

      const existente = await Proveedor.findOne({ nit: valor });
      if (existente) {
        throw new Error('Ya existe un proveedor con este NIT');
      }
      return valor;
    }),
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

// ========================================
// ✅ PAGOS A PROVEEDORES
// ========================================

export const esquemaCrearPagoProveedor = Joi.object({
  proveedorId: Joi.string().required().hex().length(24),
  monto: Joi.number().required().min(0),
  metodoPago: Joi.string()
    .required()
    .valid(...METODOS_PAGO_VALORES),
  referenciaPago: Joi.string().optional().trim(),
  observaciones: Joi.string().optional().trim().allow(''),
  comprobante: Joi.string().optional().trim(),
  fechaPago: Joi.date()
    .optional()
    .default(() => new Date()),
});

// ========================================
// ✅ EGRESOS
// ========================================

export const esquemaCrearEgreso = Joi.object({
  concepto: Joi.string().required().min(3).max(200).trim(),
  descripcion: Joi.string().optional().max(500).trim(),
  monto: Joi.number().required().min(0),
  categoria: Joi.string()
    .required()
    .valid(...CATEGORIAS_EGRESO_VALORES),
  metodoPago: Joi.string()
    .required()
    .valid(...METODOS_PAGO_VALORES),
  referenciaPago: Joi.string().optional().trim(),
  beneficiario: Joi.string().optional().trim(),
  observaciones: Joi.string().optional().trim().allow(''),
  fechaEgreso: Joi.date()
    .optional()
    .default(() => new Date()),
});

export const esquemaActualizarEgreso = Joi.object({
  concepto: Joi.string().optional().min(3).max(200).trim(),
  descripcion: Joi.string().optional().max(500).trim(),
  monto: Joi.number().optional().min(0),
  categoria: Joi.string()
    .optional()
    .valid(...CATEGORIAS_EGRESO_VALORES),
  metodoPago: Joi.string()
    .optional()
    .valid(...METODOS_PAGO_VALORES),
  referenciaPago: Joi.string().optional().trim(),
  beneficiario: Joi.string().optional().trim(),
  observaciones: Joi.string().optional().trim().allow(''),
  aprobado: Joi.boolean().optional(),
  fechaEgreso: Joi.date().optional(),
});
