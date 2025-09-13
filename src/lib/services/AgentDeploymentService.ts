import { HybridAgentService } from './HybridAgentService';
import { Agent } from '../firebase-models';

export interface DeploymentConfig {
  id: string;
  agentId: string;
  userId: string;
  type: 'web' | 'iframe' | 'api';
  url?: string;
  embedCode?: string;
  apiKey?: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
  domain?: string;
  customCss?: string;
  customJs?: string;
}

export interface DeploymentResponse {
  success: boolean;
  deployment?: DeploymentConfig;
  error?: string;
}

export class AgentDeploymentService {
  private static instance: AgentDeploymentService;
  private agentService: HybridAgentService;
  private deployments: Map<string, DeploymentConfig> = new Map();

  private constructor() {
    this.agentService = HybridAgentService.getInstance();
  }

  public static getInstance(): AgentDeploymentService {
    if (!AgentDeploymentService.instance) {
      AgentDeploymentService.instance = new AgentDeploymentService();
    }
    return AgentDeploymentService.instance;
  }

  /**
   * Déployer un agent
   */
  async deployAgent(agentId: string, userId: string, deploymentType: 'web' | 'iframe' | 'api', options?: {
    domain?: string;
    customCss?: string;
    customJs?: string;
  }): Promise<DeploymentResponse> {
    try {
      // Vérifier que l'agent existe et appartient à l'utilisateur
      const agent = await this.agentService.getAgentById(agentId);
      if (!agent) {
        return { success: false, error: 'Agent non trouvé' };
      }

      if (agent.created_by !== userId) {
        return { success: false, error: 'Non autorisé' };
      }

      // Vérifier que l'agent est prêt pour le déploiement
      if (agent.status !== 'active' && agent.status !== 'draft') {
        return { success: false, error: 'Agent non prêt pour le déploiement' };
      }

      // Créer la configuration de déploiement
      const deploymentId = `deploy_${agentId}_${Date.now()}`;
      const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
      
      const deployment: DeploymentConfig = {
        id: deploymentId,
        agentId,
        userId,
        type: deploymentType,
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
        domain: options?.domain,
        customCss: options?.customCss,
        customJs: options?.customJs,
      };

      // Configurer selon le type de déploiement
      switch (deploymentType) {
        case 'web':
          deployment.url = `${baseUrl}/agent/${agentId}`;
          break;
        case 'iframe':
          deployment.embedCode = this.generateEmbedCode(agentId, baseUrl, options);
          break;
        case 'api':
          deployment.apiKey = this.generateApiKey(agentId);
          break;
      }

      // Sauvegarder le déploiement
      this.deployments.set(deploymentId, deployment);

      // Mettre à jour l'agent avec les informations de déploiement
      try {
        await this.agentService.updateAgent(agentId, {
          deployments: {
            ...agent.deployments,
            [deploymentType]: true,
          },
          status: 'active' as const,
          updated_at: new Date(),
        });
      } catch (updateError) {
        console.warn('Could not update agent in Firebase, using local cache only:', updateError);
        // Continuer sans mettre à jour Firebase
      }

      return {
        success: true,
        deployment,
      };
    } catch (error) {
      console.error('Erreur lors du déploiement:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Erreur inconnue',
      };
    }
  }

  /**
   * Générer le code d'intégration iframe
   */
  private generateEmbedCode(agentId: string, baseUrl: string, options?: {
    customCss?: string;
    customJs?: string;
  }): string {
    const iframeSrc = `${baseUrl}/agent/${agentId}`;
    const customCss = options?.customCss ? `\n  <style>${options.customCss}</style>` : '';
    const customJs = options?.customJs ? `\n  <script>${options.customJs}</script>` : '';

    return `<!-- Agent IA - ${agentId} -->
<div id="agent-chat-container">
  <iframe 
    src="${iframeSrc}" 
    width="100%" 
    height="600" 
    frameborder="0"
    title="Assistant IA"
    style="border-radius: 8px; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);"
  ></iframe>
</div>${customCss}${customJs}`;
  }

  /**
   * Générer une clé API
   */
  private generateApiKey(agentId: string): string {
    const timestamp = Date.now().toString(36);
    const random = Math.random().toString(36).substr(2, 8);
    return `ak_${agentId.substr(0, 8)}_${timestamp}_${random}`;
  }

  /**
   * Obtenir les déploiements d'un agent
   */
  async getAgentDeployments(agentId: string, userId: string): Promise<DeploymentConfig[]> {
    try {
      const agent = await this.agentService.getAgentById(agentId);
      if (!agent || agent.created_by !== userId) {
        return [];
      }

      return Array.from(this.deployments.values()).filter(
        deployment => deployment.agentId === agentId && deployment.userId === userId
      );
    } catch (error) {
      console.error('Erreur lors de la récupération des déploiements:', error);
      return [];
    }
  }

  /**
   * Désactiver un déploiement
   */
  async disableDeployment(deploymentId: string, userId: string): Promise<DeploymentResponse> {
    try {
      const deployment = this.deployments.get(deploymentId);
      if (!deployment) {
        return { success: false, error: 'Déploiement non trouvé' };
      }

      if (deployment.userId !== userId) {
        return { success: false, error: 'Non autorisé' };
      }

      deployment.isActive = false;
      deployment.updatedAt = new Date();

      // Mettre à jour l'agent
      const agent = await this.agentService.getAgentById(deployment.agentId);
      if (agent) {
        await this.agentService.updateAgent(deployment.agentId, {
          deployments: {
            ...agent.deployments,
            [deployment.type]: false,
          },
          updated_at: new Date(),
        });
      }

      return {
        success: true,
        deployment,
      };
    } catch (error) {
      console.error('Erreur lors de la désactivation:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Erreur inconnue',
      };
    }
  }

  /**
   * Vérifier l'accès à un agent déployé
   */
  async validateAgentAccess(agentId: string, apiKey?: string): Promise<{
    success: boolean;
    agent?: Agent;
    error?: string;
  }> {
    try {
      const agent = await this.agentService.getAgentById(agentId);
      if (!agent) {
        return { success: false, error: 'Agent non trouvé' };
      }

      if (agent.status !== 'active' && agent.status !== 'draft') {
        return { success: false, error: 'Agent non actif' };
      }

      // Vérifier la clé API si fournie
      if (apiKey) {
        const deployment = Array.from(this.deployments.values()).find(
          d => d.agentId === agentId && d.apiKey === apiKey && d.isActive
        );
        if (!deployment) {
          return { success: false, error: 'Clé API invalide' };
        }
      }

      return {
        success: true,
        agent,
      };
    } catch (error) {
      console.error('Erreur lors de la validation:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Erreur inconnue',
      };
    }
  }

  /**
   * Obtenir les statistiques d'utilisation d'un déploiement
   */
  async getDeploymentStats(deploymentId: string, userId: string): Promise<{
    success: boolean;
    stats?: {
      totalRequests: number;
      activeUsers: number;
      avgResponseTime: number;
      lastUsed: Date;
    };
    error?: string;
  }> {
    try {
      const deployment = this.deployments.get(deploymentId);
      if (!deployment || deployment.userId !== userId) {
        return { success: false, error: 'Déploiement non trouvé' };
      }

      const agent = await this.agentService.getAgentById(deployment.agentId);
      if (!agent) {
        return { success: false, error: 'Agent non trouvé' };
      }

      return {
        success: true,
        stats: {
          totalRequests: agent.usage_stats.total_messages,
          activeUsers: agent.usage_stats.total_conversations,
          avgResponseTime: agent.usage_stats.avg_response_time,
          lastUsed: agent.usage_stats.last_used,
        },
      };
    } catch (error) {
      console.error('Erreur lors de la récupération des stats:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Erreur inconnue',
      };
    }
  }
}

export const agentDeploymentService = AgentDeploymentService.getInstance();




