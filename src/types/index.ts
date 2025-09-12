// Types principaux pour l'application AGENLY

export interface User {
  id: string;
  email: string;
  displayName: string;
  photoURL?: string;
  usage: {
    agentsCreated: number;
    lastActivity: Date;
  };
  createdAt: Date;
  updatedAt: Date;
}

export interface Agent {
  id: string;
  userId: string;
  name: string;
  description: string;
  type: 'custom' | 'template' | 'ai-generated';
  prompt: string;
  instructions: string;
  model: string;
  temperature: number;
  maxTokens: number;
  isActive: boolean;
  conversationCount: number;
  trainingData: {
    sources: string[];
  };
  capabilities: string[];
  metadata: {
    version: string;
    language: string;
    systemPrompt: string;
    customInstructions: string[];
    tags: string[];
    category: string;
    isMetaAgent: boolean;
  };
  conversationId: string;
  createdAt: Date;
  updatedAt: Date;
  status: 'active' | 'inactive' | 'draft';
  deployments: {
    web: boolean;
    iframe: boolean;
    api: boolean;
  };
}

export interface Conversation {
  id: string;
  userId: string;
  agentId?: string;
  messages: Message[];
  title: string;
  createdAt: Date;
  updatedAt: Date;
  isActive: boolean;
}

export interface Message {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: Date;
  metadata?: {
    tokens?: number;
    model?: string;
    temperature?: number;
  };
}

export interface ConnectedService {
  id: string;
  userId: string;
  serviceName: 'google-calendar' | 'gmail' | 'google-drive' | 'google-contacts';
  accessToken: string;
  refreshToken: string;
  expiresAt: Date;
  scope: string;
  connectedAt: Date;
  isActive: boolean;
}

export interface Subscription {
  id: string;
  userId: string;
  plan: 'free' | 'pro' | 'enterprise';
  status: 'active' | 'canceled' | 'past_due';
  stripeCustomerId: string;
  stripeSubscriptionId: string;
  currentPeriodStart: Date;
  currentPeriodEnd: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface ChatRequest {
  message: string;
  conversationId?: string;
  userId: string;
  agentId?: string;
}

export interface ChatResponse {
  message: string;
  nextStep?: string;
  agentData?: Partial<Agent>;
  shouldGenerateAgent?: boolean;
  conversationId: string;
}

export interface GenerateAgentRequest {
  businessType: string;
  name: string;
  objectives: string;
  features: string[];
  personality: string;
  userId: string;
  conversationId: string;
}

export interface GoogleCalendarEvent {
  id: string;
  summary: string;
  description?: string;
  start: {
    dateTime: string;
    timeZone: string;
  };
  end: {
    dateTime: string;
    timeZone: string;
  };
  attendees?: Array<{
    email: string;
    displayName?: string;
  }>;
}

export interface GmailMessage {
  id: string;
  threadId: string;
  snippet: string;
  payload: {
    headers: Array<{
      name: string;
      value: string;
    }>;
  };
}

export interface GoogleDriveFile {
  id: string;
  name: string;
  mimeType: string;
  size?: string;
  createdTime: string;
  modifiedTime: string;
  webViewLink: string;
}

export interface GoogleContact {
  resourceName: string;
  names: Array<{
    displayName: string;
    givenName?: string;
    familyName?: string;
  }>;
  emailAddresses: Array<{
    value: string;
    type?: string;
  }>;
  phoneNumbers?: Array<{
    value: string;
    type?: string;
  }>;
}

export interface StripePlan {
  id: string;
  name: string;
  price: number;
  interval: 'month' | 'year';
  features: string[];
  maxAgents: number;
  maxIntegrations: number;
}

export interface DeploymentConfig {
  agentId: string;
  type: 'web' | 'iframe' | 'api';
  url?: string;
  embedCode?: string;
  apiKey?: string;
  isActive: boolean;
  createdAt: Date;
}

// Types pour les hooks
export interface UseUserReturn {
  user: User | null;
  loading: boolean;
  error: string | null;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string, displayName: string) => Promise<void>;
  signInWithGoogle: () => Promise<void>;
  signOut: () => Promise<void>;
}

export interface UseAgentsReturn {
  agents: Agent[];
  loading: boolean;
  error: string | null;
  createAgent: (agentData: Partial<Agent>) => Promise<Agent>;
  updateAgent: (id: string, updates: Partial<Agent>) => Promise<void>;
  deleteAgent: (id: string) => Promise<void>;
  getAgent: (id: string) => Promise<Agent | null>;
}

export interface UseChatReturn {
  messages: Message[];
  loading: boolean;
  error: string | null;
  sendMessage: (message: string, agentId?: string) => Promise<void>;
  clearConversation: () => Promise<void>;
}

export interface UseIntegrationsReturn {
  connectedServices: ConnectedService[];
  loading: boolean;
  error: string | null;
  connectService: (serviceName: string) => Promise<void>;
  disconnectService: (serviceName: string) => Promise<void>;
  getServiceData: (serviceName: string) => Promise<any>;
}

// Types pour les composants
export interface ButtonProps {
  children: React.ReactNode;
  onClick?: () => void;
  variant?: 'primary' | 'secondary' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
  disabled?: boolean;
  loading?: boolean;
  className?: string;
}

export interface InputProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  type?: 'text' | 'email' | 'password';
  disabled?: boolean;
  className?: string;
}

export interface CardProps {
  children: React.ReactNode;
  className?: string;
  onClick?: () => void;
}

export interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  children: React.ReactNode;
  className?: string;
}

// Types pour les erreurs
export interface ApiError {
  message: string;
  code: string;
  details?: any;
}

export interface ValidationError {
  field: string;
  message: string;
}

// Types pour les réponses API
export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: ApiError;
  message?: string;
}

// Types pour les statistiques
export interface UserStats {
  totalAgents: number;
  totalConversations: number;
  totalMessages: number;
  connectedServices: number;
  lastActivity: Date;
}

export interface AgentStats {
  conversationCount: number;
  messageCount: number;
  averageResponseTime: number;
  userSatisfaction: number;
  lastUsed: Date;
}
