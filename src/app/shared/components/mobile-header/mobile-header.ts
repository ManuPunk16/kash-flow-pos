import { Component, output, ChangeDetectionStrategy } from '@angular/core';

@Component({
  selector: 'app-mobile-header',
  template: `
    <header
      class="lg:hidden bg-white border-b border-gray-200 px-4 py-3 flex items-center justify-between sticky top-0 z-40 shadow-sm"
    >
      <!-- Botón Hamburguesa -->
      <button
        (click)="onToggleMenu.emit()"
        class="p-2 hover:bg-gray-100 rounded-lg transition-colors"
        aria-label="Abrir menú"
      >
        <svg
          class="w-6 h-6 text-gray-700"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            stroke-linecap="round"
            stroke-linejoin="round"
            stroke-width="2"
            d="M4 6h16M4 12h16M4 18h16"
          />
        </svg>
      </button>

      <!-- Logo/Título -->
      <div class="flex items-center gap-2">
        <span class="text-2xl">🏪</span>
        <h1 class="text-lg font-bold text-gray-800">KashFlow POS</h1>
      </div>

      <!-- Espacio para botones adicionales (notificaciones, etc.) -->
      <div class="w-10"></div>
    </header>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class MobileHeader {
  onToggleMenu = output<void>();
}
