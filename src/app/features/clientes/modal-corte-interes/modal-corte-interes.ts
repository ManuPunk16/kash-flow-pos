import {
  Component,
  ChangeDetectionStrategy,
  signal,
  computed,
  inject,
  OnInit,
  output,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  InteresesService,
  DetalleClienteInteres,
  DetalleCorte,
  ResultadoCorteMasivo,
} from '@core/services/intereses.service';

type Fase = 'preview' | 'ejecutando' | 'resultado';

@Component({
  selector: 'app-modal-corte-interes',
  templateUrl: './modal-corte-interes.html',
  styleUrl: './modal-corte-interes.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule],
})
export class ModalCorteInteresComponent implements OnInit {
  private readonly interesesService = inject(InteresesService);

  onCerrar = output<void>();
  onCorteEjecutado = output<void>();

  protected readonly cargando = signal(false);
  protected readonly fase = signal<Fase>('preview');
  protected readonly error = signal<string | null>(null);

  // Datos del preview
  protected readonly mesActual = signal('');
  protected readonly clientesPendientes = signal<DetalleClienteInteres[]>([]);
  protected readonly totalProyectado = signal(0);
  protected readonly clientesYaConInteres = signal(0);

  // Datos del resultado
  protected readonly resultado = signal<ResultadoCorteMasivo | null>(null);
  protected readonly detallesCorte = signal<DetalleCorte[]>([]);

  protected readonly hayPendientes = computed(
    () => this.clientesPendientes().length > 0,
  );

  ngOnInit(): void {
    this.cargarResumen();
  }

  protected cargarResumen(): void {
    this.cargando.set(true);
    this.error.set(null);

    this.interesesService.obtenerResumen().subscribe({
      next: (respuesta) => {
        const pendientes = respuesta.detalleClientes.filter(
          (c) => !c.interesAplicado,
        );
        const yaConInteres = respuesta.detalleClientes.filter(
          (c) => c.interesAplicado,
        );

        this.mesActual.set(respuesta.resumen.mesActual);
        this.clientesPendientes.set(pendientes);
        this.totalProyectado.set(
          pendientes.reduce((sum, c) => sum + c.interesProyectado, 0),
        );
        this.clientesYaConInteres.set(yaConInteres.length);
        this.cargando.set(false);
      },
      error: (err: Error) => {
        this.error.set(err.message);
        this.cargando.set(false);
      },
    });
  }

  protected ejecutarCorte(): void {
    this.fase.set('ejecutando');

    this.interesesService.ejecutarCorteMasivo().subscribe({
      next: ({ resumen, detalles }) => {
        this.resultado.set(resumen);
        this.detallesCorte.set(detalles);
        this.fase.set('resultado');
        this.onCorteEjecutado.emit();
      },
      error: (err: Error) => {
        this.error.set(err.message);
        this.fase.set('preview');
      },
    });
  }

  protected cerrar(): void {
    this.onCerrar.emit();
  }
}
