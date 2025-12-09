import { VercelRequest } from '@vercel/node';

declare module '@vercel/node' {
  export interface VercelRequest {
    usuario?: {
      uid: string;
      email: string;
      esAdmin: boolean;
    };
    // Ayuda a compatibilidad con algunas librerías que buscan body
    body: any;
  }
}

export {};
