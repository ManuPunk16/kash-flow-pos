import { Schema, model, Document, Types } from 'mongoose';

export interface IProducto extends Document {
  codigo: string;
  nombre: string;
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
  fechaCreacion: Date;
  fechaActualizacion: Date;
}

const productoSchema = new Schema<IProducto>(
  {
    codigo: { type: String, required: true, unique: true },
    nombre: { type: String, required: true },
    descripcion: { type: String },
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
    fechaCreacion: { type: Date, default: () => new Date() },
    fechaActualizacion: { type: Date, default: () => new Date() },
  },
  {
    timestamps: true,
    collection: 'productos',
  }
);

productoSchema.index({ nombre: 1 });
productoSchema.index({ categoria: 1 });
productoSchema.index({ esConsignacion: 1 });
productoSchema.index({ stock: 1 });

export const Producto = model<IProducto>('Producto', productoSchema);
