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
  limit 
} from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { Conversation, Message } from '@/types';

export class ConversationService {
  private static instance: ConversationService;
  private collectionName = 'conversations';

  public static getInstance(): ConversationService {
    if (!ConversationService.instance) {
      ConversationService.instance = new ConversationService();
    }
    return ConversationService.instance;
  }

  async createConversation(userId: string, agentId?: string, title?: string): Promise<Conversation> {
    try {
      const conversationData = {
        tenant_id: 'default-tenant',
        agent_id: agentId || 'default-agent',
        user_id: userId,
        session_id: `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        messages: [],
        context: {},
        status: 'active' as const,
        created_at: new Date(),
        updated_at: new Date(),
        metadata: {
          user_agent: 'web',
          ip_address: '127.0.0.1',
        },
      };

      const conversationRef = await addDoc(collection(db, this.collectionName), conversationData);
      
      return {
        id: conversationRef.id,
        ...conversationData,
      } as Conversation;
    } catch (error) {
      console.error('Error creating conversation:', error);
      throw new Error('Failed to create conversation');
    }
  }

  async getConversation(conversationId: string): Promise<Conversation | null> {
    try {
      const conversationDoc = await getDoc(doc(db, this.collectionName, conversationId));
      
      if (!conversationDoc.exists()) {
        return null;
      }

      const data = conversationDoc.data();
      return {
        id: conversationDoc.id,
        tenant_id: data.tenant_id || 'default-tenant',
        agent_id: data.agent_id || 'default-agent',
        user_id: data.user_id || 'default-user',
        session_id: data.session_id || 'default-session',
        messages: data.messages?.map((msg: any) => ({
          ...msg,
          timestamp: msg.timestamp?.toDate() || new Date(),
        })) || [],
        context: data.context || {},
        status: data.status || 'active',
        created_at: data.created_at?.toDate() || new Date(),
        updated_at: data.updated_at?.toDate() || new Date(),
        metadata: data.metadata || {
          user_agent: 'web',
          ip_address: '127.0.0.1',
        },
      } as Conversation;
    } catch (error) {
      console.error('Error getting conversation:', error);
      throw new Error('Failed to get conversation');
    }
  }

  async getUserConversations(userId: string, limitCount: number = 20): Promise<Conversation[]> {
    try {
      const q = query(
        collection(db, this.collectionName),
        where('userId', '==', userId),
        orderBy('updatedAt', 'desc'),
        limit(limitCount)
      );
      
      const querySnapshot = await getDocs(q);
      return querySnapshot.docs.map(doc => {
        const data = doc.data();
        return {
          id: doc.id,
          tenant_id: data.tenant_id || 'default-tenant',
          agent_id: data.agent_id || 'default-agent',
          user_id: data.user_id || 'default-user',
          session_id: data.session_id || 'default-session',
          messages: data.messages?.map((msg: any) => ({
            ...msg,
            timestamp: msg.timestamp?.toDate() || new Date(),
          })) || [],
          context: data.context || {},
          status: data.status || 'active',
          created_at: data.created_at?.toDate() || new Date(),
          updated_at: data.updated_at?.toDate() || new Date(),
          metadata: data.metadata || {
            user_agent: 'web',
            ip_address: '127.0.0.1',
          },
        };
      }) as Conversation[];
    } catch (error) {
      console.error('Error getting user conversations:', error);
      throw new Error('Failed to get user conversations');
    }
  }

  async addMessage(conversationId: string, message: Omit<Message, 'id'>): Promise<void> {
    try {
      const conversationRef = doc(db, this.collectionName, conversationId);
      const conversation = await this.getConversation(conversationId);
      
      if (!conversation) {
        throw new Error('Conversation not found');
      }

      const newMessage: Message = {
        id: `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        ...message,
      };

      const updatedMessages = [...conversation.messages, newMessage];
      
      await updateDoc(conversationRef, {
        messages: updatedMessages,
        updatedAt: new Date(),
      });
    } catch (error) {
      console.error('Error adding message:', error);
      throw new Error('Failed to add message');
    }
  }

  async updateConversationTitle(conversationId: string, title: string): Promise<void> {
    try {
      const conversationRef = doc(db, this.collectionName, conversationId);
      await updateDoc(conversationRef, {
        title,
        updatedAt: new Date(),
      });
    } catch (error) {
      console.error('Error updating conversation title:', error);
      throw new Error('Failed to update conversation title');
    }
  }

  async deleteConversation(conversationId: string): Promise<void> {
    try {
      await deleteDoc(doc(db, this.collectionName, conversationId));
    } catch (error) {
      console.error('Error deleting conversation:', error);
      throw new Error('Failed to delete conversation');
    }
  }

  async getConversationMessages(conversationId: string): Promise<Message[]> {
    try {
      const conversation = await this.getConversation(conversationId);
      return conversation?.messages || [];
    } catch (error) {
      console.error('Error getting conversation messages:', error);
      throw new Error('Failed to get conversation messages');
    }
  }

  async getAgentConversations(agentId: string, limitCount: number = 10): Promise<Conversation[]> {
    try {
      const q = query(
        collection(db, this.collectionName),
        where('agentId', '==', agentId),
        orderBy('updatedAt', 'desc'),
        limit(limitCount)
      );
      
      const querySnapshot = await getDocs(q);
      return querySnapshot.docs.map(doc => {
        const data = doc.data();
        return {
          id: doc.id,
          tenant_id: data.tenant_id || 'default-tenant',
          agent_id: data.agent_id || 'default-agent',
          user_id: data.user_id || 'default-user',
          session_id: data.session_id || 'default-session',
          messages: data.messages?.map((msg: any) => ({
            ...msg,
            timestamp: msg.timestamp?.toDate() || new Date(),
          })) || [],
          context: data.context || {},
          status: data.status || 'active',
          created_at: data.created_at?.toDate() || new Date(),
          updated_at: data.updated_at?.toDate() || new Date(),
          metadata: data.metadata || {
            user_agent: 'web',
            ip_address: '127.0.0.1',
          },
        };
      }) as Conversation[];
    } catch (error) {
      console.error('Error getting agent conversations:', error);
      throw new Error('Failed to get agent conversations');
    }
  }

  async clearConversation(conversationId: string): Promise<void> {
    try {
      const conversationRef = doc(db, this.collectionName, conversationId);
      await updateDoc(conversationRef, {
        messages: [],
        updatedAt: new Date(),
      });
    } catch (error) {
      console.error('Error clearing conversation:', error);
      throw new Error('Failed to clear conversation');
    }
  }

  async archiveConversation(conversationId: string): Promise<void> {
    try {
      const conversationRef = doc(db, this.collectionName, conversationId);
      await updateDoc(conversationRef, {
        isActive: false,
        updatedAt: new Date(),
      });
    } catch (error) {
      console.error('Error archiving conversation:', error);
      throw new Error('Failed to archive conversation');
    }
  }
}

export default ConversationService.getInstance();




