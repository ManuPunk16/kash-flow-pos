/**
 * ✅ Enum de Categorías de Proveedores
 * Define las categorías válidas para clasificar proveedores
 */
export enum CategoriaProveedor {
  ALIMENTOS = 'alimentos',
  BEBIDAS = 'bebidas',
  LACTEOS = 'lacteos',
  CARNES = 'carnes',
  FRUTAS_VERDURAS = 'frutas_verduras',
  ABARROTES = 'abarrotes',
  LIMPIEZA = 'limpieza',
  PAPELERIA = 'papeleria',
  TECNOLOGIA = 'tecnologia',
  FERRETERIA = 'ferreteria',
  TEXTILES = 'textiles',
  FARMACEUTICO = 'farmaceutico',
  OTROS = 'otros',
}

/**
 * ✅ Etiquetas legibles para cada categoría
 */
export const ETIQUETAS_CATEGORIAS: Record<CategoriaProveedor, string> = {
  [CategoriaProveedor.ALIMENTOS]: '🍲 Alimentos',
  [CategoriaProveedor.BEBIDAS]: '🥤 Bebidas',
  [CategoriaProveedor.LACTEOS]: '🥛 Lácteos',
  [CategoriaProveedor.CARNES]: '🥩 Carnes',
  [CategoriaProveedor.FRUTAS_VERDURAS]: '🥕 Frutas y Verduras',
  [CategoriaProveedor.ABARROTES]: '📦 Abarrotes',
  [CategoriaProveedor.LIMPIEZA]: '🧴 Limpieza',
  [CategoriaProveedor.PAPELERIA]: '📝 Papelería',
  [CategoriaProveedor.TECNOLOGIA]: '📱 Tecnología',
  [CategoriaProveedor.FERRETERIA]: '🔧 Ferretería',
  [CategoriaProveedor.TEXTILES]: '👕 Textiles',
  [CategoriaProveedor.FARMACEUTICO]: '💊 Farmacéutico',
  [CategoriaProveedor.OTROS]: '📋 Otros',
};

/**
 * ✅ Array de todos los valores para validaciones
 */
export const CATEGORIAS_PROVEEDOR_VALORES = Object.values(CategoriaProveedor);
