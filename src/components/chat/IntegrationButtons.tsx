'use client';

import React from 'react';
import { Button } from '@/components/ui/Button';
import { Card, CardContent } from '@/components/ui/Card';
import { 
  Calendar, 
  Mail, 
  Globe, 
  Smartphone, 
  Zap,
  CheckCircle,
  ExternalLink
} from 'lucide-react';

interface IntegrationOption {
  id: string;
  name: string;
  description: string;
  icon: React.ComponentType<any>;
  connected: boolean;
  onConnect: () => void;
}

interface IntegrationButtonsProps {
  onIntegrationSelect: (integrationId: string) => void;
  connectedIntegrations?: string[];
}

export function IntegrationButtons({ 
  onIntegrationSelect, 
  connectedIntegrations = [] 
}: IntegrationButtonsProps) {
  
  const integrations: IntegrationOption[] = [
    {
      id: 'google-calendar',
      name: 'Google Calendar',
      description: 'Gérer les réservations automatiquement',
      icon: Calendar,
      connected: connectedIntegrations.includes('google-calendar'),
      onConnect: () => onIntegrationSelect('google-calendar')
    },
    {
      id: 'gmail',
      name: 'Gmail',
      description: 'Envoyer des confirmations par email',
      icon: Mail,
      connected: connectedIntegrations.includes('gmail'),
      onConnect: () => onIntegrationSelect('gmail')
    },
    {
      id: 'google-drive',
      name: 'Google Drive',
      description: 'Sauvegarder les données clients',
      icon: Globe,
      connected: connectedIntegrations.includes('google-drive'),
      onConnect: () => onIntegrationSelect('google-drive')
    },
    {
      id: 'whatsapp',
      name: 'WhatsApp Business',
      description: 'Notifications SMS et WhatsApp',
      icon: Smartphone,
      connected: connectedIntegrations.includes('whatsapp'),
      onConnect: () => onIntegrationSelect('whatsapp')
    }
  ];

  return (
    <div className="space-y-4">
      <div className="text-center mb-6">
        <h3 className="text-lg font-semibold text-white mb-2">
          🔗 Connecter vos outils
        </h3>
        <p className="text-white/70 text-sm">
          Choisissez les intégrations qui vous intéressent
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {integrations.map((integration) => {
          const Icon = integration.icon;
          return (
            <Card 
              key={integration.id}
              className={`glass hover-lift smooth-transition cursor-pointer ${
                integration.connected 
                  ? 'border-green-500/50 bg-green-500/10' 
                  : 'border-white/10 hover:border-white/20'
              }`}
              onClick={integration.onConnect}
            >
              <CardContent className="p-4">
                <div className="flex items-center space-x-3">
                  <div className={`p-2 rounded-lg ${
                    integration.connected 
                      ? 'bg-green-500/20 text-green-400' 
                      : 'bg-white/10 text-white/70'
                  }`}>
                    <Icon size={20} />
                  </div>
                  
                  <div className="flex-1">
                    <div className="flex items-center space-x-2">
                      <h4 className="font-medium text-white">
                        {integration.name}
                      </h4>
                      {integration.connected && (
                        <CheckCircle size={16} className="text-green-400" />
                      )}
                    </div>
                    <p className="text-sm text-white/60">
                      {integration.description}
                    </p>
                  </div>

                  <div className="flex-shrink-0">
                    {integration.connected ? (
                      <div className="text-green-400 text-xs font-medium">
                        Connecté
                      </div>
                    ) : (
                      <Button
                        variant="ghost"
                        size="sm"
                        className="text-blue-400 hover:text-blue-300"
                      >
                        <Zap size={14} className="mr-1" />
                        Connecter
                      </Button>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      <div className="text-center pt-4">
        <p className="text-white/50 text-xs">
          Vous pourrez ajouter d'autres intégrations plus tard
        </p>
      </div>
    </div>
  );
}

