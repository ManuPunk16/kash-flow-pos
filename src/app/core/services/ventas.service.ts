import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, map, catchError, throwError } from 'rxjs';
import { environment } from '@environments/environment';
import {
  Venta,
  RegistrarVentaDTO,
  RespuestaListaVentas,
} from '@core/models/venta.model';

// ✅ AGREGAR interface para respuesta SINGULAR
interface RespuestaAPISingular<T> {
  exito: boolean;
  mensaje?: string;
  dato?: T; // ✅ SINGULAR (backend usa "dato" en POST)
}

// Interface para respuestas con array
interface RespuestaAPI<T> {
  exito: boolean;
  mensaje?: string;
  datos?: T; // ✅ PLURAL (backend usa "datos" en GET)
}

@Injectable({
  providedIn: 'root',
})
export class VentasService {
  private readonly http = inject(HttpClient);
  private readonly apiUrl = `${environment.apiUrl}/ventas`;

  /**
   * Registrar una nueva venta
   */
  registrarVenta(ventaDTO: RegistrarVentaDTO): Observable<Venta> {
    return this.http
      .post<RespuestaAPISingular<Venta>>(this.apiUrl, ventaDTO) // ✅ USAR RespuestaAPISingular
      .pipe(
        map((respuesta) => {
          if (respuesta.exito && respuesta.dato) {
            // ✅ CAMBIAR datos → dato
            console.log('✅ Venta registrada:', respuesta.dato);
            return respuesta.dato;
          }
          throw new Error(respuesta.mensaje || 'Error al registrar venta');
        }),
        catchError((error) => {
          console.error('❌ Error en el servicio de ventas:', error);

          // ✅ MEJORAR manejo de errores
          const mensajeError =
            error.error?.error || // Backend envía "error" en caso de fallo
            error.error?.mensaje ||
            error.message ||
            'Error desconocido al registrar venta';

          return throwError(() => new Error(mensajeError));
        })
      );
  }

  /**
   * Obtener todas las ventas (con paginación opcional)
   */
  obtenerVentas(
    pagina: number = 1,
    limite: number = 20
  ): Observable<RespuestaListaVentas> {
    const url = `${this.apiUrl}?pagina=${pagina}&limite=${limite}`;

    return this.http.get<RespuestaAPI<RespuestaListaVentas>>(url).pipe(
      map((respuesta) => {
        if (respuesta.exito && respuesta.datos) {
          return respuesta.datos;
        }
        throw new Error('Error al obtener ventas');
      }),
      catchError((error) => {
        console.error('❌ Error al obtener ventas:', error);
        return throwError(() => error);
      })
    );
  }

  /**
   * Obtener ventas de un cliente específico
   */
  obtenerVentasPorCliente(clienteId: string): Observable<Venta[]> {
    return this.http
      .get<RespuestaAPI<Venta[]>>(`${this.apiUrl}/cliente/${clienteId}`)
      .pipe(
        map((respuesta) => {
          if (respuesta.exito && respuesta.datos) {
            return respuesta.datos;
          }
          return [];
        }),
        catchError((error) => {
          console.error('❌ Error al obtener ventas del cliente:', error);
          return throwError(() => error);
        })
      );
  }

  /**
   * Obtener ventas del día actual
   */
  obtenerVentasDelDia(): Observable<Venta[]> {
    return this.http.get<RespuestaAPI<Venta[]>>(`${this.apiUrl}/hoy`).pipe(
      map((respuesta) => {
        if (respuesta.exito && respuesta.datos) {
          return respuesta.datos;
        }
        return [];
      }),
      catchError((error) => {
        console.error('❌ Error al obtener ventas del día:', error);
        return throwError(() => error);
      })
    );
  }

  /**
   * Obtener una venta por ID
   */
  obtenerVentaPorId(ventaId: string): Observable<Venta> {
    return this.http
      .get<RespuestaAPISingular<Venta>>(`${this.apiUrl}/${ventaId}`) // ✅ USAR RespuestaAPISingular
      .pipe(
        map((respuesta) => {
          if (respuesta.exito && respuesta.dato) {
            // ✅ CAMBIAR datos → dato
            return respuesta.dato;
          }
          throw new Error('Venta no encontrada');
        }),
        catchError((error) => {
          console.error('❌ Error al obtener venta:', error);
          return throwError(() => error);
        })
      );
  }

  /**
   * Cancelar una venta (marcar como cancelada)
   */
  cancelarVenta(ventaId: string, motivo?: string): Observable<void> {
    return this.http
      .delete<RespuestaAPI<void>>(`${this.apiUrl}/${ventaId}`, {
        body: { motivo },
      })
      .pipe(
        map((respuesta) => {
          if (!respuesta.exito) {
            throw new Error(respuesta.mensaje || 'Error al cancelar venta');
          }
        }),
        catchError((error) => {
          console.error('❌ Error al cancelar venta:', error);
          return throwError(() => error);
        })
      );
  }
}
