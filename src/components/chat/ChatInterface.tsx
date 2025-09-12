'use client';

import React, { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Card, CardContent } from '@/components/ui/Card';
import { useChat } from '@/hooks/useChat';
import { Message } from '@/types';
import { formatRelativeTime } from '@/lib/utils';

interface ChatInterfaceProps {
  agentId?: string;
  initialMessages?: Message[];
  className?: string;
}

export function ChatInterface({ 
  agentId, 
  initialMessages = [], 
  className 
}: ChatInterfaceProps) {
  const [inputMessage, setInputMessage] = useState('');
  const { messages, loading, error, sendMessage, clearConversation } = useChat(agentId);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Initialize with provided messages
  useEffect(() => {
    if (initialMessages.length > 0) {
      // TODO: Set initial messages in the chat hook
    }
  }, [initialMessages]);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputMessage.trim() || loading) return;

    const message = inputMessage.trim();
    setInputMessage('');
    await sendMessage(message);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage(e);
    }
  };

  return (
    <Card className={`glass h-full flex flex-col ${className}`}>
      <CardContent className="flex-1 flex flex-col p-0">
        {/* Messages Area */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {messages.length === 0 ? (
            <div className="text-center text-white/70 py-8">
              <div className="text-lg mb-2">👋 Bonjour !</div>
              <div>Commencez une conversation avec votre agent IA</div>
            </div>
          ) : (
            messages.map((message) => (
              <div
                key={message.id}
                className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className={`max-w-[80%] rounded-lg px-4 py-2 ${
                    message.role === 'user'
                      ? 'bg-white text-black'
                      : 'bg-white/10 text-white'
                  }`}
                >
                  <div className="whitespace-pre-wrap">{message.content}</div>
                  <div className="text-xs opacity-70 mt-1">
                    {formatRelativeTime(message.timestamp)}
                  </div>
                </div>
              </div>
            ))
          )}
          
          {loading && (
            <div className="flex justify-start">
              <div className="bg-white/10 text-white rounded-lg px-4 py-2">
                <div className="flex items-center space-x-2">
                  <div className="spinner w-4 h-4"></div>
                  <span>L'agent réfléchit...</span>
                </div>
              </div>
            </div>
          )}
          
          <div ref={messagesEndRef} />
        </div>

        {/* Error Display */}
        {error && (
          <div className="px-4 py-2 bg-red-500/20 border-t border-red-500/30">
            <div className="text-red-400 text-sm">{error}</div>
          </div>
        )}

        {/* Input Area */}
        <div className="border-t border-white/10 p-4">
          <form onSubmit={handleSendMessage} className="flex space-x-2">
            <input
              type="text"
              value={inputMessage}
              onChange={(e) => setInputMessage(e.target.value)}
              placeholder="Tapez votre message..."
              disabled={loading}
              onKeyPress={handleKeyPress}
              className="flex-1 w-full px-4 py-3 rounded-lg border border-white/20 bg-white/5 backdrop-blur-sm text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-white/20 focus:border-white/30 transition-all duration-200"
            />
            <Button
              type="submit"
              disabled={!inputMessage.trim() || loading}
              loading={loading}
            >
              Envoyer
            </Button>
          </form>
          
          {/* Clear Conversation Button */}
          {messages.length > 0 && (
            <div className="mt-2 flex justify-end">
              <Button
                variant="ghost"
                size="sm"
                onClick={clearConversation}
                className="text-white/70 hover:text-white"
              >
                Effacer la conversation
              </Button>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
