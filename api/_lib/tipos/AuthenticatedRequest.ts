import { VercelRequest } from '@vercel/node';
export interface AuthenticatedRequest extends VercelRequest {
  usuario?: {
    uid: string;
    email: string;
    esAdmin: boolean;
  };
  body: any;
}
