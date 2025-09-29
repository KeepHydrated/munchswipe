import React, { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { MapPin, Navigation, Clock, Star, Phone, Globe } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import GoogleMap from '@/components/GoogleMap';
import RestaurantList from '@/components/RestaurantList';

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
  const [apiEndpoint, setApiEndpoint] = useState('');
  const [googleMapsApiKey, setGoogleMapsApiKey] = useState('AIzaSyASk-OpxAIgawBXmdyFi-C7QMMPFDq7jlU');
  const [showApiInputs, setShowApiInputs] = useState(true);
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
    if (!userLocation || !apiEndpoint) return;

    setLoading(true);
    try {
      // This would be replaced with the user's actual API call
      const response = await fetch(apiEndpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          latitude: userLocation.latitude,
          longitude: userLocation.longitude,
          radius: 10, // miles
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to fetch restaurants');
      }

      const data = await response.json();
      setRestaurants(data.restaurants || []);
      toast({
        title: "Success",
        description: `Found ${data.restaurants?.length || 0} restaurants nearby!`,
      });
    } catch (error) {
      toast({
        title: "API Error",
        description: "Failed to fetch restaurants from your API. Using demo data instead.",
        variant: "destructive",
      });
      
      // Demo data for showcase
      const demoRestaurants: Restaurant[] = [
        {
          id: '1',
          name: 'Bella Vista Italian',
          address: '123 Main St, Downtown',
          distance: 0.8,
          rating: 4.5,
          cuisine: 'Italian',
          phone: '(555) 123-4567',
          latitude: userLocation.latitude + 0.01,
          longitude: userLocation.longitude + 0.01,
        },
        {
          id: '2',
          name: 'Sakura Sushi Bar',
          address: '456 Oak Avenue',
          distance: 1.2,
          rating: 4.8,
          cuisine: 'Japanese',
          phone: '(555) 987-6543',
          latitude: userLocation.latitude - 0.008,
          longitude: userLocation.longitude + 0.012,
        },
        {
          id: '3',
          name: 'The Garden Bistro',
          address: '789 Pine Street',
          distance: 2.1,
          rating: 4.3,
          cuisine: 'American',
          website: 'gardenbistro.com',
          latitude: userLocation.latitude + 0.015,
          longitude: userLocation.longitude - 0.01,
        }
      ];
      setRestaurants(demoRestaurants);
    } finally {
      setLoading(false);
    }
  }, [userLocation, apiEndpoint, toast]);

  const handleSetupComplete = () => {
    if (!apiEndpoint || !googleMapsApiKey) {
      toast({
        title: "Missing Information",
        description: "Please provide both API endpoint and Google Maps API key",
        variant: "destructive",
      });
      return;
    }
    setShowApiInputs(false);
    getCurrentLocation();
  };

  useEffect(() => {
    if (userLocation && !showApiInputs) {
      fetchRestaurants();
    }
  }, [userLocation, fetchRestaurants, showApiInputs]);

  if (showApiInputs) {
    return (
      <div className="min-h-screen bg-gradient-subtle p-4 flex items-center justify-center">
        <Card className="w-full max-w-md shadow-warm">
          <CardHeader className="text-center">
            <div className="w-16 h-16 mx-auto mb-4 bg-gradient-primary rounded-full flex items-center justify-center">
              <MapPin className="w-8 h-8 text-primary-foreground" />
            </div>
            <CardTitle className="text-2xl bg-gradient-primary bg-clip-text text-transparent">
              Restaurant Finder Setup
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label className="text-sm font-medium text-muted-foreground mb-2 block">
                Your API Endpoint
              </label>
              <Input
                placeholder="https://your-api.com/restaurants"
                value={apiEndpoint}
                onChange={(e) => setApiEndpoint(e.target.value)}
                className="transition-smooth focus:shadow-glow"
              />
            </div>
            <div>
              <label className="text-sm font-medium text-muted-foreground mb-2 block">
                Google Maps API Key
              </label>
              <Input
                type="password"
                placeholder="Your Google Maps API Key"
                value={googleMapsApiKey}
                onChange={(e) => setGoogleMapsApiKey(e.target.value)}
                className="transition-smooth focus:shadow-glow"
              />
              <p className="text-xs text-muted-foreground mt-1">
                Get your key at <a href="https://console.cloud.google.com" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">Google Cloud Console</a>
              </p>
            </div>
            <Button 
              onClick={handleSetupComplete}
              className="w-full bg-gradient-primary hover:shadow-warm transition-bounce"
            >
              <Navigation className="w-4 h-4 mr-2" />
              Find Restaurants Near Me
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

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