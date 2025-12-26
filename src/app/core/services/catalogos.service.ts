import { Injectable, inject, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, tap } from 'rxjs';
import { environment } from '@environments/environment';
import {
  CATEGORIAS_PRODUCTO_CATALOGO,
  METODOS_PAGO_CATALOGO,
  ESTADOS_VENTA_CATALOGO,
  CATEGORIAS_EGRESO_CATALOGO,
  ROLES_USUARIO_CATALOGO,
  type CategoriaProductoInfo,
  type MetodoPagoInfo,
  type EstadoVentaInfo,
  type CategoriaEgresoInfo,
  type RolUsuarioInfo,
} from '@core/enums';

interface CatalogosAPI {
  productos: Record<string, CategoriaProductoInfo>;
  egresos: Record<string, CategoriaEgresoInfo>;
  metodosPago: Record<string, MetodoPagoInfo>;
  estadosVenta: Record<string, EstadoVentaInfo>;
  roles: Record<string, RolUsuarioInfo>;
}

interface RespuestaAPI<T> {
  exito: boolean;
  datos?: T;
  mensaje?: string;
}

@Injectable({
  providedIn: 'root',
})
export class CatalogosService {
  private readonly http = inject(HttpClient);
  private readonly apiUrl = `${environment.apiUrl}/categorias`;

  // ✅ Catálogos locales (fallback)
  private readonly catalogosLocales: CatalogosAPI = {
    productos: Object.fromEntries(
      CATEGORIAS_PRODUCTO_CATALOGO.map((c) => [c.valor, c])
    ),
    egresos: Object.fromEntries(
      CATEGORIAS_EGRESO_CATALOGO.map((c) => [c.valor, c])
    ),
    metodosPago: Object.fromEntries(
      METODOS_PAGO_CATALOGO.map((m) => [m.valor, m])
    ),
    estadosVenta: Object.fromEntries(
      ESTADOS_VENTA_CATALOGO.map((e) => [e.valor, e])
    ),
    roles: Object.fromEntries(ROLES_USUARIO_CATALOGO.map((r) => [r.valor, r])),
  };

  // Estado reactivo
  private readonly catalogosCache = signal<CatalogosAPI>(this.catalogosLocales);
  readonly catalogos = this.catalogosCache.asReadonly();

  /**
   * Obtener todos los catálogos del backend
   * (Opcional: sincronización con backend)
   */
  obtenerCatalogos(): Observable<RespuestaAPI<CatalogosAPI>> {
    return this.http.get<RespuestaAPI<CatalogosAPI>>(this.apiUrl).pipe(
      tap((respuesta) => {
        if (respuesta.exito && respuesta.datos) {
          this.catalogosCache.set(respuesta.datos);
          console.log('✅ Catálogos sincronizados con backend');
        }
      })
    );
  }

  /**
   * Obtener catálogo de productos
   */
  obtenerCategoriasProducto(): readonly CategoriaProductoInfo[] {
    return CATEGORIAS_PRODUCTO_CATALOGO;
  }

  /**
   * Obtener catálogo de egresos
   */
  obtenerCategoriasEgreso(): readonly CategoriaEgresoInfo[] {
    return CATEGORIAS_EGRESO_CATALOGO;
  }

  /**
   * Obtener métodos de pago
   */
  obtenerMetodosPago(): readonly MetodoPagoInfo[] {
    return METODOS_PAGO_CATALOGO;
  }

  /**
   * Obtener estados de venta
   */
  obtenerEstadosVenta(): readonly EstadoVentaInfo[] {
    return ESTADOS_VENTA_CATALOGO;
  }

  /**
   * Obtener roles de usuario
   */
  obtenerRoles(): readonly RolUsuarioInfo[] {
    return ROLES_USUARIO_CATALOGO;
  }
}
