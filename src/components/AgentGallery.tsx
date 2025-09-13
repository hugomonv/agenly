'use client';

import React, { useState, useEffect } from 'react';
import { Agent } from '@/lib/firebase-models';

interface AgentCardProps {
  agent: Agent;
  onSelect: (agent: Agent) => void;
  onDeploy: (agent: Agent) => void;
  onEdit: (agent: Agent) => void;
}

interface AgentGalleryProps {
  userId: string;
  onAgentSelect?: (agent: Agent) => void;
  onCreateNew?: () => void;
}

/**
 * Carte d'agent avec design moderne
 */
const AgentCard: React.FC<AgentCardProps> = ({ agent, onSelect, onDeploy, onEdit }) => {
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-green-100 text-green-800 border-green-200';
      case 'draft': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'archived': return 'bg-gray-100 text-gray-800 border-gray-200';
      default: return 'bg-blue-100 text-blue-800 border-blue-200';
    }
  };

  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat('fr-FR', {
      day: '2-digit',
      month: 'short',
      year: 'numeric'
    }).format(new Date(date));
  };

  return (
    <div className="group relative bg-gradient-to-br from-white to-gray-50 border border-gray-200 rounded-2xl p-6 shadow-sm hover:shadow-xl transition-all duration-300 hover:border-gray-300 hover:-translate-y-1">
      {/* Header avec status */}
      <div className="flex items-start justify-between mb-4">
        <div className="flex-1">
          <h3 className="text-xl font-bold text-gray-900 mb-2 group-hover:text-blue-600 transition-colors">
            {agent.name}
          </h3>
          <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium border ${getStatusColor(agent.status)}`}>
            {agent.status === 'active' ? '🟢 Actif' : agent.status === 'draft' ? '🟡 Brouillon' : '🔴 Archivé'}
          </span>
        </div>
        <div className="opacity-0 group-hover:opacity-100 transition-opacity">
          <button 
            onClick={() => onEdit(agent)}
            className="p-2 text-gray-400 hover:text-blue-500 transition-colors"
            title="Modifier l'agent"
          >
            ✏️
          </button>
        </div>
      </div>

      {/* Description */}
      <p className="text-gray-600 text-sm mb-4 line-clamp-2">
        {agent.description}
      </p>

      {/* Statistiques */}
      <div className="grid grid-cols-3 gap-3 mb-4">
        <div className="text-center p-2 bg-gray-50 rounded-lg">
          <div className="text-lg font-bold text-gray-900">{agent.usage_stats?.total_conversations || 0}</div>
          <div className="text-xs text-gray-500">Conversations</div>
        </div>
        <div className="text-center p-2 bg-gray-50 rounded-lg">
          <div className="text-lg font-bold text-gray-900">{agent.usage_stats?.total_messages || 0}</div>
          <div className="text-xs text-gray-500">Messages</div>
        </div>
        <div className="text-center p-2 bg-gray-50 rounded-lg">
          <div className="text-lg font-bold text-gray-900">{agent.capabilities?.length || 0}</div>
          <div className="text-xs text-gray-500">Capacités</div>
        </div>
      </div>

      {/* Capacités */}
      {agent.capabilities && agent.capabilities.length > 0 && (
        <div className="mb-4">
          <div className="flex flex-wrap gap-1">
            {agent.capabilities.slice(0, 3).map((capability, index) => (
              <span 
                key={index}
                className="inline-flex items-center px-2 py-1 rounded-md text-xs font-medium bg-blue-50 text-blue-700 border border-blue-200"
              >
                {capability}
              </span>
            ))}
            {agent.capabilities.length > 3 && (
              <span className="inline-flex items-center px-2 py-1 rounded-md text-xs font-medium bg-gray-50 text-gray-500">
                +{agent.capabilities.length - 3} autres
              </span>
            )}
          </div>
        </div>
      )}

      {/* Intégrations */}
      {agent.integrations && agent.integrations.length > 0 && (
        <div className="mb-4">
          <div className="text-xs text-gray-500 mb-1">Intégrations actives:</div>
          <div className="flex gap-1">
            {agent.integrations.slice(0, 4).map((integration, index) => (
              <div key={index} className="w-6 h-6 bg-green-100 rounded-full flex items-center justify-center" title={integration}>
                <span className="text-xs">🔗</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Métadonnées */}
      <div className="text-xs text-gray-400 mb-4">
        Créé le {formatDate(agent.created_at)} • Version {agent.version}
      </div>

      {/* Actions */}
      <div className="flex gap-2">
        <button 
          onClick={() => onSelect(agent)}
          className="flex-1 bg-gradient-to-r from-blue-500 to-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:from-blue-600 hover:to-blue-700 transition-all duration-200 shadow-sm hover:shadow-md"
        >
          💬 Tester
        </button>
        <button 
          onClick={() => onDeploy(agent)}
          className="flex-1 bg-gradient-to-r from-green-500 to-green-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:from-green-600 hover:to-green-700 transition-all duration-200 shadow-sm hover:shadow-md"
        >
          🚀 Déployer
        </button>
      </div>
    </div>
  );
};

/**
 * Carte de création d'agent
 */
const CreateAgentCard: React.FC<{ onClick: () => void }> = ({ onClick }) => {
  return (
    <div 
      onClick={onClick}
      className="group relative bg-gradient-to-br from-blue-50 to-indigo-100 border-2 border-dashed border-blue-300 rounded-2xl p-6 cursor-pointer hover:border-blue-400 hover:from-blue-100 hover:to-indigo-200 transition-all duration-300 min-h-[320px] flex flex-col items-center justify-center"
    >
      <div className="text-6xl mb-4 group-hover:scale-110 transition-transform duration-300">
        ➕
      </div>
      <h3 className="text-xl font-bold text-blue-700 mb-2 group-hover:text-blue-800">
        Créer un Nouvel Agent
      </h3>
      <p className="text-blue-600 text-center text-sm">
        Cliquez pour créer un agent IA personnalisé pour votre entreprise
      </p>
    </div>
  );
};

/**
 * Galerie d'agents avec interface moderne
 */
export const AgentGallery: React.FC<AgentGalleryProps> = ({ userId, onAgentSelect, onCreateNew }) => {
  const [agents, setAgents] = useState<Agent[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'active' | 'draft' | 'archived'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState<'recent' | 'name' | 'usage'>('recent');

  useEffect(() => {
    fetchAgents();
  }, [userId]);

  const fetchAgents = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/agents?userId=${userId}`);
      if (response.ok) {
        const data = await response.json();
        setAgents(data.agents || []);
      }
    } catch (error) {
      console.error('Erreur chargement agents:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredAndSortedAgents = agents
    .filter(agent => {
      if (filter !== 'all' && agent.status !== filter) return false;
      if (searchQuery && !agent.name.toLowerCase().includes(searchQuery.toLowerCase()) && 
          !agent.description.toLowerCase().includes(searchQuery.toLowerCase())) return false;
      return true;
    })
    .sort((a, b) => {
      switch (sortBy) {
        case 'name':
          return a.name.localeCompare(b.name);
        case 'usage':
          return (b.usage_stats?.total_conversations || 0) - (a.usage_stats?.total_conversations || 0);
        default: // recent
          return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
      }
    });

  const handleAgentSelect = (agent: Agent) => {
    onAgentSelect?.(agent);
  };

  const handleAgentDeploy = (agent: Agent) => {
    // Ouvrir le panneau de déploiement
    console.log('Déployer agent:', agent.id);
  };

  const handleAgentEdit = (agent: Agent) => {
    // Ouvrir l'éditeur d'agent
    console.log('Modifier agent:', agent.id);
  };

  const getFilterStats = () => {
    return {
      all: agents.length,
      active: agents.filter(a => a.status === 'active').length,
      draft: agents.filter(a => a.status === 'draft').length,
      archived: agents.filter(a => a.status === 'archived').length
    };
  };

  const stats = getFilterStats();

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      {/* Header avec titre et stats */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Galerie d'Agents IA</h1>
            <p className="text-gray-600">Gérez et déployez vos agents intelligents</p>
          </div>
          <button
            onClick={onCreateNew}
            className="bg-gradient-to-r from-blue-500 to-blue-600 text-white px-6 py-3 rounded-lg font-medium hover:from-blue-600 hover:to-blue-700 transition-all duration-200 shadow-lg hover:shadow-xl flex items-center gap-2"
          >
            ➕ Créer un Agent
          </button>
        </div>

        {/* Statistiques rapides */}
        <div className="grid grid-cols-4 gap-4 mb-6">
          <div className="bg-white p-4 rounded-lg border border-gray-200 shadow-sm">
            <div className="text-2xl font-bold text-gray-900">{stats.all}</div>
            <div className="text-sm text-gray-500">Total d'agents</div>
          </div>
          <div className="bg-white p-4 rounded-lg border border-gray-200 shadow-sm">
            <div className="text-2xl font-bold text-green-600">{stats.active}</div>
            <div className="text-sm text-gray-500">Agents actifs</div>
          </div>
          <div className="bg-white p-4 rounded-lg border border-gray-200 shadow-sm">
            <div className="text-2xl font-bold text-yellow-600">{stats.draft}</div>
            <div className="text-sm text-gray-500">Brouillons</div>
          </div>
          <div className="bg-white p-4 rounded-lg border border-gray-200 shadow-sm">
            <div className="text-2xl font-bold text-blue-600">
              {agents.reduce((sum, agent) => sum + (agent.usage_stats?.total_conversations || 0), 0)}
            </div>
            <div className="text-sm text-gray-500">Conversations totales</div>
          </div>
        </div>

        {/* Contrôles de filtrage et recherche */}
        <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
          {/* Recherche */}
          <div className="relative flex-1 max-w-md">
            <input
              type="text"
              placeholder="Rechercher un agent..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <span className="text-gray-400">🔍</span>
            </div>
          </div>

          {/* Filtres et tri */}
          <div className="flex gap-3">
            <select
              value={filter}
              onChange={(e) => setFilter(e.target.value as any)}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="all">Tous les agents ({stats.all})</option>
              <option value="active">Actifs ({stats.active})</option>
              <option value="draft">Brouillons ({stats.draft})</option>
              <option value="archived">Archivés ({stats.archived})</option>
            </select>

            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="recent">Plus récents</option>
              <option value="name">Nom A-Z</option>
              <option value="usage">Plus utilisés</option>
            </select>
          </div>
        </div>
      </div>

      {/* Grille d'agents */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {/* Carte de création */}
        <CreateAgentCard onClick={onCreateNew || (() => {})} />
        
        {/* Cartes d'agents */}
        {filteredAndSortedAgents.map((agent) => (
          <AgentCard
            key={agent.id}
            agent={agent}
            onSelect={handleAgentSelect}
            onDeploy={handleAgentDeploy}
            onEdit={handleAgentEdit}
          />
        ))}
      </div>

      {/* Message si aucun agent */}
      {filteredAndSortedAgents.length === 0 && agents.length > 0 && (
        <div className="text-center py-12">
          <div className="text-6xl mb-4">🤖</div>
          <h3 className="text-xl font-medium text-gray-900 mb-2">Aucun agent trouvé</h3>
          <p className="text-gray-600">Essayez de modifier vos filtres de recherche</p>
        </div>
      )}

      {/* Message si aucun agent créé */}
      {agents.length === 0 && (
        <div className="text-center py-12">
          <div className="text-6xl mb-4">🚀</div>
          <h3 className="text-xl font-medium text-gray-900 mb-2">Créez votre premier agent IA</h3>
          <p className="text-gray-600 mb-6">Commencez par créer un agent intelligent pour votre entreprise</p>
          <button
            onClick={onCreateNew}
            className="bg-gradient-to-r from-blue-500 to-blue-600 text-white px-6 py-3 rounded-lg font-medium hover:from-blue-600 hover:to-blue-700 transition-all duration-200 shadow-lg hover:shadow-xl"
          >
            ➕ Créer mon premier agent
          </button>
        </div>
      )}
    </div>
  );
};

export default AgentGallery;



