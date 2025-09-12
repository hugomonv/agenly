# 🚀 AGENLY - Plateforme d'Agents IA Personnalisés

## 📋 Description

AGENLY est une plateforme SaaS complète pour créer et gérer des agents IA personnalisés avec des intégrations Google, OpenAI et un déploiement facile.

## ✨ Fonctionnalités

### 🎨 Interface ChatGPT Moderne
- Design épuré avec animations fluides
- Sidebar collapsible avec navigation intuitive
- Chat en temps réel avec OpenAI
- Effets glassmorphism et animations

### 🤖 Gestion d'Agents IA
- Création d'agents personnalisés
- Templates prédéfinis
- Génération automatique avec IA
- Déploiement (Web, iframe, API)

### 🔗 Intégrations
- Google Calendar
- Gmail
- Google Drive
- Google Contacts
- OAuth 2.0 sécurisé

### 💳 Paiements
- Stripe intégré
- Abonnements (Free, Pro, Enterprise)
- Gestion des factures

### 🔐 Authentification
- Firebase Auth
- Google OAuth
- Email/Password
- Gestion des sessions

## 🛠️ Technologies

- **Frontend**: Next.js 15, React, TypeScript
- **Styling**: Tailwind CSS, Framer Motion
- **Backend**: Next.js API Routes
- **Database**: Firebase Firestore
- **Auth**: Firebase Authentication
- **AI**: OpenAI GPT-4
- **Payments**: Stripe
- **Deployment**: Vercel

## 🚀 Installation

### Prérequis
- Node.js 18+
- npm ou yarn
- Compte Firebase
- Clé API OpenAI
- Compte Stripe (optionnel)

### Installation
```bash
# Cloner le repository
git clone <votre-repo>
cd agenly

# Installer les dépendances
npm install

# Configurer les variables d'environnement
cp env.example .env.local
# Éditer .env.local avec vos vraies clés

# Démarrer le serveur de développement
npm run dev
```

## ⚙️ Configuration

### Variables d'environnement requises
```bash
# Firebase
NEXT_PUBLIC_FIREBASE_API_KEY=your_api_key
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your_project_id

# OpenAI
OPENAI_API_KEY=sk-proj-your_openai_key

# Google OAuth
NEXT_PUBLIC_GOOGLE_CLIENT_ID=your_client_id
GOOGLE_CLIENT_SECRET=your_client_secret

# Stripe (optionnel)
STRIPE_SECRET_KEY=sk_test_your_stripe_key
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_your_stripe_key
```

### Configuration Firebase
1. Créer un projet Firebase
2. Activer Authentication et Firestore
3. Configurer les domaines autorisés
4. Mettre à jour les règles Firestore

## 📁 Structure du Projet

```
src/
├── app/                    # Pages Next.js
│   ├── api/               # Routes API
│   ├── globals.css        # Styles globaux
│   ├── layout.tsx         # Layout principal
│   └── page.tsx           # Page d'accueil
├── components/            # Composants React
│   ├── chat/             # Composants de chat
│   ├── layout/           # Composants de layout
│   ├── providers/        # Context providers
│   └── ui/               # Composants UI
├── hooks/                # Hooks personnalisés
├── lib/                  # Utilitaires et services
│   ├── services/         # Services métier
│   └── utils.ts          # Fonctions utilitaires
└── types/                # Types TypeScript
```

## 🎯 Routes API

- `POST /api/chat` - Chat principal
- `POST /api/generate-agent` - Génération d'agents
- `POST /api/connect-service` - Connexion services
- `POST /api/disconnect-service` - Déconnexion services
- `GET /api/google` - Données Google
- `POST /api/deploy` - Déploiement d'agents
- `POST /api/stripe` - Gestion paiements

## 🚀 Déploiement

### Vercel (Recommandé)
```bash
# Installer Vercel CLI
npm i -g vercel

# Déployer
vercel
```

### Variables d'environnement de production
Configurer dans Vercel Dashboard :
- Toutes les variables de `.env.local`
- URLs de production pour les callbacks

## 📊 Statut du Projet

- ✅ Interface ChatGPT moderne
- ✅ Toutes les routes API
- ✅ Configuration complète
- ✅ Design avec animations
- ✅ Authentification Firebase
- ✅ Intégrations Google
- ✅ Système de paiement Stripe

## 🤝 Contribution

1. Fork le projet
2. Créer une branche feature
3. Commit vos changements
4. Push vers la branche
5. Ouvrir une Pull Request

## 📄 Licence

Ce projet est sous licence MIT. Voir le fichier `LICENSE` pour plus de détails.

## 📞 Support

Pour toute question ou support :
- Email: support@agenly.fr
- Documentation: [docs.agenly.fr](https://docs.agenly.fr)

---

**🎉 AGENLY - Créez vos agents IA personnalisés en quelques clics !** ✨