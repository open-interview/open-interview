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
import { useUnifiedNotifications } from '../components/UnifiedNotificationManager';
import { announceLoading, announceScore, announcePolite } from '../lib/aria-announcer';
import {
  getCard, recordReview, addToSRS, getMasteryLabel,
  type ReviewCard, type ConfidenceRating,
} from '../lib/spaced-repetition';
import {
  ChevronLeft, ChevronRight, Search, X, Bookmark, Share2,
  Filter, Brain, Check, Eye, BookOpen, ChevronDown, Mic,
} from 'lucide-react';
import {
  QuestionNumberBadge, CircularTimer, ConfidenceCircles, ProgressBarSVG,
  ResultIcon, StreakFlameSVG, PointsBadgeSVG, RevealOverlay,
} from '../components/question/SvgComponents';

// ─── M3 design tokens ────────────────────────────────────────────────────────
const M3_SYS_COLOR_PRIMARY = 'var(--md-sys-color-primary, #1a73e8)';
const M3_SYS_COLOR_ON_PRIMARY = 'var(--md-sys-color-on-primary, #fff)';
const M3_SYS_COLOR_ON_SURFACE_VARIANT = 'var(--md-sys-color-on-surface-variant, #9aa0a6)';
const M3_SYS_COLOR_OUTLINE = 'var(--md-sys-color-outline, #5f6368)';
const M3_SYS_COLOR_ERROR = 'var(--md-sys-color-error, #ea4335)';
const M3_SYS_COLOR_TERTIARY = 'var(--md-sys-color-tertiary, #f9ab00)';
const M3_SYS_COLOR_SUCCESS = 'var(--md-sys-color-primary, #34a853)';

/** M3 transition tokens per §7.2 */
const TRANSITION_STANDARD = '150ms cubic-bezier(0.2, 0, 0, 1)';
const TRANSITION_FUNCTIONAL = '300ms cubic-bezier(0.2, 0, 0, 1)';
const EASING_EMPHATIZE = 'cubic-bezier(0.2, 0, 0, 1)';

/** M3 elevated card Level 1: tonal overlay + shadow-1 */
const m3Card: React.CSSProperties = {
  background: 'var(--surface-2)',
  borderRadius: 12,
  border: 'none',
  boxShadow: '0px 1px 2px rgba(0,0,0,0.3), 0px 2px 6px rgba(0,0,0,0.15)',
  position: 'relative',
  overflow: 'hidden',
};

/** M3 filter chip */
const chipStyle = (active: boolean): React.CSSProperties => ({
  display: 'inline-flex', alignItems: 'center', gap: 6,
  padding: '6px 12px', borderRadius: 8, fontSize: 13, fontWeight: 500,
  cursor: 'pointer', transition: `background ${TRANSITION_STANDARD}, color ${TRANSITION_STANDARD}`,
  background: active ? M3_SYS_COLOR_PRIMARY : 'rgba(26, 115, 232, 0.08)',
  color: active ? M3_SYS_COLOR_ON_PRIMARY : M3_SYS_COLOR_PRIMARY,
  border: active ? 'none' : '1px solid rgba(26, 115, 232, 0.2)',
});

/** M3 filled button */
const filledBtn: React.CSSProperties = {
  display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
  gap: 8, padding: '10px 24px', borderRadius: 12, fontSize: 14, fontWeight: 500,
  cursor: 'pointer', transition: `box-shadow ${TRANSITION_STANDARD}`,
  background: M3_SYS_COLOR_PRIMARY, color: M3_SYS_COLOR_ON_PRIMARY, border: 'none',
  boxShadow: '0px 1px 2px rgba(0,0,0,0.3), 0px 2px 6px rgba(0,0,0,0.15)',
};

/** M3 outlined button */
const outlinedBtn: React.CSSProperties = {
  display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
  gap: 8, padding: '9px 20px', borderRadius: 20, fontSize: 14, fontWeight: 500,
  cursor: 'pointer', transition: `background ${TRANSITION_STANDARD}`,
  background: 'transparent', color: M3_SYS_COLOR_PRIMARY,
  border: '1px solid rgba(26, 115, 232, 0.3)',
};

/** M3 filled-tonal icon button — 48dp touch target */
const tonalIconBtn = (disabled: boolean): React.CSSProperties => ({
  display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
  width: 48, height: 48, borderRadius: 12, border: 'none',
  cursor: disabled ? 'not-allowed' : 'pointer',
  opacity: disabled ? 0.38 : 1,
  background: disabled ? 'rgba(255, 255, 255, 0.06)' : 'rgba(138, 180, 248, 0.15)',
  color: disabled ? M3_SYS_COLOR_ON_SURFACE_VARIANT : '#8ab4f8',
  transition: `background ${TRANSITION_STANDARD}, opacity 150ms`,
  flexShrink: 0,
});

/** Difficulty chip tonal colors */
const difficultyStyle = (d: string): React.CSSProperties => {
  const map: Record<string, { bg: string; color: string; border: string }> = {
    advanced:     { bg: 'rgba(234, 67, 53, 0.12)',  color: M3_SYS_COLOR_ERROR, border: 'rgba(234, 67, 53, 0.25)'  },
    intermediate: { bg: 'rgba(251, 188, 5, 0.12)',  color: M3_SYS_COLOR_TERTIARY, border: 'rgba(251, 188, 5, 0.25)'  },
    beginner:     { bg: 'rgba(52, 168, 83, 0.12)',  color: M3_SYS_COLOR_SUCCESS, border: 'rgba(52, 168, 83, 0.25)'  },
  };
  const t = map[d] ?? map.beginner;
  return {
    display: 'inline-flex', alignItems: 'center', padding: '4px 12px',
    borderRadius: 8, fontSize: 12, fontWeight: 500,
    background: t.bg, color: t.color, border: `1px solid ${t.border}`,
  };
};

// ─── Main component ──────────────────────────────────────────────────────────

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
        name: sc.split('-').map((w: string) => w.charAt(0).toUpperCase() + w.slice(1)).join(' '),
      })),
    ],
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
    const s = localStorage.getItem('open-interview-recall-mode');
    return s === null ? true : s === 'true';
  });
  const [recallRevealed, setRecallRevealed] = useState(false);
  const [markedQuestions, setMarkedQuestions] = useState<string[]>(() => {
    const s = localStorage.getItem(`marked-${channelId}`);
    return s ? JSON.parse(s) : [];
  });
  const [srsCard, setSrsCard] = useState<ReviewCard | null>(null);
  const [showRatingButtons, setShowRatingButtons] = useState(false);
  const [hasRated, setHasRated] = useState(false);
  const [timer, setTimer] = useState(60);

  // Spring-physics swipe
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
  const { showToast } = useUnifiedNotifications();

  const { question: currentQuestion, questions, totalQuestions, loading, error } = useQuestionsWithPrefetch(
    channelId || '', currentIndex, selectedSubChannel, selectedDifficulty, selectedCompany, shuffleEnabled, prioritizeUnvisited,
  );

  // Announce loading state changes
  useEffect(() => {
    announceLoading(loading);
  }, [loading]);

  // Announce question changes
  useEffect(() => {
    if (!currentQuestion) return;
    setSrsCard(getCard(currentQuestion.id, currentQuestion.channel, currentQuestion.difficulty));
    setShowRatingButtons(false); setHasRated(false); setShowAnswer(false); setRecallRevealed(false);
    // Announce new question to screen readers (debounced)
    announcePolite(`Question ${currentIndex + 1} of ${totalQuestions}: ${currentQuestion.question}`);
  }, [currentQuestion]);

  useEffect(() => {
    if (!currentQuestion) return;
    setTimer(60);
    const iv = setInterval(() => setTimer(p => Math.max(0, p - 1)), 1000);
    return () => clearInterval(iv);
  }, [currentQuestion?.id]);

  useEffect(() => { localStorage.setItem('open-interview-recall-mode', String(recallMode)); }, [recallMode]);

  useEffect(() => {
    if (loading || questions.length === 0) return;
    if (targetQuestionId) {
      const idx = questions.findIndex(q => q.id === targetQuestionId);
      if (idx >= 0 && idx !== currentIndex) setCurrentIndex(idx);
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

  // Cleanup announcements on unmount
  useEffect(() => {
    return () => {
      // Optional: could clear announcements here if needed
      // clearAnnouncements();
    };
  }, []);

  useEffect(() => {
    if (!currentQuestion) return;
    trackQuestionView(currentQuestion.id, currentQuestion.channel, currentQuestion.difficulty);
    markCompleted(currentQuestion.id);
    trackActivity();
    trackEvent({ type: 'question_completed', timestamp: new Date().toISOString(), data: { questionId: currentQuestion.id, difficulty: currentQuestion.difficulty, channel: currentQuestion.channel } });
  }, [currentQuestion?.id]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') { e.preventDefault(); setShowSearchModal(true); return; }
      if (showSearchModal) return;
      if (e.key === 'ArrowRight' || e.key === 'ArrowDown') { e.preventDefault(); nextQuestion(); }
      else if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') { e.preventDefault(); prevQuestion(); }
      else if ((e.key === ' ' || e.key === 'Enter') && (e.target as HTMLElement).tagName !== 'BUTTON' && (e.target as HTMLElement).tagName !== 'INPUT') { e.preventDefault(); setShowAnswer(true); }
      else if (e.key === 'Escape') { if (showAnswer) setShowAnswer(false); else setLocation('/channels'); }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [currentIndex, totalQuestions, showSearchModal, showAnswer]);

  const nextQuestion = () => {
    if (currentIndex < totalQuestions - 1) {
      setCurrentIndex(p => p + 1); setShowAnswer(false); onQuestionSwipe(); onQuestionView();
    }
  };
  const prevQuestion = () => {
    if (currentIndex > 0) { setCurrentIndex(p => p - 1); setShowAnswer(false); }
  };

  const toggleMark = () => {
    if (!currentQuestion) return;
    setMarkedQuestions(prev => {
      const next = prev.includes(currentQuestion.id)
        ? prev.filter(id => id !== currentQuestion.id)
        : [...prev, currentQuestion.id];
      localStorage.setItem(`marked-${channelId}`, JSON.stringify(next));
      
      const wasMarked = prev.includes(currentQuestion.id);
      const message = wasMarked ? 'Bookmark removed' : 'Question bookmarked';
      showToast(
        message,
        wasMarked ? `Removed: ${currentQuestion.question.slice(0, 30)}...` : currentQuestion.question,
        wasMarked ? 'default' : 'success',
        wasMarked ? {
          label: 'Undo',
          onClick: () => {
            const restored = wasMarked
              ? [...prev, currentQuestion.id]
              : prev.filter(id => id !== currentQuestion.id);
            localStorage.setItem(`marked-${channelId}`, JSON.stringify(restored));
            setMarkedQuestions(restored);
            showToast('Bookmark restored', currentQuestion.question, 'success');
            announcePolite('Bookmark restored');
          }
        } : undefined,
        4000
      );
      
      // Announce bookmark change to screen readers
      announcePolite(message);
      
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
    setHasRated(true); setShowRatingButtons(false);
    trackEvent({ type: 'srs_review', timestamp: new Date().toISOString(), data: { rating } });
    toast({ title: 'Review recorded', description: `Mastery: ${getMasteryLabel(updated.masteryLevel)}` });
    // Announce score update to screen readers (debounced)
    announceScore(`Mastery level updated to ${getMasteryLabel(updated.masteryLevel)}`);
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

  // ─── Loading / error / empty states ────────────────────────────────────────

  if (loading && questions.length === 0) {
    return (
      <AppLayout fullWidth>
        <div className="min-h-screen bg-background flex flex-col gap-6 p-6 max-w-3xl mx-auto w-full pt-16">
          <div style={{ ...m3Card, padding: 24 }}>
            <div style={{ width: '40%', height: 12, background: 'rgba(255, 255, 255, 0.06)', borderRadius: 4, marginBottom: 16 }} />
            <div style={{ width: '80%', height: 20, background: 'rgba(255, 255, 255, 0.06)', borderRadius: 4, marginBottom: 16 }} />
            <div style={{ width: '60%', height: 14, background: 'rgba(255, 255, 255, 0.06)', borderRadius: 4 }} />
          </div>
          <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
            {[1,2,3,4].map(i => (
              <div key={i} style={{ width: 80, height: 32, background: 'rgba(255, 255, 255, 0.06)', borderRadius: 8 }} />
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
          <X className="min-w-[48px] w-10 h-10" style={{ color: M3_SYS_COLOR_OUTLINE }} />
          <h2 className="text-2xl font-bold" style={{ color: 'var(--text-primary)' }}>Channel not found</h2>
          <button onClick={() => setLocation('/channels')} style={filledBtn}>
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
          <BookOpen className="min-w-[48px] w-10 h-10" style={{ color: M3_SYS_COLOR_OUTLINE }} />
          <h2 className="text-2xl font-bold" style={{ color: 'var(--text-primary)' }}>No questions found</h2>
          <p style={{ color: M3_SYS_COLOR_OUTLINE }}>{hasFilters ? 'Try adjusting your filters.' : 'Check back soon!'}</p>
          <div className="flex gap-2">
            {hasFilters && (
              <button onClick={() => { setSelectedSubChannel('all'); setSelectedDifficulty('all'); setSelectedCompany('all'); }} style={filledBtn}>
                <X className="w-4 h-4" /> Clear filters
              </button>
            )}
            <button onClick={() => setLocation('/channels')} style={outlinedBtn}>
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
          title={`${currentQuestion.question.slice(0, 60)} | Open Interview`}
          description={currentQuestion.tldr ?? currentQuestion.answer?.slice(0, 160) ?? 'Practice technical interview questions'}
          canonical={`https://open-interview.github.io/channel/${channelId}/${currentQuestion.id}`}
        />
        <div className="min-h-screen bg-background text-foreground flex flex-col">

          {/* 4. M3 Linear Progress — top of screen */}
          <div style={{ height: 4, width: '100%', flexShrink: 0, position: 'relative' }}>
            <div style={{ position: 'absolute', inset: 0, background: 'rgba(255,255,255,0.06)' }} />
            <motion.div
              style={{
                position: 'absolute', top: 0, left: 0, bottom: 0,
                background: M3_SYS_COLOR_PRIMARY,
                transformOrigin: 'left',
              }}
              initial={{ scaleX: 0 }}
              animate={{ scaleX: progress / 100 }}
              transition={{ duration: 0.4, ease: EASING_EMPHATIZE }}
            />
          </div>

          {/* Toolbar */}
          <div style={{ borderBottom: '1px solid rgba(255, 255, 255, 0.08)', background: 'var(--surface-1)', flexShrink: 0 }}>
            <div className="max-w-4xl mx-auto px-4 h-14 flex items-center justify-between gap-3">
              {/* Left */}
              <div className="flex items-center gap-3 min-w-0">
                <button onClick={() => setLocation('/channels')} aria-label="Back"
                  className="cursor-pointer p-2 min-h-[48px] min-w-[48px] flex items-center justify-center rounded-full hover:bg-white/5 transition-all duration-150"
                  style={{ width: 48, height: 48 }}>
                  <ChevronLeft className="w-5 h-5" style={{ color: M3_SYS_COLOR_OUTLINE }} />
                </button>
                {/* Breadcrumb: Channels > Channel Name */}
                <nav aria-label="Breadcrumb" className="flex items-center gap-1 min-w-0">
                  <button
                    onClick={() => setLocation('/channels')}
                    className="text-sm hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary rounded shrink-0"
                    style={{ color: M3_SYS_COLOR_ON_SURFACE_VARIANT }}
                  >
                    Channels
                  </button>
                  <ChevronRight className="w-3.5 h-3.5 shrink-0" style={{ color: M3_SYS_COLOR_OUTLINE }} />
                  <span
                    className="text-sm font-medium truncate"
                    style={{ color: 'var(--text-primary)' }}
                    aria-current="page"
                  >
                    {channel.name}
                  </span>
                </nav>
                <QuestionNumberBadge number={currentIndex} total={totalQuestions} />
                <CircularTimer seconds={timer} totalSeconds={60} />
                <span style={{ fontSize: 13, color: M3_SYS_COLOR_OUTLINE, flexShrink: 0, fontVariantNumeric: 'tabular-nums' }}>
                  {currentIndex + 1}/{totalQuestions}
                </span>
              </div>
              {/* Right */}
              <div className="flex items-center gap-1 flex-shrink-0">
                {/* 5. Recall mode — filter chip */}
                <button onClick={() => setRecallMode(v => !v)} aria-label={recallMode ? 'Recall mode on' : 'Recall mode off'}
                  style={chipStyle(recallMode)} className="focus-visible:ring-2 focus-visible:ring-primary">
                  <Brain className="w-4 h-4" />
                  <span className="hidden sm:inline">Recall</span>
                </button>
                <StreakFlameSVG streak={completed.length} />
                <button onClick={() => setShowFilters(v => !v)} aria-label="Filters"
                  style={chipStyle(hasFilters)} className="focus-visible:ring-2 focus-visible:ring-primary">
                  <Filter className="w-4 h-4" />
                </button>
                <button onClick={() => setShowSearchModal(true)} aria-label="Search"
                  className="cursor-pointer p-2 min-h-[48px] min-w-[48px] flex items-center justify-center rounded-full hover:bg-white/5 transition-all duration-150"
                  style={{ width: 48, height: 48 }}>
                  <Search className="w-5 h-5" style={{ color: M3_SYS_COLOR_ON_SURFACE_VARIANT }} />
                </button>
                {/* 6. Bookmark — M3 icon toggle, 150ms animation */}
                <motion.button
                  onClick={toggleMark}
                  aria-label={isMarked ? 'Remove bookmark' : 'Bookmark'}
                  aria-pressed={isMarked}
                  data-testid="button-bookmark"
                  whileTap={{ scale: 0.88 }}
                  style={{
                    display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                    width: 48, height: 48, borderRadius: 12, border: 'none', cursor: 'pointer',
                    background: isMarked ? 'rgba(138, 180, 248, 0.15)' : 'transparent',
                    color: isMarked ? '#8ab4f8' : M3_SYS_COLOR_ON_SURFACE_VARIANT,
                    transition: `background ${TRANSITION_STANDARD}, color ${TRANSITION_STANDARD}`,
                  }}
                >
                  <motion.div animate={isMarked ? { scale: [1, 1.3, 1] } : { scale: 1 }} transition={{ duration: 0.15 }}>
                    <Bookmark className="w-4 h-4" fill={isMarked ? 'currentColor' : 'none'} />
                  </motion.div>
                </motion.button>
                <button onClick={handleShare} aria-label="Share" data-testid="button-share"
                  className="cursor-pointer p-2 min-h-[48px] min-w-[48px] flex items-center justify-center rounded-full hover:bg-white/5 transition-all duration-150 hidden sm:flex"
                  style={{ width: 48, height: 48 }}>
                  <Share2 className="w-4 h-4" style={{ color: M3_SYS_COLOR_OUTLINE }} />
                </button>
              </div>
            </div>
          </div>

          {/* Filters drawer */}
          <AnimatePresence>
            {showFilters && (
              <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.3, ease: EASING_EMPHATIZE }}
                style={{ borderBottom: '1px solid rgba(255, 255, 255, 0.08)', background: 'var(--surface-1)', overflow: 'hidden', flexShrink: 0 }}>
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
                  <button onClick={() => setShowFilters(false)}
                    className="cursor-pointer p-2 min-h-[48px] min-w-[48px] flex items-center justify-center rounded-full hover:bg-white/5 transition-all duration-150 ml-auto"
                    style={{ width: 48, height: 48 }}>
                    <X className="w-4 h-4" style={{ color: M3_SYS_COLOR_OUTLINE }} />
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* 8. Swipe-enabled scrollable content */}
          <motion.div drag="x" dragConstraints={{ left: 0, right: 0 }} dragElastic={0.12}
            style={{ x, opacity }} onDragEnd={handleDragEnd} className="flex-1 overflow-y-auto">
            <div className="max-w-3xl mx-auto px-4 py-8 lg:py-10">

              {/* 1. M3 Elevated Card — Level 1 */}
              <div data-testid="question-card" style={m3Card}>
                {/* Tonal overlay 5% */}
                <div aria-hidden style={{ position: 'absolute', inset: 0, background: '#1a73e8', opacity: 0.05, borderRadius: 'inherit', pointerEvents: 'none' }} />

                <div style={{ padding: 24, position: 'relative' }}>
                  {/* 7. Metadata bar — Body Small, on-surface-variant */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap', marginBottom: 16 }}>
                    {/* 5. Difficulty filter chip */}
                    {currentQuestion.difficulty && (
                      <span style={difficultyStyle(currentQuestion.difficulty)}>
                        {currentQuestion.difficulty.charAt(0).toUpperCase() + currentQuestion.difficulty.slice(1)}
                      </span>
                    )}
                    {currentQuestion.subChannel && (
                      <span style={{ display: 'inline-flex', alignItems: 'center', padding: '4px 12px', borderRadius: 8, fontSize: 12, fontWeight: 500, background: 'rgba(138, 180, 248, 0.08)', border: '1px solid rgba(138, 180, 248, 0.2)', color: '#8ab4f8' }}>
                        {currentQuestion.subChannel.split('-').map((w: string) => w.charAt(0).toUpperCase() + w.slice(1)).join(' ')}
                      </span>
                    )}
                    {currentQuestion.companies?.[0] && (
                      <span style={{ display: 'inline-flex', alignItems: 'center', padding: '4px 12px', borderRadius: 8, fontSize: 12, fontWeight: 500, background: 'rgba(255, 255, 255, 0.05)', border: '1px solid rgba(255, 255, 255, 0.08)', color: M3_SYS_COLOR_ON_SURFACE_VARIANT }}>
                        {currentQuestion.companies[0]}
                      </span>
                    )}
                    {isCompleted && (
                      <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, padding: '4px 12px', borderRadius: 8, fontSize: 12, fontWeight: 500, background: 'rgba(52,168,83,0.12)', border: '1px solid rgba(52,168,83,0.25)', color: '#34a853' }}>
                        <Check className="w-3.5 h-3.5" /> Done
                      </span>
                    )}
                  </div>

                  {/* 1. Title Large — 22sp, weight 400 */}
                  <h1 style={{ fontSize: 'clamp(1.125rem, 3.5vw, 1.375rem)', fontWeight: 400, lineHeight: 1.45, letterSpacing: 0, marginBottom: 16, color: 'var(--text-primary)', fontFamily: "'Google Sans', 'Roboto', sans-serif" }}>
                    {currentQuestion.question}
                  </h1>

                  {/* Tags */}
                  {currentQuestion.tags && currentQuestion.tags.length > 0 && (
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 20 }}>
                      {currentQuestion.tags.slice(0, 6).map((tag: string) => (
                        <span key={tag} style={{ fontSize: 12, color: M3_SYS_COLOR_ON_SURFACE_VARIANT, fontWeight: 500 }}>#{tag}</span>
                      ))}
                    </div>
                  )}

                  {/* SRS row */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap', marginBottom: 20 }}>
                    {hasRated ? (
                      <span style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 14, color: M3_SYS_COLOR_SUCCESS, fontWeight: 500 }}>
                        <Check className="w-4 h-4" /> Review recorded
                        {srsCard && <ResultIcon correct={srsCard.masteryLevel > 0} size={28} />}
                      </span>
                    ) : showRatingButtons && srsCard ? (
                      <ConfidenceCircles onSelect={handleSRSRating} />
                    ) : (
                      <button onClick={handleAddToSRS} style={chipStyle(false)} className="focus-visible:ring-2 focus-visible:ring-primary">
                        <Brain className="w-3.5 h-3.5" /> Add to SRS
                      </button>
                    )}
                    <QuestionFeedback questionId={currentQuestion.id} />
                    {hasRated && srsCard && <PointsBadgeSVG points={srsCard.masteryLevel * 10} />}
                  </div>

                  {/* Answer section */}
                  <div style={{ borderTop: '1px solid rgba(255,255,255,0.08)', paddingTop: 20 }}>
                    {recallMode && !recallRevealed ? (
                      <RecallGate onReveal={() => { setRecallRevealed(true); setShowAnswer(true); }} />
                    ) : (
                      <>
                        {/* 2. Container-transform reveal button (mobile) */}
                        {!recallMode && (
                          <div className="lg:hidden mb-6">
                            <AnimatePresence mode="wait">
                              {!showAnswer ? (
                                <motion.button
                                  key="show"
                                  onClick={() => setShowAnswer(true)}
                                  data-testid="button-reveal-answer"
                                  layoutId="answer-reveal"
                                  initial={{ opacity: 0, scale: 0.97 }}
                                  animate={{ opacity: 1, scale: 1 }}
                                  exit={{ opacity: 0, scale: 0.95 }}
                                  transition={{ duration: 0.2, ease: EASING_EMPHATIZE }}
                                  style={filledBtn}
                                >
                                  <Eye className="w-4 h-4" /> Show Answer
                                </motion.button>
                              ) : (
                                <motion.button
                                  key="hide"
                                  onClick={() => setShowAnswer(false)}
                                  layoutId="answer-reveal"
                                  initial={{ opacity: 0 }}
                                  animate={{ opacity: 1 }}
                                  exit={{ opacity: 0 }}
                                  transition={{ duration: 0.15, ease: EASING_EMPHATIZE }}
                                  style={outlinedBtn}
                                >
                                  <ChevronDown className="w-4 h-4" style={{ transform: 'rotate(180deg)' }} /> Hide answer
                                </motion.button>
                              )}
                            </AnimatePresence>
                          </div>
                        )}
                        <RevealOverlay show={showAnswer || recallRevealed}>
                          <AnswerPanel question={currentQuestion} isCompleted={isCompleted} />
                        </RevealOverlay>
                      </>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </motion.div>

          {/* 9. M3 Bottom App Bar + FAB */}
          <div style={{ borderTop: '1px solid rgba(255,255,255,0.08)', background: 'var(--surface-1)', paddingBottom: 'env(safe-area-inset-bottom, 0px)', flexShrink: 0 }}>
            <div className="max-w-4xl mx-auto px-4 flex items-center justify-between gap-3" style={{ height: 80 }}>

              {/* 3. Prev — filled-tonal icon button, 48dp */}
              <motion.button
                onClick={prevQuestion}
                disabled={currentIndex === 0}
                aria-label="Previous question"
                whileTap={currentIndex > 0 ? { scale: 0.92 } : {}}
                style={tonalIconBtn(currentIndex === 0)}
              >
                <ChevronLeft className="w-5 h-5" />
              </motion.button>

              {/* Center: progress + FAB */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 12, flex: 1, maxWidth: 400, margin: '0 8px' }}>
                <ProgressBarSVG progress={progress} height={6} />
                <span style={{ fontSize: 13, color: M3_SYS_COLOR_OUTLINE, fontVariantNumeric: 'tabular-nums', minWidth: 40, textAlign: 'right' }}>
                  {progress}%
                </span>
              </div>

              {/* FAB — Voice Practice */}
              <motion.button
                aria-label="Voice practice this question"
                whileTap={{ scale: 0.94 }}
                whileHover={{ scale: 1.04 }}
                style={{
                  display: 'inline-flex', alignItems: 'center', gap: 8,
                  height: 56, padding: '0 20px', borderRadius: 16, border: 'none', cursor: 'pointer',
                  background: 'rgba(138,180,248,0.15)',
                  color: '#8ab4f8', fontWeight: 500, fontSize: 14,
                  boxShadow: '0px 1px 3px rgba(0,0,0,0.3), 0px 4px 8px rgba(0,0,0,0.15)',
                  flexShrink: 0,
                }}
              >
                <Mic className="w-5 h-5" />
                <span className="hidden sm:inline">Voice Practice</span>
              </motion.button>

              {/* 3. Next — filled-tonal icon button, 48dp */}
              <motion.button
                onClick={nextQuestion}
                disabled={currentIndex === totalQuestions - 1}
                aria-label="Next question"
                whileTap={currentIndex < totalQuestions - 1 ? { scale: 0.92 } : {}}
                style={tonalIconBtn(currentIndex === totalQuestions - 1)}
              >
                <ChevronRight className="w-5 h-5" />
              </motion.button>
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

// ─── FilterSelect helper ─────────────────────────────────────────────────────

function FilterSelect({ label, value, onChange, children }: {
  label: string; value: string; onChange: (v: string) => void; children: React.ReactNode;
}) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
      <label style={{ fontSize: 11, fontWeight: 500, color: M3_SYS_COLOR_OUTLINE, letterSpacing: '0.5px', textTransform: 'uppercase' }}>
        {label}
      </label>
      <div style={{ position: 'relative' }}>
        <select
          value={value}
          onChange={e => onChange(e.target.value)}
          style={{
            appearance: 'none', background: 'var(--surface-2)',
            border: '1px solid rgba(255, 255, 255, 0.12)', borderRadius: 8,
            padding: '8px 32px 8px 12px', minHeight: 40, fontSize: 14,
            color: 'var(--text-primary)', cursor: 'pointer',
            transition: `border-color ${TRANSITION_STANDARD}`,
          }}
          className="focus-visible:ring-2 focus-visible:ring-primary"
        >
          {children}
        </select>
        <ChevronDown style={{ position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)', width: 16, height: 16, color: M3_SYS_COLOR_OUTLINE, pointerEvents: 'none' }} />
      </div>
    </div>
  );
}
