import { ConversationService } from './ConversationService';
import { AgentService } from './AgentService';
import { OpenAIService } from './OpenAIService';
import { ChatRequest, ChatResponse, Agent } from '@/types';

export class EnhancedConversationService {
  private static instance: EnhancedConversationService;
  private conversationService: ConversationService;
  private agentService: AgentService;
  private openaiService: OpenAIService;

  public static getInstance(): EnhancedConversationService {
    if (!EnhancedConversationService.instance) {
      EnhancedConversationService.instance = new EnhancedConversationService();
    }
    return EnhancedConversationService.instance;
  }

  constructor() {
    this.conversationService = ConversationService.getInstance();
    this.agentService = AgentService.getInstance();
    this.openaiService = OpenAIService.getInstance();
  }

  async processChatRequest(request: ChatRequest): Promise<ChatResponse> {
    try {
      let conversationId = request.conversationId;
      let agent: Agent | null = null;

      // Get or create conversation
      if (!conversationId) {
        const conversation = await this.conversationService.createConversation(
          request.userId,
          request.agentId
        );
        conversationId = conversation.id;
      }

      // Get agent if specified
      if (request.agentId) {
        agent = await this.agentService.getAgent(request.agentId);
      }

      // Add user message to conversation
      await this.conversationService.addMessage(conversationId, {
        role: 'user',
        content: request.message,
        timestamp: new Date(),
      });

      // Generate AI response
      const aiResponse = await this.generateAIResponse(
        request.message,
        conversationId,
        agent
      );

      // Add AI response to conversation
      await this.conversationService.addMessage(conversationId, {
        role: 'assistant',
        content: aiResponse.message,
        timestamp: new Date(),
        metadata: {
          model: agent?.model || 'gpt-4',
          temperature: agent?.temperature || 0.7,
        },
      });

      // Check if we should generate an agent
      const shouldGenerateAgent = await this.shouldGenerateAgent(request.message, agent);

      return {
        message: aiResponse.message,
        nextStep: aiResponse.nextStep,
        agentData: shouldGenerateAgent ? await this.generateAgentFromConversation(conversationId) : undefined,
        shouldGenerateAgent,
        conversationId,
      };
    } catch (error) {
      console.error('Error processing chat request:', error);
      throw new Error('Failed to process chat request');
    }
  }

  private async generateAIResponse(
    userMessage: string,
    conversationId: string,
    agent?: Agent | null
  ): Promise<{ message: string; nextStep?: string }> {
    try {
      // Get conversation history
      const messages = await this.conversationService.getConversationMessages(conversationId);
      const conversationHistory = messages.slice(-10).map(msg => ({
        role: msg.role,
        content: msg.content,
      }));

      // Determine system prompt
      let systemPrompt = 'Tu es un assistant IA intelligent et utile.';
      if (agent) {
        systemPrompt = agent.prompt || agent.metadata.systemPrompt;
        if (agent.instructions) {
          systemPrompt += `\n\nInstructions spécifiques: ${agent.instructions}`;
        }
      }

      // Generate response
      const response = await this.openaiService.generateResponse(
        userMessage,
        systemPrompt,
        conversationHistory
      );

      // Determine next step
      const nextStep = this.determineNextStep(userMessage, response, agent);

      return { message: response, nextStep };
    } catch (error) {
      console.error('Error generating AI response:', error);
      return { 
        message: 'Désolé, je rencontre un problème technique. Pouvez-vous réessayer ?' 
      };
    }
  }

  private determineNextStep(
    userMessage: string,
    aiResponse: string,
    agent?: Agent | null
  ): string | undefined {
    const message = userMessage.toLowerCase();
    const response = aiResponse.toLowerCase();

    // Check for agent creation intent
    if (message.includes('créer') && message.includes('agent') ||
        message.includes('nouveau') && message.includes('assistant') ||
        response.includes('créer un agent')) {
      return 'create_agent';
    }

    // Check for integration intent
    if (message.includes('connecter') || message.includes('intégrer') ||
        message.includes('google') || message.includes('calendar') ||
        message.includes('gmail') || message.includes('drive')) {
      return 'connect_integration';
    }

    // Check for deployment intent
    if (message.includes('déployer') || message.includes('publier') ||
        message.includes('partager') || message.includes('embed')) {
      return 'deploy_agent';
    }

    return undefined;
  }

  private async shouldGenerateAgent(userMessage: string, agent?: Agent | null): Promise<boolean> {
    if (agent) return false; // Already has an agent

    const message = userMessage.toLowerCase();
    return message.includes('créer') && message.includes('agent') ||
           message.includes('nouveau') && message.includes('assistant') ||
           message.includes('personnaliser') && message.includes('aide');
  }

  private async generateAgentFromConversation(conversationId: string): Promise<Partial<Agent>> {
    try {
      const conversation = await this.conversationService.getConversation(conversationId);
      if (!conversation) {
        throw new Error('Conversation not found');
      }

      // Extract business context from conversation
      const messages = conversation.messages;
      const userMessages = messages.filter(msg => msg.role === 'user');
      const context = userMessages.map(msg => msg.content).join(' ');

      // Generate agent based on conversation context
      const agentData = await this.openaiService.generateAgent({
        businessType: 'Personnalisé',
        name: 'Agent IA Personnalisé',
        objectives: 'Assister l\'utilisateur selon ses besoins spécifiques',
        features: ['Chat intelligent', 'Réponses personnalisées', 'Contexte conversationnel'],
        personality: 'Professionnel et utile',
        userId: conversation.userId,
        conversationId: conversationId,
      });

      return agentData;
    } catch (error) {
      console.error('Error generating agent from conversation:', error);
      return {};
    }
  }

  async getConversationContext(conversationId: string): Promise<{
    messages: any[];
    agent?: Agent | null;
    summary?: string;
  }> {
    try {
      const conversation = await this.conversationService.getConversation(conversationId);
      if (!conversation) {
        throw new Error('Conversation not found');
      }

      let agent: Agent | null = null;
      if (conversation.agentId) {
        agent = await this.agentService.getAgent(conversation.agentId);
      }

      // Generate conversation summary
      const summary = await this.generateConversationSummary(conversation.messages);

      return {
        messages: conversation.messages,
        agent,
        summary,
      };
    } catch (error) {
      console.error('Error getting conversation context:', error);
      throw new Error('Failed to get conversation context');
    }
  }

  private async generateConversationSummary(messages: any[]): Promise<string> {
    try {
      if (messages.length === 0) return 'Conversation vide';

      const messageTexts = messages.map(msg => `${msg.role}: ${msg.content}`).join('\n');
      
      const summary = await this.openaiService.chatCompletion([
        { role: 'system', content: 'Résume cette conversation en 1-2 phrases.' },
        { role: 'user', content: messageTexts }
      ], { maxTokens: 100 });

      return summary;
    } catch (error) {
      console.error('Error generating conversation summary:', error);
      return 'Résumé non disponible';
    }
  }
}

export default EnhancedConversationService.getInstance();
