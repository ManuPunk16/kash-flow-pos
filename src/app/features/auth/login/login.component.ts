import {
  Component,
  signal,
  inject,
  ChangeDetectionStrategy,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';

@Component({
  selector: 'app-login',
  imports: [CommonModule, FormsModule],
  templateUrl: './login.component.html',
  styleUrl: './login.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class LoginComponent {
  private readonly authService = inject(AuthService);
  private readonly router = inject(Router);

  protected readonly email = signal('');
  protected readonly password = signal('');
  protected readonly cargando = signal(false);
  protected readonly error = signal<string | null>(null);
  protected readonly mostrarPassword = signal(false);

  protected actualizarEmail(event: Event): void {
    const input = event.target as HTMLInputElement;
    this.email.set(input.value);
  }

  protected actualizarPassword(event: Event): void {
    const input = event.target as HTMLInputElement;
    this.password.set(input.value);
  }

  protected toggleMostrarPassword(): void {
    this.mostrarPassword.update((valor) => !valor);
  }

  protected async iniciarSesion(): Promise<void> {
    // Validaciones
    if (!this.email().trim() || !this.password().trim()) {
      this.error.set('Por favor ingresa correo y contraseña');
      return;
    }

    if (!this.esEmailValido(this.email())) {
      this.error.set('Correo electrónico inválido');
      return;
    }

    this.cargando.set(true);
    this.error.set(null);

    try {
      await this.authService.iniciarSesion(this.email(), this.password());
      this.router.navigate(['/pos']);
    } catch (err: any) {
      console.error('❌ Error en login:', err);

      // Mensajes de error más amigables
      if (err.code === 'auth/user-not-found') {
        this.error.set('Usuario no encontrado');
      } else if (err.code === 'auth/wrong-password') {
        this.error.set('Contraseña incorrecta');
      } else if (err.code === 'auth/invalid-email') {
        this.error.set('Email inválido');
      } else if (err.code === 'auth/too-many-requests') {
        this.error.set('Demasiados intentos. Intenta más tarde');
      } else {
        this.error.set('Error al iniciar sesión');
      }
    } finally {
      this.cargando.set(false);
    }
  }

  protected manejarEnter(event: KeyboardEvent): void {
    if (event.key === 'Enter') {
      this.iniciarSesion();
    }
  }

  private esEmailValido(email: string): boolean {
    const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return regex.test(email);
  }
}
