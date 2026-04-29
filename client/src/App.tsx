import { Switch, Route, useLocation } from "wouter";
import { useEffect, useState, Suspense } from "react";
import React from "react";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { TooltipProvider } from "@/components/ui/tooltip";
import { ErrorBoundary } from "./components/ErrorBoundary";
import { StagingBanner } from "./components/StagingBanner";
import { useUnifiedToast } from "@/hooks/use-unified-toast";
import NotFound from "@/pages/not-found";
import { InterviewLoader } from "@/components/ui/InterviewLoader";

// Lazy loaded pages with React.lazy for code splitting
const Home = React.lazy(() => import("@/pages/HomeGoogle"));
const About = React.lazy(() => import("@/pages/About"));
const WhatsNew = React.lazy(() => import("@/pages/WhatsNew"));
const QuestionViewer = React.lazy(() => import("@/pages/QuestionViewer"));
const Profile = React.lazy(() => import("@/pages/Profile"));
const BotActivity = React.lazy(() => import("@/pages/BotActivity"));
const TestSession = React.lazy(() => import("@/pages/TestSession"));
const Tests = React.lazy(() => import("@/pages/Tests"));
const CodingChallenge = React.lazy(() => import("@/pages/CodingChallenge"));
const CodeChallengesIndex = React.lazy(() => import("@/pages/CodeChallengesIndex"));
const Channels = React.lazy(() => import("@/pages/AllChannels"));
const Notifications = React.lazy(() => import("@/pages/Notifications"));
const Bookmarks = React.lazy(() => import("@/pages/Bookmarks"));
const ReviewSession = React.lazy(() => import("@/pages/ReviewSession"));
const Flashcards = React.lazy(() => import("@/pages/Flashcards"));
const VoicePractice = React.lazy(() => import("@/pages/VoicePractice"));
const VoiceSession = React.lazy(() => import("@/pages/VoiceSession"));
const Certifications = React.lazy(() => import("@/pages/Certifications"));
const CertificationPractice = React.lazy(() => import("@/pages/CertificationPractice"));
const CertificationExam = React.lazy(() => import("@/pages/CertificationExam"));
const Documentation = React.lazy(() => import("@/pages/Documentation"));
const LearningPaths = React.lazy(() => import("@/pages/UnifiedLearningPaths"));
const PersonalizedPath = React.lazy(() => import("@/pages/PersonalizedPath"));
import { Onboarding } from "./components/google/Onboarding";
import { SubscriptionGate } from "./components/SubscriptionGate";
const ManageSubscriptions = React.lazy(() => import("@/pages/ManageSubscriptions"));
const Practice = React.lazy(() => import("@/pages/Practice"));
const Progress = React.lazy(() => import("@/pages/Progress"));
import { ThemeProvider } from "./context/ThemeContext";
import { UserPreferencesProvider, useUserPreferences } from "./context/UserPreferencesContext";
import { BadgeProvider } from "./context/BadgeContext";
import { CreditsProvider, useCredits } from "./context/CreditsContext";
import { AchievementProvider, useAchievementContext } from "./context/AchievementContext";
import { SidebarProvider } from "./context/SidebarContext";
import { CreditSplash } from "./components/CreditsDisplay";
import { AchievementNotificationManager } from "./components/AchievementNotificationManager";
import { UnifiedNotificationProvider } from "./components/UnifiedNotificationManager";
import { usePageViewTracking, useSessionTracking, useInteractionTracking } from "./hooks/use-analytics";
import { preloadQuestions, getQuestionByIdAsync } from "./lib/questions-loader";

// Handle SPA redirect from 404.html (GitHub Pages)
function useSpaRedirect() {
  const [, setLocation] = useLocation();
  
  useEffect(() => {
    // Check if we're returning from a 404 redirect
    const params = new URLSearchParams(window.location.search);
    if (params.get('spa-redirect') === 'true') {
      try {
        const stored = sessionStorage.getItem('spa-redirect');
        if (stored) {
          const { path, search, hash } = JSON.parse(stored);
          sessionStorage.removeItem('spa-redirect');
          
          // Navigate to the intended path
          const fullPath = path + (search || '') + (hash || '');
          // Use replaceState to clean up the URL
          window.history.replaceState(null, '', fullPath);
          setLocation(path);
        }
      } catch (e) {
        console.error('SPA redirect error:', e);
      }
    }
  }, [setLocation]);
}

// Handle ?search=q-XXX URL parameter to navigate directly to a question
function useSearchParamRedirect() {
  const [, setLocation] = useLocation();
  const [isRedirecting, setIsRedirecting] = useState(() => {
    // Check on initial render if we have a search param
    const params = new URLSearchParams(window.location.search);
    const searchParam = params.get('search');
    return !!(searchParam && (searchParam.startsWith('q-') || searchParam.startsWith('gh-')));
  });
  
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const searchParam = params.get('search');
    
    // Check if it's a question ID (q-XXX or gh-XXX format)
    if (searchParam && (searchParam.startsWith('q-') || searchParam.startsWith('gh-'))) {
      // Preload questions first, then find and redirect
      preloadQuestions().then(() => {
        return getQuestionByIdAsync(searchParam);
      }).then(question => {
        if (question) {
          // Navigate to the question
          const targetUrl = `/channel/${question.channel}/${question.id}`;
          window.history.replaceState(null, '', targetUrl);
          setLocation(targetUrl);
        }
        setIsRedirecting(false);
      }).catch(() => {
        setIsRedirecting(false);
      });
    }
  }, [setLocation]);
  
  return isRedirecting;
}

const GoogleStats = React.lazy(() => import('@/pages/GoogleStats'));
const ChallengeHome = React.lazy(() => import('@/pages/ChallengeHome'));
const ChallengeWorkspace = React.lazy(() => import('@/pages/ChallengeWorkspace'));

// Blog pages
const BlogHomePage = React.lazy(() => import('@/pages/blog/BlogHomePage'));
const BlogListPage = React.lazy(() => import('@/pages/blog/BlogListPage'));
const PostDetailPage = React.lazy(() => import('@/pages/blog/PostDetailPage'));
const BlogSearchPage = React.lazy(() => import('@/pages/blog/BlogSearchPage'));
const AboutBlogPage = React.lazy(() => import('@/pages/blog/AboutBlogPage'));

function Router() {
  const [, setLocation] = useLocation();
  return (
    <Suspense fallback={<div className="flex items-center justify-center min-h-screen"><InterviewLoader message="Loading..." showTip={false} /></div>}>
      <Switch>
        <Route path="/" component={Home} />
        <Route path="/about" component={About} />
        <Route path="/whats-new" component={WhatsNew} />
        <Route path="/docs" component={Documentation} />
        <Route path="/bot-activity" component={BotActivity} />
        <Route path="/notifications" component={Notifications} />
        <Route path="/manage-subscriptions" component={ManageSubscriptions} />

        {/* Learn */}
        <Route path="/channels/:category">{(params) => <Channels category={params.category} />}</Route>
        <Route path="/channels" component={Channels} />
        <Route path="/channel/:id" component={QuestionViewer} />
        <Route path="/channel/:id/:index" component={QuestionViewer} />
        <Route path="/certifications" component={Certifications} />
        <Route path="/certification/:id/exam" component={CertificationExam} />
        <Route path="/certification/:id/:questionIndex" component={CertificationPractice} />
        <Route path="/certification/:id" component={CertificationPractice} />
        <Route path="/learning-paths/:pathId">{(params) => <LearningPaths pathId={params.pathId} />}</Route>
        <Route path="/learning-paths" component={LearningPaths} />
        <Route path="/personalized-path" component={PersonalizedPath} />

        {/* Practice hub + modes */}
        <Route path="/practice" component={Practice} />
        <Route path="/voice-interview" component={VoicePractice} />
        <Route path="/voice-session" component={VoiceSession} />
        <Route path="/voice-session/:questionId" component={VoiceSession} />
        <Route path="/tests" component={Tests} />
        <Route path="/test/:channelId" component={TestSession} />
        <Route path="/coding" component={CodeChallengesIndex} />
        <Route path="/coding/:id" component={CodingChallenge} />
        <Route path="/challenge/:topic/:id">{(params) => <ChallengeWorkspace topic={params.topic} id={params.id} />}</Route>
        <Route path="/challenge/:topic">{(params) => <ChallengeHome topic={params.topic} />}</Route>
        <Route path="/review" component={ReviewSession} />
        <Route path="/flashcards" component={Flashcards} />

        {/* Progress */}
        <Route path="/progress" component={Progress} />
        <Route path="/stats">{() => { setLocation('/progress'); return null; }}</Route>
        <Route path="/badges">{() => { setLocation('/progress?tab=badges'); return null; }}</Route>
        <Route path="/history">{() => { setLocation('/progress?tab=history'); return null; }}</Route>

        {/* Profile & account */}
        <Route path="/profile" component={Profile} />
        <Route path="/bookmarks/:topic">{(params) => <Bookmarks topic={params.topic} />}</Route>
        <Route path="/bookmarks" component={Bookmarks} />

        {/* Redirects for removed duplicate routes */}
        <Route path="/code">{() => { setLocation('/coding'); return null; }}</Route>
        <Route path="/training">{() => { setLocation('/voice-interview'); return null; }}</Route>
        <Route path="/my-path">{() => { setLocation('/learning-paths'); return null; }}</Route>

        {/* Blog */}
        <Route path="/blog" component={BlogHomePage} />
        <Route path="/blog/search" component={BlogSearchPage} />
        <Route path="/blog/category/:slug">{(params) => <BlogListPage categorySlug={params.slug} />}</Route>
        <Route path="/blog/tag/:tag">{(params) => <BlogListPage tag={params.tag} />}</Route>
        <Route path="/blog/:slug">{(params) => <PostDetailPage slug={params.slug} />}</Route>
        <Route path="/about-blog" component={AboutBlogPage} />

        <Route component={NotFound} />
      </Switch>
    </Suspense>
  );
}

function AppContent() {
  // Handle SPA redirects from 404.html (GitHub Pages)
  useSpaRedirect();
  
  // Handle ?search=q-XXX URL parameter
  const isSearchRedirecting = useSearchParamRedirect();
  
  // Initialize analytics hooks
  usePageViewTracking();
  useSessionTracking();
  useInteractionTracking();
  
  // Track daily login for achievements
  const { trackEvent } = useAchievementContext();
  useEffect(() => {
    trackEvent({
      type: 'daily_login',
      timestamp: new Date().toISOString(),
    });
  }, []);
  
  // Preload questions for search functionality
  useEffect(() => {
    preloadQuestions().catch(console.error);
  }, []);
  
  const { needsOnboarding, skipOnboarding } = useUserPreferences();
  const { toast } = useUnifiedToast();
  
  // Listen for service worker update
  useEffect(() => {
    const handleSWUpdate = () => {
      toast({
        title: 'Update Available',
        description: 'A new version is available. Reload to update.',
      });
      // Show a separate toast with action
      setTimeout(() => {
        toast({
          title: 'Reload',
          description: 'Click to update to the latest version',
        });
      }, 100);
    };
    
    window.addEventListener('sw-update-available', handleSWUpdate);
    return () => window.removeEventListener('sw-update-available', handleSWUpdate);
  }, [toast]);
  
  // Don't render anything while redirecting
  if (isSearchRedirecting) {
    return null;
  }

  return (
    <>
      <SubscriptionGate>
        <Router />
      </SubscriptionGate>
      <GlobalCreditSplash />
      <AchievementNotificationManager />
      
      {/* Global ARIA live regions for screen reader announcements */}
      <div id="live-region-polite" aria-live="polite" aria-atomic="true" className="sr-only" />
      <div id="live-region-assertive" aria-live="assertive" aria-atomic="true" className="sr-only" />
      
      {needsOnboarding && (
        <div className="fixed inset-0 z-[2000] flex items-center justify-center bg-black/60 backdrop-blur-sm">
          <Onboarding onComplete={skipOnboarding} onSkip={skipOnboarding} />
        </div>
      )}
    </>
  );
}

// Global credit splash component
function GlobalCreditSplash() {
  const { creditChange, clearCreditChange } = useCredits();
  return (
    <CreditSplash 
      amount={creditChange.amount} 
      show={creditChange.show} 
      onComplete={clearCreditChange}
    />
  );
}

function App() {
  return (
    <ErrorBoundary>
      <ThemeProvider>
        <UserPreferencesProvider>
          <SidebarProvider>
            <QueryClientProvider client={queryClient}>
              <TooltipProvider>
                <BadgeProvider>
                  <CreditsProvider>
                    <AchievementProvider>
                      <UnifiedNotificationProvider>
                        <StagingBanner />
                        <AppContent />
                      </UnifiedNotificationProvider>
                    </AchievementProvider>
                  </CreditsProvider>
                </BadgeProvider>
              </TooltipProvider>
            </QueryClientProvider>
          </SidebarProvider>
        </UserPreferencesProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}

export default App;
