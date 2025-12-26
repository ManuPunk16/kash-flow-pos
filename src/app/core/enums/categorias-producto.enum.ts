/**
 * Categorías de productos - Sincronizado con backend
 */
export enum CategoriaProducto {
  BEBIDAS = 'bebidas',
  LACTEOS = 'lacteos',
  PANADERIA = 'panaderia',
  CARNES = 'carnes',
  FRUTAS_VERDURAS = 'frutas-verduras',
  ABARROTES = 'abarrotes',
  LIMPIEZA = 'limpieza',
  HIGIENE_PERSONAL = 'higiene-personal',
  OTROS = 'otros',
}

/**
 * Type-safe array de valores
 */
export const CATEGORIAS_PRODUCTO_LISTA: readonly CategoriaProducto[] =
  Object.values(CategoriaProducto);

/**
 * Metadata para UI
 */
export interface CategoriaProductoInfo {
  valor: CategoriaProducto;
  etiqueta: string;
  emoji: string;
  descripcion: string;
}

export const CATEGORIAS_PRODUCTO_CATALOGO: readonly CategoriaProductoInfo[] = [
  {
    valor: CategoriaProducto.BEBIDAS,
    etiqueta: 'Bebidas',
    emoji: '🥤',
    descripcion: 'Refrescos, jugos, agua',
  },
  {
    valor: CategoriaProducto.LACTEOS,
    etiqueta: 'Lácteos',
    emoji: '🥛',
    descripcion: 'Leche, queso, yogurt',
  },
  {
    valor: CategoriaProducto.PANADERIA,
    etiqueta: 'Panadería',
    emoji: '🍞',
    descripcion: 'Pan, pasteles, galletas',
  },
  {
    valor: CategoriaProducto.CARNES,
    etiqueta: 'Carnes',
    emoji: '🥩',
    descripcion: 'Res, cerdo, pollo, pescado',
  },
  {
    valor: CategoriaProducto.FRUTAS_VERDURAS,
    etiqueta: 'Frutas y Verduras',
    emoji: '🍎',
    descripcion: 'Productos frescos',
  },
  {
    valor: CategoriaProducto.ABARROTES,
    etiqueta: 'Abarrotes',
    emoji: '🛒',
    descripcion: 'Granos, pastas, enlatados',
  },
  {
    valor: CategoriaProducto.LIMPIEZA,
    etiqueta: 'Limpieza',
    emoji: '🧹',
    descripcion: 'Detergentes, desinfectantes',
  },
  {
    valor: CategoriaProducto.HIGIENE_PERSONAL,
    etiqueta: 'Higiene Personal',
    emoji: '🧴',
    descripcion: 'Shampoo, jabón, cuidado personal',
  },
  {
    valor: CategoriaProducto.OTROS,
    etiqueta: 'Otros',
    emoji: '📦',
    descripcion: 'Otros productos',
  },
] as const;

/**
 * Obtener metadata de categoría
 */
export function obtenerInfoCategoria(
  categoria: CategoriaProducto
): CategoriaProductoInfo | undefined {
  return CATEGORIAS_PRODUCTO_CATALOGO.find((c) => c.valor === categoria);
}

/**
 * Validar categoría
 */
export function esCategoriaValida(
  categoria: string
): categoria is CategoriaProducto {
  return CATEGORIAS_PRODUCTO_LISTA.includes(categoria as CategoriaProducto);
}
