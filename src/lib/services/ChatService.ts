import { googleIntegrationService } from './GoogleIntegrationService';

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: Date;
  metadata?: {
    model_used?: string;
    tokens_used?: number;
    processing_time?: number;
    confidence_score?: number;
    integrations_used?: string[];
  };
}

export interface ChatRequest {
  message: string;
  agentId?: string;
  conversationId?: string;
  userId: string;
  context?: any;
  integrations?: {
    calendar?: boolean;
    gmail?: boolean;
  };
}

export interface ChatResponse {
  success: boolean;
  response: string;
  messageId: string;
  metadata?: {
    model_used: string;
    tokens_used: number;
    processing_time: number;
    integrations_used: string[];
  };
  error?: string;
}

export class ChatService {
  private static instance: ChatService;
  private openaiApiKey: string;

  constructor() {
    this.openaiApiKey = process.env.NEXT_PUBLIC_OPENAI_API_KEY || '';
  }

  static getInstance(): ChatService {
    if (!ChatService.instance) {
      ChatService.instance = new ChatService();
    }
    return ChatService.instance;
  }

  /**
   * Traiter une demande de chat avec un agent IA
   */
  async processChatRequest(request: ChatRequest): Promise<ChatResponse> {
    const startTime = Date.now();
    
    try {
      // 1. Analyser le message pour détecter les intentions
      const intent = await this.analyzeIntent(request.message);
      
      // 2. Récupérer le contexte des intégrations si nécessaire
      let integrationContext = {};
      const integrationsUsed: string[] = [];
      
      if (intent.needsCalendar && request.integrations?.calendar) {
        try {
          const calendarEvents = await this.getCalendarContext();
          integrationContext = { ...integrationContext, calendar: calendarEvents };
          integrationsUsed.push('calendar');
        } catch (error) {
          console.warn('Erreur lors de la récupération du calendrier:', error);
        }
      }
      
      if (intent.needsGmail && request.integrations?.gmail) {
        try {
          const gmailMessages = await this.getGmailContext();
          integrationContext = { ...integrationContext, gmail: gmailMessages };
          integrationsUsed.push('gmail');
        } catch (error) {
          console.warn('Erreur lors de la récupération des emails:', error);
        }
      }
      
      // 3. Construire le prompt pour OpenAI
      const systemPrompt = this.buildSystemPrompt(request.agentId, integrationContext);
      const userPrompt = this.buildUserPrompt(request.message, intent, integrationContext);
      
      // 4. Appeler OpenAI
      const openaiResponse = await this.callOpenAI(systemPrompt, userPrompt);
      
      // 5. Traiter les actions si nécessaire
      if (intent.actions.length > 0) {
        await this.executeActions(intent.actions, integrationContext);
      }
      
      const processingTime = Date.now() - startTime;
      
      return {
        success: true,
        response: openaiResponse.content,
        messageId: `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        metadata: {
          model_used: 'gpt-4',
          tokens_used: openaiResponse.tokens_used || 0,
          processing_time: processingTime,
          integrations_used: integrationsUsed
        }
      };
      
    } catch (error: any) {
      console.error('Erreur lors du traitement du chat:', error);
      return {
        success: false,
        response: 'Désolé, une erreur s\'est produite. Veuillez réessayer.',
        messageId: `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        error: error.message
      };
    }
  }

  /**
   * Analyser l'intention du message utilisateur
   */
  private async analyzeIntent(message: string): Promise<{
    needsCalendar: boolean;
    needsGmail: boolean;
    actions: string[];
    intent: string;
  }> {
    // Analyse simple basée sur des mots-clés
    const lowerMessage = message.toLowerCase();
    
    const needsCalendar = 
      lowerMessage.includes('calendrier') ||
      lowerMessage.includes('rendez-vous') ||
      lowerMessage.includes('événement') ||
      lowerMessage.includes('planifier') ||
      lowerMessage.includes('agenda');
    
    const needsGmail = 
      lowerMessage.includes('email') ||
      lowerMessage.includes('mail') ||
      lowerMessage.includes('envoyer') ||
      lowerMessage.includes('répondre') ||
      lowerMessage.includes('boîte de réception');
    
    const actions: string[] = [];
    if (lowerMessage.includes('créer') && needsCalendar) {
      actions.push('create_calendar_event');
    }
    if (lowerMessage.includes('envoyer') && needsGmail) {
      actions.push('send_email');
    }
    
    return {
      needsCalendar,
      needsGmail,
      actions,
      intent: needsCalendar ? 'calendar' : needsGmail ? 'gmail' : 'general'
    };
  }

  /**
   * Construire le prompt système
   */
  private buildSystemPrompt(agentId?: string, integrationContext?: any): string {
    let prompt = `Tu es un assistant IA intelligent et utile. Tu peux aider les utilisateurs avec diverses tâches.`;
    
    if (integrationContext.calendar) {
      prompt += `\n\nTu as accès au calendrier de l'utilisateur. Tu peux voir ses événements et l'aider à planifier.`;
    }
    
    if (integrationContext.gmail) {
      prompt += `\n\nTu as accès aux emails de l'utilisateur. Tu peux l'aider à gérer sa boîte de réception.`;
    }
    
    prompt += `\n\nRéponds de manière naturelle et utile. Si tu peux effectuer des actions (créer un événement, envoyer un email), propose-le à l'utilisateur.`;
    
    return prompt;
  }

  /**
   * Construire le prompt utilisateur
   */
  private buildUserPrompt(message: string, intent: any, integrationContext?: any): string {
    let prompt = `Message de l'utilisateur: ${message}`;
    
    if (integrationContext.calendar) {
      prompt += `\n\nContexte calendrier: ${JSON.stringify(integrationContext.calendar, null, 2)}`;
    }
    
    if (integrationContext.gmail) {
      prompt += `\n\nContexte emails: ${JSON.stringify(integrationContext.gmail, null, 2)}`;
    }
    
    return prompt;
  }

  /**
   * Appeler l'API OpenAI
   */
  private async callOpenAI(systemPrompt: string, userPrompt: string): Promise<{
    content: string;
    tokens_used?: number;
  }> {
    if (!this.openaiApiKey) {
      throw new Error('Clé API OpenAI manquante');
    }

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${this.openaiApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt }
        ],
        max_tokens: 1000,
        temperature: 0.7,
      }),
    });

    if (!response.ok) {
      throw new Error(`Erreur OpenAI: ${response.status}`);
    }

    const data = await response.json();
    return {
      content: data.choices[0].message.content,
      tokens_used: data.usage?.total_tokens
    };
  }

  /**
   * Récupérer le contexte du calendrier
   */
  private async getCalendarContext(): Promise<any> {
    // TODO: Implémenter la récupération du contexte calendrier
    return { events: [] };
  }

  /**
   * Récupérer le contexte Gmail
   */
  private async getGmailContext(): Promise<any> {
    // TODO: Implémenter la récupération du contexte Gmail
    return { messages: [] };
  }

  /**
   * Exécuter les actions détectées
   */
  private async executeActions(actions: string[], context: any): Promise<void> {
    for (const action of actions) {
      switch (action) {
        case 'create_calendar_event':
          // TODO: Implémenter la création d'événement
          break;
        case 'send_email':
          // TODO: Implémenter l'envoi d'email
          break;
      }
    }
  }
}

// Instance singleton
export const chatService = ChatService.getInstance();




