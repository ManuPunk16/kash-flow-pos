import { Schema, model, Document, Types } from 'mongoose';

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
  categoria: string;
  activo: boolean;
  imagen: string;
  pendienteCompletarDatos?: boolean; // ✅ NUEVO campo
  fechaCreacion: Date;
  fechaActualizacion: Date;
}

const productoSchema = new Schema<IProducto>(
  {
    nombre: { type: String, required: true },
    codigoBarras: {
      type: String,
      unique: true,
      sparse: true,
      trim: true,
    },
    descripcion: { type: String, required: true },
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
    categoria: { type: String, required: true },
    activo: { type: Boolean, default: true },
    imagen: { type: String, default: null },
    pendienteCompletarDatos: { type: Boolean, default: false }, // ✅ NUEVO
    fechaCreacion: { type: Date, default: () => new Date() },
    fechaActualizacion: { type: Date, default: () => new Date() },
  },
  {
    timestamps: true,
    collection: 'productos',
  }
);

// ✅ Índices
productoSchema.index({ codigoBarras: 1 });
productoSchema.index({ nombre: 'text', descripcion: 'text' });
productoSchema.index({ nombre: 1 });
productoSchema.index({ categoria: 1 });
productoSchema.index({ esConsignacion: 1 });
productoSchema.index({ stock: 1 });
productoSchema.index({ activo: 1 });
productoSchema.index({ pendienteCompletarDatos: 1 }); // ✅ NUEVO índice

export const Producto = model<IProducto>('Producto', productoSchema);
