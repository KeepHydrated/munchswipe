import { useState, useEffect, useCallback } from 'react';

interface ApiUsage {
  nearbySearchCalls: number;
  placeDetailsCalls: number;
  lastResetDate: string;
}

// Free tier limits (based on $200/month credit)
const FREE_LIMITS = {
  nearbySearch: 6250, // ~$32/1000 calls
  placeDetails: 5700, // ~$35/1000 calls (using higher cost estimate)
};

const WARNING_THRESHOLD = 0.8; // Warn at 80% usage

const getMonthKey = () => {
  const now = new Date();
  return `${now.getFullYear()}-${now.getMonth() + 1}`;
};

const getInitialUsage = (): ApiUsage => {
  const stored = localStorage.getItem('googleMapsApiUsage');
  if (stored) {
    const parsed = JSON.parse(stored) as ApiUsage;
    // Reset if it's a new month
    if (parsed.lastResetDate !== getMonthKey()) {
      return {
        nearbySearchCalls: 0,
        placeDetailsCalls: 0,
        lastResetDate: getMonthKey(),
      };
    }
    return parsed;
  }
  return {
    nearbySearchCalls: 0,
    placeDetailsCalls: 0,
    lastResetDate: getMonthKey(),
  };
};

export const useApiUsageTracker = () => {
  const [usage, setUsage] = useState<ApiUsage>(getInitialUsage);

  useEffect(() => {
    localStorage.setItem('googleMapsApiUsage', JSON.stringify(usage));
  }, [usage]);

  const trackNearbySearch = useCallback(() => {
    setUsage(prev => ({
      ...prev,
      nearbySearchCalls: prev.nearbySearchCalls + 1,
    }));
  }, []);

  const trackPlaceDetails = useCallback((count: number = 1) => {
    setUsage(prev => ({
      ...prev,
      placeDetailsCalls: prev.placeDetailsCalls + count,
    }));
  }, []);

  const getUsagePercentage = useCallback(() => {
    const nearbyPercentage = (usage.nearbySearchCalls / FREE_LIMITS.nearbySearch) * 100;
    const detailsPercentage = (usage.placeDetailsCalls / FREE_LIMITS.placeDetails) * 100;
    return Math.max(nearbyPercentage, detailsPercentage);
  }, [usage]);

  const isApproachingLimit = useCallback(() => {
    return getUsagePercentage() >= WARNING_THRESHOLD * 100;
  }, [getUsagePercentage]);

  const isOverLimit = useCallback(() => {
    return getUsagePercentage() >= 100;
  }, [getUsagePercentage]);

  const getEstimatedCost = useCallback(() => {
    const nearbyOverage = Math.max(0, usage.nearbySearchCalls - FREE_LIMITS.nearbySearch);
    const detailsOverage = Math.max(0, usage.placeDetailsCalls - FREE_LIMITS.placeDetails);
    
    const nearbyCost = (nearbyOverage / 1000) * 32;
    const detailsCost = (detailsOverage / 1000) * 35;
    
    return nearbyCost + detailsCost;
  }, [usage]);

  const resetUsage = useCallback(() => {
    setUsage({
      nearbySearchCalls: 0,
      placeDetailsCalls: 0,
      lastResetDate: getMonthKey(),
    });
  }, []);

  return {
    usage,
    trackNearbySearch,
    trackPlaceDetails,
    getUsagePercentage,
    isApproachingLimit,
    isOverLimit,
    getEstimatedCost,
    resetUsage,
    limits: FREE_LIMITS,
  };
};
