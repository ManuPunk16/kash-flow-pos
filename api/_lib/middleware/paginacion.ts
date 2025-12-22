import { VercelRequest, VercelResponse } from '@vercel/node';

export interface OpcionesPaginacion {
  pagina: number;
  limite: number;
  skip: number;
}

export interface RespuestaPaginada<T> {
  exito: true;
  datos: T[];
  paginacion: {
    pagina: number;
    limite: number;
    total: number;
    totalPaginas: number;
    tieneSiguiente: boolean;
    tieneAnterior: boolean;
  };
}

/**
 * Middleware para extraer parámetros de paginación
 */
export function middlewarePaginacion(
  req: VercelRequest,
  res: VercelResponse,
  next: () => void
): void {
  const { searchParams } = new URL(req.url || '', `http://${req.headers.host}`);

  const pagina = Math.max(1, parseInt(searchParams.get('pagina') || '1', 10));
  const limite = Math.min(
    100,
    Math.max(1, parseInt(searchParams.get('limite') || '50', 10))
  );
  const skip = (pagina - 1) * limite;

  // Agregar a req como propiedad personalizada
  (req as any).paginacion = { pagina, limite, skip };

  next();
}

/**
 * Helper para construir respuesta paginada
 */
export function construirRespuestaPaginada<T>(
  datos: T[],
  total: number,
  pagina: number,
  limite: number
): RespuestaPaginada<T> {
  const totalPaginas = Math.ceil(total / limite);

  return {
    exito: true,
    datos,
    paginacion: {
      pagina,
      limite,
      total,
      totalPaginas,
      tieneSiguiente: pagina < totalPaginas,
      tieneAnterior: pagina > 1,
    },
  };
}

/**
 * Helper para obtener opciones de paginación desde el request
 */
export function obtenerOpcionesPaginacion(
  req: VercelRequest
): OpcionesPaginacion {
  const { searchParams } = new URL(req.url || '', `http://${req.headers.host}`);

  const pagina = Math.max(1, parseInt(searchParams.get('pagina') || '1', 10));
  const limite = Math.min(
    100,
    Math.max(1, parseInt(searchParams.get('limite') || '50', 10))
  );
  const skip = (pagina - 1) * limite;

  return { pagina, limite, skip };
}
