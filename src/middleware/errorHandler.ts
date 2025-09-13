import { Request, Response, NextFunction } from 'express';
import { logger } from '../utils/logger';
import { APIResponse } from '../types';

// Types d'erreurs personnalisées
export class AppError extends Error {
  public statusCode: number;
  public isOperational: boolean;
  public code: string;
  public details?: any;

  constructor(
    message: string,
    statusCode: number = 500,
    code: string = 'INTERNAL_ERROR',
    isOperational: boolean = true,
    details?: any
  ) {
    super(message);
    this.statusCode = statusCode;
    this.isOperational = isOperational;
    this.code = code;
    this.details = details;

    Error.captureStackTrace(this, this.constructor);
  }
}

export class ValidationError extends AppError {
  constructor(message: string, details?: any) {
    super(message, 400, 'VALIDATION_ERROR', true, details);
  }
}

export class AuthenticationError extends AppError {
  constructor(message: string = 'Authentication required') {
    super(message, 401, 'AUTHENTICATION_ERROR');
  }
}

export class AuthorizationError extends AppError {
  constructor(message: string = 'Insufficient permissions') {
    super(message, 403, 'AUTHORIZATION_ERROR');
  }
}

export class NotFoundError extends AppError {
  constructor(resource: string = 'Resource') {
    super(`${resource} not found`, 404, 'NOT_FOUND');
  }
}

export class ConflictError extends AppError {
  constructor(message: string) {
    super(message, 409, 'CONFLICT_ERROR');
  }
}

export class RateLimitError extends AppError {
  constructor(message: string = 'Rate limit exceeded') {
    super(message, 429, 'RATE_LIMIT_ERROR');
  }
}

export class SubscriptionError extends AppError {
  constructor(message: string = 'Subscription required') {
    super(message, 402, 'SUBSCRIPTION_ERROR');
  }
}

export class TenantIsolationError extends AppError {
  constructor(message: string = 'Tenant isolation violation') {
    super(message, 403, 'TENANT_ISOLATION_ERROR');
  }
}

// Gestionnaire d'erreurs principal
export const errorHandler = (
  error: Error | AppError,
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  let statusCode = 500;
  let code = 'INTERNAL_ERROR';
  let message = 'An unexpected error occurred';
  let details: any = undefined;

  // Erreur personnalisée de l'application
  if (error instanceof AppError) {
    statusCode = error.statusCode;
    code = error.code;
    message = (error as Error).message;
    details = error.details;
  }
  // Erreur de validation Joi
  else if (error.name === 'ValidationError' && 'details' in error) {
    statusCode = 400;
    code = 'VALIDATION_ERROR';
    message = 'Validation failed';
    details = (error as any).details.map((detail: any) => ({
      field: detail.path.join('.'),
      message: detail.message,
    }));
  }
  // Erreur JWT
  else if (error.name === 'JsonWebTokenError') {
    statusCode = 401;
    code = 'INVALID_TOKEN';
    message = 'Invalid token';
  }
  else if (error.name === 'TokenExpiredError') {
    statusCode = 401;
    code = 'TOKEN_EXPIRED';
    message = 'Token expired';
  }
  // Erreur de base de données
  else if (error.name === 'MongoError' || error.name === 'MongooseError') {
    statusCode = 500;
    code = 'DATABASE_ERROR';
    message = 'Database operation failed';
  }
  // Erreur PostgreSQL
  else if (error.name === 'PostgresError') {
    statusCode = 500;
    code = 'DATABASE_ERROR';
    message = 'Database operation failed';
  }
  // Erreur Redis
  else if (error.name === 'RedisError') {
    statusCode = 500;
    code = 'CACHE_ERROR';
    message = 'Cache operation failed';
  }
  // Erreur OpenAI
  else if ((error as Error).message.includes('OpenAI') || (error as Error).message.includes('API key')) {
    statusCode = 500;
    code = 'AI_SERVICE_ERROR';
    message = 'AI service temporarily unavailable';
  }
  // Erreur Stripe
  else if ((error as Error).message.includes('Stripe')) {
    statusCode = 500;
    code = 'PAYMENT_SERVICE_ERROR';
    message = 'Payment service temporarily unavailable';
  }
  // Erreur de syntaxe JSON
  else if (error instanceof SyntaxError && 'body' in error) {
    statusCode = 400;
    code = 'INVALID_JSON';
    message = 'Invalid JSON format';
  }
  // Erreur de limite de taille
  else if ((error as Error).message.includes('limit') && (error as Error).message.includes('exceeded')) {
    statusCode = 413;
    code = 'PAYLOAD_TOO_LARGE';
    message = 'Request payload too large';
  }

  // Logging de l'erreur
  const logContext = {
    method: req.method,
    url: req.url,
    statusCode,
    code,
    tenantId: (req as any).tenantId,
    userId: (req as any).userId,
    userAgent: req.get?.('User-Agent'),
    ip: req.ip,
    stack: error.stack,
  };

  if (statusCode >= 500) {
    logger.error('Server Error', logContext);
  } else if (statusCode >= 400) {
    logger.warn('Client Error', logContext);
  }

  // Réponse d'erreur
  const response: APIResponse = {
    success: false,
    error: {
      code,
      message,
      ...(details && { details }),
    },
    metadata: {
      timestamp: new Date(),
      request_id: req.headers['x-request-id'] as string || 'unknown',
      version: process.env.API_VERSION || '1.0.0',
    },
  };

  // Headers de sécurité
  res.set({
    'X-Content-Type-Options': 'nosniff',
    'X-Frame-Options': 'DENY',
    'X-XSS-Protection': '1; mode=block',
  });

  res.status(statusCode).json(response);
};

// Gestionnaire d'erreurs pour les routes non trouvées
export const notFoundHandler = (req: Request, res: Response): void => {
  const response: APIResponse = {
    success: false,
    error: {
      code: 'NOT_FOUND',
      message: `Route ${req.method} ${req.originalUrl} not found`,
    },
    metadata: {
      timestamp: new Date(),
      request_id: req.headers['x-request-id'] as string || 'unknown',
      version: process.env.API_VERSION || '1.0.0',
    },
  };

  res.status(404).json(response);
};

// Middleware pour capturer les erreurs asynchrones
export const asyncHandler = (fn: Function) => {
  return (req: Request, res: Response, next: NextFunction) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
};

// Fonction utilitaire pour créer des erreurs avec contexte
export const createError = (
  message: string,
  statusCode: number = 500,
  code: string = 'INTERNAL_ERROR',
  details?: any
): AppError => {
  return new AppError(message, statusCode, code, true, details);
};

// Fonction pour valider les erreurs et les transformer
export const handleDatabaseError = (error: any): AppError => {
  if (error.code === '23505') { // PostgreSQL unique violation
    return new ConflictError('Resource already exists');
  }
  if (error.code === '23503') { // PostgreSQL foreign key violation
    return new ValidationError('Referenced resource does not exist');
  }
  if (error.code === '23502') { // PostgreSQL not null violation
    return new ValidationError('Required field is missing');
  }
  if (error.code === '42P01') { // PostgreSQL undefined table
    return new AppError('Database table not found', 500, 'DATABASE_ERROR');
  }
  
  // Erreur MongoDB
  if (error.code === 11000) { // MongoDB duplicate key
    return new ConflictError('Resource already exists');
  }
  if (error.name === 'ValidationError') {
    return new ValidationError('Validation failed', error.errors);
  }
  if (error.name === 'CastError') {
    return new ValidationError('Invalid data format');
  }
  
  return new AppError('Database operation failed', 500, 'DATABASE_ERROR');
};

// Fonction pour gérer les erreurs d'API externes
export const handleExternalAPIError = (error: any, service: string): AppError => {
  if (error.status === 401) {
    return new AppError(`${service} authentication failed`, 500, 'EXTERNAL_API_ERROR');
  }
  if (error.status === 403) {
    return new AppError(`${service} access forbidden`, 500, 'EXTERNAL_API_ERROR');
  }
  if (error.status === 429) {
    return new AppError(`${service} rate limit exceeded`, 500, 'EXTERNAL_API_ERROR');
  }
  if (error.status >= 500) {
    return new AppError(`${service} service unavailable`, 500, 'EXTERNAL_API_ERROR');
  }
  
  return new AppError(`${service} API error`, 500, 'EXTERNAL_API_ERROR');
};

export default errorHandler;




