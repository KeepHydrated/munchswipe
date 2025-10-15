import { useState, useEffect } from 'react';
import { Header } from '@/components/Header';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Eye, MapPin } from 'lucide-react';
import { toast } from '@/hooks/use-toast';

interface Restaurant {
  id: string;
  name: string;
  address: string;
  rating?: number;
  cuisine?: string;
  distance?: number;
}

export default function HiddenRestaurants() {
  const [hiddenRestaurants, setHiddenRestaurants] = useState<Restaurant[]>([]);

  useEffect(() => {
    loadHiddenRestaurants();
  }, []);

  const loadHiddenRestaurants = () => {
    const hidden = localStorage.getItem('hiddenRestaurants');
    const restaurantData = localStorage.getItem('restaurantData');
    
    if (hidden && restaurantData) {
      const hiddenIds = JSON.parse(hidden);
      const allRestaurants = JSON.parse(restaurantData);
      
      const hiddenList = hiddenIds
        .map((id: string) => allRestaurants.find((r: Restaurant) => r.id === id))
        .filter(Boolean);
      
      setHiddenRestaurants(hiddenList);
    }
  };

  const unhideRestaurant = (restaurantId: string, restaurantName: string) => {
    const hidden = localStorage.getItem('hiddenRestaurants');
    if (hidden) {
      const hiddenIds = JSON.parse(hidden);
      const newHidden = hiddenIds.filter((id: string) => id !== restaurantId);
      localStorage.setItem('hiddenRestaurants', JSON.stringify(newHidden));
      
      setHiddenRestaurants(prev => prev.filter(r => r.id !== restaurantId));
      
      toast({
        title: "Restaurant Unhidden",
        description: `${restaurantName} can be suggested again`,
      });
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="flex items-start justify-between mb-6">
          <div>
            <h1 className="text-3xl font-bold mb-2">Hidden Restaurants</h1>
            <p className="text-muted-foreground">
              These restaurants won't be suggested to you
            </p>
          </div>
          {hiddenRestaurants.length > 0 && (
            <Button
              variant="outline"
              onClick={() => {
                localStorage.setItem('hiddenRestaurants', JSON.stringify([]));
                setHiddenRestaurants([]);
                toast({
                  title: "All Restaurants Unhidden",
                  description: "All restaurants can be suggested again",
                });
              }}
            >
              Unhide All
            </Button>
          )}
        </div>

        {hiddenRestaurants.length === 0 ? (
          <Card className="p-8 text-center">
            <p className="text-muted-foreground">
              No hidden restaurants yet. Swipe down or click "Don't Show Again" to hide restaurants.
            </p>
          </Card>
        ) : (
          <div className="space-y-3">
            {hiddenRestaurants.map((restaurant) => (
              <Card key={restaurant.id} className="p-4">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1">
                    <h3 className="font-semibold text-lg mb-1">{restaurant.name}</h3>
                    {restaurant.address && (
                      <div className="flex items-center gap-1 text-sm text-muted-foreground mb-2">
                        <MapPin className="w-3 h-3" />
                        <span>{restaurant.address}</span>
                      </div>
                    )}
                    <div className="flex gap-3 text-sm">
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
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => unhideRestaurant(restaurant.id, restaurant.name)}
                  >
                    <Eye className="w-4 h-4 mr-2" />
                    Unhide
                  </Button>
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
