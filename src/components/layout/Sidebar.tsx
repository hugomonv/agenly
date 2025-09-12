'use client';

import React, { useState } from 'react';
import { useUser } from '@/components/providers/UserProvider';
import { useAgents } from '@/components/providers/AgentsProvider';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { 
  MessageSquare, 
  Plus, 
  History, 
  Bot, 
  Settings, 
  Link, 
  CreditCard,
  User,
  LogOut,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';

interface SidebarProps {
  isCollapsed: boolean;
  onToggle: () => void;
  onNewChat: () => void;
  onSelectAgent: (agentId: string) => void;
  selectedAgentId?: string;
}

export function Sidebar({ 
  isCollapsed, 
  onToggle, 
  onNewChat, 
  onSelectAgent, 
  selectedAgentId 
}: SidebarProps) {
  const { user, signOut } = useUser();
  const { agents } = useAgents();
  const [activeMenu, setActiveMenu] = useState('chat');

  const menuItems = [
    { id: 'chat', icon: MessageSquare, label: 'Nouveau Chat', action: onNewChat },
    { id: 'history', icon: History, label: 'Historique', action: () => setActiveMenu('history') },
    { id: 'agents', icon: Bot, label: 'Mes Agents', action: () => setActiveMenu('agents') },
    { id: 'integrations', icon: Link, label: 'Intégrations', action: () => setActiveMenu('integrations') },
    { id: 'settings', icon: Settings, label: 'Paramètres', action: () => setActiveMenu('settings') },
    { id: 'billing', icon: CreditCard, label: 'Abonnement', action: () => setActiveMenu('billing') },
  ];

  const handleSignOut = async () => {
    try {
      await signOut();
    } catch (error) {
      console.error('Erreur de déconnexion:', error);
    }
  };

  return (
    <div className={`bg-black/50 backdrop-blur-sm border-r border-white/10 transition-all duration-500 ease-in-out ${
      isCollapsed ? 'w-16' : 'w-64'
    } flex flex-col h-full slide-in-left`}>
      {/* Header */}
      <div className="p-4 border-b border-white/10">
        <div className="flex items-center justify-between">
          {!isCollapsed && (
            <h1 className="text-xl font-bold bg-gradient-to-r from-white to-gray-300 bg-clip-text text-transparent text-shimmer">
              AGENLY
            </h1>
          )}
          <Button
            variant="ghost"
            size="sm"
            onClick={onToggle}
            className="p-2 rounded-full hover-lift smooth-transition"
          >
            {isCollapsed ? <ChevronRight size={16} /> : <ChevronLeft size={16} />}
          </Button>
        </div>
      </div>

      {/* New Chat Button */}
      <div className="p-4">
        <Button
          onClick={onNewChat}
          className="w-full justify-start rounded-2xl btn-enhanced hover-glow smooth-transition"
          size="sm"
        >
          <Plus size={16} className="mr-2" />
          {!isCollapsed && 'Nouveau Chat'}
        </Button>
      </div>

      {/* Menu Items */}
      <div className="flex-1 px-2">
        {menuItems.map((item) => {
          const Icon = item.icon;
          return (
            <button
              key={item.id}
              onClick={item.action}
              className={`w-full flex items-center px-3 py-2 mb-1 rounded-2xl transition-all duration-300 hover-lift smooth-transition ${
                activeMenu === item.id
                  ? 'bg-white/10 text-white glow'
                  : 'text-white/70 hover:bg-white/5 hover:text-white'
              }`}
            >
              <Icon size={16} className="mr-3 flex-shrink-0" />
              {!isCollapsed && <span className="text-sm">{item.label}</span>}
            </button>
          );
        })}
      </div>

      {/* Agents List */}
      {activeMenu === 'agents' && !isCollapsed && (
        <div className="px-2 pb-4">
          <div className="text-xs text-white/50 uppercase tracking-wider mb-2 px-3">
            Mes Agents
          </div>
          <div className="space-y-1 max-h-48 overflow-y-auto">
            {agents.map((agent) => (
              <button
                key={agent.id}
                onClick={() => onSelectAgent(agent.id)}
                className={`w-full flex items-center px-3 py-2 rounded-lg transition-all duration-200 text-left ${
                  selectedAgentId === agent.id
                    ? 'bg-white/10 text-white'
                    : 'text-white/70 hover:bg-white/5 hover:text-white'
                }`}
              >
                <Bot size={14} className="mr-2 flex-shrink-0" />
                <div className="flex-1 min-w-0">
                  <div className="text-sm truncate">{agent.name}</div>
                  <div className="text-xs text-white/50 truncate">{agent.description}</div>
                </div>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* User Profile */}
      <div className="p-4 border-t border-white/10">
        <div className="flex items-center space-x-3">
          <div className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center">
            <User size={16} />
          </div>
          {!isCollapsed && (
            <div className="flex-1 min-w-0">
              <div className="text-sm font-medium text-white truncate">
                {user?.displayName || user?.email}
              </div>
              <div className="text-xs text-white/50">
                {agents.length} agent{agents.length > 1 ? 's' : ''}
              </div>
            </div>
          )}
          <Button
            variant="ghost"
            size="sm"
            onClick={handleSignOut}
            className="p-2"
          >
            <LogOut size={16} />
          </Button>
        </div>
      </div>
    </div>
  );
}
