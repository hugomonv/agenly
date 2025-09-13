import OpenAI from 'openai';
// import { GenerateAgentRequest } from '@/types';
import { Agent } from '@/types';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export class OpenAIService {
  private static instance: OpenAIService;

  public static getInstance(): OpenAIService {
    if (!OpenAIService.instance) {
      OpenAIService.instance = new OpenAIService();
    }
    return OpenAIService.instance;
  }

  async generateAgent(request: any): Promise<Partial<Agent>> {
    try {
      const systemPrompt = `Tu es un expert en création d'agents IA personnalisés. 
      Crée un agent IA complet basé sur les informations fournies.
      
      Type d'entreprise: ${request.businessType}
      Nom: ${request.name}
      Objectifs: ${request.objectives}
      Fonctionnalités: ${request.features.join(', ')}
      Personnalité: ${request.personality}
      
      Retourne une réponse JSON avec les champs suivants:
      - name: nom de l'agent
      - description: description détaillée
      - prompt: prompt système complet
      - instructions: instructions personnalisées
      - capabilities: tableau des capacités
      - metadata.systemPrompt: prompt système optimisé
      - metadata.customInstructions: instructions personnalisées
      - metadata.tags: tags pertinents
      - metadata.category: catégorie de l'agent`;

      const completion = await openai.chat.completions.create({
        model: 'gpt-4',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: `Crée un agent IA pour ${request.name}` }
        ],
        temperature: 0.7,
        max_tokens: 2048,
      });

      const response = completion.choices[0]?.message?.content;
      if (!response) {
        throw new Error('No response from OpenAI');
      }

      // Parse JSON response
      const agentData = JSON.parse(response);
      
      return {
        name: agentData.name || request.name,
        description: agentData.description || `Agent IA pour ${request.businessType}`,
        system_prompt: agentData.system_prompt || agentData.metadata?.systemPrompt || '',
        capabilities: agentData.capabilities || [],
        personality: {
          tone: 'professional' as const,
          expertise_level: 'intermediate' as const,
          proactivity: 50,
          response_style: 'conversational' as const,
        },
        integrations: [],
        knowledge_base: {
          documents: [],
          embeddings_id: '',
          last_updated: new Date(),
        },
        version: '1.0.0',
        created_at: new Date(),
        updated_at: new Date(),
        created_by: request.userId || 'system',
        usage_stats: {
          total_conversations: 0,
          total_messages: 0,
          last_used: new Date(),
          avg_response_time: 0,
        },
        status: 'active',
        deployments: {
          web: false,
          iframe: false,
          api: false,
        },
      } as Partial<Agent>;
    } catch (error) {
      console.error('Error generating agent:', error);
      throw new Error('Failed to generate agent');
    }
  }

  async chatCompletion(messages: Array<{ role: string; content: string }>, options?: {
    model?: string;
    temperature?: number;
    maxTokens?: number;
  }): Promise<string> {
    try {
      const completion = await openai.chat.completions.create({
        model: options?.model || 'gpt-4',
        messages: messages as any,
        temperature: options?.temperature || 0.7,
        max_tokens: options?.maxTokens || 2048,
      });

      return completion.choices[0]?.message?.content || '';
    } catch (error) {
      console.error('Error in chat completion:', error);
      throw new Error('Failed to get chat completion');
    }
  }

  async generateResponse(
    userMessage: string,
    systemPrompt: string,
    conversationHistory: Array<{ role: string; content: string }> = []
  ): Promise<string> {
    try {
      const messages = [
        { role: 'system', content: systemPrompt },
        ...conversationHistory,
        { role: 'user', content: userMessage }
      ];

      return await this.chatCompletion(messages);
    } catch (error) {
      console.error('Error generating response:', error);
      throw new Error('Failed to generate response');
    }
  }

  /**
   * Méthode generateCompletion pour compatibilité avec les nouveaux services
   */
  async generateCompletion(messages: Array<{ role: string; content: string }>, options?: {
    model?: string;
    temperature?: number;
    max_tokens?: number;
  }): Promise<string> {
    try {
      const completion = await openai.chat.completions.create({
        model: options?.model || 'gpt-4',
        messages: messages as any,
        temperature: options?.temperature || 0.7,
        max_tokens: options?.max_tokens || 2048,
      });

      return completion.choices[0]?.message?.content || '';
    } catch (error) {
      console.error('Error in generateCompletion:', error);
      throw new Error('Failed to get completion');
    }
  }
}

export default OpenAIService.getInstance();




