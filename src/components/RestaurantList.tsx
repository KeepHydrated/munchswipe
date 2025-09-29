import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { MapPin, Star, Phone, Globe, Navigation, Image as ImageIcon, Clock } from 'lucide-react';

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
  photoUrl?: string;
  openNow?: boolean;
  openingHours?: string[];
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
            <Card key={restaurant.id} className="shadow-card hover:shadow-warm transition-smooth overflow-hidden">
              <CardContent className="p-0">
                <div className="flex flex-col sm:flex-row">
                  {/* Restaurant Photo */}
                  <div className="w-full sm:w-48 h-48 flex-shrink-0">
                    {restaurant.photoUrl ? (
                      <img 
                        src={restaurant.photoUrl} 
                        alt={restaurant.name}
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          e.currentTarget.style.display = 'none';
                          const parent = e.currentTarget.parentElement;
                          if (parent) {
                            parent.innerHTML = '<div class="w-full h-full bg-gradient-subtle flex items-center justify-center"><svg class="w-12 h-12 text-muted-foreground" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"></path></svg></div>';
                          }
                        }}
                      />
                    ) : (
                      <div className="w-full h-full bg-gradient-subtle flex items-center justify-center">
                        <ImageIcon className="w-12 h-12 text-muted-foreground" />
                      </div>
                    )}
                  </div>

                  {/* Restaurant Info */}
                  <div className="flex-1 p-6">
                    <div className="flex items-start gap-3 mb-3">
                      <div className="w-10 h-10 bg-gradient-primary rounded-lg flex items-center justify-center flex-shrink-0">
                        <MapPin className="w-5 h-5 text-primary-foreground" />
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

                          {restaurant.openNow !== undefined && (
                            <Badge 
                              variant={restaurant.openNow ? "default" : "secondary"}
                              className={restaurant.openNow ? "bg-green-500 hover:bg-green-600 text-xs" : "text-xs"}
                            >
                              <Clock className="w-3 h-3 mr-1" />
                              {restaurant.openNow ? "Open" : "Closed"}
                            </Badge>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-3 mt-4 flex-wrap">
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