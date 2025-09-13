import { Request, Response, NextFunction } from 'express';
import { TenantIsolationError, AuthenticationError } from '../../middleware/errorHandler';
import { logger } from '../../utils/logger';
import { getRedisConnection } from '../../config/database';

// Interface pour les métadonnées de tenant
interface TenantMetadata {
  id: string;
  status: 'active' | 'suspended' | 'terminated';
  subscription_plan: string;
  features_enabled: string[];
  limits: {
    max_agents: number;
    max_api_calls: number;
    max_storage: number;
  };
  usage: {
    agents_created: number;
    api_calls: number;
    storage_used: number;
  };
}

// Middleware d'isolation des tenants
export const tenantIsolation = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    // Extraction du tenant ID depuis différents sources
    const tenantId = extractTenantId(req);
    
    if (!tenantId) {
      // Pour les routes publiques, on continue sans tenant
      if (isPublicRoute(req.path)) {
        return next();
      }
      throw new TenantIsolationError('Tenant ID required');
    }

    // Validation et récupération des métadonnées du tenant
    const tenantMetadata = await validateTenant(tenantId);
    
    if (!tenantMetadata) {
      throw new TenantIsolationError('Invalid tenant ID');
    }

    // Vérification du statut du tenant
    if (tenantMetadata.status === 'terminated') {
      throw new TenantIsolationError('Tenant account terminated');
    }

    // Ajout des métadonnées du tenant à la requête
    req.tenantId = tenantId;
    (req as any).tenantMetadata = tenantMetadata;

    // Vérification des limites d'utilisation
    await checkUsageLimits(tenantId, req);

    // Log de l'accès au tenant
    logger.info('Tenant access', {
      tenantId,
      status: tenantMetadata.status,
      plan: tenantMetadata.subscription_plan,
      requestId: req.requestId,
      userId: req.userId,
    });

    next();
  } catch (error) {
    logger.error('Tenant isolation error', {
      error: (error as Error).message,
      tenantId: req.tenantId,
      requestId: req.requestId,
      ip: req.ip,
    });
    throw error;
  }
};

// Fonction pour extraire le tenant ID depuis la requête
function extractTenantId(req: Request): string | null {
  // 1. Depuis les headers (priorité la plus haute)
  const headerTenantId = req.headers['x-tenant-id'] as string;
  if (headerTenantId) {
    return headerTenantId;
  }

  // 2. Depuis l'utilisateur authentifié
  if (req.user?.tenant_id) {
    return req.user.tenant_id;
  }

  // 3. Depuis les paramètres de route
  const paramTenantId = req.params.tenantId;
  if (paramTenantId) {
    return paramTenantId;
  }

  // 4. Depuis le body (pour certaines routes)
  const bodyTenantId = req.body?.tenant_id;
  if (bodyTenantId) {
    return bodyTenantId;
  }

  // 5. Depuis les query parameters
  const queryTenantId = req.query.tenant_id as string;
  if (queryTenantId) {
    return queryTenantId;
  }

  return null;
}

// Fonction pour valider un tenant
async function validateTenant(tenantId: string): Promise<TenantMetadata | null> {
  try {
    const redis = getRedisConnection();
    
    // Tentative de récupération depuis le cache Redis
    const cachedTenant = await redis.get(`tenant:${tenantId}`);
    
    if (cachedTenant) {
      return JSON.parse(cachedTenant);
    }

    // Si pas en cache, récupération depuis la base de données
    const tenant = await getTenantFromDatabase(tenantId);
    
    if (tenant) {
      // Mise en cache pour 5 minutes
      await redis.setex(`tenant:${tenantId}`, 300, JSON.stringify(tenant));
      return tenant;
    }

    return null;
  } catch (error) {
    logger.error('Error validating tenant', { tenantId, error: (error as Error).message });
    return null;
  }
}

// Fonction pour récupérer un tenant depuis la base de données
async function getTenantFromDatabase(tenantId: string): Promise<TenantMetadata | null> {
  try {
    // TODO: Implémenter la récupération depuis PostgreSQL
    // Pour l'instant, retourner des données mock
    return {
      id: tenantId,
      status: 'active',
      subscription_plan: 'professional',
      features_enabled: ['agents', 'integrations', 'analytics'],
      limits: {
        max_agents: 25,
        max_api_calls: 100000,
        max_storage: 10000,
      },
      usage: {
        agents_created: 5,
        api_calls: 1500,
        storage_used: 500,
      },
    };
  } catch (error) {
    logger.error('Error fetching tenant from database', { tenantId, error: (error as Error).message });
    return null;
  }
}

// Fonction pour vérifier les limites d'utilisation
async function checkUsageLimits(tenantId: string, req: Request): Promise<void> {
  try {
    const redis = getRedisConnection();
    const tenantMetadata = (req as any).tenantMetadata as TenantMetadata;

    // Vérification des limites d'API calls
    const apiCallKey = `usage:${tenantId}:api_calls:${getCurrentHour()}`;
    const currentApiCalls = await redis.get(apiCallKey) || '0';
    const hourlyLimit = Math.ceil(tenantMetadata.limits.max_api_calls / 24);

    if (parseInt(currentApiCalls) >= hourlyLimit) {
      throw new TenantIsolationError('API usage limit exceeded for this hour');
    }

    // Incrémentation du compteur d'API calls
    await redis.incr(apiCallKey);
    await redis.expire(apiCallKey, 3600); // Expire après 1 heure

    // Vérification des limites d'agents
    if (req.path.includes('/agents') && req.method === 'POST') {
      if (tenantMetadata.usage.agents_created >= tenantMetadata.limits.max_agents) {
        throw new TenantIsolationError('Maximum number of agents reached');
      }
    }

    // Vérification des limites de stockage
    if (req.path.includes('/upload') || req.path.includes('/files')) {
      const contentLength = parseInt(req.get?.('Content-Length') || '0');
      if (tenantMetadata.usage.storage_used + contentLength > tenantMetadata.limits.max_storage) {
        throw new TenantIsolationError('Storage limit exceeded');
      }
    }

  } catch (error) {
    if (error instanceof TenantIsolationError) {
      throw error;
    }
    logger.error('Error checking usage limits', { tenantId, error: (error as Error).message });
  }
}

// Fonction pour vérifier si une route est publique
function isPublicRoute(path: string): boolean {
  const publicRoutes = [
    '/health',
    '/api/v1/auth/login',
    '/api/v1/auth/register',
    '/api/v1/auth/forgot-password',
    '/api/v1/auth/reset-password',
    '/api/v1/webhooks',
    '/api/v1/tenants/register',
  ];

  return publicRoutes.some(route => path.startsWith(route));
}

// Fonction pour obtenir l'heure actuelle (format: YYYY-MM-DD-HH)
function getCurrentHour(): string {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}-${String(now.getHours()).padStart(2, '0')}`;
}

// Middleware pour forcer l'isolation des tenants (même pour les routes publiques)
export const strictTenantIsolation = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  const tenantId = extractTenantId(req);
  
  if (!tenantId) {
    throw new TenantIsolationError('Tenant ID required for this endpoint');
  }

  req.tenantId = tenantId;
  next();
};

// Fonction utilitaire pour vérifier si un utilisateur appartient au tenant
export const verifyUserTenant = (req: Request, userId: string): boolean => {
  const tenantId = req.tenantId;
  const userTenantId = req.user?.tenant_id;

  if (!tenantId || !userTenantId) {
    return false;
  }

  return tenantId === userTenantId;
};

// Fonction pour nettoyer le cache d'un tenant
export const clearTenantCache = async (tenantId: string): Promise<void> => {
  try {
    const redis = getRedisConnection();
    await redis.del(`tenant:${tenantId}`);
    logger.info('Tenant cache cleared', { tenantId });
  } catch (error) {
    logger.error('Error clearing tenant cache', { tenantId, error: (error as Error).message });
  }
};

// Fonction pour mettre à jour les métadonnées du tenant en cache
export const updateTenantCache = async (tenantId: string, metadata: TenantMetadata): Promise<void> => {
  try {
    const redis = getRedisConnection();
    await redis.setex(`tenant:${tenantId}`, 300, JSON.stringify(metadata));
    logger.info('Tenant cache updated', { tenantId });
  } catch (error) {
    logger.error('Error updating tenant cache', { tenantId, error: (error as Error).message });
  }
};

// Middleware pour logger les violations d'isolation
export const isolationLogger = (req: Request, res: Response, next: NextFunction): void => {
  const originalSend = res.send;
  
  res.send = function(data: any) {
    if (res.statusCode === 403 && data.includes('TENANT_ISOLATION_ERROR')) {
      logger.warn('Tenant isolation violation', {
        tenantId: req.tenantId,
        userId: req.userId,
        ip: req.ip,
        userAgent: req.get?.('User-Agent'),
        path: req.path,
        method: req.method,
        requestId: req.requestId,
      });
    }
    
    return originalSend.call(this, data);
  };
  
  next();
};

export default tenantIsolation;




