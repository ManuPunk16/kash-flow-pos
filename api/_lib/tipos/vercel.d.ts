import { VercelRequest } from '@vercel/node';

declare module '@vercel/node' {
  interface VercelRequest {
    usuario?: {
      uid: string;
      email: string;
      esAdmin: boolean;
    };
    body: any;
  }
}

export {};
