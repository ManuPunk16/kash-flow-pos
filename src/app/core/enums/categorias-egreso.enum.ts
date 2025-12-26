/**
 * Categorías de egresos - Sincronizado con backend
 */
export enum CategoriaEgreso {
  SERVICIOS = 'servicios',
  NOMINA = 'nomina',
  INSUMOS = 'insumos',
  MANTENIMIENTO = 'mantenimiento',
  TRANSPORTE = 'transporte',
  ALQUILER = 'alquiler',
  IMPUESTOS = 'impuestos',
  OTROS = 'otros',
}

/**
 * Type-safe array
 */
export const CATEGORIAS_EGRESO_LISTA: readonly CategoriaEgreso[] =
  Object.values(CategoriaEgreso);

/**
 * Metadata para UI
 */
export interface CategoriaEgresoInfo {
  valor: CategoriaEgreso;
  etiqueta: string;
  icono: string;
  descripcion: string;
  color: string;
}

export const CATEGORIAS_EGRESO_CATALOGO: readonly CategoriaEgresoInfo[] = [
  {
    valor: CategoriaEgreso.SERVICIOS,
    etiqueta: 'Servicios',
    icono: '⚡',
    descripcion: 'Luz, agua, internet',
    color: 'blue',
  },
  {
    valor: CategoriaEgreso.NOMINA,
    etiqueta: 'Nómina',
    icono: '👥',
    descripcion: 'Salarios y prestaciones',
    color: 'green',
  },
  {
    valor: CategoriaEgreso.INSUMOS,
    etiqueta: 'Insumos',
    icono: '📦',
    descripcion: 'Materiales y suministros',
    color: 'purple',
  },
  {
    valor: CategoriaEgreso.MANTENIMIENTO,
    etiqueta: 'Mantenimiento',
    icono: '🔧',
    descripcion: 'Reparaciones',
    color: 'orange',
  },
  {
    valor: CategoriaEgreso.TRANSPORTE,
    etiqueta: 'Transporte',
    icono: '🚚',
    descripcion: 'Fletes y transporte',
    color: 'indigo',
  },
  {
    valor: CategoriaEgreso.ALQUILER,
    etiqueta: 'Alquiler',
    icono: '🏠',
    descripcion: 'Renta de local',
    color: 'red',
  },
  {
    valor: CategoriaEgreso.IMPUESTOS,
    etiqueta: 'Impuestos',
    icono: '📋',
    descripcion: 'Impuestos y contribuciones',
    color: 'gray',
  },
  {
    valor: CategoriaEgreso.OTROS,
    etiqueta: 'Otros',
    icono: '💼',
    descripcion: 'Otros gastos',
    color: 'yellow',
  },
] as const;

/**
 * Obtener info de categoría de egreso
 */
export function obtenerInfoCategoriaEgreso(
  categoria: CategoriaEgreso
): CategoriaEgresoInfo | undefined {
  return CATEGORIAS_EGRESO_CATALOGO.find((c) => c.valor === categoria);
}

/**
 * Validar categoría de egreso
 */
export function esCategoriaEgresoValida(
  categoria: string
): categoria is CategoriaEgreso {
  return CATEGORIAS_EGRESO_LISTA.includes(categoria as CategoriaEgreso);
}
