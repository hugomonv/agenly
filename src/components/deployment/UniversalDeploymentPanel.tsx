'use client';

import React, { useState, useEffect } from 'react';
import { Agent } from '@/lib/firebase-models';

interface PlatformConfig {
  id: string;
  name: string;
  type: 'web' | 'mobile' | 'social' | 'ecommerce' | 'crm' | 'messaging';
  capabilities: string[];
  limitations: string[];
  deploymentMethod: 'embed' | 'api' | 'plugin' | 'sdk' | 'container';
  costEstimate: {
    setup: number;
    monthly: number;
    perInteraction?: number;
  };
  technicalRequirements: {
    ssl: boolean;
    cors: boolean;
    webhooks: boolean;
    realtime: boolean;
  };
  compliance: {
    gdpr: boolean;
    ccpa: boolean;
    hipaa: boolean;
    soc2: boolean;
  };
}

interface DeploymentPackage {
  id: string;
  agentId: string;
  platformId: string;
  packageType: 'widget' | 'api' | 'plugin' | 'sdk' | 'container';
  files: {
    name: string;
    content: string;
    type: string;
    size: number;
  }[];
  installationInstructions: string;
  configurationGuide: string;
  supportContact: string;
  version: string;
  createdAt: string;
  expiresAt?: string;
}

interface UniversalDeploymentPanelProps {
  agent: Agent;
  onDeploymentComplete?: (deploymentPackage: DeploymentPackage) => void;
}

export default function UniversalDeploymentPanel({ agent, onDeploymentComplete }: UniversalDeploymentPanelProps) {
  const [platforms, setPlatforms] = useState<PlatformConfig[]>([]);
  const [selectedPlatform, setSelectedPlatform] = useState<PlatformConfig | null>(null);
  const [customizations, setCustomizations] = useState({
    branding: {
      primaryColor: '#007bff',
      secondaryColor: '#6c757d',
      fontFamily: 'system-ui, -apple-system, sans-serif'
    },
    features: {
      multiLanguage: false,
      darkMode: false,
      analytics: true,
      webhooks: false
    }
  });
  const [deploymentOptions, setDeploymentOptions] = useState({
    hosting: 'cloud' as 'cloud' | 'onpremise' | 'hybrid',
    scaling: 'auto' as 'auto' | 'manual',
    monitoring: true,
    backup: true
  });
  const [isDeploying, setIsDeploying] = useState(false);
  const [deploymentPackage, setDeploymentPackage] = useState<DeploymentPackage | null>(null);
  const [compatibility, setCompatibility] = useState<any>(null);
  const [costEstimate, setCostEstimate] = useState<any>(null);
  const [detectedPlatforms, setDetectedPlatforms] = useState<PlatformConfig[]>([]);
  const [detectionMessage, setDetectionMessage] = useState('');

  useEffect(() => {
    loadPlatforms();
  }, []);

  const loadPlatforms = async () => {
    try {
      const response = await fetch('/api/deploy/universal?action=platforms');
      const data = await response.json();
      if (data.success) {
        setPlatforms(data.platforms);
      }
    } catch (error) {
      console.error('Erreur lors du chargement des plateformes:', error);
    }
  };

  const detectPlatforms = async (message: string) => {
    if (!message.trim()) return;
    
    try {
      const response = await fetch(`/api/deploy/universal?action=detect&message=${encodeURIComponent(message)}`);
      const data = await response.json();
      if (data.success) {
        setDetectedPlatforms(data.detectedPlatforms);
        setDetectionMessage(message);
      }
    } catch (error) {
      console.error('Erreur lors de la détection:', error);
    }
  };

  const getRecommendations = async () => {
    try {
      const response = await fetch(`/api/deploy/universal?action=recommendations&businessType=${encodeURIComponent(agent.description || 'service')}`);
      const data = await response.json();
      if (data.success) {
        setDetectedPlatforms(data.recommendations);
        setDetectionMessage('Recommandations basées sur votre secteur');
      }
    } catch (error) {
      console.error('Erreur lors de la récupération des recommandations:', error);
    }
  };

  const estimateCosts = async (platform: PlatformConfig) => {
    try {
      const response = await fetch(`/api/deploy/universal?action=estimate&platformId=${platform.id}&interactions=1000`);
      const data = await response.json();
      if (data.success) {
        setCostEstimate(data.estimate);
      }
    } catch (error) {
      console.error('Erreur lors de l\'estimation des coûts:', error);
    }
  };

  const deployAgent = async () => {
    if (!selectedPlatform) return;

    setIsDeploying(true);
    try {
      const response = await fetch('/api/deploy/universal', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          agentId: agent.id,
          platformId: selectedPlatform.id,
          customizations,
          deploymentOptions
        }),
      });

      const data = await response.json();
      if (data.success) {
        setDeploymentPackage(data.package);
        setCompatibility(data.compatibility);
        if (onDeploymentComplete) {
          onDeploymentComplete(data.package);
        }
      } else {
        alert(`Erreur: ${data.error}`);
      }
    } catch (error) {
      console.error('Erreur lors du déploiement:', error);
      alert('Erreur lors du déploiement');
    } finally {
      setIsDeploying(false);
    }
  };

  const downloadFile = async (fileName: string) => {
    if (!deploymentPackage) return;

    try {
      const response = await fetch(`/api/deploy/packages/${deploymentPackage.id}/download?file=${fileName}`);
      if (response.ok) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = fileName;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
      }
    } catch (error) {
      console.error('Erreur lors du téléchargement:', error);
    }
  };

  const getPlatformIcon = (type: string) => {
    const icons: { [key: string]: string } = {
      'web': '🌐',
      'mobile': '📱',
      'social': '💬',
      'ecommerce': '🛒',
      'crm': '👥',
      'messaging': '📨'
    };
    return icons[type] || '🔧';
  };

  const getDeploymentMethodIcon = (method: string) => {
    const icons: { [key: string]: string } = {
      'embed': '📦',
      'api': '🔌',
      'plugin': '🔌',
      'sdk': '📚',
      'container': '🐳'
    };
    return icons[method] || '🔧';
  };

  return (
    <div className="space-y-6">
      {/* En-tête */}
      <div className="bg-white rounded-lg shadow-sm border p-6">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">
          🚀 Déploiement Universel
        </h2>
        <p className="text-gray-600">
          Déployez votre agent <strong>{agent.name}</strong> sur toutes les plateformes possibles
        </p>
      </div>

      {/* Détection automatique */}
      <div className="bg-white rounded-lg shadow-sm border p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">
          🔍 Détection Automatique
        </h3>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Décrivez où vous voulez déployer votre agent
            </label>
            <textarea
              className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="Ex: Je veux mettre ça sur mon site WordPress, ou J'aimerais l'avoir sur WhatsApp Business..."
              rows={3}
              onChange={(e) => detectPlatforms(e.target.value)}
            />
          </div>
          
          <button
            onClick={getRecommendations}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            💡 Obtenir des recommandations
          </button>

          {detectedPlatforms.length > 0 && (
            <div className="mt-4">
              <h4 className="font-medium text-gray-900 mb-2">
                Plateformes détectées pour: "{detectionMessage}"
              </h4>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                {detectedPlatforms.map((platform) => (
                  <div
                    key={platform.id}
                    className="p-3 border border-gray-200 rounded-lg cursor-pointer hover:border-blue-300 hover:bg-blue-50 transition-colors"
                    onClick={() => {
                      setSelectedPlatform(platform);
                      estimateCosts(platform);
                    }}
                  >
                    <div className="flex items-center space-x-2">
                      <span className="text-xl">{getPlatformIcon(platform.type)}</span>
                      <span className="font-medium">{platform.name}</span>
                    </div>
                    <div className="text-sm text-gray-600 mt-1">
                      {getDeploymentMethodIcon(platform.deploymentMethod)} {platform.deploymentMethod}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Sélection de plateforme */}
      <div className="bg-white rounded-lg shadow-sm border p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">
          🎯 Sélection de Plateforme
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {platforms.map((platform) => (
            <div
              key={platform.id}
              className={`p-4 border rounded-lg cursor-pointer transition-all ${
                selectedPlatform?.id === platform.id
                  ? 'border-blue-500 bg-blue-50 ring-2 ring-blue-200'
                  : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
              }`}
              onClick={() => {
                setSelectedPlatform(platform);
                estimateCosts(platform);
              }}
            >
              <div className="flex items-center space-x-3 mb-3">
                <span className="text-2xl">{getPlatformIcon(platform.type)}</span>
                <div>
                  <h4 className="font-semibold text-gray-900">{platform.name}</h4>
                  <p className="text-sm text-gray-600 capitalize">{platform.type}</p>
                </div>
              </div>
              
              <div className="space-y-2">
                <div className="flex items-center space-x-2">
                  <span className="text-sm">{getDeploymentMethodIcon(platform.deploymentMethod)}</span>
                  <span className="text-sm text-gray-600 capitalize">{platform.deploymentMethod}</span>
                </div>
                
                <div className="text-sm text-gray-600">
                  <div>Setup: ${platform.costEstimate.setup}</div>
                  <div>Mensuel: ${platform.costEstimate.monthly}</div>
                </div>
                
                <div className="flex flex-wrap gap-1">
                  {platform.capabilities.slice(0, 3).map((capability) => (
                    <span key={capability} className="px-2 py-1 bg-green-100 text-green-800 text-xs rounded">
                      {capability}
                    </span>
                  ))}
                  {platform.capabilities.length > 3 && (
                    <span className="px-2 py-1 bg-gray-100 text-gray-600 text-xs rounded">
                      +{platform.capabilities.length - 3}
                    </span>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Configuration */}
      {selectedPlatform && (
        <div className="bg-white rounded-lg shadow-sm border p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            ⚙️ Configuration - {selectedPlatform.name}
          </h3>
          
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Personnalisation */}
            <div>
              <h4 className="font-medium text-gray-900 mb-3">🎨 Personnalisation</h4>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Couleur primaire
                  </label>
                  <input
                    type="color"
                    value={customizations.branding.primaryColor}
                    onChange={(e) => setCustomizations({
                      ...customizations,
                      branding: { ...customizations.branding, primaryColor: e.target.value }
                    })}
                    className="w-full h-10 border border-gray-300 rounded"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Couleur secondaire
                  </label>
                  <input
                    type="color"
                    value={customizations.branding.secondaryColor}
                    onChange={(e) => setCustomizations({
                      ...customizations,
                      branding: { ...customizations.branding, secondaryColor: e.target.value }
                    })}
                    className="w-full h-10 border border-gray-300 rounded"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Police
                  </label>
                  <select
                    value={customizations.branding.fontFamily}
                    onChange={(e) => setCustomizations({
                      ...customizations,
                      branding: { ...customizations.branding, fontFamily: e.target.value }
                    })}
                    className="w-full p-2 border border-gray-300 rounded"
                  >
                    <option value="system-ui, -apple-system, sans-serif">Système</option>
                    <option value="Inter, sans-serif">Inter</option>
                    <option value="Roboto, sans-serif">Roboto</option>
                    <option value="Open Sans, sans-serif">Open Sans</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Fonctionnalités */}
            <div>
              <h4 className="font-medium text-gray-900 mb-3">🔧 Fonctionnalités</h4>
              <div className="space-y-3">
                {Object.entries(customizations.features).map(([key, value]) => (
                  <label key={key} className="flex items-center space-x-3">
                    <input
                      type="checkbox"
                      checked={value}
                      onChange={(e) => setCustomizations({
                        ...customizations,
                        features: { ...customizations.features, [key]: e.target.checked }
                      })}
                      className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    />
                    <span className="text-sm text-gray-700 capitalize">
                      {key.replace(/([A-Z])/g, ' $1').trim()}
                    </span>
                  </label>
                ))}
              </div>
            </div>
          </div>

          {/* Estimation des coûts */}
          {costEstimate && (
            <div className="mt-6 p-4 bg-gray-50 rounded-lg">
              <h4 className="font-medium text-gray-900 mb-2">💰 Estimation des coûts</h4>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                <div>
                  <div className="text-gray-600">Setup</div>
                  <div className="font-semibold">${costEstimate.setup}</div>
                </div>
                <div>
                  <div className="text-gray-600">Mensuel</div>
                  <div className="font-semibold">${costEstimate.monthly}</div>
                </div>
                <div>
                  <div className="text-gray-600">Interactions</div>
                  <div className="font-semibold">${costEstimate.total - costEstimate.setup - costEstimate.monthly}</div>
                </div>
                <div>
                  <div className="text-gray-600">Total</div>
                  <div className="font-semibold text-blue-600">${costEstimate.total}</div>
                </div>
              </div>
            </div>
          )}

          {/* Bouton de déploiement */}
          <div className="mt-6">
            <button
              onClick={deployAgent}
              disabled={isDeploying}
              className="w-full bg-blue-600 text-white py-3 px-6 rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {isDeploying ? '🚀 Déploiement en cours...' : `🚀 Déployer sur ${selectedPlatform.name}`}
            </button>
          </div>
        </div>
      )}

      {/* Package de déploiement */}
      {deploymentPackage && (
        <div className="bg-white rounded-lg shadow-sm border p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            📦 Package de Déploiement Créé
          </h3>
          
          <div className="space-y-4">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
              <div>
                <div className="text-gray-600">ID</div>
                <div className="font-mono text-xs">{deploymentPackage.id}</div>
              </div>
              <div>
                <div className="text-gray-600">Type</div>
                <div className="font-semibold capitalize">{deploymentPackage.packageType}</div>
              </div>
              <div>
                <div className="text-gray-600">Version</div>
                <div className="font-semibold">{deploymentPackage.version}</div>
              </div>
              <div>
                <div className="text-gray-600">Fichiers</div>
                <div className="font-semibold">{deploymentPackage.files.length}</div>
              </div>
            </div>

            <div>
              <h4 className="font-medium text-gray-900 mb-2">📁 Fichiers disponibles</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                {deploymentPackage.files.map((file) => (
                  <div key={file.name} className="flex items-center justify-between p-3 border border-gray-200 rounded">
                    <div className="flex items-center space-x-2">
                      <span className="text-sm">📄</span>
                      <span className="font-medium">{file.name}</span>
                      <span className="text-xs text-gray-500">({file.type})</span>
                    </div>
                    <button
                      onClick={() => downloadFile(file.name)}
                      className="px-3 py-1 bg-blue-600 text-white text-sm rounded hover:bg-blue-700 transition-colors"
                    >
                      Télécharger
                    </button>
                  </div>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              <div>
                <h4 className="font-medium text-gray-900 mb-2">📋 Instructions d'installation</h4>
                <div className="p-3 bg-gray-50 rounded text-sm whitespace-pre-wrap">
                  {deploymentPackage.installationInstructions}
                </div>
              </div>
              
              <div>
                <h4 className="font-medium text-gray-900 mb-2">⚙️ Guide de configuration</h4>
                <div className="p-3 bg-gray-50 rounded text-sm whitespace-pre-wrap">
                  {deploymentPackage.configurationGuide}
                </div>
              </div>
            </div>

            <div className="flex items-center justify-between p-4 bg-blue-50 rounded-lg">
              <div>
                <div className="font-medium text-blue-900">Support disponible</div>
                <div className="text-sm text-blue-700">{deploymentPackage.supportContact}</div>
              </div>
              <div className="text-sm text-blue-600">
                Expire le {new Date(deploymentPackage.expiresAt || '').toLocaleDateString()}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}




