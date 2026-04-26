import { useState, useEffect } from 'react';
import { useLocation, useRoute } from 'wouter';
import { motion, AnimatePresence, useMotionValue, useTransform, type PanInfo } from 'framer-motion';
import { getChannel } from '../lib/data';
import { useQuestionsWithPrefetch, useSubChannels, useCompaniesWithCounts } from '../hooks/use-questions';
import { useProgress, trackActivity } from '../hooks/use-progress';
import { useUserPreferences } from '../context/UserPreferencesContext';
import { useCredits } from '../context/CreditsContext';
import { useAchievementContext } from '../context/AchievementContext';
import { SEOHead } from '../components/SEOHead';
import { AppLayout } from '../components/layout/AppLayout';
import { UnifiedSearch } from '../components/UnifiedSearch';
import { VoiceReminder } from '../components/VoiceReminder';
import { AnswerPanel } from '../components/question/AnswerPanel';
import { RecallGate } from '../components/question/RecallGate';
import { QuestionFeedback } from '../components/QuestionFeedback';
import { AICompanion } from '../components/AICompanion';
import { SwipeHint } from '../components/mobile/SwipeHint';
import { Haptics } from '../lib/haptics';
import { trackQuestionView } from '../hooks/use-analytics';
import { trackSwipeNavigation, trackHapticFeedback } from '../lib/analytics';
import { useUnifiedToast } from '../hooks/use-unified-toast';
import {
  getCard, recordReview, addToSRS,
  getMasteryLabel,
  type ReviewCard, type ConfidenceRating
} from '../lib/spaced-repetition';
import {
  ChevronLeft, ChevronRight, Search, X, Bookmark, Share2,
  Filter, Brain, RotateCcw, Check, Zap, Eye, BookOpen, ChevronDown
} from 'lucide-react';

export default function QuestionViewer() {
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
        name: sc.split('-').map((w: string) => w.charAt(0).toUpperCase() + w.slice(1)).join(' ')
      }))
    ]
  } : null;

  const [selectedSubChannel, setSelectedSubChannel] = useState('all');
  const [selectedDifficulty, setSelectedDifficulty] = useState('all');
  const [selectedCompany, setSelectedCompany] = useState('all');
  const [currentIndex, setCurrentIndex] = useState(0);
  const [showSearchModal, setShowSearchModal] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  const [showAnswer, setShowAnswer] = useState(false);
  const [isInitialized, setIsInitialized] = useState(false);
  const [recallMode, setRecallMode] = useState<boolean>(() => {
    const stored = localStorage.getItem('open-interview-recall-mode');
    return stored === null ? true : stored === 'true';
  });
  const [recallRevealed, setRecallRevealed] = useState(false);
  const [markedQuestions, setMarkedQuestions] = useState<string[]>(() => {
    const saved = localStorage.getItem(`marked-${channelId}`);
    return saved ? JSON.parse(saved) : [];
  });
  const [srsCard, setSrsCard] = useState<ReviewCard | null>(null);
  const [showRatingButtons, setShowRatingButtons] = useState(false);
  const [hasRated, setHasRated] = useState(false);

  const x = useMotionValue(0);
  const opacity = useTransform(x, [-200, 0, 200], [0.6, 1, 0.6]);

  const { companiesWithCounts } = useCompaniesWithCounts(channelId || '', selectedSubChannel, selectedDifficulty);
  const { preferences, isSubscribed, subscribeChannel } = useUserPreferences();
  const shuffleEnabled = preferences.shuffleQuestions !== false;
  const prioritizeUnvisited = preferences.prioritizeUnvisited !== false;
  const { onQuestionSwipe, onQuestionView } = useCredits();
  const { trackEvent } = useAchievementContext();
  const { completed, markCompleted, saveLastVisitedIndex } = useProgress(channelId || '');
  const { toast } = useUnifiedToast();

  const { question: currentQuestion, questions, totalQuestions, loading, error } = useQuestionsWithPrefetch(
    channelId || '', currentIndex, selectedSubChannel, selectedDifficulty, selectedCompany, shuffleEnabled, prioritizeUnvisited
  );

  useEffect(() => {
    if (!currentQuestion) return;
    setSrsCard(getCard(currentQuestion.id, currentQuestion.channel, currentQuestion.difficulty));
    setShowRatingButtons(false);
    setHasRated(false);
    setShowAnswer(false);
    setRecallRevealed(false);
  }, [currentQuestion]);

  useEffect(() => {
    localStorage.setItem('open-interview-recall-mode', String(recallMode));
  }, [recallMode]);

  useEffect(() => {
    if (loading || questions.length === 0) return;
    if (targetQuestionId) {
      const foundIndex = questions.findIndex(q => q.id === targetQuestionId);
      if (foundIndex >= 0 && foundIndex !== currentIndex) setCurrentIndex(foundIndex);
      if (questionIdFromSearch) setLocation(`/channel/${channelId}/${targetQuestionId}`, { replace: true });
      setIsInitialized(true);
    } else if (questions[0] && !isInitialized) {
      setLocation(`/channel/${channelId}/${questions[0].id}`, { replace: true });
      setIsInitialized(true);
    }
  }, [targetQuestionId, questions.length, channelId, loading, questionIdFromSearch]);

  useEffect(() => {
    if (channelId && channel && !isSubscribed(channelId) && !loading && totalQuestions > 0 && questions.length > 0) {
      subscribeChannel(channelId);
      toast({ title: 'Channel added', description: `${channel.name} added to your channels` });
    }
  }, [channelId, channel, loading, totalQuestions, questions.length]);

  useEffect(() => {
    if (totalQuestions > 0 && currentIndex >= totalQuestions) setCurrentIndex(0);
  }, [totalQuestions, currentIndex]);

  useEffect(() => {
    if (!isInitialized || loading || !channelId || !currentQuestion) return;
    if (currentQuestion.id !== targetQuestionId) setLocation(`/channel/${channelId}/${currentQuestion.id}`, { replace: true });
    saveLastVisitedIndex(currentIndex);
  }, [currentIndex, isInitialized]);

  useEffect(() => {
    if (!currentQuestion) return;
    trackQuestionView(currentQuestion.id, currentQuestion.channel, currentQuestion.difficulty);
    markCompleted(currentQuestion.id);
    trackActivity();
    trackEvent({ type: 'question_completed', timestamp: new Date().toISOString(), data: { questionId: currentQuestion.id, difficulty: currentQuestion.difficulty, channel: currentQuestion.channel } });
  }, [currentQuestion?.id]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') { e.preventDefault(); setShowSearchModal(true); return; }
      if (showSearchModal) return;
      if (e.key === 'ArrowRight' || e.key === 'ArrowDown') { e.preventDefault(); nextQuestion(); }
      else if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') { e.preventDefault(); prevQuestion(); }
      else if ((e.key === ' ' || e.key === 'Enter') && (e.target as HTMLElement).tagName !== 'BUTTON' && (e.target as HTMLElement).tagName !== 'INPUT') { e.preventDefault(); setShowAnswer(true); }
      else if (e.key === 'Escape') { if (showAnswer) setShowAnswer(false); else setLocation('/channels'); }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [currentIndex, totalQuestions, showSearchModal, showAnswer]);

  const nextQuestion = () => {
    if (currentIndex < totalQuestions - 1) {
      setCurrentIndex(p => p + 1);
      setShowAnswer(false);
      onQuestionSwipe();
      onQuestionView();
    }
  };

  const prevQuestion = () => {
    if (currentIndex > 0) { setCurrentIndex(p => p - 1); setShowAnswer(false); }
  };

  const toggleMark = () => {
    if (!currentQuestion) return;
    setMarkedQuestions(prev => {
      const next = prev.includes(currentQuestion.id) ? prev.filter(id => id !== currentQuestion.id) : [...prev, currentQuestion.id];
      localStorage.setItem(`marked-${channelId}`, JSON.stringify(next));
      return next;
    });
  };

  const handleShare = async () => {
    try {
      await navigator.clipboard.writeText(window.location.href);
      toast({ title: 'Link copied!', description: 'Question link copied to clipboard' });
    } catch {
      toast({ title: 'Share', description: window.location.href });
    }
  };

  const handleAddToSRS = () => {
    if (!currentQuestion) return;
    setSrsCard(addToSRS(currentQuestion.id, currentQuestion.channel, currentQuestion.difficulty));
    setShowRatingButtons(true);
    toast({ title: 'Added to SRS', description: 'Question added to spaced repetition system' });
  };

  const handleSRSRating = (rating: ConfidenceRating) => {
    if (!srsCard || !currentQuestion) return;
    const updated = recordReview(currentQuestion.id, currentQuestion.channel, currentQuestion.difficulty, rating);
    setSrsCard(updated);
    setHasRated(true);
    setShowRatingButtons(false);
    trackEvent({ type: 'srs_review', timestamp: new Date().toISOString(), data: { rating } });
    toast({ title: 'Review recorded', description: `Mastery: ${getMasteryLabel(updated.masteryLevel)}` });
  };

  const handleDragEnd = (_e: MouseEvent | TouchEvent | PointerEvent, info: PanInfo) => {
    const threshold = 100;
    if (info.offset.x < -threshold || info.velocity.x < -500) {
      Haptics.medium();
      trackHapticFeedback('medium', 'swipe_navigation_left');
      trackSwipeNavigation(window.location.pathname, 'left', currentQuestion?.id, questions[currentIndex + 1]?.id, Math.abs(info.velocity.x));
      setTimeout(() => { nextQuestion(); x.set(0); }, 150);
    } else if (info.offset.x > threshold || info.velocity.x > 500) {
      Haptics.medium();
      trackHapticFeedback('medium', 'swipe_navigation_right');
      trackSwipeNavigation(window.location.pathname, 'right', currentQuestion?.id, questions[currentIndex - 1]?.id, Math.abs(info.velocity.x));
      setTimeout(() => { prevQuestion(); x.set(0); }, 150);
    } else {
      x.set(0);
    }
  };

  // --- Loading / error states ---
  if (loading && questions.length === 0) {
    return (
      <AppLayout fullWidth>
        <div className="min-h-screen bg-background flex flex-col gap-6 p-6 max-w-3xl mx-auto w-full pt-16">
          <div className="h-5 w-32 bg-muted rounded animate-pulse" />
          <div className="h-40 bg-muted/50 rounded-2xl animate-pulse" />
          <div className="h-4 w-2/3 bg-muted/40 rounded animate-pulse" />
          <div className="h-4 w-1/2 bg-muted/40 rounded animate-pulse" />
        </div>
      </AppLayout>
    );
  }

  if (error || !channel) {
    return (
      <AppLayout fullWidth>
        <div className="min-h-screen bg-background flex flex-col items-center justify-center gap-4 px-4 text-center">
          <X className="w-10 h-10 text-muted-foreground" />
          <h2 className="text-xl font-bold">Channel not found</h2>
          <button onClick={() => setLocation('/channels')} className="cursor-pointer flex items-center gap-2 px-5 min-h-[44px] bg-primary text-primary-foreground font-semibold rounded-full text-sm transition-opacity duration-150 ease-out hover:opacity-90">
            <ChevronLeft className="w-4 h-4" /> Back to Channels
          </button>
        </div>
      </AppLayout>
    );
  }

  if (!loading && (!currentQuestion || totalQuestions === 0)) {
    const hasFilters = selectedSubChannel !== 'all' || selectedDifficulty !== 'all' || selectedCompany !== 'all';
    return (
      <AppLayout fullWidth>
        <div className="min-h-screen bg-background flex flex-col items-center justify-center gap-4 px-4 text-center">
          <BookOpen className="w-10 h-10 text-muted-foreground/50" />
          <h2 className="text-xl font-bold">No questions found</h2>
          <p className="text-sm text-muted-foreground">{hasFilters ? 'Try adjusting your filters.' : 'Check back soon!'}</p>
          <div className="flex gap-2">
            {hasFilters && (
              <button onClick={() => { setSelectedSubChannel('all'); setSelectedDifficulty('all'); setSelectedCompany('all'); }}
                className="cursor-pointer flex items-center gap-2 px-5 min-h-[44px] bg-primary text-primary-foreground font-semibold rounded-full text-sm transition-opacity duration-150 ease-out hover:opacity-90">
                <X className="w-4 h-4" /> Clear filters
              </button>
            )}
            <button onClick={() => setLocation('/channels')} className="cursor-pointer flex items-center gap-2 px-5 min-h-[44px] bg-muted font-semibold rounded-full text-sm transition-colors duration-150 ease-out hover:bg-muted/80">
              <ChevronLeft className="w-4 h-4" /> Back
            </button>
          </div>
        </div>
      </AppLayout>
    );
  }

  if (!currentQuestion) return null;

  const isMarked = markedQuestions.includes(currentQuestion.id);
  const isCompleted = completed.includes(currentQuestion.id);
  const progress = Math.round(((currentIndex + 1) / totalQuestions) * 100);
  const hasFilters = selectedSubChannel !== 'all' || selectedDifficulty !== 'all' || selectedCompany !== 'all';

  return (
    <>
      <AppLayout fullWidth>
        <SEOHead
          title={currentQuestion ? `${currentQuestion.question.slice(0, 60)} | Code Reels` : 'Questions | Code Reels'}
          description={currentQuestion?.tldr ?? currentQuestion?.answer?.slice(0, 160) ?? 'Practice technical interview questions'}
          canonical={`https://open-interview.github.io/channel/${channelId}/${currentQuestion.id}`}
        />
        <div className="min-h-screen bg-background text-foreground flex flex-col">

          {/* Top progress bar */}
          <div className="h-0.5 bg-border w-full flex-shrink-0">
            <motion.div className="h-full bg-primary" animate={{ width: `${progress}%` }} transition={{ duration: 0.3 }} />
          </div>

          {/* Toolbar */}
          <div className="border-b border-border bg-background flex-shrink-0">
            <div className="max-w-4xl mx-auto px-4 h-12 flex items-center justify-between gap-3">
              {/* Left: back + channel name */}
              <div className="flex items-center gap-2 min-w-0">
                <button onClick={() => setLocation('/channels')} className="cursor-pointer p-1.5 min-h-[44px] min-w-[44px] flex items-center justify-center rounded-md hover:bg-muted transition-colors duration-150 ease-out flex-shrink-0" aria-label="Back">
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <span className="font-semibold text-sm truncate">{channel.name}</span>
                <span className="text-xs text-muted-foreground tabular-nums flex-shrink-0">{currentIndex + 1}/{totalQuestions}</span>
              </div>
              {/* Right: actions */}
              <div className="flex items-center gap-1 flex-shrink-0">
                {/* Recall Mode toggle */}
                <button
                  onClick={() => setRecallMode(v => !v)}
                  aria-label={recallMode ? 'Recall mode on' : 'Recall mode off'}
                  title={recallMode ? 'Recall Mode: ON — click to disable' : 'Recall Mode: OFF — click to enable'}
                  className={`cursor-pointer flex items-center gap-1 px-2 min-h-[44px] rounded-md text-xs font-semibold transition-colors duration-150 ease-out ${recallMode ? 'text-primary bg-primary/10' : 'text-muted-foreground hover:bg-muted'}`}>
                  <Brain className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">Recall</span>
                </button>
                <button onClick={() => setShowFilters(v => !v)} aria-label="Filters"
                  className={`cursor-pointer p-1.5 min-h-[44px] min-w-[44px] flex items-center justify-center rounded-md transition-colors duration-150 ease-out ${hasFilters ? 'text-primary bg-primary/10' : 'hover:bg-muted'}`}>
                  <Filter className="w-4 h-4" />
                </button>
                <button onClick={() => setShowSearchModal(true)} aria-label="Search" className="cursor-pointer p-1.5 min-h-[44px] min-w-[44px] flex items-center justify-center rounded-md hover:bg-muted transition-colors duration-150 ease-out">
                  <Search className="w-4 h-4" />
                </button>
                <button onClick={toggleMark} aria-label="Bookmark"
                  data-testid="button-bookmark"
                  className={`cursor-pointer p-1.5 min-h-[44px] min-w-[44px] flex items-center justify-center rounded-md transition-colors duration-150 ease-out ${isMarked ? 'text-amber-500' : 'hover:bg-muted'}`}>
                  <Bookmark className="w-4 h-4" fill={isMarked ? 'currentColor' : 'none'} />
                </button>
                <button onClick={handleShare} aria-label="Share" data-testid="button-share" className="cursor-pointer p-1.5 min-h-[44px] min-w-[44px] flex items-center justify-center rounded-md hover:bg-muted transition-colors duration-150 ease-out hidden sm:flex">
                  <Share2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>

          {/* Filters drawer */}
          <AnimatePresence>
            {showFilters && (
              <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }}
                className="border-b border-border bg-muted/30 overflow-hidden flex-shrink-0">
                <div className="max-w-4xl mx-auto px-4 py-3 flex flex-wrap gap-3 items-end">
                  {channel.subChannels && channel.subChannels.length > 1 && (
                    <FilterSelect label="Topic" value={selectedSubChannel} onChange={v => { setSelectedSubChannel(v); setCurrentIndex(0); }}>
                      {channel.subChannels.map((sc: any) => <option key={sc.id} value={sc.id}>{sc.name}</option>)}
                    </FilterSelect>
                  )}
                  <FilterSelect label="Difficulty" value={selectedDifficulty} onChange={v => { setSelectedDifficulty(v); setCurrentIndex(0); }}>
                    <option value="all">All levels</option>
                    <option value="beginner">Beginner</option>
                    <option value="intermediate">Intermediate</option>
                    <option value="advanced">Advanced</option>
                  </FilterSelect>
                  {companiesWithCounts.length > 0 && (
                    <FilterSelect label="Company" value={selectedCompany} onChange={v => { setSelectedCompany(v); setCurrentIndex(0); }}>
                      <option value="all">All companies</option>
                      {companiesWithCounts.map((c: any) => <option key={c.company} value={c.company}>{c.company} ({c.count})</option>)}
                    </FilterSelect>
                  )}
                  <button onClick={() => setShowFilters(false)} className="cursor-pointer p-1.5 min-h-[44px] min-w-[44px] flex items-center justify-center rounded-md hover:bg-muted transition-colors duration-150 ease-out ml-auto">
                    <X className="w-4 h-4" />
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Main scrollable content */}
          <motion.div drag="x" dragConstraints={{ left: 0, right: 0 }} dragElastic={0.1} style={{ x, opacity }}
            onDragEnd={handleDragEnd} className="flex-1 overflow-y-auto">
            <div className="max-w-4xl mx-auto px-4 py-8 lg:py-12" data-testid="question-card" style={{ background: 'linear-gradient(145deg, var(--card), var(--card))', borderRadius: 24, boxShadow: '20px 20px 60px rgba(0,0,0,0.25), -10px -10px 40px rgba(255,255,255,0.03), inset 0 1px 0 rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.06)' }}>

              {/* Meta row */}
              <div className="flex items-center gap-2 flex-wrap mb-6">
                {currentQuestion.difficulty && (
                  <span className={`text-xs font-semibold px-2.5 py-1 rounded-full border ${
                    currentQuestion.difficulty === 'advanced' ? 'border-red-500/40 text-red-500 bg-red-500/8'
                    : currentQuestion.difficulty === 'intermediate' ? 'border-amber-500/40 text-amber-500 bg-amber-500/8'
                    : 'border-emerald-500/40 text-emerald-600 bg-emerald-500/8'
                  }`}>
                    {currentQuestion.difficulty.charAt(0).toUpperCase() + currentQuestion.difficulty.slice(1)}
                  </span>
                )}
                {currentQuestion.subChannel && (
                  <span className="text-xs font-medium px-2.5 py-1 rounded-full border border-border text-muted-foreground">
                    {currentQuestion.subChannel.split('-').map((w: string) => w.charAt(0).toUpperCase() + w.slice(1)).join(' ')}
                  </span>
                )}
                {currentQuestion.companies?.[0] && (
                  <span className="text-xs font-medium px-2.5 py-1 rounded-full border border-border text-muted-foreground">
                    {currentQuestion.companies[0]}
                  </span>
                )}
                {isCompleted && (
                  <span className="text-xs font-semibold px-2.5 py-1 rounded-full border border-emerald-500/40 text-emerald-600 bg-emerald-500/8 flex items-center gap-1">
                    <Check className="w-3 h-3" /> Done
                  </span>
                )}
              </div>

              {/* Question */}
              <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold leading-tight tracking-tight text-foreground mb-8">
                {currentQuestion.question}
              </h1>

              {/* Tags */}
              {currentQuestion.tags && currentQuestion.tags.length > 0 && (
                <div className="flex flex-wrap gap-1.5 mb-8">
                  {currentQuestion.tags.slice(0, 6).map((tag: string) => (
                    <span key={tag} className="text-xs text-muted-foreground/60 font-mono">#{tag}</span>
                  ))}
                </div>
              )}

              {/* SRS / feedback row */}
              <div className="flex items-center gap-3 mb-10 flex-wrap">
                {hasRated ? (
                  <span className="flex items-center gap-1.5 text-sm text-emerald-600 font-medium">
                    <Check className="w-4 h-4" /> Review recorded
                  </span>
                ) : showRatingButtons && srsCard ? (
                  <div className="flex gap-2">
                    {(['again', 'hard', 'good', 'easy'] as ConfidenceRating[]).map(r => {
                      const cfg: Record<string, { bg: string; glow: string; text: string; border: string }> = {
                        again: { bg: 'linear-gradient(145deg, #fee2e2, #fecaca)', glow: '0 4px 16px rgba(239,68,68,0.3)', text: '#dc2626', border: 'rgba(239,68,68,0.4)' },
                        hard: { bg: 'linear-gradient(145deg, #fef3c7, #fde68a)', glow: '0 4px 16px rgba(245,158,11,0.3)', text: '#d97706', border: 'rgba(245,158,11,0.4)' },
                        good: { bg: 'linear-gradient(145deg, #d1fae5, #a7f3d0)', glow: '0 4px 16px rgba(16,185,129,0.3)', text: '#059669', border: 'rgba(16,185,129,0.4)' },
                        easy: { bg: 'linear-gradient(145deg, #dbeafe, #bfdbfe)', glow: '0 4px 16px rgba(59,130,246,0.3)', text: '#2563eb', border: 'rgba(59,130,246,0.4)' }
                      };
                      const testIds: Record<string, string> = { hard: 'srs-button-hard', good: 'srs-button-good', easy: 'srs-button-easy' };
                      const style = cfg[r];
                      return (
                        <motion.button key={r} onClick={() => handleSRSRating(r)}
                          whileHover={{ scale: 1.05, y: -2 }}
                          whileTap={{ scale: 0.95 }}
                          {...(testIds[r] ? { 'data-testid': testIds[r] } : {})}
                          className={`cursor-pointer px-3 min-h-[44px] text-xs font-semibold border rounded-full capitalize`}
                          style={{ background: style.bg, color: style.text, borderColor: style.border, boxShadow: style.glow, transition: 'all 0.2s ease-out' }}>
                          {r}
                        </motion.button>
                      );
                    })}
                  </div>
                ) : (
                  <button onClick={handleAddToSRS}
                    className="cursor-pointer flex items-center gap-1.5 text-xs font-medium text-muted-foreground hover:text-foreground border border-border rounded-full px-3 min-h-[44px] transition-colors duration-150 ease-out">
                    <Brain className="w-3.5 h-3.5" /> Add to SRS
                  </button>
                )}
                <QuestionFeedback questionId={currentQuestion.id} />
              </div>

              {/* Answer section */}
              <div className="border-t border-border pt-8">
                {recallMode && !recallRevealed ? (
                  <RecallGate onReveal={() => { setRecallRevealed(true); setShowAnswer(true); }} />
                ) : (
                  <>
                    {/* Mobile: hide toggle (only when recall mode is off or already revealed) */}
                    {!recallMode && (
                      <div className="lg:hidden mb-6">
                        {!showAnswer ? (
                          <button onClick={() => setShowAnswer(true)}
                            data-testid="button-reveal-answer"
                            className="cursor-pointer w-full flex items-center justify-center gap-2 min-h-[44px] font-semibold rounded-xl text-sm transition-all duration-200 ease-out hover:scale-[1.02] active:scale-[0.98]"
                            style={{ background: 'linear-gradient(135deg, #8b5cf6, #6366f1)', color: '#fff', boxShadow: '0 4px 16px rgba(99,102,241,0.35), inset 0 1px 0 rgba(255,255,255,0.2)' }}>
                            <Eye className="w-4 h-4" /> Show Answer
                          </button>
                        ) : (
                          <button onClick={() => setShowAnswer(false)}
                            className="cursor-pointer flex items-center gap-1.5 min-h-[44px] text-sm text-muted-foreground hover:text-foreground transition-colors duration-150 ease-out">
                            <ChevronDown className="w-4 h-4" /> Hide answer
                          </button>
                        )}
                      </div>
                    )}
                    <div className={`lg:block ${showAnswer || recallRevealed ? 'block' : 'hidden'}`}>
                      <AnswerPanel
                        question={currentQuestion}
                        isCompleted={isCompleted}
                      />
                    </div>
                  </>
                )}
              </div>
            </div>
          </motion.div>

          {/* Bottom nav bar */}
          <div className="border-t border-border bg-background flex-shrink-0 pb-24">
            <div className="max-w-4xl mx-auto px-4 h-14 flex items-center justify-between">
              <button onClick={prevQuestion} disabled={currentIndex === 0}
                className="cursor-pointer flex items-center gap-1.5 min-h-[44px] px-2 text-sm font-medium text-muted-foreground hover:text-foreground disabled:opacity-30 disabled:cursor-not-allowed transition-colors duration-150 ease-out">
                <ChevronLeft className="w-4 h-4" /> Prev
              </button>
              <div className="flex items-center gap-2">
                <div className="w-32 h-1 bg-border rounded-full overflow-hidden">
                  <motion.div className="h-full bg-primary rounded-full" animate={{ width: `${progress}%` }} transition={{ duration: 0.3 }} />
                </div>
                <span className="text-xs text-muted-foreground tabular-nums">{progress}%</span>
              </div>
              <button onClick={nextQuestion} disabled={currentIndex === totalQuestions - 1}
                className="cursor-pointer flex items-center gap-1.5 min-h-[44px] px-2 text-sm font-medium text-muted-foreground hover:text-foreground disabled:opacity-30 disabled:cursor-not-allowed transition-colors duration-150 ease-out">
                Next <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      </AppLayout>

      <SwipeHint />
      <UnifiedSearch isOpen={showSearchModal} onClose={() => setShowSearchModal(false)} />
      <VoiceReminder />
      <AICompanion
        pageContent={{ type: 'question', title: channel.name, question: currentQuestion.question, answer: currentQuestion.answer, explanation: currentQuestion.explanation, tags: currentQuestion.tags, difficulty: currentQuestion.difficulty }}
        onNavigate={setLocation}
        onAction={(action, data) => {
          if (action === 'nextQuestion') nextQuestion();
          else if (action === 'previousQuestion') prevQuestion();
          else if (action === 'showAnswer') setShowAnswer(true);
          else if (action === 'hideAnswer') setShowAnswer(false);
          else if (action === 'bookmark') toggleMark();
          else if (action === 'addToSRS') handleAddToSRS();
          else if (action === 'share') handleShare();
          else if (action === 'showSearch') setShowSearchModal(true);
          else if (action === 'filterByDifficulty' && data?.difficulty) setSelectedDifficulty(data.difficulty);
          else if (action === 'filterBySubChannel' && data?.subChannel) setSelectedSubChannel(data.subChannel);
          else if (action === 'clearFilters') { setSelectedDifficulty('all'); setSelectedSubChannel('all'); }
        }}
        availableActions={['nextQuestion','previousQuestion','showAnswer','hideAnswer','bookmark','addToSRS','share','showSearch','filterByDifficulty','filterBySubChannel','clearFilters']}
      />
    </>
  );
}

function FilterSelect({ label, value, onChange, children }: { label: string; value: string; onChange: (v: string) => void; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-1">
      <label className="text-xs font-medium text-muted-foreground">{label}</label>
      <div className="relative">
        <select value={value} onChange={e => onChange(e.target.value)}
          className="appearance-none bg-background border border-border rounded-lg px-3 py-1.5 pr-7 min-h-[44px] text-sm focus:outline-none focus:border-primary transition-colors duration-150 ease-out cursor-pointer">
          {children}
        </select>
        <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground pointer-events-none" />
      </div>
    </div>
  );
}
