#!/usr/bin/env node

/**
 * Test de diagnostic Firebase
 */

require('dotenv').config({ path: '.env.local' });
const fetch = require('node-fetch');

console.log('🔍 DIAGNOSTIC FIREBASE\n');

async function diagnosticFirebase() {
  try {
    // Test 1: Variables d'environnement
    console.log('1️⃣ Test des variables d\'environnement :');
    console.log('   - NEXT_PUBLIC_FIREBASE_PROJECT_ID:', process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || '❌ Manquant');
    console.log('   - NEXT_PUBLIC_FIREBASE_API_KEY:', process.env.NEXT_PUBLIC_FIREBASE_API_KEY ? '✅ Configuré' : '❌ Manquant');
    console.log('   - OPENAI_API_KEY:', process.env.OPENAI_API_KEY ? '✅ Configuré' : '❌ Manquant');

    // Test 2: Connexion au serveur
    console.log('\n2️⃣ Test de connexion au serveur :');
    try {
      const response = await fetch('http://localhost:3000/api/integrations/google/status?userId=test-diagnostic');
      if (response.ok) {
        console.log('   ✅ Serveur accessible');
      } else {
        console.log('   ❌ Serveur non accessible:', response.status);
      }
    } catch (error) {
      console.log('   ❌ Serveur non accessible:', error.message);
    }

    // Test 3: Création d'agent
    console.log('\n3️⃣ Test de création d\'agent :');
    try {
      const agentResponse = await fetch('http://localhost:3000/api/generate-agent', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: 'Test Diagnostic',
          description: 'Agent de test',
          businessType: 'restaurant',
          objectives: 'Test diagnostic',
          userId: 'test-diagnostic'
        })
      });

      if (agentResponse.ok) {
        const agentData = await agentResponse.json();
        console.log('   ✅ Agent créé avec succès');
        console.log('   - ID:', agentData.data?.id);
        console.log('   - Prompt généré par IA:', agentData.data?.system_prompt?.includes('Tu es') ? '✅' : '❌');
      } else {
        console.log('   ❌ Erreur création agent:', agentResponse.status);
      }
    } catch (error) {
      console.log('   ❌ Erreur création agent:', error.message);
    }

    console.log('\n🎯 DIAGNOSTIC TERMINÉ !');
    console.log('\n📋 PROCHAINES ÉTAPES :');
    console.log('   1. Configurer les règles Firebase (voir GUIDE_CORRECTION_FIREBASE_URGENT.md)');
    console.log('   2. Redémarrer le serveur');
    console.log('   3. Relancer ce test');

  } catch (error) {
    console.error('❌ Erreur lors du diagnostic:', error);
  }
}

diagnosticFirebase();

