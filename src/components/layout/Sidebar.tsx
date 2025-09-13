'use client';

import React, { useState } from 'react';
import { useUser } from '@/components/providers/FirebaseUserProvider';
import { useAgents } from '@/components/providers/FirebaseAgentProvider';
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
  ChevronRight,
  Rocket
} from 'lucide-react';

interface SidebarProps {
  isCollapsed: boolean;
  onToggle: () => void;
  onNewChat: () => void;
  onSelectAgent: (agentId: string) => void;
  selectedAgentId?: string;
  activeMenu?: string;
  onMenuChange?: (menu: string) => void;
  onCreateAgent?: () => void;
  onSettings?: () => void;
}

export function Sidebar({ 
  isCollapsed, 
  onToggle, 
  onNewChat, 
  onSelectAgent, 
  selectedAgentId,
  activeMenu = 'chat',
  onMenuChange,
  onCreateAgent,
  onSettings
}: SidebarProps) {
  const { user, signOut } = useUser();
  const { agents } = useAgents();

  const menuItems = [
    { id: 'history', icon: History, label: 'Historique', action: () => onMenuChange?.('history') },
    { id: 'integrations', icon: Link, label: 'Intégrations', action: () => onMenuChange?.('integrations') },
    { id: 'settings', icon: Settings, label: 'Paramètres', action: () => onSettings?.() },
    { id: 'billing', icon: CreditCard, label: 'Abonnement', action: () => onMenuChange?.('billing') },
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

      {/* Chat Buttons */}
      <div className="p-4 space-y-2">
        {/* Nouveau Chat Button */}
        <Button
          onClick={onNewChat}
          className="w-full justify-start rounded-2xl btn-enhanced hover-glow smooth-transition"
          size="sm"
        >
          <Plus size={16} className="mr-2" />
          {!isCollapsed && 'Nouveau Chat'}
        </Button>
        
        {/* Chat Actuel Button */}
        <Button
          onClick={() => onMenuChange?.('chat')}
          variant="secondary"
          className="w-full justify-start rounded-2xl hover-lift smooth-transition"
          size="sm"
        >
          <MessageSquare size={16} className="mr-2" />
          {!isCollapsed && 'Chat Actuel'}
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




