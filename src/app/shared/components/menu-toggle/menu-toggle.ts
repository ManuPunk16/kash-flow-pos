import { Component, output, ChangeDetectionStrategy } from '@angular/core';

@Component({
  selector: 'app-menu-toggle',
  template: `
    <button
      (click)="onToggle.emit()"
      class="fixed top-4 left-4 z-50 lg:hidden bg-gray-900 text-white p-3 rounded-lg shadow-lg hover:bg-gray-800 transition-colors"
      aria-label="Abrir menú"
    >
      <svg
        class="w-6 h-6"
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
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class MenuToggle {
  onToggle = output<void>();
}
