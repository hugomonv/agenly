#!/usr/bin/env node

/**
 * Test de configuration Firebase
 */

const { initializeApp } = require('firebase/app');
const { getFirestore, collection, doc, setDoc, getDoc } = require('firebase/firestore');

// Configuration Firebase (remplacez par vos vraies clés)
const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY || "demo-key",
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN || "demo.firebaseapp.com",
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || "demo-project",
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET || "demo.appspot.com",
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID || "123456789",
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID || "demo-app-id"
};

async function testFirebaseConfig() {
  console.log('🔥 Test de Configuration Firebase\n');

  try {
    // 1. Initialiser Firebase
    console.log('1️⃣ Initialisation Firebase...');
    const app = initializeApp(firebaseConfig);
    const db = getFirestore(app);
    console.log('✅ Firebase initialisé');

    // 2. Test d'écriture
    console.log('\n2️⃣ Test d\'écriture...');
    const testDoc = doc(db, 'test', 'config-test');
    await setDoc(testDoc, {
      message: 'Test de configuration Firebase',
      timestamp: new Date().toISOString(),
      status: 'success'
    });
    console.log('✅ Écriture réussie');

    // 3. Test de lecture
    console.log('\n3️⃣ Test de lecture...');
    const docSnap = await getDoc(testDoc);
    if (docSnap.exists()) {
      console.log('✅ Lecture réussie');
      console.log('   Données:', docSnap.data());
    } else {
      console.log('❌ Document non trouvé');
    }

    // 4. Test des collections principales
    console.log('\n4️⃣ Test des collections principales...');
    
    // Test agents
    const agentDoc = doc(db, 'agents', 'test-agent');
    await setDoc(agentDoc, {
      name: 'Agent Test',
      description: 'Test de configuration',
      created_by: 'test-user',
      created_at: new Date().toISOString()
    });
    console.log('✅ Collection agents accessible');

    // Test users
    const userDoc = doc(db, 'users', 'test-user');
    await setDoc(userDoc, {
      name: 'Utilisateur Test',
      email: 'test@example.com',
      created_at: new Date().toISOString()
    });
    console.log('✅ Collection users accessible');

    console.log('\n🎉 Configuration Firebase OK !');
    console.log('\n📋 RÉSUMÉ :');
    console.log('   ✅ Firebase initialisé');
    console.log('   ✅ Permissions Firestore configurées');
    console.log('   ✅ Collections principales accessibles');
    console.log('   ✅ Écriture/Lecture fonctionnelles');

  } catch (error) {
    console.error('\n❌ Erreur de configuration Firebase :');
    console.error('   Message:', error.message);
    console.error('   Code:', error.code);
    
    console.log('\n🔧 SOLUTIONS :');
    console.log('   1. Vérifiez vos clés Firebase dans .env.local');
    console.log('   2. Configurez les règles Firestore dans la console Firebase');
    console.log('   3. Vérifiez que le projet Firebase existe');
    console.log('   4. Consultez le guide : FIREBASE_CONFIGURATION_GUIDE.md');
  }
}

testFirebaseConfig();



