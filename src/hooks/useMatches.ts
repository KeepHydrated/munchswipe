import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface Match {
  id: string;
  restaurant_id: string;
  restaurant_name: string;
  restaurant_data: any;
  created_at: string;
}

export const useMatches = (sessionId: string | null, partnerSessionId: string | null) => {
  const [matches, setMatches] = useState<Match[]>([]);
  const [matchedRestaurantIds, setMatchedRestaurantIds] = useState<Set<string>>(new Set());

  useEffect(() => {
    if (!sessionId) return;

    const fetchMatches = async () => {
      const { data, error } = await supabase
        .from('restaurant_matches')
        .select('*')
        .or(`session_1_id.eq.${sessionId},session_2_id.eq.${sessionId}`);

      if (data && !error) {
        setMatches(data);
        setMatchedRestaurantIds(new Set(data.map(m => m.restaurant_id)));
      }
    };

    fetchMatches();

    // Listen for new matches in realtime
    const channel = supabase
      .channel('matches')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'restaurant_matches',
          filter: `session_1_id=eq.${sessionId},session_2_id=eq.${sessionId}`,
        },
        (payload) => {
          const newMatch = payload.new as Match;
          setMatches(prev => [...prev, newMatch]);
          setMatchedRestaurantIds(prev => new Set([...prev, newMatch.restaurant_id]));
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [sessionId]);

  return { matches, matchedRestaurantIds };
};
