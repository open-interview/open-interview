/**
 * Question Viewer — UI/UX Pro Max Revamp
 * Clean typography, smooth gestures, beautiful answer panel
 */

import { useState, useEffect, useRef } from 'react';
import { useLocation, useRoute } from 'wouter';
import { motion, AnimatePresence, useMotionValue, useTransform, PanInfo } from 'framer-motion';
import { getChannel } from '../lib/data';
import { useQuestionsWithPrefetch, useSubChannels, useCompaniesWithCounts } from '../hooks/use-questions';
import { useProgress, trackActivity } from '../hooks/use-progress';
import { useUserPreferences } from '../context/UserPreferencesContext';
import { useCredits } from '../context/CreditsContext';
import { useAchievementContext } from '../context/AchievementContext';
import { useTheme } from '../context/ThemeContext';
import { SEOHead } from '../components/SEOHead';
import { DesktopSidebarWrapper } from '../components/layout/DesktopSidebarWrapper';
import { MobileBottomNav } from '../components/layout/UnifiedNav';
import { MobileHeader } from '../components/layout/MobileHeader';
import { UnifiedSearch } from '../components/UnifiedSearch';
import { VoiceReminder } from '../components/VoiceReminder';
import { AnswerPanel } from '../components/question/AnswerPanel';
import { QuestionFeedback } from '../components/QuestionFeedback';
import { AICompanion } from '../components/AICompanion';
import { SwipeHint } from '../components/mobile/SwipeHint';
import { Haptics } from '../lib/haptics';
import { trackQuestionView } from '../hooks/use-analytics';
import { trackSwipeNavigation, trackHapticFeedback } from '../lib/analytics';
import { useUnifiedToast } from '../hooks/use-unified-toast';
import {
  getCard, recordReview, addToSRS,
  getMasteryLabel, getMasteryColor,
  type ReviewCard, type ConfidenceRating
} from '../lib/spaced-repetition';
import {
  ChevronLeft, ChevronRight, ChevronDown, Search, X, Bookmark, Share2,
  Filter, Brain, RotateCcw, Check, Zap, Eye, BookOpen
} from 'lucide-react';
import { ProgressRing } from '../components/ProgressRing';

export default function QuestionViewerGenZ() {
  const [location, setLocation] = useLocation();
  const [, params] = useRoute('/channel/:id/:questionId?');
  const channelId = params?.id;
  const questionIdFromUrl = params?.questionId;
  
  const searchParams = new URLSearchParams(location.split('?')[1] || '');
  const questionIdFromSearch = searchParams.get('q');
  const targetQuestionId = questionIdFromSearch || questionIdFromUrl;

  const staticChannel = getChannel(channelId || '');
  const { subChannels: apiSubChannels } = useSubChannels(channelId || '');

  const channel = staticChannel ? {
    ...staticChannel,
    subChannels: [
      { id: 'all', name: 'All Topics' },
      ...apiSubChannels.map(sc => ({
        id: sc,
        name: sc.split('-').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ')
      }))
    ]
  } : null;

  const [selectedSubChannel, setSelectedSubChannel] = useState('all');
  const [selectedDifficulty, setSelectedDifficulty] = useState('all');
  const [selectedCompany, setSelectedCompany] = useState('all');
  const [currentIndex, setCurrentIndex] = useState(0);
  const [showSearchModal, setShowSearchModal] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  const [mobileView, setMobileView] = useState<'question' | 'answer'>('question');
  const [markedQuestions, setMarkedQuestions] = useState<string[]>(() => {
    const saved = localStorage.getItem(`marked-${channelId}`);
    return saved ? JSON.parse(saved) : [];
  });
  const [srsCard, setSrsCard] = useState<ReviewCard | null>(null);
  const [showRatingButtons, setShowRatingButtons] = useState(false);
  const [hasRated, setHasRated] = useState(false);
  
  // Swipe gesture state
  const x = useMotionValue(0);
  const opacity = useTransform(x, [-200, 0, 200], [0.5, 1, 0.5]);
  const leftIndicatorOpacity = useTransform(x, [-200, -60, 0], [1, 0.6, 0]);
  const rightIndicatorOpacity = useTransform(x, [0, 60, 200], [0, 0.6, 1]);
  const [swipeDirection, setSwipeDirection] = useState<'left' | 'right' | null>(null);
  
  // Get current theme from context
  const { theme } = useTheme();
  const isLightMode = theme === 'genz-light';

  const { companiesWithCounts } = useCompaniesWithCounts(
    channelId || '',
    selectedSubChannel,
    selectedDifficulty
  );

  const { preferences, isSubscribed, subscribeChannel } = useUserPreferences();
  const shuffleEnabled = preferences.shuffleQuestions !== false;
  const prioritizeUnvisited = preferences.prioritizeUnvisited !== false;

  const { onQuestionSwipe, onQuestionView } = useCredits();
  const { trackEvent } = useAchievementContext();
  const { completed, markCompleted, saveLastVisitedIndex } = useProgress(channelId || '');
  const { toast } = useUnifiedToast();

  const { question: currentQuestion, questions, totalQuestions, loading, error } = useQuestionsWithPrefetch(
    channelId || '',
    currentIndex,
    selectedSubChannel,
    selectedDifficulty,
    selectedCompany,
    shuffleEnabled,
    prioritizeUnvisited
  );

  const [showAnswer, setShowAnswer] = useState(false);
  const [isInitialized, setIsInitialized] = useState(false);
  
  // Check if current question has an SRS card
  useEffect(() => {
    if (!currentQuestion) return;
    const card = getCard(currentQuestion.id, currentQuestion.channel, currentQuestion.difficulty);
    setSrsCard(card);
    setShowRatingButtons(false);
    setHasRated(false);
    setShowAnswer(false);
  }, [currentQuestion]);
  
  useEffect(() => {
    if (loading || questions.length === 0) return;
    
    if (targetQuestionId) {
      const foundIndex = questions.findIndex(q => q.id === targetQuestionId);
      if (foundIndex >= 0 && foundIndex !== currentIndex) {
        setCurrentIndex(foundIndex);
      }
      if (questionIdFromSearch) {
        setLocation(`/channel/${channelId}/${targetQuestionId}`, { replace: true });
      }
      setIsInitialized(true);
    } else if (questions[0] && !isInitialized) {
      setLocation(`/channel/${channelId}/${questions[0].id}`, { replace: true });
      setIsInitialized(true);
    }
  }, [targetQuestionId, questions.length, channelId, loading, questionIdFromSearch]);

  useEffect(() => {
    if (channelId && channel && !isSubscribed(channelId) && !loading && totalQuestions > 0 && questions.length > 0) {
      subscribeChannel(channelId);
      toast({
        title: "Channel added",
        description: `${channel.name} added to your channels`,
      });
    }
  }, [channelId, channel, loading, totalQuestions, questions.length]);

  useEffect(() => {
    if (totalQuestions > 0 && currentIndex >= totalQuestions) {
      setCurrentIndex(0);
    }
  }, [totalQuestions, currentIndex]);

  useEffect(() => {
    if (!isInitialized || loading || !channelId || !currentQuestion) return;
    
    if (currentQuestion.id !== targetQuestionId) {
      setLocation(`/channel/${channelId}/${currentQuestion.id}`, { replace: true });
    }
    saveLastVisitedIndex(currentIndex);
  }, [currentIndex, isInitialized]);

  useEffect(() => {
    if (currentQuestion) {
      trackQuestionView(currentQuestion.id, currentQuestion.channel, currentQuestion.difficulty);
      markCompleted(currentQuestion.id);
      trackActivity();
      
      trackEvent({
        type: 'question_completed',
        timestamp: new Date().toISOString(),
        data: {
          questionId: currentQuestion.id,
          difficulty: currentQuestion.difficulty,
          channel: currentQuestion.channel,
        },
      });
    }
  }, [currentQuestion?.id]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setShowSearchModal(true);
        return;
      }
      if (showSearchModal) return;

      if (e.key === 'ArrowRight' || e.key === 'ArrowDown') {
        e.preventDefault();
        nextQuestion();
      } else if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') {
        e.preventDefault();
        prevQuestion();
      } else if (e.key === ' ' || e.key === 'Enter') {
        if ((e.target as HTMLElement).tagName !== 'BUTTON' && (e.target as HTMLElement).tagName !== 'INPUT') {
          e.preventDefault();
          setShowAnswer(true);
        }
      } else if (e.key === 'Escape') {
        if (showAnswer) {
          setShowAnswer(false);
        } else {
          setLocation('/channels');
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [currentIndex, totalQuestions, showSearchModal, showAnswer]);

  const nextQuestion = () => {
    if (currentIndex < totalQuestions - 1) {
      setCurrentIndex(prev => prev + 1);
      setMobileView('question');
      setShowAnswer(false);
      onQuestionSwipe();
      onQuestionView();
    }
  };

  const prevQuestion = () => {
    if (currentIndex > 0) {
      setCurrentIndex(prev => prev - 1);
      setMobileView('question');
      setShowAnswer(false);
    }
  };

  const toggleMark = () => {
    if (!currentQuestion) return;
    setMarkedQuestions(prev => {
      const newMarked = prev.includes(currentQuestion.id)
        ? prev.filter(id => id !== currentQuestion.id)
        : [...prev, currentQuestion.id];
      localStorage.setItem(`marked-${channelId}`, JSON.stringify(newMarked));
      return newMarked;
    });
  };

  const handleShare = async () => {
    try {
      await navigator.clipboard.writeText(window.location.href);
      toast({
        title: "Link copied!",
        description: "Question link copied to clipboard",
      });
    } catch {
      toast({
        title: "Share",
        description: window.location.href,
      });
    }
  };

  const handleAddToSRS = () => {
    if (!currentQuestion) return;
    const card = addToSRS(currentQuestion.id, currentQuestion.channel, currentQuestion.difficulty);
    setSrsCard(card);
    setShowRatingButtons(true);
    toast({
      title: "Added to SRS",
      description: "Question added to spaced repetition system",
    });
  };

  const handleSRSRating = (rating: ConfidenceRating) => {
    if (!srsCard || !currentQuestion) return;
    const updatedCard = recordReview(currentQuestion.id, currentQuestion.channel, currentQuestion.difficulty, rating);
    setSrsCard(updatedCard);
    setHasRated(true);
    setShowRatingButtons(false);
    
    // Track achievement
    trackEvent({
      type: 'srs_review',
      timestamp: new Date().toISOString(),
      data: { rating },
    });

    toast({
      title: "Review recorded",
      description: `Mastery: ${getMasteryLabel(updatedCard.masteryLevel)}`,
    });
  };

  // Handle swipe gesture for navigation
  const handleDragEnd = (event: MouseEvent | TouchEvent | PointerEvent, info: PanInfo) => {
    const threshold = 100;
    const velocity = info.velocity.x;
    const page = window.location.pathname;
    
    // Swipe left (next question)
    if (info.offset.x < -threshold || velocity < -500) {
      setSwipeDirection('left');
      Haptics.medium(); // Haptic feedback on swipe
      trackHapticFeedback('medium', 'swipe_navigation_left');
      trackSwipeNavigation(
        page, 
        'left', 
        currentQuestion?.id, 
        questions[currentIndex + 1]?.id,
        Math.abs(velocity)
      );
      setTimeout(() => {
        nextQuestion();
        setSwipeDirection(null);
        x.set(0);
      }, 150);
    }
    // Swipe right (previous question)
    else if (info.offset.x > threshold || velocity > 500) {
      setSwipeDirection('right');
      Haptics.medium(); // Haptic feedback on swipe
      trackHapticFeedback('medium', 'swipe_navigation_right');
      trackSwipeNavigation(
        page, 
        'right', 
        currentQuestion?.id, 
        questions[currentIndex - 1]?.id,
        Math.abs(velocity)
      );
      setTimeout(() => {
        prevQuestion();
        setSwipeDirection(null);
        x.set(0);
      }, 150);
    }
    // Snap back
    else {
      x.set(0);
    }
  };

  // Loading state
  if (loading && questions.length === 0) {
    return (
      <DesktopSidebarWrapper>
        <div className="lg:hidden"><MobileHeader title="Questions" showBack={true} /></div>
        <div className="min-h-screen bg-background flex flex-col">
          <div className="h-14 border-b border-border/50 bg-background/80 animate-pulse" />
          <div className="flex-1 p-4 md:p-6 space-y-4 max-w-3xl mx-auto w-full">
            <div className="flex gap-2">
              <div className="h-6 w-24 bg-muted/60 rounded-full animate-pulse" />
              <div className="h-6 w-16 bg-muted/60 rounded-full animate-pulse" />
            </div>
            <div className="h-48 bg-muted/40 rounded-3xl animate-pulse" />
            <div className="h-4 w-3/4 bg-muted/40 rounded-full animate-pulse" />
            <div className="h-4 w-1/2 bg-muted/40 rounded-full animate-pulse" />
            <div className="h-12 bg-muted/40 rounded-2xl animate-pulse" />
          </div>
        </div>
        <MobileBottomNav />
      </DesktopSidebarWrapper>
    );
  }

  if (error || !channel) {
    return (
      <DesktopSidebarWrapper>
        <div className="lg:hidden"><MobileHeader title="Questions" showBack={true} /></div>
        <div className="min-h-screen bg-background flex flex-col items-center justify-center gap-4 px-4 text-center">
          <div className="w-16 h-16 rounded-full bg-muted/50 flex items-center justify-center">
            <X className="w-8 h-8 text-muted-foreground" />
          </div>
          <div>
            <h2 className="text-xl font-bold mb-1">Channel not found</h2>
            <p className="text-sm text-muted-foreground">The channel "{channelId}" doesn't exist.</p>
          </div>
          <button
            onClick={() => setLocation('/channels')}
            className="flex items-center gap-2 px-5 py-2.5 bg-primary text-primary-foreground font-semibold rounded-full text-sm"
          >
            <ChevronLeft className="w-4 h-4" />
            Back to Channels
          </button>
        </div>
        <MobileBottomNav />
      </DesktopSidebarWrapper>
    );
  }

  if (!loading && (!currentQuestion || totalQuestions === 0)) {
    const hasFilters = selectedSubChannel !== 'all' || selectedDifficulty !== 'all' || selectedCompany !== 'all';

    return (
      <DesktopSidebarWrapper>
        <div className="lg:hidden"><MobileHeader title="Questions" showBack={true} /></div>
        <div className="min-h-screen bg-background flex flex-col items-center justify-center gap-4 px-4 text-center">
          <div className="w-20 h-20 rounded-full bg-muted/50 flex items-center justify-center">
            <BookOpen className="w-10 h-10 text-muted-foreground/50" />
          </div>
          <div>
            <h2 className="text-xl font-bold mb-1">No questions found</h2>
            <p className="text-sm text-muted-foreground">
              {hasFilters ? 'Try adjusting or clearing your filters.' : 'Check back soon for new content!'}
            </p>
          </div>
          <div className="flex gap-2">
            {hasFilters && (
              <button
                onClick={() => {
                  setSelectedSubChannel('all');
                  setSelectedDifficulty('all');
                  setSelectedCompany('all');
                }}
                className="flex items-center gap-2 px-5 py-2.5 bg-primary text-primary-foreground font-semibold rounded-full text-sm"
              >
                <X className="w-4 h-4" />
                Clear filters
              </button>
            )}
            <button
              onClick={() => setLocation('/channels')}
              className="flex items-center gap-2 px-5 py-2.5 bg-muted text-foreground font-semibold rounded-full text-sm"
            >
              <ChevronLeft className="w-4 h-4" />
              Back
            </button>
          </div>
        </div>
        <MobileBottomNav />
      </DesktopSidebarWrapper>
    );
  }

  if (!currentQuestion) return null;

  const isMarked = markedQuestions.includes(currentQuestion.id);
  const isCompleted = completed.includes(currentQuestion.id);
  const progress = Math.round(((currentIndex + 1) / totalQuestions) * 100);

  return (
    <>
      <SEOHead
        title={`${channel.name} - ${currentQuestion.question.substring(0, 60)}...`}
        description={currentQuestion.question}
        canonical={`https://open-interview.github.io/channel/${channelId}/${currentQuestion.id}`}
      />

      <DesktopSidebarWrapper>
      <div className="min-h-screen bg-background text-foreground flex flex-col">
        <div className="lg:hidden">
          <MobileHeader title="Questions" showBack={true} />
        </div>
        {/* Progress bar — top of page */}
        <div className="h-1 bg-muted/40 w-full" role="progressbar" aria-valuenow={progress} aria-valuemin={0} aria-valuemax={100} aria-label="Question progress">
          <motion.div
            className="h-full bg-gradient-to-r from-primary to-cyan-500"
            initial={{ width: 0 }}
            animate={{ width: `${progress}%` }}
            transition={{ duration: 0.3, ease: 'easeOut' }}
          />
        </div>

        {/* Header */}
        <Header
          channel={channel}
          onBack={() => setLocation('/channels')}
          onSearch={() => setShowSearchModal(true)}
          currentIndex={currentIndex}
          totalQuestions={totalQuestions}
          progress={progress}
          onToggleFilters={() => setShowFilters(!showFilters)}
          hasFilters={selectedSubChannel !== 'all' || selectedDifficulty !== 'all' || selectedCompany !== 'all'}
        />

        {/* Filters Panel */}
        <AnimatePresence>
          {showFilters && (
            <FiltersPanel
              channel={channel}
              selectedSubChannel={selectedSubChannel}
              selectedDifficulty={selectedDifficulty}
              selectedCompany={selectedCompany}
              companiesWithCounts={companiesWithCounts}
              onSubChannelChange={(val: string) => {
                setSelectedSubChannel(val);
                setCurrentIndex(0);
              }}
              onDifficultyChange={(val: string) => {
                setSelectedDifficulty(val);
                setCurrentIndex(0);
              }}
              onCompanyChange={(val: string) => {
                setSelectedCompany(val);
                setCurrentIndex(0);
              }}
              onClose={() => setShowFilters(false)}
            />
          )}
        </AnimatePresence>

        {/* Main Content */}
        <div className="flex-1 flex overflow-hidden">
          {/* Desktop split view */}
          <div className="hidden lg:flex flex-1 overflow-hidden">
            {/* Left: Question */}
            <div className="flex-1 overflow-y-auto p-8 border-r border-border/50">
              {currentQuestion ? (
                <QuestionContent
                  question={currentQuestion}
                  questionNumber={currentIndex + 1}
                  totalQuestions={totalQuestions}
                  isMarked={markedQuestions.includes(currentQuestion.id)}
                  isCompleted={completed.includes(currentQuestion.id)}
                  srsCard={srsCard}
                  showRatingButtons={showRatingButtons}
                  hasRated={hasRated}
                  onAddToSRS={handleAddToSRS}
                  onSRSRating={handleSRSRating}
                  onToggleMark={toggleMark}
                  onShare={handleShare}
                />
              ) : null}
            </div>
            {/* Right: Answer always visible */}
            <div className="w-[55%] xl:w-[50%] overflow-y-auto bg-muted/20">
              {currentQuestion ? (
                <AnswerPanel
                  question={currentQuestion}
                  isCompleted={completed.includes(currentQuestion.id)}
                  srsCard={srsCard}
                  showRatingButtons={showRatingButtons}
                  hasRated={hasRated}
                  onAddToSRS={handleAddToSRS}
                  onSRSRating={handleSRSRating}
                />
              ) : (
                <div className="flex items-center justify-center h-full text-muted-foreground">
                  <div className="text-center space-y-2">
                    <Eye className="w-12 h-12 mx-auto opacity-20" />
                    <p className="text-sm">Select a question to see the answer</p>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Mobile: question card + slide-up answer panel */}
          <div className="flex-1 flex flex-col lg:hidden overflow-hidden relative">
            {/* Swipeable question card */}
            <motion.div
              drag="x"
              dragConstraints={{ left: 0, right: 0 }}
              dragElastic={0.15}
              style={{ x, opacity }}
              onDragEnd={handleDragEnd}
              className="flex-1 overflow-y-auto p-4 pb-[calc(80px+env(safe-area-inset-bottom,0px))] pt-14 lg:pt-0 relative"
            >
              {/* Swipe direction indicators */}
              <motion.div
                style={{ opacity: swipeDirection === 'left' ? 1 : leftIndicatorOpacity }}
                className="absolute top-1/2 right-4 -translate-y-1/2 z-10 bg-primary/20 backdrop-blur-sm rounded-full p-3 pointer-events-none"
              >
                <ChevronRight className="w-7 h-7 text-primary" />
              </motion.div>
              <motion.div
                style={{ opacity: swipeDirection === 'right' ? 1 : rightIndicatorOpacity }}
                className="absolute top-1/2 left-4 -translate-y-1/2 z-10 bg-primary/20 backdrop-blur-sm rounded-full p-3 pointer-events-none"
              >
                <ChevronLeft className="w-7 h-7 text-primary" />
              </motion.div>

              <QuestionContent
                question={currentQuestion}
                questionNumber={currentIndex + 1}
                totalQuestions={totalQuestions}
                isMarked={isMarked}
                isCompleted={isCompleted}
                srsCard={srsCard}
                showRatingButtons={showRatingButtons}
                hasRated={hasRated}
                onAddToSRS={handleAddToSRS}
                onSRSRating={handleSRSRating}
                onToggleMark={toggleMark}
                onShare={handleShare}
              />
            </motion.div>

            {/* Reveal Answer button — fixed above nav */}
            {!showAnswer && (
              <div className="absolute bottom-24 inset-x-0 flex justify-center px-6 z-20 pointer-events-none">
                <motion.button
                  initial={{ opacity: 0, y: 16, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  transition={{ delay: 0.2, duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
                  onClick={() => setShowAnswer(true)}
                  className="pointer-events-auto flex items-center gap-3 px-8 py-4 bg-gradient-to-r from-primary via-violet-500 to-cyan-500 text-white font-bold rounded-2xl shadow-2xl shadow-primary/40 text-base tracking-wide"
                  whileHover={{ scale: 1.04, boxShadow: '0 20px 40px rgba(124,58,237,0.5)' }}
                  whileTap={{ scale: 0.96 }}
                >
                  <Eye className="w-5 h-5" />
                  Reveal Answer
                  <kbd className="hidden sm:inline text-xs opacity-50 bg-white/20 px-1.5 py-0.5 rounded font-mono">Space</kbd>
                </motion.button>
              </div>
            )}

            {/* Slide-up Answer Panel */}
            <AnimatePresence>
              {showAnswer && (
                <motion.div
                  initial={{ y: '100%' }}
                  animate={{ y: 0 }}
                  exit={{ y: '100%' }}
                  transition={{ type: 'spring', damping: 28, stiffness: 300 }}
                  drag="y"
                  dragConstraints={{ top: 0, bottom: 0 }}
                  dragElastic={{ top: 0.05, bottom: 0.3 }}
                  onDragEnd={(_e, info) => {
                    if (info.offset.y > 80 || info.velocity.y > 400) {
                      setShowAnswer(false);
                    }
                  }}
                  className="absolute inset-0 z-30 flex flex-col bg-background/95 backdrop-blur-[20px] saturate-180"
                >
                  {/* Top gradient accent */}
                  <div className="bg-gradient-to-b from-primary/5 to-transparent h-1 w-full flex-shrink-0" />
                  {/* Drag handle */}
                  <div className="flex justify-center pt-3 pb-1 flex-shrink-0">
                    <div className="w-10 h-1 rounded-full bg-muted-foreground/30" />
                  </div>
                  {/* Header */}
                  <div className="flex items-center justify-between px-4 pb-2 flex-shrink-0">
                    <span className="text-base font-bold">{channel.name || 'Answer'}</span>
                    <button
                      onClick={() => setShowAnswer(false)}
                      className="w-8 h-8 rounded-full bg-muted flex items-center justify-center hover:bg-muted/80 transition-colors"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                  {/* Scrollable answer content */}
                  <div className="flex-1 overflow-y-auto">
                    <AnswerPanel
                      question={currentQuestion}
                      isCompleted={isCompleted}
                      srsCard={srsCard}
                      showRatingButtons={false}
                      hasRated={hasRated}
                      onAddToSRS={undefined}
                      onSRSRating={undefined}
                    />
                  </div>
                  {/* SRS controls — pinned outside scroll so always visible */}
                  <div className="flex-shrink-0 border-t border-border bg-background/95 px-4 py-3 pb-[calc(12px+env(safe-area-inset-bottom,0px))]">
                    {hasRated ? (
                      <div className="flex items-center justify-center gap-2 text-emerald-400 text-sm font-semibold py-1">
                        <Check className="w-4 h-4" />
                        Review recorded
                      </div>
                    ) : showRatingButtons && srsCard ? (
                      <div className="grid grid-cols-4 gap-2">
                        {(['again', 'hard', 'good', 'easy'] as ConfidenceRating[]).map((rating) => {
                          const cfg: Record<string, { cls: string; label: string }> = {
                            again: { cls: 'bg-red-500/15 border-red-500/30 text-red-400', label: 'Again' },
                            hard:  { cls: 'bg-orange-500/15 border-orange-500/30 text-orange-400', label: 'Hard' },
                            good:  { cls: 'bg-emerald-500/15 border-emerald-500/30 text-emerald-400', label: 'Good' },
                            easy:  { cls: 'bg-blue-500/15 border-blue-500/30 text-blue-400', label: 'Easy' },
                          };
                          return (
                            <button key={rating} onClick={() => handleSRSRating(rating)}
                              className={`py-2.5 border rounded-xl text-xs font-bold transition-all ${cfg[rating].cls}`}>
                              {cfg[rating].label}
                            </button>
                          );
                        })}
                      </div>
                    ) : (
                      <button onClick={handleAddToSRS}
                        className="w-full flex items-center justify-center gap-2 py-3 bg-purple-500/15 border border-purple-500/25 rounded-xl text-sm font-semibold text-purple-400 hover:bg-purple-500/25 transition-all">
                        <Brain className="w-4 h-4" />
                        Add to SRS Review
                      </button>
                    )}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>

        {/* Navigation Footer */}
        <div className="border-t border-border bg-background/95 backdrop-blur-xl p-3 md:p-4 pb-safe flex-shrink-0">
          <div className="max-w-7xl mx-auto flex items-center justify-between gap-2 md:gap-4">
            {/* Previous */}
            <motion.button
              onClick={prevQuestion}
              disabled={currentIndex === 0}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="p-2 md:p-3 bg-muted/50 rounded-full disabled:opacity-30 disabled:cursor-not-allowed hover:bg-muted transition-colors flex-shrink-0"
            >
              <ChevronLeft className="w-4 h-4 md:w-5 md:h-5" />
            </motion.button>

            {/* Progress counter */}
            <div className="flex-1 max-w-md min-w-0">
              <div className="flex items-center gap-2 md:gap-3 mb-1.5">
                <span className="text-xs md:text-sm font-bold text-primary whitespace-nowrap">
                  {currentIndex + 1} / {totalQuestions}
                </span>
                <div className="flex-1 h-1.5 bg-muted rounded-full overflow-hidden min-w-0">
                  <motion.div
                    className="h-full bg-gradient-to-r from-primary to-cyan-500"
                    initial={{ width: 0 }}
                    animate={{ width: `${progress}%` }}
                    transition={{ duration: 0.3 }}
                  />
                </div>
                <span className="text-xs md:text-sm font-bold whitespace-nowrap">{progress}%</span>
              </div>
            </div>

            {/* Actions */}
            <div className="flex items-center gap-1 md:gap-2 flex-shrink-0">
              <motion.button
                onClick={toggleMark}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className={`p-2 md:p-3 rounded-full transition-colors ${
                  isMarked
                    ? 'bg-gradient-to-r from-[#ffd700] to-[#ff8c00] text-black'
                    : 'bg-muted/50 hover:bg-muted'
                }`}
              >
                <Bookmark className="w-4 h-4 md:w-5 md:h-5" fill={isMarked ? 'currentColor' : 'none'} />
              </motion.button>
              <motion.button
                onClick={handleShare}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="hidden sm:block p-2 md:p-3 bg-muted/50 rounded-full hover:bg-muted transition-colors"
              >
                <Share2 className="w-4 h-4 md:w-5 md:h-5" />
              </motion.button>
            </div>

            {/* Next */}
            <motion.button
              onClick={nextQuestion}
              disabled={currentIndex === totalQuestions - 1}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="p-2 md:p-3 bg-gradient-to-r from-primary to-cyan-500 text-primary-foreground rounded-full disabled:opacity-30 disabled:cursor-not-allowed font-bold flex-shrink-0"
            >
              <ChevronRight className="w-4 h-4 md:w-5 md:h-5" />
            </motion.button>
          </div>
        </div>
      </div>
      <MobileBottomNav />
      </DesktopSidebarWrapper>

      <SwipeHint />
      <UnifiedSearch isOpen={showSearchModal} onClose={() => setShowSearchModal(false)} />
      <VoiceReminder />
      <AICompanion
        pageContent={{
          type: 'question',
          title: channel.name,
          question: currentQuestion.question,
          answer: currentQuestion.answer,
          explanation: currentQuestion.explanation,
          tags: currentQuestion.tags,
          difficulty: currentQuestion.difficulty,
        }}
        onNavigate={(path) => setLocation(path)}
        onAction={(action, data) => {
          switch (action) {
            case 'nextQuestion':
              nextQuestion();
              break;
            case 'previousQuestion':
              prevQuestion();
              break;
            case 'showAnswer':
              setShowAnswer(true);
              break;
            case 'hideAnswer':
              setShowAnswer(false);
              break;
            case 'bookmark':
              toggleMark();
              break;
            case 'addToSRS':
              handleAddToSRS();
              break;
            case 'share':
              handleShare();
              break;
            case 'showSearch':
              setShowSearchModal(true);
              break;
            case 'filterByDifficulty':
              if (data?.difficulty) {
                setSelectedDifficulty(data.difficulty);
              }
              break;
            case 'filterBySubChannel':
              if (data?.subChannel) {
                setSelectedSubChannel(data.subChannel);
              }
              break;
            case 'clearFilters':
              setSelectedDifficulty('all');
              setSelectedSubChannel('all');
              break;
          }
        }}
        availableActions={[
          'nextQuestion',
          'previousQuestion',
          'showAnswer',
          'hideAnswer',
          'bookmark',
          'addToSRS',
          'share',
          'showSearch',
          'filterByDifficulty',
          'filterBySubChannel',
          'clearFilters',
        ]}
      />
    </>
  );
}

// Header Component
function Header({ channel, onBack, onSearch, currentIndex, totalQuestions, progress, onToggleFilters, hasFilters }: any) {
  return (
    <header className="border-b border-border bg-background/95 backdrop-blur-xl">
      <div className="max-w-7xl mx-auto px-3 md:px-4 py-3 md:py-4">
        <div className="flex items-center justify-between gap-2 md:gap-4">
          {/* Left */}
          <div className="flex items-center gap-2 md:gap-3 min-w-0 flex-1">
            <motion.button
              onClick={onBack}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              aria-label="Go back"
              className="p-2.5 hover:bg-muted rounded-lg transition-colors flex-shrink-0 min-w-[44px] min-h-[44px] flex items-center justify-center focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
            >
              <ChevronLeft className="w-4 h-4 md:w-5 md:h-5" />
            </motion.button>
            <div className="min-w-0 flex-1">
              <h1 className="font-bold text-sm md:text-lg truncate">{channel.name}</h1>
              {totalQuestions > 0 && (
                <p className="text-xs text-muted-foreground truncate tabular-nums">
                  {currentIndex + 1} / {totalQuestions}
                </p>
              )}
            </div>
          </div>

          {/* Progress ring — desktop only */}
          {totalQuestions > 0 && progress != null && (
            <div className="hidden md:flex items-center gap-2 flex-shrink-0">
              <ProgressRing
                progress={progress}
                size={40}
                strokeWidth={4}
                color="#6366f1"
                bgColor="rgba(99,102,241,0.15)"
              >
                <span className="text-[9px] font-bold tabular-nums text-foreground">{progress}%</span>
              </ProgressRing>
            </div>
          )}

          {/* Right */}
          <div className="flex items-center gap-1 md:gap-2 flex-shrink-0">
            {onToggleFilters && (
              <motion.button
                onClick={onToggleFilters}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                aria-label={hasFilters ? 'Clear filters' : 'Open filters'}
                aria-pressed={hasFilters}
                className={`p-2.5 rounded-lg transition-colors min-w-[44px] min-h-[44px] flex items-center justify-center focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 ${
                  hasFilters
                    ? 'bg-gradient-to-r from-primary to-cyan-500 text-primary-foreground'
                    : 'hover:bg-muted'
                }`}
              >
                <Filter className="w-4 h-4 md:w-5 md:h-5" />
              </motion.button>
            )}
            <motion.button
              onClick={onSearch}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              aria-label="Search questions"
              className="p-2.5 hover:bg-muted rounded-lg transition-colors min-w-[44px] min-h-[44px] flex items-center justify-center focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
            >
              <Search className="w-4 h-4 md:w-5 md:h-5" />
            </motion.button>
          </div>
        </div>
      </div>
    </header>
  );
}

// Filters Panel
function FiltersPanel({ channel, selectedSubChannel, selectedDifficulty, selectedCompany, companiesWithCounts, onSubChannelChange, onDifficultyChange, onCompanyChange, onClose }: any) {
  return (
    <motion.div
      initial={{ height: 0, opacity: 0 }}
      animate={{ height: 'auto', opacity: 1 }}
      exit={{ height: 0, opacity: 0 }}
      className="border-b border-border bg-muted/50 backdrop-blur-xl overflow-hidden"
    >
      <div className="max-w-7xl mx-auto px-3 md:px-4 py-4 md:py-6">
        <div className="flex items-center justify-between mb-3 md:mb-4">
          <h3 className="font-bold text-base md:text-lg">Filters</h3>
          <button onClick={onClose} className="p-2 hover:bg-muted rounded-lg transition-colors">
            <X className="w-4 h-4 md:w-5 md:h-5" />
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 md:gap-4">
          {/* Sub-channels */}
          {channel.subChannels && channel.subChannels.length > 1 && (
            <div>
              <label className="text-xs md:text-sm font-semibold text-muted-foreground mb-2 block">Topic</label>
              <div className="relative">
                <select
                  value={selectedSubChannel}
                  onChange={(e) => onSubChannelChange(e.target.value)}
                  className="w-full px-4 py-3 bg-background border border-border/60 rounded-2xl text-sm text-foreground focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary/30 transition-all appearance-none cursor-pointer"
                >
                  {channel.subChannels.map((sc: any) => (
                    <option key={sc.id} value={sc.id}>{sc.name}</option>
                  ))}
                </select>
                <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
              </div>
            </div>
          )}

          {/* Difficulty */}
          <div>
            <label className="text-xs md:text-sm font-semibold text-muted-foreground mb-2 block">Difficulty</label>
            <div className="relative">
              <select
                value={selectedDifficulty}
                onChange={(e) => onDifficultyChange(e.target.value)}
                className="w-full px-4 py-3 bg-background border border-border/60 rounded-2xl text-sm text-foreground focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary/30 transition-all appearance-none cursor-pointer"
              >
                <option value="all">All Levels</option>
                <option value="beginner">Beginner</option>
                <option value="intermediate">Intermediate</option>
                <option value="advanced">Advanced</option>
              </select>
              <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
            </div>
          </div>

          {/* Company */}
          {companiesWithCounts.length > 0 && (
            <div>
              <label className="text-xs md:text-sm font-semibold text-muted-foreground mb-2 block">Company</label>
              <div className="relative">
                <select
                  value={selectedCompany}
                  onChange={(e) => onCompanyChange(e.target.value)}
                  className="w-full px-4 py-3 bg-background border border-border/60 rounded-2xl text-sm text-foreground focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary/30 transition-all appearance-none cursor-pointer"
                >
                  <option value="all">All Companies</option>
                  {companiesWithCounts.map((c: any) => (
                    <option key={c.company} value={c.company}>
                      {c.company} ({c.count})
                    </option>
                  ))}
                </select>
                <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
              </div>
            </div>
          )}
        </div>
      </div>
    </motion.div>
  );
}

// Question Content
function QuestionContent({ question, questionNumber, totalQuestions, isMarked, isCompleted, srsCard, showRatingButtons, hasRated, onAddToSRS, onSRSRating, onToggleMark, onShare }: any) {
  return (
    <div className="space-y-4">
      {/* Badges row */}
      <div className="flex items-center gap-2 flex-wrap">
        {question.subChannel && (
          <span className="px-3 py-1 bg-primary/10 border border-primary/20 rounded-full text-xs font-semibold text-primary">
            {question.subChannel.split('-').map((w: string) => w.charAt(0).toUpperCase() + w.slice(1)).join(' ')}
          </span>
        )}
        {question.difficulty && (
          <span className={`px-3 py-1 rounded-full text-xs font-bold border ${
            question.difficulty === 'advanced' ? 'bg-red-500/15 border-red-500/30 text-red-400'
            : question.difficulty === 'intermediate' ? 'bg-amber-500/15 border-amber-500/30 text-amber-400'
            : 'bg-emerald-500/15 border-emerald-500/30 text-emerald-400'
          }`}>
            {question.difficulty.charAt(0).toUpperCase() + question.difficulty.slice(1)}
          </span>
        )}
        {question.company && (
          <span className="px-3 py-1 bg-muted/60 border border-border rounded-full text-xs font-semibold text-muted-foreground">
            {question.company}
          </span>
        )}
        {isCompleted && (
          <span className="px-3 py-1 bg-emerald-500/15 border border-emerald-500/30 rounded-full text-xs font-bold text-emerald-400">✓ Done</span>
        )}
      </div>

      {/* Question card — premium glassmorphism */}
      <div className="relative">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/20 via-cyan-500/10 to-purple-500/10 rounded-3xl blur-xl" />
        <div className="relative rounded-3xl border border-primary/20 bg-card/80 backdrop-blur-sm p-6 md:p-8 shadow-2xl">
          <div className="flex items-start justify-between gap-3 mb-1">
            <span className="text-xs font-mono text-muted-foreground/60 tabular-nums">{questionNumber} / {totalQuestions}</span>
            <div className="flex gap-1.5">
              <motion.button onClick={onToggleMark} whileTap={{ scale: 0.9 }}
                className={`p-2 rounded-xl transition-all ${
                  isMarked ? 'bg-amber-500/20 text-amber-400' : 'bg-muted/50 text-muted-foreground hover:text-amber-400'
                }`}>
                <Bookmark className={`w-4 h-4 ${isMarked ? 'fill-current' : ''}`} />
              </motion.button>
              {onShare && (
                <motion.button onClick={onShare} whileTap={{ scale: 0.9 }}
                  className="p-2 rounded-xl bg-muted/50 text-muted-foreground hover:text-foreground transition-all">
                  <Share2 className="w-4 h-4" />
                </motion.button>
              )}
            </div>
          </div>
          <h2 className="text-xl md:text-2xl lg:text-3xl font-bold leading-snug tracking-tight text-foreground mt-3">
            {question.question}
          </h2>
          {question.tags && question.tags.length > 0 && (
            <div className="flex flex-wrap gap-1.5 mt-4">
              {question.tags.slice(0, 5).map((tag: string) => (
                <span key={tag} className="px-2 py-0.5 bg-muted/40 rounded-full text-xs text-muted-foreground/70">#{tag}</span>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* SRS controls */}
      {hasRated ? (
        <div className="flex items-center gap-2 px-4 py-2.5 bg-emerald-500/10 border border-emerald-500/20 rounded-2xl">
          <Check className="w-4 h-4 text-emerald-400" />
          <span className="text-sm font-semibold text-emerald-400">Review recorded</span>
        </div>
      ) : showRatingButtons && srsCard ? (
        <div className="space-y-2">
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">How well did you know this?</p>
          <div className="grid grid-cols-4 gap-2">
            {(['again', 'hard', 'good', 'easy'] as ConfidenceRating[]).map((rating) => {
              const cfg: Record<string, { cls: string; icon: React.ReactNode; label: string }> = {
                again: { cls: 'bg-red-500/15 border-red-500/30 text-red-400 hover:bg-red-500/25', icon: <RotateCcw className="w-3.5 h-3.5" />, label: 'Again' },
                hard:  { cls: 'bg-orange-500/15 border-orange-500/30 text-orange-400 hover:bg-orange-500/25', icon: <Brain className="w-3.5 h-3.5" />, label: 'Hard' },
                good:  { cls: 'bg-emerald-500/15 border-emerald-500/30 text-emerald-400 hover:bg-emerald-500/25', icon: <Check className="w-3.5 h-3.5" />, label: 'Good' },
                easy:  { cls: 'bg-blue-500/15 border-blue-500/30 text-blue-400 hover:bg-blue-500/25', icon: <Zap className="w-3.5 h-3.5" />, label: 'Easy' },
              };
              return (
                <motion.button key={rating} onClick={() => onSRSRating(rating)}
                  whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.95 }}
                  className={`flex flex-col items-center gap-1 py-3 border rounded-2xl text-xs font-bold transition-all ${cfg[rating].cls}`}>
                  {cfg[rating].icon}
                  {cfg[rating].label}
                </motion.button>
              );
            })}
          </div>
        </div>
      ) : (
        <motion.button onClick={onAddToSRS} whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.97 }}
          className="flex items-center gap-2 px-4 py-2.5 bg-purple-500/10 border border-purple-500/20 rounded-2xl text-sm font-semibold text-purple-400 hover:bg-purple-500/20 transition-all">
          <Brain className="w-4 h-4" />
          Add to Spaced Repetition
        </motion.button>
      )}

      <QuestionFeedback questionId={question.id} />
    </div>
  );
}



