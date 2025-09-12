
# 🔑 Configuration des Clés API

## ✅ **Clés Firebase Configurées**

J'ai identifié vos clés Firebase et les ai configurées dans le code :

### **Firebase Project : `agenly-2475b`**
- **API Key** : `AIzaSyCdncetdiA-aPjVhgR2cTdfGU6UQ8FGMgw`
- **Project ID** : `agenly-2475b`
- **Auth Domain** : `agenly-2475b.firebaseapp.com`

## 📝 **Fichier .env.local à Créer**

Créez un fichier `.env.local` à la racine du projet avec ce contenu :

```bash
# ===== FIREBASE CONFIGURATION (OBLIGATOIRE) =====
NEXT_PUBLIC_FIREBASE_API_KEY=AIzaSyCdncetdiA-aPjVhgR2cTdfGU6UQ8FGMgw
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=agenly-2475b.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=agenly-2475b
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=agenly-2475b.firebasestorage.app
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=123456789012
NEXT_PUBLIC_FIREBASE_APP_ID=1:123456789012:web:abcdef1234567890
NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID=G-ABCDEFGHIJ

# ===== OPENAI CONFIGURATION (OBLIGATOIRE) =====
OPENAI_API_KEY=sk-proj-your_openai_api_key_here

# ===== GOOGLE OAUTH CONFIGURATION (OBLIGATOIRE) =====
NEXT_PUBLIC_GOOGLE_CLIENT_ID=your_google_client_id.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=your_google_client_secret
NEXT_PUBLIC_GOOGLE_CALENDAR_CLIENT_ID=your_calendar_client_id.apps.googleusercontent.com
GOOGLE_CALENDAR_CLIENT_SECRET=your_calendar_client_secret
NEXT_PUBLIC_APP_URL=http://localhost:3001

# ===== STRIPE CONFIGURATION (OPTIONNEL) =====
STRIPE_SECRET_KEY=sk_test_your_stripe_secret_key_here
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_your_stripe_publishable_key_here
STRIPE_WEBHOOK_SECRET=whsec_your_webhook_secret_here
STRIPE_PRO_PRICE_ID=price_pro_monthly_id
STRIPE_ADMIN_PRICE_ID=price_admin_monthly_id

# ===== OAUTH CALLBACKS (OBLIGATOIRE) =====
OAUTH_CALLBACK_URL=https://app.agenly.fr/oauth/callback

# ===== FIREBASE ADMIN (pour les API routes) =====
FIREBASE_PROJECT_ID=agenly-2475b
FIREBASE_CLIENT_EMAIL=firebase-adminsdk-xxxxx@agenly-2475b.iam.gserviceaccount.com
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\nyour_private_key_here\n-----END PRIVATE KEY-----\n"

# ===== CLOUD FUNCTIONS URL =====
NEXT_PUBLIC_CLOUD_FUNCTION_URL=https://us-central1-agenly-2475b.cloudfunctions.net/api

# ===== ENCRYPTION KEYS =====
ENCRYPTION_KEY=your_encryption_key_here
JWT_SECRET=your_jwt_secret_here

# ===== ENVIRONMENT =====
NODE_ENV=development
```

## 🚀 **Commandes à Exécuter**

```bash
# 1. Créer le fichier .env.local
cp env.example .env.local

# 2. Éditer le fichier avec vos vraies clés
nano .env.local

# 3. Redémarrer le serveur
npm run dev
```

## ⚠️ **Clés à Remplacer**

### **Obligatoires :**
1. **OPENAI_API_KEY** - Votre clé OpenAI
2. **GOOGLE_CLIENT_ID** - Votre Client ID Google OAuth
3. **GOOGLE_CLIENT_SECRET** - Votre Client Secret Google OAuth

### **Optionnelles :**
1. **STRIPE_*** - Clés Stripe pour les paiements
2. **FIREBASE_PRIVATE_KEY** - Clé privée Firebase Admin

## 🔧 **Configuration Firebase Console**

Assurez-vous d'avoir ajouté `localhost` dans les **Authorized domains** de votre projet Firebase `agenly-2475b`.

---

**🎯 Une fois le fichier .env.local créé, l'application utilisera vos vraies clés API !**
