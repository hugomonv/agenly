import { Agent } from '../firebase-models';
import UniversalDeploymentEngine from './UniversalDeploymentEngine';

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

/**
 * Service de test pour le déploiement universel
 * Utilise un cache en mémoire pour contourner les problèmes Firebase
 */
export class TestDeploymentService {
  private static instance: TestDeploymentService;
  private agents: Map<string, Agent> = new Map();
  private packages: Map<string, DeploymentPackage> = new Map();

  private constructor() {}

  public static getInstance(): TestDeploymentService {
    if (!TestDeploymentService.instance) {
      TestDeploymentService.instance = new TestDeploymentService();
    }
    return TestDeploymentService.instance;
  }

  async getAgentById(agentId: string): Promise<Agent | null> {
    console.log('TestDeploymentService: Getting agent by ID:', agentId);
    
    // Essayer d'abord le cache local
    if (this.agents.has(agentId)) {
      console.log('TestDeploymentService: Agent found in memory');
      return this.agents.get(agentId)!;
    }

    // Essayer ensuite Firebase via HybridAgentService
    try {
      const { HybridAgentService } = await import('./HybridAgentService');
      const firebaseAgent = await HybridAgentService.getInstance().getAgentById(agentId);
      if (firebaseAgent) {
        console.log('TestDeploymentService: Agent found in Firebase, syncing to memory');
        this.agents.set(agentId, firebaseAgent);
        return firebaseAgent;
      }
    } catch (error) {
      console.log('TestDeploymentService: Error fetching from Firebase:', error.message);
    }

    console.log('TestDeploymentService: Agent not found anywhere');
    return null;
  }

  async createAgent(agent: Omit<Agent, 'id' | 'created_at' | 'updated_at'>): Promise<Agent> {
    const agentId = `test-agent-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    const newAgent: Agent = {
      ...agent,
      id: agentId,
      created_at: new Date(),
      updated_at: new Date(),
    };

    this.agents.set(agentId, newAgent);
    console.log('TestDeploymentService: Agent created and stored in memory:', agentId);
    return newAgent;
  }

  async updateAgent(agentId: string, updates: Partial<Agent>): Promise<Agent | null> {
    if (this.agents.has(agentId)) {
      const existingAgent = this.agents.get(agentId)!;
      const updatedAgent = { ...existingAgent, ...updates, updated_at: new Date() };
      this.agents.set(agentId, updatedAgent);
      console.log('TestDeploymentService: Agent updated in memory:', agentId);
      return updatedAgent;
    }
    return null;
  }

  async deleteAgent(agentId: string): Promise<void> {
    this.agents.delete(agentId);
    console.log('TestDeploymentService: Agent deleted from memory:', agentId);
  }

  async getAgentsByUser(userId: string): Promise<Agent[]> {
    const userAgents = Array.from(this.agents.values()).filter(agent => agent.created_by === userId);
    console.log('TestDeploymentService: Found agents for user:', userId, userAgents.length);
    return userAgents;
  }

  // Méthode pour ajouter un agent depuis l'extérieur (pour les tests)
  addAgent(agent: Agent): void {
    this.agents.set(agent.id, agent);
    console.log('TestDeploymentService: Agent added to memory:', agent.id);
  }

  // Méthode pour lister tous les agents (pour debug)
  getAllAgents(): Agent[] {
    return Array.from(this.agents.values());
  }

  // Méthodes pour gérer les packages de déploiement
  async addPackage(packageData: DeploymentPackage): Promise<void> {
    this.packages.set(packageData.id, packageData);
    console.log('TestDeploymentService: Package added to memory:', packageData.id);
  }

  async getPackage(packageId: string): Promise<DeploymentPackage | null> {
    console.log('TestDeploymentService: Getting package by ID:', packageId);
    
    // Essayer d'abord le cache local
    if (this.packages.has(packageId)) {
      console.log('TestDeploymentService: Package found in memory');
      return this.packages.get(packageId)!;
    }

    // Essayer ensuite UniversalDeploymentEngine
    const packageFromEngine = UniversalDeploymentEngine.getDeploymentPackage(packageId);
    if (packageFromEngine) {
      console.log('TestDeploymentService: Package found in UniversalDeploymentEngine');
      // Stocker dans le cache local pour les prochaines fois
      this.packages.set(packageId, packageFromEngine);
      return packageFromEngine;
    }

    console.log('TestDeploymentService: Package not found anywhere');
    return null;
  }

  async getPackagesByAgent(agentId: string): Promise<DeploymentPackage[]> {
    const agentPackages = Array.from(this.packages.values()).filter(pkg => pkg.agentId === agentId);
    console.log('TestDeploymentService: Found packages for agent:', agentId, agentPackages.length);
    return agentPackages;
  }


  // Méthode de synchronisation forcée
  async forceSyncAgent(agent: Agent): Promise<void> {
    this.agents.set(agent.id, agent);
    console.log('TestDeploymentService: Agent forcé en mémoire:', agent.id);
  }

  // Méthode de synchronisation forcée pour les packages
  async forceSyncPackage(packageData: DeploymentPackage): Promise<void> {
    this.packages.set(packageData.id, packageData);
    console.log('TestDeploymentService: Package forcé en mémoire:', packageData.id);
  }

  // Méthode pour lister tous les packages (pour debug)
  getAllPackages(): DeploymentPackage[] {
    return Array.from(this.packages.values());
  }
}

export default TestDeploymentService.getInstance();




