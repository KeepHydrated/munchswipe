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
  description?: string;
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
      async (error) => {
        // If GPS fails, try IP-based location as fallback
        if (error.code === error.PERMISSION_DENIED) {
          try {
            const response = await fetch('https://ipapi.co/json/');
            const data = await response.json();
            
            if (data.latitude && data.longitude) {
              const location = {
                latitude: data.latitude,
                longitude: data.longitude,
              };
              setUserLocation(location);
              setLoading(false);
              toast({
                title: "Location Found (IP-based)",
                description: `Using approximate location: ${data.city}, ${data.region}`,
              });
              return;
            }
          } catch (ipError) {
            console.error('IP geolocation failed:', ipError);
          }
        }
        
        setLoading(false);
        let errorMessage = "Unable to get your location";
        let instructions = "";
        
        switch(error.code) {
          case error.PERMISSION_DENIED:
            errorMessage = "Location access blocked";
            instructions = "Tap the 🔒 or ⓘ icon in your browser's address bar, then enable Location permissions. Refresh the page after enabling.";
            break;
          case error.POSITION_UNAVAILABLE:
            errorMessage = "Location information unavailable. Try again in a moment";
            break;
          case error.TIMEOUT:
            errorMessage = "Location request timed out. Please try again";
            break;
        }
        
        toast({
          title: errorMessage,
          description: instructions || errorMessage,
          variant: "destructive",
          duration: 10000,
        });
      },
      { 
        enableHighAccuracy: false, // Faster on mobile
        timeout: 30000, // 30 seconds for mobile
        maximumAge: 300000 // 5 minutes cache
      }
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
        type: 'restaurant',
        openNow: true // Only show restaurants that are currently open
      };

      console.log('Making Places API request:', request);

      let allResults: google.maps.places.PlaceResult[] = [];
      
      const processResults = async (results: google.maps.places.PlaceResult[] | null, status: google.maps.places.PlacesServiceStatus, pagination: google.maps.places.PlaceSearchPagination | null) => {
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
            // Process all collected results with detailed information
            const detailedRestaurants: Restaurant[] = [];
            
            for (const place of allResults) {
              if (!place.place_id) continue;
              
              // Get detailed information for each restaurant
              await new Promise<void>((resolve) => {
                service.getDetails(
                  {
                    placeId: place.place_id!,
                    fields: ['name', 'types', 'rating', 'opening_hours', 'photos', 'vicinity', 'geometry', 'editorial_summary']
                  },
                  (detailResult, detailStatus) => {
                    if (detailStatus === google.maps.places.PlacesServiceStatus.OK && detailResult) {
                      const distance = detailResult.geometry?.location 
                        ? google.maps.geometry.spherical.computeDistanceBetween(
                            location,
                            detailResult.geometry.location
                          ) * 0.000621371 // Convert meters to miles
                        : 0;

                      // Get photo URL if available
                      let photoUrl: string | undefined;
                      if (detailResult.photos && detailResult.photos.length > 0) {
                        try {
                          photoUrl = detailResult.photos[0].getUrl({ maxWidth: 800, maxHeight: 600 });
                        } catch (error) {
                          console.error(`Error getting photo for ${detailResult.name}:`, error);
                        }
                      }

                      // Get opening hours if available
                      const openNow = detailResult.opening_hours?.open_now;
                      const openingHours = detailResult.opening_hours?.weekday_text;

                      // Extract cuisine type with improved detection
                      const cuisineMap: Record<string, string> = {
                        'american_restaurant': 'American',
                        'bakery': 'Bakery',
                        'bar': 'Bar',
                        'barbecue_restaurant': 'Barbecue',
                        'brazilian_restaurant': 'Brazilian',
                        'breakfast_restaurant': 'Breakfast',
                        'brunch_restaurant': 'Brunch',
                        'cafe': 'Cafe',
                        'chinese_restaurant': 'Chinese',
                        'coffee_shop': 'Coffee Shop',
                        'fast_food_restaurant': 'Fast Food',
                        'french_restaurant': 'French',
                        'greek_restaurant': 'Greek',
                        'hamburger_restaurant': 'Burger',
                        'ice_cream_shop': 'Ice Cream',
                        'indian_restaurant': 'Indian',
                        'indonesian_restaurant': 'Indonesian',
                        'italian_restaurant': 'Italian',
                        'japanese_restaurant': 'Japanese',
                        'korean_restaurant': 'Korean',
                        'lebanese_restaurant': 'Lebanese',
                        'mediterranean_restaurant': 'Mediterranean',
                        'mexican_restaurant': 'Mexican',
                        'middle_eastern_restaurant': 'Middle Eastern',
                        'pizza_restaurant': 'Pizza',
                        'ramen_restaurant': 'Ramen',
                        'sandwich_shop': 'Sandwiches',
                        'seafood_restaurant': 'Seafood',
                        'spanish_restaurant': 'Spanish',
                        'steak_house': 'Steakhouse',
                        'sushi_restaurant': 'Sushi',
                        'thai_restaurant': 'Thai',
                        'turkish_restaurant': 'Turkish',
                        'vegan_restaurant': 'Vegan',
                        'vegetarian_restaurant': 'Vegetarian',
                        'vietnamese_restaurant': 'Vietnamese'
                      };

                      // Find cuisine type from the place types
                      let cuisine: string | undefined;
                      if (detailResult.types) {
                        console.log(`Restaurant: ${detailResult.name}, Detailed Types:`, detailResult.types);
                        for (const type of detailResult.types) {
                          if (cuisineMap[type]) {
                            cuisine = cuisineMap[type];
                            console.log(`Found cuisine for ${detailResult.name}: ${cuisine} (from type: ${type})`);
                            break;
                          }
                        }
                        if (!cuisine) {
                          console.log(`No cuisine match for ${detailResult.name}, available types:`, detailResult.types);
                        }
                      }

                      detailedRestaurants.push({
                        id: detailResult.place_id || place.place_id || '',
                        name: detailResult.name || 'Unknown Restaurant',
                        address: detailResult.vicinity || place.vicinity || '',
                        distance: parseFloat(distance.toFixed(1)),
                        rating: detailResult.rating,
                        cuisine: cuisine,
                        phone: undefined,
                        website: undefined,
                        latitude: detailResult.geometry?.location?.lat() || userLocation.latitude,
                        longitude: detailResult.geometry?.location?.lng() || userLocation.longitude,
                        photoUrl,
                        openNow,
                        openingHours,
                        description: (detailResult as any).editorial_summary?.overview,
                      });
                    }
                    resolve();
                  }
                );
              });
              
              // Small delay to avoid rate limiting
              await new Promise(resolve => setTimeout(resolve, 100));
            }

            const sortedRestaurants = detailedRestaurants.sort((a, b) => a.distance - b.distance);
            console.log('Processed restaurants with cuisine data:', sortedRestaurants.map(r => ({ name: r.name, cuisine: r.cuisine })));
            setRestaurants(sortedRestaurants);
            setLoading(false);
            toast({
              title: "Success",
              description: `Found ${sortedRestaurants.length} restaurants nearby!`,
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