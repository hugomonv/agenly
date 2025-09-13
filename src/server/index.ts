import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import { config, validateConfig } from '../config/environment';
import { getPostgresConnection, getMongoConnection, getRedisConnection, checkConnections } from '../config/database';
import { logger } from '../utils/logger';
import { errorHandler } from '../middleware/errorHandler';
import { requestLogger } from '../middleware/requestLogger';
import { tenantIsolation } from '../auth/tenant-isolation/tenantIsolation';
import { subscriptionCheck } from '../auth/subscription-check/subscriptionCheck';

// Import des routes
import authRoutes from '../routes/auth';
import tenantRoutes from '../routes/tenants';
import agentRoutes from '../routes/agents';
import conversationRoutes from '../routes/conversations';
import integrationRoutes from '../routes/integrations';
import billingRoutes from '../routes/billing';
import analyticsRoutes from '../routes/analytics';
import webhookRoutes from '../routes/webhooks';
import chatRoutes from '../routes/chat';
import deploymentRoutes from '../routes/deployment';
import oauthRoutes from '../routes/oauth-test';
import integrationsRealRoutes from '../routes/integrations-real';

class Server {
  private app: express.Application;
  private server: any;

  constructor() {
    this.app = express();
    this.setupMiddleware();
    this.setupRoutes();
    this.setupErrorHandling();
  }

  private setupMiddleware(): void {
    // Sécurité de base
    this.app.use(helmet({
      contentSecurityPolicy: {
        directives: {
          defaultSrc: ["'self'"],
          styleSrc: ["'self'", "'unsafe-inline'"],
          scriptSrc: ["'self'"],
          imgSrc: ["'self'", "data:", "https:"],
        },
      },
      crossOriginEmbedderPolicy: false,
    }));

    // CORS
    this.app.use(cors({
      origin: config.cors.origin,
      credentials: config.cors.credentials,
      methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
      allowedHeaders: ['Content-Type', 'Authorization', 'X-Tenant-ID', 'X-Request-ID'],
    }));

    // Rate limiting
    const limiter = rateLimit({
      windowMs: config.security.rateLimit.windowMs,
      max: config.security.rateLimit.maxRequests,
      message: {
        error: 'Too many requests from this IP, please try again later.',
        retryAfter: Math.ceil(config.security.rateLimit.windowMs / 1000),
      },
      standardHeaders: true,
      legacyHeaders: false,
      skip: (req) => {
        // Skip rate limiting for health checks
        return req.path === '/health';
      },
    });
    this.app.use(limiter);

    // Body parsing
    this.app.use(express.json({ limit: '10mb' }));
    this.app.use(express.urlencoded({ extended: true, limit: '10mb' }));

    // Request logging
    this.app.use(requestLogger);

    // Tenant isolation middleware
    this.app.use(tenantIsolation);

    // Subscription check middleware (pour les routes protégées)
    this.app.use('/api/v1', subscriptionCheck);
  }

  private setupRoutes(): void {
    // Health check
    this.app.get('/health', async (req: any, res: any) => {
      try {
        const connections = await checkConnections();
        const health = {
          status: 'ok',
          timestamp: new Date().toISOString(),
          version: config.app.version,
          environment: config.app.environment,
          connections,
          uptime: process.uptime(),
          memory: process.memoryUsage(),
        };
        
        const allHealthy = Object.values(connections).every(status => status);
        res.status(allHealthy ? 200 : 503).json(health);
      } catch (error) {
        logger.error('Health check failed:', error);
        res.status(503).json({
          status: 'error',
          timestamp: new Date().toISOString(),
          error: 'Health check failed',
        });
      }
    });

    // API Routes
    this.app.use('/api/v1/auth', authRoutes);
    this.app.use('/api/v1/tenants', tenantRoutes);
    this.app.use('/api/v1/agents', agentRoutes);
    this.app.use('/api/v1/conversations', conversationRoutes);
    this.app.use('/api/v1/integrations', integrationRoutes);
    this.app.use('/api/v1/billing', billingRoutes);
    this.app.use('/api/v1/analytics', analyticsRoutes);
    this.app.use('/api/v1/webhooks', webhookRoutes);
    this.app.use('/api/oauth', oauthRoutes);
    this.app.use('/api/deployment', deploymentRoutes);
    this.app.use('/api/integrations-real', integrationsRealRoutes);
    this.app.use('/api', chatRoutes);

    // 404 handler
    this.app.use('*', (req, res) => {
      res.status(404).json({
        success: false,
        error: {
          code: 'NOT_FOUND',
          message: `Route ${req.method} ${req.originalUrl} not found`,
        },
      });
    });
  }

  private setupErrorHandling(): void {
    this.app.use(errorHandler);
  }

  public async start(): Promise<void> {
    try {
      // Validation de la configuration
      validateConfig();

      // Initialisation des connexions
      logger.info('Initializing database connections...');
      await this.initializeConnections();

      // Démarrage du serveur
      this.server = this.app.listen(config.app.port, () => {
        logger.info(`🚀 AGENLY Platform started successfully`);
        logger.info(`📡 Server running on port ${config.app.port}`);
        logger.info(`🌍 Environment: ${config.app.environment}`);
        logger.info(`📊 API Version: ${config.app.apiVersion}`);
        logger.info(`🔗 Health check: http://localhost:${config.app.port}/health`);
      });

      // Gestion des signaux de fermeture
      this.setupGracefulShutdown();

    } catch (error) {
      logger.error('Failed to start server:', error);
      process.exit(1);
    }
  }

  private async initializeConnections(): Promise<void> {
    try {
      // PostgreSQL
      const pg = getPostgresConnection();
      await pg.raw('SELECT 1');
      logger.info('✅ PostgreSQL connected');

      // MongoDB
      const mongo = await getMongoConnection();
      await mongo.db().admin().ping();
      logger.info('✅ MongoDB connected');

      // Redis
      const redis = getRedisConnection();
      await redis.ping();
      logger.info('✅ Redis connected');

    } catch (error) {
      logger.error('Database connection failed:', error);
      throw error;
    }
  }

  private setupGracefulShutdown(): void {
    const signals = ['SIGTERM', 'SIGINT', 'SIGUSR2'];
    
    signals.forEach(signal => {
      process.on(signal, async () => {
        logger.info(`Received ${signal}, shutting down gracefully...`);
        
        if (this.server) {
          this.server.close(async () => {
            logger.info('HTTP server closed');
            
            try {
              // Fermeture des connexions
              const { closeConnections } = await import('../config/database');
              await closeConnections();
              logger.info('Database connections closed');
              
              process.exit(0);
            } catch (error) {
              logger.error('Error during shutdown:', error);
              process.exit(1);
            }
          });
        }
      });
    });

    // Gestion des erreurs non capturées
    process.on('uncaughtException', (error) => {
      logger.error('Uncaught Exception:', error);
      process.exit(1);
    });

    process.on('unhandledRejection', (reason, promise) => {
      logger.error('Unhandled Rejection at:', promise, 'reason:', reason);
      process.exit(1);
    });
  }

  public getApp(): express.Application {
    return this.app;
  }
}

// Démarrage du serveur
if (require.main === module) {
  const server = new Server();
  server.start().catch((error) => {
    logger.error('Failed to start server:', error);
    process.exit(1);
  });
}

export default Server;




