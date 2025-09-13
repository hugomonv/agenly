interface ChatSession {
  sessionId: string;
  userId: string;
  currentAgentId?: string;
  conversationHistory: Array<{
    role: 'user' | 'assistant';
    content: string;
    timestamp: Date;
  }>;
  context: {
    businessType?: string;
    objectives?: string;
    features?: string[];
    integrations?: string[];
    deploymentPreference?: string;
  };
  lastActivity: Date;
}

export class ChatSessionService {
  private static instance: ChatSessionService;
  private sessions: Map<string, ChatSession> = new Map();

  private constructor() {}

  public static getInstance(): ChatSessionService {
    if (!ChatSessionService.instance) {
      ChatSessionService.instance = new ChatSessionService();
    }
    return ChatSessionService.instance;
  }

  /**
   * Créer ou récupérer une session de chat
   */
  getOrCreateSession(userId: string, conversationId?: string): ChatSession {
    const sessionId = conversationId || `session_${userId}_${Date.now()}`;
    
    if (!this.sessions.has(sessionId)) {
      this.sessions.set(sessionId, {
        sessionId,
        userId,
        conversationHistory: [],
        context: {},
        lastActivity: new Date()
      });
    }

    const session = this.sessions.get(sessionId)!;
    session.lastActivity = new Date();
    return session;
  }

  /**
   * Ajouter un message à l'historique
   */
  addMessage(sessionId: string, role: 'user' | 'assistant', content: string): void {
    const session = this.sessions.get(sessionId);
    if (session) {
      session.conversationHistory.push({
        role,
        content,
        timestamp: new Date()
      });
      session.lastActivity = new Date();
    }
  }

  /**
   * Mettre à jour le contexte de la session
   */
  updateContext(sessionId: string, context: Partial<ChatSession['context']>): void {
    const session = this.sessions.get(sessionId);
    if (session) {
      session.context = { ...session.context, ...context };
      session.lastActivity = new Date();
    }
  }

  /**
   * Définir l'agent actuel
   */
  setCurrentAgent(sessionId: string, agentId: string): void {
    const session = this.sessions.get(sessionId);
    if (session) {
      session.currentAgentId = agentId;
      session.lastActivity = new Date();
    }
  }

  /**
   * Récupérer le contexte de la session
   */
  getContext(sessionId: string): ChatSession['context'] {
    const session = this.sessions.get(sessionId);
    return session?.context || {};
  }

  /**
   * Récupérer l'historique de conversation
   */
  getConversationHistory(sessionId: string, limit: number = 10): ChatSession['conversationHistory'] {
    const session = this.sessions.get(sessionId);
    if (!session) return [];
    
    return session.conversationHistory.slice(-limit);
  }

  /**
   * Nettoyer les sessions inactives
   */
  cleanupInactiveSessions(maxAgeMinutes: number = 60): void {
    const now = new Date();
    const maxAge = maxAgeMinutes * 60 * 1000;

    for (const [sessionId, session] of this.sessions.entries()) {
      if (now.getTime() - session.lastActivity.getTime() > maxAge) {
        this.sessions.delete(sessionId);
      }
    }
  }

  /**
   * Récupérer toutes les sessions d'un utilisateur
   */
  getUserSessions(userId: string): ChatSession[] {
    return Array.from(this.sessions.values()).filter(session => session.userId === userId);
  }
}

export const chatSessionService = ChatSessionService.getInstance();

