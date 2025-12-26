import { Injectable, inject, signal } from '@angular/core';
import {
  HttpClient,
  HttpParams,
  HttpErrorResponse,
} from '@angular/common/http';
import { Observable, tap, catchError, throwError, map } from 'rxjs';
import { Producto } from '@core/models/producto.model';
import { environment } from '@environments/environment';

interface RespuestaAPI<T> {
  exito: boolean;
  mensaje?: string;
  datos?: T;
  total?: number;
}

interface FiltrosProductos {
  busqueda?: string;
  categoria?: string;
  stockBajo?: boolean;
  consignacion?: boolean;
  activo?: boolean;
}

@Injectable({
  providedIn: 'root',
})
export class ProductosService {
  private readonly http = inject(HttpClient);
  private readonly apiUrl = `${environment.apiUrl}/productos`;

  // Estado reactivo
  private readonly productosCache = signal<Producto[]>([]);
  readonly productos = this.productosCache.asReadonly();

  obtenerProductos(filtros?: FiltrosProductos): Observable<Producto[]> {
    let params = new HttpParams();

    if (filtros?.busqueda) {
      params = params.set('busqueda', filtros.busqueda);
    }
    if (filtros?.categoria && filtros.categoria !== 'todas') {
      params = params.set('categoria', filtros.categoria);
    }
    if (filtros?.stockBajo !== undefined) {
      params = params.set('stockBajo', filtros.stockBajo.toString());
    }
    if (filtros?.consignacion !== undefined) {
      params = params.set('consignacion', filtros.consignacion.toString());
    }
    if (filtros?.activo !== undefined) {
      params = params.set('activo', filtros.activo.toString());
    }

    return this.http
      .get<RespuestaAPI<Producto[]>>(this.apiUrl, { params })
      .pipe(
        map((respuesta) => {
          // ✅ Extraer el array de productos de la respuesta envuelta
          if (respuesta.exito && Array.isArray(respuesta.datos)) {
            return respuesta.datos;
          }
          // Si la respuesta ya es un array directamente
          if (Array.isArray(respuesta)) {
            return respuesta as Producto[];
          }
          // Fallback: retornar array vacío
          console.warn('⚠️ Respuesta inesperada del servidor:', respuesta);
          return [];
        }),
        tap((productos) => {
          console.log('✅ Productos cargados:', productos.length);
          this.productosCache.set(productos);
        }),
        catchError(this.manejarError)
      );
  }

  obtenerTodos(): Observable<RespuestaAPI<Producto[]>> {
    return this.http.get<RespuestaAPI<Producto[]>>(this.apiUrl).pipe(
      tap((respuesta) => {
        if (respuesta.exito && Array.isArray(respuesta.datos)) {
          this.productosCache.set(respuesta.datos);
        }
      }),
      catchError(this.manejarError)
    );
  }

  obtenerProductoPorId(id: string): Observable<Producto> {
    return this.http.get<RespuestaAPI<Producto>>(`${this.apiUrl}/${id}`).pipe(
      map((respuesta) => {
        if (respuesta.exito && respuesta.datos) {
          return respuesta.datos;
        }
        throw new Error('Producto no encontrado');
      }),
      catchError(this.manejarError)
    );
  }

  crearProducto(producto: Partial<Producto>): Observable<Producto> {
    return this.http.post<RespuestaAPI<Producto>>(this.apiUrl, producto).pipe(
      map((respuesta) => {
        if (respuesta.exito && respuesta.datos) {
          return respuesta.datos;
        }
        throw new Error('Error al crear producto');
      }),
      tap(() => {
        // Recargar lista después de crear
        this.obtenerProductos().subscribe();
      }),
      catchError(this.manejarError)
    );
  }

  actualizarProducto(
    id: string,
    cambios: Partial<Producto>
  ): Observable<Producto> {
    return this.http
      .put<RespuestaAPI<Producto>>(`${this.apiUrl}/${id}`, cambios)
      .pipe(
        map((respuesta) => {
          if (respuesta.exito && respuesta.datos) {
            return respuesta.datos;
          }
          throw new Error('Error al actualizar producto');
        }),
        tap(() => {
          // Recargar lista después de actualizar
          this.obtenerProductos().subscribe();
        }),
        catchError(this.manejarError)
      );
  }

  eliminarProducto(id: string): Observable<void> {
    return this.http.delete<RespuestaAPI<void>>(`${this.apiUrl}/${id}`).pipe(
      map((respuesta) => {
        if (!respuesta.exito) {
          throw new Error(respuesta.mensaje || 'Error al eliminar producto');
        }
      }),
      tap(() => {
        // Recargar lista después de eliminar
        this.obtenerProductos().subscribe();
      }),
      catchError(this.manejarError)
    );
  }

  ajustarStock(id: string, cantidad: number): Observable<Producto> {
    return this.http
      .patch<RespuestaAPI<Producto>>(`${this.apiUrl}/${id}/stock`, {
        cantidad,
      })
      .pipe(
        map((respuesta) => {
          if (respuesta.exito && respuesta.datos) {
            return respuesta.datos;
          }
          throw new Error('Error al ajustar stock');
        }),
        catchError(this.manejarError)
      );
  }

  private manejarError(error: HttpErrorResponse): Observable<never> {
    console.error('❌ Error en ProductosService:', error);

    let mensajeError = 'Error desconocido';

    if (error.error instanceof ErrorEvent) {
      // Error del lado del cliente
      mensajeError = `Error: ${error.error.message}`;
    } else {
      // Error del lado del servidor
      if (error.error?.mensaje) {
        mensajeError = error.error.mensaje;
      } else if (error.error?.message) {
        mensajeError = error.error.message;
      } else if (error.message) {
        mensajeError = error.message;
      } else {
        mensajeError = `Código de error: ${error.status}`;
      }
    }

    return throwError(() => new Error(mensajeError));
  }
}
