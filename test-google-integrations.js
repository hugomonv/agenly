#!/usr/bin/env node

/**
 * Test des intégrations Google
 */

const BASE_URL = 'http://localhost:3000';

async function testGoogleIntegrations() {
  console.log('🔗 Test des Intégrations Google\n');

  try {
    // 1. Test du statut des intégrations
    console.log('1️⃣ Test du statut des intégrations Google...');
    const statusResponse = await fetch(`${BASE_URL}/api/integrations/google/status?userId=test-user`);
    
    console.log('   Status:', statusResponse.status);
    const statusData = await statusResponse.json();
    console.log('   Response:', JSON.stringify(statusData, null, 2));

    if (statusResponse.ok) {
      console.log('✅ Statut des intégrations récupéré !');
      console.log('   Configuré:', statusData.status.configured);
      console.log('   Testé:', statusData.status.tested);
    } else {
      console.log('❌ Erreur statut intégrations:', statusData.error);
    }

    // 2. Test de création d'agent avec intégrations
    console.log('\n2️⃣ Test de création d\'agent avec intégrations...');
    const agentResponse = await fetch(`${BASE_URL}/api/generate-agent`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        businessType: 'restaurant',
        name: 'Assistant Google Test',
        objectives: 'Test des intégrations Google',
        features: ['chat', 'calendar', 'email'],
        personality: 'Professionnel',
        userId: 'google-test-user',
        conversationId: 'google-test-conv'
      }),
    });

    if (agentResponse.ok) {
      const agentData = await agentResponse.json();
      console.log('✅ Agent créé avec intégrations:', agentData.data.name);
      console.log('   ID:', agentData.data.id);
      console.log('   Capacités:', agentData.data.capabilities);
    } else {
      const errorData = await agentResponse.json();
      console.log('❌ Erreur création agent:', errorData.error);
    }

    // 3. Test de chat avec agent intégré
    console.log('\n3️⃣ Test de chat avec agent intégré...');
    const chatResponse = await fetch(`${BASE_URL}/api/chat`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        message: 'Peux-tu vérifier mon calendrier et m\'envoyer un email de rappel ?',
        agentId: 'test-agent-id',
        userId: 'google-test-user',
        conversationId: 'google-test-conv'
      }),
    });

    console.log('   Status:', chatResponse.status);
    if (chatResponse.ok) {
      const chatData = await chatResponse.json();
      console.log('✅ Chat avec intégrations réussi !');
      console.log('   Réponse:', chatData.response.substring(0, 200) + '...');
    } else {
      const errorData = await chatResponse.json();
      console.log('❌ Erreur chat intégré:', errorData.error);
    }

    console.log('\n🎉 Test des intégrations Google terminé !');

  } catch (error) {
    console.error('❌ Erreur lors du test:', error.message);
  }
}

testGoogleIntegrations();



