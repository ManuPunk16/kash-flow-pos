import { Injectable, inject, signal } from '@angular/core';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Observable, tap, catchError, throwError, map } from 'rxjs';
import { environment } from '@environments/environment';

export interface AbonoCliente {
  _id: string;
  clienteId: string;
  nombreCliente: string;
  usuarioId: string;
  nombreUsuario: string;
  monto: number;
  metodoPago: 'efectivo' | 'transferencia' | 'cheque';
  referenciaPago?: string;
  saldoAnterior: number;
  nuevoSaldo: number;
  observaciones?: string;
  confirmado: boolean;
  fechaPago: Date;
  fechaCreacion: Date;
}

interface RespuestaAPI<T> {
  exito: boolean;
  mensaje?: string;
  dato?: T;
  datos?: T;
  cantidad?: number;
}

interface RespuestaHistorialAbonos {
  exito: boolean;
  datos: AbonoCliente[];
  cantidad: number;
  total: number;
  pagina: number;
  totalPaginas: number;
}

export interface FiltrosHistorialAbonos {
  pagina?: number;
  limite?: number;
  desde?: string;
  hasta?: string;
  metodoPago?: 'todos' | 'efectivo' | 'transferencia' | 'cheque';
}

@Injectable({
  providedIn: 'root',
})
export class AbonosService {
  private readonly http = inject(HttpClient);
  private readonly apiUrl = `${environment.apiUrl}/abonos`;

  // Estado reactivo
  private readonly abonosCache = signal<AbonoCliente[]>([]);
  readonly abonos = this.abonosCache.asReadonly();

  /**
   * Obtener historial de abonos con paginación y filtros (optimizado para Vercel free tier)
   */
  obtenerHistorialPaginado(filtros: FiltrosHistorialAbonos = {}): Observable<{
    abonos: AbonoCliente[];
    total: number;
    pagina: number;
    totalPaginas: number;
  }> {
    const params: Record<string, string> = {};
    params['pagina'] = String(filtros.pagina ?? 1);
    params['limite'] = String(Math.min(20, filtros.limite ?? 20));
    if (filtros.desde) params['desde'] = filtros.desde;
    if (filtros.hasta) params['hasta'] = filtros.hasta;
    if (filtros.metodoPago && filtros.metodoPago !== 'todos') {
      params['metodoPago'] = filtros.metodoPago;
    }

    const queryString = new URLSearchParams(params).toString();
    return this.http
      .get<RespuestaHistorialAbonos>(`${this.apiUrl}?${queryString}`)
      .pipe(
        map((respuesta) => ({
          abonos: respuesta.datos ?? [],
          total: respuesta.total ?? 0,
          pagina: respuesta.pagina ?? 1,
          totalPaginas: respuesta.totalPaginas ?? 1,
        })),
        catchError(this.manejarError),
      );
  }

  /**
   * Obtener todos los abonos
   */
  obtenerTodos(): Observable<AbonoCliente[]> {
    return this.http.get<RespuestaAPI<AbonoCliente[]>>(this.apiUrl).pipe(
      map((respuesta) => {
        if (respuesta.exito && Array.isArray(respuesta.datos)) {
          return respuesta.datos;
        }
        return [];
      }),
      tap((abonos) => {
        console.log('✅ Abonos cargados:', abonos.length);
        this.abonosCache.set(abonos);
      }),
      catchError(this.manejarError),
    );
  }

  /**
   * Obtener abonos de un cliente específico
   */
  obtenerPorCliente(clienteId: string): Observable<AbonoCliente[]> {
    return this.http
      .get<RespuestaAPI<AbonoCliente[]>>(`${this.apiUrl}/cliente/${clienteId}`)
      .pipe(
        map((respuesta) => {
          if (respuesta.exito && Array.isArray(respuesta.datos)) {
            return respuesta.datos;
          }
          return [];
        }),
        tap((abonos) => {
          console.log(
            `✅ Abonos del cliente ${clienteId} cargados:`,
            abonos.length,
          );
        }),
        catchError(this.manejarError),
      );
  }

  private manejarError(error: HttpErrorResponse): Observable<never> {
    console.error('❌ Error en AbonosService:', error);

    let mensajeError = 'Error desconocido';

    if (error.error instanceof ErrorEvent) {
      mensajeError = `Error: ${error.error.message}`;
    } else {
      if (error.error?.mensaje) {
        mensajeError = error.error.mensaje;
      } else if (error.error?.error) {
        if (typeof error.error.error === 'string') {
          mensajeError = error.error.error;
        }

        if (error.error.detalles && Array.isArray(error.error.detalles)) {
          const detallesFormateados = error.error.detalles
            .map((d: any) => `${d.campo}: ${d.mensaje}`)
            .join(', ');
          mensajeError = `Validación fallida: ${detallesFormateados}`;
        }
      } else if (error.message) {
        mensajeError = error.message;
      } else {
        mensajeError = `Código de error: ${error.status}`;
      }
    }

    return throwError(() => new Error(mensajeError));
  }
}
