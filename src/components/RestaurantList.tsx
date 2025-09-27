import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { MapPin, Star, Phone, Globe, Navigation } from 'lucide-react';

interface Restaurant {
  id: string;
  name: string;
  address: string;
  distance: number;
  rating?: number;
  cuisine?: string;
  phone?: string;
  website?: string;
  latitude: number;
  longitude: number;
}

interface RestaurantListProps {
  restaurants: Restaurant[];
}

const RestaurantList: React.FC<RestaurantListProps> = ({ restaurants }) => {
  const handleGetDirections = (restaurant: Restaurant) => {
    const url = `https://www.google.com/maps/dir/?api=1&destination=${restaurant.latitude},${restaurant.longitude}`;
    window.open(url, '_blank');
  };

  if (restaurants.length === 0) {
    return (
      <div className="text-center py-12">
        <div className="w-16 h-16 mx-auto mb-4 bg-muted rounded-full flex items-center justify-center">
          <MapPin className="w-8 h-8 text-muted-foreground" />
        </div>
        <h2 className="text-xl font-semibold mb-2">No Restaurants Found</h2>
        <p className="text-muted-foreground">
          Try updating your location or check your API configuration
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">
          Restaurants Near You
        </h2>
        <Badge variant="secondary" className="text-sm">
          {restaurants.length} found
        </Badge>
      </div>

      <div className="grid gap-4">
        {restaurants
          .sort((a, b) => a.distance - b.distance)
          .map((restaurant) => (
            <Card key={restaurant.id} className="shadow-card hover:shadow-warm transition-smooth">
              <CardContent className="p-6">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-start gap-3 mb-3">
                      <div className="w-12 h-12 bg-gradient-primary rounded-lg flex items-center justify-center flex-shrink-0">
                        <MapPin className="w-6 h-6 text-primary-foreground" />
                      </div>
                      
                      <div className="flex-1">
                        <h3 className="text-lg font-semibold mb-1">{restaurant.name}</h3>
                        <p className="text-muted-foreground text-sm mb-2">{restaurant.address}</p>
                        
                        <div className="flex items-center gap-3 flex-wrap">
                          <Badge 
                            variant="secondary" 
                            className="bg-gradient-primary text-primary-foreground font-medium"
                          >
                            {restaurant.distance} miles away
                          </Badge>
                          
                          {restaurant.rating && (
                            <div className="flex items-center gap-1">
                              <Star className="w-4 h-4 text-yellow-500 fill-current" />
                              <span className="text-sm font-medium">{restaurant.rating}</span>
                            </div>
                          )}
                          
                          {restaurant.cuisine && (
                            <Badge variant="outline" className="text-xs">
                              {restaurant.cuisine}
                            </Badge>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-3 mt-4">
                      <Button
                        size="sm"
                        onClick={() => handleGetDirections(restaurant)}
                        className="bg-gradient-primary hover:shadow-glow transition-bounce"
                      >
                        <Navigation className="w-4 h-4 mr-2" />
                        Get Directions
                      </Button>

                      {restaurant.phone && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => window.open(`tel:${restaurant.phone}`, '_self')}
                          className="transition-smooth hover:shadow-card"
                        >
                          <Phone className="w-4 h-4 mr-2" />
                          Call
                        </Button>
                      )}

                      {restaurant.website && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => window.open(`https://${restaurant.website}`, '_blank')}
                          className="transition-smooth hover:shadow-card"
                        >
                          <Globe className="w-4 h-4 mr-2" />
                          Website
                        </Button>
                      )}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
      </div>
    </div>
  );
};

export default RestaurantList;