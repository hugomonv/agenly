'use client';

import React, { useState } from 'react';
import { useUser } from '@/components/providers/UserProvider';
import { useAgents } from '@/components/providers/AgentsProvider';
import { Button } from '@/components/ui/Button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/Card';
import { Sidebar } from '@/components/layout/Sidebar';
import { Header } from '@/components/layout/Header';
import { ChatArea } from '@/components/chat/ChatArea';
import { ChatInput } from '@/components/chat/ChatInput';
// import { useChat } from '@/hooks/useChat';
import { Message } from '@/types';

export default function HomePage() {
  const { user, loading: userLoading, signIn, signUp, signInWithGoogle, signOut } = useUser();
  const { agents, loading: agentsLoading, createAgent } = useAgents();
  // const { messages, loading: chatLoading, sendMessage, clearConversation } = useChat();
  
  // Mock chat state for now
  const [messages, setMessages] = useState<Message[]>([]);
  const [chatLoading, setChatLoading] = useState(false);
  
  const sendMessage = async (message: string, agentId?: string) => {
    if (!message.trim()) return;
    
    const userMessage: Message = {
      id: `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      role: 'user',
      content: message,
      timestamp: new Date(),
    };
    
    setMessages(prev => [...prev, userMessage]);
    setChatLoading(true);
    
    // Simulate AI response
    setTimeout(() => {
      const assistantMessage: Message = {
        id: `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        role: 'assistant',
        content: `Merci pour votre message : "${message}". Je suis votre agent IA et je suis là pour vous aider !`,
        timestamp: new Date(),
        metadata: {
          model: 'gpt-4',
          temperature: 0.7,
        },
      };
      
      setMessages(prev => [...prev, assistantMessage]);
      setChatLoading(false);
    }, 1500);
  };
  
  const clearConversation = () => {
    setMessages([]);
  };
  
  // UI State
  const [isSignUp, setIsSignUp] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  
  // Chat State
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [selectedAgentId, setSelectedAgentId] = useState<string | undefined>();
  const [currentChatTitle, setCurrentChatTitle] = useState('Nouveau Chat');

  // Chat handlers
  const handleNewChat = () => {
    clearConversation();
    setSelectedAgentId(undefined);
    setCurrentChatTitle('Nouveau Chat');
  };

  const handleSelectAgent = (agentId: string) => {
    setSelectedAgentId(agentId);
    const agent = agents.find(a => a.id === agentId);
    setCurrentChatTitle(agent?.name || 'Nouveau Chat');
    clearConversation();
  };

  const handleSendMessage = async (message: string) => {
    await sendMessage(message, selectedAgentId);
  };

  const handleShare = () => {
    // TODO: Implement share functionality
    console.log('Share chat');
  };

  const handleDelete = () => {
    clearConversation();
    setCurrentChatTitle('Nouveau Chat');
  };

  const handleSettings = () => {
    // TODO: Implement settings
    console.log('Open settings');
  };

  // Auth handlers
  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    try {
      if (isSignUp) {
        await signUp(email, password, displayName);
      } else {
        await signIn(email, password);
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    setIsLoading(true);
    setError('');

    try {
      await signInWithGoogle();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  if (userLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-black">
        <div className="spinner"></div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4 bg-black">
        <div className="w-full max-w-md">
          <div className="text-center mb-8">
            <h1 className="text-4xl font-bold mb-4 bg-gradient-to-r from-white to-gray-300 bg-clip-text text-transparent">
              AGENLY
            </h1>
            <p className="text-white/70 text-lg">
              Créez vos agents IA personnalisés
            </p>
          </div>

          <Card className="glass">
            <CardHeader>
              <CardTitle className="text-center">
                {isSignUp ? 'Créer un compte' : 'Se connecter'}
              </CardTitle>
              <CardDescription className="text-center">
                {isSignUp 
                  ? 'Rejoignez AGENLY et créez vos premiers agents IA'
                  : 'Accédez à votre interface de chat IA'
                }
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleAuth} className="space-y-4">
                {isSignUp && (
                  <input
                    type="text"
                    value={displayName}
                    onChange={(e) => setDisplayName(e.target.value)}
                    placeholder="Nom complet"
                    required
                    className="w-full px-4 py-3 rounded-lg border border-white/20 bg-white/5 backdrop-blur-sm text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-white/20 focus:border-white/30 transition-all duration-200"
                  />
                )}
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Email"
                  required
                  className="w-full px-4 py-3 rounded-lg border border-white/20 bg-white/5 backdrop-blur-sm text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-white/20 focus:border-white/30 transition-all duration-200"
                />
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Mot de passe"
                  required
                  className="w-full px-4 py-3 rounded-lg border border-white/20 bg-white/5 backdrop-blur-sm text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-white/20 focus:border-white/30 transition-all duration-200"
                />
                
                {error && (
                  <div className="text-red-400 text-sm text-center">
                    {error}
                  </div>
                )}

                <Button
                  type="submit"
                  className="w-full"
                  loading={isLoading}
                  disabled={isLoading}
                >
                  {isSignUp ? 'Créer le compte' : 'Se connecter'}
                </Button>
              </form>

              <div className="mt-4">
                <div className="relative">
                  <div className="absolute inset-0 flex items-center">
                    <div className="w-full border-t border-white/20" />
                  </div>
                  <div className="relative flex justify-center text-sm">
                    <span className="px-2 bg-black text-white/70">ou</span>
                  </div>
                </div>

                <Button
                  variant="secondary"
                  className="w-full mt-4"
                  onClick={handleGoogleSignIn}
                  disabled={isLoading}
                >
                  <svg className="w-5 h-5 mr-2" viewBox="0 0 24 24">
                    <path
                      fill="currentColor"
                      d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                    />
                    <path
                      fill="currentColor"
                      d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                    />
                    <path
                      fill="currentColor"
                      d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                    />
                    <path
                      fill="currentColor"
                      d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                    />
                  </svg>
                  Continuer avec Google
                </Button>
              </div>

              <div className="mt-6 text-center">
                <button
                  onClick={() => setIsSignUp(!isSignUp)}
                  className="text-white/70 hover:text-white transition-colors"
                >
                  {isSignUp 
                    ? 'Déjà un compte ? Se connecter'
                    : 'Pas de compte ? Créer un compte'
                  }
                </button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  // ChatGPT-like Interface
  return (
    <div className="h-screen bg-black flex">
      {/* Sidebar */}
      <Sidebar
        isCollapsed={isSidebarCollapsed}
        onToggle={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
        onNewChat={handleNewChat}
        onSelectAgent={handleSelectAgent}
        selectedAgentId={selectedAgentId}
      />

      {/* Main Chat Area */}
      <div className="flex-1 flex flex-col">
        {/* Header */}
        <Header
          title={currentChatTitle}
          onShare={handleShare}
          onDelete={handleDelete}
          onSettings={handleSettings}
        />

        {/* Chat Area */}
        <ChatArea
          messages={messages}
          isLoading={chatLoading}
          selectedAgent={selectedAgentId ? agents.find(a => a.id === selectedAgentId) : undefined}
        />

        {/* Chat Input */}
        <ChatInput
          onSendMessage={handleSendMessage}
          disabled={chatLoading}
          isLoading={chatLoading}
        />
      </div>
    </div>
  );
}
