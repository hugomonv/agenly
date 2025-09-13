import { 
  collection, 
  doc, 
  getDoc, 
  setDoc, 
  updateDoc, 
  deleteDoc, 
  query, 
  where, 
  getDocs,
  orderBy,
  limit
} from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { Agent, COLLECTIONS } from '@/lib/firebase-models';

export class FirebaseAgentServiceV2 {
  private static instance: FirebaseAgentServiceV2;

  public static getInstance(): FirebaseAgentServiceV2 {
    if (!FirebaseAgentServiceV2.instance) {
      FirebaseAgentServiceV2.instance = new FirebaseAgentServiceV2();
    }
    return FirebaseAgentServiceV2.instance;
  }

  // Créer un agent
  async createAgent(agentData: Omit<Agent, 'id' | 'created_at' | 'updated_at'>): Promise<Agent> {
    try {
      const agentRef = doc(collection(db, COLLECTIONS.AGENTS));
      const agent: Agent = {
        ...agentData,
        id: agentRef.id,
        created_at: new Date(),
        updated_at: new Date(),
      };

      await setDoc(agentRef, {
        ...agent,
        created_at: new Date(),
        updated_at: new Date(),
      });

      return agent;
    } catch (error) {
      console.error('Error creating agent:', error);
      throw new Error('Failed to create agent');
    }
  }

  // Récupérer un agent par ID
  async getAgentById(agentId: string): Promise<Agent | null> {
    try {
      const agentRef = doc(db, COLLECTIONS.AGENTS, agentId);
      const agentSnap = await getDoc(agentRef);

      if (agentSnap.exists()) {
        const data = agentSnap.data();
        return {
          ...data,
          id: agentSnap.id,
          created_at: data.created_at?.toDate() || new Date(),
          updated_at: data.updated_at?.toDate() || new Date(),
        } as Agent;
      }

      return null;
    } catch (error) {
      console.error('Error getting agent:', error);
      // En cas d'erreur de permissions, retourner null au lieu de throw
      if (error instanceof Error && error.message.includes('permission')) {
        console.warn('Firestore permissions not configured. Returning null.');
        return null;
      }
      throw new Error('Failed to get agent');
    }
  }

  // Récupérer les agents d'un utilisateur
  async getAgentsByUser(userId: string): Promise<Agent[]> {
    try {
      const q = query(
        collection(db, COLLECTIONS.AGENTS),
        where('created_by', '==', userId),
        orderBy('created_at', 'desc')
      );
      const querySnapshot = await getDocs(q);

      return querySnapshot.docs.map(doc => {
        const data = doc.data();
        return {
          ...data,
          id: doc.id,
          created_at: data.created_at?.toDate() || new Date(),
          updated_at: data.updated_at?.toDate() || new Date(),
        } as Agent;
      });
    } catch (error: any) {
      console.error('Error getting agents by user:', error);
      
      // Si c'est une erreur de permissions, retourner un tableau vide
      if (error.code === 'permission-denied' || error.message?.includes('permissions')) {
        console.warn('Firestore permissions not configured. Returning empty array.');
        return [];
      }
      
      throw new Error('Failed to get agents by user');
    }
  }

  // Mettre à jour un agent
  async updateAgent(agentId: string, updates: Partial<Agent>): Promise<Agent> {
    try {
      const agentRef = doc(db, COLLECTIONS.AGENTS, agentId);
      
      const updateData = {
        ...updates,
        updated_at: new Date(),
      };
      
      await updateDoc(agentRef, updateData);
      
      // Récupérer l'agent mis à jour
      const updatedAgent = await this.getAgentById(agentId);
      if (!updatedAgent) {
        throw new Error('Agent not found after update');
      }
      
      return updatedAgent;
    } catch (error) {
      console.error('Error updating agent:', error);
      throw new Error('Failed to update agent');
    }
  }

  // Supprimer un agent
  async deleteAgent(agentId: string): Promise<void> {
    try {
      const agentRef = doc(db, COLLECTIONS.AGENTS, agentId);
      await deleteDoc(agentRef);
    } catch (error) {
      console.error('Error deleting agent:', error);
      throw new Error('Failed to delete agent');
    }
  }

  // Rechercher des agents
  async searchAgents(userId: string, searchTerm: string): Promise<Agent[]> {
    try {
      const q = query(
        collection(db, COLLECTIONS.AGENTS),
        where('created_by', '==', userId),
        orderBy('created_at', 'desc')
      );
      const querySnapshot = await getDocs(q);

      const agents = querySnapshot.docs.map(doc => {
        const data = doc.data();
        return {
          ...data,
          id: doc.id,
          created_at: data.created_at?.toDate() || new Date(),
          updated_at: data.updated_at?.toDate() || new Date(),
        } as Agent;
      });

      // Filtrer côté client (Firestore ne supporte pas la recherche textuelle native)
      return agents.filter(agent => 
        agent.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        agent.description.toLowerCase().includes(searchTerm.toLowerCase())
      );
    } catch (error) {
      console.error('Error searching agents:', error);
      throw new Error('Failed to search agents');
    }
  }

  // Mettre à jour le déploiement d'un agent
  async updateAgentDeployment(agentId: string, deploymentType: 'web' | 'iframe' | 'api', isActive: boolean): Promise<void> {
    try {
      const agentRef = doc(db, COLLECTIONS.AGENTS, agentId);
      await updateDoc(agentRef, {
        [`deployments.${deploymentType}`]: isActive,
        updated_at: new Date(),
      });
    } catch (error) {
      console.error('Error updating agent deployment:', error);
      throw new Error('Failed to update agent deployment');
    }
  }
}

export default FirebaseAgentServiceV2.getInstance();




