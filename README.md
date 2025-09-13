# 🚀 AGENLY - Plateforme Multi-Tenant d'Agents IA

## 📋 Vue d'Ensemble

AGENLY est une plateforme SaaS complète permettant aux PME de créer et déployer leurs propres agents IA conversationnels sans compétences techniques. La plateforme utilise une approche conversationnelle où un agent maître aide les utilisateurs à créer des agents personnalisés pour leur business.

## 🏗️ Architecture

### Stack Technologique

- **Backend**: Node.js + TypeScript + Express.js
- **Frontend**: Next.js 15 + React + Tailwind CSS
- **Base de données**: PostgreSQL (métadonnées) + MongoDB (configurations) + Redis (cache)
- **IA**: OpenAI GPT-4o / GPT-4o-mini
- **Queue**: Bull/BullMQ pour tâches asynchrones
- **Auth**: JWT + refresh tokens
- **Paiements**: Stripe
- **Monitoring**: Prometheus + Grafana
- **Déploiement**: Docker + Docker Compose

### Composants Principaux

1. **Master Agent** - Agent créateur principal avec interface conversationnelle
2. **Agent Factory** - Générateur d'agents personnalisés
3. **Multi-Tenant Manager** - Isolation et gestion des tenants
4. **Integration Hub** - Marketplace d'intégrations
5. **Security Layer** - Chiffrement et sécurité

## 🚀 Installation et Démarrage

### Prérequis

- Node.js 18+
- Docker & Docker Compose
- PostgreSQL 15+
- MongoDB 7+
- Redis 7+

### Installation Rapide

```bash
# Cloner le repository
git clone <repository-url>
cd agenly-platform

# Installer les dépendances
npm install

# Configurer l'environnement
cp env.example .env.local
# Éditer .env.local avec vos vraies clés API

# Démarrer avec Docker
docker-compose up -d

# Ou démarrer en développement
npm run dev
```

### Configuration des Variables d'Environnement

Copiez `env.example` vers `.env.local` et configurez :

```bash
# OpenAI (OBLIGATOIRE)
OPENAI_API_KEY=sk-proj-your_real_openai_key

# Stripe (OBLIGATOIRE)
STRIPE_SECRET_KEY=sk_test_your_stripe_key
STRIPE_PUBLISHABLE_KEY=pk_test_your_stripe_key

# JWT (OBLIGATOIRE)
JWT_SECRET=your_32_character_secret
JWT_REFRESH_SECRET=your_32_character_refresh_secret

# Chiffrement (OBLIGATOIRE)
ENCRYPTION_KEY=your_32_character_encryption_key
```

## 🎯 Fonctionnalités

### ✅ Implémentées

- ✅ Architecture multi-tenant complète
- ✅ Authentification JWT avec refresh tokens
- ✅ Master Agent conversationnel
- ✅ Génération d'agents personnalisés
- ✅ Système d'abonnements avec Stripe
- ✅ Intégrations (Google Calendar, HubSpot, Shopify)
- ✅ Analytics et monitoring
- ✅ Webhooks
- ✅ API REST complète
- ✅ Interface ChatGPT-like
- ✅ Déploiement Docker

### 🔄 En Cours

- 🔄 Tests unitaires et d'intégration
- 🔄 Documentation API complète
- 🔄 Optimisations de performance

## 📚 API Documentation

### Endpoints Principaux

#### Authentification
```bash
POST /api/v1/auth/login
POST /api/v1/auth/register
POST /api/v1/auth/refresh
POST /api/v1/auth/logout
```

#### Agents
```bash
GET    /api/v1/agents
POST   /api/v1/agents
GET    /api/v1/agents/:id
PUT    /api/v1/agents/:id
DELETE /api/v1/agents/:id
POST   /api/v1/agents/:id/test
POST   /api/v1/agents/:id/deploy
```

#### Master Agent
```bash
POST /api/v1/agents/master-agent/chat
```

#### Conversations
```bash
GET  /api/v1/conversations
POST /api/v1/conversations/:id/messages
GET  /api/v1/conversations/:id
PUT  /api/v1/conversations/:id
```

#### Intégrations
```bash
GET  /api/v1/integrations/templates
GET  /api/v1/integrations
POST /api/v1/integrations
GET  /api/v1/integrations/:id
PUT  /api/v1/integrations/:id
POST /api/v1/integrations/:id/test
```

#### Billing
```bash
GET  /api/v1/billing/subscription
POST /api/v1/billing/subscription
PUT  /api/v1/billing/subscription
POST /api/v1/billing/subscription/cancel
```

## 🛠️ Développement

### Structure du Projet

```
src/
├── agents/                 # Agents IA
│   ├── master-agent/      # Agent créateur principal
│   ├── client-agents/     # Gestionnaire agents clients
│   └── agent-factory/     # Générateur d'agents
├── auth/                  # Authentification
│   ├── middleware/        # Middlewares d'auth
│   ├── subscription-check/ # Vérification abonnements
│   └── tenant-isolation/  # Isolation des tenants
├── config/                # Configuration
├── database/              # Base de données
│   ├── migrations/        # Migrations PostgreSQL
│   └── seeds/            # Données initiales
├── middleware/            # Middlewares Express
├── routes/               # Routes API
├── services/             # Services métier
├── types/                # Types TypeScript
└── utils/                # Utilitaires
```

### Scripts Disponibles

```bash
# Développement
npm run dev              # Démarre frontend + backend
npm run dev:server       # Backend uniquement
npm run dev:client       # Frontend uniquement

# Build
npm run build            # Build complet
npm run build:server     # Build backend
npm run build:client     # Build frontend

# Base de données
npm run db:migrate       # Exécute les migrations
npm run db:seed          # Exécute les seeds
npm run db:rollback      # Rollback des migrations

# Tests
npm run test             # Tests unitaires
npm run test:watch       # Tests en mode watch
npm run test:coverage    # Tests avec couverture

# Linting
npm run lint             # Vérification ESLint
npm run lint:fix         # Correction automatique

# Docker
npm run docker:up        # Démarre avec Docker
npm run docker:down      # Arrête Docker
```

## 🚀 Déploiement

### Déploiement avec Docker

```bash
# Déploiement en production
./scripts/deploy.sh production latest

# Déploiement en staging
./scripts/deploy.sh staging v1.0.0

# Vérification de la santé
curl http://localhost:3000/health
```

### Déploiement Manuel

```bash
# Build des images
docker build -f Dockerfile.backend -t agenly/backend:latest .
docker build -f Dockerfile.frontend -t agenly/frontend:latest .
docker build -f Dockerfile.worker -t agenly/worker:latest .

# Démarrage des services
docker-compose up -d

# Migrations
docker-compose exec backend npm run db:migrate
docker-compose exec backend npm run db:seed
```

## 📊 Monitoring

### Métriques Disponibles

- **Système**: CPU, mémoire, disque, connexions
- **Business**: tenants actifs, agents, conversations, revenus
- **Performance**: latence API, taux d'erreur, temps de réponse
- **Coûts**: utilisation OpenAI, coûts par conversation

### Dashboards

- **Grafana**: http://localhost:3002 (admin/admin)
- **Prometheus**: http://localhost:9090

## 🔒 Sécurité

### Mesures Implémentées

- ✅ Chiffrement AES-256 des données sensibles
- ✅ Isolation complète des tenants
- ✅ Rate limiting granulaire
- ✅ Validation Joi des entrées
- ✅ Headers de sécurité (Helmet)
- ✅ CORS configuré
- ✅ JWT avec refresh tokens
- ✅ Audit logs complets

### Bonnes Pratiques

- Ne jamais exposer les prompts système côté client
- Rotation régulière des clés de chiffrement
- Monitoring des tentatives d'intrusion
- Sauvegarde chiffrée des données

## 🧪 Tests

```bash
# Tests unitaires
npm run test

# Tests d'intégration
npm run test:integration

# Tests de charge
npm run test:load

# Couverture de code
npm run test:coverage
```

## 📈 Performance

### Optimisations

- Cache Redis pour configurations fréquentes
- Pool de connexions DB optimisé
- Pagination sur toutes les listes
- Compression des réponses API
- CDN pour les assets statiques

### Métriques Cibles

- Temps de création d'agent < 15 minutes
- Latence API < 200ms p95
- Uptime > 99.9%
- Coût par agent < 50€/mois

## 🤝 Contribution

### Workflow

1. Fork le repository
2. Créer une branche feature (`git checkout -b feature/amazing-feature`)
3. Commit les changements (`git commit -m 'Add amazing feature'`)
4. Push vers la branche (`git push origin feature/amazing-feature`)
5. Ouvrir une Pull Request

### Standards

- Code TypeScript strict
- Tests unitaires obligatoires
- Documentation des APIs
- Respect des conventions ESLint
- Messages de commit conventionnels

## 📞 Support

### Documentation

- [Architecture détaillée](./ARCHITECTURE.md)
- [Guide de déploiement](./DEPLOYMENT.md)
- [API Reference](./API.md)

### Contact

- Email: support@agenly.com
- Discord: [Serveur AGENLY](https://discord.gg/agenly)
- GitHub Issues: [Issues](https://github.com/agenly/platform/issues)

## 📄 Licence

Ce projet est sous licence MIT. Voir le fichier [LICENSE](LICENSE) pour plus de détails.

## 🙏 Remerciements

- OpenAI pour l'API GPT-4
- Stripe pour les paiements
- La communauté open source

---

**AGENLY** - Créez vos agents IA en quelques minutes, pas en quelques mois. 🚀



