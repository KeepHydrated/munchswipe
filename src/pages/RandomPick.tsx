import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { MapPin, Star, Navigation, Shuffle, ArrowLeft, Image as ImageIcon, Clock } from 'lucide-react';
import { useRestaurants } from '@/contexts/RestaurantContext';
import { Link } from 'react-router-dom';

const RandomPick = () => {
  const { restaurants } = useRestaurants();
  const [selectedRestaurant, setSelectedRestaurant] = useState<typeof restaurants[0] | null>(null);
  const [recentlyShown, setRecentlyShown] = useState<string[]>([]);

  const getRandomRestaurant = () => {
    if (restaurants.length === 0) return;
    
    // Get restaurants that haven't been shown recently
    const availableRestaurants = restaurants.filter(
      r => !recentlyShown.includes(r.id)
    );
    
    // If all restaurants have been shown, reset the history but keep current one
    const poolToChooseFrom = availableRestaurants.length > 0 
      ? availableRestaurants 
      : restaurants.filter(r => r.id !== selectedRestaurant?.id);
    
    // Pick a random restaurant from the available pool
    const randomIndex = Math.floor(Math.random() * poolToChooseFrom.length);
    const newRestaurant = poolToChooseFrom[randomIndex];
    
    setSelectedRestaurant(newRestaurant);
    
    // Update recently shown list (keep last 5 or half of total restaurants, whichever is smaller)
    const maxHistory = Math.min(5, Math.floor(restaurants.length / 2));
    setRecentlyShown(prev => {
      const updated = [...prev, newRestaurant.id];
      return updated.slice(-maxHistory);
    });
  };

  // Automatically pick a random restaurant when restaurants are available
  useEffect(() => {
    if (restaurants.length > 0 && !selectedRestaurant) {
      getRandomRestaurant();
    }
  }, [restaurants.length]);

  return (
    <div className="min-h-screen bg-gradient-subtle">
      {/* Header */}
      <div className="sticky top-0 z-50 bg-background/95 backdrop-blur-sm border-b border-border shadow-card">
        <div className="max-w-4xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <Link to="/">
                <Button variant="ghost" size="icon" className="transition-smooth">
                  <ArrowLeft className="w-5 h-5" />
                </Button>
              </Link>
              <div className="w-10 h-10 bg-gradient-primary rounded-lg flex items-center justify-center">
                <Shuffle className="w-5 h-5 text-primary-foreground" />
              </div>
              <h1 className="text-2xl font-bold bg-gradient-primary bg-clip-text text-transparent">
                Random Pick
              </h1>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-4xl mx-auto px-4 py-12">
        {restaurants.length === 0 ? (
          <Card className="shadow-warm">
            <CardContent className="text-center py-12">
              <MapPin className="w-16 h-16 mx-auto mb-4 text-muted-foreground" />
              <h2 className="text-xl font-semibold mb-2">No Restaurants Found</h2>
              <p className="text-muted-foreground mb-6">
                Please go to the main page to find restaurants near you first.
              </p>
              <Link to="/">
                <Button className="bg-gradient-primary hover:shadow-warm transition-bounce">
                  <Navigation className="w-4 h-4 mr-2" />
                  Find Restaurants
                </Button>
              </Link>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-8">
            {selectedRestaurant && (
              <Card className="shadow-warm animate-in fade-in slide-in-from-bottom-4 duration-500">
                {selectedRestaurant.photoUrl ? (
                  <div className="relative w-full h-64 overflow-hidden rounded-t-lg">
                    <img 
                      src={selectedRestaurant.photoUrl} 
                      alt={selectedRestaurant.name}
                      className="w-full h-full object-cover"
                      onLoad={() => console.log('Image loaded successfully:', selectedRestaurant.photoUrl)}
                      onError={(e) => {
                        console.error('Image failed to load:', selectedRestaurant.photoUrl);
                        const parent = e.currentTarget.parentElement;
                        if (parent) {
                          parent.innerHTML = '<div class="w-full h-full bg-gradient-subtle flex items-center justify-center"><div class="text-center"><svg class="w-16 h-16 mx-auto text-muted-foreground" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"></path></svg><p class="text-muted-foreground mt-2 text-sm">No image available</p></div></div>';
                        }
                      }}
                    />
                  </div>
                ) : (
                  <div className="relative w-full h-64 bg-gradient-subtle flex items-center justify-center rounded-t-lg">
                    <div className="text-center">
                      <ImageIcon className="w-16 h-16 mx-auto text-muted-foreground mb-2" />
                      <p className="text-muted-foreground text-sm">No image available</p>
                    </div>
                  </div>
                )}
                <CardHeader className="text-center pb-4">
                  <CardTitle className="text-3xl">{selectedRestaurant.name}</CardTitle>
                  {selectedRestaurant.cuisine && (
                    <p className="text-lg text-muted-foreground capitalize mt-2">
                      {selectedRestaurant.cuisine}
                    </p>
                  )}
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="space-y-4">
                    <div className="flex items-start space-x-3">
                      <MapPin className="w-5 h-5 text-primary mt-1 flex-shrink-0" />
                      <div>
                        <p className="text-muted-foreground">{selectedRestaurant.address}</p>
                        <p className="text-primary font-semibold mt-1">
                          {selectedRestaurant.distance} miles away
                        </p>
                      </div>
                    </div>

                    {selectedRestaurant.rating && (
                      <div className="flex items-center space-x-3">
                        <Star className="w-5 h-5 text-primary flex-shrink-0" fill="currentColor" />
                        <p className="text-lg font-semibold">{selectedRestaurant.rating} / 5</p>
                      </div>
                    )}

                    {selectedRestaurant.openingHours && selectedRestaurant.openingHours.length > 0 && (() => {
                      const today = new Date().getDay();
                      const todayHours = selectedRestaurant.openingHours[today];
                      // Try both en dash (–) and hyphen (-)
                      const closingTime = todayHours?.split(/[–-]/)[1]?.trim();
                      
                      return closingTime ? (
                        <div className="flex items-center space-x-3">
                          <Clock className="w-5 h-5 text-primary flex-shrink-0" />
                          <span className="text-muted-foreground">Closes at {closingTime}</span>
                        </div>
                      ) : null;
                    })()}
                  </div>

                  <div className="pt-4 flex gap-3">
                    <Button 
                      onClick={getRandomRestaurant}
                      className="flex-1 transition-smooth"
                      variant="outline"
                    >
                      <Shuffle className="w-4 h-4 mr-2" />
                      Pick Another
                    </Button>
                    <Button 
                      onClick={() => {
                        const mapsUrl = `https://www.google.com/maps/dir/?api=1&destination=${selectedRestaurant.latitude},${selectedRestaurant.longitude}`;
                        window.open(mapsUrl, '_blank');
                      }}
                      className="flex-1 bg-gradient-primary hover:shadow-warm transition-bounce"
                    >
                      <Navigation className="w-4 h-4 mr-2" />
                      Get Directions
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default RandomPick;
