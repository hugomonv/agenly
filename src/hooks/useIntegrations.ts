'use client';

import { useState, useEffect, useCallback } from 'react';
import { ConnectedService, UseIntegrationsReturn } from '@/types';

export function useIntegrations(): UseIntegrationsReturn {
  const [connectedServices, setConnectedServices] = useState<ConnectedService[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadConnectedServices = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/connected-services');
      if (!response.ok) {
        throw new Error('Failed to load connected services');
      }

      const data = await response.json();
      if (data.success) {
        setConnectedServices(data.data);
      } else {
        throw new Error(data.error || 'Unknown error');
      }
    } catch (err: any) {
      setError(err.message || 'Erreur lors du chargement des services');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadConnectedServices();
  }, [loadConnectedServices]);

  const connectService = useCallback(async (serviceName: string) => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch(`/api/connect-service/${serviceName}`, {
        method: 'POST',
      });

      if (!response.ok) {
        throw new Error('Failed to connect service');
      }

      const data = await response.json();
      if (data.success) {
        // Redirect to OAuth URL
        window.location.href = data.data.authUrl;
      } else {
        throw new Error(data.error || 'Unknown error');
      }
    } catch (err: any) {
      setError(err.message || 'Erreur lors de la connexion du service');
    } finally {
      setLoading(false);
    }
  }, []);

  const disconnectService = useCallback(async (serviceName: string) => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch(`/api/disconnect-service/${serviceName}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        throw new Error('Failed to disconnect service');
      }

      const data = await response.json();
      if (data.success) {
        setConnectedServices(prev => 
          prev.filter(service => service.serviceName !== serviceName)
        );
      } else {
        throw new Error(data.error || 'Unknown error');
      }
    } catch (err: any) {
      setError(err.message || 'Erreur lors de la déconnexion du service');
    } finally {
      setLoading(false);
    }
  }, []);

  const getServiceData = useCallback(async (serviceName: string) => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch(`/api/google/${serviceName}`);
      if (!response.ok) {
        throw new Error('Failed to get service data');
      }

      const data = await response.json();
      if (data.success) {
        return data.data;
      } else {
        throw new Error(data.error || 'Unknown error');
      }
    } catch (err: any) {
      setError(err.message || 'Erreur lors de la récupération des données');
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  return {
    connectedServices,
    loading,
    error,
    connectService,
    disconnectService,
    getServiceData,
  };
}
