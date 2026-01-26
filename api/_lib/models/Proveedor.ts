import { Schema, model, Document } from 'mongoose';
import { CategoriaProveedor } from '../enums/categorias-proveedor.enum.js';

export interface IProveedor extends Document {
  nombre: string;
  empresa?: string;
  contacto?: string;
  email?: string;
  telefono?: string;
  direccion?: string;
  nit?: string;
  categorias: CategoriaProveedor[];
  terminoPago: number;
  activo: boolean;
  saldoPendiente: number;
  productosCargados: number;
  fechaUltimoAbono?: Date;
  fechaCreacion: Date;
  fechaActualizacion: Date;
}

const ProveedorSchema = new Schema<IProveedor>(
  {
    nombre: {
      type: String,
      required: [true, 'El nombre es obligatorio'],
      trim: true,
      minlength: [3, 'El nombre debe tener al menos 3 caracteres'],
      maxlength: [100, 'El nombre no puede exceder 100 caracteres'],
    },
    empresa: {
      type: String,
      trim: true,
      maxlength: [100, 'La empresa no puede exceder 100 caracteres'],
    },
    contacto: {
      type: String,
      trim: true,
      maxlength: [100, 'El contacto no puede exceder 100 caracteres'],
    },
    email: {
      type: String,
      trim: true,
      lowercase: true,
      match: [/^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/, 'Email inválido'],
    },
    telefono: {
      type: String,
      trim: true,
      maxlength: [20, 'El teléfono no puede exceder 20 caracteres'],
    },
    direccion: {
      type: String,
      trim: true,
      maxlength: [255, 'La dirección no puede exceder 255 caracteres'],
    },
    nit: {
      type: String,
      trim: true,
      maxlength: [50, 'El NIT no puede exceder 50 caracteres'],
      // ✅ NO poner unique aquí, se define abajo con sparse: true
    },
    categorias: {
      type: [String],
      enum: Object.values(CategoriaProveedor),
      default: [CategoriaProveedor.OTROS],
      validate: {
        validator: function (v: CategoriaProveedor[]) {
          return v && v.length > 0;
        },
        message: 'Debe tener al menos una categoría',
      },
    },
    terminoPago: {
      type: Number,
      default: 30,
      min: [1, 'El término de pago debe ser al menos 1 día'],
      max: [365, 'El término de pago no puede exceder 365 días'],
    },
    activo: {
      type: Boolean,
      default: true,
      index: true,
    },
    saldoPendiente: {
      type: Number,
      default: 0,
      min: [0, 'El saldo no puede ser negativo'],
    },
    productosCargados: {
      type: Number,
      default: 0,
      min: [0, 'El número de productos no puede ser negativo'],
    },
    fechaUltimoAbono: {
      type: Date,
    },
    fechaCreacion: {
      type: Date,
      default: Date.now,
      immutable: true,
    },
    fechaActualizacion: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: {
      createdAt: 'fechaCreacion',
      updatedAt: 'fechaActualizacion',
    },
    collection: 'proveedores',
  },
);

// ✅ ÍNDICE ÚNICO SPARSE: Permite múltiples null, pero no duplicados de valores reales
ProveedorSchema.index(
  { nit: 1 },
  {
    unique: true,
    sparse: true, // ✅ CLAVE: Solo aplica unicidad a documentos con nit definido
    name: 'nit_unique_sparse',
  },
);

// Índices adicionales
ProveedorSchema.index({ nombre: 1 });
ProveedorSchema.index({ activo: 1, saldoPendiente: -1 });
ProveedorSchema.index({ categorias: 1 });

export const Proveedor = model<IProveedor>('Proveedor', ProveedorSchema);
