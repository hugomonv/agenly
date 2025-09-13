// Serveur simple pour tester les connexions aux bases de données
require('dotenv').config({ path: '.env.local' });
const express = require('express');
const { Pool } = require('pg');
const { MongoClient } = require('mongodb');
const Redis = require('ioredis');
const OpenAI = require('openai');
const MasterAgentService = require('./src/services/master-agent/MasterAgentService');

const app = express();
const port = 3001;

// Configuration des bases de données
const postgresConfig = {
  host: process.env.POSTGRES_HOST || 'localhost',
  port: process.env.POSTGRES_PORT || 5432,
  database: process.env.POSTGRES_DB || 'agenly_platform',
  user: process.env.POSTGRES_USER || 'agenly',
  password: process.env.POSTGRES_PASSWORD || 'agenly_password',
};

const mongoConfig = {
  uri: process.env.MONGODB_URI || 'mongodb://agenly:agenly_password@localhost:27017/agenly_agents?authSource=admin',
};

const redisConfig = {
  host: process.env.REDIS_HOST || 'localhost',
  port: process.env.REDIS_PORT || 6379,
  password: process.env.REDIS_PASSWORD || 'agenly_redis_password',
};

// Initialisation des connexions
const postgresPool = new Pool(postgresConfig);
const mongoClient = new MongoClient(mongoConfig.uri);
const redisClient = new Redis(redisConfig);

// Initialisation OpenAI
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// Initialisation Master Agent
const masterAgent = new MasterAgentService();

// Middleware
app.use(express.json());

// CORS middleware pour permettre les requêtes depuis le frontend
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', 'http://localhost:3000');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization');
  
  // Gérer les requêtes preflight OPTIONS
  if (req.method === 'OPTIONS') {
    res.sendStatus(200);
  } else {
    next();
  }
});

// Route de test simple
app.get('/', (req, res) => {
  res.json({
    message: 'AGENLY Backend Server',
    status: 'running',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development'
  });
});

// Route de test des bases de données
app.get('/health', async (req, res) => {
  const health = {
    status: 'ok',
    timestamp: new Date().toISOString(),
    services: {}
  };

  try {
    // Test PostgreSQL
    const pgResult = await postgresPool.query('SELECT NOW() as timestamp, version() as version');
    health.services.postgres = {
      status: 'ok',
      timestamp: pgResult.rows[0].timestamp,
      version: pgResult.rows[0].version.split(' ')[0] + ' ' + pgResult.rows[0].version.split(' ')[1]
    };
  } catch (error) {
    health.services.postgres = {
      status: 'error',
      error: error.message
    };
  }

  try {
    // Test MongoDB
    await mongoClient.connect();
    const db = mongoClient.db('agenly_agents');
    const result = await db.admin().ping();
    health.services.mongodb = {
      status: 'ok',
      response: result
    };
  } catch (error) {
    health.services.mongodb = {
      status: 'error',
      error: error.message
    };
  }

  try {
    // Test Redis
    const redisResult = await redisClient.ping();
    health.services.redis = {
      status: 'ok',
      response: redisResult
    };
  } catch (error) {
    health.services.redis = {
      status: 'error',
      error: error.message
    };
  }

  const allHealthy = Object.values(health.services).every(service => service.status === 'ok');
  res.status(allHealthy ? 200 : 503).json(health);
});

// Routes OAuth2 Google
app.get('/api/oauth/google/status', (req, res) => {
  console.log('🔗 OAuth status check...');
  res.json({
    success: true,
    data: {
      connected: false,
      services: {
        calendar: false,
        gmail: false,
        drive: false
      },
      lastSync: null
    }
  });
});

app.post('/api/oauth/google/connect', (req, res) => {
  const { scopes, service } = req.body;
  console.log('🔗 OAuth connection initiated...', { scopes, service });
  
  if (!scopes || !Array.isArray(scopes)) {
    return res.status(400).json({
      success: false,
      error: 'Scopes are required and must be an array'
    });
  }

  const state = JSON.stringify({
    service: service || 'default',
    timestamp: Date.now()
  });

  const authUrl = `https://accounts.google.com/oauth/authorize?` +
    `client_id=${process.env.GOOGLE_CLIENT_ID}&` +
    `scope=${scopes.join(' ')}&` +
    `response_type=code&` +
    `redirect_uri=http://localhost:3000/api/auth/callback/google&` +
    `state=${encodeURIComponent(state)}&` +
    `access_type=offline&` +
    `prompt=consent`;

  res.json({
    success: true,
    data: {
      authUrl,
      state
    }
  });
});

app.post('/api/oauth/google/callback', (req, res) => {
  const { code, state } = req.body;
  console.log('🔗 OAuth callback received...', { code: code ? 'present' : 'missing', state });
  
  if (!code) {
    return res.status(400).json({
      success: false,
      error: 'Authorization code is required'
    });
  }

  let stateData;
  try {
    stateData = JSON.parse(state || '{}');
  } catch (error) {
    return res.status(400).json({
      success: false,
      error: 'Invalid state parameter'
    });
  }

  res.json({
    success: true,
    data: {
      message: 'OAuth callback processed successfully',
      service: stateData.service
    }
  });
});

// Routes d'authentification utilisateurs
app.post('/api/auth/register', async (req, res) => {
  const { email, password, name, company } = req.body;
  console.log('🔐 User registration...', { email, name, company });
  
  if (!email || !password || !name) {
    return res.status(400).json({
      success: false,
      error: 'Email, password and name are required'
    });
  }

  // TODO: Vérifier si l'utilisateur existe déjà
  // TODO: Hasher le mot de passe
  // TODO: Créer l'utilisateur en base de données
  // TODO: Créer le tenant

  const user = {
    id: `user_${Date.now()}`,
    email,
    name,
    company: company || 'Default Company',
    role: 'admin',
    created_at: new Date().toISOString()
  };

  const tenant = {
    id: `tenant_${Date.now()}`,
    name: company || 'Default Company',
    owner_id: user.id,
    created_at: new Date().toISOString()
  };

  res.json({
    success: true,
    data: {
      user,
      tenant,
      message: 'User registered successfully'
    }
  });
});

app.post('/api/auth/login', async (req, res) => {
  const { email, password } = req.body;
  console.log('🔐 User login...', { email });
  
  if (!email || !password) {
    return res.status(400).json({
      success: false,
      error: 'Email and password are required'
    });
  }

  // TODO: Vérifier les identifiants en base de données
  // TODO: Comparer le mot de passe hashé
  // TODO: Générer les tokens JWT

  const user = {
    id: `user_${Date.now()}`,
    email,
    name: 'Test User',
    role: 'admin',
    tenant_id: `tenant_${Date.now()}`
  };

  const tokens = {
    access_token: `access_token_${Date.now()}`,
    refresh_token: `refresh_token_${Date.now()}`,
    expires_in: 3600
  };

  res.json({
    success: true,
    data: {
      user,
      tokens,
      message: 'Login successful'
    }
  });
});

app.post('/api/auth/refresh', async (req, res) => {
  const { refresh_token } = req.body;
  console.log('🔐 Token refresh...');
  
  if (!refresh_token) {
    return res.status(400).json({
      success: false,
      error: 'Refresh token is required'
    });
  }

  // TODO: Vérifier le refresh token
  // TODO: Générer un nouveau access token

  const tokens = {
    access_token: `new_access_token_${Date.now()}`,
    expires_in: 3600
  };

  res.json({
    success: true,
    data: {
      tokens,
      message: 'Token refreshed successfully'
    }
  });
});

app.post('/api/auth/logout', async (req, res) => {
  const { refresh_token } = req.body;
  console.log('🔐 User logout...');
  
  // TODO: Invalider le refresh token en base de données

  res.json({
    success: true,
    message: 'Logout successful'
  });
});

// Routes pour les modèles de base de données
app.get('/api/users', async (req, res) => {
  console.log('👥 Get users...');
  
  // TODO: Récupérer les utilisateurs depuis PostgreSQL
  const users = [
    {
      id: 'user_1',
      email: 'admin@example.com',
      name: 'Admin User',
      role: 'admin',
      tenant_id: 'tenant_1',
      created_at: new Date().toISOString()
    },
    {
      id: 'user_2',
      email: 'user@example.com',
      name: 'Regular User',
      role: 'user',
      tenant_id: 'tenant_1',
      created_at: new Date().toISOString()
    }
  ];

  res.json({
    success: true,
    data: users
  });
});

app.get('/api/tenants', async (req, res) => {
  console.log('🏢 Get tenants...');
  
  // TODO: Récupérer les tenants depuis PostgreSQL
  const tenants = [
    {
      id: 'tenant_1',
      name: 'Example Company',
      owner_id: 'user_1',
      subscription: {
        plan: 'pro',
        status: 'active',
        expires_at: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString()
      },
      created_at: new Date().toISOString()
    }
  ];

  res.json({
    success: true,
    data: tenants
  });
});

app.get('/api/agents', async (req, res) => {
  console.log('🤖 Get agents...');
  
  // TODO: Récupérer les agents depuis MongoDB
  const agents = [
    {
      id: 'agent_1',
      name: 'Assistant Commercial',
      description: 'Agent IA pour la vente et le support client',
      tenant_id: 'tenant_1',
      created_by: 'user_1',
      status: 'active',
      configuration: {
        personality: {
          tone: 'professional',
          expertise_level: 'expert',
          proactivity: 8
        },
        capabilities: ['sales', 'support', 'calendar'],
        integrations: ['google_calendar', 'gmail']
      },
      created_at: new Date().toISOString()
    }
  ];

  res.json({
    success: true,
    data: agents
  });
});

app.post('/api/agents', async (req, res) => {
  const { name, description, configuration } = req.body;
  console.log('🤖 Create agent...', { name, description });
  
  if (!name || !description) {
    return res.status(400).json({
      success: false,
      error: 'Name and description are required'
    });
  }

  // TODO: Créer l'agent en MongoDB
  const agent = {
    id: `agent_${Date.now()}`,
    name,
    description,
    tenant_id: 'tenant_1', // TODO: Récupérer depuis le token JWT
    created_by: 'user_1', // TODO: Récupérer depuis le token JWT
    status: 'draft',
    configuration: configuration || {
      personality: {
        tone: 'professional',
        expertise_level: 'intermediate',
        proactivity: 5
      },
      capabilities: [],
      integrations: []
    },
    created_at: new Date().toISOString()
  };

  res.json({
    success: true,
    data: agent,
    message: 'Agent created successfully'
  });
});

// Routes pour les vraies intégrations Google
app.post('/api/integrations/google/calendar/create-event', async (req, res) => {
  const { summary, description, startTime, endTime, attendees } = req.body;
  console.log('📅 Create Google Calendar event...', { summary, startTime, endTime });
  
  if (!summary || !startTime || !endTime) {
    return res.status(400).json({
      success: false,
      error: 'Summary, startTime and endTime are required'
    });
  }

  // TODO: Utiliser l'API Google Calendar réelle avec les tokens OAuth2
  // TODO: Vérifier les permissions et l'authentification
  
  const event = {
    id: `event_${Date.now()}`,
    summary,
    description: description || '',
    start: {
      dateTime: startTime,
      timeZone: 'Europe/Paris'
    },
    end: {
      dateTime: endTime,
      timeZone: 'Europe/Paris'
    },
    attendees: attendees || [],
    created: new Date().toISOString(),
    status: 'confirmed'
  };

  res.json({
    success: true,
    data: event,
    message: 'Event created successfully in Google Calendar'
  });
});

app.get('/api/integrations/google/calendar/events', async (req, res) => {
  const { timeMin, timeMax, maxResults } = req.query;
  console.log('📅 Get Google Calendar events...', { timeMin, timeMax, maxResults });
  
  // TODO: Utiliser l'API Google Calendar réelle avec les tokens OAuth2
  // TODO: Vérifier les permissions et l'authentification
  
  const events = [
    {
      id: 'event_1',
      summary: 'Réunion équipe',
      start: {
        dateTime: '2025-09-13T14:00:00+02:00'
      },
      end: {
        dateTime: '2025-09-13T15:00:00+02:00'
      },
      status: 'confirmed'
    },
    {
      id: 'event_2',
      summary: 'Appel client',
      start: {
        dateTime: '2025-09-13T16:00:00+02:00'
      },
      end: {
        dateTime: '2025-09-13T16:30:00+02:00'
      },
      status: 'confirmed'
    }
  ];

  res.json({
    success: true,
    data: {
      events,
      total: events.length
    },
    message: 'Events retrieved successfully from Google Calendar'
  });
});

app.post('/api/integrations/google/gmail/send-email', async (req, res) => {
  const { to, subject, body, cc, bcc } = req.body;
  console.log('📧 Send Gmail email...', { to, subject });
  
  if (!to || !subject || !body) {
    return res.status(400).json({
      success: false,
      error: 'To, subject and body are required'
    });
  }

  // TODO: Utiliser l'API Gmail réelle avec les tokens OAuth2
  // TODO: Vérifier les permissions et l'authentification
  
  const message = {
    id: `msg_${Date.now()}`,
    to,
    cc: cc || [],
    bcc: bcc || [],
    subject,
    body,
    sentAt: new Date().toISOString(),
    status: 'sent'
  };

  res.json({
    success: true,
    data: message,
    message: 'Email sent successfully via Gmail'
  });
});

app.get('/api/integrations/google/gmail/emails', async (req, res) => {
  const { query, maxResults } = req.query;
  console.log('📧 Get Gmail emails...', { query, maxResults });
  
  // TODO: Utiliser l'API Gmail réelle avec les tokens OAuth2
  // TODO: Vérifier les permissions et l'authentification
  
  const emails = [
    {
      id: 'msg_1',
      from: 'client@example.com',
      to: 'support@company.com',
      subject: 'Demande de support',
      snippet: 'Bonjour, j\'ai besoin d\'aide avec...',
      date: '2025-09-13T10:00:00Z',
      unread: true
    },
    {
      id: 'msg_2',
      from: 'partner@company.com',
      to: 'business@company.com',
      subject: 'Proposition de partenariat',
      snippet: 'Nous aimerions discuter d\'un partenariat...',
      date: '2025-09-13T09:30:00Z',
      unread: false
    }
  ];

  res.json({
    success: true,
    data: {
      messages: emails,
      total: emails.length
    },
    message: 'Emails retrieved successfully from Gmail'
  });
});

app.get('/api/integrations/google/status', async (req, res) => {
  console.log('🔗 Check Google integrations status...');
  
  // TODO: Vérifier le statut des tokens OAuth2
  // TODO: Tester les connexions aux APIs Google
  
  const status = {
    connected: true,
    services: {
      calendar: {
        connected: true,
        permissions: ['read', 'write'],
        lastSync: new Date().toISOString()
      },
      gmail: {
        connected: true,
        permissions: ['read', 'send'],
        lastSync: new Date().toISOString()
      },
      drive: {
        connected: false,
        permissions: [],
        lastSync: null
      }
    },
    tokens: {
      access_token: 'valid',
      refresh_token: 'valid',
      expires_at: new Date(Date.now() + 3600 * 1000).toISOString()
    }
  };

  res.json({
    success: true,
    data: status,
    message: 'Google integrations status retrieved successfully'
  });
});

// Route de test OpenAI
app.get('/test-openai', async (req, res) => {
  const openaiKey = process.env.OPENAI_API_KEY;
  
  if (!openaiKey || openaiKey.includes('your_openai_api_key_here')) {
    return res.status(400).json({
      status: 'error',
      message: 'OpenAI API key not configured'
    });
  }

  try {
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${openaiKey}`,
      },
      body: JSON.stringify({
        model: 'gpt-3.5-turbo',
        messages: [{ role: 'user', content: 'Hello, test message' }],
        max_tokens: 10,
      }),
    });

    const data = await response.json();

    if (response.ok) {
      res.json({
        status: 'ok',
        message: 'OpenAI API is working',
        response: data.choices[0].message.content
      });
    } else {
      res.status(400).json({
        status: 'error',
        message: 'OpenAI API error',
        error: data
      });
    }
  } catch (error) {
    res.status(500).json({
      status: 'error',
      message: 'OpenAI API test failed',
      error: error.message
    });
  }
});

// Route de test des variables d'environnement
app.get('/env-check', (req, res) => {
  const envVars = {
    NODE_ENV: process.env.NODE_ENV,
    OPENAI_API_KEY: process.env.OPENAI_API_KEY ? 'SET' : 'NOT SET',
    STRIPE_SECRET_KEY: process.env.STRIPE_SECRET_KEY ? 'SET' : 'NOT SET',
    JWT_SECRET: process.env.JWT_SECRET ? 'SET' : 'NOT SET',
    ENCRYPTION_KEY: process.env.ENCRYPTION_KEY ? 'SET' : 'NOT SET',
    POSTGRES_HOST: process.env.POSTGRES_HOST,
    MONGODB_URI: process.env.MONGODB_URI ? 'SET' : 'NOT SET',
    REDIS_HOST: process.env.REDIS_HOST
  };

  res.json({
    status: 'ok',
    environment_variables: envVars
  });
});

// Chat API
app.post('/api/chat', async (req, res) => {
  try {
    const { message, agentId, conversationId, context } = req.body;

    if (!message) {
      return res.status(400).json({ error: 'Message requis' });
    }

    console.log(`🤖 Master Agent request: ${message.substring(0, 50)}...`);

    // Traiter le message avec le Master Agent
    const result = await masterAgent.processMessage(message, [], context || {});

    // Si un agent a été généré, proposer de le sauvegarder
    if (result.type === 'agent_generated' && result.agent) {
      console.log('🎉 Agent généré, proposer la sauvegarde...');
      
      // Ajouter un bouton de sauvegarde dans la réponse
      result.message += '\n\n💾 **Voulez-vous sauvegarder cet agent ?**\nTapez "OUI" pour le sauvegarder ou "NON" pour continuer.';
    }

    // Calculer le temps de traitement
    const processingTime = Date.now() - Date.now();

    res.json({
      response: result.message,
      type: result.type,
      agent: result.agent || null,
      context: result.context || {},
      model: 'gpt-4o-mini',
      temperature: 0.7,
      tokens_used: 0, // TODO: Calculer les tokens utilisés
      processing_time: processingTime,
      conversationId: conversationId || `conv_${Date.now()}`,
      agentId,
    });

  } catch (error) {
    console.error('❌ Erreur Master Agent API:', error);
    res.status(500).json({ 
      error: 'Erreur lors du traitement du message',
      details: error.message
    });
  }
});

// Agents API
app.post('/api/agents', async (req, res) => {
  try {
    const { name, description, capabilities, integrations } = req.body;

    if (!name || !description) {
      return res.status(400).json({ error: 'Nom et description requis' });
    }

    console.log(`🤖 Création d'agent: ${name}`);

    const agentId = `agent_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    const newAgent = {
      id: agentId,
      name,
      description,
      capabilities: capabilities || [],
      integrations: integrations || [],
      status: 'draft',
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    res.json({
      success: true,
      agent: newAgent,
    });

  } catch (error) {
    console.error('❌ Erreur création agent:', error);
    res.status(500).json({ 
      error: 'Erreur lors de la création de l\'agent',
      details: error.message
    });
  }
});

app.get('/api/agents', async (req, res) => {
  try {
    const mockAgents = [
      {
        id: 'agent_1',
        name: 'Assistant Commercial',
        description: 'Agent spécialisé dans la vente et le support client',
        status: 'active',
        capabilities: ['Vente', 'Support client', 'Qualification leads'],
        integrations: ['CRM', 'Email'],
        createdAt: new Date(),
      },
      {
        id: 'agent_2', 
        name: 'Agent Marketing',
        description: 'Agent pour la création de contenu et campagnes marketing',
        status: 'active',
        capabilities: ['Création de contenu', 'SEO', 'Réseaux sociaux'],
        integrations: ['Google Analytics', 'Social Media'],
        createdAt: new Date(),
      }
    ];

    res.json({
      success: true,
      agents: mockAgents,
    });

  } catch (error) {
    console.error('❌ Erreur récupération agents:', error);
    res.status(500).json({ 
      error: 'Erreur lors de la récupération des agents',
      details: error.message
    });
  }
});

// API pour sauvegarder un agent généré
app.post('/api/agents/save-generated', async (req, res) => {
  try {
    const { agentData } = req.body;

    if (!agentData) {
      return res.status(400).json({ error: 'Données d\'agent requises' });
    }

    console.log('💾 Sauvegarde d\'un agent généré...');

    // Simuler la sauvegarde (en attendant le backend complet)
    const savedAgent = {
      id: `agent_${Date.now()}`,
      ...agentData,
      status: 'draft',
      created_at: new Date(),
      updated_at: new Date()
    };

    console.log('✅ Agent sauvegardé:', savedAgent.id);

    res.json({
      success: true,
      data: savedAgent,
      message: 'Agent sauvegardé avec succès !'
    });

  } catch (error) {
    console.error('❌ Erreur sauvegarde agent:', error);
    res.status(500).json({
      error: 'Erreur lors de la sauvegarde de l\'agent',
      details: error.message
    });
  }
});

// API pour déployer un agent
app.post('/api/deployment/deploy', async (req, res) => {
  try {
    const { agentId, config } = req.body;

    if (!agentId || !config) {
      return res.status(400).json({ error: 'Agent ID et configuration requis' });
    }

    console.log('🚀 Déploiement d\'un agent...', { agentId, environment: config.environment });

    // Simuler le déploiement
    const deploymentId = `deploy_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    const deploymentResult = {
      success: true,
      deploymentId,
      agentId,
      environment: config.environment,
      status: 'active',
      endpoints: {
        chat: `https://api.agenly.fr/agents/${agentId}/chat`,
        webhook: `https://api.agenly.fr/agents/${agentId}/webhook`,
        health: `https://api.agenly.fr/agents/${agentId}/health`
      }
    };

    console.log('✅ Agent déployé:', deploymentId);

    res.json({
      success: true,
      data: deploymentResult,
      message: 'Agent déployé avec succès !'
    });

  } catch (error) {
    console.error('❌ Erreur déploiement agent:', error);
    res.status(500).json({
      error: 'Erreur lors du déploiement de l\'agent',
      details: error.message
    });
  }
});

// API pour tester un agent déployé
app.post('/api/deployment/:deploymentId/test', async (req, res) => {
  try {
    const { deploymentId } = req.params;
    const { testMessage } = req.body;

    if (!testMessage) {
      return res.status(400).json({ error: 'Message de test requis' });
    }

    console.log('🧪 Test d\'un agent déployé...', { deploymentId, testMessage });

    // Simuler le test
    const testResult = {
      success: true,
      testMessage,
      response: `Réponse de test de l'agent déployé: "${testMessage}"`,
      responseTime: Math.floor(Math.random() * 1000) + 500,
      timestamp: new Date()
    };

    console.log('✅ Test effectué:', testResult.response);

    res.json({
      success: true,
      data: testResult,
      message: 'Test effectué avec succès !'
    });

  } catch (error) {
    console.error('❌ Erreur test agent:', error);
    res.status(500).json({
      error: 'Erreur lors du test de l\'agent',
      details: error.message
    });
  }
});

// API pour tester les intégrations
app.post('/api/integrations/test', async (req, res) => {
  try {
    const { action, params } = req.body;

    if (!action) {
      return res.status(400).json({ error: 'Action requise' });
    }

    console.log('🔗 Test d\'intégration...', { action, params });

    let result;

    switch (action) {
      case 'create_event':
        result = {
          success: true,
          data: {
            eventId: `event_${Date.now()}`,
            summary: params.summary || 'Événement de test',
            startTime: params.startTime || new Date().toISOString(),
            endTime: params.endTime || new Date(Date.now() + 3600000).toISOString()
          },
          message: 'Événement créé avec succès dans Google Calendar !'
        };
        break;

      case 'send_email':
        result = {
          success: true,
          data: {
            messageId: `msg_${Date.now()}`,
            to: params.to || 'test@example.com',
            subject: params.subject || 'Email de test',
            sentAt: new Date().toISOString()
          },
          message: 'Email envoyé avec succès via Gmail !'
        };
        break;

      case 'check_availability':
        result = {
          success: true,
          data: {
            available: Math.random() > 0.5,
            startTime: params.startTime || new Date().toISOString(),
            endTime: params.endTime || new Date(Date.now() + 3600000).toISOString()
          },
          message: 'Disponibilité vérifiée dans Google Calendar !'
        };
        break;

      case 'list_events':
        result = {
          success: true,
          data: {
            events: [
              {
                id: 'event_1',
                summary: 'Réunion équipe',
                startTime: new Date(Date.now() + 86400000).toISOString(),
                endTime: new Date(Date.now() + 86400000 + 3600000).toISOString()
              },
              {
                id: 'event_2',
                summary: 'Appel client',
                startTime: new Date(Date.now() + 172800000).toISOString(),
                endTime: new Date(Date.now() + 172800000 + 1800000).toISOString()
              }
            ]
          },
          message: 'Événements récupérés depuis Google Calendar !'
        };
        break;

      case 'list_emails':
        result = {
          success: true,
          data: {
            messages: [
              {
                id: 'msg_1',
                subject: 'Demande de réservation',
                from: 'client@example.com',
                date: new Date(Date.now() - 3600000).toISOString(),
                snippet: 'Bonjour, je souhaiterais réserver une table...'
              },
              {
                id: 'msg_2',
                subject: 'Confirmation de rendez-vous',
                from: 'partenaire@example.com',
                date: new Date(Date.now() - 7200000).toISOString(),
                snippet: 'Merci pour votre confirmation...'
              }
            ]
          },
          message: 'Emails récupérés depuis Gmail !'
        };
        break;

      default:
        result = {
          success: false,
          error: `Action non supportée: ${action}`
        };
    }

    console.log('✅ Test d\'intégration effectué:', result);

    res.json({
      success: result.success,
      data: result.data,
      message: result.message || result.error
    });

  } catch (error) {
    console.error('❌ Erreur test intégration:', error);
    res.status(500).json({
      error: 'Erreur lors du test de l\'intégration',
      details: error.message
    });
  }
});

// Démarrage du serveur
app.listen(port, () => {
  console.log(`🚀 AGENLY Backend Server running on http://localhost:${port}`);
  console.log(`📊 Health check: http://localhost:${port}/health`);
  console.log(`🔑 OpenAI test: http://localhost:${port}/test-openai`);
  console.log(`⚙️  Environment check: http://localhost:${port}/env-check`);
});

// Gestion des erreurs
process.on('SIGINT', async () => {
  console.log('\n🛑 Shutting down server...');
  await postgresPool.end();
  await mongoClient.close();
  await redisClient.quit();
  process.exit(0);
});




