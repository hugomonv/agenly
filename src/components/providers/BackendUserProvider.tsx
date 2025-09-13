'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';
import { User, UseUserReturn } from '@/types/frontend';

const UserContext = createContext<UseUserReturn | undefined>(undefined);

export function BackendUserProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Vérifier si l'utilisateur est connecté au chargement
  useEffect(() => {
    checkAuthStatus();
  }, []);

  const checkAuthStatus = async () => {
    try {
      const token = localStorage.getItem('access_token');
      if (!token) {
        setLoading(false);
        return;
      }

      // TODO: Vérifier la validité du token avec le backend
      // Pour l'instant, on simule un utilisateur connecté
      const userData = localStorage.getItem('user_data');
      if (userData) {
        setUser(JSON.parse(userData));
      }
    } catch (err) {
      console.error('Erreur lors de la vérification de l\'authentification:', err);
      localStorage.removeItem('access_token');
      localStorage.removeItem('user_data');
    } finally {
      setLoading(false);
    }
  };

  const signIn = async (email: string, password: string) => {
    try {
      setLoading(true);
      setError(null);

      const response = await fetch('http://localhost:3001/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password }),
      });

      const data = await response.json();

      if (!data.success) {
        throw new Error(data.error || 'Erreur de connexion');
      }

      // Sauvegarder les tokens et données utilisateur
      localStorage.setItem('access_token', data.data.tokens.access_token);
      localStorage.setItem('refresh_token', data.data.tokens.refresh_token);
      localStorage.setItem('user_data', JSON.stringify(data.data.user));

      setUser({
        id: data.data.user.id,
        email: data.data.user.email,
        displayName: data.data.user.name,
        photoURL: undefined,
        usage: {
          agentsCreated: 0,
          lastActivity: new Date(),
        },
        createdAt: new Date(data.data.user.created_at),
        updatedAt: new Date(),
      });

    } catch (err: any) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const signUp = async (email: string, password: string, displayName: string) => {
    try {
      setLoading(true);
      setError(null);

      const response = await fetch('http://localhost:3001/api/auth/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          email, 
          password, 
          name: displayName,
          company: 'Default Company'
        }),
      });

      const data = await response.json();

      if (!data.success) {
        throw new Error(data.error || 'Erreur lors de l\'inscription');
      }

      // Après l'inscription, connecter automatiquement l'utilisateur
      await signIn(email, password);

    } catch (err: any) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const signInWithGoogle = async () => {
    try {
      setLoading(true);
      setError(null);

      // TODO: Implémenter l'authentification Google avec le backend
      // Pour l'instant, on simule une connexion Google
      const mockUser = {
        id: 'google_user_123',
        email: 'user@gmail.com',
        name: 'Google User',
        role: 'admin',
        tenant_id: 'tenant_123',
        created_at: new Date().toISOString()
      };

      const mockTokens = {
        access_token: 'google_access_token_123',
        refresh_token: 'google_refresh_token_123',
        expires_in: 3600
      };

      localStorage.setItem('access_token', mockTokens.access_token);
      localStorage.setItem('refresh_token', mockTokens.refresh_token);
      localStorage.setItem('user_data', JSON.stringify(mockUser));

      setUser({
        id: mockUser.id,
        email: mockUser.email,
        displayName: mockUser.name,
        photoURL: undefined,
        usage: {
          agentsCreated: 0,
          lastActivity: new Date(),
        },
        createdAt: new Date(mockUser.created_at),
        updatedAt: new Date(),
      });

    } catch (err: any) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const signOut = async () => {
    try {
      setLoading(true);

      const refreshToken = localStorage.getItem('refresh_token');
      if (refreshToken) {
        // Appeler l'API de déconnexion du backend
        await fetch('http://localhost:3001/api/auth/logout', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ refresh_token: refreshToken }),
        });
      }

      // Nettoyer le localStorage
      localStorage.removeItem('access_token');
      localStorage.removeItem('refresh_token');
      localStorage.removeItem('user_data');

      setUser(null);
      setError(null);

    } catch (err) {
      console.error('Erreur lors de la déconnexion:', err);
      // Nettoyer quand même le localStorage même en cas d'erreur
      localStorage.removeItem('access_token');
      localStorage.removeItem('refresh_token');
      localStorage.removeItem('user_data');
      setUser(null);
    } finally {
      setLoading(false);
    }
  };

  const refreshToken = async () => {
    try {
      const refreshToken = localStorage.getItem('refresh_token');
      if (!refreshToken) {
        throw new Error('No refresh token available');
      }

      const response = await fetch('http://localhost:3001/api/auth/refresh', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ refresh_token: refreshToken }),
      });

      const data = await response.json();

      if (!data.success) {
        throw new Error(data.error || 'Token refresh failed');
      }

      localStorage.setItem('access_token', data.data.tokens.access_token);
      return data.data.tokens.access_token;

    } catch (err) {
      console.error('Erreur lors du rafraîchissement du token:', err);
      await signOut();
      throw err;
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
    refreshToken,
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
    throw new Error('useUser must be used within a BackendUserProvider');
  }
  return context;
}




