import { RolUsuario, Permisos } from '@core/enums';

export interface Usuario {
  _id: string;
  email: string;
  firebaseUid: string;
  nombre: string;
  apellido: string;
  rol: RolUsuario;
  activo: boolean;
  permisos: Permisos;
  fechaCreacion: Date;
  fechaUltimaLogin: Date;
}

/**
 * DTO para crear usuario
 */
export interface CrearUsuarioDTO {
  email: string;
  firebaseUid: string;
  nombre: string;
  apellido: string;
  rol: RolUsuario;
}

/**
 * Usuario logueado (sin datos sensibles)
 */
export interface UsuarioSesion {
  uid: string;
  email: string;
  nombre: string;
  rol: RolUsuario;
  permisos: Permisos;
}
