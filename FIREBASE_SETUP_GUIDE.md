# 🔥 Guide de Configuration Firebase

## 📋 Prérequis

1. **Compte Firebase** : Vous devez avoir un compte Firebase actif
2. **Projet Firebase** : Un projet Firebase configuré
3. **Clés API** : Les clés de configuration Firebase

## 🔧 Configuration des Permissions

### 1. Règles de Sécurité Firestore

Copiez le contenu du fichier `firebase-rules.json` dans la console Firebase :

1. Allez sur [Firebase Console](https://console.firebase.google.com)
2. Sélectionnez votre projet
3. Allez dans **Firestore Database** → **Règles**
4. Remplacez les règles existantes par celles du fichier `firebase-rules.json`
5. Cliquez sur **Publier**

### 2. Configuration de l'Authentification

1. Dans Firebase Console, allez dans **Authentication** → **Sign-in method**
2. Activez les méthodes d'authentification :
   - **Email/Password** : Pour l'authentification basique
   - **Google** : Pour l'authentification Google
   - **Anonymous** : Pour les tests (optionnel)

### 3. Configuration des Variables d'Environnement

Créez un fichier `.env.local` avec vos clés Firebase :

```bash
# Firebase Configuration
NEXT_PUBLIC_FIREBASE_API_KEY=your_api_key_here
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your_project_id
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your_project.appspot.com
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
NEXT_PUBLIC_FIREBASE_APP_ID=your_app_id

# Firebase Admin (pour le serveur)
FIREBASE_ADMIN_PROJECT_ID=your_project_id
FIREBASE_ADMIN_CLIENT_EMAIL=your_service_account_email
FIREBASE_ADMIN_PRIVATE_KEY=your_private_key
```

### 4. Service Account

Pour les opérations serveur, vous devez configurer un Service Account :

1. Allez dans **Project Settings** → **Service accounts**
2. Cliquez sur **Generate new private key**
3. Téléchargez le fichier JSON
4. Extrayez les valeurs nécessaires pour `.env.local`

## 🧪 Test de la Configuration

Après configuration, testez avec :

```bash
node test-firebase-config.js
```

## 🔍 Dépannage

### Erreur "Missing or insufficient permissions"

1. Vérifiez que les règles Firestore sont correctement publiées
2. Vérifiez que l'utilisateur est authentifié
3. Vérifiez que l'utilisateur a les bonnes permissions

### Erreur "Firebase App not initialized"

1. Vérifiez que les variables d'environnement sont correctes
2. Vérifiez que le fichier `.env.local` est dans le bon répertoire
3. Redémarrez le serveur de développement

### Erreur "Invalid API key"

1. Vérifiez que la clé API est correcte
2. Vérifiez que le projet Firebase est actif
3. Vérifiez que la clé API a les bonnes permissions

## 📞 Support

Si vous rencontrez des problèmes :

1. Vérifiez les logs Firebase dans la console
2. Vérifiez les logs de l'application
3. Consultez la documentation Firebase
4. Contactez le support technique

## 🔐 Sécurité

⚠️ **Important** : Ne commitez jamais vos clés API dans le code source. Utilisez toujours des variables d'environnement.

✅ **Bonnes pratiques** :
- Utilisez des règles Firestore restrictives
- Limitez l'accès aux données sensibles
- Utilisez l'authentification pour toutes les opérations
- Surveillez les accès dans les logs Firebase



