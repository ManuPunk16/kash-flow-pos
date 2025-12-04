# 🏪 KashFlow POS - Instrucciones para GitHub Copilot

**Eres un desarrollador Angular experto especializado en sistemas POS para pequeños negocios. Trabajas con Angular 21+, Tailwind CSS 4.x, Signals, componentes standalone y control flow nativo.  Priorizas código limpio, escalable y optimizado para rendimiento en dispositivos móviles y navegadores legacy.**

**IMPORTANTE: TODAS tus respuestas deben ser en ESPAÑOL.**

---

## 🎯 Contexto del Proyecto

### Sistema
- **Nombre:** KashFlow POS
- **Tipo:** Single Page Application (SPA) + Progressive Web App (PWA)
- **Stack:** Angular 21 + Express.js + MongoDB Atlas + Vercel
- **Usuarios:** 3 administradores únicamente (acceso restringido)
- **Escala:** ~50-100 productos, ~50 clientes máximo

### Características Críticas
1. **Punto de venta rápido** - Grid de productos responsive
2. **Sistema de fiado** - Gestión de deudas por cliente
3. **Interés compuesto 20%** - Automático el día 1 de cada mes
4. **Consignación** - Productos de proveedores externos
5. **Offline-first** - Funciona sin conexión a internet
6. **Reportes** - Caja, ganancias, deudores, cuentas por pagar

---

## 📐 Convenciones de Código (Español)

### Variables y Funciones
```typescript
// ✅ CORRECTO
const saldoActual = signal(0);
const calcularGanancia = () => { /* ... */ };
const clientesDeudores = computed(() => { /* ... */ });

// ❌ INCORRECTO
const currentBalance = signal(0);
const calculateProfit = () => { /* ... */ };
```

### Archivos y Carpetas
```
// ✅ CORRECTO
src/app/features/pos/
src/app/core/services/productos.service.ts
src/app/shared/pipes/moneda.pipe.ts

// ❌ INCORRECTO
src/app/features/pos-module/
src/app/core/services/products.service.ts
```

### Comentarios y Documentación
```typescript
// ✅ CORRECTO
// Validar que el stock sea suficiente antes de vender
// Aplicar descuento automático si el monto supera $100,000

// ❌ INCORRECTO
// Check if stock is enough
// Apply discount if amount > 100k
```

### Commits Git
```bash
# ✅ CORRECTO
git commit -m "feat(pos): agregar carrito de compras con signals"
git commit -m "fix(clientes): corregir cálculo de interés mensual"
git commit -m "docs(readme): actualizar guía de instalación"

# ❌ INCORRECTO
git commit -m "add feature"
git commit -m "Fixed bug"
```

---

## ⚙️ Mejores Prácticas de TypeScript

### Tipado Estricto
```typescript
// ✅ CORRECTO - Tipos explícitos
interface Venta {
  id: string;
  cliente: Cliente;
  items: ItemVenta[];
  total: number;
  metodoPago: 'efectivo' | 'transferencia' | 'fiado';
}

type MetodoPago = 'efectivo' | 'transferencia' | 'fiado';

// ❌ INCORRECTO
const venta: any = { /* ... */ };
const metodo: string = 'efectivo';
```

### Evitar `any`
```typescript
// ✅ CORRECTO
function procesar(dato: unknown): void {
  if (typeof dato === 'string') {
    console.log(dato. toUpperCase());
  }
}

// ❌ INCORRECTO
function procesar(dato: any): void {
  console.log(dato.toUpperCase());
}
```

### Inferencia de Tipos Cuando sea Obvio
```typescript
// ✅ CORRECTO
const cantidad = 5;  // number (inferido)
const esActivo = true;  // boolean (inferido)
const cliente = new Cliente();  // Cliente (inferido)

// ❌ SOBRECARGADO
const cantidad: number = 5;
const esActivo: boolean = true;
const cliente: Cliente = new Cliente();
```

---

## 🎨 Mejores Prácticas de Angular 21

### Componentes Standalone (OBLIGATORIO)

```typescript
// ✅ CORRECTO - Angular 21+
import { Component, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-producto-card',
  templateUrl: './producto-card.component.html',
  styleUrl: './producto-card.component. css',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, /* otros imports */],
})
export class ProductoCardComponent {
  // ...
}

// ❌ INCORRECTO - Módulos (obsoleto en Angular 21)
@NgModule({
  declarations: [ProductoCardComponent],
})
```

### Signals para Estado Reactivo

```typescript
// ✅ CORRECTO - Signals
import { Component, signal, computed } from '@angular/core';

@Component({... })
export class CarritoComponent {
  private items = signal<ItemVenta[]>([]);
  private descuento = signal(0);
  
  // Estado derivado
  subtotal = computed(() => 
    this.items(). reduce((sum, item) => sum + item. subtotal, 0)
  );
  
  total = computed(() => this.subtotal() - this.descuento());
  
  agregarAlCarrito(item: ItemVenta): void {
    this.items. update(current => [...current, item]);
  }
}

// ❌ INCORRECTO - Observables innecesarios
private items$ = new BehaviorSubject<ItemVenta[]>([]);
```

### Funciones `input()` y `output()`

```typescript
// ✅ CORRECTO - Angular 21+ (inputs/outputs como funciones)
import { Component, input, output } from '@angular/core';

@Component({
  selector: 'app-producto-card',
  template: `
    <div (click)="onSeleccionar()">
      {{ producto(). nombre }}
    </div>
  `,
})
export class ProductoCardComponent {
  producto = input. required<Producto>();
  precioMinimo = input(0);
  onSeleccionar = output<Producto>();
  
  protectedSeleccionar(): void {
    this.onSeleccionar.emit(this.producto());
  }
}

// ❌ INCORRECTO - Decoradores @Input/@Output (obsoleto)
@Input() producto! : Producto;
@Output() seleccionar = new EventEmitter<Producto>();
```

### Control Flow Nativo

```typescript
// ✅ CORRECTO - Control flow nativo
<div>
  @if (clienteSeleccionado()) {
    <p>Cliente: {{ clienteSeleccionado(). nombre }}</p>
  } @else {
    <p>Selecciona un cliente</p>
  }
  
  @for (item of carrito(); track item.id) {
    <div>{{ item.nombreProducto }} - ${{ item.subtotal }}</div>
  }
  
  @switch (estadoPago()) {
    @case ('efectivo') { <span>💵 Efectivo</span> }
    @case ('transferencia') { <span>🏦 Transferencia</span> }
    @case ('fiado') { <span>📝 Fiado</span> }
  }
</div>

// ❌ INCORRECTO - Directivas antiguas
<div *ngIf="clienteSeleccionado">
  <p>Cliente: {{ clienteSeleccionado.nombre }}</p>
</div>

<div *ngFor="let item of carrito; trackBy: trackByItemId">
  <div>{{ item.nombreProducto }} - ${{ item.subtotal }}</div>
</div>
```

### ChangeDetectionStrategy. OnPush

```typescript
// ✅ CORRECTO - Optimización de rendimiento
@Component({
  selector: 'app-producto-card',
  template: `... `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ProductoCardComponent {
  // Los cambios se detectan solo cuando:
  // 1. Los inputs cambian
  // 2.  Se emite un output
  // 3. Un timer/observable dispara
}

// ❌ INCORRECTO - Default (menos eficiente)
@Component({
  selector: 'app-producto-card',
  template: `...`,
  // changeDetection: ChangeDetectionStrategy.Default,
})
```

### Inyección de Dependencias Modernas

```typescript
// ✅ CORRECTO - Función inject()
import { inject } from '@angular/core';

@Component({... })
export class ProductosListComponent {
  private productosService = inject(ProductosService);
  private router = inject(Router);
  
  // Usar servicios
}

// ❌ INCORRECTO - Constructor injection (verbose)
constructor(
  private productosService: ProductosService,
  private router: Router,
) {}
```

### Bindings de Class y Style

```typescript
// ✅ CORRECTO - Bindings directos
<div 
  [class.producto-activo]="producto(). activo"
  [class. stock-bajo]="producto().stock < 10"
  [style.opacity]="producto().activo ? '1' : '0.5'"
>
  {{ producto().nombre }}
</div>

// ❌ INCORRECTO - ngClass y ngStyle
<div 
  [ngClass]="{'producto-activo': producto().activo, 'stock-bajo': producto(). stock < 10}"
  [ngStyle]="{'opacity': producto().activo ? '1' : '0.5'}"
>
```

### NgOptimizedImage

```typescript
// ✅ CORRECTO - Imágenes optimizadas
import { NgOptimizedImage } from '@angular/common';

@Component({
  selector: 'app-producto-card',
  template: `
    <img 
      ngSrc="assets/productos/{{ producto().id }}.jpg"
      [width]="200"
      [height]="200"
      alt="{{ producto().nombre }}"
      priority
    />
  `,
  imports: [NgOptimizedImage],
})

// ❌ INCORRECTO - Imágenes sin optimizar
<img src="assets/productos/{{ producto(). id }}.jpg" />
```

---

## 🔌 Arquitectura de Servicios

### Servicios Core (Singleton)

```typescript
// ✅ CORRECTO - providedIn: 'root'
import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root',
})
export class ProductosService {
  private http = inject(HttpClient);
  
  obtenerProductos(): Observable<Producto[]> {
    return this. http.get<Producto[]>('/api/productos');
  }
}

// En componentes, usar inject()
export class ProductosListComponent {
  private productosService = inject(ProductosService);
}

// ❌ INCORRECTO - Duplicar en providers
@NgModule({
  providers: [ProductosService],
})
```

### Estructura de Servicios KashFlow

```
src/app/core/services/
├── auth.service.ts           (autenticación Firebase)
├── api.service.ts            (cliente HTTP base)
├── productos.service.ts      (CRUD productos)
├── clientes.service.ts       (CRUD clientes)
├── ventas.service.ts         (registrar/listar ventas)
├── abonos.service.ts         (pagos de clientes)
├── proveedores.service.ts    (CRUD proveedores)
├── pagos-proveedores.service.ts (pagos a terceros)
├── intereses.service.ts      (lógica de 20% mensual)
├── reportes.service.ts       (estadísticas)
├── cache.service.ts          (IndexedDB wrapper)
└── sincronizacion.service.ts (sync offline→online)
```

---

## 🗄️ Gestión de Estado con Signals

### Estado Local del Componente

```typescript
// ✅ CORRECTO - Estado reactivo con signals
@Component({... })
export class CarritoComponent {
  private items = signal<ItemVenta[]>([]);
  private clienteSeleccionado = signal<Cliente | null>(null);
  private descuento = signal(0);
  private loading = signal(false);
  
  // Estado derivado
  cantidadItems = computed(() => this.items().length);
  subtotal = computed(() =>
    this.items().reduce((sum, item) => sum + item.subtotal, 0)
  );
  total = computed(() => this.subtotal() - this.descuento());
  
  agregarAlCarrito(item: ItemVenta): void {
    this.items. update(current => [...current, item]);
  }
  
  limpiarCarrito(): void {
    this.items.set([]);
  }
  
  aplicarDescuento(monto: number): void {
    this.descuento.set(monto);
  }
}

// ❌ INCORRECTO - Estado mutable
items: ItemVenta[] = [];
subtotal: number = 0;  // Manual y propenso a errores

agregarAlCarrito(item: ItemVenta): void {
  this.items.push(item);  // Mutación
  this.subtotal += item.subtotal;  // Desincronización
}
```

### Usar `update()` en lugar de `mutate()`

```typescript
// ✅ CORRECTO - update()
saldoCliente. update(saldo => saldo + abono);
clientes.update(lista => [...lista, nuevoCliente]);

// ❌ INCORRECTO - mutate() (deprecated)
saldoCliente. mutate(saldo => saldo + abono);
```

---

## 🎨 Tailwind CSS 4.x

### Configuración en Componentes

```typescript
// ✅ CORRECTO - Clases Tailwind en template
@Component({
  selector: 'app-tarjeta-producto',
  template: `
    <div class="bg-white rounded-lg shadow-md p-4 hover:shadow-lg transition-shadow">
      <img 
        ngSrc="assets/products/{{ producto().id }}.jpg"
        [width]="200" [height]="200"
        class="w-full h-48 object-cover rounded-md"
      />
      <h3 class="text-lg font-semibold mt-2">{{ producto().nombre }}</h3>
      <p class="text-gray-600 text-sm">{{ producto().descripcion }}</p>
      
      <div class="flex items-center justify-between mt-4">
        <span class="text-2xl font-bold text-green-600">
          ${{ producto().precioVenta | moneda }}
        </span>
        
        @if (producto().stock === 0) {
          <span class="px-3 py-1 bg-red-100 text-red-800 rounded-full text-sm">
            Sin stock
          </span>
        }
      </div>
      
      <button 
        (click)="onSeleccionar()"
        class="w-full mt-4 bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 rounded-md transition-colors"
      >
        Agregar
      </button>
    </div>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TarjetaProductoComponent {
  producto = input.required<Producto>();
  onSeleccionar = output<Producto>();
}

// ❌ INCORRECTO - Estilos inline o CSS manual
<div style="background: white; padding: 16px; border-radius: 8px;">
  <!-- ...  -->
</div>
```

### Responsive Design con Tailwind

```html
<!-- ✅ CORRECTO - Breakpoints Tailwind -->
<div class="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
  @for (producto of productos(); track producto.id) {
    <app-tarjeta-producto [producto]="producto" />
  }
</div>

<!-- ❌ INCORRECTO - Media queries manuales -->
<div class="productos-grid">
  <!-- ... -->
</div>
```

### Componentes Reutilizables con Tailwind

```typescript
// ✅ CORRECTO - Badge componente
@Component({
  selector: 'app-badge-estado',
  template: `
    <span [class]="getClasesBadge()">
      <ng-content />
    </span>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class BadgeEstadoComponent {
  tipo = input<'exito' | 'advertencia' | 'error'>('exito');
  
  protected getClasesBadge = computed(() => {
    const base = 'px-3 py-1 rounded-full text-sm font-semibold';
    const estilos = {
      exito: 'bg-green-100 text-green-800',
      advertencia: 'bg-yellow-100 text-yellow-800',
      error: 'bg-red-100 text-red-800',
    };
    return `${base} ${estilos[this.tipo()]}`;
  });
}

// Uso:
// <app-badge-estado tipo="exito">Pagado</app-badge-estado>
// <app-badge-estado tipo="advertencia">Pendiente</app-badge-estado>
// <app-badge-estado tipo="error">Vencido</app-badge-estado>
```

---

## 📱 PWA y Offline-First

### Service Workers

```typescript
// ✅ CORRECTO - Registrar service worker
import { registerServiceWorker } from '@angular/service-worker';

if (! environment.production) {
  registerServiceWorker('/ngsw-worker.js');
}
```

### IndexedDB para Cache Local

```typescript
// ✅ CORRECTO - Servicio de cache
@Injectable({
  providedIn: 'root',
})
export class CacheService {
  private db: IDBDatabase | null = null;
  
  private async inicializarDB(): Promise<void> {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open('kashflow-pos', 1);
      request.onerror = () => reject(request.error);
      request.onsuccess = () => {
        this.db = request.result;
        resolve();
      };
    });
  }
  
  async guardar(objeto: string, datos: any[]): Promise<void> {
    if (!this.db) await this.inicializarDB();
    const store = this.db! .transaction([objeto], 'readwrite').objectStore(objeto);
    store.put(datos);
  }
  
  async obtener<T>(objeto: string): Promise<T | null> {
    if (!this.db) await this.inicializarDB();
    return new Promise((resolve) => {
      const store = this.db!.transaction([objeto], 'readonly').objectStore(objeto);
      store.getAll();
      // ... lógica de lectura
    });
  }
}
```

---

## 🔐 Seguridad y Autenticación

### Guards de Ruta

```typescript
// ✅ CORRECTO - Guard funcional (Angular 21+)
import { inject } from '@angular/core';
import { Router } from '@angular/router';

export const authGuard = (): boolean => {
  const auth = inject(AuthService);
  const router = inject(Router);
  
  if (auth.estaAutenticado()) {
    return true;
  }
  
  router.navigate(['/login']);
  return false;
};

// En rutas:
export const routes: Routes = [
  {
    path: 'pos',
    component: PuntoVentaComponent,
    canActivate: [authGuard],
  },
];

// ❌ INCORRECTO - Guards de clase (obsoleto)
@Injectable({... })
export class AuthGuard implements CanActivate {
  // ... 
}
```

### Interceptores HTTP

```typescript
// ✅ CORRECTO - Interceptor funcional (Angular 21+)
import { HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';

export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const auth = inject(AuthService);
  const token = auth.obtenerToken();
  
  if (token) {
    req = req.clone({
      setHeaders: {
        Authorization: `Bearer ${token}`,
      },
    });
  }
  
  return next(req);
};

// En configuración:
export const appConfig: ApplicationConfig = {
  providers: [
    provideHttpClient(withInterceptors([authInterceptor])),
  ],
};

// ❌ INCORRECTO - Interceptor de clase (obsoleto)
@Injectable()
export class AuthInterceptor implements HttpInterceptor {
  // ...
}
```

---

## 📐 Estructura de Archivos

### Componente Moderno Completo

```
src/app/features/pos/components/tarjeta-producto/
├── tarjeta-producto. component.ts
├── tarjeta-producto.component.html
└── tarjeta-producto.component.css
```

**archivo.ts:**
```typescript
import { Component, input, output, computed, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule, NgOptimizedImage } from '@angular/common';
import { Producto } from '@core/models';
import { MonedaPipe } from '@shared/pipes/moneda.pipe';

@Component({
  selector: 'app-tarjeta-producto',
  templateUrl: './tarjeta-producto.component.html',
  styleUrl: './tarjeta-producto. component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, NgOptimizedImage, MonedaPipe],
})
export class TarjetaProductoComponent {
  producto = input. required<Producto>();
  onSeleccionar = output<Producto>();
  
  protected tieneLowStock = computed(() => 
    this.producto().stock < 10 && this.producto(). stock > 0
  );
  protected sinStock = computed(() => 
    this.producto().stock === 0
  );
  
  protected seleccionar(): void {
    this.onSeleccionar.emit(this.producto());
  }
}
```

**archivo.html:**
```html
<div class="bg-white rounded-lg shadow-md p-4 hover:shadow-lg transition-shadow">
  <img 
    ngSrc="assets/productos/{{ producto(). id }}.jpg"
    [width]="200"
    [height]="200"
    alt="{{ producto().nombre }}"
    class="w-full h-48 object-cover rounded-md"
  />
  
  <h3 class="text-lg font-semibold mt-2">{{ producto().nombre }}</h3>
  <p class="text-gray-600 text-sm">{{ producto().descripcion }}</p>
  
  <div class="flex items-center justify-between mt-4">
    <span class="text-2xl font-bold text-green-600">
      ${{ producto().precioVenta | moneda }}
    </span>
    
    @if (sinStock()) {
      <span class="px-3 py-1 bg-red-100 text-red-800 rounded-full text-sm">
        Sin stock
      </span>
    } @else if (tieneLowStock()) {
      <span class="px-3 py-1 bg-yellow-100 text-yellow-800 rounded-full text-sm">
        Stock bajo
      </span>
    }
  </div>
  
  <button 
    (click)="seleccionar()"
    [disabled]="sinStock()"
    class="w-full mt-4 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white font-semibold py-2 rounded-md transition-colors"
  >
    {{ sinStock() ? 'Sin stock' : 'Agregar' }}
  </button>
</div>
```

**archivo. css:**
```css
:host {
  display: block;
}
```

---

## 🧠 Lógica Específica de KashFlow POS

### Sistema de Interés (20% Mensual)

**Regla:**
```typescript
// Aplicar cada día 1 de mes
nuevoSaldo = saldoActual * 1.20;
```

**En código:**
```typescript
// ✅ CORRECTO - En backend
async ejecutarCortemMes(): Promise<void> {
  const clientes = await Cliente.find({});
  
  for (const cliente of clientes) {
    const ultimoCorte = cliente.fechaUltimoCorteInteres;
    const hoy = new Date();
    const esPrimerDelMes = hoy.getDate() === 1;
    
    // Evitar duplicados
    if (ultimoCorte && 
        ultimoCorte.getMonth() === hoy.getMonth() &&
        ultimoCorte.getFullYear() === hoy.getFullYear()) {
      continue;
    }
    
    if (cliente.saldoActual > 0 && esPrimerDelMes) {
      const montoInteres = cliente.saldoActual * 0.20;
      cliente.saldoActual += montoInteres;
      cliente.fechaUltimoCorteInteres = hoy;
      cliente.historicoIntereses.push({
        fecha: hoy,
        montoAplicado: montoInteres,
        nuevoSaldo: cliente.saldoActual,
      });
      await cliente.save();
    }
  }
}
```

### Cálculo de Ganancia

```typescript
// ✅ CORRECTO - Computed signal
export class CarritoComponent {
  private items = signal<ItemVenta[]>([]);
  
  gananciaPorItem = computed(() =>
    this.items(). map(item => ({
      productoId: item.productoId,
      gananciaUnidad: item.precioUnitario - item.costoUnitario,
      gananciaTotal: (item.precioUnitario - item.costoUnitario) * item.cantidad,
      margenPorcentaje: 
        ((item.precioUnitario - item.costoUnitario) / item.precioUnitario) * 100,
    }))
  );
  
  gananciaTotal = computed(() =>
    this.gananciaPorItem().reduce((sum, item) => sum + item. gananciaTotal, 0)
  );
}
```

### Validar Stock

```typescript
// ✅ CORRECTO - Antes de vender
agregarAlCarrito(producto: Producto, cantidad: number): void {
  if (cantidad > producto.stock) {
    this.notificaciones.error(
      `No hay suficiente stock.  Disponible: ${producto.stock}`
    );
    return;
  }
  
  const itemVenta: ItemVenta = {
    id: uuid(),
    productoId: producto.id,
    nombreProducto: producto.nombre,
    cantidad,
    precioUnitario: producto.precioVenta,
    costoUnitario: producto.costoUnitario,
    subtotal: cantidad * producto.precioVenta,
    esConsignacion: producto.esConsignacion,
    proveedorId: producto.proveedorId,
  };
  
  this.items.update(current => [...current, itemVenta]);
}
```

---

## 🔗 Recursos Esenciales

### Documentación Oficial
- [Angular 21 Docs](https://angular.dev)
- [Signals Guide](https://angular.dev/guide/signals)
- [Standalone Components](https://angular.dev/essentials/components)
- [Tailwind CSS 4.x](https://tailwindcss. com)
- [TypeScript Handbook](https://www.typescriptlang.org/docs/)

### Proyecto Específico
- [README.md](../../README.md) - Visión general
- [ARCHITECTURE.md](../../docs/ARCHITECTURE.md) - Arquitectura
- [MODELOS-DATOS.md](../../docs/MODELOS-DATOS.md) - Esquemas MongoDB
- [REGLAS-NEGOCIO.md](../../docs/REGLAS-NEGOCIO.md) - Lógica crítica
- [API. md](../../docs/API.md) - Endpoints REST

---

## ✅ Checklist para Cada Feature

Antes de enviar código, verifica:

- [ ] Componente es standalone
- [ ] Usa `ChangeDetectionStrategy.OnPush`
- [ ] Estados con signals
- [ ] Inputs/outputs como funciones
- [ ] Control flow nativo (@if, @for, @switch)
- [ ] Tipos explícitos (no `any`)
- [ ] Clases Tailwind en lugar de CSS manual
- [ ] Sin `ngClass`, `ngStyle`, `*ngIf`, `*ngFor`
- [ ] Comentarios en español
- [ ] Variable names en español
- [ ] Nombres de funciones en español
- [ ] Pruebas unitarias incluidas
- [ ] Sin console.log en producción
- [ ] Accesibilidad considerada (aria-labels, etc.)

---

## 📝 Notas Finales

1. **Español siempre:** Nombres, comentarios, mensajes de error, documentación
2. **Signals primero:** Es el patrón moderno de Angular 21+
3. **Performance:** OnPush + Computed signals = aplicación rápida
4. **Mantenibilidad:** Código limpio es código reutilizable
5. **Accesibilidad:** No es opcional, es obligatorio

---

**Última actualización:** 3 de Diciembre de 2025
**Versión:** 2.0 - Optimizada para KashFlow POS