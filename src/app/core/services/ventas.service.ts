import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { map, catchError, tap } from 'rxjs/operators';
import { environment } from '@environments/environment';
import {
  Venta,
  RespuestaListaVentas,
  RespuestaAPI,
  RegistrarVentaDTO,
} from '@core/models/venta.model';
import { MetodoPago } from '@core/enums';

@Injectable({
  providedIn: 'root',
})
export class VentasService {
  private readonly http = inject(HttpClient);
  private readonly apiUrl = `${environment.apiUrl}/ventas`;

  /**
   * ✅ Registrar nueva venta
   */
  registrarVenta(ventaDTO: RegistrarVentaDTO): Observable<Venta> {
    console.log('📤 [VentasService] Registrando venta:', ventaDTO);

    return this.http.post<RespuestaAPI<Venta>>(this.apiUrl, ventaDTO).pipe(
      tap((respuesta) => {
        console.log(
          '📥 [VentasService] Respuesta venta registrada:',
          respuesta,
        );
      }),
      map((respuesta) => {
        if (respuesta.exito && respuesta.dato) {
          console.log('✅ [VentasService] Venta registrada:', respuesta.dato);
          return respuesta.dato;
        }

        throw new Error(respuesta.error || 'Error al registrar venta');
      }),
      catchError((error) => {
        console.error('❌ [VentasService] Error al registrar venta:', error);

        // Extraer mensaje de error del backend
        const mensajeError =
          error.error?.error ||
          error.error?.mensaje ||
          error.message ||
          'Error al registrar la venta';

        throw new Error(mensajeError);
      }),
    );
  }

  /**
   * ✅ Obtener ventas con filtros y paginación
   */
  obtenerVentasConFiltros(filtros: {
    pagina?: number;
    limite?: number;
    desde?: string;
    hasta?: string;
    usuarioId?: string;
    metodoPago?: MetodoPago | 'todos';
    clienteId?: string;
    busqueda?: string; // ← AGREGAR ESTO
  }): Observable<RespuestaListaVentas> {
    // Construir parámetros HTTP
    let params = new HttpParams();

    if (filtros.pagina) {
      params = params.set('pagina', filtros.pagina.toString());
    }
    if (filtros.limite) {
      params = params.set('limite', filtros.limite.toString());
    }
    if (filtros.desde) {
      params = params.set('desde', filtros.desde);
    }
    if (filtros.hasta) {
      params = params.set('hasta', filtros.hasta);
    }
    if (filtros.usuarioId) {
      params = params.set('usuarioId', filtros.usuarioId);
    }
    if (filtros.metodoPago && filtros.metodoPago !== 'todos') {
      params = params.set('metodoPago', filtros.metodoPago);
    }
    if (filtros.clienteId) {
      params = params.set('clienteId', filtros.clienteId);
    }
    if (filtros.busqueda) {
      params = params.set('busqueda', filtros.busqueda); // ← AGREGAR ESTO
    }

    console.log('📤 [VentasService] Solicitando ventas:', {
      url: this.apiUrl,
      params: params.toString(),
      filtros,
    });

    return this.http
      .get<RespuestaAPI<RespuestaListaVentas>>(this.apiUrl, { params })
      .pipe(
        tap((respuesta) => {
          console.log('📥 [VentasService] Respuesta cruda:', respuesta);
        }),
        map((respuesta) => {
          // ✅ Validar estructura básica
          if (!respuesta || typeof respuesta !== 'object') {
            console.error('❌ Respuesta inválida:', respuesta);
            throw new Error('Formato de respuesta inválido');
          }

          // ✅ CASO 1: Respuesta exitosa con datos
          if (respuesta.exito && respuesta.datos) {
            const datos = respuesta.datos;

            if (!datos.ventas || !Array.isArray(datos.ventas)) {
              console.error('❌ datos.ventas no es array:', datos);
              throw new Error('datos.ventas debe ser un array');
            }

            const resultado: RespuestaListaVentas = {
              ventas: datos.ventas || [],
              total: datos.total || 0,
              pagina: datos.pagina || 1,
              limite: datos.limite || 20,
              totalPaginas: datos.totalPaginas || 0,
            };

            console.log('✅ [VentasService] Ventas procesadas:', {
              cantidad: resultado.ventas.length,
              total: resultado.total,
              pagina: resultado.pagina,
            });

            return resultado;
          }

          // ✅ CASO 2: Respuesta directa (array)
          if (Array.isArray(respuesta)) {
            console.warn('⚠️ Respuesta es array directo');
            return {
              ventas: respuesta,
              total: respuesta.length,
              pagina: 1,
              limite: respuesta.length,
              totalPaginas: 1,
            };
          }

          // ✅ CASO 3: Respuesta con estructura { ventas, total }
          if (
            'ventas' in respuesta &&
            Array.isArray((respuesta as any).ventas)
          ) {
            const r = respuesta as any;
            return {
              ventas: r.ventas,
              total: r.total || r.ventas.length,
              pagina: r.pagina || 1,
              limite: r.limite || 20,
              totalPaginas: r.totalPaginas || 1,
            };
          }

          console.error('❌ Formato de respuesta no reconocido:', respuesta);
          throw new Error('Formato de respuesta no soportado');
        }),
        catchError((error) => {
          console.error('❌ [VentasService] Error:', error);

          if (error.status === 0) {
            console.error('❌ Error de conexión (CORS o red)');
          } else if (error.status >= 500) {
            console.error('❌ Error del servidor:', error.message);
          } else if (error.status >= 400) {
            console.error('❌ Error del cliente:', error.error);
          }

          return of({
            ventas: [],
            total: 0,
            pagina: 1,
            limite: 20,
            totalPaginas: 0,
          });
        }),
      );
  }

  /**
   * ✅ Obtener todas las ventas (sin filtros)
   */
  obtenerTodasLasVentas(): Observable<Venta[]> {
    return this.obtenerVentasConFiltros({}).pipe(
      map((respuesta) => respuesta.ventas),
    );
  }

  /**
   * ✅ Obtener ventas de hoy
   */
  obtenerVentasDeHoy(): Observable<Venta[]> {
    const hoy = new Date();
    const inicio = new Date(hoy.setHours(0, 0, 0, 0)).toISOString();
    const fin = new Date(hoy.setHours(23, 59, 59, 999)).toISOString();

    return this.obtenerVentasConFiltros({
      desde: inicio,
      hasta: fin,
    }).pipe(map((respuesta) => respuesta.ventas));
  }

  /**
   * ✅ Obtener detalle de una venta
   */
  obtenerVentaPorId(id: string): Observable<Venta | null> {
    return this.http.get<RespuestaAPI<Venta>>(`${this.apiUrl}/${id}`).pipe(
      map((respuesta) => {
        if (respuesta.exito && respuesta.dato) {
          return respuesta.dato;
        }
        return null;
      }),
      catchError((error) => {
        console.error('❌ Error al obtener venta:', error);
        return of(null);
      }),
    );
  }

  /**
   * ✅ Anular venta
   */
  anularVenta(ventaId: string): Observable<Venta> {
    return this.http
      .delete<RespuestaAPI<Venta>>(`${this.apiUrl}/${ventaId}`)
      .pipe(
        map((respuesta) => {
          if (respuesta.exito && respuesta.dato) {
            return respuesta.dato;
          }
          throw new Error('Error al anular venta');
        }),
        catchError((error) => {
          console.error('❌ Error al anular venta:', error);
          throw error;
        }),
      );
  }
}
