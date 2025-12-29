import { Schema, model, Document } from 'mongoose';

export interface IProveedor extends Document {
  nombre: string;
  contacto: string;
  email: string;
  telefono: string;
  direccion: string;
  nit: string;
  saldoPendiente: number;
  terminoPago: number;
  activo: boolean;
  productosCargados: number;
  fechaUltimoAbono: Date | null;
  fechaCreacion: Date;
  fechaActualizacion: Date;
}

const proveedorSchema = new Schema<IProveedor>(
  {
    nombre: { type: String, required: true },
    contacto: { type: String },
    email: { type: String, lowercase: true },
    telefono: { type: String },
    direccion: { type: String },
    nit: { type: String, unique: true, sparse: true },
    saldoPendiente: { type: Number, default: 0, min: 0 },
    terminoPago: { type: Number, default: 30 },
    activo: { type: Boolean, default: true },
    productosCargados: { type: Number, default: 0 },
    fechaUltimoAbono: { type: Date, default: null },
    fechaCreacion: { type: Date, default: () => new Date() },
    fechaActualizacion: { type: Date, default: () => new Date() },
  },
  {
    timestamps: true,
    collection: 'proveedores',
  }
);

proveedorSchema.index({ nombre: 1 });
proveedorSchema.index({ activo: 1 });
proveedorSchema.index({ nit: 1 }, { unique: true, sparse: true });

// ✅ VIRTUAL: Calcular productos en tiempo real
proveedorSchema.virtual('productosActivos', {
  ref: 'Producto',
  localField: '_id',
  foreignField: 'proveedorId',
  count: true,
  match: { activo: true },
});

export const Proveedor = model<IProveedor>('Proveedor', proveedorSchema);
