import { NextRequest, NextResponse } from 'next/server';
import UniversalDeploymentEngine from '@/lib/services/UniversalDeploymentEngine';
import { HybridAgentService } from '@/lib/services/HybridAgentService';
import TestDeploymentService from '@/lib/services/TestDeploymentService';
import PersistentPackageService from '@/lib/services/PersistentPackageService';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { agentId, platformId, customizations, deploymentOptions } = body;

    if (!agentId || !platformId) {
      return NextResponse.json(
        { success: false, error: 'Agent ID et Platform ID requis' },
        { status: 400 }
      );
    }

    // Récupérer l'agent - essayer d'abord le service de test, puis Firebase
    let agent;
    try {
      // Essayer d'abord le service de test
      agent = await TestDeploymentService.getAgentById(agentId);
      console.log('Agent trouvé dans TestDeploymentService:', !!agent);
      
      // Si pas trouvé, essayer Firebase
      if (!agent) {
        agent = await HybridAgentService.getInstance().getAgentById(agentId);
        console.log('Agent trouvé dans Firebase:', !!agent);
      }
    } catch (error) {
      console.error('Erreur récupération agent:', error);
      return NextResponse.json(
        { success: false, error: 'Erreur lors de la récupération de l\'agent' },
        { status: 500 }
      );
    }
    
    if (!agent) {
      return NextResponse.json(
        { success: false, error: 'Agent non trouvé. Assurez-vous que l\'agent existe et est accessible.' },
        { status: 404 }
      );
    }

    // Vérifier que la plateforme existe
    const platform = UniversalDeploymentEngine.getPlatform(platformId);
    if (!platform) {
      return NextResponse.json(
        { success: false, error: 'Plateforme non supportée' },
        { status: 400 }
      );
    }

    // Valider la compatibilité
    const compatibility = UniversalDeploymentEngine.validateCompatibility(agent, platform);
    if (!compatibility.compatible) {
      return NextResponse.json({
        success: false,
        error: 'Incompatibilité détectée',
        issues: compatibility.issues,
        recommendations: compatibility.recommendations
      }, { status: 400 });
    }

    // Créer le package de déploiement
    const deploymentPackage = await UniversalDeploymentEngine.createDeploymentPackage({
      agentId,
      platformId,
      customizations,
      deploymentOptions
    }, agent);

    // Synchroniser le package avec tous les services pour garantir la persistance
    try {
      await PersistentPackageService.createAndSyncPackage(deploymentPackage);
      console.log('Package synchronisé sur tous les services via PersistentPackageService');
    } catch (error) {
      console.error('Erreur synchronisation package:', error);
      // Fallback: synchronisation manuelle
      try {
        await TestDeploymentService.forceSyncPackage(deploymentPackage);
        UniversalDeploymentEngine.storeDeploymentPackage(deploymentPackage);
        console.log('Synchronisation fallback réussie');
      } catch (fallbackError) {
        console.error('Erreur synchronisation fallback:', fallbackError);
      }
    }

    return NextResponse.json({
      success: true,
      package: deploymentPackage,
      compatibility,
      platform
    });

  } catch (error) {
    console.error('Erreur lors du déploiement universel:', error);
    return NextResponse.json(
      { success: false, error: 'Erreur interne du serveur' },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const action = searchParams.get('action');

    switch (action) {
      case 'platforms':
        const platforms = UniversalDeploymentEngine.getAllPlatforms();
        return NextResponse.json({
          success: true,
          platforms
        });

      case 'recommendations':
        const businessType = searchParams.get('businessType');
        if (!businessType) {
          return NextResponse.json(
            { success: false, error: 'Business type requis' },
            { status: 400 }
          );
        }
        const recommendations = UniversalDeploymentEngine.recommendPlatforms(businessType);
        return NextResponse.json({
          success: true,
          recommendations
        });

      case 'detect':
        const message = searchParams.get('message');
        if (!message) {
          return NextResponse.json(
            { success: false, error: 'Message requis' },
            { status: 400 }
          );
        }
        const detectedPlatforms = UniversalDeploymentEngine.detectPlatformFromConversation(message);
        return NextResponse.json({
          success: true,
          detectedPlatforms
        });

      case 'estimate':
        const platformId = searchParams.get('platformId');
        const interactions = parseInt(searchParams.get('interactions') || '1000');
        if (!platformId) {
          return NextResponse.json(
            { success: false, error: 'Platform ID requis' },
            { status: 400 }
          );
        }
        const platform = UniversalDeploymentEngine.getPlatform(platformId);
        if (!platform) {
          return NextResponse.json(
            { success: false, error: 'Plateforme non trouvée' },
            { status: 404 }
          );
        }
        const costEstimate = UniversalDeploymentEngine.estimateCosts(platform, interactions);
        return NextResponse.json({
          success: true,
          estimate: costEstimate
        });

      default:
        return NextResponse.json(
          { success: false, error: 'Action non supportée' },
          { status: 400 }
        );
    }

  } catch (error) {
    console.error('Erreur lors de la récupération des données:', error);
    return NextResponse.json(
      { success: false, error: 'Erreur interne du serveur' },
      { status: 500 }
    );
  }
}




