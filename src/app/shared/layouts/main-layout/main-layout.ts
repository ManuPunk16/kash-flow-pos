import {
  Component,
  ChangeDetectionStrategy,
  signal,
  computed,
  OnInit,
  OnDestroy,
} from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { Sidebar } from '@shared/components/sidebar/sidebar';
import { MobileHeader } from '@shared/components/mobile-header/mobile-header';

@Component({
  selector: 'app-main-layout',
  imports: [RouterOutlet, Sidebar, MobileHeader],
  templateUrl: './main-layout.html',
  styleUrl: './main-layout.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class MainLayout implements OnInit, OnDestroy {
  protected readonly sidebarAbierto = signal(true);

  private readonly anchoPantalla = signal(
    typeof window !== 'undefined' ? window.innerWidth : 1024
  );
  protected readonly esMobile = computed(() => this.anchoPantalla() < 1024);

  private resizeListener?: () => void;

  ngOnInit(): void {
    // ✅ Configuración inicial
    if (this.esMobile()) {
      this.sidebarAbierto.set(false);
    }

    // ✅ Listener para cambios de tamaño
    if (typeof window !== 'undefined') {
      this.resizeListener = () => {
        this.anchoPantalla.set(window.innerWidth);
      };

      window.addEventListener('resize', this.resizeListener);
    }
  }

  ngOnDestroy(): void {
    if (this.resizeListener && typeof window !== 'undefined') {
      window.removeEventListener('resize', this.resizeListener);
    }
  }

  protected abrirSidebar(): void {
    this.sidebarAbierto.set(true);
  }

  // ✅ Clases dinámicas para el main
  protected obtenerClasesMain = computed(() => {
    const esMovil = this.esMobile();
    const abierto = this.sidebarAbierto();

    if (esMovil) {
      // En móvil, el main siempre ocupa toda la pantalla
      return 'flex-1 overflow-y-auto transition-all duration-300';
    } else {
      // En desktop, el main se ajusta según el sidebar
      return abierto
        ? 'flex-1 overflow-y-auto ml-64 transition-all duration-300'
        : 'flex-1 overflow-y-auto ml-20 transition-all duration-300';
    }
  });
}
