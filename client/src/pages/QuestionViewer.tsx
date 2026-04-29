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
  Filter, Brain, RotateCcw, Check, Zap, Eye, BookOpen, ChevronDown,
  Lightbulb
} from 'lucide-react';
import {
  QuestionNumberBadge, CircularTimer, ConfidenceCircles, ProgressBarSVG,
  ResultIcon, StreakFlameSVG, PointsBadgeSVG, RevealOverlay
} from '../components/question/SvgComponents';

  const cardStyle: React.CSSProperties = {
    background: 'var(--surface-2)',
    boxShadow: '0 1px 3px rgba(0,0,0,0.12), 0 1px 2px rgba(0,0,0,0.08)',
    border: 'none',
    borderRadius: 12,
  };

  const chipStyle = (active: boolean): React.CSSProperties => ({
    display: 'inline-flex',
    alignItems: 'center',
    gap: 6,
    padding: '6px 12px',
    borderRadius: 16,
    fontSize: 13,
    fontWeight: 500,
    cursor: 'pointer',
    transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
    background: active ? '#1a73e8' : 'rgba(26,115,232,0.08)',
    color: active ? '#fff' : '#1a73e8',
    border: active ? 'none' : '1px solid rgba(26,115,232,0.2)',
    boxShadow: 'none',
  });

  const buttonStyle: React.CSSProperties = {
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    padding: '10px 24px',
    borderRadius: 8,
    fontSize: 14,
    fontWeight: 500,
    cursor: 'pointer',
    transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
    background: '#1a73e8',
    color: '#fff',
    border: 'none',
    boxShadow: '0 1px 2px rgba(0,0,0,0.1)',
  };

  const outlinedButtonStyle: React.CSSProperties = {
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    padding: '9px 20px',
    borderRadius: 20,
    fontSize: 14,
    fontWeight: 500,
    cursor: 'pointer',
    transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
    background: 'transparent',
    color: '#1a73e8',
    border: '1px solid #dadce0',
    boxShadow: 'none',
  };

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
  const [timer, setTimer] = useState(60);

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
    if (!currentQuestion) return;
    setTimer(60);
    const interval = setInterval(() => {
      setTimer(prev => Math.max(0, prev - 1));
    }, 1000);
    return () => clearInterval(interval);
  }, [currentQuestion?.id]);

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
          <div style={{ ...cardStyle, padding: 24 }}>
             <div style={{ width: '40%', height: 12, background: 'rgba(255,255,255,0.06)', borderRadius: 4, marginBottom: 16 }} />
             <div style={{ width: '80%', height: 20, background: 'rgba(255,255,255,0.06)', borderRadius: 4, marginBottom: 16 }} />
             <div style={{ width: '60%', height: 14, background: 'rgba(255,255,255,0.06)', borderRadius: 4 }} />
           </div>
          <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
             {[1,2,3,4].map(i => (
               <div key={i} style={{ width: 80, height: 32, background: 'rgba(255,255,255,0.06)', borderRadius: 16 }} />
             ))}
           </div>
        </div>
      </AppLayout>
    );
  }

  if (error || !channel) {
    return (
      <AppLayout fullWidth>
        <div className="min-h-screen bg-background flex flex-col items-center justify-center gap-4 px-4 text-center">
             <X className="w-10 h-10" style={{ color: '#5f6368' }} />
            <h2 className="text-2xl font-bold" style={{ color: 'var(--text-primary)' }}>Channel not found</h2>
           <button onClick={() => setLocation('/channels')} style={{ display: 'inline-flex', alignItems: 'center', gap: 8, padding: '10px 24px', borderRadius: 8, fontSize: 14, fontWeight: 500, cursor: 'pointer', background: '#1a73e8', color: '#fff', border: 'none', boxShadow: '0 1px 2px rgba(0,0,0,0.1)' }}>
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
             <BookOpen className="w-10 h-10" style={{ color: '#5f6368' }} />
            <h2 className="text-2xl font-bold" style={{ color: 'var(--text-primary)' }}>No questions found</h2>
            <p className="text-base" style={{ color: '#5f6368' }}>{hasFilters ? 'Try adjusting your filters.' : 'Check back soon!'}</p>
           <div className="flex gap-2">
             {hasFilters && (
              <button onClick={() => { setSelectedSubChannel('all'); setSelectedDifficulty('all'); setSelectedCompany('all'); }}
                  style={{ display: 'inline-flex', alignItems: 'center', gap: 8, padding: '10px 24px', borderRadius: 8, fontSize: 14, fontWeight: 500, cursor: 'pointer', background: '#1a73e8', color: '#fff', border: 'none', boxShadow: '0 1px 2px rgba(0,0,0,0.1)' }}>
                  <X className="w-4 h-4" /> Clear filters
                </button>
              )}
              <button onClick={() => setLocation('/channels')} style={{ display: 'inline-flex', alignItems: 'center', gap: 8, padding: '9px 20px', borderRadius: 20, fontSize: 14, fontWeight: 500, cursor: 'pointer', background: 'transparent', color: '#1a73e8', border: '1px solid #dadce0' }}>
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

          {/* Top progress bar - SVG gradient version */}
           <div style={{ height: 4, width: '100%', flexShrink: 0 }}>
             <ProgressBarSVG progress={progress} height={4} />
           </div>

           {/* Toolbar */}
            <div style={{ borderBottom: '1px solid rgba(255,255,255,0.08)', background: 'var(--surface-1)', flexShrink: 0 }}>
             <div className="max-w-4xl mx-auto px-4 h-14 flex items-center justify-between gap-3">
               {/* Left: back + channel name */}
                <div className="flex items-center gap-3 min-w-0">
                   <button onClick={() => setLocation('/channels')} className="cursor-pointer p-2 min-h-[40px] min-w-[40px] flex items-center justify-center rounded-full hover:bg-white/5 focus-visible:ring-2 focus-visible:ring-[#1a73e8] focus-visible:ring-offset-2 transition-all duration-150" aria-label="Back">
                     <ChevronLeft className="w-5 h-5" style={{ color: '#5f6368' }} />
                  </button>
                  <QuestionNumberBadge number={currentIndex} total={totalQuestions} />
                   <span style={{ fontWeight: 500, fontSize: 15, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', color: 'var(--text-primary)' }}>{channel.name}</span>
                  <CircularTimer seconds={timer} totalSeconds={60} />
                   <span style={{ fontSize: 13, color: '#5f6368', flexShrink: 0, fontVariantNumeric: 'tabular-nums' }}>{currentIndex + 1}/{totalQuestions}</span>
                </div>
               {/* Right: actions */}
                <div className="flex items-center gap-1 flex-shrink-0">
                  {/* Recall Mode toggle */}
                   <button
                     onClick={() => setRecallMode(v => !v)}
                     aria-label={recallMode ? 'Recall mode on' : 'Recall mode off'}
                     title={recallMode ? 'Recall Mode: ON — click to disable' : 'Recall Mode: OFF — click to enable'}
                     style={chipStyle(recallMode)}
                     className="focus-visible:ring-2 focus-visible:ring-[#1a73e8] focus-visible:ring-offset-2">
                    <Brain className="w-4 h-4" />
                    <span className="hidden sm:inline">Recall</span>
                  </button>
                  <StreakFlameSVG streak={completed.length} />
                   <button onClick={() => setShowFilters(v => !v)} aria-label="Filters"
                     style={chipStyle(hasFilters)}
                     className="focus-visible:ring-2 focus-visible:ring-[#1a73e8] focus-visible:ring-offset-2">
                    <Filter className="w-4 h-4" />
                  </button>
                   <button onClick={() => setShowSearchModal(true)} aria-label="Search" className="cursor-pointer p-2 min-h-[40px] min-w-[40px] flex items-center justify-center rounded-full hover:bg-white/5 focus-visible:ring-2 focus-visible:ring-[#1a73e8] focus-visible:ring-offset-2 transition-all duration-150">
                    <Search className="w-5 h-5" style={{ color: '#9AA0A6' }} />
                  </button>
                   <button onClick={toggleMark} aria-label="Bookmark"
                     data-testid="button-bookmark"
                     style={chipStyle(isMarked)}
                     className="focus-visible:ring-2 focus-visible:ring-[#1a73e8] focus-visible:ring-offset-2">
                    <Bookmark className="w-4 h-4" fill={isMarked ? 'currentColor' : 'none'} />
                  </button>
                   <button onClick={handleShare} aria-label="Share" data-testid="button-share" className="cursor-pointer p-2 min-h-[40px] min-w-[40px] flex items-center justify-center rounded-full hover:bg-white/5 focus-visible:ring-2 focus-visible:ring-[#1a73e8] focus-visible:ring-offset-2 transition-all duration-150 hidden sm:flex">
                    <Share2 className="w-4 h-4" style={{ color: '#5f6368' }} />
                  </button>
                </div>
             </div>
           </div>

           {/* Filters drawer */}
           <AnimatePresence>
             {showFilters && (
               <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }}
                 style={{ borderBottom: '1px solid rgba(255,255,255,0.08)', background: 'var(--surface-1)', overflow: 'hidden', flexShrink: 0 }}>
                 <div className="max-w-4xl mx-auto px-4 py-4 flex flex-wrap gap-3 items-end">
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
                   <button onClick={() => setShowFilters(false)} className="cursor-pointer p-2 min-h-[40px] min-w-[40px] flex items-center justify-center rounded-full hover:bg-white/5 focus-visible:ring-2 focus-visible:ring-[#1a73e8] focus-visible:ring-offset-2 transition-all duration-150 ml-auto">
                     <X className="w-4 h-4" style={{ color: '#5f6368' }} />
                   </button>
                 </div>
               </motion.div>
             )}
           </AnimatePresence>

          {/* Main scrollable content */}
          <motion.div drag="x" dragConstraints={{ left: 0, right: 0 }} dragElastic={0.1} style={{ x, opacity }}
            onDragEnd={handleDragEnd} className="flex-1 overflow-y-auto">
             <div className="max-w-3xl mx-auto px-4 py-8 lg:py-10 rounded-2xl" data-testid="question-card" style={cardStyle}>

               {/* Meta row - Google chips */}
               <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap', marginBottom: 20 }}>
                 {currentQuestion.difficulty && (
                    <span style={{
                      display: 'inline-flex', alignItems: 'center', gap: 6, padding: '4px 12px', borderRadius: 16, fontSize: 13, fontWeight: 500,
                      background: currentQuestion.difficulty === 'advanced' ? 'rgba(217,48,37,0.12)' : currentQuestion.difficulty === 'intermediate' ? 'rgba(249,171,0,0.12)' : 'rgba(52,168,83,0.12)',
                      color: currentQuestion.difficulty === 'advanced' ? '#d93025' : currentQuestion.difficulty === 'intermediate' ? '#f9ab00' : '#34a853',
                      border: `1px solid ${currentQuestion.difficulty === 'advanced' ? 'rgba(217,48,37,0.25)' : currentQuestion.difficulty === 'intermediate' ? 'rgba(249,171,0,0.25)' : 'rgba(52,168,83,0.25)'}`,
                    }}>
                      {currentQuestion.difficulty.charAt(0).toUpperCase() + currentQuestion.difficulty.slice(1)}
                    </span>
                  )}
                 {currentQuestion.subChannel && (
                   <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '4px 12px', borderRadius: 16, fontSize: 13, fontWeight: 500, background: 'rgba(26,115,232,0.08)', border: '1px solid rgba(26,115,232,0.2)', color: '#1a73e8' }}>
                     {currentQuestion.subChannel.split('-').map((w: string) => w.charAt(0).toUpperCase() + w.slice(1)).join(' ')}
                   </span>
                 )}
                 {currentQuestion.companies?.[0] && (
                    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '4px 12px', borderRadius: 16, fontSize: 13, fontWeight: 500, background: 'rgba(26,115,232,0.08)', border: '1px solid rgba(26,115,232,0.2)', color: '#1a73e8' }}>
                      {currentQuestion.companies[0]}
                    </span>
                  )}
                 {isCompleted && (
                    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '4px 12px', borderRadius: 16, fontSize: 13, fontWeight: 500, background: 'rgba(52,168,83,0.12)', border: '1px solid rgba(52,168,83,0.25)', color: '#34a853' }}>
                      <Check className="w-3.5 h-3.5" /> Done
                    </span>
                  )}
               </div>

               {/* Question */}
               <h1 style={{ fontSize: 'clamp(1.25rem, 4vw, 1.5rem)', fontWeight: 500, lineHeight: 1.4, letterSpacing: '0', marginBottom: 16, fontFamily: "'Google Sans Display', 'Roboto Flex', sans-serif" }}>
                 {currentQuestion.question}
               </h1>

                {/* Tags */}
                {currentQuestion.tags && currentQuestion.tags.length > 0 && (
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 24 }}>
                    {currentQuestion.tags.slice(0, 6).map((tag: string) => (
                      <span key={tag} style={{ fontSize: 12, color: '#5f6368', fontWeight: 500 }}>#{tag}</span>
                    ))}
                  </div>
                )}

               {/* SRS / feedback row */}
               <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap', marginBottom: 24 }}>
                  {hasRated ? (
                    <span style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 14, color: 'hsl(var(--success))', fontWeight: 500 }}>
                      <Check className="w-4 h-4" /> Review recorded
                     {srsCard && (
                       <ResultIcon correct={srsCard.masteryLevel > 0} size={28} />
                     )}
                   </span>
                 ) : showRatingButtons && srsCard ? (
                   <ConfidenceCircles
                     onSelect={handleSRSRating}
                   />
                 ) : (
                    <button onClick={handleAddToSRS}
                      style={chipStyle(false)}
                      className="focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2">
                     <Brain className="w-3.5 h-3.5" /> Add to SRS
                   </button>
                 )}
                 <QuestionFeedback questionId={currentQuestion.id} />
                 {hasRated && srsCard && (
                   <PointsBadgeSVG points={srsCard.masteryLevel * 10} />
                 )}
               </div>

                {/* Answer section */}
                <div style={{ borderTop: '1px solid rgba(255,255,255,0.08)', paddingTop: 24, marginTop: 8 }}>
                 {recallMode && !recallRevealed ? (
                   <RecallGate onReveal={() => { setRecallRevealed(true); setShowAnswer(true); }} />
                 ) : (
                   <>
                     {/* Mobile: hide toggle */}
                      {!recallMode && (
                        <div className="lg:hidden mb-6">
                          {!showAnswer ? (
                            <button onClick={() => setShowAnswer(true)}
                              data-testid="button-reveal-answer"
                              style={buttonStyle}
                              className="focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2">
                              <Eye className="w-4 h-4" /> Show Answer
                            </button>
                          ) : (
                            <button onClick={() => setShowAnswer(false)}
                              style={outlinedButtonStyle}
                              className="focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2">
                              <ChevronDown className="w-4 h-4" style={{ transform: 'rotate(180deg)' }} /> Hide answer
                            </button>
                          )}
                        </div>
                      )}
                     <RevealOverlay show={showAnswer || recallRevealed}>
                       <AnswerPanel
                         question={currentQuestion}
                         isCompleted={isCompleted}
                       />
                     </RevealOverlay>
                   </>
                 )}
               </div>
            </div>
          </motion.div>

           {/* Bottom nav bar */}
            <div style={{ borderTop: '1px solid rgba(255,255,255,0.08)', background: 'var(--surface-1)', paddingBottom: 'env(safe-area-inset-bottom, 20px)', flexShrink: 0 }}>
             <div className="max-w-4xl mx-auto px-4 h-16 flex items-center justify-between">
                <button onClick={prevQuestion} disabled={currentIndex === 0}
                  style={{
                    display: 'inline-flex', alignItems: 'center', gap: 8, padding: '8px 16px', borderRadius: 20, fontSize: 14, fontWeight: 500,
                    background: 'transparent', color: currentIndex === 0 ? '#5f6368' : '#1a73e8', border: '1px solid #dadce0',
                    opacity: currentIndex === 0 ? 0.4 : 1, cursor: currentIndex === 0 ? 'not-allowed' : 'pointer',
                  }}
                  className="focus-visible:ring-2 focus-visible:ring-[#1a73e8] focus-visible:ring-offset-2">
                  <ChevronLeft className="w-4 h-4" /> Prev
                </button>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12, flex: 1, maxWidth: 300, margin: '0 16px' }}>
                  <ProgressBarSVG progress={progress} height={6} />
                   <span style={{ fontSize: 13, color: '#5f6368', fontVariantNumeric: 'tabular-nums', minWidth: 40, textAlign: 'right' }}>{progress}%</span>
                </div>
                <button onClick={nextQuestion} disabled={currentIndex === totalQuestions - 1}
                  style={{
                    display: 'inline-flex', alignItems: 'center', gap: 8, padding: '8px 20px', borderRadius: 8, fontSize: 14, fontWeight: 500,
                    background: currentIndex === totalQuestions - 1 ? '#e8eaed' : '#1a73e8', color: currentIndex === totalQuestions - 1 ? '#5f6368' : '#fff',
                    border: 'none', boxShadow: '0 1px 2px rgba(0,0,0,0.1)',
                    opacity: currentIndex === totalQuestions - 1 ? 0.4 : 1, cursor: currentIndex === totalQuestions - 1 ? 'not-allowed' : 'pointer',
                  }}
                  className="focus-visible:ring-2 focus-visible:ring-[#1a73e8] focus-visible:ring-offset-2">
                  Next <ChevronRight className="w-4 h-4" />
                </button>
             </div>
           </div>
        </div>
      </AppLayout>

      <SwipeHint />
      <UnifiedSearch isOpen={showSearchModal} onClose={() => setShowSearchModal(false)} />
      <VoiceReminder />
    </>
  );
}

function FilterSelect({ label, value, onChange, children }: { label: string; value: string; onChange: (v: string) => void; children: React.ReactNode }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
       <label style={{ fontSize: 12, fontWeight: 500, color: '#5f6368', letterSpacing: '0.5px', textTransform: 'uppercase' }}>{label}</label>
      <div style={{ position: 'relative' }}>
         <select value={value} onChange={e => onChange(e.target.value)}
           style={{
             appearance: 'none',
             background: 'var(--surface-2)',
             border: '1px solid rgba(255,255,255,0.12)',
             borderRadius: 8,
             padding: '8px 32px 8px 12px',
             minHeight: 40,
             fontSize: 14,
             color: 'var(--text-primary)',
             cursor: 'pointer',
             transition: 'all 0.15s ease',
           }}
           className="focus-visible:ring-2 focus-visible:ring-[#1a73e8] focus-visible:ring-offset-2">
           {children}
         </select>
         <ChevronDown style={{ position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)', width: 16, height: 16, color: '#5f6368', pointerEvents: 'none' }} />
       </div>
     </div>
   );
 }
