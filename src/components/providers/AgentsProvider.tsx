'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';
import { AgentService } from '@/lib/services/AgentService';
import { Agent, UseAgentsReturn } from '@/types/frontend';
import { useUser } from './UserProvider';

const AgentsContext = createContext<UseAgentsReturn | undefined>(undefined);

export function AgentsProvider({ children }: { children: React.ReactNode }) {
  const [agents, setAgents] = useState<Agent[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { user } = useUser();
  const agentService = AgentService.getInstance();

  useEffect(() => {
    if (user) {
      loadAgents();
    } else {
      setAgents([]);
    }
  }, [user]);

  const loadAgents = async () => {
    if (!user) return;

    try {
      setLoading(true);
      setError(null);
      const userAgents = await agentService.getUserAgents(user.id);
      setAgents(userAgents);
    } catch (err: any) {
      setError(err.message || 'Erreur lors du chargement des agents');
    } finally {
      setLoading(false);
    }
  };

  const createAgent = async (agentData: Partial<Agent>): Promise<Agent> => {
    if (!user) throw new Error('Utilisateur non connecté');

    try {
      setLoading(true);
      setError(null);
      
      const newAgent = await agentService.createAgent({
        ...agentData,
        userId: user.id,
      });

      setAgents(prev => [newAgent, ...prev]);
      return newAgent;
    } catch (err: any) {
      setError(err.message || 'Erreur lors de la création de l\'agent');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const updateAgent = async (id: string, updates: Partial<Agent>): Promise<void> => {
    try {
      setLoading(true);
      setError(null);
      
      await agentService.updateAgent(id, updates);
      
      setAgents(prev => prev.map(agent => 
        agent.id === id ? { ...agent, ...updates } : agent
      ));
    } catch (err: any) {
      setError(err.message || 'Erreur lors de la mise à jour de l\'agent');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const deleteAgent = async (id: string): Promise<void> => {
    try {
      setLoading(true);
      setError(null);
      
      await agentService.deleteAgent(id);
      
      setAgents(prev => prev.filter(agent => agent.id !== id));
    } catch (err: any) {
      setError(err.message || 'Erreur lors de la suppression de l\'agent');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const getAgent = async (id: string): Promise<Agent | null> => {
    try {
      setError(null);
      return await agentService.getAgent(id);
    } catch (err: any) {
      setError(err.message || 'Erreur lors de la récupération de l\'agent');
      return null;
    }
  };

  const value: UseAgentsReturn = {
    agents,
    loading,
    error,
    createAgent,
    updateAgent,
    deleteAgent,
  };

  return (
    <AgentsContext.Provider value={value}>
      {children}
    </AgentsContext.Provider>
  );
}

export function useAgents() {
  const context = useContext(AgentsContext);
  if (context === undefined) {
    throw new Error('useAgents must be used within an AgentsProvider');
  }
  return context;
}




