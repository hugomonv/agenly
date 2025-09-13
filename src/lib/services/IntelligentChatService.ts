import { OpenAIService } from './OpenAIService';
import { HybridAgentService } from './HybridAgentService';
import TestDeploymentService from './TestDeploymentService';
import AdvancedPromptService from './AdvancedPromptService';
import { chatSessionService } from './ChatSessionService';

interface ChatRequest {
  message: string;
  conversationId?: string;
  userId: string;
  agentId?: string;
  businessType?: string;
  context?: any;
}

interface ChatResponse {
  success: boolean;
  message?: string;
  agentId?: string;
  suggestions?: string[];
  error?: string;
}

/**
 * Service de chat intelligent qui utilise les nouveaux services avancés
 */
export class IntelligentChatService {
  private static instance: IntelligentChatService;
  private openaiService: OpenAIService;
  private agentService: HybridAgentService;

  private constructor() {
    this.openaiService = new OpenAIService();
    this.agentService = HybridAgentService.getInstance();
  }

  public static getInstance(): IntelligentChatService {
    if (!IntelligentChatService.instance) {
      IntelligentChatService.instance = new IntelligentChatService();
    }
    return IntelligentChatService.instance;
  }

  /**
   * Traiter une demande de chat intelligemment
   */
  async processChatRequest(request: ChatRequest): Promise<ChatResponse> {
    try {
      console.log('🤖 Traitement intelligent de la demande:', request.message);

      // 1. Récupérer ou créer la session
      const session = chatSessionService.getOrCreateSession(request.userId, request.conversationId);
      console.log('📱 Session:', session.sessionId, 'Contexte:', session.context);

      // 2. Analyser l'intention de l'utilisateur avec le contexte
      const intent = await this.analyzeUserIntentWithContext(request.message, session.context);
      console.log('🎯 Intention détectée:', intent);

      // 3. Ajouter le message utilisateur à l'historique
      chatSessionService.addMessage(session.sessionId, 'user', request.message);

      // 4. Si l'utilisateur veut créer un agent, utiliser le service avancé
      if (intent.type === 'create_agent') {
        const response = await this.handleAgentCreation(request, intent);
        // Mettre à jour le contexte de la session
        if (response.success && response.agentId) {
          chatSessionService.setCurrentAgent(session.sessionId, response.agentId);
          chatSessionService.updateContext(session.sessionId, {
            businessType: intent.extractedInfo?.businessType,
            objectives: intent.extractedInfo?.objectives,
            features: intent.extractedInfo?.features
          });
        }
        // Ajouter la réponse à l'historique
        if (response.message) {
          chatSessionService.addMessage(session.sessionId, 'assistant', response.message);
        }
        return response;
      }

      // 5. Si l'utilisateur veut personnaliser l'agent existant
      if (intent.type === 'personalize_agent') {
        return await this.handleAgentPersonalization(request, intent, session);
      }

      // 6. Si l'utilisateur veut déployer l'agent
      if (intent.type === 'deploy_agent') {
        return await this.handleAgentDeployment(request, intent, session);
      }

      // 7. Si l'utilisateur veut intégrer des services
      if (intent.type === 'integrate_services') {
        return await this.handleServiceIntegration(request, intent, session);
      }

      // 8. Si l'utilisateur veut tester un agent existant
      if (request.agentId || session.currentAgentId) {
        return await this.handleAgentChat(request, session.currentAgentId);
      }

      // 4. Si l'utilisateur veut des informations générales
      if (intent.type === 'general_info') {
        return await this.handleGeneralInquiry(request, intent);
      }

      // 5. Vérifier si c'est une suggestion de l'interface
      if (request.message.includes('Ajouter des informations sur mon restaurant') || 
          request.message.includes('ajouter des informations') ||
          request.message.includes('informations sur mon restaurant') ||
          request.message.includes('personnaliser votre agent') ||
          request.message.includes('Connecter avec Google Calendar') ||
          request.message.includes('connecter avec google') ||
          request.message.includes('Déployer sur mon site web') ||
          request.message.includes('déployer sur mon site')) {
        return await this.handleGeneralInquiry(request, intent);
      }

      // 6. Par défaut, proposer de créer un agent
      return await this.handleDefaultResponse(request);

    } catch (error) {
      console.error('❌ Erreur dans le service de chat intelligent:', error);
      return {
        success: false,
        error: 'Erreur lors du traitement de votre demande'
      };
    }
  }

  /**
   * Analyser l'intention de l'utilisateur avec contexte
   */
  private async analyzeUserIntentWithContext(message: string, context: any): Promise<any> {
    // Si on a déjà un contexte, utiliser une analyse plus intelligente
    if (context.businessType || context.currentAgentId) {
      return this.analyzeUserIntentWithExistingContext(message, context);
    }
    
    return this.analyzeUserIntent(message);
  }

  /**
   * Analyser l'intention avec un contexte existant
   */
  private async analyzeUserIntentWithExistingContext(message: string, context: any): Promise<any> {
    const analysisPrompt = `
Analyse cette demande utilisateur en tenant compte du contexte existant :

Message: "${message}"

Contexte existant :
- Type d'entreprise: ${context.businessType || 'non défini'}
- Objectifs: ${context.objectives || 'non définis'}
- Fonctionnalités: ${context.features?.join(', ') || 'non définies'}
- Agent actuel: ${context.currentAgentId || 'aucun'}

Types d'intention possibles :
- create_agent: L'utilisateur veut créer un nouvel agent IA
- personalize_agent: L'utilisateur veut personnaliser l'agent existant
- deploy_agent: L'utilisateur veut déployer l'agent
- integrate_services: L'utilisateur veut intégrer des services
- test_agent: L'utilisateur veut tester l'agent
- general_info: L'utilisateur demande des informations générales

Réponds uniquement avec un JSON :
{
  "type": "create_agent|personalize_agent|deploy_agent|integrate_services|test_agent|general_info",
  "businessType": "${context.businessType || 'restaurant'}",
  "confidence": 0.95,
  "extractedInfo": {
    "businessType": "${context.businessType || 'restaurant'}",
    "objectives": "objectifs mis à jour ou existants",
    "features": ["fonctionnalités demandées ou existantes"]
  }
}`;

    try {
      const completion = await this.openaiService.generateCompletion([
        { role: 'system', content: 'Tu es un expert en analyse d\'intention utilisateur avec contexte. Réponds uniquement avec du JSON valide.' },
        { role: 'user', content: analysisPrompt }
      ], { model: 'gpt-4', temperature: 0.3, max_tokens: 500 });

      return JSON.parse(completion);
    } catch (error) {
      console.error('Erreur analyse intention avec contexte:', error);
      return {
        type: 'personalize_agent',
        businessType: context.businessType || 'restaurant',
        confidence: 0.5,
        extractedInfo: {
          businessType: context.businessType || 'restaurant',
          objectives: context.objectives || 'support client',
          features: context.features || ['support client']
        }
      };
    }
  }

  /**
   * Analyser l'intention de l'utilisateur avec IA
   */
  private async analyzeUserIntent(message: string): Promise<any> {
    const analysisPrompt = `
Analyse cette demande utilisateur et détermine l'intention :

Message: "${message}"

Types d'intention possibles :
- create_agent: L'utilisateur veut créer un nouvel agent IA
- test_agent: L'utilisateur veut tester un agent existant
- general_info: L'utilisateur demande des informations générales
- deployment: L'utilisateur veut déployer un agent
- integration: L'utilisateur veut intégrer des services

Si c'est create_agent, extrais aussi :
- businessType: type d'entreprise (restaurant, e-commerce, support, etc.)
- objectives: objectifs principaux
- features: fonctionnalités demandées

Réponds uniquement avec un JSON :
{
  "type": "create_agent|test_agent|general_info|deployment|integration",
  "businessType": "restaurant|ecommerce|healthcare|etc",
  "confidence": 0.95,
  "extractedInfo": {
    "businessType": "restaurant coréen",
    "objectives": "gestion des réservations",
    "features": ["réservations", "menu", "support client"]
  }
}`;

    try {
      const completion = await this.openaiService.generateCompletion([
        { role: 'system', content: 'Tu es un expert en analyse d\'intention utilisateur. Réponds uniquement avec du JSON valide.' },
        { role: 'user', content: analysisPrompt }
      ], { model: 'gpt-4', temperature: 0.3, max_tokens: 500 });

      return JSON.parse(completion);
    } catch (error) {
      console.error('Erreur analyse intention:', error);
      return {
        type: 'create_agent',
        businessType: 'restaurant',
        confidence: 0.5,
        extractedInfo: {
          businessType: 'restaurant',
          objectives: 'support client',
          features: ['support client']
        }
      };
    }
  }

  /**
   * Gérer la création d'un agent
   */
  private async handleAgentCreation(request: ChatRequest, intent: any): Promise<ChatResponse> {
    try {
      console.log('🚀 Création d\'agent avec les services avancés');

      const extractedInfo = intent.extractedInfo;
      const agentName = this.generateAgentName(extractedInfo.businessType);
      
      // Utiliser le service de génération d'agents avancé
      const agentGenerationService = await import('./AgentGenerationService');
      
      const result = await agentGenerationService.agentGenerationService.generateAgent({
        businessType: extractedInfo.businessType,
        name: agentName,
        objectives: extractedInfo.objectives || `Gérer efficacement les ${extractedInfo.businessType}`,
        features: extractedInfo.features || ['support client', 'réservations'],
        personality: 'Professionnel, chaleureux et efficace',
        userId: request.userId
      });

      if (result.success && result.agent) {
        return {
          success: true,
          message: `🎉 Excellent ! J'ai créé votre agent "${agentName}" spécialisé pour votre ${extractedInfo.businessType}. 

Votre agent peut maintenant :
${extractedInfo.features?.map(f => `• ${f}`).join('\n') || '• Support client\n• Gestion des réservations'}

**Prochaines étapes :**

1️⃣ **Personnaliser votre agent** - Voulez-vous ajouter des informations spécifiques sur votre restaurant (menu, horaires, spécialités) ?

2️⃣ **Intégrations** - Souhaitez-vous connecter votre agent avec :
   • Google Calendar (pour les réservations)
   • Gmail (pour les confirmations)
   • Votre site web existant

3️⃣ **Déploiement** - Comment voulez-vous déployer votre agent :
   • Sur votre site web
   • En widget flottant
   • En page dédiée

Dites-moi ce qui vous intéresse le plus !`,
          agentId: result.agent.id,
          suggestions: [
            'Ajouter des informations sur mon restaurant',
            'Connecter avec Google Calendar',
            'Déployer sur mon site web',
            'Tester l\'agent maintenant'
          ]
        };
      } else {
        return {
          success: false,
          error: 'Erreur lors de la création de l\'agent. Veuillez réessayer.'
        };
      }
    } catch (error) {
      console.error('Erreur création agent:', error);
      return {
        success: false,
        error: 'Erreur lors de la création de l\'agent'
      };
    }
  }

  /**
   * Gérer la personnalisation d'un agent existant
   */
  private async handleAgentPersonalization(request: ChatRequest, intent: any, session: any): Promise<ChatResponse> {
    if (!session.currentAgentId) {
      return {
        success: false,
        error: 'Aucun agent créé. Veuillez d\'abord créer un agent.'
      };
    }

    // Mettre à jour le contexte avec les nouvelles informations
    chatSessionService.updateContext(session.sessionId, {
      businessType: intent.extractedInfo?.businessType || session.context.businessType,
      objectives: intent.extractedInfo?.objectives || session.context.objectives,
      features: intent.extractedInfo?.features || session.context.features
    });

    return {
      success: true,
      message: `Parfait ! J'ai mis à jour les informations de votre agent "${session.context.businessType || 'restaurant'}".

**Informations mises à jour :**
• Type d'entreprise: ${intent.extractedInfo?.businessType || session.context.businessType}
• Objectifs: ${intent.extractedInfo?.objectives || session.context.objectives}
• Fonctionnalités: ${intent.extractedInfo?.features?.join(', ') || session.context.features?.join(', ')}

Que souhaitez-vous faire maintenant ?`,
      agentId: session.currentAgentId,
      suggestions: [
        'Connecter avec Google Calendar',
        'Déployer sur mon site web',
        'Tester l\'agent maintenant',
        'Ajouter plus d\'informations'
      ]
    };
  }

  /**
   * Gérer le déploiement d'un agent
   */
  private async handleAgentDeployment(request: ChatRequest, intent: any, session: any): Promise<ChatResponse> {
    if (!session.currentAgentId) {
      return {
        success: false,
        error: 'Aucun agent créé. Veuillez d\'abord créer un agent.'
      };
    }

    return {
      success: true,
      message: `Excellent ! Je vais vous aider à déployer votre agent "${session.context.businessType || 'restaurant'}" sur votre site web.

**Options de déploiement disponibles :**

1️⃣ **Widget flottant** - Bouton de chat en bas à droite
2️⃣ **Page dédiée** - Page complète avec votre agent  
3️⃣ **Intégration complète** - Intégré dans votre design existant

**Étapes :**
• Génération du code d'intégration
• Personnalisation du design
• Test en temps réel
• Mise en ligne

Quelle option préférez-vous ?`,
      agentId: session.currentAgentId,
      suggestions: [
        'Widget flottant',
        'Page dédiée', 
        'Intégration complète',
        'Voir un aperçu'
      ],
      action: 'show_deployment_options'
    };
  }

  /**
   * Gérer l'intégration de services
   */
  private async handleServiceIntegration(request: ChatRequest, intent: any, session: any): Promise<ChatResponse> {
    if (!session.currentAgentId) {
      return {
        success: false,
        error: 'Aucun agent créé. Veuillez d\'abord créer un agent.'
      };
    }

    return {
      success: true,
      message: `Parfait ! Connectons votre agent "${session.context.businessType || 'restaurant'}" avec vos outils préférés.

**Intégrations disponibles :**

🔗 **Google Calendar** - Gérer les réservations automatiquement
📧 **Gmail** - Envoyer des confirmations par email
☁️ **Google Drive** - Sauvegarder les données clients
📱 **WhatsApp Business** - Notifications SMS et WhatsApp

**Avantages :**
• Automatisation complète des réservations
• Confirmations automatiques
• Synchronisation des données
• Notifications en temps réel

Quelle intégration vous intéresse ?`,
      agentId: session.currentAgentId,
      suggestions: [
        'Connecter Google Calendar',
        'Configurer Gmail',
        'Intégrer Google Drive',
        'Activer WhatsApp'
      ],
      action: 'show_integration_options'
    };
  }

  /**
   * Gérer le chat avec un agent existant
   */
  private async handleAgentChat(request: ChatRequest, agentId?: string): Promise<ChatResponse> {
    try {
      const targetAgentId = agentId || request.agentId;
      if (!targetAgentId) {
        return {
          success: false,
          error: 'Aucun agent spécifié pour le chat'
        };
      }

      // Récupérer l'agent
      let agent = await TestDeploymentService.getAgentById(targetAgentId);
      if (!agent) {
        agent = await this.agentService.getAgentById(targetAgentId);
      }

      if (!agent) {
        return {
          success: false,
          error: 'Agent non trouvé'
        };
      }

      // Utiliser l'agent pour répondre
      const response = await this.openaiService.generateCompletion([
        { role: 'system', content: agent.system_prompt },
        { role: 'user', content: request.message }
      ], { model: 'gpt-4', temperature: 0.7, max_tokens: 1000 });

      return {
        success: true,
        message: response,
        agentId: agent.id
      };
    } catch (error) {
      console.error('Erreur chat agent:', error);
      return {
        success: false,
        error: 'Erreur lors de la communication avec l\'agent'
      };
    }
  }

  /**
   * Gérer les demandes d'informations générales
   */
  private async handleGeneralInquiry(request: ChatRequest, intent: any): Promise<ChatResponse> {
    console.log('🔍 Message reçu pour suggestion:', request.message);
    // Vérifier si c'est une suggestion de l'interface
    if (request.message.includes('Ajouter des informations sur mon restaurant') || 
        request.message.includes('ajouter des informations') ||
        request.message.includes('informations sur mon restaurant') ||
        request.message.includes('personnaliser votre agent')) {
      return {
        success: true,
        message: `Parfait ! Pour personnaliser votre agent avec les informations de votre restaurant, j'ai besoin de quelques détails :

**Informations sur votre restaurant :**
• Nom de votre restaurant
• Type de cuisine (coréenne, française, italienne, etc.)
• Spécialités du chef
• Horaires d'ouverture
• Adresse et contact
• Capacité d'accueil
• Services spéciaux (terrasse, parking, etc.)

**Menu et tarifs :**
• Plats signature
• Prix moyens
• Menu dégustation (si applicable)
• Options végétariennes/végétaliennes

Dites-moi ces informations et je vais les intégrer dans votre agent !`,
        suggestions: [
          'Mon restaurant s\'appelle...',
          'Nous servons de la cuisine...',
          'Nos spécialités sont...',
          'Nous sommes ouverts...'
        ]
      };
    }

    if (request.message.includes('Connecter avec Google Calendar') || request.message.includes('connecter avec google')) {
      return {
        success: true,
        message: `Excellente idée ! Connecter votre agent avec Google Calendar permettra de :

**Fonctionnalités automatiques :**
• Vérifier la disponibilité en temps réel
• Créer des réservations directement dans votre agenda
• Envoyer des confirmations automatiques
• Gérer les annulations et modifications

**Configuration nécessaire :**
• Compte Google Business
• Autorisation d'accès au calendrier
• Configuration des créneaux disponibles

Voulez-vous que je vous guide dans la configuration de cette intégration ?`,
        suggestions: [
          'Oui, configurer Google Calendar',
          'Voir d\'autres intégrations',
          'Déployer d\'abord l\'agent'
        ],
        action: 'show_integration_options'
      };
    }

    if (request.message.includes('Déployer sur mon site web') || request.message.includes('déployer sur mon site')) {
      return {
        success: true,
        message: `Parfait ! Je vais vous aider à déployer votre agent sur votre site web.

**Options de déploiement :**

1️⃣ **Widget flottant** - Bouton de chat en bas à droite
2️⃣ **Page dédiée** - Page complète avec votre agent
3️⃣ **Intégration complète** - Intégré dans votre design existant

**Étapes :**
• Génération du code d'intégration
• Personnalisation du design
• Test en temps réel
• Mise en ligne

Quelle option préférez-vous ?`,
        suggestions: [
          'Widget flottant',
          'Page dédiée',
          'Intégration complète',
          'Voir un aperçu'
        ],
        action: 'show_deployment_options'
      };
    }

    const response = await this.openaiService.generateCompletion([
      { 
        role: 'system', 
        content: `Tu es un assistant IA expert en création d'agents intelligents. Tu aides les utilisateurs à créer des chatbots personnalisés pour leur entreprise. Tu es professionnel, utile et enthousiaste.` 
      },
      { role: 'user', content: request.message }
    ], { model: 'gpt-4', temperature: 0.7, max_tokens: 1000 });

    return {
      success: true,
      message: response,
      suggestions: [
        'Créer un agent pour mon restaurant',
        'Créer un agent pour mon e-commerce',
        'Voir mes agents existants',
        'Apprendre à déployer un agent'
      ]
    };
  }

  /**
   * Réponse par défaut
   */
  private async handleDefaultResponse(request: ChatRequest): Promise<ChatResponse> {
    return {
      success: true,
      message: `Bonjour ! Je suis votre assistant IA spécialisé dans la création d'agents intelligents. 

Je peux vous aider à créer un chatbot personnalisé pour votre entreprise. Dites-moi simplement :
• Quel type d'entreprise vous avez
• Quelles tâches vous voulez automatiser
• Vos objectifs principaux

Par exemple : "J'ai un restaurant coréen et j'aimerais créer un chatbot qui puisse gérer les réservations"`,
      suggestions: [
        'Créer un agent pour mon restaurant',
        'Créer un agent pour mon e-commerce', 
        'Créer un agent pour mon service client',
        'Voir des exemples d\'agents'
      ]
    };
  }

  /**
   * Générer un nom d'agent intelligent
   */
  private generateAgentName(businessType: string): string {
    const names = {
      'restaurant': ['Assistant Restaurant Premium', 'Expert Culinaire IA', 'Gestionnaire de Réservations'],
      'ecommerce': ['Assistant E-commerce Pro', 'Expert Ventes IA', 'Conseiller Produits'],
      'healthcare': ['Assistant Santé Certifié', 'Expert Médical IA', 'Conseiller Bien-être'],
      'default': ['Assistant IA Professionnel', 'Expert Business IA', 'Conseiller Intelligent']
    };

    const typeNames = names[businessType.toLowerCase()] || names.default;
    return typeNames[Math.floor(Math.random() * typeNames.length)];
  }
}

export const intelligentChatService = IntelligentChatService.getInstance();



