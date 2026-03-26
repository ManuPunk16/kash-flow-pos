import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Observable, catchError, map, throwError } from 'rxjs';
import { environment } from '@environments/environment';

export interface ResumenIntereses {
  clientesConDeuda: number;
  clientesConInteresAplicado: number;
  clientesPendientes: number;
  montoTotalDeuda: number;
  proyeccionIntereses: number;
  mesActual: string;
}

export interface DetalleClienteInteres {
  _id: string;
  nombre: string;
  deudaActual: number;
  interesProyectado: number;
  interesAplicado: boolean;
}

export interface RespuestaResumenIntereses {
  exito: boolean;
  resumen: ResumenIntereses;
  detalleClientes: DetalleClienteInteres[];
}

export interface DetalleCorte {
  cliente: string;
  saldoAnterior: number;
  montoInteres: number;
  nuevoSaldo: number;
}

export interface ResultadoCorteMasivo {
  clientesProcesados: number;
  clientesYaConInteres: number;
  errores: number;
}

@Injectable({
  providedIn: 'root',
})
export class InteresesService {
  private readonly http = inject(HttpClient);
  private readonly apiUrl = `${environment.apiUrl}/intereses`;

  obtenerResumen(): Observable<RespuestaResumenIntereses> {
    return this.http
      .get<RespuestaResumenIntereses>(this.apiUrl)
      .pipe(catchError(this.manejarError));
  }

  ejecutarCorteMasivo(): Observable<{
    resumen: ResultadoCorteMasivo;
    detalles: DetalleCorte[];
  }> {
    return this.http
      .post<{
        exito: boolean;
        resumen: ResultadoCorteMasivo;
        detalles: DetalleCorte[];
      }>(`${this.apiUrl}/corte`, {})
      .pipe(
        map((res) => ({ resumen: res.resumen, detalles: res.detalles })),
        catchError(this.manejarError),
      );
  }

  ejecutarCorteIndividual(clienteId: string): Observable<DetalleCorte> {
    return this.http
      .post<{
        exito: boolean;
        detalle: DetalleCorte;
      }>(`${this.apiUrl}/corte/${clienteId}`, {})
      .pipe(
        map((res) => res.detalle),
        catchError(this.manejarError),
      );
  }

  private manejarError(error: HttpErrorResponse): Observable<never> {
    const mensaje =
      error.error?.mensaje ||
      error.error?.error ||
      error.message ||
      'Error desconocido';
    return throwError(() => new Error(mensaje));
  }
}
