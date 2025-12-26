import { Injectable, signal } from '@angular/core';

interface PreferenciasInventario {
  vistaActual: 'grid' | 'lista';
  itemsPorPagina: number;
  mostrarProveedores: boolean;
  mostrarCodigosBarras: boolean;
}

interface Preferencias {
  inventario: PreferenciasInventario;
  tema: 'claro' | 'oscuro';
  idioma: 'es' | 'en';
}

const PREFERENCIAS_DEFAULT: Preferencias = {
  inventario: {
    vistaActual: 'grid',
    itemsPorPagina: 20,
    mostrarProveedores: true,
    mostrarCodigosBarras: true,
  },
  tema: 'claro',
  idioma: 'es',
};

const STORAGE_KEY = 'kashflow-preferencias';

@Injectable({
  providedIn: 'root',
})
export class PreferenciasService {
  private readonly preferenciasSignal = signal<Preferencias>(
    this.cargarPreferencias()
  );

  readonly preferencias = this.preferenciasSignal.asReadonly();

  private cargarPreferencias(): Preferencias {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        // Merge con defaults para asegurar que existan todas las propiedades
        return {
          ...PREFERENCIAS_DEFAULT,
          ...parsed,
          inventario: {
            ...PREFERENCIAS_DEFAULT.inventario,
            ...parsed.inventario,
          },
        };
      }
    } catch (error) {
      console.error('❌ Error al cargar preferencias:', error);
    }
    return PREFERENCIAS_DEFAULT;
  }

  private guardarPreferencias(preferencias: Preferencias): void {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(preferencias));
      console.log('✅ Preferencias guardadas:', preferencias);
    } catch (error) {
      console.error('❌ Error al guardar preferencias:', error);
    }
  }

  actualizarVistaInventario(vista: 'grid' | 'lista'): void {
    const nuevasPreferencias: Preferencias = {
      ...this.preferenciasSignal(),
      inventario: {
        ...this.preferenciasSignal().inventario,
        vistaActual: vista,
      },
    };
    this.preferenciasSignal.set(nuevasPreferencias);
    this.guardarPreferencias(nuevasPreferencias);
  }

  actualizarMostrarProveedores(mostrar: boolean): void {
    const nuevasPreferencias: Preferencias = {
      ...this.preferenciasSignal(),
      inventario: {
        ...this.preferenciasSignal().inventario,
        mostrarProveedores: mostrar,
      },
    };
    this.preferenciasSignal.set(nuevasPreferencias);
    this.guardarPreferencias(nuevasPreferencias);
  }

  actualizarMostrarCodigosBarras(mostrar: boolean): void {
    const nuevasPreferencias: Preferencias = {
      ...this.preferenciasSignal(),
      inventario: {
        ...this.preferenciasSignal().inventario,
        mostrarCodigosBarras: mostrar,
      },
    };
    this.preferenciasSignal.set(nuevasPreferencias);
    this.guardarPreferencias(nuevasPreferencias);
  }

  restablecerPreferencias(): void {
    this.preferenciasSignal.set(PREFERENCIAS_DEFAULT);
    this.guardarPreferencias(PREFERENCIAS_DEFAULT);
  }
}
