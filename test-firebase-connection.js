#!/usr/bin/env node

/**
 * Test de connexion Firebase avec les nouvelles clés
 */

// Charger les variables d'environnement
require('dotenv').config({ path: '.env.local' });

console.log('🔥 Test de Connexion Firebase\n');

// Vérifier les variables d'environnement
const requiredEnvVars = [
  'NEXT_PUBLIC_FIREBASE_PROJECT_ID',
  'NEXT_PUBLIC_FIREBASE_API_KEY',
  'FIREBASE_PROJECT_ID'
];

console.log('1️⃣ Vérification des variables d\'environnement...');

let allConfigured = true;

requiredEnvVars.forEach(envVar => {
  const value = process.env[envVar];
  if (value && !value.includes('your_') && !value.includes('here')) {
    console.log(`✅ ${envVar}: Configuré`);
  } else {
    console.log(`❌ ${envVar}: Non configuré ou valeur de démonstration`);
    allConfigured = false;
  }
});

if (!allConfigured) {
  console.log('\n❌ Configuration incomplète !');
  console.log('\n📋 ACTIONS REQUISES :');
  console.log('   1. Ouvrez le fichier .env.local');
  console.log('   2. Remplacez les valeurs Firebase par vos vraies clés');
  console.log('   3. Redémarrez le serveur avec: npm run dev');
  process.exit(1);
}

console.log('\n2️⃣ Test de connexion Firebase...');

// Test simple de connexion
const API_BASE_URL = 'http://localhost:3000/api';

async function testFirebaseConnection() {
  try {
    // Test de création d'agent (qui utilise Firebase)
    const response = await fetch(`${API_BASE_URL}/generate-agent`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        name: 'Test Firebase Connection',
        description: 'Test de connexion Firebase',
        businessType: 'restaurant',
        objectives: 'Test de connexion Firebase',
        userId: 'test-firebase-user'
      })
    });

    if (response.ok) {
      const result = await response.json();
      console.log('✅ Connexion Firebase réussie !');
      console.log('   Réponse complète:', JSON.stringify(result, null, 2));
      console.log(`   Agent créé: ${result.data?.name}`);
      console.log(`   ID: ${result.data?.id}`);
      
      // Test de récupération d'agent
      console.log('\n3️⃣ Test de récupération d\'agent...');
      const getResponse = await fetch(`${API_BASE_URL}/agents/${result.data.id}?userId=test-firebase-user`);
      
      if (getResponse.ok) {
        console.log('✅ Récupération d\'agent réussie !');
        console.log('🎉 Firebase est correctement configuré !');
      } else {
        console.log('❌ Erreur lors de la récupération d\'agent');
        console.log('   Status:', getResponse.status);
      }
    } else {
      console.log('❌ Erreur lors de la création d\'agent');
      console.log('   Status:', response.status);
      const error = await response.text();
      console.log('   Erreur:', error);
    }
  } catch (error) {
    console.log('❌ Erreur de connexion:', error.message);
  }
}

testFirebaseConnection();




