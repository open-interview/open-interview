import { Switch, Route, Redirect, useLocation } from "wouter";
import { useEffect, useState, Suspense } from "react";
import React from "react";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { TooltipProvider } from "@/components/ui/tooltip";
import { ErrorBoundary } from "./components/ErrorBoundary";
import { UserPreferencesProvider } from "./context/UserPreferencesContext";
import { RewardProvider } from "./context/RewardContext";
import { BadgeProvider } from "./context/BadgeContext";
import { ThemeProvider } from "./context/ThemeContext";
import { migrateSRSStores } from "./lib/srs-migration";
import { OfflineDetector } from "./components/ui/OfflineDetector";

const SwipeStudy = React.lazy(() => import('@/pages/SwipeStudy'));
const MinimalProfile = React.lazy(() => import('@/pages/MinimalProfile'));

function Spinner() {
  return (
    <div className="flex items-center justify-center min-h-screen bg-background">
      <div className="w-6 h-6 border-2 border-purple-500 border-t-transparent rounded-full animate-spin" />
    </div>
  );
}

// Handle SPA redirect from 404.html (GitHub Pages)
function useSpaRedirect() {
  const [, setLocation] = useLocation();
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get('spa-redirect') === 'true') {
      try {
        let fullPath: string | null = null;
        const stored = sessionStorage.getItem('spa-redirect');
        if (stored) {
          const { path, search, hash } = JSON.parse(stored);
          sessionStorage.removeItem('spa-redirect');
          fullPath = path + (search || '') + (hash || '');
        }
        if (!fullPath) {
          const encoded = params.get('p');
          if (encoded) fullPath = decodeURIComponent(encoded);
        }
        if (fullPath) {
          window.history.replaceState(null, '', fullPath);
          setLocation(fullPath.split('?')[0].split('#')[0]);
        }
      } catch (e) {
        console.error('SPA redirect error:', e);
      }
    }
  }, [setLocation]);
}

function Router() {
  return (
    <Suspense fallback={<Spinner />}>
      <Switch>
        <Route path="/study" component={SwipeStudy} />
        <Route path="/study/:filter" component={SwipeStudy} />
        <Route path="/profile" component={MinimalProfile} />
        <Route path="/questions">{() => <Redirect to="/study" />}</Route>
        {/* Redirect everything else to /study */}
        <Route>{() => <Redirect to="/study" />}</Route>
      </Switch>
    </Suspense>
  );
}

function AppContent() {
  useSpaRedirect();
  return <Router />;
}

function App() {
  useEffect(() => {
    migrateSRSStores();
  }, []);

  return (
    <ErrorBoundary>
      <OfflineDetector />
      <ThemeProvider>
        <UserPreferencesProvider>
          <QueryClientProvider client={queryClient}>
            <TooltipProvider>
            <RewardProvider>
              <BadgeProvider>
                <AppContent />
              </BadgeProvider>
            </RewardProvider>
            </TooltipProvider>
          </QueryClientProvider>
        </UserPreferencesProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}

export default App;
