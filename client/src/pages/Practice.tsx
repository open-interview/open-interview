/**
 * Practice Hub — Single entry point for all practice modes
 * Material Design 3
 */

import { useLocation } from 'wouter';
import { motion } from 'framer-motion';
import { AppLayout } from '../components/layout/AppLayout';
import { SEOHead } from '../components/SEOHead';
import { Mic, Target, Code, RotateCcw, BookOpen, ChevronRight, Zap } from 'lucide-react';
import { getDueCards } from '../lib/spaced-repetition';

const fadeUp = { hidden: { opacity: 0, y: 12 }, show: { opacity: 1, y: 0, transition: { duration: 0.25, ease: [0.2, 0, 0, 1] } } };
const stagger = { show: { transition: { staggerChildren: 0.07 } } };

interface PracticeModeCardProps {
  icon: React.ElementType;
  title: string;
  description: string;
  estimatedTime: string;
  xpReward: number;
  path: string;
  toneColor: string;
  badge?: string;
  lastSession?: string;
}

function PracticeModeCard({
  icon: Icon,
  title,
  description,
  estimatedTime,
  xpReward,
  path,
  toneColor,
  badge,
  lastSession,
}: PracticeModeCardProps) {
  const [, setLocation] = useLocation();

  return (
    <motion.button
      variants={fadeUp}
      whileTap={{ scale: 0.98 }}
      onClick={() => setLocation(path)}
      className="group relative flex flex-col gap-4 p-6 rounded-3xl text-left transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary hover:shadow-lg"
      style={{
        backgroundColor: 'var(--md-sys-color-surface-container)',
        boxShadow: '0 1px 2px rgba(0,0,0,0.08), 0 1px 3px 1px rgba(0,0,0,0.06)',
      }}
    >
      {badge && (
        <div
          className="absolute top-4 right-4 px-2 py-0.5 rounded-full text-[11px] font-medium"
          style={{
            backgroundColor: `color-mix(in srgb, ${toneColor} 20%, transparent)`,
            color: toneColor,
          }}
        >
          {badge}
        </div>
      )}

      <div
        className="w-14 h-14 rounded-2xl flex items-center justify-center shrink-0"
        style={{ backgroundColor: `color-mix(in srgb, ${toneColor} 15%, transparent)` }}
      >
        <Icon className="w-7 h-7" style={{ color: toneColor }} />
      </div>

      <div className="flex-1">
        <h3 className="text-lg font-medium text-foreground mb-1">{title}</h3>
        <p className="text-sm text-foreground/60 leading-relaxed">{description}</p>
      </div>

      <div className="flex items-center justify-between text-sm">
        <div className="flex items-center gap-4 text-foreground/70">
          <span>{estimatedTime}</span>
          <span className="flex items-center gap-1">
            <Zap className="w-3.5 h-3.5" style={{ color: toneColor }} />
            +{xpReward} XP
          </span>
        </div>
        {lastSession && (
          <span className="text-xs text-foreground/50">Last: {lastSession}</span>
        )}
      </div>

      <ChevronRight className="absolute bottom-6 right-6 w-5 h-5 text-foreground/30 group-hover:text-foreground/60 group-hover:translate-x-1 transition-all" />
    </motion.button>
  );
}

export default function Practice() {
  // Get SRS cards due count
  const dueCards = getDueCards();
  const dueCount = dueCards.length;

  // Get last session dates from localStorage
  const voiceSessionsCount = parseInt(localStorage.getItem('voice-sessions-count') || '0', 10);
  const lastVoiceSession = localStorage.getItem('last-voice-session');
  const lastTestSession = localStorage.getItem('last-test-session');
  const lastCodingSession = localStorage.getItem('last-coding-session');
  const lastReviewSession = localStorage.getItem('last-review-session');

  const formatLastSession = (timestamp: string | null): string | undefined => {
    if (!timestamp) return undefined;
    const date = new Date(timestamp);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
    if (diffDays === 0) return 'today';
    if (diffDays === 1) return 'yesterday';
    if (diffDays < 7) return `${diffDays} days ago`;
    return date.toLocaleDateString();
  };

  return (
    <AppLayout title="Practice">
      <SEOHead
        title="Practice — Open Interview"
        description="Choose your practice mode: voice interviews, quick tests, coding challenges, SRS review, or flashcards."
      />

      <motion.div
        initial="hidden"
        animate="show"
        variants={stagger}
        className="max-w-5xl mx-auto py-8 px-4 sm:px-6"
      >
        {/* Header */}
        <motion.div variants={fadeUp} className="mb-8">
          <h1 className="text-4xl font-normal text-foreground mb-2" style={{ fontSize: 36, lineHeight: '44px' }}>
            Practice
          </h1>
          <p className="text-foreground/60" style={{ fontSize: 16, lineHeight: '24px' }}>
            Choose how you want to practice today
          </p>
        </motion.div>

        {/* Practice modes grid */}
        <motion.div
          variants={stagger}
          className="grid grid-cols-1 md:grid-cols-2 gap-4"
        >
          <PracticeModeCard
            icon={Mic}
            title="Voice Interview"
            description="Practice answering questions out loud with AI-powered feedback"
            estimatedTime="~20 min"
            xpReward={50}
            path="/voice-interview"
            toneColor="#4285F4"
            badge={voiceSessionsCount > 0 ? undefined : 'Try it'}
            lastSession={formatLastSession(lastVoiceSession)}
          />

          <PracticeModeCard
            icon={Target}
            title="Quick Tests"
            description="Timed topic tests to assess your knowledge"
            estimatedTime="~10 min"
            xpReward={20}
            path="/tests"
            toneColor="#34A853"
            lastSession={formatLastSession(lastTestSession)}
          />

          <PracticeModeCard
            icon={Code}
            title="Code Challenges"
            description="Solve coding problems with instant feedback"
            estimatedTime="~30 min"
            xpReward={40}
            path="/coding"
            toneColor="#FBBC05"
            lastSession={formatLastSession(lastCodingSession)}
          />

          <PracticeModeCard
            icon={RotateCcw}
            title="SRS Review"
            description="Spaced repetition review of questions you've answered"
            estimatedTime="~15 min"
            xpReward={30}
            path="/review"
            toneColor="#EA4335"
            badge={dueCount > 0 ? `${dueCount} due` : undefined}
            lastSession={formatLastSession(lastReviewSession)}
          />

          <PracticeModeCard
            icon={BookOpen}
            title="Flashcards"
            description="Quick-fire Q&A to reinforce your knowledge"
            estimatedTime="~5 min"
            xpReward={10}
            path="/flashcards"
            toneColor="#9334E9"
          />
        </motion.div>
      </motion.div>
    </AppLayout>
  );
}
