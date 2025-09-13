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
  serverTimestamp 
} from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { User, COLLECTIONS } from '@/lib/firebase-models';

export class FirebaseUserService {
  private static instance: FirebaseUserService;

  public static getInstance(): FirebaseUserService {
    if (!FirebaseUserService.instance) {
      FirebaseUserService.instance = new FirebaseUserService();
    }
    return FirebaseUserService.instance;
  }

  // Créer un utilisateur
  async createUser(userData: Omit<User, 'id' | 'createdAt' | 'updatedAt'>): Promise<User> {
    try {
      const userRef = doc(collection(db, COLLECTIONS.USERS));
      
      // Nettoyer les données pour éviter les valeurs undefined
      const cleanUserData = {
        email: userData.email,
        name: userData.name,
        photoURL: userData.photoURL || null, // Convertir undefined en null
        companyName: userData.companyName || null,
        role: userData.role,
        preferences: userData.preferences,
        subscription: userData.subscription,
      };

      const user: User = {
        ...cleanUserData,
        id: userRef.id,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      await setDoc(userRef, {
        ...cleanUserData,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });

      return user;
    } catch (error) {
      console.error('Error creating user:', error);
      throw new Error('Failed to create user');
    }
  }

  // Récupérer un utilisateur par ID
  async getUserById(userId: string): Promise<User | null> {
    try {
      const userRef = doc(db, COLLECTIONS.USERS, userId);
      const userSnap = await getDoc(userRef);

      if (userSnap.exists()) {
        const data = userSnap.data();
        return {
          ...data,
          id: userSnap.id,
          createdAt: data.createdAt?.toDate() || new Date(),
          updatedAt: data.updatedAt?.toDate() || new Date(),
        } as User;
      }

      return null;
    } catch (error) {
      console.error('Error getting user:', error);
      throw new Error('Failed to get user');
    }
  }

  // Récupérer un utilisateur par email
  async getUserByEmail(email: string): Promise<User | null> {
    try {
      const q = query(
        collection(db, COLLECTIONS.USERS),
        where('email', '==', email)
      );
      const querySnapshot = await getDocs(q);

      if (!querySnapshot.empty) {
        const doc = querySnapshot.docs[0];
        const data = doc.data();
        return {
          ...data,
          id: doc.id,
          createdAt: data.createdAt?.toDate() || new Date(),
          updatedAt: data.updatedAt?.toDate() || new Date(),
        } as User;
      }

      return null;
    } catch (error: any) {
      console.error('Error getting user by email:', error);
      
      // Si c'est une erreur de permissions, retourner null au lieu de throw
      if (error.code === 'permission-denied' || error.message?.includes('permissions')) {
        console.warn('Firestore permissions not configured. Returning null.');
        return null;
      }
      
      throw new Error('Failed to get user by email');
    }
  }

  // Mettre à jour un utilisateur
  async updateUser(userId: string, updates: Partial<User>): Promise<void> {
    try {
      const userRef = doc(db, COLLECTIONS.USERS, userId);
      await updateDoc(userRef, {
        ...updates,
        updatedAt: serverTimestamp(),
      });
    } catch (error) {
      console.error('Error updating user:', error);
      throw new Error('Failed to update user');
    }
  }

  // Mettre à jour les intégrations d'un utilisateur
  async updateUserIntegrations(userId: string, integrations: any): Promise<void> {
    try {
      const userRef = doc(db, COLLECTIONS.USERS, userId);
      await updateDoc(userRef, {
        integrations: integrations,
        updatedAt: serverTimestamp(),
      });
      console.log('Intégrations mises à jour pour l\'utilisateur:', userId);
    } catch (error) {
      console.error('Erreur lors de la mise à jour des intégrations:', error);
      throw error;
    }
  }

  // Obtenir les intégrations d'un utilisateur
  async getUserIntegrations(userId: string): Promise<any> {
    try {
      const user = await this.getUserById(userId);
      return user?.integrations || {};
    } catch (error) {
      console.error('Erreur lors de la récupération des intégrations:', error);
      return {};
    }
  }

  // Supprimer un utilisateur
  async deleteUser(userId: string): Promise<void> {
    try {
      const userRef = doc(db, COLLECTIONS.USERS, userId);
      await deleteDoc(userRef);
    } catch (error) {
      console.error('Error deleting user:', error);
      throw new Error('Failed to delete user');
    }
  }

  // Lister tous les utilisateurs
  async getAllUsers(): Promise<User[]> {
    try {
      const querySnapshot = await getDocs(collection(db, COLLECTIONS.USERS));
      return querySnapshot.docs.map(doc => {
        const data = doc.data();
        return {
          ...data,
          id: doc.id,
          createdAt: data.createdAt?.toDate() || new Date(),
          updatedAt: data.updatedAt?.toDate() || new Date(),
        } as User;
      });
    } catch (error) {
      console.error('Error getting all users:', error);
      throw new Error('Failed to get all users');
    }
  }
}




