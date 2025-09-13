import { Router, Request, Response } from 'express';
import { authenticateToken, authorize, requirePermission } from '../auth/middleware/authMiddleware';
import { asyncHandler } from '../middleware/errorHandler';
import { MasterAgent } from '../agents/master-agent/MasterAgent';
import { OpenAIService } from '../services/openai-service/OpenAIService';
import { AgentService } from '../services/agent/AgentService';
import { logger } from '../utils/logger';
import { APIResponse, Agent, MasterAgentSession } from '../types';

const router = Router();
const masterAgent = new MasterAgent();
const openaiService = OpenAIService.getInstance();
const agentService = new AgentService();

// Interface pour la création d'agent
interface CreateAgentRequest {
  name: string;
  description: string;
  personality: {
    tone: 'professional' | 'friendly' | 'casual' | 'formal';
    expertise_level: 'beginner' | 'intermediate' | 'expert';
    proactivity: number;
    response_style: 'concise' | 'detailed' | 'conversational';
  };
  capabilities: string[];
  system_prompt: string;
  integrations?: string[];
}

// Interface pour la mise à jour d'agent
interface UpdateAgentRequest {
  name?: string;
  description?: string;
  personality?: Partial<Agent['personality']>;
  capabilities?: string[];
  system_prompt?: string;
  status?: 'draft' | 'sandbox' | 'active' | 'paused' | 'archived';
}

// Interface pour la conversation avec le master agent
interface MasterAgentRequest {
  message: string;
  sessionId?: string;
}

// Liste des agents
router.get('/', authenticateToken, requirePermission('read'), asyncHandler(async (req: Request, res: Response) => {
  try {
    const { page = 1, limit = 10, status, search } = req.query;
    
    // Récupérer les agents depuis la base de données
    const agents = await agentService.getAgentsByTenant((req as any).tenantId!);
    
    // Pour l'instant, utiliser des données mock si aucun agent
    const mockAgents: any[] = [
      {
        id: 'agent_1',
        tenant_id: (req as any).tenantId!,
        name: 'Assistant Commercial',
        description: 'Agent spécialisé dans la vente et le support client',
        status: 'active',
        personality: {
          tone: 'professional',
          expertise_level: 'expert',
          proactivity: 75,
          response_style: 'conversational'
        },
        capabilities: ['vente', 'support', 'qualification'],
        integrations: [],
        knowledge_base: {
          documents: [],
          embeddings_id: '',
          last_updated: new Date()
        },
        system_prompt: 'Tu es un assistant commercial expert...',
        version: '1.0.0',
        created_at: new Date(),
        updated_at: new Date(),
        created_by: (req as any).userId!,
        usage_stats: {
          total_conversations: 150,
          total_messages: 1200,
          last_used: new Date(),
          avg_response_time: 2.5
        }
      }
    ];

    // Filtrage par statut
    // Combiner agents réels et mock
    const allAgents = [...agents, ...mockAgents];
    let filteredAgents = allAgents;
    if (status) {
      filteredAgents = filteredAgents.filter(agent => agent.status === status);
    }

    // Recherche par nom ou description
    if (search) {
      const searchTerm = (search as string).toLowerCase();
      filteredAgents = filteredAgents.filter(agent => 
        agent.name.toLowerCase().includes(searchTerm) ||
        agent.description.toLowerCase().includes(searchTerm)
      );
    }

    // Pagination
    const startIndex = (Number(page) - 1) * Number(limit);
    const endIndex = startIndex + Number(limit);
    const paginatedAgents = filteredAgents.slice(startIndex, endIndex);

    const response: APIResponse = {
      success: true,
      data: paginatedAgents,
      metadata: {
        timestamp: new Date(),
        request_id: (req as any).requestId,
        version: '1.0.0'
      }
    };

    (res as any).json(response);
  } catch (error) {
    logger.error('Error fetching agents', {
      tenantId: (req as any).tenantId,
      userId: (req as any).userId,
      error: (error as Error).message
    });

    (res as any).status(500).json({
      success: false,
      error: {
        code: 'FETCH_AGENTS_ERROR',
        message: 'Failed to fetch agents'
      }
    } as APIResponse);
  }
}));

// Récupération d'un agent spécifique
router.get('/:id', authenticateToken, requirePermission('read'), asyncHandler(async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    // TODO: Implémenter la récupération depuis la base de données
    // Pour l'instant, utiliser des données mock
    const mockAgent = {
      id: id,
      tenant_id: (req as any).tenantId!,
      name: 'Assistant Commercial',
      description: 'Agent spécialisé dans la vente et le support client',
      status: 'active',
      personality: {
        tone: 'professional',
        expertise_level: 'expert',
        proactivity: 75,
        response_style: 'conversational'
      },
      capabilities: ['vente', 'support', 'qualification'],
      integrations: [],
      knowledge_base: {
        documents: [],
        embeddings_id: '',
        last_updated: new Date()
      },
      system_prompt: 'Tu es un assistant commercial expert...',
      version: '1.0.0',
      created_at: new Date(),
      updated_at: new Date(),
      created_by: (req as any).userId!,
      usage_stats: {
        total_conversations: 150,
        total_messages: 1200,
        last_used: new Date(),
        avg_response_time: 2.5
      }
    };

    const response: APIResponse = {
      success: true,
      data: mockAgent
    };

    (res as any).json(response);
  } catch (error) {
    logger.error('Error fetching agent', {
      agentId: (req.params as any).id,
      tenantId: (req as any).tenantId,
      userId: (req as any).userId,
      error: (error as Error).message
    });

    (res as any).status(500).json({
      success: false,
      error: {
        code: 'FETCH_AGENT_ERROR',
        message: 'Failed to fetch agent'
      }
    } as APIResponse);
  }
}));

// Création d'un agent
router.post('/', authenticateToken, requirePermission('write'), asyncHandler(async (req: Request, res: Response) => {
  try {
    const agentData: CreateAgentRequest = req.body;

    // Validation des données
    if (!agentData.name || !agentData.description || !agentData.system_prompt) {
      return (res as any).status(400).json({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Name, description, and system_prompt are required'
        }
      } as APIResponse);
    }

    // TODO: Implémenter la création dans la base de données
    const newAgent = {
      id: `agent_${Date.now()}`,
      tenant_id: (req as any).tenantId!,
      name: agentData.name,
      description: agentData.description,
      status: 'draft',
      personality: agentData.personality,
      capabilities: agentData.capabilities,
      integrations: [],
      knowledge_base: {
        documents: [],
        embeddings_id: '',
        last_updated: new Date()
      },
      system_prompt: agentData.system_prompt,
      version: '1.0.0',
      created_at: new Date(),
      updated_at: new Date(),
      created_by: (req as any).userId!,
      usage_stats: {
        total_conversations: 0,
        total_messages: 0,
        last_used: new Date(),
        avg_response_time: 0
      }
    };

    logger.info('Agent created', {
      agentId: newAgent.id,
      tenantId: (req as any).tenantId,
      userId: (req as any).userId,
      agentName: newAgent.name
    });

    const response: APIResponse = {
      success: true,
      data: newAgent
    };

    (res as any).status(201).json(response);
  } catch (error) {
    logger.error('Error creating agent', {
      tenantId: (req as any).tenantId,
      userId: (req as any).userId,
      error: (error as Error).message
    });

    (res as any).status(500).json({
      success: false,
      error: {
        code: 'CREATE_AGENT_ERROR',
        message: 'Failed to create agent'
      }
    } as APIResponse);
  }
}));

// Mise à jour d'un agent
router.put('/:id', authenticateToken, requirePermission('write'), asyncHandler(async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const updateData: UpdateAgentRequest = req.body;

    // TODO: Implémenter la mise à jour dans la base de données
    const updatedAgent = {
      id: id,
      tenant_id: (req as any).tenantId!,
      name: updateData.name || 'Assistant Commercial',
      description: updateData.description || 'Agent spécialisé dans la vente et le support client',
      status: updateData.status || 'active',
      personality: {
        tone: 'professional',
        expertise_level: 'expert',
        proactivity: 75,
        response_style: 'conversational',
        ...updateData.personality
      },
      capabilities: updateData.capabilities || ['vente', 'support', 'qualification'],
      integrations: [],
      knowledge_base: {
        documents: [],
        embeddings_id: '',
        last_updated: new Date()
      },
      system_prompt: updateData.system_prompt || 'Tu es un assistant commercial expert...',
      version: '1.1.0',
      created_at: new Date(),
      updated_at: new Date(),
      created_by: (req as any).userId!,
      usage_stats: {
        total_conversations: 150,
        total_messages: 1200,
        last_used: new Date(),
        avg_response_time: 2.5
      }
    };

    logger.info('Agent updated', {
      agentId: id,
      tenantId: (req as any).tenantId,
      userId: (req as any).userId,
      updates: Object.keys(updateData)
    });

    const response: APIResponse = {
      success: true,
      data: updatedAgent
    };

    (res as any).json(response);
  } catch (error) {
    logger.error('Error updating agent', {
      agentId: (req.params as any).id,
      tenantId: (req as any).tenantId,
      userId: (req as any).userId,
      error: (error as Error).message
    });

    (res as any).status(500).json({
      success: false,
      error: {
        code: 'UPDATE_AGENT_ERROR',
        message: 'Failed to update agent'
      }
    } as APIResponse);
  }
}));

// Suppression d'un agent
router.delete('/:id', authenticateToken, requirePermission('admin'), asyncHandler(async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    // TODO: Implémenter la suppression dans la base de données
    logger.info('Agent deleted', {
      agentId: id,
      tenantId: (req as any).tenantId,
      userId: (req as any).userId
    });

    const response: APIResponse = {
      success: true,
      data: {
        message: 'Agent deleted successfully'
      }
    };

    (res as any).json(response);
  } catch (error) {
    logger.error('Error deleting agent', {
      agentId: (req.params as any).id,
      tenantId: (req as any).tenantId,
      userId: (req as any).userId,
      error: (error as Error).message
    });

    (res as any).status(500).json({
      success: false,
      error: {
        code: 'DELETE_AGENT_ERROR',
        message: 'Failed to delete agent'
      }
    } as APIResponse);
  }
}));

// Conversation avec le master agent
router.post('/master-agent/chat', authenticateToken, requirePermission('write'), asyncHandler(async (req: Request, res: Response) => {
  try {
    const { message, sessionId }: MasterAgentRequest = req.body as MasterAgentRequest;

    if (!message) {
      return (res as any).status(400).json({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Message is required'
        }
      } as APIResponse);
    }

    let session: MasterAgentSession;

    if (sessionId) {
      // Continuer une session existante
      const currentSession = masterAgent.getCurrentSession();
      if (!currentSession || currentSession.id !== sessionId) {
        return (res as any).status(404).json({
          success: false,
          error: {
            code: 'SESSION_NOT_FOUND',
            message: 'Session not found'
          }
        } as APIResponse);
      }
      session = currentSession;
    } else {
      // Démarrer une nouvelle session
      session = await masterAgent.startAgentCreationSession(
        (req as any).tenantId!,
        (req as any).userId!,
        message
      );
    }

    // Traitement de la réponse utilisateur
    const result = await masterAgent.processUserResponse(session.id, message);

    const response: APIResponse = {
      success: true,
      data: {
        session: result.session,
        nextQuestion: result.nextQuestion,
        isComplete: result.isComplete,
        generatedAgent: result.generatedAgent
      }
    };

    (res as any).json(response);
  } catch (error) {
    logger.error('Error in master agent chat', {
      tenantId: (req as any).tenantId,
      userId: (req as any).userId,
      error: (error as Error).message
    });

    (res as any).status(500).json({
      success: false,
      error: {
        code: 'MASTER_AGENT_ERROR',
        message: 'Failed to process master agent request'
      }
    } as APIResponse);
  }
}));

// Test d'un agent
router.post('/:id/test', authenticateToken, requirePermission('write'), asyncHandler(async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { message } = req.body as any;

    if (!message) {
      return (res as any).status(400).json({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Message is required'
        }
      } as APIResponse);
    }

    // TODO: Récupérer l'agent depuis la base de données
    const mockAgent = {
      id: id,
      tenant_id: (req as any).tenantId!,
      name: 'Test Agent',
      description: 'Agent de test',
      status: 'sandbox',
      personality: {
        tone: 'professional',
        expertise_level: 'intermediate',
        proactivity: 50,
        response_style: 'conversational'
      },
      capabilities: ['test'],
      integrations: [],
      knowledge_base: {
        documents: [],
        embeddings_id: '',
        last_updated: new Date()
      },
      system_prompt: 'Tu es un agent de test. Réponds de manière simple et claire.',
      version: '1.0.0',
      created_at: new Date(),
      updated_at: new Date(),
      created_by: (req as any).userId!,
      usage_stats: {
        total_conversations: 0,
        total_messages: 0,
        last_used: new Date(),
        avg_response_time: 0
      }
    };

    // Test de l'agent
    const testResult = await openaiService.chatWithAgent(
      mockAgent,
      { id: 'test_conversation', tenant_id: (req as any).tenantId!, agent_id: id, user_id: (req as any).userId!, session_id: 'test_session', messages: [], context: {}, status: 'active', created_at: new Date(), updated_at: new Date(), metadata: { user_agent: '', ip_address: '' } },
      message,
      (req as any).tenantId!
    );

    const response: APIResponse = {
      success: true,
      data: {
        response: testResult.response,
        tokensUsed: testResult.tokensUsed,
        model: testResult.model,
        agentId: id
      }
    };

    (res as any).json(response);
  } catch (error) {
    logger.error('Error testing agent', {
      agentId: (req.params as any).id,
      tenantId: (req as any).tenantId,
      userId: (req as any).userId,
      error: (error as Error).message
    });

    (res as any).status(500).json({
      success: false,
      error: {
        code: 'AGENT_TEST_ERROR',
        message: 'Failed to test agent'
      }
    } as APIResponse);
  }
}));

// Déploiement d'un agent
router.post('/:id/deploy', authenticateToken, requirePermission('write'), asyncHandler(async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { environment = 'production' } = req.body as any;

    // TODO: Implémenter le déploiement
    logger.info('Agent deployed', {
      agentId: id,
      tenantId: (req as any).tenantId,
      userId: (req as any).userId,
      environment
    });

    const response: APIResponse = {
      success: true,
      data: {
        message: 'Agent deployed successfully',
        agentId: id,
        environment,
        deployedAt: new Date()
      }
    };

    (res as any).json(response);
  } catch (error) {
    logger.error('Error deploying agent', {
      agentId: (req.params as any).id,
      tenantId: (req as any).tenantId,
      userId: (req as any).userId,
      error: (error as Error).message
    });

    (res as any).status(500).json({
      success: false,
      error: {
        code: 'DEPLOY_AGENT_ERROR',
        message: 'Failed to deploy agent'
      }
    } as APIResponse);
  }
}));

// Route pour sauvegarder un agent généré par le Master Agent
router.post('/save-generated', authenticateToken, asyncHandler(async (req: Request, res: Response) => {
  try {
    const { agentData } = req.body as { agentData: any };

    if (!agentData) {
      return (res as any).status(400).json({
        success: false,
        error: {
          message: 'Données d\'agent requises',
          code: 'MISSING_AGENT_DATA'
        }
      } as APIResponse);
    }

    // Créer l'agent via le service
    const newAgent = await agentService.generateAgentFromMasterAgent(
      (req as any).tenantId!,
      (req as any).userId!,
      agentData
    );

    logger.info('Generated agent saved', {
      agentId: newAgent.id,
      tenantId: (req as any).tenantId,
      userId: (req as any).userId
    });

    const response: APIResponse = {
      success: true,
      data: newAgent,
      // message: 'Agent généré et sauvegardé avec succès'
    };

    (res as any).status(201).json(response);
  } catch (error) {
    logger.error('Error saving generated agent', {
      error: error instanceof Error ? error.message : 'Unknown error',
      tenantId: (req as any).tenantId,
      userId: (req as any).userId
    });

    (res as any).status(500).json({
      success: false,
      error: {
        message: 'Erreur lors de la sauvegarde de l\'agent généré',
        code: 'AGENT_SAVE_FAILED'
      }
    } as APIResponse);
  }
}));

export default router;




