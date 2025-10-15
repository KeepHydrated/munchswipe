import { useState, useEffect } from 'react';
import { Header } from '@/components/Header';
import { Card } from '@/components/ui/card';
import { MapPin, Star, ExternalLink } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useSession } from '@/hooks/useSession';
import { supabase } from '@/integrations/supabase/client';

interface Match {
  id: string;
  restaurant_id: string;
  restaurant_name: string;
  restaurant_data: any;
  created_at: string;
}

export default function Matches() {
  const { sessionId } = useSession();
  const [matches, setMatches] = useState<Match[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadMatches();
    
    // Set up real-time subscription
    const channel = supabase
      .channel('matches-changes')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'restaurant_matches',
          filter: `session_1_id=eq.${sessionId},session_2_id=eq.${sessionId}`
        },
        () => {
          loadMatches();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [sessionId]);

  const loadMatches = async () => {
    if (!sessionId) return;
    
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('restaurant_matches')
        .select('*')
        .or(`session_1_id.eq.${sessionId},session_2_id.eq.${sessionId}`)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setMatches(data || []);
    } catch (error) {
      console.error('Error loading matches:', error);
    } finally {
      setLoading(false);
    }
  };

  const openInMaps = (restaurant: any) => {
    const query = encodeURIComponent(restaurant.name + ' ' + (restaurant.address || ''));
    window.open(`https://www.google.com/maps/search/?api=1&query=${query}`, '_blank');
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <div className="max-w-4xl mx-auto px-4 py-8">
          <div className="text-center text-muted-foreground">Loading matches...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <div className="max-w-4xl mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold mb-2">Mutual Matches</h1>
        <p className="text-muted-foreground mb-6">
          Restaurants you both liked
        </p>

        {matches.length === 0 ? (
          <Card className="p-8 text-center">
            <p className="text-muted-foreground mb-4">
              No mutual matches yet. Share your link with someone and start swiping!
            </p>
            <p className="text-sm text-muted-foreground">
              When you both like the same restaurant, it will appear here.
            </p>
          </Card>
        ) : (
          <div className="space-y-3">
            {matches.map((match) => {
              const restaurant = match.restaurant_data;
              return (
                <Card key={match.id} className="p-4">
                  <div className="flex gap-4">
                    {restaurant.photoUrl && (
                      <img
                        src={restaurant.photoUrl}
                        alt={match.restaurant_name}
                        className="w-24 h-24 rounded-lg object-cover flex-shrink-0"
                      />
                    )}
                    <div className="flex-1">
                      <h3 className="font-semibold text-lg mb-1">{match.restaurant_name}</h3>
                      {restaurant.address && (
                        <div className="flex items-center gap-1 text-sm text-muted-foreground mb-2">
                          <MapPin className="w-3 h-3" />
                          <span>{restaurant.address}</span>
                        </div>
                      )}
                      <div className="flex gap-3 text-sm mb-3">
                        {restaurant.rating && (
                          <span className="text-muted-foreground">⭐ {restaurant.rating}</span>
                        )}
                        {restaurant.cuisine && (
                          <span className="text-muted-foreground">{restaurant.cuisine}</span>
                        )}
                        {restaurant.distance && (
                          <span className="text-muted-foreground">{restaurant.distance.toFixed(1)} mi</span>
                        )}
                      </div>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => openInMaps(restaurant)}
                      >
                        <ExternalLink className="w-4 h-4 mr-2" />
                        Open in Maps
                      </Button>
                    </div>
                  </div>
                </Card>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
