import OpenAI from 'openai';
import { HybridAgentService } from './HybridAgentService';
import TestDeploymentService from './TestDeploymentService';
import AdvancedPromptService from './AdvancedPromptService';
import { Agent } from '../firebase-models';

export interface AgentGenerationRequest {
  businessType: string;
  name: string;
  objectives: string;
  features?: string[];
  personality?: string;
  userId: string;
  conversationId?: string;
}

export interface AgentGenerationResponse {
  success: boolean;
  agent?: Agent;
  error?: string;
}

export class AgentGenerationService {
  private static instance: AgentGenerationService;
  private openai: OpenAI;
  private agentService: HybridAgentService;

  private constructor() {
    this.openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    });
    this.agentService = HybridAgentService.getInstance();
  }

  public static getInstance(): AgentGenerationService {
    if (!AgentGenerationService.instance) {
      AgentGenerationService.instance = new AgentGenerationService();
    }
    return AgentGenerationService.instance;
  }

  /**
   * Générer un agent IA personnalisé
   */
  async generateAgent(request: AgentGenerationRequest): Promise<AgentGenerationResponse> {
    try {
      console.log('Génération d\'agent pour:', request.name);

      // 1. Générer un prompt système avancé et personnalisé
      const systemPrompt = await this.generateAdvancedSystemPrompt(request);

      // 2. Créer l'agent dans Firebase
      const agentData: Partial<Agent> = {
        name: request.name,
        description: `Agent IA spécialisé pour ${request.businessType}`,
        system_prompt: systemPrompt,
        personality: {
          tone: 'professionnel' as const,
          expertise_level: 'expert' as const,
          response_style: 'détaillé' as const,
          communication_style: typeof request.personality === 'string' ? request.personality : 'Professionnel et utile',
        },
        capabilities: request.features || this.getDefaultCapabilities(request.businessType),
        integrations: [],
        knowledge_base: {
          documents: [],
          embeddings_id: '',
          last_updated: new Date(),
        },
        version: '1.0.0',
        created_at: new Date(),
        updated_at: new Date(),
        created_by: request.userId,
        usage_stats: {
          total_conversations: 0,
          total_messages: 0,
          last_used: new Date(),
          avg_response_time: 0,
        },
        status: 'draft' as const,
        deployments: {
          web: false,
          iframe: false,
          api: false,
        },
      };

      const createdAgent = await this.agentService.createAgent(agentData);

      // Synchroniser avec le service de test pour le déploiement
      try {
        TestDeploymentService.addAgent(createdAgent);
        console.log('Agent synchronisé avec TestDeploymentService:', createdAgent.id);
      } catch (error) {
        console.warn('Erreur synchronisation TestDeploymentService:', error);
      }

      return {
        success: true,
        agent: createdAgent,
      };
    } catch (error) {
      console.error('Erreur lors de la génération d\'agent:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Erreur inconnue',
      };
    }
  }

  /**
   * Générer un prompt système avancé et personnalisé
   */
  private async generateAdvancedSystemPrompt(request: AgentGenerationRequest): Promise<string> {
    try {
      // Utiliser le service de prompts avancés pour une personnalisation maximale
      const advancedPrompt = await AdvancedPromptService.generateAdvancedPrompt({
        businessType: request.businessType,
        name: request.name,
        objectives: request.objectives,
        personality: request.personality || 'Professionnel et utile',
        features: request.features,
        specialties: this.getDefaultCapabilities(request.businessType),
        integrations: []
      });

      console.log('✅ Prompt avancé généré avec succès');
      return advancedPrompt;
    } catch (error) {
      console.error('❌ Erreur génération prompt avancé, fallback vers méthode standard:', error);
      return this.generateSystemPrompt(request);
    }
  }

  /**
   * Générer le prompt système avec OpenAI (méthode de fallback)
   */
  private async generateSystemPrompt(request: AgentGenerationRequest): Promise<string> {
    const prompt = `Tu es un expert en création d'agents IA. Crée un prompt système détaillé pour un agent IA spécialisé dans le domaine "${request.businessType}".

CONTEXTE:
- Nom de l'agent: ${request.name}
- Type de business: ${request.businessType}
- Objectifs: ${request.objectives}
- Personnalité: ${request.personality || 'Professionnel et utile'}
- Fonctionnalités: ${request.features?.join(', ') || 'Support client général'}

REQUIS:
1. Le prompt doit être en français
2. L'agent doit être spécialisé dans le domaine spécifié
3. L'agent doit être professionnel et utile
4. L'agent doit pouvoir répondre aux questions spécifiques du secteur
5. L'agent doit proposer des solutions concrètes
6. Maximum 500 mots

Génère uniquement le prompt système, sans explications supplémentaires.`;

    try {
      const completion = await this.openai.chat.completions.create({
        model: 'gpt-4',
        messages: [
          { role: 'system', content: 'Tu es un expert en création d\'agents IA. Réponds uniquement avec le prompt système demandé.' },
          { role: 'user', content: prompt }
        ],
        max_tokens: 800,
        temperature: 0.7,
      });

      return completion.choices[0].message?.content || this.getDefaultSystemPrompt(request);
    } catch (error) {
      console.error('Erreur OpenAI, utilisation du prompt par défaut:', error);
      return this.getDefaultSystemPrompt(request);
    }
  }

  /**
   * Prompt système par défaut en cas d'erreur OpenAI
   */
  private getDefaultSystemPrompt(request: AgentGenerationRequest): string {
    return `Tu es ${request.name}, un assistant IA spécialisé dans le domaine ${request.businessType}.

TON RÔLE:
- Tu es un expert dans le domaine ${request.businessType}
- Tu aides les clients avec leurs questions et besoins spécifiques
- Tu fournis des réponses professionnelles et utiles
- Tu proposes des solutions concrètes et pratiques

OBJECTIFS:
${request.objectives}

PERSONNALITÉ:
- Ton: ${request.personality || 'Professionnel, utile et bienveillant'}
- Style: Expert et détaillé
- Communication: Chaleureux et professionnel

FONCTIONNALITÉS:
${request.features?.join(', ') || 'Support client, conseils, assistance'}

INSTRUCTIONS:
1. Réponds toujours en français
2. Sois précis et professionnel
3. Propose des solutions concrètes
4. Si tu ne sais pas quelque chose, dis-le honnêtement
5. Guide l'utilisateur vers les bonnes ressources

Tu es prêt à aider ! Comment puis-je vous assister aujourd'hui ?`;
  }

  /**
   * Obtenir les capacités par défaut selon le type de business
   */
  private getDefaultCapabilities(businessType: string): string[] {
    const capabilitiesMap: Record<string, string[]> = {
      'restaurant': ['Prise de réservation', 'Menu et plats', 'Horaires et localisation', 'Événements spéciaux'],
      'ecommerce': ['Produits et commandes', 'Livraison', 'Retours et échanges', 'Support technique'],
      'santé': ['Rendez-vous', 'Services médicaux', 'Urgences', 'Informations pratiques'],
      'éducation': ['Cours et formations', 'Inscriptions', 'Programmes', 'Support étudiant'],
      'immobilier': ['Biens disponibles', 'Visites', 'Financement', 'Conseils'],
      'finance': ['Produits financiers', 'Conseils', 'Support client', 'Sécurité'],
      'technologie': ['Support technique', 'Produits', 'Formation', 'Intégration'],
      'default': ['Support client', 'Informations générales', 'Conseils', 'Assistance']
    };

    return capabilitiesMap[businessType.toLowerCase()] || capabilitiesMap.default;
  }

  /**
   * Améliorer un agent existant
   */
  async improveAgent(agentId: string, improvements: string[]): Promise<AgentGenerationResponse> {
    try {
      const existingAgent = await this.agentService.getAgentById(agentId);
      if (!existingAgent) {
        return { success: false, error: 'Agent non trouvé' };
      }

      const improvementPrompt = `Améliore le prompt système suivant en intégrant ces améliorations: ${improvements.join(', ')}

PROMPT ACTUEL:
${existingAgent.system_prompt}

Génère un nouveau prompt amélioré en français, maximum 500 mots.`;

      const completion = await this.openai.chat.completions.create({
        model: 'gpt-4',
        messages: [
          { role: 'system', content: 'Tu es un expert en amélioration d\'agents IA. Réponds uniquement avec le prompt amélioré.' },
          { role: 'user', content: improvementPrompt }
        ],
        max_tokens: 800,
        temperature: 0.7,
      });

      const improvedPrompt = completion.choices[0].message?.content || existingAgent.system_prompt;

      const updatedAgent = await this.agentService.updateAgent(agentId, {
        system_prompt: improvedPrompt,
        updated_at: new Date(),
      });

      return {
        success: true,
        agent: updatedAgent,
      };
    } catch (error) {
      console.error('Erreur lors de l\'amélioration d\'agent:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Erreur inconnue',
      };
    }
  }
}

export const agentGenerationService = AgentGenerationService.getInstance();




