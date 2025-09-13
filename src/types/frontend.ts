// Types spécifiques pour le frontend Next.js

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
  personality: {
    tone: 'professional' | 'friendly' | 'casual' | 'formal';
    expertise_level: 'beginner' | 'intermediate' | 'expert';
    proactivity: number;
    response_style: 'concise' | 'detailed' | 'conversational';
  };
  capabilities: string[];
  integrations: AgentIntegration[];
  knowledge_base: {
    documents: string[];
    embeddings_id: string;
    last_updated: Date;
  };
  system_prompt: string;
  version: string;
  createdAt: Date;
  updatedAt: Date;
  conversationCount: number;
  isActive: boolean;
  status: 'active' | 'inactive' | 'draft';
  deployments: {
    web: boolean;
    iframe: boolean;
    api: boolean;
  };
  metadata: {
    tags: string[];
    category: string;
    difficulty: 'beginner' | 'intermediate' | 'advanced';
  };
}

export interface AgentIntegration {
  id: string;
  type: 'calendar' | 'crm' | 'ecommerce' | 'communication' | 'payment';
  provider: string;
  config: Record<string, any>;
  status: 'active' | 'inactive' | 'error';
  last_sync: Date;
}

export interface UseUserReturn {
  user: User | null;
  loading: boolean;
  error: string | null;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string, displayName: string) => Promise<void>;
  signInWithGoogle: () => Promise<void>;
  signOut: () => Promise<void>;
  refreshToken?: () => Promise<string>;
}

export interface UseAgentsReturn {
  agents: Agent[];
  loading: boolean;
  error: string | null;
  createAgent: (agentData: Partial<Agent>) => Promise<Agent>;
  updateAgent: (id: string, updates: Partial<Agent>) => Promise<void>;
  deleteAgent: (id: string) => Promise<void>;
  refreshAgents?: () => Promise<void>;
}

export interface Message {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: Date;
  metadata?: {
    tokens_used?: number;
    model_used?: string;
    processing_time?: number;
    confidence_score?: number;
  };
}




