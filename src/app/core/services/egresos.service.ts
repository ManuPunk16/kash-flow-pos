import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { Egreso, CrearEgresoDto } from '../models/egreso.model';

interface RespuestaApi<T> {
  exito: boolean;
  datos?: T;
  dato?: T;
  cantidad?: number;
  totalMonto?: number;
  mensaje?: string;
  error?: string;
}

@Injectable({
  providedIn: 'root',
})
export class EgresosService {
  private readonly http = inject(HttpClient);
  private readonly apiUrl = `${environment.apiUrl}/egresos`;

  obtenerTodos(filtros?: {
    categoria?: string;
    aprobado?: boolean;
    fechaInicio?: string;
    fechaFin?: string;
  }): Observable<RespuestaApi<Egreso[]>> {
    let params = new HttpParams();

    if (filtros?.categoria) params = params.set('categoria', filtros.categoria);
    if (filtros?.aprobado !== undefined)
      params = params.set('aprobado', filtros.aprobado.toString());
    if (filtros?.fechaInicio)
      params = params.set('fechaInicio', filtros.fechaInicio);
    if (filtros?.fechaFin) params = params.set('fechaFin', filtros.fechaFin);

    return this.http.get<RespuestaApi<Egreso[]>>(this.apiUrl, { params });
  }

  obtenerPorId(id: string): Observable<RespuestaApi<Egreso>> {
    return this.http.get<RespuestaApi<Egreso>>(`${this.apiUrl}/${id}`);
  }

  obtenerResumen(): Observable<
    RespuestaApi<{
      totalMes: number;
      porCategoria: Array<{
        _id: string;
        total: number;
        cantidad: number;
      }>;
      mesActual: string;
    }>
  > {
    return this.http.get<
      RespuestaApi<{
        totalMes: number;
        porCategoria: Array<{ _id: string; total: number; cantidad: number }>;
        mesActual: string;
      }>
    >(`${this.apiUrl}/resumen`);
  }

  crear(egreso: CrearEgresoDto): Observable<RespuestaApi<Egreso>> {
    return this.http.post<RespuestaApi<Egreso>>(this.apiUrl, egreso);
  }

  actualizar(
    id: string,
    datos: Partial<CrearEgresoDto>
  ): Observable<RespuestaApi<Egreso>> {
    return this.http.put<RespuestaApi<Egreso>>(`${this.apiUrl}/${id}`, datos);
  }

  aprobar(id: string): Observable<RespuestaApi<Egreso>> {
    return this.http.put<RespuestaApi<Egreso>>(`${this.apiUrl}/${id}`, {
      aprobado: true,
    });
  }

  eliminar(id: string): Observable<RespuestaApi<Egreso>> {
    return this.http.delete<RespuestaApi<Egreso>>(`${this.apiUrl}/${id}`);
  }
}
