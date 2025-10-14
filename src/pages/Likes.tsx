import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Heart, MapPin, Star, Navigation } from 'lucide-react';
import { useSession } from '@/hooks/useSession';
import { supabase } from '@/integrations/supabase/client';
import { useNavigate } from 'react-router-dom';
import { Header } from '@/components/Header';

interface LikedRestaurant {
  id: string;
  restaurant_id: string;
  restaurant_name: string;
  restaurant_data: {
    name: string;
    address: string;
    distance: number;
    rating?: number;
    cuisine?: string;
    photoUrl?: string;
    latitude: number;
    longitude: number;
  };
  created_at: string;
}

const Likes = () => {
  const [likedRestaurants, setLikedRestaurants] = useState<LikedRestaurant[]>([]);
  const [loading, setLoading] = useState(true);
  const { sessionId } = useSession();
  const navigate = useNavigate();

  useEffect(() => {
    if (sessionId) {
      fetchLikedRestaurants();
    }
  }, [sessionId]);

  const fetchLikedRestaurants = async () => {
    if (!sessionId) return;

    setLoading(true);
    const { data, error } = await supabase
      .from('restaurant_swipes')
      .select('*')
      .eq('session_id', sessionId)
      .eq('liked', true)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching liked restaurants:', error);
    } else {
      setLikedRestaurants((data || []) as unknown as LikedRestaurant[]);
    }
    setLoading(false);
  };

  const getDirections = (lat: number, lng: number) => {
    const url = `https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}`;
    window.open(url, '_blank');
  };

  return (
    <div className="min-h-screen bg-gradient-subtle">
      <Header />

      {/* Content */}
      <div className="max-w-4xl mx-auto px-4 py-8">
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
          </div>
        ) : likedRestaurants.length === 0 ? (
          <Card className="text-center py-12">
            <CardContent>
              <Heart className="h-16 w-16 mx-auto mb-4 text-muted-foreground" />
              <h2 className="text-2xl font-semibold mb-2">No Likes Yet</h2>
              <p className="text-muted-foreground mb-6">
                Start swiping right on restaurants you like to see them here!
              </p>
              <Button onClick={() => navigate('/random')}>
                Start Swiping
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            <p className="text-muted-foreground mb-4">
              You've liked {likedRestaurants.length} restaurant{likedRestaurants.length !== 1 ? 's' : ''}
            </p>
            {likedRestaurants.map((item) => {
              const restaurant = item.restaurant_data;
              return (
                <Card key={item.id} className="overflow-hidden hover:shadow-lg transition-shadow">
                  <div className="flex flex-col md:flex-row">
                    {restaurant.photoUrl && (
                      <div className="w-full md:w-48 h-48 md:h-auto bg-muted flex-shrink-0">
                        <img
                          src={restaurant.photoUrl}
                          alt={restaurant.name}
                          className="w-full h-full object-cover"
                        />
                      </div>
                    )}
                    <div className="flex-1">
                      <CardHeader>
                        <div className="flex items-start justify-between gap-4">
                          <div className="flex-1">
                            <CardTitle className="text-xl mb-2">{restaurant.name}</CardTitle>
                            <div className="flex flex-wrap gap-2 mb-2">
                              {restaurant.cuisine && (
                                <Badge variant="secondary">{restaurant.cuisine}</Badge>
                              )}
                              {restaurant.rating && (
                                <Badge variant="outline" className="gap-1">
                                  <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
                                  {restaurant.rating}
                                </Badge>
                              )}
                            </div>
                          </div>
                          <Heart className="h-6 w-6 text-red-500 fill-red-500 flex-shrink-0" />
                        </div>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-3">
                          <div className="flex items-start gap-2 text-sm text-muted-foreground">
                            <MapPin className="h-4 w-4 mt-0.5 flex-shrink-0" />
                            <span>{restaurant.address}</span>
                          </div>
                          <div className="flex items-center gap-2 text-sm text-muted-foreground">
                            <Navigation className="h-4 w-4" />
                            <span>{restaurant.distance} miles away</span>
                          </div>
                          <Button
                            onClick={() => getDirections(restaurant.latitude, restaurant.longitude)}
                            className="w-full md:w-auto"
                            size="sm"
                          >
                            <Navigation className="h-4 w-4 mr-2" />
                            Get Directions
                          </Button>
                        </div>
                      </CardContent>
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
};

export default Likes;
