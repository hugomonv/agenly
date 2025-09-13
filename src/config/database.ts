import { Knex } from 'knex';
import { MongoClient } from 'mongodb';
import Redis from 'ioredis';

// Configuration PostgreSQL (métadonnées)
export const postgresConfig: Knex.Config = {
  client: 'pg',
  connection: {
    host: process.env.POSTGRES_HOST || 'localhost',
    port: parseInt(process.env.POSTGRES_PORT || '5432'),
    user: process.env.POSTGRES_USER || 'agenly',
    password: process.env.POSTGRES_PASSWORD || 'password',
    database: process.env.POSTGRES_DB || 'agenly_platform',
    ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
  },
  pool: {
    min: 2,
    max: 20,
    acquireTimeoutMillis: 60000,
    createTimeoutMillis: 30000,
    destroyTimeoutMillis: 5000,
    idleTimeoutMillis: 30000,
    reapIntervalMillis: 1000,
    createRetryIntervalMillis: 200,
  },
  migrations: {
    directory: './src/database/migrations',
    tableName: 'knex_migrations',
  },
  seeds: {
    directory: './src/database/seeds',
  },
  debug: process.env.NODE_ENV === 'development',
};

// Configuration MongoDB (configurations d'agents)
export const mongoConfig = {
  uri: process.env.MONGODB_URI || 'mongodb://localhost:27017/agenly_agents',
  options: {
    maxPoolSize: 20,
    serverSelectionTimeoutMS: 5000,
    socketTimeoutMS: 45000,
    // Removed deprecated options: bufferMaxEntries and bufferCommands
  },
};

// Configuration Redis (cache et queues)
export const redisConfig = {
  host: process.env.REDIS_HOST || 'localhost',
  port: parseInt(process.env.REDIS_PORT || '6379'),
  password: process.env.REDIS_PASSWORD,
  db: parseInt(process.env.REDIS_DB || '0'),
  retryDelayOnFailover: 100,
  maxRetriesPerRequest: 3,
  lazyConnect: true,
  keepAlive: 30000,
  connectTimeout: 10000,
  commandTimeout: 5000,
  retryDelayOnClusterDown: 300,
  enableOfflineQueue: true,
  maxLoadingTimeout: 10000,
};

// Configuration Bull Queue
export const queueConfig = {
  redis: redisConfig,
  defaultJobOptions: {
    removeOnComplete: 100,
    removeOnFail: 50,
    attempts: 3,
    backoff: {
      type: 'exponential',
      delay: 2000,
    },
  },
};

// Connexions globales
let postgresConnection: Knex;
let mongoConnection: MongoClient;
let redisConnection: Redis;

export const getPostgresConnection = (): Knex => {
  if (!postgresConnection) {
    const knex = require('knex');
    postgresConnection = knex(postgresConfig);
  }
  return postgresConnection;
};

export const getMongoConnection = async (): Promise<MongoClient> => {
  if (!mongoConnection) {
    const { MongoClient } = require('mongodb');
    mongoConnection = new MongoClient(mongoConfig.uri, mongoConfig.options);
    await mongoConnection.connect();
  }
  return mongoConnection;
};

export const getRedisConnection = (): Redis => {
  if (!redisConnection) {
    redisConnection = new Redis(redisConfig);
  }
  return redisConnection;
};

// Fonctions de fermeture des connexions
export const closeConnections = async (): Promise<void> => {
  if (postgresConnection) {
    await postgresConnection.destroy();
  }
  if (mongoConnection) {
    await mongoConnection.close();
  }
  if (redisConnection) {
    await redisConnection.quit();
  }
};

// Health check des connexions
export const checkConnections = async (): Promise<{
  postgres: boolean;
  mongodb: boolean;
  redis: boolean;
}> => {
  const results = {
    postgres: false,
    mongodb: false,
    redis: false,
  };

  try {
    // Test PostgreSQL
    const pg = getPostgresConnection();
    await pg.raw('SELECT 1');
    results.postgres = true;
  } catch (error) {
    console.error('PostgreSQL connection failed:', error);
  }

  try {
    // Test MongoDB
    const mongo = await getMongoConnection();
    await mongo.db().admin().ping();
    results.mongodb = true;
  } catch (error) {
    console.error('MongoDB connection failed:', error);
  }

  try {
    // Test Redis
    const redis = getRedisConnection();
    await redis.ping();
    results.redis = true;
  } catch (error) {
    console.error('Redis connection failed:', error);
  }

  return results;
};




