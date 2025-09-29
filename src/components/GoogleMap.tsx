import React, { useEffect, useRef, useState } from 'react';
import { loadGoogleMaps } from '@/lib/googleMapsLoader';

interface Restaurant {
  id: string;
  name: string;
  address: string;
  distance: number;
  rating?: number;
  cuisine?: string;
  latitude: number;
  longitude: number;
}

interface UserLocation {
  latitude: number;
  longitude: number;
}

interface GoogleMapProps {
  apiKey: string;
  userLocation: UserLocation;
  restaurants: Restaurant[];
  className?: string;
}

const GoogleMap: React.FC<GoogleMapProps> = ({
  apiKey,
  userLocation,
  restaurants,
  className = '',
}) => {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<google.maps.Map | null>(null);
  const markersRef = useRef<google.maps.Marker[]>([]);
  const [isLoaded, setIsLoaded] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!apiKey) {
      setError('Google Maps API key is required');
      return;
    }

    loadGoogleMaps(apiKey)
      .then(() => {
        setIsLoaded(true);
        setError(null);
      })
      .catch((e) => {
        setError('Failed to load Google Maps');
        console.error('Google Maps loading error:', e);
      });
  }, [apiKey]);

  useEffect(() => {
    if (!isLoaded || !mapRef.current || !userLocation) return;

    // Initialize map
    const map = new google.maps.Map(mapRef.current, {
      center: { lat: userLocation.latitude, lng: userLocation.longitude },
      zoom: 13,
      styles: [
        {
          featureType: 'poi',
          elementType: 'labels',
          stylers: [{ visibility: 'off' }],
        },
        {
          featureType: 'transit',
          elementType: 'labels.icon',
          stylers: [{ visibility: 'off' }],
        },
      ],
    });

    mapInstanceRef.current = map;

    // Add user location marker
    new google.maps.Marker({
      position: { lat: userLocation.latitude, lng: userLocation.longitude },
      map,
      title: 'Your Location',
      icon: {
        url: 'data:image/svg+xml;charset=UTF-8,' + encodeURIComponent(`
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <circle cx="12" cy="12" r="8" fill="#ff6b35" stroke="#fff" stroke-width="2"/>
            <circle cx="12" cy="12" r="3" fill="#fff"/>
          </svg>
        `),
        scaledSize: new google.maps.Size(24, 24),
        anchor: new google.maps.Point(12, 12),
      },
    });

  }, [isLoaded, userLocation]);

  useEffect(() => {
    if (!isLoaded || !mapInstanceRef.current) return;

    // Clear existing restaurant markers
    markersRef.current.forEach(marker => marker.setMap(null));
    markersRef.current = [];

    // Add restaurant markers
    restaurants.forEach((restaurant) => {
      const marker = new google.maps.Marker({
        position: { lat: restaurant.latitude, lng: restaurant.longitude },
        map: mapInstanceRef.current,
        title: restaurant.name,
        icon: {
          url: 'data:image/svg+xml;charset=UTF-8,' + encodeURIComponent(`
            <svg width="32" height="32" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M16 0C10.48 0 6 4.48 6 10c0 5.25 10 22 10 22s10-16.75 10-22c0-5.52-4.48-10-10-10z" fill="#ff6b35"/>
              <circle cx="16" cy="10" r="6" fill="#fff"/>
              <path d="M16 6c-2.21 0-4 1.79-4 4s1.79 4 4 4 4-1.79 4-4-1.79-4-4-4z" fill="#ff6b35"/>
            </svg>
          `),
          scaledSize: new google.maps.Size(32, 32),
          anchor: new google.maps.Point(16, 32),
        },
      });

      // Add info window
      const infoWindow = new google.maps.InfoWindow({
        content: `
          <div style="padding: 12px; max-width: 250px;">
            <h3 style="margin: 0 0 8px 0; font-size: 16px; font-weight: bold; color: #333;">
              ${restaurant.name}
            </h3>
            <p style="margin: 0 0 6px 0; color: #666; font-size: 14px;">
              ${restaurant.address}
            </p>
            <div style="display: flex; align-items: center; gap: 12px; margin-bottom: 6px;">
              <span style="color: #ff6b35; font-weight: bold; font-size: 14px;">
                ${restaurant.distance} miles away
              </span>
              ${restaurant.rating ? `
                <span style="color: #666; font-size: 14px;">
                  ⭐ ${restaurant.rating}
                </span>
              ` : ''}
            </div>
            ${restaurant.cuisine ? `
              <span style="background: #ff6b35; color: white; padding: 2px 8px; border-radius: 12px; font-size: 12px;">
                ${restaurant.cuisine}
              </span>
            ` : ''}
          </div>
        `,
      });

      marker.addListener('click', () => {
        infoWindow.open(mapInstanceRef.current, marker);
      });

      markersRef.current.push(marker);
    });

    // Adjust bounds to show all markers
    if (restaurants.length > 0) {
      const bounds = new google.maps.LatLngBounds();
      bounds.extend({ lat: userLocation.latitude, lng: userLocation.longitude });
      restaurants.forEach((restaurant) => {
        bounds.extend({ lat: restaurant.latitude, lng: restaurant.longitude });
      });
      mapInstanceRef.current.fitBounds(bounds);
      
      // Ensure minimum zoom level
      const listener = google.maps.event.addListener(mapInstanceRef.current, 'idle', () => {
        if (mapInstanceRef.current!.getZoom()! > 15) {
          mapInstanceRef.current!.setZoom(15);
        }
        google.maps.event.removeListener(listener);
      });
    }

  }, [isLoaded, restaurants, userLocation]);

  if (error) {
    return (
      <div className={`${className} bg-muted rounded-lg flex items-center justify-center`}>
        <div className="text-center p-8">
          <div className="w-16 h-16 mx-auto mb-4 bg-destructive/10 rounded-full flex items-center justify-center">
            <span className="text-destructive text-2xl">⚠️</span>
          </div>
          <h3 className="text-lg font-semibold mb-2">Map Error</h3>
          <p className="text-muted-foreground text-sm">{error}</p>
        </div>
      </div>
    );
  }

  if (!isLoaded) {
    return (
      <div className={`${className} bg-muted rounded-lg flex items-center justify-center`}>
        <div className="text-center">
          <div className="w-12 h-12 mx-auto mb-4 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
          <p className="text-muted-foreground">Loading map...</p>
        </div>
      </div>
    );
  }

  return <div ref={mapRef} className={className} />;
};

export default GoogleMap;