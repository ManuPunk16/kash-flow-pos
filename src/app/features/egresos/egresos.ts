import {
  Component,
  signal,
  computed,
  inject,
  ChangeDetectionStrategy,
  OnInit,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { EgresosService } from '@core/services/egresos.service';
import { Egreso } from '@core/models/egreso.model';
import {
  CATEGORIAS_EGRESO_CATALOGO,
  obtenerInfoCategoriaEgreso,
  type CategoriaEgresoInfo,
} from '@core/enums';

@Component({
  selector: 'app-egresos',
  imports: [CommonModule],
  templateUrl: './egresos.html',
  styleUrl: './egresos.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Egresos implements OnInit {
  private readonly egresosService = inject(EgresosService);

  protected readonly egresos = signal<Egreso[]>([]);
  protected readonly loading = signal(false);
  protected readonly error = signal<string | null>(null);

  // Filtros
  protected readonly categoriaFiltro = signal<string | null>(null);
  protected readonly aprobadoFiltro = signal<boolean | null>(null);

  // ✅ Usar catálogo de enums
  protected readonly categorias: readonly CategoriaEgresoInfo[] =
    CATEGORIAS_EGRESO_CATALOGO;

  // Estado derivado
  protected readonly totalGastos = computed(() =>
    this.egresos().reduce((sum, e) => sum + e.monto, 0)
  );

  protected readonly gastosPendientes = computed(() =>
    this.egresos().filter((e) => !e.aprobado)
  );

  protected readonly gastosAprobados = computed(() =>
    this.egresos().filter((e) => e.aprobado)
  );

  protected readonly egresosFiltrados = computed(() => {
    let resultado = this.egresos();

    if (this.categoriaFiltro()) {
      resultado = resultado.filter(
        (e) => e.categoria === this.categoriaFiltro()
      );
    }

    if (this.aprobadoFiltro() !== null) {
      resultado = resultado.filter((e) => e.aprobado === this.aprobadoFiltro());
    }

    return resultado;
  });

  ngOnInit(): void {
    this.cargarEgresos();
  }

  private cargarEgresos(): void {
    this.loading.set(true);
    this.error.set(null);

    this.egresosService.obtenerTodos().subscribe({
      next: (respuesta) => {
        if (respuesta.exito && respuesta.datos) {
          this.egresos.set(respuesta.datos);
          console.log('✅ Egresos cargados:', respuesta.datos.length);
        }
      },
      error: (err) => {
        console.error('❌ Error al cargar egresos:', err);
        this.error.set('Error al cargar egresos');
      },
      complete: () => {
        this.loading.set(false);
      },
    });
  }

  protected aplicarFiltroCategoria(categoria: string | null): void {
    this.categoriaFiltro.set(categoria);
  }

  protected aplicarFiltroAprobado(aprobado: boolean | null): void {
    this.aprobadoFiltro.set(aprobado);
  }

  // ✅ NUEVO: Helper para truncar etiquetas de forma segura
  protected obtenerEtiquetaCorta(etiqueta: string): string {
    // Si la etiqueta es muy corta, retornarla completa
    if (etiqueta.length <= 6) {
      return etiqueta;
    }

    // Intentar quitar palabras comunes y tomar lo importante
    const palabrasEliminar = ['Gastos de', 'Pago de', 'Compra de'];
    let resultado = etiqueta;

    for (const palabra of palabrasEliminar) {
      resultado = resultado.replace(palabra, '').trim();
    }

    // Si aún es larga, truncar a 6 caracteres
    return resultado.length > 6 ? resultado.substring(0, 6) : resultado;
  }

  // ✅ Usar funciones de los enums
  protected obtenerIconoCategoria(categoria: string): string {
    const info = obtenerInfoCategoriaEgreso(categoria as any);
    return info?.icono || '📝';
  }

  protected obtenerNombreCategoria(categoria: string): string {
    const info = obtenerInfoCategoriaEgreso(categoria as any);
    return info?.etiqueta || categoria;
  }

  protected formatearFecha(fecha: Date): string {
    return new Date(fecha).toLocaleDateString('es-MX', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  }

  protected formatearMonto(monto: number): string {
    return new Intl.NumberFormat('es-MX', {
      style: 'currency',
      currency: 'MXN',
    }).format(monto);
  }
}

export default Egresos;
