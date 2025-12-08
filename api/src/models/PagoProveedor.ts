import { Schema, model, Document, Types } from "mongoose";

export interface IPagoProveedor extends Document {
  proveedorId: Types.ObjectId;
  nombreProveedor: string;
  usuarioId: Types.ObjectId;
  nombreUsuario: string;
  monto: number;
  metodoPago: "transferencia" | "efectivo" | "cheque";
  referenciaPago?: string;
  saldoAnterior: number;
  nuevoSaldo: number;
  observaciones: string;
  comprobante?: string;
  estado: "pagado" | "pendiente";
  fechaPago: Date;
  fechaCreacion: Date;
}

const pagoProveedorSchema = new Schema<IPagoProveedor>(
  {
    proveedorId: {
      type: Schema.Types.ObjectId,
      ref: "Proveedor",
      required: true,
    },
    nombreProveedor: { type: String, required: true },
    usuarioId: { type: Schema.Types.ObjectId, ref: "Usuario", required: true },
    nombreUsuario: { type: String, required: true },
    monto: { type: Number, required: true, min: 0 },
    metodoPago: {
      type: String,
      enum: ["transferencia", "efectivo", "cheque"],
      required: true,
    },
    referenciaPago: { type: String },
    saldoAnterior: { type: Number, required: true, min: 0 },
    nuevoSaldo: { type: Number, required: true, min: 0 },
    observaciones: { type: String },
    comprobante: { type: String },
    estado: { type: String, enum: ["pagado", "pendiente"], default: "pagado" },
    fechaPago: { type: Date, required: true },
    fechaCreacion: { type: Date, default: () => new Date() },
  },
  { timestamps: true }
);

// Índices
pagoProveedorSchema.index({ proveedorId: 1 });
pagoProveedorSchema.index({ usuarioId: 1 });
pagoProveedorSchema.index({ fechaPago: -1 });
pagoProveedorSchema.index({ estado: 1 });

export const PagoProveedor = model<IPagoProveedor>(
  "PagoProveedor",
  pagoProveedorSchema
);
