// Bulletproof analytics wrapper that prevents ad-blocker interference

// Global error handler to catch any analytics-related errors
const originalConsoleError = console.error;
console.error = (...args: any[]) => {
  const message = args.join(' ').toLowerCase();
  if (message.includes('mixpanel') || message.includes('gtag') || message.includes('analytics')) {
    console.warn('Analytics error caught and handled:', ...args);
    return;
  }
  originalConsoleError(...args);
};

// Safe execution wrapper
const safeExecute = (fn: () => void, fallback?: () => void) => {
  try {
    fn();
  } catch (error) {
    console.warn('Analytics function blocked or failed:', error);
    if (fallback) {
      try {
        fallback();
      } catch (fallbackError) {
        console.warn('Fallback also failed:', fallbackError);
      }
    }
  }
};

// Safe async execution wrapper
const safeExecuteAsync = async (fn: () => Promise<void>, fallback?: () => void) => {
  try {
    await fn();
  } catch (error) {
    console.warn('Async analytics function blocked or failed:', error);
    if (fallback) {
      try {
        fallback();
      } catch (fallbackError) {
        console.warn('Fallback also failed:', fallbackError);
      }
    }
  }
};

// Initialize analytics with maximum safety
export const initializeAnalytics = () => {
  // Google Analytics initialization
  safeExecuteAsync(async () => {
    const { initGA } = await import('./analytics');
    initGA();
  });

  // Mixpanel initialization
  safeExecuteAsync(async () => {
    const { initMixpanel } = await import('./mixpanel');
    initMixpanel();
  });
};

// Safe event tracking
export const trackEventSafe = (
  action: string,
  category?: string,
  label?: string,
  value?: number,
  mixpanelProperties?: Record<string, any>
) => {
  // Google Analytics tracking
  safeExecuteAsync(async () => {
    const { trackEvent } = await import('./analytics');
    trackEvent(action, category, label, value);
  });

  // Mixpanel tracking
  safeExecuteAsync(async () => {
    const { trackMixpanelEvent } = await import('./mixpanel');
    trackMixpanelEvent(action, mixpanelProperties);
  });
};

// Safe page view tracking
export const trackPageViewSafe = (url: string, properties?: Record<string, any>) => {
  // Google Analytics page view
  safeExecuteAsync(async () => {
    const { trackPageView } = await import('./analytics');
    trackPageView(url);
  });

  // Mixpanel page view
  safeExecuteAsync(async () => {
    const { trackMixpanelPageView } = await import('./mixpanel');
    trackMixpanelPageView(url, properties);
  });
};

// Add global error listeners to catch any missed analytics errors
if (typeof window !== 'undefined') {
  window.addEventListener('error', (event) => {
    const message = event.message?.toLowerCase() || '';
    if (message.includes('mixpanel') || message.includes('gtag') || message.includes('analytics')) {
      console.warn('Global analytics error caught:', event.message);
      event.preventDefault();
      return false;
    }
  });

  window.addEventListener('unhandledrejection', (event) => {
    const message = event.reason?.toString()?.toLowerCase() || '';
    if (message.includes('mixpanel') || message.includes('gtag') || message.includes('analytics')) {
      console.warn('Global analytics promise rejection caught:', event.reason);
      event.preventDefault();
      return false;
    }
  });
}