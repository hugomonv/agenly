'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';
import { Agent, UseAgentsReturn } from '@/types/frontend';

const AgentsContext = createContext<UseAgentsReturn | undefined>(undefined);

export function BackendAgentsProvider({ children }: { children: React.ReactNode }) {
  const [agents, setAgents] = useState<Agent[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Charger les agents au montage du composant
  useEffect(() => {
    loadAgents();
  }, []);

  const loadAgents = async () => {
    try {
      setLoading(true);
      setError(null);

      const token = localStorage.getItem('access_token');
      if (!token) {
        setLoading(false);
        return;
      }

      const response = await fetch('http://localhost:3001/api/agents', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
      });

      const data = await response.json();

      if (!data.success) {
        throw new Error(data.error || 'Erreur lors du chargement des agents');
      }

      // Convertir les agents du backend vers le format frontend
      const frontendAgents: Agent[] = data.data.map((agent: any) => ({
        id: agent.id,
        name: agent.name,
        description: agent.description,
        status: agent.status,
        configuration: agent.configuration,
        createdAt: new Date(agent.created_at),
        updatedAt: new Date(agent.created_at), // TODO: Utiliser updated_at quand disponible
      }));

      setAgents(frontendAgents);

    } catch (err: any) {
      console.error('Erreur lors du chargement des agents:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const createAgent = async (agentData: Partial<Agent>) => {
    try {
      setLoading(true);
      setError(null);

      const token = localStorage.getItem('access_token');
      if (!token) {
        throw new Error('Non authentifié');
      }

      const response = await fetch('http://localhost:3001/api/agents', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify(agentData),
      });

      const data = await response.json();

      if (!data.success) {
        throw new Error(data.error || 'Erreur lors de la création de l\'agent');
      }

      // Ajouter le nouvel agent à la liste
      const newAgent: Agent = {
        id: data.data.id,
        userId: data.data.created_by || 'current-user',
        name: data.data.name,
        description: data.data.description,
        personality: data.data.personality || {
          tone: 'professional',
          expertise_level: 'intermediate',
          proactivity: 50,
          response_style: 'conversational'
        },
        capabilities: data.data.capabilities || [],
        integrations: data.data.integrations || [],
        knowledge_base: data.data.knowledge_base || {
          documents: [],
          embeddings_id: '',
          last_updated: new Date()
        },
        system_prompt: data.data.system_prompt || '',
        version: data.data.version || '1.0.0',
        createdAt: new Date(data.data.created_at),
        updatedAt: new Date(data.data.updated_at || data.data.created_at),
        conversationCount: 0,
        isActive: data.data.status === 'active',
        status: data.data.status || 'draft',
        deployments: {
          web: false,
          iframe: false,
          api: false
        },
        metadata: {
          tags: [],
          category: 'general',
          difficulty: 'beginner'
        }
      };

      setAgents(prev => [...prev, newAgent]);
      return newAgent;

    } catch (err: any) {
      console.error('Erreur lors de la création de l\'agent:', err);
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const updateAgent = async (agentId: string, updates: Partial<Agent>) => {
    try {
      setLoading(true);
      setError(null);

      const token = localStorage.getItem('access_token');
      if (!token) {
        throw new Error('Non authentifié');
      }

      const response = await fetch(`http://localhost:3001/api/agents/${agentId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify(updates),
      });

      const data = await response.json();

      if (!data.success) {
        throw new Error(data.error || 'Erreur lors de la mise à jour de l\'agent');
      }

      // Mettre à jour l'agent dans la liste
      setAgents(prev => prev.map(agent => 
        agent.id === agentId 
          ? { ...agent, ...updates, updatedAt: new Date() }
          : agent
      ));

      return data.data;

    } catch (err: any) {
      console.error('Erreur lors de la mise à jour de l\'agent:', err);
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const deleteAgent = async (agentId: string) => {
    try {
      setLoading(true);
      setError(null);

      const token = localStorage.getItem('access_token');
      if (!token) {
        throw new Error('Non authentifié');
      }

      const response = await fetch(`http://localhost:3001/api/agents/${agentId}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
      });

      const data = await response.json();

      if (!data.success) {
        throw new Error(data.error || 'Erreur lors de la suppression de l\'agent');
      }

      // Supprimer l'agent de la liste
      setAgents(prev => prev.filter(agent => agent.id !== agentId));

    } catch (err: any) {
      console.error('Erreur lors de la suppression de l\'agent:', err);
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const value: UseAgentsReturn = {
    agents,
    loading,
    error,
    createAgent,
    updateAgent,
    deleteAgent,
    refreshAgents: loadAgents,
  };

  return (
    <AgentsContext.Provider value={value}>
      {children}
    </AgentsContext.Provider>
  );
}

export function useAgents(): UseAgentsReturn {
  const context = useContext(AgentsContext);
  if (context === undefined) {
    throw new Error('useAgents must be used within a BackendAgentsProvider');
  }
  return context;
}




