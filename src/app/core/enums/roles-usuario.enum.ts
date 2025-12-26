/**
 * Roles de usuario - Sincronizado con backend
 */
export enum RolUsuario {
  ADMIN = 'admin',
  GERENTE = 'gerente',
  VENDEDOR = 'vendedor',
}

/**
 * Type-safe array
 */
export const ROLES_USUARIO_LISTA: readonly RolUsuario[] =
  Object.values(RolUsuario);

/**
 * Permisos del sistema
 */
export interface Permisos {
  verVentas: boolean;
  crearVentas: boolean;
  anularVentas: boolean;
  gestionarClientes: boolean;
  gestionarProductos: boolean;
  aplicarIntereses: boolean;
  verReportes: boolean;
  gestionarUsuarios: boolean;
  configurarSistema: boolean;
}

/**
 * Metadata para UI
 */
export interface RolUsuarioInfo {
  valor: RolUsuario;
  etiqueta: string;
  nivel: number;
  permisos: Permisos;
  badge: string;
}

export const ROLES_USUARIO_CATALOGO: readonly RolUsuarioInfo[] = [
  {
    valor: RolUsuario.ADMIN,
    etiqueta: 'Administrador',
    nivel: 3,
    badge: 'bg-red-100 text-red-800',
    permisos: {
      verVentas: true,
      crearVentas: true,
      anularVentas: true,
      gestionarClientes: true,
      gestionarProductos: true,
      aplicarIntereses: true,
      verReportes: true,
      gestionarUsuarios: true,
      configurarSistema: true,
    },
  },
  {
    valor: RolUsuario.GERENTE,
    etiqueta: 'Gerente',
    nivel: 2,
    badge: 'bg-blue-100 text-blue-800',
    permisos: {
      verVentas: true,
      crearVentas: true,
      anularVentas: true,
      gestionarClientes: true,
      gestionarProductos: true,
      aplicarIntereses: true,
      verReportes: true,
      gestionarUsuarios: false,
      configurarSistema: false,
    },
  },
  {
    valor: RolUsuario.VENDEDOR,
    etiqueta: 'Vendedor',
    nivel: 1,
    badge: 'bg-green-100 text-green-800',
    permisos: {
      verVentas: true,
      crearVentas: true,
      anularVentas: false,
      gestionarClientes: false,
      gestionarProductos: false,
      aplicarIntereses: false,
      verReportes: false,
      gestionarUsuarios: false,
      configurarSistema: false,
    },
  },
] as const;

/**
 * Obtener info de rol
 */
export function obtenerInfoRol(rol: RolUsuario): RolUsuarioInfo | undefined {
  return ROLES_USUARIO_CATALOGO.find((r) => r.valor === rol);
}

/**
 * Obtener permisos por rol
 */
export function obtenerPermisos(rol: RolUsuario): Permisos {
  const info = obtenerInfoRol(rol);
  return (
    info?.permisos || {
      verVentas: false,
      crearVentas: false,
      anularVentas: false,
      gestionarClientes: false,
      gestionarProductos: false,
      aplicarIntereses: false,
      verReportes: false,
      gestionarUsuarios: false,
      configurarSistema: false,
    }
  );
}

/**
 * Validar rol
 */
export function esRolValido(rol: string): rol is RolUsuario {
  return ROLES_USUARIO_LISTA.includes(rol as RolUsuario);
}
