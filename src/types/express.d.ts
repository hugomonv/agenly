// Extension des types Express pour AGENLY
import { User, Tenant, Subscription } from './index';

declare global {
  namespace Express {
    interface Request {
      requestId: string;
      startTime: number;
      user?: User;
      userId?: string;
      tenantId?: string;
      tenantMetadata?: Tenant;
      subscription?: Subscription;
      metadata?: any;
      ip?: string;
      get?(header: string): string | undefined;
    }
  }
}

// Extension des types Express pour les propriétés manquantes
declare module 'express-serve-static-core' {
  interface Request {
    params: { [key: string]: string };
    query: { [key: string]: any };
    body: any;
    ip?: string;
    get?(header: string): string | undefined;
  }
  
  interface Response {
    status(code: number): Response;
    json(body?: any): Response;
  }
}

export {};




