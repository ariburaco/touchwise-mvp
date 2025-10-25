'use client';

import { useEffect, useRef, useState } from 'react';
import Vapi from '@vapi-ai/web';

interface UseVapiOptions {
  publicKey: string;
  assistantId: string;
  systemPrompt?: string;
}

interface VapiState {
  isCallActive: boolean;
  isMuted: boolean;
  isUserSpeaking: boolean;
  isAssistantSpeaking: boolean;
  error: string | null;
}

export function useVapi({
  publicKey,
  assistantId,
  systemPrompt,
}: UseVapiOptions) {
  const vapiRef = useRef<Vapi | null>(null);
  const [state, setState] = useState<VapiState>({
    isCallActive: false,
    isMuted: false,
    isUserSpeaking: false,
    isAssistantSpeaking: false,
    error: null,
  });

  useEffect(() => {
    if (!publicKey) {
      setState((prev) => ({
        ...prev,
        error: 'VAPI public key is required',
      }));
      return;
    }

    // Initialize VAPI
    vapiRef.current = new Vapi(publicKey);

    const vapi = vapiRef.current;

    // Event listeners
    vapi.on('call-start', () => {
      setState((prev) => ({
        ...prev,
        isCallActive: true,
        error: null,
      }));
    });

    vapi.on('call-end', () => {
      setState((prev) => ({
        ...prev,
        isCallActive: false,
        isUserSpeaking: false,
        isAssistantSpeaking: false,
      }));
    });

    vapi.on('speech-start', () => {
      setState((prev) => ({
        ...prev,
        isUserSpeaking: true,
      }));
    });

    vapi.on('speech-end', () => {
      setState((prev) => ({
        ...prev,
        isUserSpeaking: false,
      }));
    });

    vapi.on('message', (message) => {
      // Handle messages if needed
      if (message.type === 'transcript' && message.role === 'assistant') {
        setState((prev) => ({
          ...prev,
          isAssistantSpeaking: true,
        }));
      }
    });

    vapi.on('error', (error) => {
      setState((prev) => ({
        ...prev,
        error: error.message || 'An error occurred',
      }));
    });

    // Cleanup
    return () => {
      if (vapi) {
        vapi.stop();
      }
    };
  }, [publicKey]);

  const startCall = async () => {
    if (!vapiRef.current || !assistantId) {
      setState((prev) => ({
        ...prev,
        error: 'VAPI not initialized or missing assistant ID',
      }));
      return;
    }

    try {
      const assistantOverrides = systemPrompt
        ? {
            model: {
              provider: 'openai',
              model: 'gpt-4o-realtime-preview-2024-12-17',
              messages: [
                {
                  role: 'system',
                  content: systemPrompt,
                },
              ],
            },
          }
        : undefined;

      await vapiRef.current.start(assistantId, assistantOverrides);
    } catch (error) {
      setState((prev) => ({
        ...prev,
        error: error instanceof Error ? error.message : 'Failed to start call',
      }));
    }
  };

  const endCall = () => {
    if (vapiRef.current) {
      vapiRef.current.stop();
    }
  };

  const toggleMute = () => {
    if (vapiRef.current) {
      const newMutedState = !state.isMuted;
      vapiRef.current.setMuted(newMutedState);
      setState((prev) => ({
        ...prev,
        isMuted: newMutedState,
      }));
    }
  };

  return {
    ...state,
    startCall,
    endCall,
    toggleMute,
  };
}
