// Define the gtag function globally
declare global {
  interface Window {
    dataLayer: any[];
    gtag: (...args: any[]) => void;
  }
}

// Initialize Google Analytics
export const initGA = () => {
  try {
    const measurementId = import.meta.env.VITE_GA_MEASUREMENT_ID;

    if (!measurementId) {
      console.warn('Missing required Google Analytics key: VITE_GA_MEASUREMENT_ID');
      return;
    }

    // Add Google Analytics script to the head with error handling
    const script1 = document.createElement('script');
    script1.async = true;
    script1.src = `https://www.googletagmanager.com/gtag/js?id=${measurementId}`;
    
    script1.onerror = () => {
      console.warn('Google Analytics script blocked or failed to load. Analytics will be disabled.');
    };
    
    script1.onload = () => {
      try {
        // Initialize gtag only after script loads successfully
        const script2 = document.createElement('script');
        script2.innerHTML = `
          window.dataLayer = window.dataLayer || [];
          function gtag(){dataLayer.push(arguments);}
          gtag('js', new Date());
          gtag('config', '${measurementId}');
        `;
        document.head.appendChild(script2);
      } catch (error) {
        console.warn('Failed to initialize Google Analytics:', error);
      }
    };
    
    document.head.appendChild(script1);
  } catch (error) {
    console.warn('Failed to load Google Analytics:', error);
  }
};

// Track page views - useful for single-page applications
export const trackPageView = (url: string) => {
  try {
    if (typeof window === 'undefined' || !window.gtag) return;
    
    const measurementId = import.meta.env.VITE_GA_MEASUREMENT_ID;
    if (!measurementId) return;
    
    window.gtag('config', measurementId, {
      page_path: url
    });
  } catch (error) {
    console.warn('Failed to track page view:', error);
  }
};

// Track events
export const trackEvent = (
  action: string, 
  category?: string, 
  label?: string, 
  value?: number
) => {
  try {
    if (typeof window === 'undefined' || !window.gtag) return;
    
    window.gtag('event', action, {
      event_category: category,
      event_label: label,
      value: value,
    });
  } catch (error) {
    console.warn('Failed to track event:', error);
  }
};