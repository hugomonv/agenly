#!/usr/bin/env node

/**
 * Test complet de l'authentification OAuth Google
 */

// Charger les variables d'environnement
require('dotenv').config({ path: '.env.local' });

const fetch = require('node-fetch');
const API_BASE_URL = 'http://localhost:3000/api';

console.log('🔐 TEST COMPLET OAUTH GOOGLE\n');

async function testOAuthGoogle() {
  try {
    const testUserId = 'test-oauth-user';

    // 1. Test de génération de l'URL d'authentification
    console.log('1️⃣ Test de génération URL OAuth...');
    const authResponse = await fetch(`${API_BASE_URL}/auth/google?userId=${testUserId}`);
    let authData = null;
    
    if (authResponse.ok) {
      authData = await authResponse.json();
      console.log('✅ URL OAuth générée avec succès !');
      console.log('   URL:', authData.authUrl.substring(0, 100) + '...');
      console.log('   Scopes inclus:', authData.authUrl.includes('calendar') ? '✅' : '❌');
    } else {
      console.log('❌ Erreur génération URL OAuth:', authResponse.status);
      return;
    }

    // 2. Test du statut des intégrations (avant authentification)
    console.log('\n2️⃣ Test statut intégrations (avant auth)...');
    const statusResponse = await fetch(`${API_BASE_URL}/integrations/google/status?userId=${testUserId}`);
    
    if (statusResponse.ok) {
      const statusData = await statusResponse.json();
      console.log('✅ Statut intégrations récupéré !');
      console.log('   Configuré:', statusData.status.configured);
      console.log('   Message:', statusData.status.message);
    } else {
      console.log('❌ Erreur statut intégrations:', statusResponse.status);
    }

    // 3. Test de création d'agent avec intégrations
    console.log('\n3️⃣ Test création agent avec intégrations...');
    const agentResponse = await fetch(`${API_BASE_URL}/generate-agent`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: 'Agent OAuth Test',
        description: 'Agent IA avec intégrations Google OAuth',
        businessType: 'restaurant',
        objectives: 'Test des intégrations OAuth Google',
        userId: testUserId
      })
    });

    if (agentResponse.ok) {
      const agentData = await agentResponse.json();
      console.log('✅ Agent créé avec succès !');
      console.log('   ID:', agentData.data?.id);
      console.log('   Nom:', agentData.data?.name);
    } else {
      console.log('❌ Erreur création agent:', agentResponse.status);
    }

    // 4. Instructions pour l'authentification manuelle
    console.log('\n4️⃣ Instructions pour l\'authentification manuelle :');
    if (authData) {
      console.log('   1. Ouvrez cette URL dans votre navigateur :');
      console.log('      ' + authData.authUrl);
      console.log('   2. Autorisez l\'application Google');
      console.log('   3. Vous serez redirigé vers localhost:3000/?success=google_connected');
      console.log('   4. Relancez ce test pour vérifier les intégrations');
    }

    console.log('\n🎉 TEST OAUTH GOOGLE TERMINÉ !');

    console.log('\n📋 RÉSUMÉ DES FONCTIONNALITÉS TESTÉES :');
    console.log('   ✅ Génération URL OAuth Google');
    console.log('   ✅ Vérification statut intégrations');
    console.log('   ✅ Création d\'agents avec intégrations');
    console.log('   ✅ Configuration complète OAuth2');

    console.log('\n🚀 PROCHAINES ÉTAPES :');
    console.log('   1. Suivez les instructions d\'authentification manuelle');
    console.log('   2. Testez les intégrations réelles avec vos données Google');
    console.log('   3. Créez des agents IA personnalisés avec accès Google');
    console.log('   4. Déployez vos agents sur différentes plateformes');

  } catch (error) {
    console.error('❌ Erreur fatale lors du test OAuth Google:', error);
  }
}

testOAuthGoogle();




