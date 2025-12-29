import { Injectable, inject, signal } from '@angular/core';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Observable, tap, catchError, throwError, map } from 'rxjs';
import { Cliente } from '@core/models/cliente.model';
import { environment } from '@environments/environment';

interface RespuestaAPI<T> {
  exito: boolean;
  mensaje?: string;
  datos?: T;
  dato?: T;
  cantidad?: number;
}

export interface CrearClienteDTO {
  nombre: string;
  apellido: string;
  identificacion: string;
  email?: string;
  telefono?: string;
  direccion?: string;
}

export interface RegistrarAbonoDTO {
  clienteId: string;
  monto: number;
  metodoPago: 'efectivo' | 'transferencia' | 'tarjeta';
  notas?: string;
}

@Injectable({
  providedIn: 'root',
})
export class ClientesService {
  private readonly http = inject(HttpClient);
  private readonly apiUrl = `${environment.apiUrl}/clientes`;

  // Estado reactivo
  private readonly clientesCache = signal<Cliente[]>([]);
  readonly clientes = this.clientesCache.asReadonly();

  /**
   * Obtener todos los clientes activos
   */
  obtenerClientes(): Observable<Cliente[]> {
    return this.http.get<RespuestaAPI<Cliente[]>>(this.apiUrl).pipe(
      map((respuesta) => {
        if (respuesta.exito && Array.isArray(respuesta.datos)) {
          return respuesta.datos;
        }
        if (Array.isArray(respuesta)) {
          return respuesta as Cliente[];
        }
        console.warn('⚠️ Respuesta inesperada del servidor:', respuesta);
        return [];
      }),
      tap((clientes) => {
        console.log('✅ Clientes cargados:', clientes.length);
        this.clientesCache.set(clientes);
      }),
      catchError(this.manejarError)
    );
  }

  /**
   * Obtener clientes deudores (morosos y al día)
   */
  obtenerDeudores(): Observable<Cliente[]> {
    return this.http
      .get<RespuestaAPI<Cliente[]>>(`${this.apiUrl}/deudores/listado`)
      .pipe(
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
   * Obtener cliente por ID
   */
  obtenerClientePorId(id: string): Observable<Cliente> {
    return this.http.get<RespuestaAPI<Cliente>>(`${this.apiUrl}/${id}`).pipe(
      map((respuesta) => {
        if (respuesta.exito && respuesta.dato) {
          return respuesta.dato;
        }
        throw new Error('Cliente no encontrado');
      }),
      catchError(this.manejarError)
    );
  }

  /**
   * Crear nuevo cliente
   */
  crearCliente(cliente: CrearClienteDTO): Observable<Cliente> {
    return this.http.post<RespuestaAPI<Cliente>>(this.apiUrl, cliente).pipe(
      map((respuesta) => {
        if (respuesta.exito && respuesta.dato) {
          return respuesta.dato;
        }
        throw new Error('Error al crear cliente');
      }),
      tap(() => {
        this.obtenerClientes().subscribe();
      }),
      catchError(this.manejarError)
    );
  }

  /**
   * Actualizar cliente
   */
  actualizarCliente(
    id: string,
    cambios: Partial<CrearClienteDTO>
  ): Observable<Cliente> {
    return this.http
      .put<RespuestaAPI<Cliente>>(`${this.apiUrl}/${id}`, cambios)
      .pipe(
        map((respuesta) => {
          if (respuesta.exito && respuesta.dato) {
            return respuesta.dato;
          }
          throw new Error('Error al actualizar cliente');
        }),
        tap(() => {
          this.obtenerClientes().subscribe();
        }),
        catchError(this.manejarError)
      );
  }

  /**
   * Eliminar (desactivar) cliente
   */
  eliminarCliente(id: string): Observable<void> {
    return this.http.delete<RespuestaAPI<void>>(`${this.apiUrl}/${id}`).pipe(
      map((respuesta) => {
        if (!respuesta.exito) {
          throw new Error(respuesta.mensaje || 'Error al eliminar cliente');
        }
      }),
      tap(() => {
        this.obtenerClientes().subscribe();
      }),
      catchError(this.manejarError)
    );
  }

  /**
   * Registrar abono (pago a la deuda)
   */
  registrarAbono(datos: RegistrarAbonoDTO): Observable<Cliente> {
    return this.http
      .post<RespuestaAPI<Cliente>>(`${this.apiUrl}/abonos`, datos)
      .pipe(
        map((respuesta) => {
          if (respuesta.exito && respuesta.dato) {
            return respuesta.dato;
          }
          throw new Error('Error al registrar abono');
        }),
        tap(() => {
          this.obtenerClientes().subscribe();
        }),
        catchError(this.manejarError)
      );
  }

  private manejarError(error: HttpErrorResponse): Observable<never> {
    console.error('❌ Error en ClientesService:', error);

    let mensajeError = 'Error desconocido';

    if (error.error instanceof ErrorEvent) {
      mensajeError = `Error: ${error.error.message}`;
    } else {
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
