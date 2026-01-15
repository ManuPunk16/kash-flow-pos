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

export const COLORES_CATEGORIAS: Record<CategoriaProveedor, string> = {
  [CategoriaProveedor.ALIMENTOS]: 'bg-orange-100 text-orange-800',
  [CategoriaProveedor.BEBIDAS]: 'bg-blue-100 text-blue-800',
  [CategoriaProveedor.LACTEOS]: 'bg-yellow-100 text-yellow-800',
  [CategoriaProveedor.CARNES]: 'bg-red-100 text-red-800',
  [CategoriaProveedor.FRUTAS_VERDURAS]: 'bg-green-100 text-green-800',
  [CategoriaProveedor.ABARROTES]: 'bg-purple-100 text-purple-800',
  [CategoriaProveedor.LIMPIEZA]: 'bg-teal-100 text-teal-800',
  [CategoriaProveedor.PAPELERIA]: 'bg-indigo-100 text-indigo-800',
  [CategoriaProveedor.TECNOLOGIA]: 'bg-gray-100 text-gray-800',
  [CategoriaProveedor.FERRETERIA]: 'bg-amber-100 text-amber-800',
  [CategoriaProveedor.TEXTILES]: 'bg-pink-100 text-pink-800',
  [CategoriaProveedor.FARMACEUTICO]: 'bg-cyan-100 text-cyan-800',
  [CategoriaProveedor.OTROS]: 'bg-slate-100 text-slate-800',
};

export const CATEGORIAS_ARRAY = Object.values(CategoriaProveedor);
