import { Agent } from '../firebase-models';

export interface PlatformConfig {
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

export interface DeploymentPackage {
  id: string;
  agentId: string;
  platformId: string;
  packageType: 'widget' | 'api' | 'plugin' | 'sdk' | 'container';
  files: {
    name: string;
    content: string;
    type: 'html' | 'css' | 'js' | 'json' | 'dockerfile' | 'yaml' | 'php' | 'py' | 'java';
    size: number;
  }[];
  installationInstructions: string;
  configurationGuide: string;
  apiDocumentation?: string;
  sdkDocumentation?: string;
  supportContact: string;
  version: string;
  createdAt: Date;
  expiresAt?: Date;
}

export interface DeploymentRequest {
  agentId: string;
  platformId: string;
  customizations?: {
    branding?: {
      primaryColor: string;
      secondaryColor: string;
      logo?: string;
      fontFamily: string;
    };
    features?: {
      multiLanguage: boolean;
      darkMode: boolean;
      analytics: boolean;
      webhooks: boolean;
    };
    integrations?: {
      crm?: string;
      analytics?: string;
      payment?: string;
    };
  };
  deploymentOptions?: {
    hosting: 'cloud' | 'onpremise' | 'hybrid';
    scaling: 'auto' | 'manual';
    monitoring: boolean;
    backup: boolean;
  };
}

export class UniversalDeploymentEngine {
  private static instance: UniversalDeploymentEngine;
  private platforms: Map<string, PlatformConfig> = new Map();
  private deployments: Map<string, DeploymentPackage> = new Map();

  private constructor() {
    this.initializePlatforms();
  }

  public static getInstance(): UniversalDeploymentEngine {
    if (!UniversalDeploymentEngine.instance) {
      UniversalDeploymentEngine.instance = new UniversalDeploymentEngine();
    }
    return UniversalDeploymentEngine.instance;
  }

  private initializePlatforms() {
    // Plateformes Web
    this.platforms.set('website-widget', {
      id: 'website-widget',
      name: 'Website Widget',
      type: 'web',
      capabilities: ['chat', 'forms', 'analytics', 'customization'],
      limitations: ['offline-mode', 'native-features'],
      deploymentMethod: 'embed',
      costEstimate: { setup: 0, monthly: 0 },
      technicalRequirements: { ssl: true, cors: true, webhooks: true, realtime: true },
      compliance: { gdpr: true, ccpa: true, hipaa: false, soc2: false }
    });

    this.platforms.set('wordpress-plugin', {
      id: 'wordpress-plugin',
      name: 'WordPress Plugin',
      type: 'web',
      capabilities: ['chat', 'forms', 'analytics', 'seo', 'woocommerce'],
      limitations: ['performance', 'security'],
      deploymentMethod: 'plugin',
      costEstimate: { setup: 0, monthly: 0 },
      technicalRequirements: { ssl: true, cors: false, webhooks: true, realtime: false },
      compliance: { gdpr: true, ccpa: true, hipaa: false, soc2: false }
    });

    this.platforms.set('shopify-app', {
      id: 'shopify-app',
      name: 'Shopify App',
      type: 'ecommerce',
      capabilities: ['chat', 'product-recommendations', 'cart-management', 'analytics'],
      limitations: ['custom-themes', 'advanced-integrations'],
      deploymentMethod: 'plugin',
      costEstimate: { setup: 0, monthly: 29.99 },
      technicalRequirements: { ssl: true, cors: true, webhooks: true, realtime: true },
      compliance: { gdpr: true, ccpa: true, hipaa: false, soc2: true }
    });

    // Plateformes Social
    this.platforms.set('whatsapp-business', {
      id: 'whatsapp-business',
      name: 'WhatsApp Business',
      type: 'messaging',
      capabilities: ['chat', 'media', 'templates', 'buttons'],
      limitations: ['rich-media', 'custom-ui'],
      deploymentMethod: 'api',
      costEstimate: { setup: 0, monthly: 0, perInteraction: 0.005 },
      technicalRequirements: { ssl: true, cors: false, webhooks: true, realtime: true },
      compliance: { gdpr: true, ccpa: true, hipaa: false, soc2: true }
    });

    this.platforms.set('facebook-messenger', {
      id: 'facebook-messenger',
      name: 'Facebook Messenger',
      type: 'messaging',
      capabilities: ['chat', 'rich-cards', 'quick-replies', 'persistent-menu'],
      limitations: ['privacy', 'business-verification'],
      deploymentMethod: 'api',
      costEstimate: { setup: 0, monthly: 0 },
      technicalRequirements: { ssl: true, cors: false, webhooks: true, realtime: true },
      compliance: { gdpr: true, ccpa: true, hipaa: false, soc2: true }
    });

    this.platforms.set('telegram-bot', {
      id: 'telegram-bot',
      name: 'Telegram Bot',
      type: 'messaging',
      capabilities: ['chat', 'inline-keyboards', 'commands', 'channels'],
      limitations: ['business-features', 'analytics'],
      deploymentMethod: 'api',
      costEstimate: { setup: 0, monthly: 0 },
      technicalRequirements: { ssl: true, cors: false, webhooks: true, realtime: true },
      compliance: { gdpr: true, ccpa: true, hipaa: false, soc2: false }
    });

    // Plateformes CRM
    this.platforms.set('hubspot-app', {
      id: 'hubspot-app',
      name: 'HubSpot App',
      type: 'crm',
      capabilities: ['chat', 'lead-management', 'workflow-automation', 'analytics'],
      limitations: ['custom-fields', 'advanced-integrations'],
      deploymentMethod: 'plugin',
      costEstimate: { setup: 0, monthly: 0 },
      technicalRequirements: { ssl: true, cors: true, webhooks: true, realtime: true },
      compliance: { gdpr: true, ccpa: true, hipaa: false, soc2: true }
    });

    this.platforms.set('salesforce-app', {
      id: 'salesforce-app',
      name: 'Salesforce App',
      type: 'crm',
      capabilities: ['chat', 'lead-management', 'workflow-automation', 'lightning-components'],
      limitations: ['custom-objects', 'advanced-permissions'],
      deploymentMethod: 'plugin',
      costEstimate: { setup: 0, monthly: 0 },
      technicalRequirements: { ssl: true, cors: true, webhooks: true, realtime: true },
      compliance: { gdpr: true, ccpa: true, hipaa: true, soc2: true }
    });

    // Plateformes Mobile
    this.platforms.set('react-native-sdk', {
      id: 'react-native-sdk',
      name: 'React Native SDK',
      type: 'mobile',
      capabilities: ['chat', 'push-notifications', 'offline-mode', 'native-features'],
      limitations: ['platform-specific', 'app-store-approval'],
      deploymentMethod: 'sdk',
      costEstimate: { setup: 0, monthly: 0 },
      technicalRequirements: { ssl: true, cors: false, webhooks: true, realtime: true },
      compliance: { gdpr: true, ccpa: true, hipaa: false, soc2: false }
    });

    this.platforms.set('flutter-sdk', {
      id: 'flutter-sdk',
      name: 'Flutter SDK',
      type: 'mobile',
      capabilities: ['chat', 'push-notifications', 'offline-mode', 'cross-platform'],
      limitations: ['platform-specific', 'app-store-approval'],
      deploymentMethod: 'sdk',
      costEstimate: { setup: 0, monthly: 0 },
      technicalRequirements: { ssl: true, cors: false, webhooks: true, realtime: true },
      compliance: { gdpr: true, ccpa: true, hipaa: false, soc2: false }
    });

    // Plateformes Container
    this.platforms.set('docker-container', {
      id: 'docker-container',
      name: 'Docker Container',
      type: 'web',
      capabilities: ['chat', 'analytics', 'custom-integrations', 'scaling'],
      limitations: ['infrastructure-management', 'security'],
      deploymentMethod: 'container',
      costEstimate: { setup: 0, monthly: 0 },
      technicalRequirements: { ssl: true, cors: true, webhooks: true, realtime: true },
      compliance: { gdpr: true, ccpa: true, hipaa: true, soc2: true }
    });

    this.platforms.set('kubernetes-helm', {
      id: 'kubernetes-helm',
      name: 'Kubernetes Helm Chart',
      type: 'web',
      capabilities: ['chat', 'analytics', 'auto-scaling', 'high-availability'],
      limitations: ['complexity', 'infrastructure-requirements'],
      deploymentMethod: 'container',
      costEstimate: { setup: 0, monthly: 0 },
      technicalRequirements: { ssl: true, cors: true, webhooks: true, realtime: true },
      compliance: { gdpr: true, ccpa: true, hipaa: true, soc2: true }
    });
  }

  /**
   * Détecter la plateforme cible depuis une conversation
   */
  detectPlatformFromConversation(message: string): PlatformConfig[] {
    const detectedPlatforms: PlatformConfig[] = [];
    const messageLower = message.toLowerCase();

    // Mots-clés de détection
    const platformKeywords = {
      'website-widget': ['site web', 'website', 'site internet', 'page web'],
      'wordpress-plugin': ['wordpress', 'wp', 'blog'],
      'shopify-app': ['shopify', 'boutique en ligne', 'e-commerce', 'ecommerce'],
      'whatsapp-business': ['whatsapp', 'whats app', 'wa'],
      'facebook-messenger': ['facebook', 'messenger', 'fb messenger'],
      'telegram-bot': ['telegram', 'tg'],
      'hubspot-app': ['hubspot', 'crm'],
      'salesforce-app': ['salesforce', 'sfdc'],
      'react-native-sdk': ['react native', 'mobile app', 'application mobile'],
      'flutter-sdk': ['flutter', 'mobile app', 'application mobile'],
      'docker-container': ['docker', 'container', 'serveur'],
      'kubernetes-helm': ['kubernetes', 'k8s', 'helm', 'cluster']
    };

    for (const [platformId, keywords] of Object.entries(platformKeywords)) {
      if (keywords.some(keyword => messageLower.includes(keyword))) {
        const platform = this.platforms.get(platformId);
        if (platform) {
          detectedPlatforms.push(platform);
        }
      }
    }

    return detectedPlatforms;
  }

  /**
   * Obtenir toutes les plateformes disponibles
   */
  getAllPlatforms(): PlatformConfig[] {
    return Array.from(this.platforms.values());
  }

  /**
   * Obtenir une plateforme par ID
   */
  getPlatform(platformId: string): PlatformConfig | null {
    return this.platforms.get(platformId) || null;
  }

  /**
   * Recommander des plateformes selon le secteur métier
   */
  recommendPlatforms(businessType: string): PlatformConfig[] {
    const recommendations: { [key: string]: string[] } = {
      'restaurant': ['website-widget', 'whatsapp-business', 'facebook-messenger'],
      'ecommerce': ['shopify-app', 'website-widget', 'whatsapp-business'],
      'service': ['website-widget', 'hubspot-app', 'whatsapp-business'],
      'consulting': ['hubspot-app', 'salesforce-app', 'website-widget'],
      'retail': ['shopify-app', 'website-widget', 'whatsapp-business'],
      'healthcare': ['website-widget', 'hubspot-app', 'docker-container'],
      'education': ['website-widget', 'telegram-bot', 'react-native-sdk'],
      'real-estate': ['website-widget', 'hubspot-app', 'facebook-messenger']
    };

    const businessTypeLower = businessType.toLowerCase();
    const recommendedIds = recommendations[businessTypeLower] || ['website-widget'];

    return recommendedIds
      .map(id => this.platforms.get(id))
      .filter(platform => platform !== undefined) as PlatformConfig[];
  }

  /**
   * Valider la compatibilité entre un agent et une plateforme
   */
  validateCompatibility(agent: Agent, platform: PlatformConfig): {
    compatible: boolean;
    issues: string[];
    recommendations: string[];
  } {
    const issues: string[] = [];
    const recommendations: string[] = [];

    // Vérifier les capacités requises
    if (agent.capabilities.includes('file-upload') && !platform.capabilities.includes('media')) {
      issues.push('L\'agent nécessite le support des fichiers mais la plateforme ne le supporte pas');
    }

    if (agent.capabilities.includes('real-time') && !platform.technicalRequirements.realtime) {
      issues.push('L\'agent nécessite le temps réel mais la plateforme ne le supporte pas');
    }

    // Vérifier les intégrations
    if (agent.integrations.length > 0 && !platform.technicalRequirements.webhooks) {
      issues.push('L\'agent a des intégrations mais la plateforme ne supporte pas les webhooks');
    }

    // Recommandations
    if (platform.type === 'ecommerce' && !agent.capabilities.includes('product-recommendations')) {
      recommendations.push('Considérez ajouter des recommandations de produits pour cette plateforme e-commerce');
    }

    if (platform.type === 'messaging' && !agent.capabilities.includes('quick-replies')) {
      recommendations.push('Ajoutez des réponses rapides pour améliorer l\'expérience sur cette plateforme de messagerie');
    }

    return {
      compatible: issues.length === 0,
      issues,
      recommendations
    };
  }

  /**
   * Estimer les coûts de déploiement
   */
  estimateCosts(platform: PlatformConfig, expectedInteractions: number = 1000): {
    setup: number;
    monthly: number;
    total: number;
    breakdown: string[];
  } {
    const setup = platform.costEstimate.setup;
    const monthly = platform.costEstimate.monthly;
    const perInteraction = platform.costEstimate.perInteraction || 0;
    
    const interactionCost = expectedInteractions * perInteraction;
    const total = setup + monthly + interactionCost;

    const breakdown = [
      `Setup: $${setup}`,
      `Mensuel: $${monthly}`,
      `Interactions (${expectedInteractions}): $${interactionCost.toFixed(2)}`,
      `Total: $${total.toFixed(2)}`
    ];

    return { setup, monthly, total, breakdown };
  }

  /**
   * Créer un package de déploiement
   */
  async createDeploymentPackage(request: DeploymentRequest, agent: Agent): Promise<DeploymentPackage> {
    const platform = this.getPlatform(request.platformId);
    if (!platform) {
      throw new Error(`Plateforme non trouvée: ${request.platformId}`);
    }

    const packageId = `deploy_${request.agentId}_${request.platformId}_${Date.now()}`;
    
    // Générer les fichiers selon la plateforme
    const files = await this.generatePlatformFiles(platform, agent, request);
    
    // Générer la documentation
    const installationInstructions = this.generateInstallationInstructions(platform, request);
    const configurationGuide = this.generateConfigurationGuide(platform, agent, request);
    
    const deploymentPackage: DeploymentPackage = {
      id: packageId,
      agentId: request.agentId,
      platformId: request.platformId,
      packageType: this.getPackageType(platform),
      files,
      installationInstructions,
      configurationGuide,
      supportContact: 'support@agenly.com',
      version: '1.0.0',
      createdAt: new Date(),
      expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) // 30 jours
    };

    this.deployments.set(packageId, deploymentPackage);
    return deploymentPackage;
  }

  private async generatePlatformFiles(platform: PlatformConfig, agent: Agent, request: DeploymentRequest): Promise<DeploymentPackage['files']> {
    const files: DeploymentPackage['files'] = [];

    switch (platform.deploymentMethod) {
      case 'embed':
        files.push(...await this.generateWidgetFiles(agent, request));
        break;
      case 'api':
        files.push(...await this.generateApiFiles(agent, request));
        break;
      case 'plugin':
        files.push(...await this.generatePluginFiles(platform, agent, request));
        break;
      case 'sdk':
        files.push(...await this.generateSdkFiles(platform, agent, request));
        break;
      case 'container':
        files.push(...await this.generateContainerFiles(agent, request));
        break;
    }

    return files;
  }

  private async generateWidgetFiles(agent: Agent, request: DeploymentRequest): Promise<DeploymentPackage['files']> {
    const files: DeploymentPackage['files'] = [];

    // Widget HTML
    const widgetHtml = `
<!DOCTYPE html>
<html lang="fr">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${agent.name} - Chat Widget</title>
    <style>
        .agenly-widget {
            position: fixed;
            bottom: 20px;
            right: 20px;
            width: 350px;
            height: 500px;
            border-radius: 12px;
            box-shadow: 0 8px 32px rgba(0,0,0,0.1);
            background: white;
            z-index: 10000;
            font-family: ${request.customizations?.branding?.fontFamily || 'system-ui, -apple-system, sans-serif'};
            display: none;
        }
        .agenly-widget.open {
            display: block;
        }
        .agenly-header {
            background: ${request.customizations?.branding?.primaryColor || '#007bff'};
            color: white;
            padding: 16px;
            border-radius: 12px 12px 0 0;
            display: flex;
            justify-content: space-between;
            align-items: center;
        }
        .agenly-chat {
            height: 400px;
            overflow-y: auto;
            padding: 16px;
        }
        .agenly-input {
            padding: 16px;
            border-top: 1px solid #eee;
        }
        .agenly-input input {
            width: 100%;
            padding: 12px;
            border: 1px solid #ddd;
            border-radius: 6px;
            outline: none;
        }
        .agenly-toggle {
            position: fixed;
            bottom: 20px;
            right: 20px;
            width: 60px;
            height: 60px;
            border-radius: 50%;
            background: ${request.customizations?.branding?.primaryColor || '#007bff'};
            color: white;
            border: none;
            cursor: pointer;
            box-shadow: 0 4px 16px rgba(0,0,0,0.2);
            z-index: 10001;
        }
    </style>
</head>
<body>
    <button class="agenly-toggle" onclick="toggleWidget()">💬</button>
    <div class="agenly-widget" id="agenlyWidget">
        <div class="agenly-header">
            <h3>${agent.name}</h3>
            <button onclick="toggleWidget()" style="background:none;border:none;color:white;cursor:pointer;">✕</button>
        </div>
        <div class="agenly-chat" id="agenlyChat">
            <div class="message agent">
                <strong>${agent.name}:</strong> Bonjour ! Comment puis-je vous aider aujourd'hui ?
            </div>
        </div>
        <div class="agenly-input">
            <input type="text" id="agenlyInput" placeholder="Tapez votre message..." onkeypress="handleKeyPress(event)">
        </div>
    </div>

    <script>
        const AGENT_ID = '${agent.id}';
        const API_URL = '${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000/api'}';
        
        function toggleWidget() {
            const widget = document.getElementById('agenlyWidget');
            widget.classList.toggle('open');
        }
        
        function handleKeyPress(event) {
            if (event.key === 'Enter') {
                sendMessage();
            }
        }
        
        async function sendMessage() {
            const input = document.getElementById('agenlyInput');
            const message = input.value.trim();
            if (!message) return;
            
            const chat = document.getElementById('agenlyChat');
            chat.innerHTML += \`<div class="message user"><strong>Vous:</strong> \${message}</div>\`;
            input.value = '';
            
            try {
                const response = await fetch(\`\${API_URL}/chat\`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        message: message,
                        agentId: AGENT_ID,
                        userId: 'widget-user-' + Date.now(),
                        conversationId: 'widget-conv-' + Date.now()
                    })
                });
                
                const data = await response.json();
                chat.innerHTML += \`<div class="message agent"><strong>${agent.name}:</strong> \${data.response}</div>\`;
                chat.scrollTop = chat.scrollHeight;
            } catch (error) {
                chat.innerHTML += \`<div class="message error">Erreur: Impossible de contacter l'assistant</div>\`;
            }
        }
    </script>
</body>
</html>`;

    files.push({
      name: 'widget.html',
      content: widgetHtml,
      type: 'html',
      size: widgetHtml.length
    });

    // Code d'intégration
    const embedCode = `
<!-- Agent IA ${agent.name} -->
<script>
(function() {
    const script = document.createElement('script');
    script.src = '${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/widget/${agent.id}.js';
    script.async = true;
    document.head.appendChild(script);
})();
</script>`;

    files.push({
      name: 'embed-code.html',
      content: embedCode,
      type: 'html',
      size: embedCode.length
    });

    return files;
  }

  private async generateApiFiles(agent: Agent, request: DeploymentRequest): Promise<DeploymentPackage['files']> {
    const files: DeploymentPackage['files'] = [];

    // Documentation API
    const apiDoc = {
      openapi: '3.0.0',
      info: {
        title: `${agent.name} API`,
        description: `API pour interagir avec l'agent IA ${agent.name}`,
        version: '1.0.0'
      },
      servers: [
        {
          url: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000/api',
          description: 'Serveur de production'
        }
      ],
      paths: {
        '/chat': {
          post: {
            summary: 'Envoyer un message à l\'agent',
            requestBody: {
              required: true,
              content: {
                'application/json': {
                  schema: {
                    type: 'object',
                    properties: {
                      message: { type: 'string' },
                      agentId: { type: 'string' },
                      userId: { type: 'string' },
                      conversationId: { type: 'string' }
                    },
                    required: ['message', 'agentId', 'userId']
                  }
                }
              }
            },
            responses: {
              '200': {
                description: 'Réponse de l\'agent',
                content: {
                  'application/json': {
                    schema: {
                      type: 'object',
                      properties: {
                        response: { type: 'string' },
                        conversationId: { type: 'string' },
                        timestamp: { type: 'string' }
                      }
                    }
                  }
                }
              }
            }
          }
        }
      }
    };

    files.push({
      name: 'api-documentation.json',
      content: JSON.stringify(apiDoc, null, 2),
      type: 'json',
      size: JSON.stringify(apiDoc).length
    });

    // Exemple d'utilisation
    const exampleCode = `
// Exemple d'utilisation de l'API ${agent.name}

const API_URL = '${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000/api'}';
const AGENT_ID = '${agent.id}';

async function sendMessage(message, userId) {
    try {
        const response = await fetch(\`\${API_URL}/chat\`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': 'Bearer YOUR_API_KEY' // Si nécessaire
            },
            body: JSON.stringify({
                message: message,
                agentId: AGENT_ID,
                userId: userId,
                conversationId: 'conv-' + Date.now()
            })
        });
        
        const data = await response.json();
        return data.response;
    } catch (error) {
        console.error('Erreur:', error);
        return 'Désolé, une erreur est survenue.';
    }
}

// Utilisation
sendMessage('Bonjour !', 'user123').then(response => {
    console.log('Réponse:', response);
});`;

    files.push({
      name: 'example-usage.js',
      content: exampleCode,
      type: 'js',
      size: exampleCode.length
    });

    return files;
  }

  private async generatePluginFiles(platform: PlatformConfig, agent: Agent, request: DeploymentRequest): Promise<DeploymentPackage['files']> {
    const files: DeploymentPackage['files'] = [];

    if (platform.id === 'wordpress-plugin') {
      // Plugin WordPress
      const pluginHeader = `<?php
/**
 * Plugin Name: ${agent.name} Chat
 * Plugin URI: https://agenly.com
 * Description: Agent IA ${agent.name} pour WordPress
 * Version: 1.0.0
 * Author: AGENLY
 * License: GPL v2 or later
 */

// Empêcher l'accès direct
if (!defined('ABSPATH')) {
    exit;
}

// Configuration de l'agent
define('AGENLY_AGENT_ID', '${agent.id}');
define('AGENLY_API_URL', '${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000/api'}');

// Enqueue scripts
function agenly_enqueue_scripts() {
    wp_enqueue_script('agenly-widget', plugin_dir_url(__FILE__) . 'js/widget.js', array('jquery'), '1.0.0', true);
    wp_enqueue_style('agenly-widget', plugin_dir_url(__FILE__) . 'css/widget.css', array(), '1.0.0');
    
    wp_localize_script('agenly-widget', 'agenlyConfig', array(
        'agentId' => AGENLY_AGENT_ID,
        'apiUrl' => AGENLY_API_URL,
        'agentName' => '${agent.name}'
    ));
}
add_action('wp_enqueue_scripts', 'agenly_enqueue_scripts');

// Ajouter le widget
function agenly_add_widget() {
    echo '<div id="agenly-chat-widget"></div>';
}
add_action('wp_footer', 'agenly_add_widget');`;

      files.push({
        name: 'agenly-chat.php',
        content: pluginHeader,
        type: 'php',
        size: pluginHeader.length
      });
    }

    return files;
  }

  private async generateSdkFiles(platform: PlatformConfig, agent: Agent, request: DeploymentRequest): Promise<DeploymentPackage['files']> {
    const files: DeploymentPackage['files'] = [];

    if (platform.id === 'react-native-sdk') {
      // SDK React Native
      const sdkCode = `
import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, TouchableOpacity, ScrollView, StyleSheet } from 'react-native';

const AGENLY_API_URL = '${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000/api'}';
const AGENT_ID = '${agent.id}';

export const AgenlyChat = ({ userId, style }) => {
    const [messages, setMessages] = useState([]);
    const [inputText, setInputText] = useState('');
    const [isLoading, setIsLoading] = useState(false);

    const sendMessage = async () => {
        if (!inputText.trim()) return;
        
        const userMessage = { text: inputText, sender: 'user', timestamp: new Date() };
        setMessages(prev => [...prev, userMessage]);
        setInputText('');
        setIsLoading(true);
        
        try {
            const response = await fetch(\`\${AGENLY_API_URL}/chat\`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    message: inputText,
                    agentId: AGENT_ID,
                    userId: userId,
                    conversationId: 'rn-conv-' + Date.now()
                })
            });
            
            const data = await response.json();
            const agentMessage = { text: data.response, sender: 'agent', timestamp: new Date() };
            setMessages(prev => [...prev, agentMessage]);
        } catch (error) {
            console.error('Erreur:', error);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <View style={[styles.container, style]}>
            <ScrollView style={styles.messages}>
                {messages.map((msg, index) => (
                    <View key={index} style={[styles.message, msg.sender === 'user' ? styles.userMessage : styles.agentMessage]}>
                        <Text style={styles.messageText}>{msg.text}</Text>
                    </View>
                ))}
                {isLoading && <Text style={styles.loading}>${agent.name} écrit...</Text>}
            </ScrollView>
            <View style={styles.inputContainer}>
                <TextInput
                    style={styles.input}
                    value={inputText}
                    onChangeText={setInputText}
                    placeholder="Tapez votre message..."
                    onSubmitEditing={sendMessage}
                />
                <TouchableOpacity style={styles.sendButton} onPress={sendMessage}>
                    <Text style={styles.sendButtonText}>Envoyer</Text>
                </TouchableOpacity>
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#f5f5f5'
    },
    messages: {
        flex: 1,
        padding: 16
    },
    message: {
        padding: 12,
        marginVertical: 4,
        borderRadius: 8,
        maxWidth: '80%'
    },
    userMessage: {
        backgroundColor: '#007bff',
        alignSelf: 'flex-end'
    },
    agentMessage: {
        backgroundColor: 'white',
        alignSelf: 'flex-start'
    },
    messageText: {
        color: '#333'
    },
    loading: {
        fontStyle: 'italic',
        color: '#666',
        textAlign: 'center',
        padding: 8
    },
    inputContainer: {
        flexDirection: 'row',
        padding: 16,
        backgroundColor: 'white',
        borderTopWidth: 1,
        borderTopColor: '#eee'
    },
    input: {
        flex: 1,
        borderWidth: 1,
        borderColor: '#ddd',
        borderRadius: 6,
        padding: 12,
        marginRight: 8
    },
    sendButton: {
        backgroundColor: '#007bff',
        paddingHorizontal: 16,
        paddingVertical: 12,
        borderRadius: 6
    },
    sendButtonText: {
        color: 'white',
        fontWeight: 'bold'
    }
});

export default AgenlyChat;`;

      files.push({
        name: 'AgenlyChat.js',
        content: sdkCode,
        type: 'js',
        size: sdkCode.length
      });
    }

    return files;
  }

  private async generateContainerFiles(agent: Agent, request: DeploymentRequest): Promise<DeploymentPackage['files']> {
    const files: DeploymentPackage['files'] = [];

    // Dockerfile
    const dockerfile = `
FROM node:18-alpine

WORKDIR /app

# Copier les fichiers de l'application
COPY package*.json ./
RUN npm ci --only=production

COPY . .

# Exposer le port
EXPOSE 3000

# Variables d'environnement
ENV NODE_ENV=production
ENV AGENT_ID=${agent.id}
ENV API_URL=${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000/api'}

# Démarrer l'application
CMD ["npm", "start"]`;

    files.push({
      name: 'Dockerfile',
      content: dockerfile,
      type: 'dockerfile',
      size: dockerfile.length
    });

    // Docker Compose
    const dockerCompose = `
version: '3.8'

services:
  agenly-agent:
    build: .
    ports:
      - "3000:3000"
    environment:
      - NODE_ENV=production
      - AGENT_ID=${agent.id}
      - API_URL=${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000/api'}
    restart: unless-stopped
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:3000/health"]
      interval: 30s
      timeout: 10s
      retries: 3

  nginx:
    image: nginx:alpine
    ports:
      - "80:80"
      - "443:443"
    volumes:
      - ./nginx.conf:/etc/nginx/nginx.conf
      - ./ssl:/etc/nginx/ssl
    depends_on:
      - agenly-agent
    restart: unless-stopped`;

    files.push({
      name: 'docker-compose.yml',
      content: dockerCompose,
      type: 'yaml',
      size: dockerCompose.length
    });

    return files;
  }

  private getPackageType(platform: PlatformConfig): DeploymentPackage['packageType'] {
    switch (platform.deploymentMethod) {
      case 'embed': return 'widget';
      case 'api': return 'api';
      case 'plugin': return 'plugin';
      case 'sdk': return 'sdk';
      case 'container': return 'container';
      default: return 'widget';
    }
  }

  private generateInstallationInstructions(platform: PlatformConfig, request: DeploymentRequest): string {
    switch (platform.deploymentMethod) {
      case 'embed':
        return `
# Installation du Widget Web

## Méthode 1: Code d'intégration simple
1. Copiez le code d'intégration fourni dans le fichier embed-code.html
2. Collez-le dans le <head> de votre site web
3. Le widget apparaîtra automatiquement en bas à droite

## Méthode 2: Intégration manuelle
1. Téléchargez le fichier widget.html
2. Intégrez le contenu dans votre page web
3. Personnalisez les styles CSS selon vos besoins

## Personnalisation
- Couleurs: Modifiez les variables CSS dans le fichier
- Position: Changez les propriétés position, bottom, right
- Taille: Ajustez width et height du widget
`;

      case 'api':
        return `
# Installation de l'API

## Configuration
1. Obtenez votre clé API depuis le dashboard AGENLY
2. Configurez l'URL de base: ${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000/api'}
3. Consultez la documentation API fournie

## Exemples d'utilisation
- Voir le fichier example-usage.js
- Documentation complète dans api-documentation.json
- Support: support@agenly.com
`;

      case 'plugin':
        return `
# Installation du Plugin

## WordPress
1. Téléchargez le fichier agenly-chat.php
2. Uploadez-le dans /wp-content/plugins/
3. Activez le plugin dans l'admin WordPress
4. Le widget apparaîtra automatiquement

## Shopify
1. Accédez à votre admin Shopify
2. Allez dans Apps > App Store
3. Recherchez "AGENLY Chat"
4. Installez et configurez l'app
`;

      case 'sdk':
        return `
# Installation du SDK

## React Native
1. npm install agenly-chat-sdk
2. Importez le composant: import { AgenlyChat } from 'agenly-chat-sdk'
3. Utilisez: <AgenlyChat userId="user123" />

## Flutter
1. Ajoutez à pubspec.yaml: agenly_chat: ^1.0.0
2. Importez: import 'package:agenly_chat/agenly_chat.dart'
3. Utilisez le widget AgenlyChat
`;

      case 'container':
        return `
# Installation Docker

## Déploiement simple
1. docker-compose up -d
2. Accédez à http://localhost:3000
3. Configurez votre domaine dans nginx.conf

## Déploiement Kubernetes
1. helm install agenly-agent ./helm-chart
2. Configurez les ingress
3. Déployez avec kubectl apply -f k8s/
`;

      default:
        return 'Instructions d\'installation non disponibles pour cette plateforme.';
    }
  }

  private generateConfigurationGuide(platform: PlatformConfig, agent: Agent, request: DeploymentRequest): string {
    return `
# Guide de Configuration - ${agent.name}

## Plateforme: ${platform.name}
## Type: ${platform.type}

## Configuration de base
- Agent ID: ${agent.id}
- Nom: ${agent.name}
- Capacités: ${agent.capabilities.join(', ')}

## Personnalisation
${request.customizations ? `
- Couleur primaire: ${request.customizations.branding?.primaryColor || 'Défaut'}
- Couleur secondaire: ${request.customizations.branding?.secondaryColor || 'Défaut'}
- Police: ${request.customizations.branding?.fontFamily || 'Défaut'}
- Multi-langues: ${request.customizations.features?.multiLanguage ? 'Activé' : 'Désactivé'}
- Mode sombre: ${request.customizations.features?.darkMode ? 'Activé' : 'Désactivé'}
- Analytics: ${request.customizations.features?.analytics ? 'Activé' : 'Désactivé'}
` : 'Aucune personnalisation spécifiée'}

## Intégrations
${agent.integrations.length > 0 ? agent.integrations.map(integration => `- ${integration.type}: ${integration.name}`).join('\n') : 'Aucune intégration configurée'}

## Support
- Email: support@agenly.com
- Documentation: https://docs.agenly.com
- Status: https://status.agenly.com
`;
  }

  /**
   * Stocker un package de déploiement
   */
  storeDeploymentPackage(packageData: DeploymentPackage): void {
    this.deployments.set(packageData.id, packageData);
    console.log('UniversalDeploymentEngine: Package stocké:', packageData.id);
  }

  /**
   * Obtenir un package de déploiement
   */
  getDeploymentPackage(packageId: string): DeploymentPackage | null {
    return this.deployments.get(packageId) || null;
  }

  /**
   * Lister tous les packages de déploiement
   */
  getAllDeploymentPackages(): DeploymentPackage[] {
    return Array.from(this.deployments.values());
  }

  /**
   * Supprimer un package de déploiement
   */
  deleteDeploymentPackage(packageId: string): boolean {
    return this.deployments.delete(packageId);
  }
}

export default UniversalDeploymentEngine.getInstance();




