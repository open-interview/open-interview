import { Switch, Route, Redirect, useLocation } from "wouter";
import { useEffect, Suspense } from "react";
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
import { Code2 } from "lucide-react";

const KnowledgeFeed = React.lazy(() => import('@/pages/KnowledgeFeed'));
const SwipeStudy = React.lazy(() => import('@/pages/SwipeStudy'));
const MinimalProfile = React.lazy(() => import('@/pages/MinimalProfile'));

function LoadingScreen() {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-[var(--bg)] gap-4">
      <div className="relative">
        <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-indigo-500 via-violet-500 to-cyan-500 flex items-center justify-center shadow-lg shadow-violet-500/25 animate-pulse-ring">
          <Code2 className="w-6 h-6 text-white" />
        </div>
      </div>
      <div className="flex flex-col items-center gap-2">
        <p className="text-sm font-medium text-[var(--fg-secondary)] animate-pulse">Loading Open Interview...</p>
        <div className="flex gap-1.5">
          <span className="w-1.5 h-1.5 rounded-full bg-violet-500 animate-bounce" style={{ animationDelay: '0ms' }} />
          <span className="w-1.5 h-1.5 rounded-full bg-indigo-500 animate-bounce" style={{ animationDelay: '150ms' }} />
          <span className="w-1.5 h-1.5 rounded-full bg-cyan-500 animate-bounce" style={{ animationDelay: '300ms' }} />
        </div>
      </div>
    </div>
  );
}

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
    <Suspense fallback={<LoadingScreen />}>
      <Switch>
        <Route path="/" component={KnowledgeFeed} />
        <Route path="/feed" component={KnowledgeFeed} />
        <Route path="/feed/:filter" component={KnowledgeFeed} />
        <Route path="/study" component={SwipeStudy} />
        <Route path="/study/:filter" component={SwipeStudy} />
        <Route path="/profile" component={MinimalProfile} />
        <Route path="/questions">{() => <Redirect to="/feed" />}</Route>
        <Route>{() => <Redirect to="/feed" />}</Route>
      </Switch>
    </Suspense>
  );
}

function usePageTitle() {
  const [location] = useLocation();
  useEffect(() => {
    const titles: Record<string, string> = {
      '/': 'Feed — OpenInterview',
      '/feed': 'Feed — OpenInterview',
      '/study': 'Study — OpenInterview',
      '/profile': 'Profile — OpenInterview',
    };
    const base = Object.entries(titles).find(([path]) =>
      location.startsWith(path)
    )?.[1] || 'OpenInterview';
    document.title = base;
  }, [location]);
}

function AppContent() {
  useSpaRedirect();
  usePageTitle();
  return <Router />;
}

function App() {
  useEffect(() => {
    migrateSRSStores();
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.register('/sw.js').catch(() => {});
    }
  }, []);

  return (
    <ErrorBoundary>
      <ThemeProvider>
        <UserPreferencesProvider>
          <QueryClientProvider client={queryClient}>
            <TooltipProvider>
              <RewardProvider>
                <BadgeProvider>
                  <OfflineDetector />
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
