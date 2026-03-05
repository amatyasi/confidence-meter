// Safe Mixpanel with comprehensive ad-blocker protection
let mixpanel: any;
let isAnalyticsBlocked = false;

// Create a safe mock object for when analytics are blocked
const mockMixpanel = {
  init: () => {},
  track: () => {},
  identify: () => {},
  register: () => {},
  people: { set: () => {} },
  get_distinct_id: () => 'analytics-blocked'
};

// Safe initialization of Mixpanel
const initializeMixpanel = () => {
  try {
    // Test if we can create basic objects (blocked by some ad-blockers)
    if (typeof window === 'undefined') {
      throw new Error('Window object not available');
    }
    
    // Try to import Mixpanel
    const mixpanelModule = require('mixpanel-browser');
    if (!mixpanelModule) {
      throw new Error('Mixpanel module not available');
    }
    
    mixpanel = mixpanelModule;
    return true;
  } catch (error) {
    console.warn('Mixpanel blocked by ad-blocker or unavailable. Analytics disabled.');
    isAnalyticsBlocked = true;
    mixpanel = mockMixpanel;
    return false;
  }
};

// Initialize on module load
initializeMixpanel();

// Initialize Mixpanel
export const initMixpanel = () => {
  try {
    if (isAnalyticsBlocked) {
      console.warn('Analytics blocked - skipping Mixpanel initialization');
      return;
    }

    const token = import.meta.env.VITE_MIXPANEL_TOKEN;
    
    if (!token) {
      console.warn('Missing required Mixpanel token: VITE_MIXPANEL_TOKEN');
      return;
    }

    console.log('Initializing Mixpanel with token:', token.substring(0, 8) + '...');
    
    mixpanel.init(token, {
      debug: true,
      track_pageview: false, // We'll track manually
      persistence: 'localStorage',
      ignore_dnt: true,
      batch_requests: false,
      api_host: 'https://api.mixpanel.com',
      property_blacklist: [], // Don't blacklist any properties
      upgrade: true,
      track_links_timeout: 300,
    });
    
    console.log('Mixpanel initialized successfully');
    
    // Set super properties (sent with every event)
    try {
      (mixpanel as any).register({
        'App Name': 'Confidence Meter',
        'App Version': '1.0.0',
        'Environment': import.meta.env.MODE,
        'URL': window.location.href,
        'Domain': window.location.hostname,
        'User Agent': navigator.userAgent,
        'Screen Resolution': `${screen.width}x${screen.height}`,
        'Language': navigator.language,
        'Platform': navigator.platform,
        'Timezone': Intl.DateTimeFormat().resolvedOptions().timeZone,
      });
    } catch (e) {
      console.warn('Could not set Mixpanel super properties:', e);
    }
    
    // Send initial page view with enhanced properties
    mixpanel.track('Page View', {
      page: window.location.pathname,
      page_title: document.title,
      referrer: document.referrer || 'direct',
      viewport_width: window.innerWidth,
      viewport_height: window.innerHeight,
      app_name: 'Confidence Meter',
      environment: import.meta.env.MODE,
      domain: window.location.hostname,
      language: navigator.language,
      platform: navigator.platform,
      timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
    });
  } catch (error) {
    console.warn('Mixpanel blocked or failed to load. Analytics will be disabled.', error);
  }
};

// Track events
export const trackMixpanelEvent = (
  eventName: string,
  properties?: Record<string, any>
) => {
  try {
    if (!import.meta.env.VITE_MIXPANEL_TOKEN) {
      console.warn('Mixpanel token not found, skipping event:', eventName);
      return;
    }
    
    // Add timestamp and session info to all events
    const enhancedProperties = {
      ...properties,
      timestamp: new Date().toISOString(),
      session_id: (mixpanel as any).get_distinct_id?.() || 'unknown',
      page_url: window.location.href,
      page_path: window.location.pathname,
      app_name: 'Confidence Meter',
      domain: window.location.hostname,
    };
    
    console.log('Tracking Mixpanel event:', eventName, enhancedProperties);
    mixpanel.track(eventName, enhancedProperties);
  } catch (error) {
    console.warn('Failed to track Mixpanel event:', eventName, error);
  }
};

// Identify user (if you have user identification)
export const identifyMixpanelUser = (userId: string, properties?: Record<string, any>) => {
  try {
    if (!import.meta.env.VITE_MIXPANEL_TOKEN) return;
    
    mixpanel.identify(userId);
    if (properties) {
      mixpanel.people.set(properties);
    }
  } catch (error) {
    console.warn('Failed to identify Mixpanel user:', error);
  }
};

// Set user properties
export const setMixpanelUserProperties = (properties: Record<string, any>) => {
  try {
    if (!import.meta.env.VITE_MIXPANEL_TOKEN) return;
    
    mixpanel.people.set(properties);
  } catch (error) {
    console.warn('Failed to set Mixpanel user properties:', error);
  }
};

// Track page views
export const trackMixpanelPageView = (pageName: string, properties?: Record<string, any>) => {
  try {
    if (!import.meta.env.VITE_MIXPANEL_TOKEN) return;
    
    mixpanel.track('Page View', {
      page: pageName,
      ...properties
    });
  } catch (error) {
    console.warn('Failed to track Mixpanel page view:', error);
  }
};