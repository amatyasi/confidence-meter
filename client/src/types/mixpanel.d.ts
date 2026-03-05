declare module 'mixpanel-browser' {
  interface Mixpanel {
    init(token: string, config?: any): void;
    track(event: string, properties?: Record<string, any>): void;
    identify(id: string): void;
    register(properties: Record<string, any>): void;
    get_distinct_id(): string;
    people: {
      set(properties: Record<string, any>): void;
    };
  }
  
  const mixpanel: Mixpanel;
  export default mixpanel;
}