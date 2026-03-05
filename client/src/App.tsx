import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import ConfidenceMeter from "@/pages/confidence-meter";
import NotFound from "@/pages/not-found";
import { useEffect } from "react";
import { useAnalytics } from "./hooks/use-analytics";
import { initializeAnalytics } from "./lib/analytics-wrapper";

function Router() {
  // Track page views when routes change
  useAnalytics();
  
  return (
    <Switch>
      <Route path="/" component={ConfidenceMeter} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  // Initialize analytics when app loads
  useEffect(() => {
    // Initialize analytics with ad-blocker protection
    initializeAnalytics();
  }, []);

  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Router />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
