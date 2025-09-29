import React, { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { MapPin, Navigation } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import GoogleMap from '@/components/GoogleMap';
import RestaurantList from '@/components/RestaurantList';
import { loadGoogleMaps } from '@/lib/googleMapsLoader';

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

interface UserLocation {
  latitude: number;
  longitude: number;
}

const RestaurantFinder = () => {
  const [restaurants, setRestaurants] = useState<Restaurant[]>([]);
  const [loading, setLoading] = useState(false);
  const [userLocation, setUserLocation] = useState<UserLocation | null>(null);
  const [googleMapsApiKey] = useState('AIzaSyASk-OpxAIgawBXmdyFi-C7QMMPFDq7jlU');
  const [viewMode, setViewMode] = useState<'map' | 'list'>('map');
  
  const { toast } = useToast();

  const getCurrentLocation = useCallback(() => {
    if (!navigator.geolocation) {
      toast({
        title: "Location Error",
        description: "Geolocation is not supported by your browser",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const location = {
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
        };
        setUserLocation(location);
        setLoading(false);
        toast({
          title: "Location Found",
          description: "Successfully got your current location!",
        });
      },
      (error) => {
        setLoading(false);
        toast({
          title: "Location Error",
          description: `Failed to get location: ${error.message}`,
          variant: "destructive",
        });
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 60000 }
    );
  }, [toast]);

  const fetchRestaurants = useCallback(async () => {
    if (!userLocation || typeof google === 'undefined' || !google.maps) return;

    setLoading(true);
    try {
      const location = new google.maps.LatLng(userLocation.latitude, userLocation.longitude);
      const map = new google.maps.Map(document.createElement('div'));
      
      const service = new google.maps.places.PlacesService(map);
      const request = {
        location: location,
        radius: 16093, // 10 miles in meters
        type: 'restaurant'
      };

      service.nearbySearch(request, (results, status) => {
        if (status === google.maps.places.PlacesServiceStatus.OK && results) {
          const restaurantData: Restaurant[] = results.map((place) => {
            const distance = place.geometry?.location 
              ? google.maps.geometry.spherical.computeDistanceBetween(
                  location,
                  place.geometry.location
                ) * 0.000621371 // Convert meters to miles
              : 0;

            return {
              id: place.place_id || '',
              name: place.name || 'Unknown Restaurant',
              address: place.vicinity || '',
              distance: parseFloat(distance.toFixed(1)),
              rating: place.rating,
              cuisine: place.types?.[0]?.replace(/_/g, ' ') || undefined,
              phone: undefined,
              website: undefined,
              latitude: place.geometry?.location?.lat() || userLocation.latitude,
              longitude: place.geometry?.location?.lng() || userLocation.longitude,
            };
          }).sort((a, b) => a.distance - b.distance);

          setRestaurants(restaurantData);
          toast({
            title: "Success",
            description: `Found ${restaurantData.length} restaurants nearby!`,
          });
        } else {
          throw new Error('Failed to fetch restaurants from Google Places');
        }
        setLoading(false);
      });
    } catch (error) {
      setLoading(false);
      toast({
        title: "Error",
        description: "Failed to fetch restaurants. Please try again.",
        variant: "destructive",
      });
    }
  }, [userLocation, toast]);

  useEffect(() => {
    loadGoogleMaps(googleMapsApiKey).then(() => {
      getCurrentLocation();
    });
  }, [googleMapsApiKey, getCurrentLocation]);

  useEffect(() => {
    if (userLocation) {
      fetchRestaurants();
    }
  }, [userLocation, fetchRestaurants]);

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="sticky top-0 z-50 bg-background/95 backdrop-blur-sm border-b border-border shadow-card">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-gradient-primary rounded-lg flex items-center justify-center">
                <MapPin className="w-5 h-5 text-primary-foreground" />
              </div>
              <h1 className="text-2xl font-bold bg-gradient-primary bg-clip-text text-transparent">
                Restaurant Finder
              </h1>
            </div>
            
            <div className="flex items-center space-x-2">
              <Button
                variant={viewMode === 'map' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setViewMode('map')}
                className="transition-smooth"
              >
                Map
              </Button>
              <Button
                variant={viewMode === 'list' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setViewMode('list')}
                className="transition-smooth"
              >
                List
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={getCurrentLocation}
                disabled={loading}
                className="transition-smooth hover:shadow-glow"
              >
                <Navigation className="w-4 h-4 mr-2" />
                {loading ? 'Finding...' : 'Update Location'}
              </Button>
            </div>
          </div>

          {userLocation && (
            <div className="mt-3 flex items-center text-sm text-muted-foreground">
              <MapPin className="w-4 h-4 mr-1" />
              Location: {userLocation.latitude.toFixed(4)}, {userLocation.longitude.toFixed(4)}
              <Badge variant="secondary" className="ml-2">
                {restaurants.length} restaurants found
              </Badge>
            </div>
          )}
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 py-6">
        {loading && (
          <div className="text-center py-12">
            <div className="w-12 h-12 mx-auto mb-4 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
            <p className="text-muted-foreground">Finding restaurants near you...</p>
          </div>
        )}

        {!loading && userLocation && (
          <>
            {viewMode === 'map' ? (
              <GoogleMap
                apiKey={googleMapsApiKey}
                userLocation={userLocation}
                restaurants={restaurants}
                className="w-full h-[70vh] rounded-lg shadow-card"
              />
            ) : (
              <RestaurantList restaurants={restaurants} />
            )}
          </>
        )}

        {!loading && !userLocation && (
          <div className="text-center py-12">
            <MapPin className="w-16 h-16 mx-auto mb-4 text-muted-foreground" />
            <h2 className="text-xl font-semibold mb-2">Location Required</h2>
            <p className="text-muted-foreground mb-6">
              We need your location to find restaurants near you
            </p>
            <Button onClick={getCurrentLocation} className="bg-gradient-primary hover:shadow-warm transition-bounce">
              <Navigation className="w-4 h-4 mr-2" />
              Enable Location
            </Button>
          </div>
        )}
      </div>
    </div>
  );
};

export default RestaurantFinder;