import { Schema, model, Document, Types } from "mongoose";

export interface IItemVenta {
  productoId: Types.ObjectId;
  nombreProducto: string;
  cantidad: number;
  precioUnitario: number;
  costoUnitario: number;
  subtotal: number;
  ganancia: number;
  esConsignacion: boolean;
}

export interface IVenta extends Document {
  numeroVenta: string;
  clienteId: Types.ObjectId;
  nombreCliente: string;
  usuarioId: Types.ObjectId;
  nombreUsuario: string;
  items: IItemVenta[];
  subtotal: number;
  descuento: number;
  total: number;
  metodoPago: "fiado" | "efectivo" | "transferencia";
  referenciaPago?: string;
  saldoClienteAntes?: number;
  saldoClienteDespues?: number;
  gananciaTotal: number;
  observaciones: string;
  estado: "completada" | "anulada";
  fechaVenta: Date;
  fechaCreacion: Date;
}

const itemVentaSchema = new Schema<IItemVenta>(
  {
    productoId: {
      type: Schema.Types.ObjectId,
      ref: "Producto",
      required: true,
    },
    nombreProducto: { type: String, required: true },
    cantidad: { type: Number, required: true, min: 1 },
    precioUnitario: { type: Number, required: true, min: 0 },
    costoUnitario: { type: Number, required: true, min: 0 },
    subtotal: { type: Number, required: true, min: 0 },
    ganancia: { type: Number, required: true, min: 0 },
    esConsignacion: { type: Boolean, default: false },
  },
  { _id: false }
);

const ventaSchema = new Schema<IVenta>(
  {
    numeroVenta: { type: String, required: true, unique: true },
    clienteId: { type: Schema.Types.ObjectId, ref: "Cliente", required: true },
    nombreCliente: { type: String, required: true },
    usuarioId: { type: Schema.Types.ObjectId, ref: "Usuario", required: true },
    nombreUsuario: { type: String, required: true },
    items: { type: [itemVentaSchema], required: true },
    subtotal: { type: Number, required: true, min: 0 },
    descuento: { type: Number, default: 0, min: 0 },
    total: { type: Number, required: true, min: 0 },
    metodoPago: {
      type: String,
      enum: ["fiado", "efectivo", "transferencia"],
      required: true,
    },
    referenciaPago: { type: String },
    saldoClienteAntes: { type: Number },
    saldoClienteDespues: { type: Number },
    gananciaTotal: { type: Number, required: true, min: 0 },
    observaciones: { type: String },
    estado: {
      type: String,
      enum: ["completada", "anulada"],
      default: "completada",
    },
    fechaVenta: { type: Date, required: true },
    fechaCreacion: { type: Date, default: () => new Date() },
  },
  { timestamps: true }
);

ventaSchema.index({ clienteId: 1 });
ventaSchema.index({ usuarioId: 1 });
ventaSchema.index({ fechaVenta: -1 });
ventaSchema.index({ metodoPago: 1 });

export const Venta = model<IVenta>("Venta", ventaSchema);
