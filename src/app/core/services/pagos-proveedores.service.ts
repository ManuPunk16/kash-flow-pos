import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { map, catchError, tap } from 'rxjs/operators';
import {
  PagoProveedor,
  CrearPagoProveedorDTO,
  RespuestaHistorialPagos,
} from '@core/models/pago-proveedor.model';
import { environment } from '@environments/environment';

interface RespuestaAPI<T> {
  exito: boolean;
  mensaje?: string;
  dato?: T;
  datos?: T;
  cantidad?: number;
  totalPagado?: number;
}

@Injectable({
  providedIn: 'root',
})
export class PagosProveedoresService {
  private readonly http = inject(HttpClient);
  private readonly apiUrl = `${environment.apiUrl}/pagos-proveedores`;

  /**
   * Obtener historial de pagos de un proveedor específico
   */
  obtenerPagosPorProveedor(
    proveedorId: string
  ): Observable<RespuestaHistorialPagos> {
    return this.http
      .get<RespuestaAPI<PagoProveedor[]>>(
        `${this.apiUrl}/proveedor/${proveedorId}`
      )
      .pipe(
        map((respuesta) => ({
          exito: respuesta.exito,
          datos: respuesta.datos || [],
          cantidad: respuesta.cantidad || 0,
          totalPagado: respuesta.totalPagado || 0,
        })),
        tap((resultado) => {
          console.log(
            `✅ Pagos cargados para proveedor ${proveedorId}:`,
            resultado.cantidad
          );
        }),
        catchError(this.manejarError)
      );
  }

  /**
   * Obtener todos los pagos (para reportes)
   */
  obtenerTodosPagos(): Observable<PagoProveedor[]> {
    return this.http.get<RespuestaAPI<PagoProveedor[]>>(this.apiUrl).pipe(
      map((respuesta) => {
        if (respuesta.exito && Array.isArray(respuesta.datos)) {
          return respuesta.datos;
        }
        return [];
      }),
      catchError(this.manejarError)
    );
  }

  /**
   * Obtener pagos pendientes
   */
  obtenerPagosPendientes(): Observable<PagoProveedor[]> {
    return this.http
      .get<RespuestaAPI<PagoProveedor[]>>(`${this.apiUrl}/pendientes`)
      .pipe(
        map((respuesta) => respuesta.datos || []),
        catchError(this.manejarError)
      );
  }

  /**
   * Registrar un nuevo pago a proveedor
   */
  registrarPago(pago: CrearPagoProveedorDTO): Observable<PagoProveedor> {
    return this.http.post<RespuestaAPI<PagoProveedor>>(this.apiUrl, pago).pipe(
      map((respuesta) => {
        if (respuesta.exito && respuesta.dato) {
          return respuesta.dato;
        }
        throw new Error(respuesta.mensaje || 'Error al registrar pago');
      }),
      tap((pagoCreado) => {
        console.log('✅ Pago registrado exitosamente:', pagoCreado._id);
      }),
      catchError(this.manejarError)
    );
  }

  /**
   * Actualizar estado de un pago
   */
  actualizarEstadoPago(
    pagoId: string,
    nuevoEstado: 'pagado' | 'pendiente'
  ): Observable<PagoProveedor> {
    return this.http
      .put<RespuestaAPI<PagoProveedor>>(`${this.apiUrl}/${pagoId}`, {
        estado: nuevoEstado,
      })
      .pipe(
        map((respuesta) => {
          if (respuesta.exito && respuesta.dato) {
            return respuesta.dato;
          }
          throw new Error(respuesta.mensaje || 'Error al actualizar estado');
        }),
        catchError(this.manejarError)
      );
  }

  private manejarError(error: HttpErrorResponse): Observable<never> {
    console.error('❌ Error en PagosProveedoresService:', error);

    let mensajeError = 'Error desconocido';

    if (error.error instanceof ErrorEvent) {
      mensajeError = `Error: ${error.error.message}`;
    } else {
      if (error.error?.mensaje) {
        mensajeError = error.error.mensaje;
      } else if (error.error?.error) {
        mensajeError = error.error.error;
      } else if (error.message) {
        mensajeError = error.message;
      } else {
        mensajeError = `Código de error: ${error.status}`;
      }
    }

    return throwError(() => new Error(mensajeError));
  }
}
