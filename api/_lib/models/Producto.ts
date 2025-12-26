import { Schema, model, Document, Types } from 'mongoose';
import {
  CategoriaProducto,
  CATEGORIAS_PRODUCTO_VALORES,
} from '../enums/index.js';

export interface IProducto extends Document {
  nombre: string;
  codigoBarras?: string;
  descripcion: string;
  precioVenta: number;
  costoUnitario: number;
  stock: number;
  stockMinimo: number;
  esConsignacion: boolean;
  proveedorId: Types.ObjectId | null;
  categoria: CategoriaProducto;
  activo: boolean;
  imagen: string;
  pendienteCompletarDatos?: boolean;
  fechaCreacion: Date;
  fechaActualizacion: Date;
}

const productoSchema = new Schema<IProducto>(
  {
    nombre: { type: String, required: true, trim: true },
    codigoBarras: {
      type: String,
      unique: true,
      sparse: true,
      trim: true,
      uppercase: true,
    },
    descripcion: { type: String, required: true, trim: true },
    precioVenta: { type: Number, required: true, min: 0 },
    costoUnitario: { type: Number, required: true, min: 0 },
    stock: { type: Number, required: true, default: 0, min: 0 },
    stockMinimo: { type: Number, default: 5, min: 0 },
    esConsignacion: { type: Boolean, default: false },
    proveedorId: {
      type: Schema.Types.ObjectId,
      ref: 'Proveedor',
      default: null,
    },
    categoria: {
      type: String,
      required: true,
      enum: CATEGORIAS_PRODUCTO_VALORES, // ✅ Validación con enum
      lowercase: true,
    },
    activo: { type: Boolean, default: true },
    imagen: { type: String, default: null },
    pendienteCompletarDatos: { type: Boolean, default: false },
    fechaCreacion: { type: Date, default: () => new Date() },
    fechaActualizacion: { type: Date, default: () => new Date() },
  },
  {
    timestamps: true,
    collection: 'productos',
  }
);

// Índices
productoSchema.index({ codigoBarras: 1 });
productoSchema.index({ nombre: 'text', descripcion: 'text' });
productoSchema.index({ categoria: 1 });
productoSchema.index({ activo: 1 });
productoSchema.index({ proveedorId: 1 });

export const Producto = model<IProducto>('Producto', productoSchema);
