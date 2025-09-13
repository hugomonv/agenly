import { OpenAIService } from '../../services/openai-service/OpenAIService';
import { logger } from '../../utils/logger';
import { MasterAgentSession, Agent, Tenant } from '../../types';

// Interface pour les exigences découvertes
interface DiscoveredRequirements {
  businessType: string;
  useCases: string[];
  targetAudience: string;
  keyFeatures: string[];
  integrations: string[];
  priority: 'low' | 'medium' | 'high';
  complexity: 'simple' | 'moderate' | 'complex';
  estimatedSetupTime: number; // en minutes
}

// Interface pour les questions de découverte
interface DiscoveryQuestion {
  id: string;
  question: string;
  type: 'multiple_choice' | 'text' | 'rating' | 'boolean';
  options?: string[];
  required: boolean;
  followUpQuestions?: string[];
  category: 'business' | 'technical' | 'preferences';
}

export class MasterAgent {
  private openaiService: OpenAIService;
  private discoveryQuestions: DiscoveryQuestion[];
  private currentSession: MasterAgentSession | null = null;

  constructor() {
    this.openaiService = OpenAIService.getInstance();
    this.discoveryQuestions = this.initializeDiscoveryQuestions();
  }

  // Démarrage d'une nouvelle session de création d'agent
  public async startAgentCreationSession(
    tenantId: string,
    userId: string,
    initialMessage: string
  ): Promise<MasterAgentSession> {
    try {
      // Analyse du message initial pour extraire les premières exigences
      const initialAnalysis = await this.analyzeInitialMessage(initialMessage);
      
      // Création de la session
      this.currentSession = {
        id: `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        tenant_id: tenantId,
        user_id: userId,
        status: 'discovery',
        current_step: 1,
        total_steps: 8,
        discovered_requirements: {
          business_type: initialAnalysis.businessType || '',
          use_cases: initialAnalysis.useCases || [],
          integrations_needed: initialAnalysis.integrations || [],
          target_audience: initialAnalysis.targetAudience || '',
          key_features: initialAnalysis.keyFeatures || []
        },
        generated_agent_config: {},
        test_results: {
          functionality_score: 0,
          integration_score: 0,
          user_satisfaction_score: 0,
          issues_found: []
        },
        created_at: new Date(),
        updated_at: new Date()
      };

      logger.info('Master agent session started', {
        sessionId: this.currentSession.id,
        tenantId,
        userId,
        initialAnalysis
      });

      return this.currentSession;
    } catch (error) {
      logger.error('Error starting master agent session', {
        tenantId,
        userId,
        error: error instanceof Error ? error.message : 'Unknown error'
      });
      throw new Error(`Failed to start agent creation session: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  // Traitement d'une réponse utilisateur
  public async processUserResponse(
    sessionId: string,
    userResponse: string
  ): Promise<{
    nextQuestion?: string;
    session: MasterAgentSession;
    isComplete: boolean;
    generatedAgent?: Partial<Agent>;
  }> {
    try {
      if (!this.currentSession || this.currentSession.id !== sessionId) {
        throw new Error('Session not found');
      }

      // Mise à jour des exigences basée sur la réponse
      await this.updateRequirementsFromResponse(userResponse);
      
      // Détermination de la prochaine étape
      const nextStep = this.determineNextStep();
      
      if (nextStep === 'complete') {
        // Génération de l'agent
        const generatedAgent = await this.generateAgent();
        
        // Mise à jour de la session
        this.currentSession.status = 'completed';
        this.currentSession.generated_agent_config = generatedAgent;
        this.currentSession.updated_at = new Date();

        return {
          session: this.currentSession,
          isComplete: true,
          generatedAgent
        };
      } else {
        // Génération de la prochaine question
        const nextQuestion = await this.generateNextQuestion(nextStep);
        
        // Mise à jour de la session
        this.currentSession.current_step++;
        this.currentSession.updated_at = new Date();

        return {
          nextQuestion,
          session: this.currentSession,
          isComplete: false
        };
      }
    } catch (error) {
      logger.error('Error processing user response', {
        sessionId,
        error: error instanceof Error ? error.message : 'Unknown error'
      });
      throw new Error(`Failed to process user response: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  // Analyse du message initial
  private async analyzeInitialMessage(message: string): Promise<Partial<DiscoveredRequirements>> {
    try {
      const analysis = await this.openaiService.analyzeText(
        message,
        'classification',
        'master-agent'
      );

      return {
        businessType: analysis.result.category || '',
        useCases: analysis.result.tags || [],
        targetAudience: analysis.result.subcategory || '',
        keyFeatures: [],
        integrations: [],
        priority: 'medium',
        complexity: 'moderate',
        estimatedSetupTime: 30
      };
    } catch (error) {
      logger.error('Error analyzing initial message', { error: error instanceof Error ? error.message : 'Unknown error' });
      return {};
    }
  }

  // Mise à jour des exigences basée sur la réponse
  private async updateRequirementsFromResponse(response: string): Promise<void> {
    if (!this.currentSession) return;

    try {
      // Analyse de la réponse pour extraire des informations
      const analysis = await this.openaiService.analyzeText(
        response,
        'intent',
        this.currentSession.tenant_id
      );

      // Mise à jour des exigences basée sur l'analyse
      const currentStep = this.currentSession.current_step;
      
      switch (currentStep) {
        case 1: // Type d'entreprise
          this.currentSession.discovered_requirements.business_type = analysis.result.entities?.[0] || response;
          break;
        case 2: // Cas d'usage
          if (Array.isArray(analysis.result.entities)) {
            this.currentSession.discovered_requirements.use_cases.push(...analysis.result.entities);
          }
          break;
        case 3: // Audience cible
          this.currentSession.discovered_requirements.target_audience = analysis.result.entities?.[0] || response;
          break;
        case 4: // Fonctionnalités clés
          if (Array.isArray(analysis.result.entities)) {
            this.currentSession.discovered_requirements.key_features.push(...analysis.result.entities);
          }
          break;
        case 5: // Intégrations
          if (Array.isArray(analysis.result.entities)) {
            this.currentSession.discovered_requirements.integrations_needed.push(...analysis.result.entities);
          }
          break;
      }
    } catch (error) {
      logger.error('Error updating requirements from response', {
        sessionId: this.currentSession.id,
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }

  // Détermination de la prochaine étape
  private determineNextStep(): string {
    if (!this.currentSession) return 'complete';

    const requirements = this.currentSession.discovered_requirements;
    const currentStep = this.currentSession.current_step;

    // Vérification des étapes obligatoires
    if (currentStep === 1 && !requirements.business_type) {
      return 'business_type';
    }
    if (currentStep === 2 && requirements.use_cases.length === 0) {
      return 'use_cases';
    }
    if (currentStep === 3 && !requirements.target_audience) {
      return 'target_audience';
    }
    if (currentStep === 4 && requirements.key_features.length === 0) {
      return 'key_features';
    }
    if (currentStep === 5 && requirements.integrations_needed.length === 0) {
      return 'integrations';
    }
    if (currentStep === 6) {
      return 'validation';
    }
    if (currentStep === 7) {
      return 'testing';
    }

    return 'complete';
  }

  // Génération de la prochaine question
  private async generateNextQuestion(step: string): Promise<string> {
    const questions = {
      business_type: "Quel est le type d'entreprise ou d'activité pour laquelle vous souhaitez créer cet agent IA ?",
      use_cases: "Quels sont les principaux cas d'usage pour cet agent ? (ex: support client, vente, information)",
      target_audience: "Qui sera l'audience principale de cet agent ? (ex: clients, employés, prospects)",
      key_features: "Quelles fonctionnalités clés souhaitez-vous que l'agent possède ?",
      integrations: "Avec quels systèmes ou services souhaitez-vous intégrer l'agent ? (ex: CRM, calendrier, email)",
      validation: "Voulez-vous que je valide la configuration de l'agent avant de le générer ?",
      testing: "Souhaitez-vous tester l'agent dans un environnement sandbox avant de le déployer ?"
    };

    return questions[step as keyof typeof questions] || "Pouvez-vous me donner plus de détails sur vos besoins ?";
  }

  // Génération de l'agent final
  private async generateAgent(): Promise<Partial<Agent>> {
    if (!this.currentSession) {
      throw new Error('No active session');
    }

    try {
      const requirements = {
        businessType: this.currentSession.discovered_requirements.business_type,
        useCases: this.currentSession.discovered_requirements.use_cases,
        targetAudience: this.currentSession.discovered_requirements.target_audience,
        keyFeatures: this.currentSession.discovered_requirements.key_features,
        integrations: this.currentSession.discovered_requirements.integrations_needed
      };

      const generatedAgent = await this.openaiService.generateAgent(
        requirements,
        this.currentSession.tenant_id
      );

      logger.info('Agent generated by master agent', {
        sessionId: this.currentSession.id,
        tenantId: this.currentSession.tenant_id,
        agentName: generatedAgent.name
      });

      return generatedAgent;
    } catch (error) {
      logger.error('Error generating agent', {
        sessionId: this.currentSession.id,
        error: error instanceof Error ? error.message : 'Unknown error'
      });
      throw new Error(`Failed to generate agent: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  // Initialisation des questions de découverte
  private initializeDiscoveryQuestions(): DiscoveryQuestion[] {
    return [
      {
        id: 'business_type',
        question: "Quel est le type d'entreprise ou d'activité ?",
        type: 'text',
        required: true,
        category: 'business'
      },
      {
        id: 'use_cases',
        question: 'Quels sont les principaux cas d\'usage ?',
        type: 'text',
        required: true,
        category: 'business'
      },
      {
        id: 'target_audience',
        question: 'Qui sera l\'audience principale ?',
        type: 'text',
        required: true,
        category: 'business'
      },
      {
        id: 'key_features',
        question: 'Quelles fonctionnalités clés sont nécessaires ?',
        type: 'text',
        required: true,
        category: 'technical'
      },
      {
        id: 'integrations',
        question: 'Quelles intégrations sont requises ?',
        type: 'text',
        required: false,
        category: 'technical'
      },
      {
        id: 'complexity',
        question: 'Quel niveau de complexité souhaitez-vous ?',
        type: 'multiple_choice',
        options: ['Simple', 'Modéré', 'Avancé'],
        required: true,
        category: 'preferences'
      }
    ];
  }

  // Récupération de la session actuelle
  public getCurrentSession(): MasterAgentSession | null {
    return this.currentSession;
  }

  // Réinitialisation de la session
  public resetSession(): void {
    this.currentSession = null;
  }

  // Validation de la configuration générée
  public async validateGeneratedAgent(agent: Partial<Agent>): Promise<{
    isValid: boolean;
    issues: string[];
    suggestions: string[];
  }> {
    const issues: string[] = [];
    const suggestions: string[] = [];

    // Validation des champs obligatoires
    if (!agent.name) {
      issues.push('Le nom de l\'agent est requis');
    }
    if (!agent.description) {
      issues.push('La description de l\'agent est requise');
    }
    if (!(agent as any).system_prompt) {
      issues.push('Le prompt système est requis');
    }
    if (!agent.capabilities || agent.capabilities.length === 0) {
      issues.push('Au moins une capacité doit être définie');
    }

    // Validation de la personnalité
    if (!agent.personality) {
      issues.push('La personnalité de l\'agent doit être définie');
    } else {
      if (!agent.personality.tone) {
        issues.push('Le ton de l\'agent doit être défini');
      }
      if (agent.personality.proactivity < 0 || agent.personality.proactivity > 100) {
        issues.push('La proactivité doit être entre 0 et 100');
      }
    }

    // Suggestions d'amélioration
    if (agent.capabilities && agent.capabilities.length < 3) {
      suggestions.push('Considérez ajouter plus de capacités pour enrichir l\'agent');
    }
    if ((agent as any).system_prompt && (agent as any).system_prompt.length < 100) {
      suggestions.push('Le prompt système pourrait être plus détaillé');
    }

    return {
      isValid: issues.length === 0,
      issues,
      suggestions
    };
  }
}

export default MasterAgent;




