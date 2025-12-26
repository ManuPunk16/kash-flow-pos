export interface Proveedor {
  _id: string;
  nombre: string;
  contacto?: string;
  email?: string;
  telefono?: string;
  direccion?: string;
  nit?: string;
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
  contacto?: string;
  email?: string;
  telefono?: string;
  direccion?: string;
  nit?: string;
  terminoPago?: number;
}

export interface ActualizarProveedorDTO extends Partial<CrearProveedorDTO> {}
