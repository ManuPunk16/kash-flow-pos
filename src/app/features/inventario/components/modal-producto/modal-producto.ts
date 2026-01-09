import {
  Component,
  ChangeDetectionStrategy,
  input,
  output,
  signal,
  computed,
  inject,
  effect,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  FormBuilder,
  FormGroup,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';

// Modelos
import { Producto } from '@core/models/producto.model';
import { Proveedor } from '@core/models/proveedor.model';

// Enums
import { CategoriaProducto, CATEGORIAS_PRODUCTO_CATALOGO } from '@core/enums';

// Servicios
import { CodigosBarrasService } from '@core/services/codigos-barras.service';

interface FormularioProducto {
  nombre: string;
  codigoBarras: string;
  descripcion: string;
  categoria: CategoriaProducto;
  precioVenta: number;
  costoUnitario: number;
  stock: number;
  stockMinimo: number;
  esConsignacion: boolean;
  proveedorId: string | null;
  activo: boolean;
}

@Component({
  selector: 'app-modal-producto',
  templateUrl: './modal-producto.html',
  styleUrl: './modal-producto.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, ReactiveFormsModule],
})
export class ModalProductoComponent {
  private readonly fb = inject(FormBuilder);
  private readonly codigosBarrasService = inject(CodigosBarrasService);

  // Inputs
  producto = input<Producto | null>(null);
  proveedores = input<Proveedor[]>([]);

  // Outputs
  onCerrar = output<void>();
  onGuardar = output<FormularioProducto>();

  // Estado local
  protected readonly guardando = signal(false);
  protected readonly errorValidacion = signal<string | null>(null);

  // Categorías disponibles
  protected readonly CATEGORIAS = CATEGORIAS_PRODUCTO_CATALOGO;

  // Modo de edición
  protected readonly modoEdicion = computed(() => this.producto() !== null);

  // Formulario reactivo
  protected readonly formulario: FormGroup;

  // Margen de ganancia calculado
  protected readonly margenGanancia = computed(() => {
    const precioVenta = this.formulario.get('precioVenta')?.value || 0;
    const costoUnitario = this.formulario.get('costoUnitario')?.value || 0;

    if (precioVenta === 0 || costoUnitario === 0) {
      return 0;
    }

    return ((precioVenta - costoUnitario) / precioVenta) * 100;
  });

  // Ganancia en pesos
  protected readonly gananciaPesos = computed(() => {
    const precioVenta = this.formulario.get('precioVenta')?.value || 0;
    const costoUnitario = this.formulario.get('costoUnitario')?.value || 0;

    return precioVenta - costoUnitario;
  });

  // Consignación activada
  protected readonly esConsignacion = signal(false);

  constructor() {
    // Inicializar formulario
    this.formulario = this.fb.group({
      nombre: ['', [Validators.required, Validators.minLength(3)]],
      empresa: [''],
      codigoBarras: [''],
      descripcion: ['', [Validators.required, Validators.minLength(10)]],
      categoria: [CategoriaProducto.OTROS, Validators.required],
      precioVenta: [0, [Validators.required, Validators.min(0)]],
      costoUnitario: [0, [Validators.required, Validators.min(0)]],
      stock: [0, [Validators.required, Validators.min(0)]],
      stockMinimo: [5, [Validators.required, Validators.min(0)]],
      esConsignacion: [false],
      proveedorId: [null],
      activo: [true],
    });

    // Effect para cargar datos del producto en modo edición
    effect(() => {
      const prod = this.producto();
      if (prod) {
        this.formulario.patchValue({
          nombre: prod.nombre,
          codigoBarras: prod.codigoBarras || '',
          descripcion: prod.descripcion,
          categoria: prod.categoria,
          precioVenta: prod.precioVenta,
          costoUnitario: prod.costoUnitario,
          stock: prod.stock,
          stockMinimo: prod.stockMinimo,
          esConsignacion: prod.esConsignacion,
          proveedorId: prod.proveedorId || null,
          activo: prod.activo,
        });

        this.esConsignacion.set(prod.esConsignacion);
      }
    });

    // Effect para manejar consignación
    effect(() => {
      const esConsig = this.esConsignacion();
      const proveedorControl = this.formulario.get('proveedorId');

      if (esConsig) {
        proveedorControl?.setValidators([Validators.required]);
      } else {
        proveedorControl?.clearValidators();
        proveedorControl?.setValue(null);
      }

      proveedorControl?.updateValueAndValidity();
    });
  }

  protected cerrar(): void {
    this.onCerrar.emit();
  }

  protected guardar(): void {
    if (this.formulario.invalid) {
      this.errorValidacion.set(
        'Por favor completa todos los campos requeridos'
      );
      this.formulario.markAllAsTouched();
      return;
    }

    // Validar margen de ganancia
    if (this.gananciaPesos() < 0) {
      this.errorValidacion.set(
        'El precio de venta debe ser mayor al costo unitario'
      );
      return;
    }

    this.guardando.set(true);
    this.errorValidacion.set(null);

    const datos: FormularioProducto = this.formulario.value;
    this.onGuardar.emit(datos);
  }

  protected generarCodigoBarras(): void {
    const codigo = this.codigosBarrasService.generarCodigoBarras();
    this.formulario.patchValue({ codigoBarras: codigo });
  }

  protected toggleConsignacion(): void {
    this.esConsignacion.update((v) => !v);
    this.formulario.patchValue({ esConsignacion: this.esConsignacion() });
  }

  protected obtenerEmojiCategoria(categoria: CategoriaProducto): string {
    return (
      CATEGORIAS_PRODUCTO_CATALOGO.find((c) => c.valor === categoria)?.emoji ||
      '📦'
    );
  }

  protected esInvalido(campo: string): boolean {
    const control = this.formulario.get(campo);
    return !!(control?.invalid && (control?.touched || control?.dirty));
  }

  protected obtenerError(campo: string): string {
    const control = this.formulario.get(campo);
    if (!control?.errors) return '';

    if (control.errors['required']) return 'Campo requerido';
    if (control.errors['minlength'])
      return `Mínimo ${control.errors['minlength'].requiredLength} caracteres`;
    if (control.errors['min'])
      return `Valor mínimo: ${control.errors['min'].min}`;

    return 'Valor inválido';
  }

  protected formatearMoneda(valor: number): string {
    return new Intl.NumberFormat('es-MX', {
      style: 'currency',
      currency: 'MXN',
      minimumFractionDigits: 2,
    }).format(valor);
  }
}
