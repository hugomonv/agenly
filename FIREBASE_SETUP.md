# 🔥 Configuration Firebase - Guide de Résolution

## ❌ **Problème Identifié**

L'application essaie de se connecter aux émulateurs Firebase au lieu des vraies APIs.

## ✅ **Corrections Appliquées**

1. **✅ Émulateurs Firebase désactivés** - L'application utilise maintenant les vraies APIs
2. **✅ URL mise à jour** - `NEXT_PUBLIC_APP_URL=http://localhost:3001`
3. **✅ Serveur redémarré** - Les changements sont actifs

## 🔧 **Configuration Firebase Console Requise**

### 1. **Domaines Autorisés**
```
🌐 Allez sur: https://console.firebase.google.com
📁 Sélectionnez le projet: agenly-2475b
🔐 Allez dans: Authentication > Settings > Authorized domains
➕ Ajoutez ces domaines:
   - localhost
   - 127.0.0.1
   - localhost:3001
```

### 2. **Providers d'Authentification**
```
🔐 Dans Authentication > Sign-in method
✅ Activez ces providers:
   - Email/Password
   - Google
```

### 3. **Configuration Google OAuth**
```
🔗 Dans Google OAuth:
   - Authorized JavaScript origins:
     * http://localhost:3001
     * http://localhost:3000
   - Authorized redirect URIs:
     * http://localhost:3001/api/auth/callback/google
     * http://localhost:3000/api/auth/callback/google
```

## 🧪 **Test de Connexion**

### 1. **Vérifiez l'URL**
```
🌐 Ouvrez: http://localhost:3001
```

### 2. **Test de Connexion Google**
```
🔐 Cliquez sur "Continuer avec Google"
✅ Vous devriez être redirigé vers Google OAuth
✅ Puis revenir sur votre application
```

### 3. **Test de Connexion Email**
```
📧 Cliquez sur "Pas de compte ? Créer un compte"
📝 Remplissez le formulaire
✅ Vous devriez être connecté
```

## 🚨 **Si la Connexion Ne Marche Toujours Pas**

### Vérifiez dans la Console du Navigateur (F12)
```
🔍 Erreurs JavaScript
🔍 Erreurs de réseau
🔍 Messages Firebase
```

### Vérifiez les Logs du Serveur
```
📊 Dans le terminal où tourne npm run dev
🔍 Messages d'erreur
🔍 Requêtes API
```

## 📋 **Checklist de Vérification**

- [ ] ✅ Émulateurs Firebase désactivés
- [ ] ✅ URL mise à jour vers localhost:3001
- [ ] ✅ Serveur redémarré
- [ ] ⏳ Domaines autorisés dans Firebase Console
- [ ] ⏳ Providers d'authentification activés
- [ ] ⏳ Google OAuth configuré
- [ ] ⏳ Test de connexion réussi

## 🆘 **Support**

Si vous avez encore des problèmes, fournissez-moi :
1. **Screenshot de l'erreur** dans le navigateur
2. **Logs de la console** (F12 > Console)
3. **Logs du serveur** (terminal npm run dev)

---

**🎯 Une fois Firebase configuré, l'authentification fonctionnera parfaitement !**
