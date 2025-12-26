import {
  Component,
  signal,
  computed,
  inject,
  ChangeDetectionStrategy,
  model,
  OnInit,
  OnDestroy,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterLink, RouterLinkActive } from '@angular/router';
import { AuthService } from '@core/services/auth.service';

interface ItemMenu {
  ruta: string;
  icono: string;
  etiqueta: string;
  badge?: number;
}

@Component({
  selector: 'app-sidebar',
  imports: [CommonModule, RouterLink, RouterLinkActive],
  templateUrl: './sidebar.html',
  styleUrl: './sidebar.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Sidebar implements OnInit, OnDestroy {
  private readonly authService = inject(AuthService);
  private readonly router = inject(Router);

  // ✅ Two-way binding con el layout
  sidebarAbierto = model(true);

  // ✅ Detección de móvil
  private readonly anchoPantalla = signal(
    typeof window !== 'undefined' ? window.innerWidth : 1024
  );
  protected readonly esMobile = computed(() => this.anchoPantalla() < 1024);

  protected readonly itemsMenu = signal<ItemMenu[]>([
    { ruta: '/pos', icono: '🛒', etiqueta: 'Punto de Venta' },
    { ruta: '/inventario', icono: '📦', etiqueta: 'Inventario', badge: 3 },
    { ruta: '/clientes', icono: '👥', etiqueta: 'Clientes' },
    { ruta: '/proveedores', icono: '🏢', etiqueta: 'Proveedores' },
    { ruta: '/egresos', icono: '💸', etiqueta: 'Egresos' },
    { ruta: '/reportes', icono: '📈', etiqueta: 'Reportes' },
    { ruta: '/configuracion', icono: '⚙️', etiqueta: 'Configuración' },
  ]);

  protected readonly emailUsuario = computed(
    () => this.authService.obtenerUsuarioActual()?.email || 'Usuario'
  );

  private resizeListener?: () => void;

  ngOnInit(): void {
    // ✅ Configuración inicial según tamaño de pantalla
    if (this.esMobile()) {
      this.sidebarAbierto.set(false);
    }

    // ✅ Listener para cambios de tamaño
    if (typeof window !== 'undefined') {
      this.resizeListener = () => {
        this.anchoPantalla.set(window.innerWidth);

        // Auto-cerrar en móvil
        if (this.esMobile() && this.sidebarAbierto()) {
          this.sidebarAbierto.set(false);
        }
      };

      window.addEventListener('resize', this.resizeListener);
    }
  }

  ngOnDestroy(): void {
    if (this.resizeListener && typeof window !== 'undefined') {
      window.removeEventListener('resize', this.resizeListener);
    }
  }

  protected alternarSidebar(): void {
    this.sidebarAbierto.update((actual) => !actual);
  }

  protected cerrarSidebarMobile(): void {
    if (this.esMobile()) {
      this.sidebarAbierto.set(false);
    }
  }

  protected manejarClickRuta(): void {
    // Cerrar sidebar en móvil al hacer clic en una ruta
    if (this.esMobile()) {
      this.sidebarAbierto.set(false);
    }
  }

  protected async cerrarSesion(): Promise<void> {
    const confirmar = confirm('¿Deseas cerrar sesión?');
    if (confirmar) {
      await this.authService.cerrarSesion();
    }
  }

  // ✅ Clases dinámicas para el sidebar
  protected obtenerClasesSidebar = computed(() => {
    const esMovil = this.esMobile();
    const abierto = this.sidebarAbierto();

    if (esMovil) {
      // Móvil: sidebar deslizable desde la izquierda
      return abierto
        ? 'w-64 translate-x-0 transition-transform duration-300'
        : 'w-64 -translate-x-full transition-transform duration-300';
    } else {
      // Desktop: sidebar colapsable
      return abierto
        ? 'w-64 transition-all duration-300'
        : 'w-20 transition-all duration-300';
    }
  });
}
