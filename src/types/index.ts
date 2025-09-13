// Types principaux pour la plateforme AGENLY

export interface Tenant {
  id: string;
  company_name: string;
  subscription_plan: 'trial' | 'starter' | 'professional' | 'enterprise';
  subscription_status: 'active' | 'grace_period' | 'suspended' | 'terminated';
  created_at: Date;
  subscription_ends_at: Date;
  api_usage_limit: number;
  features_enabled: string[];
  billing_email: string;
  contact_info: {
    name: string;
    email: string;
    phone?: string;
  };
  settings: {
    timezone: string;
    language: string;
    notifications: boolean;
  };
}

export interface Agent {
  id: string;
  tenant_id: string;
  name: string;
  description: string;
  status: 'draft' | 'sandbox' | 'active' | 'paused' | 'archived';
  personality: {
    tone: 'professional' | 'friendly' | 'casual' | 'formal';
    expertise_level: 'beginner' | 'intermediate' | 'expert';
    proactivity: number; // 0-100
    response_style: 'concise' | 'detailed' | 'conversational';
  };
  capabilities: string[];
  integrations: AgentIntegration[];
  knowledge_base: {
    documents: string[];
    embeddings_id: string;
    last_updated: Date;
  };
  system_prompt: string; // Chiffré
  version: string;
  created_at: Date;
  updated_at: Date;
  created_by: string;
  usage_stats: {
    total_conversations: number;
    total_messages: number;
    last_used: Date;
    avg_response_time: number;
  };
}

export interface AgentIntegration {
  id: string;
  type: 'calendar' | 'crm' | 'ecommerce' | 'communication' | 'payment';
  provider: string;
  config: Record<string, any>; // Chiffré
  status: 'active' | 'inactive' | 'error';
  last_sync: Date;
  credentials: {
    encrypted: boolean;
    key_id: string;
  };
}

export interface Conversation {
  id: string;
  tenant_id: string;
  agent_id: string;
  user_id: string;
  session_id: string;
  messages: Message[];
  context: Record<string, any>;
  status: 'active' | 'completed' | 'abandoned';
  created_at: Date;
  updated_at: Date;
  metadata: {
    user_agent: string;
    ip_address: string;
    referrer?: string;
  };
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

export interface User {
  id: string;
  tenant_id: string;
  email: string;
  name: string;
  role: 'admin' | 'user' | 'viewer' | 'inactive';
  permissions: string[];
  last_login: Date;
  created_at: Date;
  preferences: {
    theme: 'light' | 'dark';
    notifications: boolean;
    language: string;
  };
}

export interface Subscription {
  id: string;
  tenant_id: string;
  plan: string;
  status: 'active' | 'past_due' | 'canceled' | 'unpaid';
  current_period_start: Date;
  current_period_end: Date;
  cancel_at_period_end: boolean;
  stripe_subscription_id: string;
  stripe_customer_id: string;
  usage: {
    agents_created: number;
    api_calls: number;
    storage_used: number;
    integrations_active: number;
  };
  limits: {
    max_agents: number;
    max_api_calls: number;
    max_storage: number;
    max_integrations: number;
  };
}

export interface APIUsage {
  id: string;
  tenant_id: string;
  endpoint: string;
  method: string;
  status_code: number;
  response_time: number;
  tokens_used: number;
  cost: number;
  timestamp: Date;
  user_id?: string;
  agent_id?: string;
}

export interface IntegrationTemplate {
  id: string;
  name: string;
  type: string;
  provider: string;
  description: string;
  icon_url: string;
  configuration_schema: Record<string, any>;
  required_credentials: string[];
  features: string[];
  pricing_tier: 'free' | 'premium' | 'enterprise';
  documentation_url: string;
  status: 'active' | 'beta' | 'deprecated';
}

export interface MasterAgentSession {
  id: string;
  tenant_id: string;
  user_id: string;
  status: 'discovery' | 'configuration' | 'testing' | 'deployment' | 'completed';
  current_step: number;
  total_steps: number;
  discovered_requirements: {
    business_type: string;
    use_cases: string[];
    integrations_needed: string[];
    target_audience: string;
    key_features: string[];
  };
  generated_agent_config: Partial<Agent>;
  test_results: {
    functionality_score: number;
    integration_score: number;
    user_satisfaction_score: number;
    issues_found: string[];
  };
  created_at: Date;
  updated_at: Date;
}

// Types pour les réponses API
export interface APIResponse<T = any> {
  success: boolean;
  data?: T;
  error?: {
    code: string;
    message: string;
    details?: any;
  };
  metadata?: {
    timestamp: Date;
    request_id: string;
    version: string;
  };
}

export interface PaginatedResponse<T> extends APIResponse<T[]> {
  pagination: {
    page: number;
    limit: number;
    total: number;
    total_pages: number;
    has_next: boolean;
    has_prev: boolean;
  };
}

// Types pour les événements
export interface PlatformEvent {
  id: string;
  type: string;
  tenant_id: string;
  user_id?: string;
  agent_id?: string;
  data: Record<string, any>;
  timestamp: Date;
  processed: boolean;
}

// Types pour le monitoring
export interface SystemMetrics {
  timestamp: Date;
  cpu_usage: number;
  memory_usage: number;
  disk_usage: number;
  active_connections: number;
  api_requests_per_minute: number;
  error_rate: number;
  response_time_p95: number;
}

export interface BusinessMetrics {
  timestamp: Date;
  active_tenants: number;
  active_agents: number;
  total_conversations: number;
  revenue: number;
  churn_rate: number;
  conversion_rate: number;
  avg_session_duration: number;
}

// Types pour la sécurité
export interface SecurityEvent {
  id: string;
  type: 'auth_failure' | 'rate_limit_exceeded' | 'suspicious_activity' | 'data_breach_attempt';
  tenant_id?: string;
  user_id?: string;
  ip_address: string;
  user_agent: string;
  details: Record<string, any>;
  severity: 'low' | 'medium' | 'high' | 'critical';
  timestamp: Date;
  resolved: boolean;
}

// Types pour les webhooks
export interface WebhookEvent {
  id: string;
  tenant_id: string;
  event_type: string;
  payload: Record<string, any>;
  attempts: number;
  max_attempts: number;
  status: 'pending' | 'delivered' | 'failed' | 'retrying';
  next_retry_at?: Date;
  created_at: Date;
  delivered_at?: Date;
}

// Types pour les templates
export interface AgentTemplate {
  id: string;
  name: string;
  category: string;
  description: string;
  use_cases: string[];
  default_config: Partial<Agent>;
  required_integrations: string[];
  optional_integrations: string[];
  estimated_setup_time: number; // en minutes
  difficulty_level: 'beginner' | 'intermediate' | 'advanced';
  popularity_score: number;
  created_at: Date;
  updated_at: Date;
}

// Types pour les analytics
export interface AgentAnalytics {
  agent_id: string;
  period: 'day' | 'week' | 'month' | 'year';
  metrics: {
    conversations_count: number;
    messages_count: number;
    unique_users: number;
    avg_response_time: number;
    user_satisfaction_score: number;
    most_used_features: string[];
    error_rate: number;
    cost_per_conversation: number;
  };
  generated_at: Date;
}

// Types pour les notifications
export interface Notification {
  id: string;
  tenant_id: string;
  user_id: string;
  type: 'info' | 'warning' | 'error' | 'success';
  title: string;
  message: string;
  action_url?: string;
  read: boolean;
  created_at: Date;
  expires_at?: Date;
}

// Types pour les audits
export interface AuditLog {
  id: string;
  tenant_id: string;
  user_id?: string;
  action: string;
  resource_type: string;
  resource_id: string;
  changes: Record<string, any>;
  ip_address: string;
  user_agent: string;
  timestamp: Date;
}



