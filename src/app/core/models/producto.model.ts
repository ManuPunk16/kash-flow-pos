import { Proveedor } from './proveedor.model';

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
  proveedorId?: string;
  proveedor?: Proveedor; // ✅ NUEVO: Información completa del proveedor (populated)
  categoria: CategoriaProducto;
  activo: boolean;
  imagen?: string;
  pendienteCompletarDatos?: boolean;
  fechaCreacion: string;
  fechaActualizacion: string;
}

export type CategoriaProducto =
  | 'bebidas'
  | 'lacteos'
  | 'panaderia'
  | 'carnes'
  | 'frutas-verduras'
  | 'abarrotes'
  | 'limpieza'
  | 'higiene-personal'
  | 'otros';

export interface FiltrosInventario {
  busqueda?: string;
  categoria?: CategoriaProducto | 'todas';
  stockBajo?: boolean;
  consignacion?: boolean;
  activos?: boolean;
  proveedorId?: string;
}

export interface CrearProductoDTO {
  nombre: string;
  codigoBarras?: string;
  descripcion: string;
  precioVenta: number;
  costoUnitario: number;
  stock: number;
  stockMinimo: number;
  esConsignacion: boolean;
  proveedorId?: string;
  categoria: CategoriaProducto;
  imagen?: string;
}

export interface ActualizarProductoDTO extends Partial<CrearProductoDTO> {}

export interface RespuestaListaProductos {
  productos: Producto[];
  total: number;
  pagina: number;
  limite: number;
}

// ✅ NUEVO: Configuración para generación de códigos de barras
export interface ConfiguracionCodigoBarras {
  prefijo: string; // Ej: 'KASH'
  longitudNumero: number; // Ej: 8
  incluirChecksum: boolean;
}
