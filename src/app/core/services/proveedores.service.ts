import { Injectable, inject, signal } from '@angular/core';
import {
  HttpClient,
  HttpParams,
  HttpErrorResponse,
} from '@angular/common/http';
import { Observable, tap, catchError, throwError, map } from 'rxjs';
import {
  Proveedor,
  CrearProveedorDTO,
  ActualizarProveedorDTO,
} from '@core/models/proveedor.model';
import { Producto } from '@core/models/producto.model';
import { environment } from '@environments/environment';

interface RespuestaAPI<T> {
  exito: boolean;
  mensaje?: string;
  dato?: T; // ✅ SINGULAR para operaciones individuales
  datos?: T; // ✅ PLURAL para listas
  total?: number;
}

interface ProductoConMetricas extends Producto {
  metricas: {
    cantidadVendida: number;
    ingresoTotal: number;
    rotacion: number;
    margenGanancia: number;
  };
}

interface RespuestaProductosProveedor {
  exito: boolean;
  datos: ProductoConMetricas[];
  cantidad: number;
  proveedor: {
    id: string;
    nombre: string;
    nit?: string;
  };
}

@Injectable({
  providedIn: 'root',
})
export class ProveedoresService {
  private readonly http = inject(HttpClient);
  private readonly apiUrl = `${environment.apiUrl}/proveedores`;

  // Estado reactivo
  private readonly proveedoresCache = signal<Proveedor[]>([]);
  readonly proveedores = this.proveedoresCache.asReadonly();

  obtenerProveedores(): Observable<Proveedor[]> {
    return this.http.get<RespuestaAPI<Proveedor[]>>(this.apiUrl).pipe(
      map((respuesta) => {
        if (respuesta.exito && Array.isArray(respuesta.datos)) {
          return respuesta.datos;
        }
        if (Array.isArray(respuesta)) {
          return respuesta as Proveedor[];
        }
        console.warn('⚠️ Respuesta inesperada del servidor:', respuesta);
        return [];
      }),
      tap((proveedores) => {
        console.log('✅ Proveedores cargados:', proveedores.length);
        this.proveedoresCache.set(proveedores);
      }),
      catchError(this.manejarError),
    );
  }

  obtenerProveedorPorId(id: string): Observable<Proveedor> {
    return this.http.get<RespuestaAPI<Proveedor>>(`${this.apiUrl}/${id}`).pipe(
      map((respuesta) => {
        // ✅ CORREGIDO: Usar 'dato' (singular)
        if (respuesta.exito && respuesta.dato) {
          return respuesta.dato;
        }
        throw new Error('Proveedor no encontrado');
      }),
      catchError(this.manejarError),
    );
  }

  crearProveedor(proveedor: CrearProveedorDTO): Observable<Proveedor> {
    return this.http.post<RespuestaAPI<Proveedor>>(this.apiUrl, proveedor).pipe(
      map((respuesta) => {
        // ✅ CORREGIDO: Usar 'dato' (singular)
        if (respuesta.exito && respuesta.dato) {
          console.log('✅ Proveedor creado exitosamente:', respuesta.dato);
          return respuesta.dato;
        }
        throw new Error(respuesta.mensaje || 'Error al crear proveedor');
      }),
      tap(() => {
        this.obtenerProveedores().subscribe();
      }),
      catchError(this.manejarError),
    );
  }

  actualizarProveedor(
    id: string,
    cambios: ActualizarProveedorDTO,
  ): Observable<Proveedor> {
    return this.http
      .put<RespuestaAPI<Proveedor>>(`${this.apiUrl}/${id}`, cambios)
      .pipe(
        map((respuesta) => {
          // ✅ CORREGIDO: Usar 'dato' (singular)
          if (respuesta.exito && respuesta.dato) {
            console.log(
              '✅ Proveedor actualizado exitosamente:',
              respuesta.dato,
            );
            return respuesta.dato;
          }
          throw new Error(respuesta.mensaje || 'Error al actualizar proveedor');
        }),
        tap(() => {
          this.obtenerProveedores().subscribe();
        }),
        catchError(this.manejarError),
      );
  }

  eliminarProveedor(id: string): Observable<void> {
    return this.http.delete<RespuestaAPI<void>>(`${this.apiUrl}/${id}`).pipe(
      map((respuesta) => {
        if (!respuesta.exito) {
          throw new Error(respuesta.mensaje || 'Error al eliminar proveedor');
        }
      }),
      tap(() => {
        this.obtenerProveedores().subscribe();
      }),
      catchError(this.manejarError),
    );
  }

  obtenerProductosPorProveedor(
    proveedorId: string,
  ): Observable<RespuestaProductosProveedor> {
    return this.http
      .get<RespuestaProductosProveedor>(
        `${this.apiUrl}/${proveedorId}/productos`,
      )
      .pipe(
        map((respuesta) => {
          if (respuesta.exito) {
            return respuesta;
          }
          throw new Error('Error al obtener productos del proveedor');
        }),
        tap((resultado) => {
          console.log(
            `✅ Productos cargados para proveedor ${resultado.proveedor.nombre}:`,
            resultado.cantidad,
          );
        }),
        catchError(this.manejarError),
      );
  }

  private manejarError(error: HttpErrorResponse): Observable<never> {
    console.error('❌ Error en ProveedoresService:', error);

    let mensajeError = 'Error desconocido';

    if (error.error instanceof ErrorEvent) {
      mensajeError = `Error: ${error.error.message}`;
    } else {
      if (error.error?.mensaje) {
        mensajeError = error.error.mensaje;
      } else if (error.error?.error) {
        // ✅ AGREGAR: Capturar mensaje de error de validación
        if (typeof error.error.error === 'string') {
          mensajeError = error.error.error;
        }

        // ✅ AGREGAR: Capturar detalles de validación
        if (error.error.detalles && Array.isArray(error.error.detalles)) {
          const detallesFormateados = error.error.detalles
            .map((d: any) => `${d.campo}: ${d.mensaje}`)
            .join(', ');
          mensajeError = `Validación fallida: ${detallesFormateados}`;
        }
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
