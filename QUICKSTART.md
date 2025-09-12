# 🚀 Guide de Démarrage Rapide - AGENLY

## ⚡ Installation Express (5 minutes)

### 1. Installation des dépendances
```bash
npm install
```

### 2. Configuration des variables d'environnement
```bash
# Copiez le fichier d'exemple
cp env.example .env.local

# Éditez le fichier avec vos vraies clés
nano .env.local
```

### 3. Variables OBLIGATOIRES à configurer

#### Firebase (OBLIGATOIRE)
```bash
NEXT_PUBLIC_FIREBASE_API_KEY=AIzaSyCdncetdiA-aPjVhgR2cTdfGU6UQ8FGMgw
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=agenly-2475b.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=agenly-2475b
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=agenly-2475b.firebasestorage.app
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=799996765387
NEXT_PUBLIC_FIREBASE_APP_ID=1:799996765387:web:2c47ee204a93e06676e74e
NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID=G-ZE7CN4W6XQ
```

#### OpenAI (OBLIGATOIRE)
```bash
OPENAI_API_KEY=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
```

#### Google OAuth (OBLIGATOIRE)
```bash
NEXT_PUBLIC_GOOGLE_CLIENT_ID=799996765387-71e3qmd2kt1mvsdt2oldask0pdo1e5jg.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=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
NEXT_PUBLIC_GOOGLE_CALENDAR_CLIENT_ID=799996765387-jttfftot8t2dfji52veo2869oefpefhj.apps.googleusercontent.com
GOOGLE_CALENDAR_CLIENT_SECRET=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
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

#### Firebase Admin (OBLIGATOIRE)
```bash
FIREBASE_PROJECT_ID=agenly-2475b
FIREBASE_CLIENT_EMAIL=firebase-adminsdk-fbsvc@agenly-2475b.iam.gserviceaccount.com
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\nMIIEvQIBADANBgkqhkiG9w0BAQEFAASCBKcwggSjAgEAAoIBAQCSx2dY9l5c8Vf+\ncrKrbxMSDMQnu10GF4uqg03aIYGKgYLR6Tnx0ZxPwK6tsziPDm6iLY27TNXiDTWL\nc/U5RN0oybYUXC3uLxYvL99UTxBGCzBiNjyOKwmn2BM7B8ROeYov15h+msRH8U/x\n+iOkQ0HwRO0OJ0fDQLb0AxQCMpLSeeUUhuf+dgbJFHb+RWMFaAbInzm9/pbJ6azo\nxJDWb9oKKy9YPU/0xOjioWu2n+Z95hqegt1oC4gtEE78ZeAp06AcMDC/1I6vscbD\nYY2NDzOAktb3SnJCD0MSnSbLd4oqAmCf6/loljjDnucGrcxcFFByI1HXIzPwMcHC\nnameM1TdTAgMBAAECggEAFHqt+MOnNuCVnnLyauj8iDAvzjteJ1NxsUDQw/aY1HJt\nhkw8QXk1jgscVDAFXDBvT0F73P5DeV7Ocb6kIHFzShWaygxyfCElvz+2sVS2uI8n\nGQzoNg3bMwf65umWgjyDA1nZdRCzAjaxKNn1zx1zPcrgKHFimeOVo0YqrIPR6HvT\nWWNYc2Sz7Q0YNaor3vcHo725NsQ8xBWFM8wBYnbKt1ahYXsZk8N433ymRoJDPWBq\nr3M54PKxzWIbxwa6WzhhJ7r98ovsyhjkix+Q9BhjkqUO9vXBfom4H7dTwqTFHfnH\nUgFR+R6Jb9iCD4K6+qcQMk3h9Zt6nZ9DU9x//vdxgQKBgQDEv0tFGG9qPhepD2mB\nkzf9bmfnZOop0ds7RIPsQ3AhUzthi8btZ4Vjw9DYihHfzSLu4evnAxyDT8kqavWK\noQYmD6f4lGrdcy0S3BHQ5CmvgBdlH/WaleuqRycuNOzyTNrg+fZ+UnyREB+5Gu9a\n2J4gD656R6RxwttH8So+A9KSOwKBgQC++65CLY12MdFuOEFMBmA6xcvmfeHu3R2j\nU5a6Hk33eqaLf/ZpTX+rj4rCHqdJOGMVyojQpm3vIww0qY7BbzF4QQym4XMeJGTv\n0MyZZMV/NqpvCn0lC+i6zF9ApuBhlfZM7LdURVgSW2vdSlmWGB81RhDUxnCkW6W8\nP+XLJVvFyQKBgQCfdJZRcqNhzN8qMoaE8McRC/kEDcLGkAGJQFdXFbT8HVPkE//u\nitcN6zcJOKWR59TnHI0vllL2jaRxT2yfpS+xi0DMc6VEw0MFpPx/e1vZlAvh9ov8\ndIMiZzZ2+YgMPIOskInZCYtRmmrLf+v7idJmE6+KBSRe2tkTrn5Y8oon3wKBgGOp\nBFMmYDZ4YrhohLJ+dULWKsPZlsfF/QxYt0PiQn9NMpGDMfvbZC8LlbYctuD/mr0p\nVmHDJ4TtvhXREVyhgKgnEcoXxbHJ/h4i0FGPg3wR87hEOe/WGhk4QtCDBH4H+mJD\n+JryILZbnJr6jGtFpStwp6HQ98DczkzA71Il6ZD5AoGAQ2Lf9XzJs2WYfLTgmgXS\n/mwg0LhPH6+AMoIrBhT7y0kqPA3IS7Chr4RO1p5dSiI4WDB/9B3oWr67LEg16PJA\nJk4Riu/9GLQxe/Tan7GpTB1uQa2RlqzplRS0y4x5BWKJeMqKqKhudVbstUvIPp6C\ntpbZyyqakwNovmKdHNiZK24=\n-----END PRIVATE KEY-----\n"
```

### 4. Démarrage du serveur
```bash
npm run dev
```

### 5. Accès à l'application
Ouvrez [http://localhost:3000](http://localhost:3000) dans votre navigateur.

## ✅ Test de Configuration

Exécutez le script de test pour vérifier que tout est configuré correctement :

```bash
node test-setup.js
```

## 🎯 Première Utilisation

1. **Connexion** : Utilisez Google OAuth ou créez un compte email
2. **Créer un agent** : Cliquez sur "Créer un nouvel agent"
3. **Chat** : Commencez à discuter avec votre agent IA
4. **Intégrations** : Connectez Google Calendar, Gmail, Drive

## 🔧 Configuration Firebase

### 1. Console Firebase
- Allez sur [console.firebase.google.com](https://console.firebase.google.com)
- Sélectionnez le projet `agenly-2475b`
- Activez Authentication (Email + Google)
- Activez Firestore Database

### 2. Règles Firestore
Les règles sont déjà configurées dans `firestore.rules`

### 3. Domaines autorisés
Ajoutez `localhost` dans Authentication > Settings > Authorized domains

## 🔧 Configuration Google Cloud

### 1. Console Google Cloud
- Allez sur [console.cloud.google.com](https://console.cloud.google.com)
- Sélectionnez le projet
- Activez les APIs : Calendar, Gmail, Drive, Contacts

### 2. Credentials OAuth
- Créez des credentials OAuth 2.0
- Ajoutez les URLs de redirection :
  - `http://localhost:3000/api/auth/callback/google`
  - `https://votre-domaine.com/api/auth/callback/google`

## 🚀 Déploiement

### Vercel (Recommandé)
```bash
npm i -g vercel
vercel --prod
```

### Variables d'environnement Vercel
Copiez toutes les variables du `.env.local` dans le dashboard Vercel.

## 🆘 Dépannage

### Erreur "Module not found"
```bash
rm -rf node_modules package-lock.json
npm install
```

### Erreur "EADDRINUSE"
```bash
lsof -ti:3000 | xargs kill -9
npm run dev
```

### Erreur Firebase
- Vérifiez les variables d'environnement
- Vérifiez que le projet Firebase existe
- Vérifiez les domaines autorisés

### Erreur OpenAI
- Vérifiez que la clé API est valide
- Vérifiez que vous avez des crédits disponibles

## 📞 Support

- **Documentation** : README.md
- **Test de configuration** : `node test-setup.js`
- **Logs** : Vérifiez la console du navigateur et les logs du serveur

---

**🎉 AGENLY est maintenant prêt à être utilisé !**
