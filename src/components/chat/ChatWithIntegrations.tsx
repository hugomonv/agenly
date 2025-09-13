'use client';

import React, { useState } from 'react';
import { useChat } from '@/hooks/useChat';
import { ChatArea } from './ChatArea';
import { ChatInput } from './ChatInput';
import { IntegrationButtons } from './IntegrationButtons';
import { DeploymentOptions } from './DeploymentOptions';
import { Button } from '@/components/ui/Button';
import { Card, CardContent } from '@/components/ui/Card';
import { 
  ArrowLeft, 
  Settings, 
  Zap,
  Rocket,
  CheckCircle
} from 'lucide-react';

interface ChatWithIntegrationsProps {
  agentId?: string;
  className?: string;
}

type ChatStep = 'chat' | 'integrations' | 'deployment' | 'complete';

export function ChatWithIntegrations({ 
  agentId, 
  className 
}: ChatWithIntegrationsProps) {
  const { messages, loading, error, sendMessage } = useChat();
  const [currentStep, setCurrentStep] = useState<ChatStep>('chat');
  const [connectedIntegrations, setConnectedIntegrations] = useState<string[]>([]);
  const [selectedAgentId, setSelectedAgentId] = useState<string | null>(agentId || null);

  const handleSendMessage = async (message: string) => {
    await sendMessage(message);
    
    // Détecter si un agent a été créé
    if (message.includes('créé') && message.includes('agent')) {
      // Extraire l'ID de l'agent depuis le message ou la réponse
      // TODO: Améliorer la détection de l'ID d'agent
      if (!selectedAgentId) {
        setSelectedAgentId('new-agent'); // Placeholder
      }
    }
  };

  const handleIntegrationSelect = (integrationId: string) => {
    // Simuler la connexion
    setConnectedIntegrations(prev => 
      prev.includes(integrationId) 
        ? prev.filter(id => id !== integrationId)
        : [...prev, integrationId]
    );
    
    // Passer à l'étape suivante si c'est la première intégration
    if (connectedIntegrations.length === 0) {
      setCurrentStep('deployment');
    }
  };

  const handleDeploymentSelect = (option: any) => {
    setCurrentStep('complete');
  };

  const getStepTitle = () => {
    switch (currentStep) {
      case 'integrations':
        return 'Connecter vos outils';
      case 'deployment':
        return 'Déployer votre agent';
      case 'complete':
        return 'Agent configuré !';
      default:
        return 'Créer votre agent IA';
    }
  };

  const getStepIcon = () => {
    switch (currentStep) {
      case 'integrations':
        return <Zap size={20} />;
      case 'deployment':
        return <Rocket size={20} />;
      case 'complete':
        return <CheckCircle size={20} />;
      default:
        return <Settings size={20} />;
    }
  };

  return (
    <div className={`flex flex-col h-full ${className}`}>
      {/* Header avec navigation */}
      <div className="flex items-center justify-between p-4 border-b border-white/10">
        <div className="flex items-center space-x-3">
          {currentStep !== 'chat' && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setCurrentStep('chat')}
              className="text-white/70 hover:text-white"
            >
              <ArrowLeft size={16} />
            </Button>
          )}
          <div className="flex items-center space-x-2">
            {getStepIcon()}
            <h2 className="text-lg font-semibold text-white">
              {getStepTitle()}
            </h2>
          </div>
        </div>

        {/* Indicateur de progression */}
        <div className="flex items-center space-x-2">
          {['chat', 'integrations', 'deployment', 'complete'].map((step, index) => (
            <div
              key={step}
              className={`w-2 h-2 rounded-full ${
                currentStep === step 
                  ? 'bg-blue-400' 
                  : index < ['chat', 'integrations', 'deployment', 'complete'].indexOf(currentStep)
                    ? 'bg-green-400'
                    : 'bg-white/20'
              }`}
            />
          ))}
        </div>
      </div>

      {/* Contenu principal */}
      <div className="flex-1 overflow-hidden">
        {currentStep === 'chat' && (
          <div className="flex flex-col h-full">
            <ChatArea 
              messages={messages} 
              isLoading={loading}
              selectedAgent={selectedAgentId ? { id: selectedAgentId, name: 'Agent IA' } : undefined}
            />
            <ChatInput 
              onSendMessage={handleSendMessage}
              disabled={loading}
              isLoading={loading}
            />
          </div>
        )}

        {currentStep === 'integrations' && (
          <div className="p-6 overflow-y-auto">
            <IntegrationButtons
              onIntegrationSelect={handleIntegrationSelect}
              connectedIntegrations={connectedIntegrations}
            />
            
            {connectedIntegrations.length > 0 && (
              <div className="mt-6 text-center">
                <Button
                  variant="primary"
                  onClick={() => setCurrentStep('deployment')}
                  className="px-8"
                >
                  Continuer vers le déploiement
                  <Rocket size={16} className="ml-2" />
                </Button>
              </div>
            )}
          </div>
        )}

        {currentStep === 'deployment' && (
          <div className="p-6 overflow-y-auto">
            <DeploymentOptions
              agentId={selectedAgentId || 'default'}
              onDeploymentSelect={handleDeploymentSelect}
            />
          </div>
        )}

        {currentStep === 'complete' && (
          <div className="p-6 text-center">
            <Card className="glass border-green-500/30">
              <CardContent className="p-8">
                <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-green-500/20 flex items-center justify-center">
                  <CheckCircle size={32} className="text-green-400" />
                </div>
                
                <h3 className="text-xl font-semibold text-white mb-2">
                  🎉 Votre agent est prêt !
                </h3>
                
                <p className="text-white/70 mb-6">
                  Votre agent IA a été créé, configuré et déployé avec succès.
                  Il est maintenant opérationnel sur votre site web.
                </p>

                <div className="space-y-3">
                  <Button
                    variant="primary"
                    className="w-full"
                    onClick={() => setCurrentStep('chat')}
                  >
                    Tester votre agent
                  </Button>
                  
                  <Button
                    variant="ghost"
                    className="w-full text-white/70 hover:text-white"
                  >
                    Voir les analytics
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </div>

      {/* Messages d'erreur */}
      {error && (
        <div className="p-4 bg-red-500/20 border-t border-red-500/30">
          <div className="text-red-400 text-sm">{error}</div>
        </div>
      )}
    </div>
  );
}

