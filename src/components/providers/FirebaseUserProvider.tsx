'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';
import { User } from '@/lib/firebase-models';
import { FirebaseUserService } from '@/lib/services/FirebaseUserService';
import { auth } from '@/lib/firebase';
import { 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword, 
  signInWithPopup, 
  GoogleAuthProvider, 
  signOut as firebaseSignOut,
  onAuthStateChanged,
  User as FirebaseUser
} from 'firebase/auth';

interface UseUserReturn {
  user: User | null;
  loading: boolean;
  error: string | null;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string, name: string, companyName?: string) => Promise<void>;
  signInWithGoogle: () => Promise<void>;
  signOut: () => Promise<void>;
  refreshUser: () => Promise<void>;
}

const UserContext = createContext<UseUserReturn | undefined>(undefined);

export function FirebaseUserProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [firebaseUser, setFirebaseUser] = useState<FirebaseUser | null>(null);

  const userService = FirebaseUserService.getInstance();

  // Écouter les changements d'authentification Firebase
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      setFirebaseUser(firebaseUser);
      
      if (firebaseUser) {
        try {
          // Récupérer les données utilisateur depuis Firestore
          const userData = await userService.getUserByEmail(firebaseUser.email!);
          if (userData) {
            setUser(userData);
          } else {
            // Créer un nouvel utilisateur si il n'existe pas
            const newUser = await userService.createUser({
              email: firebaseUser.email!,
              name: firebaseUser.displayName || 'Utilisateur',
              photoURL: firebaseUser.photoURL || null, // Utiliser null au lieu d'undefined
              role: 'user',
              preferences: {
                theme: 'dark',
                notifications: true,
                language: 'fr',
              },
              subscription: {
                plan: 'free',
                status: 'active',
              },
            });
            setUser(newUser);
          }
        } catch (err) {
          console.error('Error loading user data:', err);
          setError('Erreur lors du chargement des données utilisateur');
        }
      } else {
        setUser(null);
      }
      
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const signIn = async (email: string, password: string) => {
    try {
      setLoading(true);
      setError(null);
      await signInWithEmailAndPassword(auth, email, password);
    } catch (err: any) {
      setError(err.message || 'Erreur de connexion');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const signUp = async (email: string, password: string, name: string, companyName?: string) => {
    try {
      setLoading(true);
      setError(null);
      
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      
      // Créer le profil utilisateur dans Firestore
      await userService.createUser({
        email: userCredential.user.email!,
        name,
        companyName: companyName || null, // Utiliser null au lieu d'undefined
        role: 'user',
        preferences: {
          theme: 'dark',
          notifications: true,
          language: 'fr',
        },
        subscription: {
          plan: 'free',
          status: 'active',
        },
      });
    } catch (err: any) {
      setError(err.message || 'Erreur lors de l\'inscription');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const signInWithGoogle = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const provider = new GoogleAuthProvider();
      const userCredential = await signInWithPopup(auth, provider);
      
          // Vérifier si l'utilisateur existe déjà
          const existingUser = await userService.getUserByEmail(userCredential.user.email!);
          
          if (!existingUser) {
            // Créer un nouvel utilisateur
            await userService.createUser({
              email: userCredential.user.email!,
              name: userCredential.user.displayName || 'Utilisateur',
              photoURL: userCredential.user.photoURL || null, // Utiliser null au lieu d'undefined
              role: 'user',
              preferences: {
                theme: 'dark',
                notifications: true,
                language: 'fr',
              },
              subscription: {
                plan: 'free',
                status: 'active',
              },
            });
          }
    } catch (err: any) {
      setError(err.message || 'Erreur de connexion Google');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const signOut = async () => {
    try {
      setLoading(true);
      setError(null);
      await firebaseSignOut(auth);
    } catch (err: any) {
      setError(err.message || 'Erreur de déconnexion');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const refreshUser = async () => {
    if (firebaseUser) {
      try {
        const userData = await userService.getUserByEmail(firebaseUser.email!);
        setUser(userData);
      } catch (err) {
        console.error('Error refreshing user:', err);
        setError('Erreur lors du rafraîchissement des données');
      }
    }
  };

  const value: UseUserReturn = {
    user,
    loading,
    error,
    signIn,
    signUp,
    signInWithGoogle,
    signOut,
    refreshUser,
  };

  return (
    <UserContext.Provider value={value}>
      {children}
    </UserContext.Provider>
  );
}

export function useUser(): UseUserReturn {
  const context = useContext(UserContext);
  if (context === undefined) {
    throw new Error('useUser must be used within a FirebaseUserProvider');
  }
  return context;
}




