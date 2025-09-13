import { Router, Request, Response } from 'express';
import { authenticateToken, requireFeature } from '../auth/middleware/authMiddleware';
import { asyncHandler } from '../middleware/errorHandler';
import { AgentDeploymentService, DeploymentConfig } from '../services/deployment/AgentDeploymentService';
import { AgentService } from '../services/agent/AgentService';
import { logger } from '../utils/logger';
import { APIResponse } from '../types';

const router = Router();
const deploymentService = new AgentDeploymentService();
const agentService = new AgentService();

// Interface pour la requête de déploiement
interface DeployAgentRequest {
  agentId: string;
  config: DeploymentConfig;
}

// Interface pour la requête de test
interface TestAgentRequest {
  deploymentId: string;
  testMessage: string;
}

// Déployer un agent
router.post('/deploy', authenticateToken, requireFeature('agent_deployment'), asyncHandler(async (req: Request, res: Response) => {
  try {
    const { agentId, config }: DeployAgentRequest = req.body as DeployAgentRequest;

    if (!agentId || !config) {
      return (res as any).status(400).json({
        success: false,
        error: {
          message: 'Agent ID et configuration requis',
          code: 'MISSING_REQUIRED_FIELDS'
        }
      } as APIResponse);
    }

    // Récupérer l'agent
    const agent = await agentService.getAgentById(agentId);
    if (!agent) {
      return (res as any).status(404).json({
        success: false,
        error: {
          message: 'Agent non trouvé',
          code: 'AGENT_NOT_FOUND'
        }
      } as APIResponse);
    }

    // Vérifier que l'agent appartient au tenant
    if (agent.tenant_id !== (req as any).tenantId) {
      return (res as any).status(403).json({
        success: false,
        error: {
          message: 'Accès non autorisé à cet agent',
          code: 'UNAUTHORIZED_ACCESS'
        }
      } as APIResponse);
    }

    // Déployer l'agent
    const deploymentResult = await deploymentService.deployAgent(
      agent,
      config,
      (req as any).tenantId!
    );

    logger.info('Agent deployment requested', {
      agentId,
      deploymentId: deploymentResult.deploymentId,
      tenantId: (req as any).tenantId,
      userId: (req as any).userId
    });

    const response: APIResponse = {
      success: deploymentResult.success,
      data: deploymentResult
    };

    (res as any).status(deploymentResult.success ? 201 : 500).json(response);
  } catch (error) {
    logger.error('Error deploying agent', {
      error: error instanceof Error ? error.message : 'Unknown error',
      tenantId: (req as any).tenantId,
      userId: (req as any).userId
    });

    (res as any).status(500).json({
      success: false,
      error: {
        message: 'Erreur lors du déploiement de l\'agent',
        code: 'DEPLOYMENT_FAILED'
      }
    } as APIResponse);
  }
}));

// Arrêter le déploiement d'un agent
router.delete('/:deploymentId', authenticateToken, requireFeature('agent_deployment'), asyncHandler(async (req: Request, res: Response) => {
  try {
    const { deploymentId } = req.params;

    const success = await deploymentService.undeployAgent(
      deploymentId,
      (req as any).tenantId!
    );

    if (!success) {
      return (res as any).status(404).json({
        success: false,
        error: {
          message: 'Déploiement non trouvé',
          code: 'DEPLOYMENT_NOT_FOUND'
        }
      } as APIResponse);
    }

    logger.info('Agent undeployment requested', {
      deploymentId,
      tenantId: (req as any).tenantId,
      userId: (req as any).userId
    });

    const response: APIResponse = {
      success: true,
      data: { deploymentId },
      // message: 'Agent arrêté avec succès'
    };

    (res as any).json(response);
  } catch (error) {
    logger.error('Error undeploying agent', {
      error: error instanceof Error ? error.message : 'Unknown error',
      tenantId: (req as any).tenantId,
      userId: (req as any).userId
    });

    (res as any).status(500).json({
      success: false,
      error: {
        message: 'Erreur lors de l\'arrêt de l\'agent',
        code: 'UNDEPLOYMENT_FAILED'
      }
    } as APIResponse);
  }
}));

// Obtenir le statut d'un déploiement
router.get('/:deploymentId/status', authenticateToken, requireFeature('agent_deployment'), asyncHandler(async (req: Request, res: Response) => {
  try {
    const { deploymentId } = req.params;

    const deployment = await deploymentService.getDeploymentStatus(deploymentId);
    if (!deployment) {
      return (res as any).status(404).json({
        success: false,
        error: {
          message: 'Déploiement non trouvé',
          code: 'DEPLOYMENT_NOT_FOUND'
        }
      } as APIResponse);
    }

    const response: APIResponse = {
      success: true,
      data: deployment,
      // message: 'Statut du déploiement récupéré'
    };

    (res as any).json(response);
  } catch (error) {
    logger.error('Error getting deployment status', {
      error: error instanceof Error ? error.message : 'Unknown error',
      tenantId: (req as any).tenantId,
      userId: (req as any).userId
    });

    (res as any).status(500).json({
      success: false,
      error: {
        message: 'Erreur lors de la récupération du statut',
        code: 'STATUS_RETRIEVAL_FAILED'
      }
    } as APIResponse);
  }
}));

// Obtenir tous les déploiements d'un tenant
router.get('/', authenticateToken, requireFeature('agent_deployment'), asyncHandler(async (req: Request, res: Response) => {
  try {
    const deployments = await deploymentService.getTenantDeployments((req as any).tenantId!);

    const response: APIResponse = {
      success: true,
      data: deployments,
      // message: 'Déploiements récupérés avec succès'
    };

    (res as any).json(response);
  } catch (error) {
    logger.error('Error getting tenant deployments', {
      error: error instanceof Error ? error.message : 'Unknown error',
      tenantId: (req as any).tenantId,
      userId: (req as any).userId
    });

    (res as any).status(500).json({
      success: false,
      error: {
        message: 'Erreur lors de la récupération des déploiements',
        code: 'DEPLOYMENTS_RETRIEVAL_FAILED'
      }
    } as APIResponse);
  }
}));

// Obtenir les métriques d'un déploiement
router.get('/:deploymentId/metrics', authenticateToken, requireFeature('agent_deployment'), asyncHandler(async (req: Request, res: Response) => {
  try {
    const { deploymentId } = req.params;

    const metrics = await deploymentService.getDeploymentMetrics(deploymentId);
    if (!metrics) {
      return (res as any).status(404).json({
        success: false,
        error: {
          message: 'Déploiement non trouvé',
          code: 'DEPLOYMENT_NOT_FOUND'
        }
      } as APIResponse);
    }

    const response: APIResponse = {
      success: true,
      data: metrics,
      // message: 'Métriques récupérées avec succès'
    };

    (res as any).json(response);
  } catch (error) {
    logger.error('Error getting deployment metrics', {
      error: error instanceof Error ? error.message : 'Unknown error',
      tenantId: (req as any).tenantId,
      userId: (req as any).userId
    });

    (res as any).status(500).json({
      success: false,
      error: {
        message: 'Erreur lors de la récupération des métriques',
        code: 'METRICS_RETRIEVAL_FAILED'
      }
    } as APIResponse);
  }
}));

// Tester un agent déployé
router.post('/:deploymentId/test', authenticateToken, requireFeature('agent_deployment'), asyncHandler(async (req: Request, res: Response) => {
  try {
    const { deploymentId } = req.params;
    const { testMessage }: TestAgentRequest = req.body as TestAgentRequest;

    if (!testMessage) {
      return (res as any).status(400).json({
        success: false,
        error: {
          message: 'Message de test requis',
          code: 'MISSING_TEST_MESSAGE'
        }
      } as APIResponse);
    }

    const testResult = await deploymentService.testDeployedAgent(deploymentId, testMessage);

    const response: APIResponse = {
      success: testResult.success,
      data: testResult,
      // message: testResult.success ? 'Test effectué avec succès' : 'Erreur lors du test'
    };

    (res as any).status(testResult.success ? 200 : 500).json(response);
  } catch (error) {
    logger.error('Error testing deployed agent', {
      error: error instanceof Error ? error.message : 'Unknown error',
      tenantId: (req as any).tenantId,
      userId: (req as any).userId
    });

    (res as any).status(500).json({
      success: false,
      error: {
        message: 'Erreur lors du test de l\'agent',
        code: 'TEST_FAILED'
      }
    } as APIResponse);
  }
}));

export default router;




