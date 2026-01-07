import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root',
})
export class AlmacenamientoLocalService {
  /**
   * Guardar datos en LocalStorage
   */
  guardar<T>(clave: string, datos: T): void {
    try {
      const datosSerializados = JSON.stringify(datos);
      localStorage.setItem(clave, datosSerializados);
      console.log(`💾 Guardado en LocalStorage [${clave}]:`, datos);
    } catch (error) {
      console.error(`❌ Error al guardar en LocalStorage [${clave}]:`, error);
    }
  }

  /**
   * Obtener datos de LocalStorage
   */
  obtener<T>(clave: string): T | null {
    try {
      const datosSerializados = localStorage.getItem(clave);

      if (!datosSerializados) {
        return null;
      }

      const datos = JSON.parse(datosSerializados) as T;
      console.log(`📥 Leído de LocalStorage [${clave}]:`, datos);
      return datos;
    } catch (error) {
      console.error(`❌ Error al leer de LocalStorage [${clave}]:`, error);
      return null;
    }
  }

  /**
   * Eliminar datos de LocalStorage
   */
  eliminar(clave: string): void {
    try {
      localStorage.removeItem(clave);
      console.log(`🗑️ Eliminado de LocalStorage [${clave}]`);
    } catch (error) {
      console.error(`❌ Error al eliminar de LocalStorage [${clave}]:`, error);
    }
  }

  /**
   * Limpiar todo el LocalStorage
   */
  limpiarTodo(): void {
    try {
      localStorage.clear();
      console.log('🗑️ LocalStorage limpiado completamente');
    } catch (error) {
      console.error('❌ Error al limpiar LocalStorage:', error);
    }
  }

  /**
   * Verificar si existe una clave
   */
  existe(clave: string): boolean {
    return localStorage.getItem(clave) !== null;
  }
}
