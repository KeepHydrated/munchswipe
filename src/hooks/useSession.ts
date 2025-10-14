import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

export const useSession = () => {
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [partnerSessionId, setPartnerSessionId] = useState<string | null>(null);

  useEffect(() => {
    // Check URL for shared session ID
    const params = new URLSearchParams(window.location.search);
    const sharedSession = params.get('share');
    
    if (sharedSession) {
      setPartnerSessionId(sharedSession);
      // Store partner session in localStorage
      localStorage.setItem('partnerSessionId', sharedSession);
    } else {
      // Load partner session from localStorage if it exists
      const stored = localStorage.getItem('partnerSessionId');
      if (stored) setPartnerSessionId(stored);
    }

    // Get or create own session ID
    const initSession = async () => {
      let storedSessionId = localStorage.getItem('sessionId');
      
      if (!storedSessionId) {
        // Create new session in database
        const { data, error } = await supabase
          .from('sessions')
          .insert({})
          .select()
          .single();
        
        if (data && !error) {
          storedSessionId = data.id;
          localStorage.setItem('sessionId', storedSessionId);
        }
      }
      
      setSessionId(storedSessionId);
    };

    initSession();
  }, []);

  const generateShareLink = () => {
    if (!sessionId) return '';
    const baseUrl = window.location.origin;
    return `${baseUrl}?share=${sessionId}`;
  };

  return { sessionId, partnerSessionId, generateShareLink };
};
