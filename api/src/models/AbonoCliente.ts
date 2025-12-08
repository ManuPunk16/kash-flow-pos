import { Schema, model, Document, Types } from "mongoose";

export interface IAbonoCliente extends Document {
  clienteId: Types.ObjectId;
  nombreCliente: string;
  usuarioId: Types.ObjectId;
  nombreUsuario: string;
  monto: number;
  metodoPago: "efectivo" | "transferencia" | "cheque";
  referenciaPago?: string;
  saldoAnterior: number;
  nuevoSaldo: number;
  observaciones: string;
  confirmado: boolean;
  fechaPago: Date;
  fechaCreacion: Date;
}

const abonoClienteSchema = new Schema<IAbonoCliente>(
  {
    clienteId: { type: Schema.Types.ObjectId, ref: "Cliente", required: true },
    nombreCliente: { type: String, required: true },
    usuarioId: { type: Schema.Types.ObjectId, ref: "Usuario", required: true },
    nombreUsuario: { type: String, required: true },
    monto: { type: Number, required: true, min: 0 },
    metodoPago: {
      type: String,
      enum: ["efectivo", "transferencia", "cheque"],
      required: true,
    },
    referenciaPago: { type: String },
    saldoAnterior: { type: Number, required: true, min: 0 },
    nuevoSaldo: { type: Number, required: true, min: 0 },
    observaciones: { type: String },
    confirmado: { type: Boolean, default: true },
    fechaPago: { type: Date, required: true },
    fechaCreacion: { type: Date, default: () => new Date() },
  },
  { timestamps: true }
);

// Índices
abonoClienteSchema.index({ clienteId: 1 });
abonoClienteSchema.index({ usuarioId: 1 });
abonoClienteSchema.index({ fechaPago: -1 });

export const AbonoCliente = model<IAbonoCliente>(
  "AbonoCliente",
  abonoClienteSchema
);
