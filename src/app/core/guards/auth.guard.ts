import { inject } from '@angular/core';
import { Router, CanActivateFn } from '@angular/router';
import { AuthService } from '../services/auth.service';
import { map, take } from 'rxjs/operators';

export const authGuard: CanActivateFn = () => {
  const authService = inject(AuthService);
  const router = inject(Router);

  return authService.usuario$.pipe(
    take(1),
    map((usuario) => {
      if (usuario) {
        console.log('✅ Usuario autenticado:', usuario.email);
        return true;
      }

      console.warn('⚠️ Usuario no autenticado, redirigiendo a /login');
      router.navigate(['/login']);
      return false;
    })
  );
};
