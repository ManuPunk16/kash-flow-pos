import { Proveedor } from './proveedor.model';
import { CategoriaProducto } from '@core/enums'; // ✅ IMPORTAR DESDE ENUM

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
  proveedor?: Proveedor;
  categoria: CategoriaProducto; // ✅ USA EL ENUM IMPORTADO
  activo: boolean;
  imagen?: string;
  pendienteCompletarDatos?: boolean;
  fechaCreacion: string;
  fechaActualizacion: string;
}

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
  categoria: CategoriaProducto; // ✅ USA EL ENUM
  imagen?: string;
}

export interface ActualizarProductoDTO extends Partial<CrearProductoDTO> {}

export interface RespuestaListaProductos {
  productos: Producto[];
  total: number;
  pagina: number;
  limite: number;
}

export interface ConfiguracionCodigoBarras {
  prefijo: string;
  longitudNumero: number;
  incluirChecksum: boolean;
}
