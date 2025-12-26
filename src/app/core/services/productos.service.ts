import { Injectable, signal } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiService, ApiResponse } from './api.service';
import { Producto } from '../models/producto.model';

@Injectable({
  providedIn: 'root',
})
export class ProductosService extends ApiService {
  private readonly productosCargados = signal<Producto[]>([]);

  obtenerTodos(): Observable<ApiResponse<Producto>> {
    return this.get<Producto>('/productos');
  }

  buscar(query: string): Observable<ApiResponse<Producto>> {
    return this.get<Producto>(`/productos/buscar?q=${query}`);
  }

  validarStock(
    id: string,
    cantidad: number
  ): Observable<ApiResponse<{ disponible: boolean; stockActual: number }>> {
    return this.get(`/productos/validar-stock/${id}?cantidad=${cantidad}`);
  }

  registroRapido(
    codigoBarras: string,
    cantidad: number = 1
  ): Observable<ApiResponse<Producto>> {
    return this.post<Producto>('/productos/registro-rapido', {
      codigoBarras,
      cantidad,
    });
  }
}
