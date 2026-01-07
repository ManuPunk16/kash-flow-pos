import { Routes } from '@angular/router';
import { authGuard } from '@core/guards/auth.guard';

export const routes: Routes = [
  // ✅ Rutas públicas (Auth Layout)
  {
    path: '',
    loadComponent: () =>
      import('@shared/layouts/auth-layout/auth-layout').then(
        (m) => m.AuthLayout
      ),
    children: [
      {
        path: 'login',
        loadComponent: () =>
          import('@features/auth/login/login.component').then(
            (m) => m.LoginComponent
          ),
      },
      {
        path: '',
        redirectTo: 'login',
        pathMatch: 'full',
      },
    ],
  },

  // ✅ Rutas protegidas (Main Layout)
  {
    path: '',
    loadComponent: () =>
      import('@shared/layouts/main-layout/main-layout').then(
        (m) => m.MainLayout
      ),
    canActivate: [authGuard],
    children: [
      {
        path: 'pos',
        loadComponent: () =>
          import('@features/pos/pos.component').then((m) => m.PosComponent),
      },
      {
        path: 'inventario',
        loadComponent: () =>
          import('@features/inventario/inventario').then((m) => m.Inventario),
      },
      {
        path: 'clientes',
        loadComponent: () =>
          import('@features/clientes/clientes').then((m) => m.Clientes),
      },
      {
        path: 'proveedores',
        loadComponent: () =>
          import('@features/proveedores/proveedores').then(
            (m) => m.Proveedores
          ),
      },
      {
        path: 'ventas',
        loadComponent: () =>
          import('@features/ventas/ventas').then((m) => m.Ventas),
      },
      {
        path: 'reportes',
        loadComponent: () =>
          import('@features/reportes/reportes').then((m) => m.Reportes),
      },
      {
        path: 'egresos',
        loadComponent: () =>
          import('@features/egresos/egresos').then((m) => m.Egresos),
      },
      {
        path: 'configuracion',
        loadComponent: () =>
          import('@features/configuracion/configuracion').then(
            (m) => m.Configuracion
          ),
      },
    ],
  },

  // ✅ 404
  {
    path: '**',
    redirectTo: '/login',
  },
];
