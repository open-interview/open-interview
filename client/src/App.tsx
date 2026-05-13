import { Switch, Route, Redirect, useLocation } from "wouter";
import { useEffect, useState, Suspense } from "react";
import React from "react";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { TooltipProvider } from "@/components/ui/tooltip";
import { ErrorBoundary } from "./components/ErrorBoundary";
import { StagingBanner } from "./components/StagingBanner";
import NotFound from "@/pages/not-found";
import { InterviewLoader } from "@/components/ui/InterviewLoader";

// Lazy loaded pages with React.lazy for code splitting
const Home = React.lazy(() => import("@/pages/home-facelift"));
const AnswerHistory = React.lazy(() => import("@/pages/AnswerHistory"));
const About = React.lazy(() => import("@/pages/About"));
const WhatsNew = React.lazy(() => import("@/pages/WhatsNew"));
const QuestionViewer = React.lazy(() => import("@/pages/QuestionViewer"));
const Profile = React.lazy(() => import("@/pages/Profile"));
const BotActivity = React.lazy(() => import("@/pages/BotActivity"));
const EventsDashboard = React.lazy(() => import("@/pages/EventsDashboard"));
const Badges = React.lazy(() => import("@/pages/Badges"));
const TestSession = React.lazy(() => import("@/pages/TestSession"));
const Tests = React.lazy(() => import("@/pages/Tests"));
const CodingChallenge = React.lazy(() => import("@/pages/CodingChallenge"));
const Channels = React.lazy(() => import("@/pages/AllChannels"));
const Notifications = React.lazy(() => import("@/pages/Notifications"));
const Bookmarks = React.lazy(() => import("@/pages/Bookmarks"));
const ReviewSession = React.lazy(() => import("@/pages/ReviewSession").catch(() => import("@/pages/ReviewSessionOptimized")));
const Flashcards = React.lazy(() => import("@/pages/Flashcards"));
const VoicePractice = React.lazy(() => import("@/pages/VoicePractice"));
const VoiceSession = React.lazy(() => import("@/pages/VoiceSession"));
const Certifications = React.lazy(() => import("@/pages/Certifications"));
const CertificationPractice = React.lazy(() => import("@/pages/CertificationPractice"));
const CertificationExam = React.lazy(() => import("@/pages/CertificationExam"));
const Documentation = React.lazy(() => import("@/pages/Documentation"));
const MyPath = React.lazy(() => import("@/pages/UnifiedLearningPaths"));
const PersonalizedPath = React.lazy(() => import("@/pages/PersonalizedPath"));
const ManageSubscriptions = React.lazy(() => import("@/pages/ManageSubscriptions"));
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
        let fullPath: string | null = null;

        // Primary: sessionStorage
        const stored = sessionStorage.getItem('spa-redirect');
        if (stored) {
          const { path, search, hash } = JSON.parse(stored);
          sessionStorage.removeItem('spa-redirect');
          fullPath = path + (search || '') + (hash || '');
        }

        // Fallback: ?p= query param (set by 404.html when sessionStorage is unavailable)
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

const StatsRedirect = React.lazy(() => import('@/pages/StatsRedirect'));
const ChallengeHome = React.lazy(() => import('@/pages/ChallengeHome'));
const ChallengeWorkspace = React.lazy(() => import('@/pages/ChallengeWorkspace'));

// Tools
const ArtStudio = React.lazy(() => import('@/pages/ArtStudio'));

// Blog pages
const BlogHomePage = React.lazy(() => import('@/pages/blog/BlogHomePage'));
const BlogListPage = React.lazy(() => import('@/pages/blog/BlogListPage'));
const PostFaceliftPage = React.lazy(() => import('@/pages/blog/post-facelift'));
const BlogSearchPage = React.lazy(() => import('@/pages/blog/BlogSearchPage'));
const AboutBlogPage = React.lazy(() => import('@/pages/blog/AboutBlogPage'));
const AdminBlogPage = React.lazy(() => import('@/pages/admin/AdminBlogPage'));

function Router() {
  return (
    <Suspense fallback={<div className="flex items-center justify-center min-h-screen"><InterviewLoader message="Loading..." showTip={false} /></div>}>
      <Switch>
        <Route path="/" component={Home} />
        <Route path="/history" component={AnswerHistory} />
        <Route path="/about" component={About} />
        <Route path="/whats-new" component={WhatsNew} />
        <Route path="/stats" component={StatsRedirect} />
        <Route path="/badges" component={Badges} />
        <Route path="/tests" component={Tests} />
        <Route path="/test/:channelId" component={TestSession} />
        <Route path="/coding" component={CodingChallenge} />
        <Route path="/coding/:id" component={CodingChallenge} />
        <Route path="/code" component={ChallengeHome} />
        <Route path="/code/challenges"><Redirect to="/code" /></Route>
        <Route path="/code/challenges/:id" component={ChallengeWorkspace} />
        <Route path="/bot-activity" component={BotActivity} />
        <Route path="/events" component={EventsDashboard} />
        <Route path="/channels" component={Channels} />
        <Route path="/questions">{() => { window.location.replace('/channels'); return null; }}</Route>
        <Route path="/learning-paths">{() => { window.location.replace('/my-path'); return null; }}</Route>
        <Route path="/my-path" component={MyPath} />
        <Route path="/personalized-path" component={PersonalizedPath} />
        <Route path="/profile" component={Profile} />
        <Route path="/settings">{() => { window.location.replace('/profile'); return null; }}</Route>
        <Route path="/notifications" component={Notifications} />
        <Route path="/bookmarks" component={Bookmarks} />
        <Route path="/review" component={ReviewSession} />
        <Route path="/flashcards" component={Flashcards} />
        <Route path="/voice-interview" component={VoicePractice} />
        <Route path="/training">{() => { window.location.replace('/voice-interview'); return null; }}</Route>
        <Route path="/voice-session" component={VoiceSession} />
        <Route path="/voice-session/:questionId" component={VoiceSession} />
        <Route path="/admin/docs" component={Documentation} />
        <Route path="/docs">{() => { window.location.replace('/admin/docs'); return null; }}</Route>
        <Route path="/certifications" component={Certifications} />
        <Route path="/manage-subscriptions" component={ManageSubscriptions} />
        <Route path="/certification/:id" component={CertificationPractice} />
        <Route path="/certification/:id/exam" component={CertificationExam} />
        <Route path="/certification/:id/:questionIndex" component={CertificationPractice} />
        <Route path="/channel/:id" component={QuestionViewer} />
        <Route path="/channel/:id/:index" component={QuestionViewer} />
        {/* Tools */}
        <Route path="/generate" component={ArtStudio} />
        {/* Blog routes */}
        <Route path="/blog" component={BlogHomePage} />
        <Route path="/blog/search" component={BlogSearchPage} />
        <Route path="/blog/category/:slug">{(params) => (
          <Suspense fallback={<div className="flex items-center justify-center min-h-screen"><InterviewLoader message="Loading..." showTip={false} /></div>}>
            <BlogListPage categorySlug={params.slug} />
          </Suspense>
        )}</Route>
        <Route path="/blog/tag/:tag">{(params) => (
          <Suspense fallback={<div className="flex items-center justify-center min-h-screen"><InterviewLoader message="Loading..." showTip={false} /></div>}>
            <BlogListPage tag={params.tag} />
          </Suspense>
        )}</Route>
        <Route path="/blog/:slug">{(params) => (
          <Suspense fallback={<div className="flex items-center justify-center min-h-screen"><InterviewLoader message="Loading..." showTip={false} /></div>}>
            <PostFaceliftPage slug={params.slug} />
          </Suspense>
        )}</Route>
        <Route path="/about-blog" component={AboutBlogPage} />
        <Route path="/admin/blog" component={AdminBlogPage} />
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
  

  if (isSearchRedirecting) {
    return null;
  }

  return (
    <>
      <Router />
      <GlobalCreditSplash />
      <AchievementNotificationManager />
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
