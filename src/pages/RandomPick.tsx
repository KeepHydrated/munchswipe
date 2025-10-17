import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { MapPin, Star, Navigation, Shuffle, Image as ImageIcon, Clock, ChevronDown, Heart, X, Sparkles, EyeOff } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useRestaurants } from '@/contexts/RestaurantContext';
import { useSession } from '@/hooks/useSession';
import { useMatches } from '@/hooks/useMatches';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';
import { loadGoogleMaps } from '@/lib/googleMapsLoader';
import { useNavigate } from 'react-router-dom';
import { Header } from '@/components/Header';
import { AdCard } from '@/components/AdCard';

const RandomPick = () => {
  const { restaurants, setRestaurants, userLocation, setUserLocation } = useRestaurants();
  const navigate = useNavigate();
  const [selectedRestaurant, setSelectedRestaurant] = useState<typeof restaurants[0] | null>(null);
  const [recentlyShown, setRecentlyShown] = useState<string[]>([]);
  const [showHours, setShowHours] = useState(false);
  const [loading, setLoading] = useState(false);
  const [googleMapsApiKey] = useState('AIzaSyASk-OpxAIgawBXmdyFi-C7QMMPFDq7jlU');
  const [hiddenRestaurants, setHiddenRestaurants] = useState<Set<string>>(() => {
    const stored = localStorage.getItem('hiddenRestaurants');
    return stored ? new Set(JSON.parse(stored)) : new Set();
  });
  const [showInstructions, setShowInstructions] = useState(() => {
    return !localStorage.getItem('hasSeenInstructions');
  });
  const [cardsSinceLastAd, setCardsSinceLastAd] = useState(0);
  const [showingAd, setShowingAd] = useState(false);
  
  // Session and matching
  const { sessionId, partnerSessionId } = useSession();
  const { matchedRestaurantIds } = useMatches(sessionId, partnerSessionId);
  
  // Swipe state
  const [touchStart, setTouchStart] = useState<{ x: number; y: number } | null>(null);
  const [touchCurrent, setTouchCurrent] = useState<{ x: number; y: number } | null>(null);
  const [isSwiping, setIsSwiping] = useState(false);

  // Location and restaurant fetching
  const getCurrentLocation = async () => {
    setLoading(true);
    
    // Try native geolocation first (works better on mobile)
    if (navigator.geolocation) {
      try {
        const position = await new Promise<GeolocationPosition>((resolve, reject) => {
          navigator.geolocation.getCurrentPosition(resolve, reject, {
            enableHighAccuracy: true,
            timeout: 10000,
            maximumAge: 0
          });
        });
        
        const location = {
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
        };
        setUserLocation(location);
        setLoading(false);
        return;
      } catch (geoError) {
        console.log('Native geolocation failed, trying IP fallback:', geoError);
      }
    }
    
    // Fallback to IP geolocation
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
        return;
      }
    } catch (ipError) {
      console.error('IP geolocation failed:', ipError);
      setLoading(false);
      toast({
        title: "Location Error",
        description: "Unable to detect your location. Please enable location permissions and try again.",
        variant: "destructive",
      });
    }
  };

  const fetchRestaurants = async () => {
    if (!userLocation) {
      console.log('No user location available');
      return;
    }

    if (typeof google === 'undefined' || !google.maps || !google.maps.geometry) {
      console.log('Google Maps not loaded yet');
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
        radius: 8047,
        type: 'restaurant'
      };

      const processPlaceDetails = async (places: google.maps.places.PlaceResult[]) => {
        const detailedRestaurants: any[] = [];
        
        for (const place of places) {
          if (!place.place_id) continue;
          
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
                      ) * 0.000621371
                    : 0;

                  let photoUrl: string | undefined;
                  if (detailResult.photos && detailResult.photos.length > 0) {
                    try {
                      photoUrl = detailResult.photos[0].getUrl({ maxWidth: 800, maxHeight: 600 });
                    } catch (error) {
                      console.error(`Error getting photo for ${detailResult.name}:`, error);
                    }
                  }

                  const openNow = detailResult.opening_hours?.isOpen?.() ?? detailResult.opening_hours?.open_now;
                  const openingHours = detailResult.opening_hours?.weekday_text;

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

                  let cuisine: string | undefined;
                  if (detailResult.types) {
                    for (const type of detailResult.types) {
                      if (cuisineMap[type]) {
                        cuisine = cuisineMap[type];
                        break;
                      }
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
          
          await new Promise(resolve => setTimeout(resolve, 50));
        }
        
        return detailedRestaurants.sort((a, b) => a.distance - b.distance);
      };

      let allResults: google.maps.places.PlaceResult[] = [];
      let isFirstBatch = true;
      
      const processResults = async (results: google.maps.places.PlaceResult[] | null, status: google.maps.places.PlacesServiceStatus, pagination: google.maps.places.PlaceSearchPagination | null) => {
        if (status === google.maps.places.PlacesServiceStatus.OK && results) {
          allResults = [...allResults, ...results];
          
          // Process and show first batch immediately
          if (isFirstBatch) {
            isFirstBatch = false;
            const firstBatch = await processPlaceDetails(results.slice(0, 10));
            setRestaurants(firstBatch);
            setLoading(false);
            
            // Continue loading more in background
            if (pagination?.hasNextPage) {
              setTimeout(() => {
                pagination.nextPage();
              }, 1000);
            } else if (results.length > 10) {
              // Process remaining from first batch
              const remaining = await processPlaceDetails(results.slice(10));
              setRestaurants([...firstBatch, ...remaining].sort((a, b) => a.distance - b.distance));
            }
          } else {
            // Background loading - add more restaurants
            const newBatch = await processPlaceDetails(results);
            const updatedRestaurants = [...restaurants, ...newBatch].sort((a, b) => a.distance - b.distance);
            setRestaurants(updatedRestaurants);
            
            if (pagination?.hasNextPage && allResults.length < 60) {
              setTimeout(() => {
                pagination.nextPage();
              }, 1000);
            }
          }
        } else {
          console.error('Places API error status:', status);
          setLoading(false);
          toast({
            title: "Search Error",
            description: `Could not find restaurants. Please try again.`,
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
  };

  // Initialize Google Maps, get location, and fetch restaurants on mount
  useEffect(() => {
    const initializeRestaurants = async () => {
      // Load Google Maps API first
      await loadGoogleMaps(googleMapsApiKey);
      
      // Get location if we don't have it
      if (!userLocation) {
        await getCurrentLocation();
      }
    };
    
    initializeRestaurants();
  }, []);

  // Fetch restaurants when location is available and we don't have restaurants
  useEffect(() => {
    if (userLocation && restaurants.length === 0 && typeof google !== 'undefined') {
      fetchRestaurants();
    }
  }, [userLocation, restaurants.length]);

  const dismissInstructions = () => {
    setShowInstructions(false);
    localStorage.setItem('hasSeenInstructions', 'true');
  };

  // Helper function to check if restaurant is open now or will be open in next hour
  const isOpenOrOpeningSoon = (restaurant: typeof restaurants[0]) => {
    if (!restaurant.openingHours || restaurant.openingHours.length === 0) return false;
    
    const now = new Date();
    const currentDay = now.getDay();
    const currentTime = now.getHours() * 60 + now.getMinutes(); // minutes since midnight
    const oneHourLater = currentTime + 60;
    
    const todayHours = restaurant.openingHours[currentDay];
    if (!todayHours) return false;
    
    // Extract time range from string like "Monday: 9:00 AM – 10:00 PM"
    const timeMatch = todayHours.match(/(\d+):(\d+)\s*(AM|PM)\s*[–-]\s*(\d+):(\d+)\s*(AM|PM)/i);
    if (!timeMatch) return false;
    
    let openHour = parseInt(timeMatch[1]);
    const openMin = parseInt(timeMatch[2]);
    const openPeriod = timeMatch[3].toUpperCase();
    let closeHour = parseInt(timeMatch[4]);
    const closeMin = parseInt(timeMatch[5]);
    const closePeriod = timeMatch[6].toUpperCase();
    
    // Convert to 24-hour format
    if (openPeriod === 'PM' && openHour !== 12) openHour += 12;
    if (openPeriod === 'AM' && openHour === 12) openHour = 0;
    if (closePeriod === 'PM' && closeHour !== 12) closeHour += 12;
    if (closePeriod === 'AM' && closeHour === 12) closeHour = 0;
    
    const openTime = openHour * 60 + openMin;
    const closeTime = closeHour * 60 + closeMin;
    
    // Check if currently open OR will open within next hour
    const isCurrentlyOpen = currentTime >= openTime && currentTime < closeTime;
    const willOpenSoon = openTime > currentTime && openTime <= oneHourLater;
    
    return isCurrentlyOpen || willOpenSoon;
  };

  // Helper function to calculate hours until opening
  const getHoursUntilOpening = (restaurant: typeof restaurants[0]) => {
    if (!restaurant.openingHours || restaurant.openingHours.length === 0) return null;
    
    const now = new Date();
    const currentDay = now.getDay();
    const currentTime = now.getHours() * 60 + now.getMinutes();
    
    // Check each day starting from today
    for (let i = 0; i < 7; i++) {
      const dayIndex = (currentDay + i) % 7;
      const dayHours = restaurant.openingHours[dayIndex];
      
      if (!dayHours) continue;
      
      // Handle "Open 24 hours"
      if (dayHours.includes('Open 24 hours')) {
        return 0;
      }
      
      const timeMatch = dayHours.match(/(\d+):(\d+)\s*(AM|PM)\s*[–-]\s*(\d+):(\d+)\s*(AM|PM)/i);
      if (!timeMatch) continue;
      
      let openHour = parseInt(timeMatch[1]);
      const openMin = parseInt(timeMatch[2]);
      const openPeriod = timeMatch[3].toUpperCase();
      
      // Convert to 24-hour format
      if (openPeriod === 'PM' && openHour !== 12) openHour += 12;
      if (openPeriod === 'AM' && openHour === 12) openHour = 0;
      
      const openTime = openHour * 60 + openMin;
      
      // If checking today
      if (i === 0) {
        if (openTime > currentTime) {
          const minutesUntil = openTime - currentTime;
          return Math.round(minutesUntil / 60 * 10) / 10; // Round to 1 decimal
        }
      } else {
        // For future days, calculate total hours
        const minutesLeftToday = (24 * 60) - currentTime;
        const minutesInBetweenDays = (i - 1) * 24 * 60;
        const minutesUntilOpen = openTime;
        const totalMinutes = minutesLeftToday + minutesInBetweenDays + minutesUntilOpen;
        return Math.round(totalMinutes / 60 * 10) / 10;
      }
    }
    
    return null;
  };

  const getRandomRestaurant = () => {
    // Check if we should show an ad (every 10 cards)
    const shouldShowAd = cardsSinceLastAd >= 10;
    
    if (shouldShowAd) {
      setShowingAd(true);
      setCardsSinceLastAd(0);
      setSelectedRestaurant(null);
      return;
    }
    
    setShowingAd(false);
    setCardsSinceLastAd(prev => prev + 1);
    
    // First try to get open/opening soon restaurants
    const openOrOpeningSoon = restaurants.filter(r => 
      isOpenOrOpeningSoon(r) && !hiddenRestaurants.has(r.id)
    );
    
    // Get restaurants not shown recently from OPEN pool first
    const openNotRecentlyShown = openOrOpeningSoon.filter(
      r => !recentlyShown.includes(r.id)
    );
    
    // If we have open restaurants not recently shown, use those
    if (openNotRecentlyShown.length > 0) {
      const randomIndex = Math.floor(Math.random() * openNotRecentlyShown.length);
      const newRestaurant = openNotRecentlyShown[randomIndex];
      
      setSelectedRestaurant(newRestaurant);
      
      const maxHistory = Math.min(5, Math.floor(openOrOpeningSoon.length / 2));
      setRecentlyShown(prev => {
        const updated = [...prev, newRestaurant.id];
        return updated.slice(-maxHistory);
      });
      return;
    }
    
    // If all open restaurants were recently shown, show them again
    if (openOrOpeningSoon.length > 0) {
      const randomIndex = Math.floor(Math.random() * openOrOpeningSoon.length);
      const newRestaurant = openOrOpeningSoon[randomIndex];
      
      setSelectedRestaurant(newRestaurant);
      setRecentlyShown([]); // Reset history since we're cycling through again
      return;
    }
    
    // Only if NO open restaurants exist, fall back to closed ones
    const closedRestaurants = restaurants.filter(r => 
      !isOpenOrOpeningSoon(r) && !hiddenRestaurants.has(r.id)
    );
    
    if (closedRestaurants.length === 0) {
      setSelectedRestaurant(null);
      return;
    }
    
    const closedNotRecentlyShown = closedRestaurants.filter(
      r => !recentlyShown.includes(r.id)
    );
    
    const poolToChooseFrom = closedNotRecentlyShown.length > 0 
      ? closedNotRecentlyShown 
      : closedRestaurants;
    
    const randomIndex = Math.floor(Math.random() * poolToChooseFrom.length);
    const newRestaurant = poolToChooseFrom[randomIndex];
    
    setSelectedRestaurant(newRestaurant);
    
    const maxHistory = Math.min(5, Math.floor(closedRestaurants.length / 2));
    setRecentlyShown(prev => {
      const updated = [...prev, newRestaurant.id];
      return updated.slice(-maxHistory);
    });
  };

  // Touch handlers for swipe
  const handleTouchStart = (e: React.TouchEvent) => {
    const touch = e.touches[0];
    setTouchStart({ x: touch.clientX, y: touch.clientY });
    setTouchCurrent({ x: touch.clientX, y: touch.clientY });
    setIsSwiping(true);
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!touchStart) return;
    
    const touch = e.touches[0];
    setTouchCurrent({ x: touch.clientX, y: touch.clientY });
    
    const deltaX = Math.abs(touch.clientX - touchStart.x);
    const deltaY = Math.abs(touch.clientY - touchStart.y);
    
    // Prevent default for horizontal swipes OR downward swipes (to hide)
    if ((deltaX > deltaY && deltaX > 20) || (touch.clientY > touchStart.y && deltaY > 20)) {
      e.preventDefault();
    }
  };

  const handleSwipe = async (liked: boolean) => {
    // If swiping an ad, just move to next card
    if (showingAd) {
      getRandomRestaurant();
      return;
    }
    
    if (!selectedRestaurant || !sessionId) return;

    // Save swipe to database
    await supabase.from('restaurant_swipes').insert({
      session_id: sessionId,
      restaurant_id: selectedRestaurant.id,
      restaurant_name: selectedRestaurant.name,
      restaurant_data: selectedRestaurant as any,
      liked: liked,
    } as any);

    if (liked && matchedRestaurantIds.has(selectedRestaurant.id)) {
      toast({
        title: "🎉 It's a Match!",
        description: `You both like ${selectedRestaurant.name}!`,
      });
    }
  };

  const handleTouchEnd = () => {
    if (!touchStart || !touchCurrent) {
      setIsSwiping(false);
      setTouchStart(null);
      setTouchCurrent(null);
      return;
    }
    
    // If showing ad, don't allow down swipe (hide), only horizontal swipes
    if (showingAd) {
      const deltaX = touchCurrent.x - touchStart.x;
      const deltaY = touchCurrent.y - touchStart.y;
      const absDeltaX = Math.abs(deltaX);
      const absDeltaY = Math.abs(deltaY);
      
      // Only allow horizontal swipes for ads
      if (absDeltaX > 80 && absDeltaX > absDeltaY * 1.2) {
        getRandomRestaurant();
      }
      
      setIsSwiping(false);
      setTouchStart(null);
      setTouchCurrent(null);
      return;
    }
    
    if (!selectedRestaurant) {
      setIsSwiping(false);
      setTouchStart(null);
      setTouchCurrent(null);
      return;
    }

    const deltaX = touchCurrent.x - touchStart.x;
    const deltaY = touchCurrent.y - touchStart.y;
    const absDeltaX = Math.abs(deltaX);
    const absDeltaY = Math.abs(deltaY);
    
    // Check for downward swipe (hide forever)
    if (deltaY > 50 && absDeltaY > absDeltaX) {
      const newHidden = new Set(hiddenRestaurants);
      newHidden.add(selectedRestaurant.id);
      setHiddenRestaurants(newHidden);
      localStorage.setItem('hiddenRestaurants', JSON.stringify([...newHidden]));
      
      // Save restaurant data
      const existingData = localStorage.getItem('restaurantData');
      const restaurantData = existingData ? JSON.parse(existingData) : [];
      const exists = restaurantData.some((r: any) => r.id === selectedRestaurant.id);
      if (!exists) {
        restaurantData.push(selectedRestaurant);
        localStorage.setItem('restaurantData', JSON.stringify(restaurantData));
      }
      
      toast({
        title: "Hidden Forever",
        description: `${selectedRestaurant.name} won't be suggested again`,
      });
      
      getRandomRestaurant();
    }
    // Check for horizontal swipe (like/dislike)
    else if (absDeltaX > 80 && absDeltaX > absDeltaY * 1.2) {
      if (deltaX > 0) {
        // Swipe right - like
        handleSwipe(true);
      } else {
        // Swipe left - dislike
        handleSwipe(false);
      }
      getRandomRestaurant();
    }

    // Reset swipe state
    setIsSwiping(false);
    setTouchStart(null);
    setTouchCurrent(null);
  };

  // Calculate swipe transform
  const getSwipeTransform = () => {
    if (!touchStart || !touchCurrent || !isSwiping) {
      return {
        transform: 'translate(0px, 0px) rotate(0deg)',
        transition: 'transform 0.3s ease-out',
      };
    }
    
    const deltaX = touchCurrent.x - touchStart.x;
    const deltaY = touchCurrent.y - touchStart.y;
    const absDeltaX = Math.abs(deltaX);
    const absDeltaY = Math.abs(deltaY);
    
    // Check if this is a downward swipe
    if (deltaY > 20 && absDeltaY > absDeltaX * 1.5) {
      return {
        transform: `translate(0px, ${deltaY}px) scale(${Math.max(0.8, 1 - deltaY / 500)})`,
        transition: 'none',
      };
    }
    
    // Only apply horizontal transform if this is clearly a horizontal swipe
    if (absDeltaX < 20 || absDeltaX <= absDeltaY * 1.5) {
      return {
        transform: 'translate(0px, 0px) rotate(0deg)',
        transition: 'transform 0.3s ease-out',
      };
    }
    
    const rotation = deltaX / 20; // Subtle rotation based on swipe

    return {
      transform: `translate(${deltaX}px, 0px) rotate(${rotation}deg)`,
      transition: 'none',
    };
  };

  // Calculate overlay opacity
  const getOverlayOpacity = () => {
    if (!touchStart || !touchCurrent || !isSwiping) return 0;
    const deltaX = touchCurrent.x - touchStart.x;
    const deltaY = touchCurrent.y - touchStart.y;
    const absDeltaX = Math.abs(deltaX);
    const absDeltaY = Math.abs(deltaY);
    
    // Check for downward swipe
    if (deltaY > 20 && absDeltaY > absDeltaX * 1.5) {
      return Math.min(deltaY / 150, 1);
    }
    
    // Only show overlay for clear horizontal swipes
    if (absDeltaX < 20 || absDeltaX <= absDeltaY * 1.5) return 0;
    
    return Math.min(absDeltaX / 150, 1);
  };

  // Automatically pick a random restaurant when restaurants are available
  useEffect(() => {
    if (restaurants.length > 0 && !selectedRestaurant) {
      getRandomRestaurant();
    }
  }, [restaurants.length]);

  return (
    <div className="min-h-screen bg-gradient-subtle">
      <Header />

      {/* Instructions Overlay */}
      {showInstructions && (selectedRestaurant || showingAd) && (
        <div 
          className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4 animate-fade-in"
          onClick={dismissInstructions}
        >
          <div className="bg-background rounded-2xl p-8 max-w-md w-full shadow-2xl animate-scale-in">
            <h2 className="text-2xl font-bold text-center mb-6">How to Use</h2>
            
            <div className="space-y-6">
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 rounded-full bg-green-500/20 flex items-center justify-center flex-shrink-0">
                  <Heart className="w-6 h-6 text-green-500" fill="currentColor" />
                </div>
                <div>
                  <h3 className="font-semibold text-lg mb-1">Swipe Right</h3>
                  <p className="text-muted-foreground text-sm">Like this restaurant and save it to your list</p>
                </div>
              </div>

              <div className="flex items-start gap-4">
                <div className="w-12 h-12 rounded-full bg-red-500/20 flex items-center justify-center flex-shrink-0">
                  <X className="w-6 h-6 text-red-500" strokeWidth={3} />
                </div>
                <div>
                  <h3 className="font-semibold text-lg mb-1">Swipe Left</h3>
                  <p className="text-muted-foreground text-sm">Pass on this restaurant for now</p>
                </div>
              </div>

              <div className="flex items-start gap-4">
                <div className="w-12 h-12 rounded-full bg-gray-500/20 flex items-center justify-center flex-shrink-0">
                  <ChevronDown className="w-6 h-6 text-gray-500" />
                </div>
                <div>
                  <h3 className="font-semibold text-lg mb-1">Swipe Down</h3>
                  <p className="text-muted-foreground text-sm">Hide this restaurant forever - it will never show again</p>
                </div>
              </div>
            </div>

            <Button 
              onClick={dismissInstructions}
              className="w-full mt-8 bg-gradient-primary"
            >
              Got It!
            </Button>
          </div>
        </div>
      )}

      {/* Main Content */}
      <div className="max-w-4xl mx-auto px-4 py-6">
        {restaurants.length === 0 ? (
          <Card className="shadow-warm">
            <CardContent className="text-center py-12">
              <MapPin className="w-16 h-16 mx-auto mb-4 text-muted-foreground" />
              <h2 className="text-xl font-semibold mb-2">Loading Restaurants...</h2>
              <p className="text-muted-foreground">
                Finding restaurants near you. This may take a moment.
              </p>
            </CardContent>
          </Card>
        ) : !selectedRestaurant && !showingAd ? (
          <Card className="shadow-warm">
            <CardContent className="text-center py-12">
              <Clock className="w-16 h-16 mx-auto mb-4 text-muted-foreground" />
              <h2 className="text-xl font-semibold mb-2">No Restaurants Currently Open</h2>
              <p className="text-muted-foreground">
                No restaurants are open now or opening within the next hour. Try again later!
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-8">
            {/* Ad Card */}
            {showingAd && (
              <div 
                className="relative"
                onTouchStart={handleTouchStart}
                onTouchMove={handleTouchMove}
                onTouchEnd={handleTouchEnd}
                style={getSwipeTransform()}
              >
                {/* Swipe overlays for ad */}
                <div 
                  className="absolute inset-0 z-10 pointer-events-none rounded-lg flex items-center justify-center"
                  style={{ 
                    opacity: touchStart && touchCurrent && (touchCurrent.x - touchStart.x) > 0 ? getOverlayOpacity() : 0 
                  }}
                >
                  <div className="bg-primary/90 text-white px-8 py-4 rounded-lg text-2xl font-bold rotate-[-20deg]">
                    <span>Next →</span>
                  </div>
                </div>
                <div 
                  className="absolute inset-0 z-10 pointer-events-none rounded-lg flex items-center justify-center"
                  style={{ 
                    opacity: touchStart && touchCurrent && (touchCurrent.x - touchStart.x) < 0 ? getOverlayOpacity() : 0 
                  }}
                >
                  <div className="bg-primary/90 text-white px-8 py-4 rounded-lg text-2xl font-bold rotate-[20deg]">
                    <span>Next →</span>
                  </div>
                </div>

                <AdCard className="animate-in fade-in slide-in-from-bottom-4 duration-500" />
              </div>
            )}
            
            {/* Restaurant Card */}
            {selectedRestaurant && !showingAd && (
              <div 
                className="relative"
                onTouchStart={handleTouchStart}
                onTouchMove={handleTouchMove}
                onTouchEnd={handleTouchEnd}
                style={getSwipeTransform()}
              >
                {/* Swipe overlays */}
                <div 
                  className="absolute inset-0 z-10 pointer-events-none rounded-lg flex items-center justify-center"
                  style={{ 
                    opacity: touchStart && touchCurrent && (touchCurrent.x - touchStart.x) > 0 ? getOverlayOpacity() : 0 
                  }}
                >
                  <div className="bg-green-500/90 text-white px-8 py-4 rounded-lg text-2xl font-bold rotate-[-20deg] flex items-center gap-3">
                    <Heart className="w-8 h-8" fill="currentColor" />
                    <span>Like</span>
                  </div>
                </div>
                <div 
                  className="absolute inset-0 z-10 pointer-events-none rounded-lg flex items-center justify-center"
                  style={{ 
                    opacity: touchStart && touchCurrent && (touchCurrent.x - touchStart.x) < 0 ? getOverlayOpacity() : 0 
                  }}
                >
                  <div className="bg-red-500/90 text-white px-8 py-4 rounded-lg text-2xl font-bold rotate-[20deg] flex items-center gap-3">
                    <X className="w-8 h-8" strokeWidth={3} />
                    <span>Pass</span>
                  </div>
                </div>
                <div 
                  className="absolute inset-0 z-10 pointer-events-none rounded-lg flex items-center justify-center"
                  style={{ 
                    opacity: touchStart && touchCurrent && (touchCurrent.y - touchStart.y) > 0 ? getOverlayOpacity() : 0 
                  }}
                >
                  <div className="bg-gray-500/90 text-white px-8 py-4 rounded-lg text-2xl font-bold flex items-center gap-3">
                    <ChevronDown className="w-8 h-8" />
                    <span>Hide Forever</span>
                  </div>
                </div>

                {/* Match indicator */}
                {selectedRestaurant && matchedRestaurantIds.has(selectedRestaurant.id) && (
                  <div className="absolute top-4 right-4 z-20 bg-yellow-500 text-white px-4 py-2 rounded-full flex items-center gap-2 shadow-lg animate-bounce">
                    <Sparkles className="w-5 h-5" />
                    <span className="font-bold">Potential Match!</span>
                  </div>
                )}

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
                  {selectedRestaurant.description && (
                    <p className="text-sm text-muted-foreground mt-3 italic max-w-2xl mx-auto">
                      {selectedRestaurant.description}
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
                      // Check if currently open
                      const now = new Date();
                      const currentDay = now.getDay();
                      const currentTime = now.getHours() * 60 + now.getMinutes(); // minutes since midnight
                      
                      let isOpen = false;
                      const todayHours = selectedRestaurant.openingHours[currentDay];
                      
                      if (todayHours) {
                        // Check if open 24 hours
                        if (todayHours.includes('Open 24 hours')) {
                          isOpen = true;
                        } else {
                          // Extract time range from string like "Monday: 9:00 AM – 10:00 PM"
                          const timeMatch = todayHours.match(/(\d+):(\d+)\s*(AM|PM)\s*[–-]\s*(\d+):(\d+)\s*(AM|PM)/i);
                          if (timeMatch) {
                            let openHour = parseInt(timeMatch[1]);
                            const openMin = parseInt(timeMatch[2]);
                            const openPeriod = timeMatch[3].toUpperCase();
                            let closeHour = parseInt(timeMatch[4]);
                            const closeMin = parseInt(timeMatch[5]);
                            const closePeriod = timeMatch[6].toUpperCase();
                            
                            // Convert to 24-hour format
                            if (openPeriod === 'PM' && openHour !== 12) openHour += 12;
                            if (openPeriod === 'AM' && openHour === 12) openHour = 0;
                            if (closePeriod === 'PM' && closeHour !== 12) closeHour += 12;
                            if (closePeriod === 'AM' && closeHour === 12) closeHour = 0;
                            
                            const openTime = openHour * 60 + openMin;
                            const closeTime = closeHour * 60 + closeMin;
                            
                            isOpen = currentTime >= openTime && currentTime < closeTime;
                          }
                        }
                      }

                      // Group consecutive days with the same hours
                      const groupedHours: { days: string; hours: string }[] = [];
                      let currentGroup: { start: number; end: number; hours: string } | null = null;

                      selectedRestaurant.openingHours.forEach((hoursStr, index) => {
                        // Extract just the hours part (after the day name and colon)
                        const hoursPart = hoursStr.includes(':') ? hoursStr.split(':').slice(1).join(':').trim() : hoursStr;
                        
                        if (!currentGroup) {
                          currentGroup = { start: index, end: index, hours: hoursPart };
                        } else if (currentGroup.hours === hoursPart) {
                          currentGroup.end = index;
                        } else {
                          // Save the current group and start a new one
                          const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
                          const daysLabel = currentGroup.start === currentGroup.end 
                            ? dayNames[currentGroup.start]
                            : `${dayNames[currentGroup.start]}-${dayNames[currentGroup.end]}`;
                          groupedHours.push({ days: daysLabel, hours: currentGroup.hours });
                          currentGroup = { start: index, end: index, hours: hoursPart };
                        }
                      });

                      // Don't forget the last group
                      if (currentGroup) {
                        const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
                        const daysLabel = currentGroup.start === currentGroup.end 
                          ? dayNames[currentGroup.start]
                          : `${dayNames[currentGroup.start]}-${dayNames[currentGroup.end]}`;
                        groupedHours.push({ days: daysLabel, hours: currentGroup.hours });
                      }

                      const hoursUntilOpen = !isOpen ? getHoursUntilOpening(selectedRestaurant) : null;

                      return (
                        <div className="space-y-2">
                          <button 
                            onClick={() => setShowHours(!showHours)}
                            className="flex items-center space-x-2 w-full hover:opacity-80 transition-opacity"
                          >
                            <Clock className="w-5 h-5 text-muted-foreground" />
                            <div className="flex-1 text-left">
                              <h3 className={`font-semibold ${isOpen ? 'text-green-600 dark:text-green-500' : 'text-red-600 dark:text-red-500'}`}>
                                Currently {isOpen ? 'Open' : 'Closed'}
                              </h3>
                              {!isOpen && hoursUntilOpen !== null && (
                                <p className="text-sm text-muted-foreground">
                                  Opens in {hoursUntilOpen < 1 ? `${Math.round(hoursUntilOpen * 60)} minutes` : `${hoursUntilOpen} ${hoursUntilOpen === 1 ? 'hour' : 'hours'}`}
                                </p>
                              )}
                            </div>
                            <ChevronDown 
                              className={`w-4 h-4 text-muted-foreground transition-transform ${showHours ? 'rotate-180' : ''}`} 
                            />
                          </button>
                          {showHours && (
                            <div className="space-y-1 text-sm animate-in fade-in slide-in-from-top-2 duration-300">
                              {groupedHours.map((group, index) => (
                                <p key={index} className="text-muted-foreground pl-7">
                                  {group.days}: {group.hours}
                                </p>
                              ))}
                            </div>
                          )}
                        </div>
                      );
                    })()}
                  </div>

                  <div className="pt-4 hidden md:flex gap-3">
                    <Button 
                      onClick={() => {
                        if (!selectedRestaurant) return;
                        const newHidden = new Set(hiddenRestaurants);
                        newHidden.add(selectedRestaurant.id);
                        setHiddenRestaurants(newHidden);
                        localStorage.setItem('hiddenRestaurants', JSON.stringify([...newHidden]));
                        
                        // Save restaurant data
                        const existingData = localStorage.getItem('restaurantData');
                        const restaurantData = existingData ? JSON.parse(existingData) : [];
                        const exists = restaurantData.some((r: any) => r.id === selectedRestaurant.id);
                        if (!exists) {
                          restaurantData.push(selectedRestaurant);
                          localStorage.setItem('restaurantData', JSON.stringify(restaurantData));
                        }
                        
                        toast({
                          title: "Hidden Forever",
                          description: `${selectedRestaurant.name} won't be suggested again`,
                        });
                        
                        getRandomRestaurant();
                      }}
                      className="transition-smooth"
                      variant="outline"
                    >
                      <EyeOff className="w-4 h-4 mr-2" />
                      Don't Show Again
                    </Button>
                    <Button 
                      onClick={() => {
                        handleSwipe(false);
                        getRandomRestaurant();
                      }}
                      className="flex-1 transition-smooth"
                      variant="outline"
                    >
                      <X className="w-4 h-4 mr-2" />
                      Pass
                    </Button>
                    <Button 
                      onClick={() => {
                        handleSwipe(true);
                        getRandomRestaurant();
                      }}
                      className="flex-1 bg-gradient-primary hover:shadow-warm transition-bounce"
                    >
                      <Heart className="w-4 h-4 mr-2" />
                      Like It
                    </Button>
                  </div>
                  
                  <Button 
                    onClick={() => {
                      const mapsUrl = `https://www.google.com/maps/dir/?api=1&destination=${selectedRestaurant.latitude},${selectedRestaurant.longitude}`;
                      window.open(mapsUrl, '_blank');
                    }}
                    className="w-full mt-3"
                    variant="outline"
                  >
                    <Navigation className="w-4 h-4 mr-2" />
                    Get Directions
                  </Button>
                 </CardContent>
               </Card>
               </div>
             )}
           </div>
         )}
      </div>
    </div>
  );
};

export default RandomPick;
