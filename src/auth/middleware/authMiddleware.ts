import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { config } from '../../config/environment';
import { AuthenticationError, AuthorizationError } from '../../middleware/errorHandler';
import { User } from '../../types';
import { logger } from '../../utils/logger';

// Extension de l'interface Request pour inclure les propriétés d'authentification
// Les types sont définis dans src/types/express.d.ts

// Interface pour le payload JWT
interface JWTPayload {
  userId: string;
  tenantId: string;
  email: string;
  role: string;
  iat: number;
  exp: number;
}

// Middleware d'authentification principal
export const authenticateToken = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const authHeader = req.headers.authorization;
    const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

    if (!token) {
      throw new AuthenticationError('Access token required');
    }

    // Vérification du token
    const decoded = jwt.verify(token, config.auth.jwtSecret) as JWTPayload;
    
    // Vérification de l'expiration
    if (decoded.exp < Date.now() / 1000) {
      throw new AuthenticationError('Token expired');
    }

    // Récupération des informations utilisateur depuis la base de données
    const user = await getUserById(decoded.userId);
    
    if (!user) {
      throw new AuthenticationError('User not found');
    }

    // Vérification que l'utilisateur est actif
    if (user.role === 'inactive') {
      throw new AuthenticationError('User account is inactive');
    }

    // Ajout des informations utilisateur à la requête
    req.user = user;
    (req as any).userId = user.id;
    (req as any).tenantId = user.tenant_id;

    // Log de l'authentification réussie
    logger.info('User authenticated', {
      userId: user.id,
      tenantId: user.tenant_id,
      email: user.email,
      role: user.role,
      requestId: (req as any).requestId,
    });

    next();
  } catch (error) {
    if (error instanceof jwt.JsonWebTokenError) {
      throw new AuthenticationError('Invalid token');
    }
    if (error instanceof jwt.TokenExpiredError) {
      throw new AuthenticationError('Token expired');
    }
    throw error;
  }
};

// Middleware d'autorisation basé sur les rôles
export const authorize = (allowedRoles: string[]) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    if (!req.user) {
      throw new AuthenticationError('Authentication required');
    }

    if (!allowedRoles.includes(req.user.role)) {
      throw new AuthorizationError(`Access denied. Required roles: ${allowedRoles.join(', ')}`);
    }

    next();
  };
};

// Middleware d'autorisation basé sur les permissions
export const requirePermission = (permission: string) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    if (!req.user) {
      throw new AuthenticationError('Authentication required');
    }

    if (!req.user.permissions.includes(permission)) {
      throw new AuthorizationError(`Permission required: ${permission}`);
    }

    next();
  };
};

// Middleware pour vérifier les fonctionnalités d'abonnement
export const requireFeature = (feature: string) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    const subscription = (req as any).subscription;
    
    if (!subscription) {
      throw new AuthorizationError('Subscription information not available');
    }

    if (!subscription.features_enabled.includes(feature)) {
      throw new AuthorizationError(`Feature '${feature}' not available in your plan`);
    }

    next();
  };
};

// Middleware pour vérifier la propriété de la ressource
export const requireOwnership = (resourceUserIdField: string = 'user_id') => {
  return (req: Request, res: Response, next: NextFunction): void => {
    if (!req.user) {
      throw new AuthenticationError('Authentication required');
    }

    // Vérification que l'utilisateur est admin ou propriétaire de la ressource
    if (req.user.role === 'admin') {
      return next();
    }

    const resourceUserId = req.params[resourceUserIdField] || req.body[resourceUserIdField];
    
    if (resourceUserId !== req.user.id) {
      throw new AuthorizationError('Access denied. You can only access your own resources.');
    }

    next();
  };
};

// Middleware pour l'authentification optionnelle (ne bloque pas si pas de token)
export const optionalAuth = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const authHeader = req.headers.authorization;
    const token = authHeader && authHeader.split(' ')[1];

    if (token) {
      const decoded = jwt.verify(token, config.auth.jwtSecret) as JWTPayload;
      const user = await getUserById(decoded.userId);
      
      if (user && user.role !== 'inactive') {
        req.user = user;
        (req as any).userId = user.id;
        (req as any).tenantId = user.tenant_id;
      }
    }
  } catch (error) {
    // Ignore les erreurs d'authentification pour l'auth optionnelle
    logger.debug('Optional auth failed', { error: (error as Error).message });
  }

  next();
};

// Middleware pour vérifier le refresh token
export const authenticateRefreshToken = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { refreshToken } = req.body as any;

    if (!refreshToken) {
      throw new AuthenticationError('Refresh token required');
    }

    const decoded = jwt.verify(refreshToken, config.auth.jwtRefreshSecret) as JWTPayload;
    
    // Vérification de l'expiration
    if (decoded.exp < Date.now() / 1000) {
      throw new AuthenticationError('Refresh token expired');
    }

    // Récupération des informations utilisateur
    const user = await getUserById(decoded.userId);
    
    if (!user) {
      throw new AuthenticationError('User not found');
    }

    req.user = user;
    (req as any).userId = user.id;
    (req as any).tenantId = user.tenant_id;

    next();
  } catch (error) {
    if (error instanceof jwt.JsonWebTokenError) {
      throw new AuthenticationError('Invalid refresh token');
    }
    if (error instanceof jwt.TokenExpiredError) {
      throw new AuthenticationError('Refresh token expired');
    }
    throw error;
  }
};

// Fonction utilitaire pour récupérer un utilisateur par ID
async function getUserById(userId: string): Promise<User | null> {
  try {
    // TODO: Implémenter la récupération depuis la base de données
    // Pour l'instant, retourner un utilisateur mock
    return {
      id: userId,
      tenant_id: 'tenant-123',
      email: 'user@example.com',
      name: 'Test User',
      role: 'admin' as const,
      permissions: ['read', 'write', 'admin'],
      last_login: new Date(),
      created_at: new Date(),
      preferences: {
        theme: 'light',
        notifications: true,
        language: 'en',
      },
    };
  } catch (error) {
    logger.error('Error fetching user', { userId, error: (error as Error).message });
    return null;
  }
}

// Fonction pour générer un token d'accès
export const generateAccessToken = (user: User): string => {
  const payload: Omit<JWTPayload, 'iat' | 'exp'> = {
    userId: user.id,
    tenantId: user.tenant_id,
    email: user.email,
    role: user.role,
  };

  return jwt.sign(payload, config.auth.jwtSecret, {
    expiresIn: config.auth.jwtExpiresIn as any,
  });
};

// Fonction pour générer un refresh token
export const generateRefreshToken = (user: User): string => {
  const payload: Omit<JWTPayload, 'iat' | 'exp'> = {
    userId: user.id,
    tenantId: user.tenant_id,
    email: user.email,
    role: user.role,
  };

  return jwt.sign(payload, config.auth.jwtRefreshSecret, {
    expiresIn: config.auth.jwtRefreshExpiresIn as any,
  });
};

// Fonction pour vérifier si un token est valide (sans l'utiliser)
export const verifyToken = (token: string): JWTPayload | null => {
  try {
    return jwt.verify(token, config.auth.jwtSecret) as JWTPayload;
  } catch (error) {
    return null;
  }
};

// Fonction pour extraire le token depuis les headers
export const extractToken = (req: Request): string | null => {
  const authHeader = req.headers.authorization;
  return authHeader && authHeader.split(' ')[1] || null;
};

// Middleware pour logger les tentatives d'authentification
export const authLogger = (req: Request, res: Response, next: NextFunction): void => {
  const token = extractToken(req);
  
  if (token) {
    const decoded = verifyToken(token);
    
    if (decoded) {
      logger.info('Token validation attempt', {
        userId: decoded.userId,
        tenantId: decoded.tenantId,
        requestId: (req as any).requestId,
        ip: (req as any).ip,
      });
    } else {
      logger.warn('Invalid token attempt', {
        requestId: (req as any).requestId,
        ip: (req as any).ip,
        userAgent: (req as any).get('User-Agent'),
      });
    }
  }

  next();
};

export default authenticateToken;




