import { Router, Request, Response } from 'express';
import { authenticateToken, requirePermission } from '../auth/middleware/authMiddleware';
import { asyncHandler } from '../middleware/errorHandler';
import { OpenAIService } from '../services/openai-service/OpenAIService';
import { logger } from '../utils/logger';
import { APIResponse, Conversation, Message } from '../types';

const router = Router();
const openaiService = OpenAIService.getInstance();

// Interface pour un nouveau message
interface NewMessageRequest {
  message: string;
  agentId: string;
  sessionId?: string;
  context?: Record<string, any>;
}

// Interface pour la mise à jour d'une conversation
interface UpdateConversationRequest {
  status?: 'active' | 'completed' | 'abandoned';
  context?: Record<string, any>;
}

// Liste des conversations
router.get('/', authenticateToken, requirePermission('read'), asyncHandler(async (req: Request, res: Response) => {
  try {
    const { page = 1, limit = 10, status, userId } = req.query;
    
    // TODO: Implémenter la récupération depuis la base de données
    // Pour l'instant, utiliser des données mock
    const mockConversations: any[] = [
      {
        id: 'conv_1',
        tenant_id: (req as any).tenantId!,
        agent_id: (req.query.agentId as string) || 'agent_1',
        user_id: userId as string || (req as any).userId!,
        session_id: 'session_1',
        messages: [
          {
            id: 'msg_1',
            role: 'user',
            content: 'Bonjour, pouvez-vous m\'aider ?',
            timestamp: new Date(Date.now() - 300000)
          },
          {
            id: 'msg_2',
            role: 'assistant',
            content: 'Bonjour ! Bien sûr, je suis là pour vous aider. Que puis-je faire pour vous ?',
            timestamp: new Date(Date.now() - 240000)
          }
        ],
        context: {},
        status: 'active',
        created_at: new Date(Date.now() - 300000),
        updated_at: new Date(Date.now() - 240000),
        metadata: {
          user_agent: (req as any).get('User-Agent') || '',
          ip_address: (req as any).ip || '',
          referrer: (req as any).get('Referer')
        }
      }
    ];

    // Filtrage par agent
    let filteredConversations = mockConversations;
    if (req.query.agentId) {
      filteredConversations = mockConversations.filter(conv => conv.agent_id === req.query.agentId);
    }

    // Filtrage par statut
    if (status) {
      filteredConversations = filteredConversations.filter(conv => conv.status === status);
    }

    // Filtrage par utilisateur
    if (userId) {
      filteredConversations = filteredConversations.filter(conv => conv.user_id === userId);
    }

    // Pagination
    const startIndex = (Number(page) - 1) * Number(limit);
    const endIndex = startIndex + Number(limit);
    const paginatedConversations = filteredConversations.slice(startIndex, endIndex);

    const response: APIResponse = {
      success: true,
      data: paginatedConversations,
      metadata: {
        timestamp: new Date(),
        request_id: (req as any).requestId,
        version: '1.0.0'
      }
    };

    (res as any).json(response);
  } catch (error) {
    logger.error('Error fetching conversations', {
      tenantId: (req as any).tenantId,
      userId: (req as any).userId,
      error: (error as Error).message
    });

    (res as any).status(500).json({
      success: false,
      error: {
        code: 'FETCH_CONVERSATIONS_ERROR',
        message: 'Failed to fetch conversations'
      }
    } as APIResponse);
  }
}));

// Récupération d'une conversation spécifique
router.get('/:id', authenticateToken, requirePermission('read'), asyncHandler(async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    // TODO: Implémenter la récupération depuis la base de données
    const mockConversation = {
      id: id,
      tenant_id: (req as any).tenantId!,
      agent_id: 'agent_1',
      user_id: (req as any).userId!,
      session_id: 'session_1',
      messages: [
        {
          id: 'msg_1',
          role: 'user',
          content: 'Bonjour, pouvez-vous m\'aider ?',
          timestamp: new Date(Date.now() - 300000)
        },
        {
          id: 'msg_2',
          role: 'assistant',
          content: 'Bonjour ! Bien sûr, je suis là pour vous aider. Que puis-je faire pour vous ?',
          timestamp: new Date(Date.now() - 240000)
        }
      ],
      context: {},
      status: 'active',
      created_at: new Date(Date.now() - 300000),
      updated_at: new Date(Date.now() - 240000),
      metadata: {
        user_agent: (req as any).get('User-Agent') || '',
        ip_address: (req as any).ip || '',
        referrer: (req as any).get('Referer')
      }
    };

    const response: APIResponse = {
      success: true,
      data: mockConversation
    };

    (res as any).json(response);
  } catch (error) {
    logger.error('Error fetching conversation', {
      conversationId: (req.params as any).id,
      tenantId: (req as any).tenantId,
      userId: (req as any).userId,
      error: (error as Error).message
    });

    (res as any).status(500).json({
      success: false,
      error: {
        code: 'FETCH_CONVERSATION_ERROR',
        message: 'Failed to fetch conversation'
      }
    } as APIResponse);
  }
}));

// Envoi d'un nouveau message
router.post('/:id/messages', authenticateToken, requirePermission('write'), asyncHandler(async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { message, agentId, sessionId, context }: NewMessageRequest = req.body as NewMessageRequest;

    if (!message || !agentId) {
      return (res as any).status(400).json({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Message and agentId are required'
        }
      } as APIResponse);
    }

    // TODO: Récupérer la conversation et l'agent depuis la base de données
    const mockConversation = {
      id: id,
      tenant_id: (req as any).tenantId!,
      agent_id: agentId,
      user_id: (req as any).userId!,
      session_id: sessionId || `session_${Date.now()}`,
      messages: [],
      context: context || {},
      status: 'active',
      created_at: new Date(),
      updated_at: new Date(),
      metadata: {
        user_agent: (req as any).get('User-Agent') || '',
        ip_address: (req as any).ip || '',
        referrer: (req as any).get('Referer')
      }
    };

    const mockAgent = {
      id: agentId,
      tenant_id: (req as any).tenantId!,
      name: 'Test Agent',
      description: 'Agent de test',
      status: 'active' as const,
      personality: {
        tone: 'professional' as const,
        expertise_level: 'intermediate' as const,
        proactivity: 50,
        response_style: 'conversational' as const
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
      },
      messages: []
    };

    // Ajout du message utilisateur
    const userMessage: Message = {
      id: `msg_${Date.now()}`,
      role: 'user',
      content: message,
      timestamp: new Date()
    };

    (mockConversation as any).messages.push(userMessage);

    // Génération de la réponse de l'agent
    const chatResult = await openaiService.chatWithAgent(
      mockAgent,
      mockConversation,
      message,
      (req as any).tenantId!
    );

    // Ajout de la réponse de l'agent
    const agentMessage: Message = {
      id: `msg_${Date.now() + 1}`,
      role: 'assistant',
      content: chatResult.response,
      timestamp: new Date(),
      metadata: {
        tokens_used: chatResult.tokensUsed,
        model_used: chatResult.model,
        processing_time: 1500,
        confidence_score: 0.95
      }
    };

    (mockConversation as any).messages.push(agentMessage);
    mockConversation.updated_at = new Date();

    logger.info('Message sent and response generated', {
      conversationId: id,
      agentId,
      tenantId: (req as any).tenantId,
      userId: (req as any).userId,
      tokensUsed: chatResult.tokensUsed,
      model: chatResult.model
    });

    const response: APIResponse = {
      success: true,
      data: {
        conversation: mockConversation,
        newMessage: agentMessage,
        tokensUsed: chatResult.tokensUsed,
        model: chatResult.model
      }
    };

    (res as any).json(response);
  } catch (error) {
    logger.error('Error sending message', {
      conversationId: (req.params as any).id,
      tenantId: (req as any).tenantId,
      userId: (req as any).userId,
      error: (error as Error).message
    });

    (res as any).status(500).json({
      success: false,
      error: {
        code: 'SEND_MESSAGE_ERROR',
        message: 'Failed to send message'
      }
    } as APIResponse);
  }
}));

// Mise à jour d'une conversation
router.put('/:id', authenticateToken, requirePermission('write'), asyncHandler(async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const updateData: UpdateConversationRequest = req.body;

    // TODO: Implémenter la mise à jour dans la base de données
    const updatedConversation = {
      id: id,
      tenant_id: (req as any).tenantId!,
      agent_id: 'agent_1',
      user_id: (req as any).userId!,
      session_id: 'session_1',
      messages: [],
      context: updateData.context || {},
      status: updateData.status || 'active',
      created_at: new Date(),
      updated_at: new Date(),
      metadata: {
        user_agent: (req as any).get('User-Agent') || '',
        ip_address: (req as any).ip || '',
        referrer: (req as any).get('Referer')
      }
    };

    logger.info('Conversation updated', {
      conversationId: id,
      tenantId: (req as any).tenantId,
      userId: (req as any).userId,
      updates: Object.keys(updateData)
    });

    const response: APIResponse = {
      success: true,
      data: updatedConversation
    };

    (res as any).json(response);
  } catch (error) {
    logger.error('Error updating conversation', {
      conversationId: (req.params as any).id,
      tenantId: (req as any).tenantId,
      userId: (req as any).userId,
      error: (error as Error).message
    });

    (res as any).status(500).json({
      success: false,
      error: {
        code: 'UPDATE_CONVERSATION_ERROR',
        message: 'Failed to update conversation'
      }
    } as APIResponse);
  }
}));

// Suppression d'une conversation
router.delete('/:id', authenticateToken, requirePermission('admin'), asyncHandler(async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    // TODO: Implémenter la suppression dans la base de données
    logger.info('Conversation deleted', {
      conversationId: id,
      tenantId: (req as any).tenantId,
      userId: (req as any).userId
    });

    const response: APIResponse = {
      success: true,
      data: {
        message: 'Conversation deleted successfully'
      }
    };

    (res as any).json(response);
  } catch (error) {
    logger.error('Error deleting conversation', {
      conversationId: (req.params as any).id,
      tenantId: (req as any).tenantId,
      userId: (req as any).userId,
      error: (error as Error).message
    });

    (res as any).status(500).json({
      success: false,
      error: {
        code: 'DELETE_CONVERSATION_ERROR',
        message: 'Failed to delete conversation'
      }
    } as APIResponse);
  }
}));

// Export des conversations
router.get('/:id/export', authenticateToken, requirePermission('read'), asyncHandler(async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { format = 'json' } = req.query;

    // TODO: Récupérer la conversation depuis la base de données
    const mockConversation = {
      id: id,
      tenant_id: (req as any).tenantId!,
      agent_id: 'agent_1',
      user_id: (req as any).userId!,
      session_id: 'session_1',
      messages: [
        {
          id: 'msg_1',
          role: 'user',
          content: 'Bonjour, pouvez-vous m\'aider ?',
          timestamp: new Date(Date.now() - 300000)
        },
        {
          id: 'msg_2',
          role: 'assistant',
          content: 'Bonjour ! Bien sûr, je suis là pour vous aider. Que puis-je faire pour vous ?',
          timestamp: new Date(Date.now() - 240000)
        }
      ],
      context: {},
      status: 'active',
      created_at: new Date(Date.now() - 300000),
      updated_at: new Date(Date.now() - 240000),
      metadata: {
        user_agent: (req as any).get('User-Agent') || '',
        ip_address: (req as any).ip || '',
        referrer: (req as any).get('Referer')
      }
    };

    if (format === 'csv') {
      // Export CSV
      const csvData = mockConversation.messages.map(msg => ({
        timestamp: msg.timestamp.toISOString(),
        role: msg.role,
        content: msg.content
      }));

      (res as any).setHeader('Content-Type', 'text/csv');
      (res as any).setHeader('Content-Disposition', `attachment; filename="conversation_${id}.csv"`);
      (res as any).send(csvData);
    } else {
      // Export JSON
      const response: APIResponse = {
        success: true,
        data: mockConversation
      };

      (res as any).json(response);
    }
  } catch (error) {
    logger.error('Error exporting conversation', {
      conversationId: (req.params as any).id,
      tenantId: (req as any).tenantId,
      userId: (req as any).userId,
      error: (error as Error).message
    });

    (res as any).status(500).json({
      success: false,
      error: {
        code: 'EXPORT_CONVERSATION_ERROR',
        message: 'Failed to export conversation'
      }
    } as APIResponse);
  }
}));

// Analytics des conversations
router.get('/:id/analytics', authenticateToken, requirePermission('read'), asyncHandler(async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { period = '7d' } = req.query;

    // TODO: Implémenter les analytics
    const analytics = {
      conversationId: id,
      period: period,
      metrics: {
        totalMessages: 10,
        avgResponseTime: 2.5,
        userSatisfactionScore: 4.2,
        mostUsedFeatures: ['support', 'information'],
        errorRate: 0.05,
        costPerMessage: 0.02
      },
      generatedAt: new Date()
    };

    const response: APIResponse = {
      success: true,
      data: analytics
    };

    (res as any).json(response);
  } catch (error) {
    logger.error('Error fetching conversation analytics', {
      conversationId: (req.params as any).id,
      tenantId: (req as any).tenantId,
      userId: (req as any).userId,
      error: (error as Error).message
    });

    (res as any).status(500).json({
      success: false,
      error: {
        code: 'CONVERSATION_ANALYTICS_ERROR',
        message: 'Failed to fetch conversation analytics'
      }
    } as APIResponse);
  }
}));

export default router;




