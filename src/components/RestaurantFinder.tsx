import React, { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { MapPin, Navigation, Shuffle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useRestaurants } from '@/contexts/RestaurantContext';
import { Link } from 'react-router-dom';
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
  photoUrl?: string;
  openNow?: boolean;
  openingHours?: string[];
}

const RestaurantFinder = () => {
  const { restaurants, setRestaurants, userLocation, setUserLocation } = useRestaurants();
  const [loading, setLoading] = useState(false);
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
    if (!userLocation) {
      console.log('No user location available');
      return;
    }

    if (typeof google === 'undefined' || !google.maps) {
      console.log('Google Maps not loaded yet');
      toast({
        title: "Loading Error",
        description: "Google Maps is still loading. Please wait...",
        variant: "destructive",
      });
      return;
    }

    if (!google.maps.geometry) {
      console.log('Geometry library not loaded');
      toast({
        title: "Loading Error",
        description: "Required Google Maps libraries are still loading...",
        variant: "destructive",
      });
      return;
    }

    console.log('Starting restaurant search at:', userLocation);
    setLoading(true);
    
    try {
      const location = new google.maps.LatLng(userLocation.latitude, userLocation.longitude);
      const map = new google.maps.Map(document.createElement('div'));
      
      const service = new google.maps.places.PlacesService(map);
      const request = {
        location: location,
        radius: 8047, // 5 miles in meters (reduced from 10 miles for closer results)
        type: 'restaurant'
      };

      console.log('Making Places API request:', request);

      let allResults: google.maps.places.PlaceResult[] = [];
      
      const processResults = (results: google.maps.places.PlaceResult[] | null, status: google.maps.places.PlacesServiceStatus, pagination: google.maps.places.PlaceSearchPagination | null) => {
        console.log('Places API response:', { status, resultsCount: results?.length, hasMore: pagination?.hasNextPage });
        
        if (status === google.maps.places.PlacesServiceStatus.OK && results) {
          allResults = [...allResults, ...results];
          
          // Try to get more results if available (up to 60 total - 3 pages)
          if (pagination?.hasNextPage && allResults.length < 60) {
            console.log('Fetching next page of results...');
            // Need to wait a bit before requesting next page
            setTimeout(() => {
              pagination.nextPage();
            }, 2000);
          } else {
            // Process all collected results
            const restaurantData: Restaurant[] = allResults.map((place) => {
              const distance = place.geometry?.location 
                ? google.maps.geometry.spherical.computeDistanceBetween(
                    location,
                    place.geometry.location
                  ) * 0.000621371 // Convert meters to miles
                : 0;

              // Get photo URL if available
              let photoUrl: string | undefined;
              if (place.photos && place.photos.length > 0) {
                try {
                  photoUrl = place.photos[0].getUrl({ maxWidth: 800, maxHeight: 600 });
                  console.log(`Photo URL for ${place.name}:`, photoUrl);
                } catch (error) {
                  console.error(`Error getting photo for ${place.name}:`, error);
                }
              } else {
                console.log(`No photos available for ${place.name}`);
              }

            // Get opening hours if available
            const openNow = place.opening_hours?.open_now;
            const openingHours = place.opening_hours?.weekday_text;

            // Extract cuisine type - skip generic types and find specific cuisine
            const genericTypes = ['restaurant', 'food', 'point_of_interest', 'establishment', 'store'];
            const cuisineType = place.types?.find(type => !genericTypes.includes(type));
            const cuisine = cuisineType?.replace(/_/g, ' ');

            return {
              id: place.place_id || '',
              name: place.name || 'Unknown Restaurant',
              address: place.vicinity || '',
              distance: parseFloat(distance.toFixed(1)),
              rating: place.rating,
              cuisine: cuisine,
                phone: undefined,
                website: undefined,
                latitude: place.geometry?.location?.lat() || userLocation.latitude,
                longitude: place.geometry?.location?.lng() || userLocation.longitude,
                photoUrl,
                openNow,
                openingHours,
              };
            }).sort((a, b) => a.distance - b.distance);

            console.log('Processed restaurants with photos:', restaurantData.map(r => ({ name: r.name, hasPhoto: !!r.photoUrl })));
            setRestaurants(restaurantData);
            setLoading(false);
            toast({
              title: "Success",
              description: `Found ${restaurantData.length} restaurants nearby!`,
            });
          }
        } else {
          console.error('Places API error status:', status);
          setLoading(false);
          toast({
            title: "Search Error",
            description: `Could not find restaurants: ${status}. Please try again.`,
            variant: "destructive",
          });
        }
      };

      service.nearbySearch(request, processResults);
    } catch (error) {
      console.error('Error in fetchRestaurants:', error);
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
              <Link to="/random">
                <Button
                  variant="outline"
                  size="sm"
                  className="transition-smooth hover:shadow-glow"
                >
                  <Shuffle className="w-4 h-4 mr-2" />
                  Random Pick
                </Button>
              </Link>
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