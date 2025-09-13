import OpenAI from 'openai';
import { config } from '../../config/environment';
import { logger } from '../../utils/logger';
import { Agent, Conversation } from '../../types';

// Configuration OpenAI
const openai = new OpenAI({
  apiKey: config.openai.apiKey,
  organization: config.openai.organization,
  timeout: config.openai.limits.timeout,
});

export class OpenAIService {
  private static instance: OpenAIService;
  
  private requestCounts: Map<string, { count: number; resetTime: number }> = new Map();

  private constructor() {}

  public static getInstance(): OpenAIService {
    if (!OpenAIService.instance) {
      OpenAIService.instance = new OpenAIService();
    }
    return OpenAIService.instance;
  }

  // Génération d'un agent personnalisé
  public async generateAgent(
    requirements: {
      businessType: string;
      useCases: string[];
      targetAudience: string;
      keyFeatures: string[];
      integrations?: string[];
    },
    tenantId: string
  ): Promise<Partial<Agent>> {
    try {
      const systemPrompt = this.buildAgentGenerationPrompt();
      const userPrompt = this.buildAgentRequirementsPrompt(requirements);

      const completion = await openai.chat.completions.create({
        model: config.openai.models.chat,
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt }
        ],
        max_tokens: config.openai.limits.maxTokens,
        temperature: config.openai.limits.temperature,
        response_format: { type: 'json_object' }
      });

      const response = completion.choices[0]?.message?.content;
      if (!response) {
        throw new Error('No response from OpenAI');
      }

      const agentConfig = JSON.parse(response);
      
      // Validation et enrichissement de la configuration
      const validatedConfig = this.validateAgentConfig(agentConfig, requirements);
      
      // Log de la génération
      logger.info('Agent generated successfully', {
        tenantId,
        agentName: validatedConfig.name,
        tokensUsed: completion.usage?.total_tokens,
        model: config.openai.models.chat,
      });

      return validatedConfig;
    } catch (error) {
      logger.error('Error generating agent', {
        tenantId,
        error: (error as Error).message,
        requirements,
      });
      throw new Error(`Failed to generate agent: ${(error as Error).message}`);
    }
  }

  // Chat avec un agent spécifique
  public async chatWithAgent(
    agent: any,
    conversation: any,
    newMessage: string,
    tenantId: string
  ): Promise<{ response: string; tokensUsed: number; model: string }> {
    try {
      // Construction du contexte de conversation
      const messages = this.buildConversationContext(agent, conversation, newMessage);

      const completion = await openai.chat.completions.create({
        model: agent.personality.expertise_level === 'expert' 
          ? config.openai.models.chat 
          : config.openai.models.chatMini,
        messages,
        max_tokens: config.openai.limits.maxTokens,
        temperature: this.getTemperatureForPersonality(agent.personality.tone),
        presence_penalty: 0.1,
        frequency_penalty: 0.1,
      });

      const response = completion.choices[0]?.message?.content;
      if (!response) {
        throw new Error('No response from OpenAI');
      }

      const tokensUsed = completion.usage?.total_tokens || 0;
      const model = completion.model;

      // Log de la conversation
      logger.info('Agent chat completed', {
        tenantId,
        agentId: agent.id,
        tokensUsed,
        model,
        responseLength: response.length,
      });

      return { response, tokensUsed, model };
    } catch (error) {
      logger.error('Error in agent chat', {
        tenantId,
        agentId: agent.id,
        error: (error as Error).message,
      });
      throw new Error(`Failed to process chat: ${(error as Error).message}`);
    }
  }

  // Génération d'embeddings pour la base de connaissances
  public async generateEmbeddings(
    texts: string[],
    tenantId: string
  ): Promise<{ embeddings: number[][]; tokensUsed: number }> {
    try {
      const response = await openai.embeddings.create({
        model: config.openai.models.embedding,
        input: texts,
        encoding_format: 'float',
      });

      const embeddings = response.data.map(item => item.embedding);
      const tokensUsed = response.usage.total_tokens;

      logger.info('Embeddings generated', {
        tenantId,
        textCount: texts.length,
        tokensUsed,
        model: config.openai.models.embedding,
      });

      return { embeddings, tokensUsed };
    } catch (error) {
      logger.error('Error generating embeddings', {
        tenantId,
        error: (error as Error).message,
        textCount: texts.length,
      });
      throw new Error(`Failed to generate embeddings: ${(error as Error).message}`);
    }
  }

  // Analyse de sentiment et classification
  public async analyzeText(
    text: string,
    analysisType: 'sentiment' | 'intent' | 'classification',
    tenantId: string
  ): Promise<{ result: any; tokensUsed: number }> {
    try {
      const systemPrompt = this.buildAnalysisPrompt(analysisType);
      
      const completion = await openai.chat.completions.create({
        model: config.openai.models.chatMini,
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: text }
        ],
        max_tokens: 500,
        temperature: 0.1,
        response_format: { type: 'json_object' }
      });

      const response = completion.choices[0]?.message?.content;
      if (!response) {
        throw new Error('No response from OpenAI');
      }

      const result = JSON.parse(response);
      const tokensUsed = completion.usage?.total_tokens || 0;

      logger.info('Text analysis completed', {
        tenantId,
        analysisType,
        tokensUsed,
        textLength: text.length,
      });

      return { result, tokensUsed };
    } catch (error) {
      logger.error('Error analyzing text', {
        tenantId,
        analysisType,
        error: (error as Error).message,
      });
      throw new Error(`Failed to analyze text: ${(error as Error).message}`);
    }
  }

  // Construction du prompt système pour la génération d'agents
  private buildAgentGenerationPrompt(): string {
    return `You are an expert AI agent architect. Your task is to create a comprehensive agent configuration based on user requirements.

Return a JSON object with the following structure:
{
  "name": "Agent name (descriptive and professional)",
  "description": "Clear description of the agent's purpose and capabilities",
  "personality": {
    "tone": "professional|friendly|casual|formal",
    "expertise_level": "beginner|intermediate|expert",
    "proactivity": 0-100,
    "response_style": "concise|detailed|conversational"
  },
  "capabilities": ["array of specific capabilities"],
  "system_prompt": "Detailed system prompt for the agent",
  "suggested_integrations": ["array of suggested integrations"],
  "knowledge_areas": ["array of knowledge areas"],
  "conversation_starters": ["array of conversation starter examples"]
}

Guidelines:
- Make the agent highly specialized for the specific business use case
- Ensure the system prompt is comprehensive and includes role, context, and behavior guidelines
- Suggest relevant integrations based on the business type
- Make capabilities specific and actionable
- Set appropriate personality traits based on the target audience
- Include conversation starters that demonstrate the agent's value`;
  }

  // Construction du prompt utilisateur pour les exigences
  private buildAgentRequirementsPrompt(requirements: any): string {
    return `Create an AI agent with the following requirements:

Business Type: ${requirements.businessType}
Use Cases: ${requirements.useCases.join(', ')}
Target Audience: ${requirements.targetAudience}
Key Features: ${requirements.keyFeatures.join(', ')}
${requirements.integrations ? `Required Integrations: ${requirements.integrations.join(', ')}` : ''}

Please create a comprehensive agent configuration that addresses these specific needs.`;
  }

  // Construction du contexte de conversation
  private buildConversationContext(agent: any, conversation: any, newMessage: string): any[] {
    const messages: any[] = [
      { role: 'system', content: agent.system_prompt }
    ];

    // Ajout des messages précédents (limité aux 10 derniers pour éviter les limites de tokens)
    const recentMessages = conversation.messages.slice(-10);
    for (const message of recentMessages) {
      messages.push({
        role: message.role,
        content: message.content
      });
    }

    // Ajout du nouveau message
    messages.push({
      role: 'user',
      content: newMessage
    });

    return messages;
  }

  // Validation de la configuration d'agent
  private validateAgentConfig(config: any, _requirements: any): Partial<Agent> {
    const validated: any = {
      name: config.name || 'Unnamed Agent',
      description: config.description || 'AI agent',
      personality: {
        tone: config.personality?.tone || 'professional',
        expertise_level: config.personality?.expertise_level || 'intermediate',
        proactivity: Math.max(0, Math.min(100, config.personality?.proactivity || 50)),
        response_style: config.personality?.response_style || 'conversational'
      },
      capabilities: Array.isArray(config.capabilities) ? config.capabilities : [],
      system_prompt: (config as any).system_prompt || 'You are a helpful AI assistant.',
      integrations: [],
      knowledge_base: {
        documents: [],
        embeddings_id: '',
        last_updated: new Date()
      },
      version: '1.0.0',
      created_at: new Date(),
      updated_at: new Date(),
      created_by: 'system',
      usage_stats: {
        total_conversations: 0,
        total_messages: 0,
        last_used: new Date(),
        avg_response_time: 0
      }
    };

    return validated;
  }

  // Obtention de la température basée sur la personnalité
  private getTemperatureForPersonality(tone: string): number {
    switch (tone) {
      case 'formal': return 0.3;
      case 'professional': return 0.5;
      case 'friendly': return 0.7;
      case 'casual': return 0.8;
      default: return 0.5;
    }
  }

  // Construction du prompt d'analyse
  private buildAnalysisPrompt(analysisType: string): string {
    const prompts = {
      sentiment: `Analyze the sentiment of the given text. Return a JSON object with:
      - sentiment: "positive", "negative", or "neutral"
      - confidence: 0-1
      - emotions: array of detected emotions
      - explanation: brief explanation`,
      
      intent: `Analyze the intent of the given text. Return a JSON object with:
      - intent: the main intent (e.g., "question", "request", "complaint", "compliment")
      - confidence: 0-1
      - entities: array of extracted entities
      - explanation: brief explanation`,
      
      classification: `Classify the given text into categories. Return a JSON object with:
      - category: the main category
      - subcategory: optional subcategory
      - confidence: 0-1
      - tags: array of relevant tags
      - explanation: brief explanation`
    };

    return (prompts as any)[analysisType] || prompts.classification;
  }

  // Gestion du rate limiting
  

  // Nettoyage des compteurs de rate limiting
  public cleanupRateLimitCounters(): void {
    const now = Date.now();
    for (const [tenantId, limit] of Array.from(this.requestCounts.entries())) {
      if (now > limit.resetTime) {
        this.requestCounts.delete(tenantId);
      }
    }
  }
}

export default OpenAIService;




