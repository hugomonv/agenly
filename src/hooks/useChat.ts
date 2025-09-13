import { useState, useCallback } from 'react';
import { Message } from '@/types/frontend';

interface UseChatReturn {
  messages: Message[];
  loading: boolean;
  error: string | null;
  sendMessage: (message: string, agentId?: string) => Promise<void>;
  clearConversation: () => void;
}

export function useChat(): UseChatReturn {
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [context, setContext] = useState<any>({});
  const [generatedAgent, setGeneratedAgent] = useState<any>(null);

  const sendMessage = useCallback(async (message: string, agentId?: string) => {
    if (!message.trim()) return;

    const userMessage: Message = {
      id: `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      role: 'user',
      content: message,
      timestamp: new Date(),
    };

    setMessages(prev => [...prev, userMessage]);
    setLoading(true);
    setError(null);

    try {
      // Appel à l'API Next.js
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message,
          agentId,
          conversationId: `conv_${Date.now()}`,
          userId: 'current-user', // TODO: Récupérer l'ID utilisateur depuis le contexte
          context,
        }),
      });

      if (!response.ok) {
        throw new Error(`Erreur API: ${response.status}`);
      }

      const data = await response.json();

      if (!data.success) {
        throw new Error(data.error || 'Erreur lors du traitement du message');
      }

      // Mettre à jour le contexte si fourni
      if (data.context) {
        setContext(data.context);
      }

      // Si un agent a été généré, le sauvegarder
      if (data.agent) {
        setGeneratedAgent(data.agent);
      }

      const assistantMessage: Message = {
        id: data.messageId || `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        role: 'assistant',
        content: data.message || 'Réponse reçue de l\'agent IA',
        timestamp: new Date(),
        metadata: {
          model_used: data.metadata?.model_used || 'gpt-4',
          tokens_used: data.metadata?.tokens_used,
          processing_time: data.metadata?.processing_time,
          integrations_used: data.metadata?.integrations_used,
        },
      };

      setMessages(prev => [...prev, assistantMessage]);
    } catch (err) {
      console.error('Erreur lors de l\'envoi du message:', err);
      setError(err instanceof Error ? err.message : 'Erreur inconnue');
      
      // Message d'erreur
      const errorMessage: Message = {
        id: `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        role: 'assistant',
        content: 'Désolé, une erreur s\'est produite. Veuillez réessayer.',
        timestamp: new Date(),
        metadata: {
          confidence_score: 0,
        },
      };
      
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setLoading(false);
    }
  }, []);

  const clearConversation = useCallback(() => {
    setMessages([]);
    setError(null);
  }, []);

  return {
    messages,
    loading,
    error,
    sendMessage,
    clearConversation,
  };
}



