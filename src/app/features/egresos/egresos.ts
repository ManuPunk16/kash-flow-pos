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

  protected readonly categorias = [
    { valor: 'servicios', etiqueta: '💡 Servicios', icono: '💡' },
    { valor: 'nomina', etiqueta: '👨‍💼 Nómina', icono: '👨‍💼' },
    { valor: 'insumos', etiqueta: '📦 Insumos', icono: '📦' },
    { valor: 'mantenimiento', etiqueta: '🔧 Mantenimiento', icono: '🔧' },
    { valor: 'transporte', etiqueta: '🚗 Transporte', icono: '🚗' },
    { valor: 'otros', etiqueta: '📝 Otros', icono: '📝' },
  ];

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

  protected obtenerIconoCategoria(categoria: string): string {
    const cat = this.categorias.find((c) => c.valor === categoria);
    return cat?.icono || '📝';
  }

  protected obtenerNombreCategoria(categoria: string): string {
    const cat = this.categorias.find((c) => c.valor === categoria);
    return cat?.etiqueta || categoria;
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
