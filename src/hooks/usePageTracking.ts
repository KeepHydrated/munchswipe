import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useSession } from './useSession';

export const usePageTracking = () => {
  const location = useLocation();
  const { sessionId } = useSession();

  useEffect(() => {
    const trackPageView = async () => {
      if (!sessionId) return;

      try {
        // Get location data from ipapi.co
        const geoResponse = await fetch('https://ipapi.co/json/');
        const geoData = await geoResponse.json();

        await supabase.from('page_views').insert({
          session_id: sessionId,
          page_path: location.pathname,
          referrer: document.referrer,
          user_agent: navigator.userAgent,
          country: geoData.country_name || null,
          city: geoData.city || null,
          region: geoData.region || null,
          ip_address: geoData.ip || null,
        });
      } catch (error) {
        console.error('Error tracking page view:', error);
      }
    };

    trackPageView();
  }, [location.pathname, sessionId]);
};
