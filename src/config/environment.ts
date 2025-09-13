import { z } from 'zod';

// Schéma de validation des variables d'environnement
const envSchema = z.object({
  // Application
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  PORT: z.string().default('3000'),
  API_VERSION: z.string().default('v1'),
  
  // Base de données
  POSTGRES_HOST: z.string().default('localhost'),
  POSTGRES_PORT: z.string().default('5432'),
  POSTGRES_USER: z.string().default('agenly'),
  POSTGRES_PASSWORD: z.string().default('password'),
  POSTGRES_DB: z.string().default('agenly_platform'),
  
  MONGODB_URI: z.string().default('mongodb://localhost:27017/agenly_agents'),
  
  REDIS_HOST: z.string().default('localhost'),
  REDIS_PORT: z.string().default('6379'),
  REDIS_PASSWORD: z.string().optional(),
  REDIS_DB: z.string().default('0'),
  
  // OpenAI
  OPENAI_API_KEY: z.string().min(1, 'OpenAI API key is required'),
  OPENAI_ORGANIZATION: z.string().optional(),
  
  // Stripe
  STRIPE_SECRET_KEY: z.string().min(1, 'Stripe secret key is required'),
  STRIPE_PUBLISHABLE_KEY: z.string().min(1, 'Stripe publishable key is required'),
  STRIPE_WEBHOOK_SECRET: z.string().min(1, 'Stripe webhook secret is required'),
  
  // JWT
  JWT_SECRET: z.string().min(32, 'JWT secret must be at least 32 characters'),
  JWT_REFRESH_SECRET: z.string().min(32, 'JWT refresh secret must be at least 32 characters'),
  JWT_EXPIRES_IN: z.string().default('15m'),
  JWT_REFRESH_EXPIRES_IN: z.string().default('7d'),
  
  // Chiffrement
  ENCRYPTION_KEY: z.string().min(32, 'Encryption key must be at least 32 characters'),
  
  // Rate Limiting
  RATE_LIMIT_WINDOW_MS: z.string().transform(Number).default('900000'), // 15 minutes
  RATE_LIMIT_MAX_REQUESTS: z.string().transform(Number).default('100'),
  
  // Monitoring
  SENTRY_DSN: z.string().optional(),
  LOG_LEVEL: z.enum(['error', 'warn', 'info', 'debug']).default('info'),
  
  // CORS
  CORS_ORIGIN: z.string().default('http://localhost:3000'),
  
  // Google OAuth
  GOOGLE_CLIENT_ID: z.string().min(1, 'Google Client ID is required'),
  GOOGLE_CLIENT_SECRET: z.string().min(1, 'Google Client Secret is required'),
  
  // Email
  SMTP_HOST: z.string().optional(),
  SMTP_PORT: z.string().transform(Number).optional(),
  SMTP_USER: z.string().optional(),
  SMTP_PASSWORD: z.string().optional(),
  FROM_EMAIL: z.string().email().optional(),
  
  // File Storage
  AWS_ACCESS_KEY_ID: z.string().optional(),
  AWS_SECRET_ACCESS_KEY: z.string().optional(),
  AWS_REGION: z.string().default('us-east-1'),
  AWS_S3_BUCKET: z.string().optional(),
  
  // Webhooks
  WEBHOOK_SECRET: z.string().min(32, 'Webhook secret must be at least 32 characters'),
  
  // Feature Flags
  ENABLE_ANALYTICS: z.string().transform(val => val === 'true').default('true'),
  ENABLE_MONITORING: z.string().transform(val => val === 'true').default('true'),
  ENABLE_CACHING: z.string().transform(val => val === 'true').default('true'),
});

// Validation et parsing des variables d'environnement
const parseEnv = () => {
  try {
    return envSchema.parse(process.env);
  } catch (error) {
    if (error instanceof z.ZodError) {
      console.error('❌ Environment validation failed:');
      error.errors.forEach(err => {
        console.error(`  - ${err.path.join('.')}: ${err.message}`);
      });
      process.exit(1);
    }
    throw error;
  }
};

export const env = parseEnv();

// Configuration par environnement
export const config = {
  
  database: {
    postgres: {
      host: env.POSTGRES_HOST,
      port: env.POSTGRES_PORT,
      user: env.POSTGRES_USER,
      password: env.POSTGRES_PASSWORD,
      database: env.POSTGRES_DB,
    },
    mongodb: {
      uri: env.MONGODB_URI,
    },
    redis: {
      host: env.REDIS_HOST,
      port: env.REDIS_PORT,
      password: env.REDIS_PASSWORD,
      db: env.REDIS_DB,
    },
  },
  
  openai: {
    apiKey: env.OPENAI_API_KEY,
    organization: env.OPENAI_ORGANIZATION,
    models: {
      chat: 'gpt-4o',
      chatMini: 'gpt-4o-mini',
      embedding: 'text-embedding-3-small',
    },
    limits: {
      maxTokens: 4096,
      temperature: 0.7,
      timeout: 30000,
    },
  },
  
  stripe: {
    secretKey: env.STRIPE_SECRET_KEY,
    publishableKey: env.STRIPE_PUBLISHABLE_KEY,
    webhookSecret: env.STRIPE_WEBHOOK_SECRET,
    plans: {
      trial: {
        priceId: 'price_trial',
        maxAgents: 1,
        maxApiCalls: 1000,
        maxStorage: 100, // MB
      },
      starter: {
        priceId: 'price_starter',
        maxAgents: 5,
        maxApiCalls: 10000,
        maxStorage: 1000, // MB
      },
      professional: {
        priceId: 'price_professional',
        maxAgents: 25,
        maxApiCalls: 100000,
        maxStorage: 10000, // MB
      },
      enterprise: {
        priceId: 'price_enterprise',
        maxAgents: -1, // Unlimited
        maxApiCalls: -1, // Unlimited
        maxStorage: -1, // Unlimited
      },
    },
  },
  
  auth: {
    jwtSecret: env.JWT_SECRET,
    jwtRefreshSecret: env.JWT_REFRESH_SECRET,
    jwtExpiresIn: env.JWT_EXPIRES_IN,
    jwtRefreshExpiresIn: env.JWT_REFRESH_EXPIRES_IN,
  },
  
  security: {
    encryptionKey: env.ENCRYPTION_KEY,
    bcryptRounds: 12,
    rateLimit: {
      windowMs: env.RATE_LIMIT_WINDOW_MS,
      maxRequests: env.RATE_LIMIT_MAX_REQUESTS,
    },
  },
  
  monitoring: {
    sentryDsn: env.SENTRY_DSN,
    logLevel: env.LOG_LEVEL,
  },
  
  cors: {
    origin: env.CORS_ORIGIN.split(','),
    credentials: true,
  },
  
  google: {
    clientId: env.GOOGLE_CLIENT_ID,
    clientSecret: env.GOOGLE_CLIENT_SECRET,
  },
  
  app: {
    name: 'AGENLY Platform',
    version: '1.0.0',
    environment: env.NODE_ENV,
    port: parseInt(env.PORT),
    apiVersion: env.API_VERSION,
    baseUrl: env.NODE_ENV === 'production' ? 'https://app.agenly.fr' : 'http://localhost:3000',
  },
  
  email: {
    smtp: {
      host: env.SMTP_HOST,
      port: env.SMTP_PORT,
      user: env.SMTP_USER,
      password: env.SMTP_PASSWORD,
    },
    from: env.FROM_EMAIL,
  },
  
  storage: {
    aws: {
      accessKeyId: env.AWS_ACCESS_KEY_ID,
      secretAccessKey: env.AWS_SECRET_ACCESS_KEY,
      region: env.AWS_REGION,
      bucket: env.AWS_S3_BUCKET,
    },
  },
  
  webhooks: {
    secret: env.WEBHOOK_SECRET,
  },
  
  features: {
    analytics: env.ENABLE_ANALYTICS,
    monitoring: env.ENABLE_MONITORING,
    caching: env.ENABLE_CACHING,
  },
};

// Validation de la configuration critique
export const validateConfig = (): void => {
  const criticalConfigs = [
    { key: 'OpenAI API Key', value: config.openai.apiKey },
    { key: 'JWT Secret', value: config.auth.jwtSecret },
    { key: 'Encryption Key', value: config.security.encryptionKey },
    { key: 'Stripe Secret Key', value: config.stripe.secretKey },
  ];
  
  const missing = criticalConfigs.filter(item => !item.value);
  
  if (missing.length > 0) {
    console.error('❌ Missing critical configuration:');
    missing.forEach(item => {
      console.error(`  - ${item.key}`);
    });
    process.exit(1);
  }
  
  console.log('✅ Configuration validated successfully');
};

// Export des types pour TypeScript
export type Config = typeof config;
export type Environment = typeof env;




