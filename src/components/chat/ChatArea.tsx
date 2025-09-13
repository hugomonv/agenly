'use client';

import React, { useEffect, useRef } from 'react';
import { Message } from '@/types/frontend';
import { MessageBubble } from './MessageBubble';
import { Bot, Sparkles } from 'lucide-react';

interface ChatAreaProps {
  messages: Message[];
  isLoading?: boolean;
  selectedAgent?: {
    id: string;
    name: string;
    description: string;
  };
}

export function ChatArea({ messages, isLoading, selectedAgent }: ChatAreaProps) {
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isLoading]);

  return (
    <div className="flex-1 overflow-y-auto p-4">
      <div className="max-w-4xl mx-auto">
        {/* Welcome Message */}
        {messages.length === 0 && !isLoading && (
          <div className="text-center py-12 fade-in">
            <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-white/10 flex items-center justify-center hover-lift smooth-transition glow">
              <Sparkles className="w-10 h-10 text-white" />
            </div>
            <h2 className="text-3xl font-semibold text-white mb-3 text-shimmer">
              Bienvenue sur AGENLY
            </h2>
            <p className="text-white/70 mb-8 max-w-md mx-auto text-lg">
              {selectedAgent 
                ? `Discutez avec ${selectedAgent.name} - ${selectedAgent.description}`
                : 'Commencez une conversation avec votre agent IA personnalisé'
              }
            </p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-2xl mx-auto">
              <div className="p-6 bg-white/5 rounded-3xl border border-white/10 card-enhanced hover-glow">
                <h3 className="font-medium text-white mb-3 text-lg">💡 Suggestions</h3>
                <p className="text-sm text-white/70">
                  "Crée un plan marketing pour mon entreprise"
                </p>
              </div>
              <div className="p-6 bg-white/5 rounded-3xl border border-white/10 card-enhanced hover-glow">
                <h3 className="font-medium text-white mb-3 text-lg">🔧 Intégrations</h3>
                <p className="text-sm text-white/70">
                  "Planifie une réunion dans mon calendrier"
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Messages */}
        {messages.map((message) => (
          <MessageBubble
            key={message.id}
            message={message}
          />
        ))}

        {/* Loading Indicator */}
        {isLoading && (
          <div className="flex justify-start mb-6 fade-in">
            <div className="flex items-start space-x-3">
              <div className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center smooth-transition hover-lift">
                <Bot size={18} className="text-white" />
              </div>
              <div className="bg-white/10 text-white p-4 rounded-3xl message-bubble hover-glow">
                <div className="flex items-center space-x-3">
                  <div className="flex space-x-1">
                    <div className="w-2 h-2 bg-white/50 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
                    <div className="w-2 h-2 bg-white/50 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
                    <div className="w-2 h-2 bg-white/50 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
                  </div>
                  <span className="text-sm text-white/70">L'agent réfléchit...</span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Scroll anchor */}
        <div ref={messagesEndRef} />
      </div>
    </div>
  );
}




