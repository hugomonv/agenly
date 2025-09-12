#!/usr/bin/env node

/**
 * Script de test pour vérifier la configuration AGENLY
 * Exécutez avec: node test-setup.js
 */

const fs = require('fs');
const path = require('path');

console.log('🚀 Test de configuration AGENLY\n');

// Vérifier les fichiers essentiels
const requiredFiles = [
  'package.json',
  'next.config.js',
  'tailwind.config.js',
  'tsconfig.json',
  'firebase.json',
  'firestore.rules',
  'src/app/layout.tsx',
  'src/app/page.tsx',
  'src/lib/firebase.ts',
  'src/lib/firebase-admin.ts',
  'src/types/index.ts',
  'src/lib/services/OpenAIService.ts',
  'src/lib/services/AgentService.ts',
  'src/lib/services/ConversationService.ts',
  'src/lib/services/EnhancedConversationService.ts',
  'src/components/providers/UserProvider.tsx',
  'src/components/providers/AgentsProvider.tsx',
  'src/components/ui/Button.tsx',
  'src/components/ui/Input.tsx',
  'src/components/ui/Card.tsx',
  'src/hooks/useChat.ts',
  'src/hooks/useIntegrations.ts',
  'src/app/api/chat/route.ts',
  'src/app/api/generate-agent/route.ts',
  'src/app/api/auth/callback/google/route.ts',
  'src/app/api/agents/[id]/chat/route.ts',
];

console.log('📁 Vérification des fichiers...');
let missingFiles = [];

requiredFiles.forEach(file => {
  if (fs.existsSync(file)) {
    console.log(`✅ ${file}`);
  } else {
    console.log(`❌ ${file} - MANQUANT`);
    missingFiles.push(file);
  }
});

if (missingFiles.length > 0) {
  console.log(`\n⚠️  ${missingFiles.length} fichier(s) manquant(s)`);
} else {
  console.log('\n✅ Tous les fichiers essentiels sont présents');
}

// Vérifier package.json
console.log('\n📦 Vérification du package.json...');
try {
  const packageJson = JSON.parse(fs.readFileSync('package.json', 'utf8'));
  
  const requiredDeps = [
    'next', 'react', 'react-dom', 'typescript',
    'firebase', 'firebase-admin', 'openai',
    'tailwindcss', 'framer-motion', 'lucide-react'
  ];
  
  const missingDeps = requiredDeps.filter(dep => 
    !packageJson.dependencies?.[dep] && !packageJson.devDependencies?.[dep]
  );
  
  if (missingDeps.length === 0) {
    console.log('✅ Toutes les dépendances essentielles sont présentes');
  } else {
    console.log(`❌ Dépendances manquantes: ${missingDeps.join(', ')}`);
  }
  
  console.log(`📊 Version Next.js: ${packageJson.dependencies?.next || 'Non trouvée'}`);
  console.log(`📊 Version React: ${packageJson.dependencies?.react || 'Non trouvée'}`);
  
} catch (error) {
  console.log('❌ Erreur lors de la lecture du package.json');
}

// Vérifier la structure des dossiers
console.log('\n📂 Vérification de la structure des dossiers...');
const requiredDirs = [
  'src',
  'src/app',
  'src/app/api',
  'src/components',
  'src/components/ui',
  'src/components/providers',
  'src/lib',
  'src/lib/services',
  'src/hooks',
  'src/types'
];

requiredDirs.forEach(dir => {
  if (fs.existsSync(dir)) {
    console.log(`✅ ${dir}/`);
  } else {
    console.log(`❌ ${dir}/ - MANQUANT`);
  }
});

// Vérifier les variables d'environnement
console.log('\n🔐 Vérification des variables d\'environnement...');
const envFile = '.env.local';
if (fs.existsSync(envFile)) {
  console.log('✅ Fichier .env.local trouvé');
  
  const envContent = fs.readFileSync(envFile, 'utf8');
  const requiredEnvVars = [
    'NEXT_PUBLIC_FIREBASE_API_KEY',
    'NEXT_PUBLIC_FIREBASE_PROJECT_ID',
    'OPENAI_API_KEY',
    'NEXT_PUBLIC_GOOGLE_CLIENT_ID',
    'GOOGLE_CLIENT_SECRET'
  ];
  
  const missingEnvVars = requiredEnvVars.filter(envVar => 
    !envContent.includes(envVar)
  );
  
  if (missingEnvVars.length === 0) {
    console.log('✅ Toutes les variables d\'environnement essentielles sont présentes');
  } else {
    console.log(`⚠️  Variables d'environnement manquantes: ${missingEnvVars.join(', ')}`);
  }
} else {
  console.log('⚠️  Fichier .env.local non trouvé - Créez-le avec vos clés API');
}

// Instructions finales
console.log('\n🎯 Instructions suivantes:');
console.log('1. Créez le fichier .env.local avec vos clés API');
console.log('2. Exécutez: npm install');
console.log('3. Exécutez: npm run dev');
console.log('4. Ouvrez http://localhost:3000');
console.log('\n📚 Documentation complète dans README.md');
console.log('\n✨ AGENLY est prêt à être configuré !');
