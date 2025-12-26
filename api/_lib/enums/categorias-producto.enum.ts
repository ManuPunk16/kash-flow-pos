/**
 * Categorías de productos disponibles en el sistema
 * Sincronizado con frontend
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
 * Array de valores válidos para validación
 */
export const CATEGORIAS_PRODUCTO_VALORES = Object.values(CategoriaProducto);

/**
 * Metadata para visualización
 */
export const CATEGORIAS_PRODUCTO_METADATA: Record<
  CategoriaProducto,
  {
    etiqueta: string;
    emoji: string;
    descripcion: string;
  }
> = {
  [CategoriaProducto.BEBIDAS]: {
    etiqueta: 'Bebidas',
    emoji: '🥤',
    descripcion: 'Refrescos, jugos, agua, etc.',
  },
  [CategoriaProducto.LACTEOS]: {
    etiqueta: 'Lácteos',
    emoji: '🥛',
    descripcion: 'Leche, queso, yogurt, mantequilla',
  },
  [CategoriaProducto.PANADERIA]: {
    etiqueta: 'Panadería',
    emoji: '🍞',
    descripcion: 'Pan, pasteles, galletas',
  },
  [CategoriaProducto.CARNES]: {
    etiqueta: 'Carnes',
    emoji: '🥩',
    descripcion: 'Res, cerdo, pollo, pescado',
  },
  [CategoriaProducto.FRUTAS_VERDURAS]: {
    etiqueta: 'Frutas y Verduras',
    emoji: '🍎',
    descripcion: 'Productos frescos del campo',
  },
  [CategoriaProducto.ABARROTES]: {
    etiqueta: 'Abarrotes',
    emoji: '🛒',
    descripcion: 'Granos, pastas, enlatados',
  },
  [CategoriaProducto.LIMPIEZA]: {
    etiqueta: 'Limpieza',
    emoji: '🧹',
    descripcion: 'Detergentes, desinfectantes',
  },
  [CategoriaProducto.HIGIENE_PERSONAL]: {
    etiqueta: 'Higiene Personal',
    emoji: '🧴',
    descripcion: 'Shampoo, jabón, cuidado personal',
  },
  [CategoriaProducto.OTROS]: {
    etiqueta: 'Otros',
    emoji: '📦',
    descripcion: 'Otros productos no clasificados',
  },
};

/**
 * Validar si una categoría es válida
 */
export function esCategoriaValida(
  categoria: string
): categoria is CategoriaProducto {
  return CATEGORIAS_PRODUCTO_VALORES.includes(categoria as CategoriaProducto);
}
