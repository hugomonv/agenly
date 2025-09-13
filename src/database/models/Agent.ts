import { v4 as uuidv4 } from 'uuid';

export interface Agent {
  id: string;
  tenant_id: string;
  name: string;
  description: string;
  type: 'support' | 'sales' | 'marketing' | 'custom';
  personality: {
    tone: 'friendly' | 'professional' | 'casual' | 'formal';
    expertise_level: 'beginner' | 'intermediate' | 'expert';
    proactivity: number; // 0-10
  };
  capabilities: string[];
  integrations: Array<{
    type: string;
    config: any;
    status: 'active' | 'inactive' | 'error';
  }>;
  knowledge_base: {
    documents: string[];
    embeddings_id?: string;
  };
  system_prompt: string;
  version: string;
  status: 'draft' | 'active' | 'inactive' | 'archived';
  created_at: Date;
  updated_at: Date;
  created_by: string;
  metadata?: any;
}

export interface CreateAgentRequest {
  name: string;
  description: string;
  type: 'support' | 'sales' | 'marketing' | 'custom';
  personality: {
    tone: 'friendly' | 'professional' | 'casual' | 'formal';
    expertise_level: 'beginner' | 'intermediate' | 'expert';
    proactivity: number;
  };
  capabilities: string[];
  integrations: Array<{
    type: string;
    config: any;
    status: 'active' | 'inactive' | 'error';
  }>;
  system_prompt: string;
  metadata?: any;
}

export interface UpdateAgentRequest {
  name?: string;
  description?: string;
  personality?: {
    tone?: 'friendly' | 'professional' | 'casual' | 'formal';
    expertise_level?: 'beginner' | 'intermediate' | 'expert';
    proactivity?: number;
  };
  capabilities?: string[];
  integrations?: Array<{
    type: string;
    config: any;
    status: 'active' | 'inactive' | 'error';
  }>;
  system_prompt?: string;
  status?: 'draft' | 'active' | 'inactive' | 'archived';
  metadata?: any;
}

export class AgentModel {
  private static agents: Map<string, Agent> = new Map();

  static async create(tenantId: string, userId: string, data: CreateAgentRequest): Promise<Agent> {
    const agent = {
      id: uuidv4(),
      tenant_id: tenantId,
      created_by: userId,
      version: '1.0.0',
      status: 'draft' as const,
      knowledge_base: {
        documents: []
      },
      created_at: new Date(),
      updated_at: new Date(),
      ...data
    };

    this.agents.set(agent.id, agent);
    return agent;
  }

  static async findById(id: string): Promise<Agent | null> {
    return this.agents.get(id) || null;
  }

  static async findByTenant(tenantId: string): Promise<Agent[]> {
    return Array.from(this.agents.values()).filter(agent => agent.tenant_id === tenantId);
  }

  static async update(id: string, data: UpdateAgentRequest): Promise<Agent | null> {
    const agent = this.agents.get(id);
    if (!agent) return null;

    const updatedAgent = {
      ...agent,
      ...data,
      updated_at: new Date(),
      personality: {
        tone: data.personality?.tone || agent.personality.tone,
        expertise_level: data.personality?.expertise_level || agent.personality.expertise_level,
        proactivity: data.personality?.proactivity || agent.personality.proactivity
      }
    } as Agent;

    this.agents.set(id, updatedAgent);
    return updatedAgent;
  }

  static async delete(id: string): Promise<boolean> {
    return this.agents.delete(id);
  }

  static async activate(id: string): Promise<Agent | null> {
    return this.update(id, { status: 'active' });
  }

  static async deactivate(id: string): Promise<Agent | null> {
    return this.update(id, { status: 'inactive' });
  }

  static async archive(id: string): Promise<Agent | null> {
    return this.update(id, { status: 'archived' });
  }
}




