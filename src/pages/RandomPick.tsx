import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { MapPin, Star, Navigation, Shuffle, ArrowLeft, Image as ImageIcon, Clock, ChevronDown } from 'lucide-react';
import { useRestaurants } from '@/contexts/RestaurantContext';
import { Link } from 'react-router-dom';

const RandomPick = () => {
  const { restaurants } = useRestaurants();
  const [selectedRestaurant, setSelectedRestaurant] = useState<typeof restaurants[0] | null>(null);
  const [recentlyShown, setRecentlyShown] = useState<string[]>([]);
  const [showHours, setShowHours] = useState(false);

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

  const getRandomRestaurant = () => {
    // First filter for restaurants that are open now or opening soon
    const openOrOpeningSoon = restaurants.filter(isOpenOrOpeningSoon);
    
    if (openOrOpeningSoon.length === 0) {
      setSelectedRestaurant(null);
      return;
    }
    
    // Get restaurants that haven't been shown recently
    const availableRestaurants = openOrOpeningSoon.filter(
      r => !recentlyShown.includes(r.id)
    );
    
    // If all restaurants have been shown, reset the history but keep current one
    const poolToChooseFrom = availableRestaurants.length > 0 
      ? availableRestaurants 
      : openOrOpeningSoon.filter(r => r.id !== selectedRestaurant?.id);
    
    // Pick a random restaurant from the available pool
    const randomIndex = Math.floor(Math.random() * poolToChooseFrom.length);
    const newRestaurant = poolToChooseFrom[randomIndex];
    
    setSelectedRestaurant(newRestaurant);
    
    // Update recently shown list (keep last 5 or half of total restaurants, whichever is smaller)
    const maxHistory = Math.min(5, Math.floor(openOrOpeningSoon.length / 2));
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
        ) : !selectedRestaurant ? (
          <Card className="shadow-warm">
            <CardContent className="text-center py-12">
              <Clock className="w-16 h-16 mx-auto mb-4 text-muted-foreground" />
              <h2 className="text-xl font-semibold mb-2">No Restaurants Currently Open</h2>
              <p className="text-muted-foreground mb-6">
                No restaurants are open now or opening within the next hour. Try again later!
              </p>
              <Link to="/">
                <Button className="bg-gradient-primary hover:shadow-warm transition-bounce">
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Back to List
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
                      // Check if currently open
                      const now = new Date();
                      const currentDay = now.getDay();
                      const currentTime = now.getHours() * 60 + now.getMinutes(); // minutes since midnight
                      
                      let isOpen = false;
                      const todayHours = selectedRestaurant.openingHours[currentDay];
                      
                      if (todayHours) {
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

                      return (
                        <div className="space-y-2">
                          <button 
                            onClick={() => setShowHours(!showHours)}
                            className="flex items-center space-x-2 w-full hover:opacity-80 transition-opacity"
                          >
                            <Clock className="w-5 h-5 text-muted-foreground" />
                            <h3 className={`font-semibold ${isOpen ? 'text-green-600 dark:text-green-500' : 'text-red-600 dark:text-red-500'}`}>
                              Currently {isOpen ? 'Open' : 'Closed'}
                            </h3>
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
