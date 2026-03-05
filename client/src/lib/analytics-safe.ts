// Safe analytics wrapper that gracefully handles ad-blockers
let analyticsAvailable = true;

// Test if analytics libraries are accessible
const checkAnalyticsAvailability = () => {
  try {
    // Test if we can access common analytics domains
    const testImg = new Image();
    testImg.src = 'https://www.google-analytics.com/collect?v=1&tid=test&cid=test&t=pageview';
    
    // Check if common analytics objects exist
    if (typeof window !== 'undefined') {
      const blockedKeywords = ['mixpanel', 'analytics', 'gtag'];
      const userAgent = navigator.userAgent.toLowerCase();
      const hasAdBlocker = blockedKeywords.some(keyword => 
        userAgent.includes('adblock') || userAgent.includes('ghostery')
      );
      
      if (hasAdBlocker) {
        analyticsAvailable = false;
      }
    }
  } catch (error) {
    analyticsAvailable = false;
  }
};

// Initialize check
checkAnalyticsAvailability();

// Safe wrapper functions
export const safeTrackEvent = (eventName: string, properties?: Record<string, any>) => {
  if (!analyticsAvailable) return;
  
  try {
    // Import analytics functions only when needed and available
    import('../lib/analytics').then(({ trackEvent }) => {
      trackEvent(eventName, properties?.category, properties?.label, properties?.value);
    }).catch(() => {
      console.warn('Analytics tracking unavailable');
    });
    
    import('../lib/mixpanel').then(({ trackMixpanelEvent }) => {
      trackMixpanelEvent(eventName, properties);
    }).catch(() => {
      console.warn('Mixpanel tracking unavailable');
    });
  } catch (error) {
    console.warn('Analytics blocked or unavailable');
  }
};

export const safeTrackPageView = (url: string) => {
  if (!analyticsAvailable) return;
  
  try {
    import('../lib/analytics').then(({ trackPageView }) => {
      trackPageView(url);
    }).catch(() => {
      console.warn('Analytics page tracking unavailable');
    });
  } catch (error) {
    console.warn('Analytics blocked or unavailable');
  }
};

export const safeInitAnalytics = () => {
  if (!analyticsAvailable) {
    console.warn('Analytics blocked - running in privacy mode');
    return;
  }
  
  try {
    import('../lib/analytics').then(({ initGA }) => {
      initGA();
    }).catch(() => {
      console.warn('Google Analytics unavailable');
    });
    
    import('../lib/mixpanel').then(({ initMixpanel }) => {
      initMixpanel();
    }).catch(() => {
      console.warn('Mixpanel unavailable');
    });
  } catch (error) {
    console.warn('Analytics initialization blocked');
  }
};