#!/usr/bin/env node

/**
 * Test simple Firebase
 * Vérifie la création et récupération d'agents
 */

const BASE_URL = 'http://localhost:3000';

async function testFirebaseSimple() {
  console.log('🔥 Test simple Firebase\n');

  try {
    // 1. Créer un agent
    console.log('1️⃣ Création d\'agent...');
    const createResponse = await fetch(`${BASE_URL}/api/generate-agent`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        businessType: 'test-simple',
        name: 'Agent Test Simple',
        objectives: 'Test simple Firebase',
        features: ['Test'],
        personality: 'Testeur',
        userId: 'test-simple-user',
        conversationId: 'test-simple-conv'
      }),
    });

    if (!createResponse.ok) {
      throw new Error(`Erreur création: ${createResponse.status}`);
    }

    const createData = await createResponse.json();
    console.log('✅ Agent créé');
    console.log('   ID:', createData.data.id);
    console.log('   Nom:', createData.data.name);

    const agentId = createData.data.id;

    // 2. Attendre un peu pour que Firebase se synchronise
    console.log('\n2️⃣ Attente de synchronisation Firebase...');
    await new Promise(resolve => setTimeout(resolve, 2000));

    // 3. Récupérer l'agent directement
    console.log('\n3️⃣ Récupération directe de l\'agent...');
    const getResponse = await fetch(`${BASE_URL}/api/agents/${agentId}`);
    
    if (getResponse.ok) {
      const getData = await getResponse.json();
      console.log('✅ Agent récupéré directement');
      console.log('   Nom:', getData.data.name);
      console.log('   Statut:', getData.data.status);
    } else {
      const errorData = await getResponse.json();
      console.log('❌ Erreur récupération directe:', errorData.error);
    }

    // 4. Test de déploiement
    console.log('\n4️⃣ Test de déploiement...');
    const deployResponse = await fetch(`${BASE_URL}/api/deploy`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        agentId: agentId,
        deploymentType: 'web',
        userId: 'test-simple-user'
      }),
    });

    if (deployResponse.ok) {
      const deployData = await deployResponse.json();
      console.log('✅ Déploiement réussi');
      console.log('   URL:', deployData.data.url);
    } else {
      const errorData = await deployResponse.json();
      console.log('❌ Erreur déploiement:', errorData.error);
    }

    console.log('\n🎉 Test simple terminé !');

  } catch (error) {
    console.error('❌ Erreur:', error.message);
  }
}

// Exécuter le test
testFirebaseSimple();



