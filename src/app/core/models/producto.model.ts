export interface Producto {
  _id: string;
  nombre: string;
  codigoBarras?: string;
  descripcion: string;
  precioVenta: number;
  costoUnitario: number;
  stock: number;
  stockMinimo: number;
  esConsignacion: boolean;
  proveedorId: string | null;
  categoria: string;
  activo: boolean;
  imagen?: string;
  pendienteCompletarDatos?: boolean;
  fechaCreacion: string;
  fechaActualizacion: string;
}
