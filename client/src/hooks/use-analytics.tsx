import { useEffect, useRef } from 'react';
import { useLocation } from 'wouter';
import { trackPageViewSafe } from '../lib/analytics-wrapper';

export const useAnalytics = () => {
  const [location] = useLocation();
  const prevLocationRef = useRef<string>(location);
  
  useEffect(() => {
    try {
      if (location !== prevLocationRef.current) {
        trackPageViewSafe(location, {
          page_title: document.title,
          referrer: document.referrer
        });
        prevLocationRef.current = location;
      }
    } catch (error) {
      console.warn('Analytics tracking failed:', error);
    }
  }, [location]);
};