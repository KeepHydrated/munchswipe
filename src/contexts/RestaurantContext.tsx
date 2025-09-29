import React, { createContext, useContext, useState, ReactNode } from 'react';

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
}

interface UserLocation {
  latitude: number;
  longitude: number;
}

interface RestaurantContextType {
  restaurants: Restaurant[];
  setRestaurants: (restaurants: Restaurant[]) => void;
  userLocation: UserLocation | null;
  setUserLocation: (location: UserLocation | null) => void;
}

const RestaurantContext = createContext<RestaurantContextType | undefined>(undefined);

export const RestaurantProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [restaurants, setRestaurants] = useState<Restaurant[]>([]);
  const [userLocation, setUserLocation] = useState<UserLocation | null>(null);

  return (
    <RestaurantContext.Provider value={{ restaurants, setRestaurants, userLocation, setUserLocation }}>
      {children}
    </RestaurantContext.Provider>
  );
};

export const useRestaurants = () => {
  const context = useContext(RestaurantContext);
  if (context === undefined) {
    throw new Error('useRestaurants must be used within a RestaurantProvider');
  }
  return context;
};
