import {
  inject,
  Injectable,
  signal,
  Injector,
  runInInjectionContext,
} from '@angular/core';
import { Router } from '@angular/router';
import {
  Auth,
  signInWithEmailAndPassword,
  signOut,
  User,
  user,
} from '@angular/fire/auth';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';

@Injectable({
  providedIn: 'root',
})
export class AuthService {
  private readonly auth = inject(Auth);
  private readonly router = inject(Router);
  private readonly injector = inject(Injector);

  private readonly usuarioActual = signal<User | null>(null);
  private readonly cargando = signal(false);

  readonly usuario$ = user(this.auth);

  constructor() {
    // ✅ Observar cambios de forma reactiva con RxJS
    this.usuario$.pipe(takeUntilDestroyed()).subscribe((usuario) => {
      this.usuarioActual.set(usuario);

      if (usuario) {
        console.log('🔐 Usuario autenticado:', usuario.email);
      } else {
        console.log('🔓 No hay usuario autenticado');
      }
    });
  }

  async iniciarSesion(email: string, password: string): Promise<void> {
    this.cargando.set(true);

    try {
      // ✅ Ejecutar dentro del contexto de inyección
      const resultado = await runInInjectionContext(this.injector, () =>
        signInWithEmailAndPassword(this.auth, email, password)
      );

      this.usuarioActual.set(resultado.user);
      console.log('✅ Login exitoso:', resultado.user.email);

      await this.router.navigate(['/pos']);
    } catch (error: any) {
      console.error('❌ Error en login:', error);
      throw this.procesarErrorFirebase(error);
    } finally {
      this.cargando.set(false);
    }
  }

  async cerrarSesion(): Promise<void> {
    try {
      await runInInjectionContext(this.injector, () => signOut(this.auth));
      this.usuarioActual.set(null);
      console.log('👋 Sesión cerrada');
      await this.router.navigate(['/login']);
    } catch (error) {
      console.error('❌ Error al cerrar sesión:', error);
    }
  }

  async obtenerToken(): Promise<string | null> {
    const usuario = this.auth.currentUser;

    if (!usuario) {
      console.warn('⚠️ No hay usuario autenticado');
      return null;
    }

    try {
      const token = await usuario.getIdToken();
      console.log('🔑 Token obtenido correctamente');
      return token;
    } catch (error) {
      console.error('❌ Error al obtener token:', error);
      return null;
    }
  }

  estaAutenticado(): boolean {
    return !!this.auth.currentUser;
  }

  obtenerUsuarioActual(): User | null {
    return this.usuarioActual();
  }

  estaCargando(): boolean {
    return this.cargando();
  }

  private procesarErrorFirebase(error: any): Error {
    const codigosError: Record<string, string> = {
      'auth/user-not-found': 'Usuario no encontrado',
      'auth/wrong-password': 'Contraseña incorrecta',
      'auth/invalid-email': 'Correo electrónico inválido',
      'auth/user-disabled': 'Usuario deshabilitado',
      'auth/too-many-requests': 'Demasiados intentos. Intenta más tarde',
      'auth/network-request-failed': 'Error de conexión. Verifica tu internet',
      'auth/invalid-credential': 'Credenciales inválidas',
    };

    const mensaje = codigosError[error.code] || 'Error al iniciar sesión';
    return new Error(mensaje);
  }
}
