import mongoose, { Schema, Document } from 'mongoose';

export interface IEgreso extends Document {
  numeroEgreso: string;
  concepto: string;
  descripcion?: string;
  monto: number;
  categoria:
    | 'servicios'
    | 'nomina'
    | 'insumos'
    | 'mantenimiento'
    | 'transporte'
    | 'otros';
  metodoPago: 'efectivo' | 'transferencia' | 'tarjeta';
  referenciaPago?: string;
  beneficiario?: string;
  usuarioId: mongoose.Types.ObjectId;
  nombreUsuario: string;
  fechaEgreso: Date;
  adjuntos?: string[];
  observaciones?: string;
  aprobado: boolean;
  aprobadoPor?: mongoose.Types.ObjectId;
  fechaAprobacion?: Date;
  fechaCreacion: Date;
  fechaActualizacion: Date;
}

const EgresoSchema: Schema = new Schema(
  {
    numeroEgreso: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      uppercase: true,
    },
    concepto: {
      type: String,
      required: true,
      trim: true,
    },
    descripcion: {
      type: String,
      trim: true,
    },
    monto: {
      type: Number,
      required: true,
      min: 0,
    },
    categoria: {
      type: String,
      required: true,
      enum: [
        'servicios',
        'nomina',
        'insumos',
        'mantenimiento',
        'transporte',
        'otros',
      ],
      default: 'otros',
    },
    metodoPago: {
      type: String,
      required: true,
      enum: ['efectivo', 'transferencia', 'tarjeta'],
      default: 'efectivo',
    },
    referenciaPago: {
      type: String,
      trim: true,
    },
    beneficiario: {
      type: String,
      trim: true,
    },
    usuarioId: {
      type: Schema.Types.ObjectId,
      ref: 'Usuario',
      required: true,
    },
    nombreUsuario: {
      type: String,
      required: true,
    },
    fechaEgreso: {
      type: Date,
      required: true,
      default: Date.now,
    },
    adjuntos: [
      {
        type: String,
        trim: true,
      },
    ],
    observaciones: {
      type: String,
      trim: true,
    },
    aprobado: {
      type: Boolean,
      default: false,
    },
    aprobadoPor: {
      type: Schema.Types.ObjectId,
      ref: 'Usuario',
    },
    fechaAprobacion: {
      type: Date,
    },
  },
  {
    timestamps: {
      createdAt: 'fechaCreacion',
      updatedAt: 'fechaActualizacion',
    },
  }
);

// Índices para búsquedas rápidas
EgresoSchema.index({ fechaEgreso: -1 });
EgresoSchema.index({ categoria: 1 });
EgresoSchema.index({ aprobado: 1 });
EgresoSchema.index({ usuarioId: 1 });

// ✅ CORRECCIÓN: Exportar como default y named
const Egreso = mongoose.model<IEgreso>('Egreso', EgresoSchema);
export default Egreso;
export { Egreso };
