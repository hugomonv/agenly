import { 
  collection, 
  doc, 
  getDocs, 
  getDoc, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  query, 
  where, 
  orderBy, 
  limit,
  increment 
} from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { Agent } from '@/types/frontend';

export class AgentService {
  private static instance: AgentService;
  private collectionName = 'agents';

  public static getInstance(): AgentService {
    if (!AgentService.instance) {
      AgentService.instance = new AgentService();
    }
    return AgentService.instance;
  }

  async createAgent(agentData: Partial<Agent>): Promise<Agent> {
    try {
      const agentRef = await addDoc(collection(db, this.collectionName), {
        ...agentData,
        createdAt: new Date(),
        updatedAt: new Date(),
        conversationCount: 0,
        isActive: true,
        status: 'active',
        deployments: {
          web: false,
          iframe: false,
          api: false,
        },
      });

      const createdAgent = await this.getAgent(agentRef.id);
      if (!createdAgent) {
        throw new Error('Failed to create agent');
      }

      return createdAgent;
    } catch (error) {
      console.error('Error creating agent:', error);
      throw new Error('Failed to create agent');
    }
  }

  async getUserAgents(userId: string): Promise<Agent[]> {
    try {
      const q = query(
        collection(db, this.collectionName),
        where('userId', '==', userId),
        orderBy('createdAt', 'desc')
      );
      
      const querySnapshot = await getDocs(q);
      return querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        createdAt: doc.data().createdAt?.toDate() || new Date(),
        updatedAt: doc.data().updatedAt?.toDate() || new Date(),
      })) as Agent[];
    } catch (error) {
      console.error('Error getting user agents:', error);
      throw new Error('Failed to get user agents');
    }
  }

  async getAgent(agentId: string): Promise<Agent | null> {
    try {
      const agentDoc = await getDoc(doc(db, this.collectionName, agentId));
      
      if (!agentDoc.exists()) {
        return null;
      }

      return {
        id: agentDoc.id,
        ...agentDoc.data(),
        createdAt: agentDoc.data().createdAt?.toDate() || new Date(),
        updatedAt: agentDoc.data().updatedAt?.toDate() || new Date(),
      } as Agent;
    } catch (error) {
      console.error('Error getting agent:', error);
      throw new Error('Failed to get agent');
    }
  }

  async updateAgent(agentId: string, updates: Partial<Agent>): Promise<void> {
    try {
      const agentRef = doc(db, this.collectionName, agentId);
      await updateDoc(agentRef, {
        ...updates,
        updatedAt: new Date(),
      });
    } catch (error) {
      console.error('Error updating agent:', error);
      throw new Error('Failed to update agent');
    }
  }

  async deleteAgent(agentId: string): Promise<void> {
    try {
      await deleteDoc(doc(db, this.collectionName, agentId));
    } catch (error) {
      console.error('Error deleting agent:', error);
      throw new Error('Failed to delete agent');
    }
  }

  async incrementConversationCount(agentId: string): Promise<void> {
    try {
      const agentRef = doc(db, this.collectionName, agentId);
      await updateDoc(agentRef, {
        conversationCount: increment(1),
        updatedAt: new Date(),
      });
    } catch (error) {
      console.error('Error incrementing conversation count:', error);
      throw new Error('Failed to increment conversation count');
    }
  }

  async getActiveAgents(userId: string): Promise<Agent[]> {
    try {
      const q = query(
        collection(db, this.collectionName),
        where('userId', '==', userId),
        where('isActive', '==', true),
        where('status', '==', 'active'),
        orderBy('createdAt', 'desc')
      );
      
      const querySnapshot = await getDocs(q);
      return querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        createdAt: doc.data().createdAt?.toDate() || new Date(),
        updatedAt: doc.data().updatedAt?.toDate() || new Date(),
      })) as Agent[];
    } catch (error) {
      console.error('Error getting active agents:', error);
      throw new Error('Failed to get active agents');
    }
  }

  async searchAgents(userId: string, searchTerm: string): Promise<Agent[]> {
    try {
      const q = query(
        collection(db, this.collectionName),
        where('userId', '==', userId),
        orderBy('name'),
        limit(50)
      );
      
      const querySnapshot = await getDocs(q);
      const agents = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        createdAt: doc.data().createdAt?.toDate() || new Date(),
        updatedAt: doc.data().updatedAt?.toDate() || new Date(),
      })) as Agent[];

      // Filter by search term (client-side filtering for now)
      return agents.filter(agent => 
        agent.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        agent.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
        agent.metadata.tags.some(tag => tag.toLowerCase().includes(searchTerm.toLowerCase()))
      );
    } catch (error) {
      console.error('Error searching agents:', error);
      throw new Error('Failed to search agents');
    }
  }

  async updateAgentDeployment(agentId: string, deploymentType: 'web' | 'iframe' | 'api', isActive: boolean): Promise<void> {
    try {
      const agentRef = doc(db, this.collectionName, agentId);
      await updateDoc(agentRef, {
        [`deployments.${deploymentType}`]: isActive,
        updatedAt: new Date(),
      });
    } catch (error) {
      console.error('Error updating agent deployment:', error);
      throw new Error('Failed to update agent deployment');
    }
  }
}

export default AgentService.getInstance();




