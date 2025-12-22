import { Schema, model, Document } from 'mongoose';

export interface IPermisos {
  verVentas: boolean;
  crearVentas: boolean;
  gestionarClientes: boolean;
  gestionarProductos: boolean;
  aplicarIntereses: boolean;
  verReportes: boolean;
}

export interface IUsuario extends Document {
  email: string;
  firebaseUid: string;
  nombre: string;
  apellido: string;
  rol: 'admin' | 'gerente' | 'vendedor';
  activo: boolean;
  permisos: IPermisos;
  fechaCreacion: Date;
  fechaUltimaLogin: Date;
}

const permisoSchema = new Schema<IPermisos>(
  {
    verVentas: { type: Boolean, default: true },
    crearVentas: { type: Boolean, default: true },
    gestionarClientes: { type: Boolean, default: true },
    gestionarProductos: { type: Boolean, default: true },
    aplicarIntereses: { type: Boolean, default: true },
    verReportes: { type: Boolean, default: true },
  },
  { _id: false }
);

const usuarioSchema = new Schema<IUsuario>(
  {
    email: { type: String, required: true, unique: true, lowercase: true },
    firebaseUid: { type: String, required: true, unique: true },
    nombre: { type: String, required: true },
    apellido: { type: String, required: true },
    rol: {
      type: String,
      enum: ['admin', 'gerente', 'vendedor'],
      default: 'vendedor',
    },
    activo: { type: Boolean, default: true },
    permisos: { type: permisoSchema, required: true },
    fechaCreacion: { type: Date, default: () => new Date() },
    fechaUltimaLogin: { type: Date, default: () => new Date() },
  },
  {
    timestamps: true,
    collection: 'usuarios',
  }
);

export const Usuario = model<IUsuario>('Usuario', usuarioSchema);
