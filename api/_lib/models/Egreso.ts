import mongoose, { Schema, Document } from 'mongoose';
import {
  CategoriaEgreso,
  CATEGORIAS_EGRESO_VALORES,
  MetodoPago,
  METODOS_PAGO_VALORES,
} from '../enums/index.js';

export interface IEgreso extends Document {
  numeroEgreso: string;
  concepto: string;
  descripcion?: string;
  monto: number;
  categoria: CategoriaEgreso; // ✅ Usar enum
  metodoPago: MetodoPago; // ✅ Usar enum
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
    concepto: { type: String, required: true, trim: true },
    descripcion: { type: String, trim: true },
    monto: { type: Number, required: true, min: 0 },
    categoria: {
      type: String,
      required: true,
      enum: CATEGORIAS_EGRESO_VALORES,
      default: CategoriaEgreso.OTROS,
    },
    metodoPago: {
      type: String,
      required: true,
      enum: METODOS_PAGO_VALORES,
      default: MetodoPago.EFECTIVO,
    },
    referenciaPago: { type: String, trim: true },
    beneficiario: { type: String, trim: true },
    usuarioId: {
      type: Schema.Types.ObjectId,
      ref: 'Usuario',
      required: true,
    },
    nombreUsuario: { type: String, required: true },
    fechaEgreso: { type: Date, required: true, default: Date.now },
    adjuntos: [{ type: String, trim: true }],
    observaciones: { type: String, trim: true },
    aprobado: { type: Boolean, default: false },
    aprobadoPor: { type: Schema.Types.ObjectId, ref: 'Usuario' },
    fechaAprobacion: { type: Date },
  },
  {
    timestamps: {
      createdAt: 'fechaCreacion',
      updatedAt: 'fechaActualizacion',
    },
  }
);

EgresoSchema.index({ categoria: 1 });
EgresoSchema.index({ fechaEgreso: -1 });

const Egreso = mongoose.model<IEgreso>('Egreso', EgresoSchema);
export default Egreso;
export { Egreso };
