import { Request, Response, NextFunction } from 'express';
import { SubscriptionError, TenantIsolationError } from '../../middleware/errorHandler';
import { logger } from '../../utils/logger';
import { getRedisConnection } from '../../config/database';

// Interface pour les informations d'abonnement
interface SubscriptionInfo {
  id: string;
  tenant_id: string;
  plan: 'trial' | 'starter' | 'professional' | 'enterprise';
  status: 'active' | 'past_due' | 'canceled' | 'unpaid' | 'suspended';
  current_period_start: Date;
  current_period_end: Date;
  cancel_at_period_end: boolean;
  grace_period_ends_at?: Date;
  features_enabled: string[];
  limits: {
    max_agents: number;
    max_api_calls: number;
    max_storage: number;
    max_integrations: number;
  };
  usage: {
    agents_created: number;
    api_calls: number;
    storage_used: number;
    integrations_active: number;
  };
}

// Middleware de vérification d'abonnement
export const subscriptionCheck = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    // Vérification que le tenant est défini
    if (!req.tenantId) {
      throw new TenantIsolationError('Tenant ID required for subscription check');
    }

    // Récupération des informations d'abonnement
    const subscription = await getSubscriptionInfo(req.tenantId);
    
    if (!subscription) {
      throw new SubscriptionError('No active subscription found');
    }

    // Vérification du statut de l'abonnement
    await validateSubscriptionStatus(subscription, req);

    // Vérification des limites d'utilisation
    await checkSubscriptionLimits(subscription, req);

    // Ajout des informations d'abonnement à la requête
    (req as any).subscription = subscription;

    // Log de l'accès avec abonnement
    logger.info('Subscription access granted', {
      tenantId: req.tenantId,
      plan: subscription.plan,
      status: subscription.status,
      requestId: req.requestId,
      userId: req.userId,
    });

    next();
  } catch (error) {
    logger.error('Subscription check failed', {
      error: (error as Error).message,
      tenantId: req.tenantId,
      requestId: req.requestId,
      userId: req.userId,
    });
    throw error;
  }
};

// Fonction pour récupérer les informations d'abonnement
async function getSubscriptionInfo(tenantId: string): Promise<SubscriptionInfo | null> {
  try {
    const redis = getRedisConnection();
    
    // Tentative de récupération depuis le cache Redis
    const cachedSubscription = await redis.get(`subscription:${tenantId}`);
    
    if (cachedSubscription) {
      const subscription = JSON.parse(cachedSubscription);
      // Conversion des dates
      subscription.current_period_start = new Date(subscription.current_period_start);
      subscription.current_period_end = new Date(subscription.current_period_end);
      if (subscription.grace_period_ends_at) {
        subscription.grace_period_ends_at = new Date(subscription.grace_period_ends_at);
      }
      return subscription;
    }

    // Si pas en cache, récupération depuis la base de données
    const subscription = await getSubscriptionFromDatabase(tenantId);
    
    if (subscription) {
      // Mise en cache pour 5 minutes
      await redis.setex(`subscription:${tenantId}`, 300, JSON.stringify(subscription));
      return subscription;
    }

    return null;
  } catch (error) {
    logger.error('Error fetching subscription info', { tenantId, error: (error as Error).message });
    return null;
  }
}

// Fonction pour récupérer l'abonnement depuis la base de données
async function getSubscriptionFromDatabase(tenantId: string): Promise<SubscriptionInfo | null> {
  try {
    // TODO: Implémenter la récupération depuis PostgreSQL
    // Pour l'instant, retourner des données mock
    return {
      id: `sub_${tenantId}`,
      tenant_id: tenantId,
      plan: 'professional',
      status: 'active',
      current_period_start: new Date(),
      current_period_end: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 jours
      cancel_at_period_end: false,
      features_enabled: ['agents', 'integrations', 'analytics', 'webhooks'],
      limits: {
        max_agents: 25,
        max_api_calls: 100000,
        max_storage: 10000,
        max_integrations: 10,
      },
      usage: {
        agents_created: 5,
        api_calls: 1500,
        storage_used: 500,
        integrations_active: 3,
      },
    };
  } catch (error) {
    logger.error('Error fetching subscription from database', { tenantId, error: (error as Error).message });
    return null;
  }
}

// Fonction pour valider le statut de l'abonnement
async function validateSubscriptionStatus(subscription: SubscriptionInfo, req: Request): Promise<void> {
  const now = new Date();

  // Vérification du statut de l'abonnement
  switch (subscription.status) {
    case 'active':
      // Vérification de la période de facturation
      if (now > subscription.current_period_end) {
        throw new SubscriptionError('Subscription period expired');
      }
      break;

    case 'past_due':
      // Période de grâce de 7 jours
      const gracePeriodEnd = new Date(subscription.current_period_end.getTime() + 7 * 24 * 60 * 60 * 1000);
      if (now > gracePeriodEnd) {
        throw new SubscriptionError('Grace period expired. Please update your payment method.');
      }
      break;

    case 'canceled':
      // Vérification si l'annulation est effective
      if (now > subscription.current_period_end) {
        throw new SubscriptionError('Subscription has been canceled');
      }
      break;

    case 'unpaid':
      throw new SubscriptionError('Payment required. Please update your payment method.');

    case 'suspended':
      throw new SubscriptionError('Subscription suspended. Please contact support.');

    default:
      throw new SubscriptionError('Invalid subscription status');
  }

  // Vérification des fonctionnalités pour les routes spécifiques
  await checkFeatureAccess(subscription, req);
}

// Fonction pour vérifier l'accès aux fonctionnalités
async function checkFeatureAccess(subscription: SubscriptionInfo, req: Request): Promise<void> {
  const path = req.path;
  const method = req.method;

  // Vérification de l'accès aux agents
  if (path.includes('/agents')) {
    if (!subscription.features_enabled.includes('agents')) {
      throw new SubscriptionError('Agent feature not available in your plan');
    }
  }

  // Vérification de l'accès aux intégrations
  if (path.includes('/integrations')) {
    if (!subscription.features_enabled.includes('integrations')) {
      throw new SubscriptionError('Integrations feature not available in your plan');
    }
  }

  // Vérification de l'accès aux analytics
  if (path.includes('/analytics')) {
    if (!subscription.features_enabled.includes('analytics')) {
      throw new SubscriptionError('Analytics feature not available in your plan');
    }
  }

  // Vérification de l'accès aux webhooks
  if (path.includes('/webhooks')) {
    if (!subscription.features_enabled.includes('webhooks')) {
      throw new SubscriptionError('Webhooks feature not available in your plan');
    }
  }
}

// Fonction pour vérifier les limites d'abonnement
async function checkSubscriptionLimits(subscription: SubscriptionInfo, req: Request): Promise<void> {
  const path = req.path;
  const method = req.method;

  // Vérification des limites d'agents
  if (path.includes('/agents') && method === 'POST') {
    if (subscription.usage.agents_created >= subscription.limits.max_agents) {
      throw new SubscriptionError(`Maximum number of agents (${subscription.limits.max_agents}) reached for your plan`);
    }
  }

  // Vérification des limites d'intégrations
  if (path.includes('/integrations') && method === 'POST') {
    if (subscription.usage.integrations_active >= subscription.limits.max_integrations) {
      throw new SubscriptionError(`Maximum number of integrations (${subscription.limits.max_integrations}) reached for your plan`);
    }
  }

  // Vérification des limites de stockage
  if (path.includes('/upload') || path.includes('/files')) {
    const contentLength = parseInt(req.get?.('Content-Length') || '0');
    if (subscription.usage.storage_used + contentLength > subscription.limits.max_storage) {
      throw new SubscriptionError(`Storage limit (${subscription.limits.max_storage}MB) exceeded for your plan`);
    }
  }
}

// Middleware pour les plans spécifiques
export const requirePlan = (requiredPlans: string[]) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    const subscription = (req as any).subscription as SubscriptionInfo;
    
    if (!subscription) {
      throw new SubscriptionError('Subscription information not available');
    }

    if (!requiredPlans.includes(subscription.plan)) {
      throw new SubscriptionError(`This feature requires one of the following plans: ${requiredPlans.join(', ')}`);
    }

    next();
  };
};

// Middleware pour les fonctionnalités spécifiques
export const requireFeature = (feature: string) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    const subscription = (req as any).subscription as SubscriptionInfo;
    
    if (!subscription) {
      throw new SubscriptionError('Subscription information not available');
    }

    if (!subscription.features_enabled.includes(feature)) {
      throw new SubscriptionError(`Feature '${feature}' not available in your plan`);
    }

    next();
  };
};

// Fonction pour mettre à jour l'utilisation d'un tenant
export const updateUsage = async (tenantId: string, usageType: string, increment: number = 1): Promise<void> => {
  try {
    const redis = getRedisConnection();
    const key = `usage:${tenantId}:${usageType}`;
    
    await redis.incrby(key, increment);
    await redis.expire(key, 86400); // Expire après 24 heures

    logger.info('Usage updated', { tenantId, usageType, increment });
  } catch (error) {
    logger.error('Error updating usage', { tenantId, usageType, increment, error: (error as Error).message });
  }
};

// Fonction pour vérifier si un tenant peut créer un agent
export const canCreateAgent = async (tenantId: string): Promise<boolean> => {
  try {
    const subscription = await getSubscriptionInfo(tenantId);
    
    if (!subscription) {
      return false;
    }

    return subscription.usage.agents_created < subscription.limits.max_agents;
  } catch (error) {
    logger.error('Error checking agent creation limit', { tenantId, error: (error as Error).message });
    return false;
  }
};

// Fonction pour vérifier si un tenant peut créer une intégration
export const canCreateIntegration = async (tenantId: string): Promise<boolean> => {
  try {
    const subscription = await getSubscriptionInfo(tenantId);
    
    if (!subscription) {
      return false;
    }

    return subscription.usage.integrations_active < subscription.limits.max_integrations;
  } catch (error) {
    logger.error('Error checking integration creation limit', { tenantId, error: (error as Error).message });
    return false;
  }
};

// Fonction pour nettoyer le cache d'abonnement
export const clearSubscriptionCache = async (tenantId: string): Promise<void> => {
  try {
    const redis = getRedisConnection();
    await redis.del(`subscription:${tenantId}`);
    logger.info('Subscription cache cleared', { tenantId });
  } catch (error) {
    logger.error('Error clearing subscription cache', { tenantId, error: (error as Error).message });
  }
};

// Fonction pour mettre à jour le cache d'abonnement
export const updateSubscriptionCache = async (tenantId: string, subscription: SubscriptionInfo): Promise<void> => {
  try {
    const redis = getRedisConnection();
    await redis.setex(`subscription:${tenantId}`, 300, JSON.stringify(subscription));
    logger.info('Subscription cache updated', { tenantId });
  } catch (error) {
    logger.error('Error updating subscription cache', { tenantId, error: (error as Error).message });
  }
};

export default subscriptionCheck;




