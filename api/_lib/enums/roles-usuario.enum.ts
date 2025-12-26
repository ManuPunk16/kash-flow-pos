/**
 * Roles de usuario en el sistema
 */
export enum RolUsuario {
  ADMIN = 'admin',
  GERENTE = 'gerente',
  VENDEDOR = 'vendedor',
}

/**
 * Array de valores válidos
 */
export const ROLES_USUARIO_VALORES = Object.values(RolUsuario);

/**
 * Metadata para permisos
 */
export const ROLES_USUARIO_METADATA: Record<
  RolUsuario,
  {
    etiqueta: string;
    nivel: number;
    permisos: {
      verVentas: boolean;
      crearVentas: boolean;
      anularVentas: boolean;
      gestionarClientes: boolean;
      gestionarProductos: boolean;
      aplicarIntereses: boolean;
      verReportes: boolean;
      gestionarUsuarios: boolean;
      configurarSistema: boolean;
    };
  }
> = {
  [RolUsuario.ADMIN]: {
    etiqueta: 'Administrador',
    nivel: 3,
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
  [RolUsuario.GERENTE]: {
    etiqueta: 'Gerente',
    nivel: 2,
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
  [RolUsuario.VENDEDOR]: {
    etiqueta: 'Vendedor',
    nivel: 1,
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
};

/**
 * Validar rol de usuario
 */
export function esRolValido(rol: string): rol is RolUsuario {
  return ROLES_USUARIO_VALORES.includes(rol as RolUsuario);
}

/**
 * Obtener permisos por rol
 */
export function obtenerPermisos(rol: RolUsuario) {
  return ROLES_USUARIO_METADATA[rol].permisos;
}
