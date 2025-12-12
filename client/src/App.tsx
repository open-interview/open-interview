import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/not-found";
import Stats from "@/pages/Stats";
import Home from "@/pages/Home";
import About from "@/pages/About";
import Reels from "@/pages/Reels";
import MermaidTest from "@/pages/MermaidTest";
import { ThemeProvider } from "./context/ThemeContext";
import { usePageViewTracking, useSessionTracking, useInteractionTracking } from "./hooks/use-analytics";

function Router() {
  return (
    <Switch>
      <Route path="/" component={Home} />
      <Route path="/about" component={About} />
      <Route path="/stats" component={Stats} />
      <Route path="/test/mermaid" component={MermaidTest} />
      <Route path="/channel/:id" component={Reels} />
      <Route path="/channel/:id/:index" component={Reels} />
      <Route component={NotFound} />
    </Switch>
  );
}

function AppContent() {
  // Initialize analytics hooks
  usePageViewTracking();
  useSessionTracking();
  useInteractionTracking();

  return <Router />;
}

function App() {
  return (
    <ThemeProvider>
      <QueryClientProvider client={queryClient}>
        <TooltipProvider>
          <Toaster />
          <AppContent />
        </TooltipProvider>
      </QueryClientProvider>
    </ThemeProvider>
  );
}

export default App;
