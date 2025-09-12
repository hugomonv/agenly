# AGENLY - Plateforme SaaS d'Agents IA

AGENLY est une plateforme SaaS complète pour créer et gérer des agents IA personnalisés avec des intégrations Google, OpenAI et un déploiement facile.

## 🚀 Fonctionnalités

- **Création d'Agents IA** : Créez des agents IA personnalisés avec des prompts et instructions spécifiques
- **Chat Intelligent** : Interface de chat moderne avec OpenAI GPT-4
- **Intégrations Google** : Calendar, Gmail, Drive, Contacts
- **Authentification Firebase** : Connexion sécurisée avec Google OAuth
- **Paiements Stripe** : Plans tarifaires flexibles
- **Déploiement d'Agents** : Déployez vos agents sur web, iframe ou API
- **Design Apple** : Interface moderne inspirée d'Apple avec glassmorphism

## 🛠️ Technologies

- **Frontend** : Next.js 15, React 18, TypeScript
- **Styling** : Tailwind CSS, Framer Motion
- **Backend** : Firebase (Auth, Firestore, Functions)
- **IA** : OpenAI GPT-4
- **Intégrations** : Google APIs (Calendar, Gmail, Drive, Contacts)
- **Paiements** : Stripe
- **Déploiement** : Vercel

## 📦 Installation

1. **Cloner le projet**
```bash
git clone <repository-url>
cd agenly
```

2. **Installer les dépendances**
```bash
npm install
```

3. **Configuration des variables d'environnement**
```bash
cp .env.example .env.local
```

Remplissez le fichier `.env.local` avec vos clés API :
- Firebase (obligatoire)
- OpenAI (obligatoire)
- Google OAuth (obligatoire)
- Stripe (optionnel)

4. **Démarrer le serveur de développement**
```bash
npm run dev
```

Ouvrez [http://localhost:3000](http://localhost:3000) dans votre navigateur.

## 🔧 Configuration

### Firebase
1. Créer un projet Firebase
2. Activer Authentication (Email + Google)
3. Activer Firestore Database
4. Configurer les règles Firestore
5. Ajouter les domaines autorisés

### Google Cloud Console
1. Créer un projet Google Cloud
2. Activer les APIs : Calendar, Gmail, Drive, Contacts
3. Créer des credentials OAuth 2.0
4. Configurer les URLs de redirection

### OpenAI
1. Créer un compte OpenAI
2. Générer une clé API
3. Configurer les limites d'usage

## 📁 Structure du Projet

```
src/
├── app/                    # Pages Next.js 13+ App Router
│   ├── api/               # API Routes
│   ├── dashboard/         # Pages dashboard
│   ├── pricing/           # Page tarifs
│   ├── globals.css        # Styles globaux
│   ├── layout.tsx         # Layout principal
│   └── page.tsx           # Page d'accueil
├── components/            # Composants React
│   ├── ui/               # Composants UI (MetaBalls, ShapeBlur)
│   ├── chat/             # Composants de chat
│   ├── dashboard/        # Composants dashboard
│   └── providers/        # Providers React Context
├── hooks/                # Hooks personnalisés
├── lib/                  # Services et utilitaires
│   └── services/         # Services métier
└── types/                # Types TypeScript
```

## 🔌 API Routes

- `POST /api/chat` - Chat principal avec IA
- `POST /api/generate-agent` - Génération d'agent IA
- `POST /api/agents/[id]/chat` - Chat avec un agent spécifique
- `GET /api/auth/callback/google` - Callback OAuth Google
- `GET /api/google/calendar` - API Google Calendar
- `GET /api/google/drive` - API Google Drive
- `GET /api/google/gmail` - API Gmail

## 🎨 Design System

- **Couleurs** : Noir (#000000) et Blanc (#FFFFFF)
- **Glassmorphism** : Effets de verre avec transparence
- **Animations** : Framer Motion pour les transitions
- **Typographie** : SF Pro Display/Text (Apple)

## 🚀 Déploiement

### Vercel (Recommandé)
```bash
npm i -g vercel
vercel --prod
```

### Variables d'environnement Vercel
Configurez toutes les variables du `.env.local` dans le dashboard Vercel.

### Firebase
```bash
npm install -g firebase-tools
firebase login
firebase deploy --only firestore:rules
```

## 📊 Fonctionnalités Principales

### 1. Création d'Agents IA
- Assistant conversationnel intelligent
- Génération automatique de prompts
- Personnalisation avancée
- Sauvegarde dans Firestore

### 2. Chat Intelligent
- Interface moderne type ChatGPT
- Intégrations Google actives
- Détection d'intention
- Suggestions d'actions

### 3. Intégrations Google
- **Calendar** : Création/modification d'événements
- **Gmail** : Envoi/réception d'emails
- **Drive** : Gestion de fichiers
- **Contacts** : Gestion du carnet d'adresses

### 4. Système de Paiement
- Plans tarifaires flexibles
- Paiements Stripe sécurisés
- Gestion des abonnements
- Webhooks automatiques

## 🔐 Sécurité

- Authentification Firebase sécurisée
- Règles Firestore strictes
- Validation des données côté serveur
- Chiffrement des tokens OAuth
- HTTPS obligatoire en production

## 📈 Monitoring

- Logs Winston pour le debugging
- Métriques d'utilisation
- Monitoring des erreurs
- Analytics des performances

## 🤝 Contribution

1. Fork le projet
2. Créer une branche feature (`git checkout -b feature/AmazingFeature`)
3. Commit les changements (`git commit -m 'Add some AmazingFeature'`)
4. Push vers la branche (`git push origin feature/AmazingFeature`)
5. Ouvrir une Pull Request

## 📄 Licence

Ce projet est sous licence MIT. Voir le fichier `LICENSE` pour plus de détails.

## 📞 Support

- **Documentation** : [docs.agenly.fr](https://docs.agenly.fr)
- **Support** : [support@agenly.fr](mailto:support@agenly.fr)
- **Discord** : [discord.gg/agenly](https://discord.gg/agenly)

## 🎯 Roadmap

- [ ] Intégrations Microsoft (Office 365)
- [ ] Intégrations Slack
- [ ] Intégrations WhatsApp
- [ ] Agents vocaux
- [ ] Analytics avancées
- [ ] API publique
- [ ] Marketplace d'agents

---

**AGENLY** - Créez l'avenir avec l'IA ✨
