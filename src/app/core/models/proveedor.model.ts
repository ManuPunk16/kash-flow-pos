import { CategoriaProveedor } from '@core/enums';

export interface Proveedor {
  _id: string;
  nombre: string;
  empresa?: string;
  contacto?: string;
  email?: string;
  telefono?: string;
  direccion?: string;
  nit?: string;
  categorias: CategoriaProveedor[];
  saldoPendiente: number;
  terminoPago: number;
  activo: boolean;
  productosCargados: number;
  fechaUltimoAbono: string | null;
  fechaCreacion: string;
  fechaActualizacion: string;
}

export interface CrearProveedorDTO {
  nombre: string;
  empresa?: string;
  contacto?: string;
  email?: string;
  telefono?: string;
  direccion?: string;
  nit?: string;
  categorias?: CategoriaProveedor[];
  terminoPago?: number;
}

export interface ActualizarProveedorDTO extends Partial<CrearProveedorDTO> {}
