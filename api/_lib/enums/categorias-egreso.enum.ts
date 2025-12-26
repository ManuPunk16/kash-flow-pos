/**
 * Categorías de egresos (gastos) del negocio
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
 * Array de valores válidos
 */
export const CATEGORIAS_EGRESO_VALORES = Object.values(CategoriaEgreso);

/**
 * Metadata para visualización
 */
export const CATEGORIAS_EGRESO_METADATA: Record<
  CategoriaEgreso,
  {
    etiqueta: string;
    icono: string;
    descripcion: string;
  }
> = {
  [CategoriaEgreso.SERVICIOS]: {
    etiqueta: 'Servicios',
    icono: '⚡',
    descripcion: 'Luz, agua, internet, teléfono',
  },
  [CategoriaEgreso.NOMINA]: {
    etiqueta: 'Nómina',
    icono: '👥',
    descripcion: 'Salarios y prestaciones',
  },
  [CategoriaEgreso.INSUMOS]: {
    etiqueta: 'Insumos',
    icono: '📦',
    descripcion: 'Materiales y suministros',
  },
  [CategoriaEgreso.MANTENIMIENTO]: {
    etiqueta: 'Mantenimiento',
    icono: '🔧',
    descripcion: 'Reparaciones y mantenimiento',
  },
  [CategoriaEgreso.TRANSPORTE]: {
    etiqueta: 'Transporte',
    icono: '🚚',
    descripcion: 'Fletes y transporte',
  },
  [CategoriaEgreso.ALQUILER]: {
    etiqueta: 'Alquiler',
    icono: '🏠',
    descripcion: 'Renta de local',
  },
  [CategoriaEgreso.IMPUESTOS]: {
    etiqueta: 'Impuestos',
    icono: '📋',
    descripcion: 'Impuestos y contribuciones',
  },
  [CategoriaEgreso.OTROS]: {
    etiqueta: 'Otros',
    icono: '💼',
    descripcion: 'Otros gastos no clasificados',
  },
};

/**
 * Validar categoría de egreso
 */
export function esCategoriaEgresoValida(
  categoria: string
): categoria is CategoriaEgreso {
  return CATEGORIAS_EGRESO_VALORES.includes(categoria as CategoriaEgreso);
}
