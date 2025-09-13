'use client';

import React, { useState } from 'react';
import { Button } from '@/components/ui/Button';
import { Card, CardContent } from '@/components/ui/Card';
import { 
  Monitor, 
  Smartphone, 
  Code, 
  Eye,
  Copy,
  Download,
  ExternalLink,
  CheckCircle
} from 'lucide-react';

interface DeploymentOption {
  id: string;
  name: string;
  description: string;
  icon: React.ComponentType<any>;
  features: string[];
  code?: string;
  preview?: string;
}

interface DeploymentOptionsProps {
  agentId: string;
  onDeploymentSelect: (option: DeploymentOption) => void;
}

export function DeploymentOptions({ agentId, onDeploymentSelect }: DeploymentOptionsProps) {
  const [selectedOption, setSelectedOption] = useState<string | null>(null);
  const [generatedCode, setGeneratedCode] = useState<string>('');

  const deploymentOptions: DeploymentOption[] = [
    {
      id: 'widget',
      name: 'Widget Flottant',
      description: 'Bouton de chat en bas à droite de votre site',
      icon: Smartphone,
      features: [
        'Bouton flottant discret',
        'Ouverture en popup',
        'Design personnalisable',
        'Mobile-friendly'
      ]
    },
    {
      id: 'page',
      name: 'Page Dédiée',
      description: 'Page complète avec votre agent',
      icon: Monitor,
      features: [
        'Page complète dédiée',
        'Design sur mesure',
        'SEO optimisé',
        'Analytics intégrés'
      ]
    },
    {
      id: 'embed',
      name: 'Intégration Complète',
      description: 'Intégré dans votre design existant',
      icon: Code,
      features: [
        'Intégration native',
        'Design adaptatif',
        'Contrôle total',
        'Performance optimale'
      ]
    }
  ];

  const generateCode = (option: DeploymentOption) => {
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
    
    switch (option.id) {
      case 'widget':
        return `<!-- Widget Flottant AGENLY -->
<script>
  (function() {
    var script = document.createElement('script');
    script.src = '${baseUrl}/widget/agently-widget.js';
    script.setAttribute('data-agent-id', '${agentId}');
    script.setAttribute('data-theme', 'dark');
    script.setAttribute('data-position', 'bottom-right');
    document.head.appendChild(script);
  })();
</script>`;

      case 'page':
        return `<!-- Page Dédiée AGENLY -->
<iframe 
  src="${baseUrl}/agent/${agentId}" 
  width="100%" 
  height="600px" 
  frameborder="0"
  style="border-radius: 12px; box-shadow: 0 4px 20px rgba(0,0,0,0.1);"
>
</iframe>`;

      case 'embed':
        return `<!-- Intégration Complète AGENLY -->
<div id="agently-chat-${agentId}"></div>
<script>
  (function() {
    var script = document.createElement('script');
    script.src = '${baseUrl}/embed/agently-embed.js';
    script.setAttribute('data-agent-id', '${agentId}');
    script.setAttribute('data-container', 'agently-chat-${agentId}');
    script.setAttribute('data-theme', 'custom');
    document.head.appendChild(script);
  })();
</script>`;

      default:
        return '';
    }
  };

  const handleOptionSelect = (option: DeploymentOption) => {
    setSelectedOption(option.id);
    const code = generateCode(option);
    setGeneratedCode(code);
    onDeploymentSelect(option);
  };

  const copyToClipboard = () => {
    navigator.clipboard.writeText(generatedCode);
    // TODO: Afficher une notification de succès
  };

  return (
    <div className="space-y-6">
      <div className="text-center mb-6">
        <h3 className="text-lg font-semibold text-white mb-2">
          🚀 Déployer votre agent
        </h3>
        <p className="text-white/70 text-sm">
          Choisissez comment intégrer votre agent sur votre site
        </p>
      </div>

      {/* Options de déploiement */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {deploymentOptions.map((option) => {
          const Icon = option.icon;
          const isSelected = selectedOption === option.id;
          
          return (
            <Card 
              key={option.id}
              className={`glass hover-lift smooth-transition cursor-pointer ${
                isSelected 
                  ? 'border-blue-500/50 bg-blue-500/10' 
                  : 'border-white/10 hover:border-white/20'
              }`}
              onClick={() => handleOptionSelect(option)}
            >
              <CardContent className="p-4">
                <div className="text-center">
                  <div className={`w-12 h-12 mx-auto mb-3 rounded-lg flex items-center justify-center ${
                    isSelected 
                      ? 'bg-blue-500/20 text-blue-400' 
                      : 'bg-white/10 text-white/70'
                  }`}>
                    <Icon size={24} />
                  </div>
                  
                  <h4 className="font-medium text-white mb-2">
                    {option.name}
                  </h4>
                  
                  <p className="text-sm text-white/60 mb-3">
                    {option.description}
                  </p>

                  <div className="space-y-1">
                    {option.features.map((feature, index) => (
                      <div key={index} className="flex items-center text-xs text-white/50">
                        <CheckCircle size={12} className="mr-2 text-green-400" />
                        {feature}
                      </div>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Code généré */}
      {selectedOption && generatedCode && (
        <Card className="glass border-blue-500/30">
          <CardContent className="p-4">
            <div className="flex items-center justify-between mb-3">
              <h4 className="font-medium text-white">
                Code d'intégration généré
              </h4>
              <div className="flex space-x-2">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={copyToClipboard}
                  className="text-blue-400 hover:text-blue-300"
                >
                  <Copy size={14} className="mr-1" />
                  Copier
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-green-400 hover:text-green-300"
                >
                  <Download size={14} className="mr-1" />
                  Télécharger
                </Button>
              </div>
            </div>
            
            <div className="bg-black/50 rounded-lg p-4 overflow-x-auto">
              <pre className="text-sm text-green-400 font-mono">
                <code>{generatedCode}</code>
              </pre>
            </div>
            
            <div className="mt-3 text-center">
              <Button
                variant="primary"
                size="sm"
                className="mr-2"
              >
                <Eye size={14} className="mr-1" />
                Aperçu
              </Button>
              <Button
                variant="ghost"
                size="sm"
                className="text-white/70 hover:text-white"
              >
                <ExternalLink size={14} className="mr-1" />
                Documentation
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

