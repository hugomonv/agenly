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
  limit,
  serverTimestamp 
} from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { Agent, COLLECTIONS } from '@/lib/firebase-models';

export class FirebaseAgentService {
  private static instance: FirebaseAgentService;

  public static getInstance(): FirebaseAgentService {
    if (!FirebaseAgentService.instance) {
      FirebaseAgentService.instance = new FirebaseAgentService();
    }
    return FirebaseAgentService.instance;
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
        created_at: serverTimestamp(),
        updated_at: serverTimestamp(),
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

  // Récupérer les agents actifs
  async getActiveAgents(): Promise<Agent[]> {
    try {
      const q = query(
        collection(db, COLLECTIONS.AGENTS),
        where('status', '==', 'active'),
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
    } catch (error) {
      console.error('Error getting active agents:', error);
      throw new Error('Failed to get active agents');
    }
  }

  // Mettre à jour un agent
  async updateAgent(agentId: string, updates: Partial<Agent>): Promise<void> {
    try {
      const agentRef = doc(db, COLLECTIONS.AGENTS, agentId);
      await updateDoc(agentRef, {
        ...updates,
        updated_at: serverTimestamp(),
      });
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

  // Lister tous les agents
  async getAllAgents(): Promise<Agent[]> {
    try {
      const q = query(
        collection(db, COLLECTIONS.AGENTS),
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
    } catch (error) {
      console.error('Error getting all agents:', error);
      throw new Error('Failed to get all agents');
    }
  }

  // Rechercher des agents
  async searchAgents(searchTerm: string, userId?: string): Promise<Agent[]> {
    try {
      let q = query(collection(db, COLLECTIONS.AGENTS));

      if (userId) {
        q = query(q, where('userId', '==', userId));
      }

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

      // Filtrage côté client pour la recherche textuelle
      return agents.filter(agent => 
        agent.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        agent.description.toLowerCase().includes(searchTerm.toLowerCase())
      );
    } catch (error) {
      console.error('Error searching agents:', error);
      throw new Error('Failed to search agents');
    }
  }
}




