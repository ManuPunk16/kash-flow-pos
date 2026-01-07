import { Producto } from './producto.model';

/**
 * Item en el carrito de compras (POS)
 * Esta interfaz es SOLO para el frontend
 */
export interface ItemCarrito {
  productoId: string;
  nombreProducto: string;
  cantidad: number;
  precioUnitario: number;
  costoUnitario: number;
  subtotal: number;
  ganancia: number; // ⚠️ FALTA en POS actual
  esConsignacion: boolean;
  proveedorId: string | null;
  stockDisponible: number;
  imagen?: string; // ⚠️ FALTA (útil para UI)
}

/**
 * Estado completo del carrito
 */
export interface EstadoCarrito {
  items: ItemCarrito[];
  subtotal: number;
  descuento: number;
  total: number;
  gananciaTotal: number;
  cantidadItems: number;
}

/**
 * Convertir Producto a ItemCarrito
 */
export function productoAItemCarrito(
  producto: Producto,
  cantidad: number = 1
): ItemCarrito {
  const precioUnitario = producto.precioVenta;
  const costoUnitario = producto.costoUnitario;
  const subtotal = precioUnitario * cantidad;
  const ganancia = (precioUnitario - costoUnitario) * cantidad;

  return {
    productoId: producto._id,
    nombreProducto: producto.nombre,
    cantidad,
    precioUnitario,
    costoUnitario,
    subtotal,
    ganancia,
    esConsignacion: producto.esConsignacion,
    proveedorId: producto.proveedorId ?? null,
    stockDisponible: producto.stock,
    imagen: producto.imagen,
  };
}