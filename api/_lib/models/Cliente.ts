import { Schema, model, Document } from 'mongoose';

export interface IHistoricoInteres {
  fecha: Date;
  montoAplicado: number;
  nuevoSaldo: number;
  descripcion: string;
}

export interface ICliente extends Document {
  nombre: string;
  apellido: string;
  email: string;
  telefono: string;
  identificacion: string;
  direccion: string;
  saldoActual: number;
  saldoHistorico: number;
  esMoroso: boolean;
  diasSinPagar: number;
  ultimaCompra: Date | null;
  fechaUltimoCorteInteres: Date | null;
  historicoIntereses: IHistoricoInteres[];
  activo: boolean;
  fechaCreacion: Date;
  fechaActualizacion: Date;
}

const historicoInteresSchema = new Schema<IHistoricoInteres>(
  {
    fecha: { type: Date, required: true },
    montoAplicado: { type: Number, required: true, min: 0 },
    nuevoSaldo: { type: Number, required: true, min: 0 },
    descripcion: { type: String },
  },
  { _id: false }
);

const clienteSchema = new Schema<ICliente>(
  {
    nombre: { type: String, required: true },
    apellido: { type: String, required: true },
    email: { type: String, lowercase: true },
    telefono: { type: String },
    identificacion: { type: String, unique: true },
    direccion: { type: String },
    saldoActual: { type: Number, default: 0, min: 0 },
    saldoHistorico: { type: Number, default: 0, min: 0 },
    esMoroso: { type: Boolean, default: false },
    diasSinPagar: { type: Number, default: 0 },
    ultimaCompra: { type: Date, default: null },
    fechaUltimoCorteInteres: { type: Date, default: null },
    historicoIntereses: { type: [historicoInteresSchema], default: [] },
    activo: { type: Boolean, default: true },
    fechaCreacion: { type: Date, default: () => new Date() },
    fechaActualizacion: { type: Date, default: () => new Date() },
  },
  {
    timestamps: true,
    collection: 'clientes',
  }
);

clienteSchema.index({ nombre: 1 });
clienteSchema.index({ esMoroso: 1 });
clienteSchema.index({ saldoActual: 1 });

export const Cliente = model<ICliente>('Cliente', clienteSchema);
