import { Request, Response, NextFunction } from 'express';
import { v4 as uuidv4 } from 'uuid';
import { logger } from '../utils/logger';

// Extension de l'interface Request pour inclure nos propriétés personnalisées
declare global {
  namespace Express {
    interface Request {
      requestId: string;
      startTime: number;
      tenantId?: string;
      userId?: string;
    }
  }
}

// Middleware pour logger les requêtes
export const requestLogger = (req: Request, res: Response, next: NextFunction): void => {
  // Génération d'un ID unique pour la requête
  req.requestId = req.headers['x-request-id'] as string || uuidv4();
  req.startTime = Date.now();

  // Ajout de l'ID de requête aux headers de réponse
  res.setHeader('X-Request-ID', req.requestId);

  // Log de la requête entrante
  const requestLog = {
    requestId: req.requestId,
    method: req.method,
    url: req.url,
    userAgent: req.get?.('User-Agent'),
    ip: req.ip,
    tenantId: req.tenantId,
    userId: req.userId,
    timestamp: new Date().toISOString(),
  };

  logger.info('Incoming Request', requestLog);

  // Interception de la réponse pour logger les détails
  const originalSend = res.send;
  res.send = function(data: any) {
    const responseTime = Date.now() - req.startTime;
    
    const responseLog = {
      requestId: req.requestId,
      method: req.method,
      url: req.url,
      statusCode: res.statusCode,
      responseTime: `${responseTime}ms`,
      contentLength: res.get('Content-Length') || '0',
      tenantId: req.tenantId,
      userId: req.userId,
      timestamp: new Date().toISOString(),
    };

    // Log basé sur le code de statut
    if (res.statusCode >= 500) {
      logger.error('Server Error Response', responseLog);
    } else if (res.statusCode >= 400) {
      logger.warn('Client Error Response', responseLog);
    } else {
      logger.info('Successful Response', responseLog);
    }

    // Log des métriques de performance
    if (responseTime > 1000) { // Plus de 1 seconde
      logger.warn('Slow Request', {
        ...responseLog,
        performance: 'slow',
      });
    } else if (responseTime > 500) { // Plus de 500ms
      logger.info('Moderate Request', {
        ...responseLog,
        performance: 'moderate',
      });
    }

    return originalSend.call(this, data);
  };

  next();
};

// Middleware pour logger les erreurs de requête
export const errorLogger = (error: Error, req: Request, res: Response, next: NextFunction): void => {
  const errorLog = {
    requestId: req.requestId,
    method: req.method,
    url: req.url,
    error: {
      name: error.name,
      message: (error as Error).message,
      stack: error.stack,
    },
    tenantId: req.tenantId,
    userId: req.userId,
    timestamp: new Date().toISOString(),
  };

  logger.error('Request Error', errorLog);
  next(error);
};

// Middleware pour logger les tentatives d'accès non autorisées
export const securityLogger = (req: Request, res: Response, next: NextFunction): void => {
  // Détection de patterns suspects
  const suspiciousPatterns = [
    /\.\.\//, // Path traversal
    /<script/i, // XSS
    /union.*select/i, // SQL injection
    /javascript:/i, // JavaScript injection
    /eval\(/i, // Code injection
  ];

  const url = req.url.toLowerCase();
  const userAgent = req.get?.('User-Agent')?.toLowerCase() || '';

  for (const pattern of suspiciousPatterns) {
    if (pattern.test(url) || pattern.test(userAgent)) {
      logger.warn('Suspicious Request Detected', {
        requestId: req.requestId,
        method: req.method,
        url: req.url,
        userAgent: req.get?.('User-Agent'),
        ip: req.ip,
        pattern: pattern.toString(),
        timestamp: new Date().toISOString(),
      });
      break;
    }
  }

  next();
};

// Middleware pour logger les métriques d'utilisation
export const usageLogger = (req: Request, res: Response, next: NextFunction): void => {
  // Log des métriques d'utilisation par tenant
  if (req.tenantId) {
    const usageLog = {
      requestId: req.requestId,
      tenantId: req.tenantId,
      userId: req.userId,
      endpoint: req.path,
      method: req.method,
      timestamp: new Date().toISOString(),
    };

    // Log asynchrone pour ne pas bloquer la requête
    setImmediate(() => {
      logger.info('Usage Metric', usageLog);
    });
  }

  next();
};

// Fonction utilitaire pour créer un logger de contexte
export const createRequestLogger = (req: Request) => {
  return {
    info: (message: string, meta?: any) => {
      logger.info(message, {
        requestId: req.requestId,
        tenantId: req.tenantId,
        userId: req.userId,
        ...meta,
      });
    },
    warn: (message: string, meta?: any) => {
      logger.warn(message, {
        requestId: req.requestId,
        tenantId: req.tenantId,
        userId: req.userId,
        ...meta,
      });
    },
    error: (message: string, meta?: any) => {
      logger.error(message, {
        requestId: req.requestId,
        tenantId: req.tenantId,
        userId: req.userId,
        ...meta,
      });
    },
    debug: (message: string, meta?: any) => {
      logger.debug(message, {
        requestId: req.requestId,
        tenantId: req.tenantId,
        userId: req.userId,
        ...meta,
      });
    },
  };
};

// Middleware pour ajouter des métadonnées de requête
export const requestMetadata = (req: Request, res: Response, next: NextFunction): void => {
  // Ajout de métadonnées utiles
  req.requestId = req.requestId || uuidv4();
  req.startTime = req.startTime || Date.now();

  // Ajout d'informations sur la requête
  const metadata = {
    requestId: req.requestId,
    timestamp: new Date().toISOString(),
    method: req.method,
    url: req.url,
    userAgent: req.get?.('User-Agent'),
    ip: req.ip,
    referer: req.get?.('Referer'),
    origin: req.get?.('Origin'),
  };

  // Stockage des métadonnées dans la requête pour utilisation ultérieure
  (req as any).metadata = metadata;

  next();
};

export default requestLogger;




