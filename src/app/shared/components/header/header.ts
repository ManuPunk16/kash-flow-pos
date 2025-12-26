import {
  Component,
  input,
  output,
  ChangeDetectionStrategy,
} from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-header',
  imports: [CommonModule],
  templateUrl: './header.html',
  styleUrl: './header.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Header {
  titulo = input.required<string>();
  descripcion = input<string>('');
  mostrarBotonAccion = input(false);
  textoBotonAccion = input('Nueva Acción');
  iconoBotonAccion = input('➕');

  onAccion = output<void>();

  protected ejecutarAccion(): void {
    this.onAccion.emit();
  }
}
