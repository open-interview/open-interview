/**
 * TestSession — revamped quiz flow with circular timer, violet selection states, rich results
 * All existing test logic and scoring preserved.
 */

import { useState, useEffect, useCallback } from 'react';
import { useLocation, useParams } from 'wouter';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ArrowLeft, ArrowRight, CheckCircle, XCircle, Trophy,
  Home, Check, X, Zap, Share2, RotateCcw, ChevronRight
} from 'lucide-react';
import { SEOHead } from '../components/SEOHead';
import { DesktopSidebarWrapper } from '../components/layout/DesktopSidebarWrapper';
import { Card, Button } from '../components/genz';
import {
  Test, TestQuestion, getTestForChannel, getSessionQuestions,
  calculateScore, saveTestAttempt, TestAttempt, getTestProgress,
  getChannelTheme, checkTestExpiration
} from '../lib/tests';
import { mascotEvents } from '../components/PixelMascot';

type SessionState = 'loading' | 'ready' | 'in-progress' | 'review';

// ── Confetti burst ────────────────────────────────────────────────────────────
function Confetti() {
  const pieces = Array.from({ length: 32 }, (_, i) => ({
    id: i,
    x: Math.random() * 100,
    color: ['#7c3aed', '#06b6d4', '#10b981', '#f59e0b', '#ef4444'][i % 5],
    delay: Math.random() * 0.5,
    duration: 1.2 + Math.random() * 0.8,
  }));
  return (
    <div className="fixed inset-0 pointer-events-none z-50 overflow-hidden">
      {pieces.map(p => (
        <motion.div
          key={p.id}
          initial={{ x: `${p.x}vw`, y: '-5vh', rotate: 0, opacity: 1 }}
          animate={{ y: '110vh', rotate: 720, opacity: 0 }}
          transition={{ duration: p.duration, delay: p.delay, ease: 'easeIn' }}
          className="absolute w-2 h-2 rounded-sm"
          style={{ backgroundColor: p.color }}
        />
      ))}
    </div>
  );
}

// ── Circular countdown timer ──────────────────────────────────────────────────
const TIMER_RADIUS = 28;
const TIMER_CIRC = 2 * Math.PI * TIMER_RADIUS;

function CircularTimer({ seconds, total }: { seconds: number; total: number }) {
  const pct = seconds / total;
  const offset = TIMER_CIRC * (1 - pct);
  const isLow = seconds <= 30;
  const isMid = seconds <= 60 && seconds > 30;
  const color = isLow ? 'var(--color-error)' : isMid ? 'var(--color-warning)' : 'var(--color-success)';

  const mm = String(Math.floor(seconds / 60)).padStart(2, '0');
  const ss = String(seconds % 60).padStart(2, '0');

  return (
    <motion.div
      animate={isLow ? { scale: [1, 1.06, 1] } : { scale: 1 }}
      transition={isLow ? { repeat: Infinity, duration: 0.8 } : {}}
      className="relative w-16 h-16 flex items-center justify-center"
    >
      <svg width="64" height="64" className="-rotate-90">
        <circle cx="32" cy="32" r={TIMER_RADIUS} fill="none" stroke="rgba(255,255,255,0.08)" strokeWidth="4" />
        <circle
          cx="32" cy="32" r={TIMER_RADIUS}
          fill="none"
          stroke={color}
          strokeWidth="4"
          strokeLinecap="round"
          strokeDasharray={TIMER_CIRC}
          strokeDashoffset={offset}
          style={{ transition: 'stroke-dashoffset 1s linear, stroke 0.5s ease' }}
        />
      </svg>
      <span className="absolute text-xs font-bold tabular-nums" style={{ color }}>{mm}:{ss}</span>
    </motion.div>
  );
}

// ── Option button ─────────────────────────────────────────────────────────────
function OptionButton({
  label, text, selected, showCorrect, showWrong, disabled, onClick
}: {
  label: string; text: string; selected: boolean;
  showCorrect: boolean; showWrong: boolean; disabled: boolean;
  onClick: () => void;
}) {
  return (
    <motion.button
      whileTap={disabled ? {} : { scale: 0.98 }}
      onClick={onClick}
      disabled={disabled}
      className={`w-full p-4 text-left rounded-xl border-2 transition-all ${
        showCorrect
          ? 'border-[var(--color-success)] bg-[var(--color-success)]/15'
          : showWrong
          ? 'border-[var(--color-error)] bg-[var(--color-error)]/15'
          : selected
          ? 'border-[var(--color-accent-violet)] bg-[var(--color-accent-violet)]/15'
          : 'border-[var(--color-border)] hover:border-[var(--color-accent-violet)]/50 bg-[var(--surface-2)]'
      } ${disabled ? 'cursor-default' : 'cursor-pointer'}`}
    >
      <div className="flex items-center gap-3">
        <span className={`w-7 h-7 rounded-lg flex items-center justify-center text-xs font-bold flex-shrink-0 border-2 ${
          showCorrect ? 'border-[var(--color-success)] bg-[var(--color-success)] text-white'
          : showWrong ? 'border-[var(--color-error)] bg-[var(--color-error)] text-white'
          : selected ? 'border-[var(--color-accent-violet)] bg-[var(--color-accent-violet)] text-white'
          : 'border-[var(--color-border)] text-muted-foreground'
        }`}>
          {showCorrect ? <Check className="w-3.5 h-3.5" /> : showWrong ? <X className="w-3.5 h-3.5" /> : label}
        </span>
        <span className="text-sm leading-snug">{text}</span>
      </div>
    </motion.button>
  );
}

// ── Score ring ────────────────────────────────────────────────────────────────
function ScoreRing({ score, passed }: { score: number; passed: boolean }) {
  const r = 54;
  const circ = 2 * Math.PI * r;
  const color = passed ? 'var(--color-success)' : 'var(--color-error)';

  return (
    <div className="relative w-36 h-36 mx-auto flex items-center justify-center">
      <svg width="144" height="144" className="-rotate-90">
        <circle cx="72" cy="72" r={r} fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth="8" />
        <motion.circle
          cx="72" cy="72" r={r}
          fill="none"
          stroke={color}
          strokeWidth="8"
          strokeLinecap="round"
          strokeDasharray={circ}
          initial={{ strokeDashoffset: circ }}
          animate={{ strokeDashoffset: circ * (1 - score / 100) }}
          transition={{ duration: 1.2, ease: 'easeOut' }}
        />
      </svg>
      <div className="absolute text-center">
        <motion.div
          initial={{ opacity: 0, scale: 0.5 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.4, type: 'spring' }}
          className="text-4xl font-bold"
          style={{ color }}
        >
          {score}%
        </motion.div>
      </div>
    </div>
  );
}

// ── Main component ────────────────────────────────────────────────────────────
export default function TestSessionPage() {
  const { channelId } = useParams<{ channelId: string }>();
  const [, setLocation] = useLocation();

  const [test, setTest] = useState<Test | null>(null);
  const [sessionState, setSessionState] = useState<SessionState>('loading');
  const [questions, setQuestions] = useState<TestQuestion[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string[]>>({});
  const [startTime, setStartTime] = useState(0);
  const [result, setResult] = useState<{ score: number; correct: number; total: number; passed: boolean } | null>(null);
  const [showFeedback, setShowFeedback] = useState<'correct' | 'incorrect' | null>(null);
  const [timeLeft, setTimeLeft] = useState(0);
  const [totalTime, setTotalTime] = useState(0);

  useEffect(() => {
    if (!channelId) return;
    getTestForChannel(channelId).then(t => {
      setTest(t ?? null);
      setSessionState(t ? 'ready' : 'loading');
    });
  }, [channelId]);

  // Timer countdown
  useEffect(() => {
    if (sessionState !== 'in-progress' || timeLeft <= 0) return;
    const id = setInterval(() => setTimeLeft(s => {
      if (s <= 1) { clearInterval(id); submitTest(); return 0; }
      return s - 1;
    }), 1000);
    return () => clearInterval(id);
  }, [sessionState, timeLeft]);

  const currentQuestion = questions[currentIndex];
  const progress = getTestProgress(test?.id || '');
  const theme = test ? getChannelTheme(test.channelId) : getChannelTheme('default');
  const isExpired = test && progress ? checkTestExpiration(test, progress) : false;

  const startTest = useCallback(() => {
    if (!test) return;
    const qs = getSessionQuestions(test, 15);
    const secs = (test.timeLimit ?? 20) * 60;
    setQuestions(qs);
    setAnswers({});
    setCurrentIndex(0);
    setStartTime(Date.now());
    setResult(null);
    setTimeLeft(secs);
    setTotalTime(secs);
    setSessionState('in-progress');
  }, [test]);

  const handleOptionSelect = (optionId: string) => {
    if (!currentQuestion || showFeedback) return;
    const current = answers[currentQuestion.id] || [];

    if (currentQuestion.type === 'single') {
      setAnswers(prev => ({ ...prev, [currentQuestion.id]: [optionId] }));
      const isCorrect = currentQuestion.options.find(o => o.id === optionId)?.isCorrect ?? false;
      setShowFeedback(isCorrect ? 'correct' : 'incorrect');
      setTimeout(() => {
        setShowFeedback(null);
        if (currentIndex < questions.length - 1) setCurrentIndex(i => i + 1);
      }, 700);
    } else {
      setAnswers(prev => ({
        ...prev,
        [currentQuestion.id]: current.includes(optionId)
          ? current.filter(id => id !== optionId)
          : [...current, optionId]
      }));
    }
  };

  const confirmMultiple = () => {
    if (!currentQuestion || currentQuestion.type !== 'multiple') return;
    const userAnswers = answers[currentQuestion.id] || [];
    if (!userAnswers.length) return;
    const correctIds = currentQuestion.options.filter(o => o.isCorrect).map(o => o.id);
    const isCorrect = correctIds.every(id => userAnswers.includes(id)) && userAnswers.every(id => correctIds.includes(id));
    setShowFeedback(isCorrect ? 'correct' : 'incorrect');
    setTimeout(() => {
      setShowFeedback(null);
      if (currentIndex < questions.length - 1) setCurrentIndex(i => i + 1);
    }, 800);
  };

  const submitTest = useCallback(() => {
    if (!test) return;
    const calcResult = calculateScore({ ...test, questions }, answers);
    setResult(calcResult);
    const attempt: TestAttempt = {
      testId: test.id,
      startedAt: new Date(startTime).toISOString(),
      completedAt: new Date().toISOString(),
      answers,
      score: calcResult.score,
      passed: calcResult.passed,
    };
    saveTestAttempt(test.id, test.channelId, attempt, test.version);
    setSessionState('review');
    calcResult.passed ? mascotEvents.celebrate() : mascotEvents.disappointed();
  }, [test, questions, answers, startTime]);

  const OPTION_LABELS = ['A', 'B', 'C', 'D', 'E', 'F'];

  // ── Loading ──
  if (sessionState === 'loading' || !test) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin w-8 h-8 border-2 border-primary border-t-transparent rounded-full mx-auto mb-4" />
          <p className="text-muted-foreground text-sm">{!test ? 'No test available for this channel yet' : 'Loading...'}</p>
          <Button onClick={() => setLocation('/')} className="mt-4">Go home</Button>
        </div>
      </div>
    );
  }

  return (
    <>
      <SEOHead
        title={`${test.title} | Code Reels`}
        description={test.description}
        canonical={`https://open-interview.github.io/test/${channelId}`}
      />
      <DesktopSidebarWrapper>
        <div className="min-h-screen bg-background text-foreground">

          {/* ── Ready screen ── */}
          {sessionState === 'ready' && (
            <div className="min-h-screen flex items-center justify-center p-4">
              <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="max-w-md w-full">
                <Card className="p-6">
                  <div className="text-center mb-6">
                    <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-[var(--color-accent-violet)] to-[var(--color-accent-cyan)] flex items-center justify-center mx-auto mb-4">
                      <span className="text-3xl">{theme.icon}</span>
                    </div>
                    <h1 className="text-xl font-bold mb-1">{test.title}</h1>
                    <p className="text-sm text-muted-foreground">{test.description}</p>
                  </div>
                  <div className="space-y-2 mb-6 text-sm">
                    {[
                      ['Questions', `15 (from ${test.questions.length})`],
                      ['Time Limit', `${test.timeLimit ?? 20} minutes`],
                      ['Passing Score', `${test.passingScore}%`],
                    ].map(([k, v]) => (
                      <div key={k} className="flex justify-between p-2.5 rounded-lg bg-muted/40">
                        <span className="text-muted-foreground">{k}</span>
                        <span className="font-semibold">{v}</span>
                      </div>
                    ))}
                    {progress && !isExpired && (
                      <div className="flex justify-between p-2.5 rounded-lg bg-[var(--color-success)]/10 border border-[var(--color-success)]/20">
                        <span className="text-muted-foreground">Your Best</span>
                        <span className="font-bold text-[var(--color-success)]">{progress.bestScore}%</span>
                      </div>
                    )}
                  </div>
                  <div className="space-y-2">
                    <Button onClick={startTest} className="w-full"><Zap className="w-4 h-4 mr-2" />Start Test</Button>
                    <Button variant="secondary" onClick={() => setLocation(`/channel/${channelId}`)} className="w-full">Back to Channel</Button>
                  </div>
                </Card>
              </motion.div>
            </div>
          )}

          {/* ── In-progress ── */}
          {sessionState === 'in-progress' && currentQuestion && (
            <div className="min-h-screen flex flex-col">
              {/* Header */}
              <header className="border-b border-border px-4 py-2 flex items-center justify-between gap-3">
                <button onClick={() => setLocation('/')} className="p-1.5 text-muted-foreground hover:text-foreground transition-colors">
                  <Home className="w-4 h-4" />
                </button>

                {/* Progress bar + counter */}
                <div className="flex-1 flex items-center gap-2">
                  <span className="text-xs font-semibold tabular-nums text-muted-foreground">{currentIndex + 1} / {questions.length}</span>
                  <div className="flex-1 h-1.5 bg-muted rounded-full overflow-hidden">
                    <motion.div
                      className="h-full rounded-full bg-gradient-to-r from-[var(--color-accent-violet)] to-[var(--color-accent-cyan)]"
                      animate={{ width: `${((currentIndex + 1) / questions.length) * 100}%` }}
                      transition={{ duration: 0.3 }}
                    />
                  </div>
                </div>

                <CircularTimer seconds={timeLeft} total={totalTime} />
              </header>

              {/* Question */}
              <div className="flex-1 overflow-y-auto p-4">
                <div className="max-w-2xl mx-auto">
                  <AnimatePresence mode="wait">
                    <motion.div
                      key={currentQuestion.id}
                      initial={{ opacity: 0, x: 24 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: -24 }}
                      transition={{ duration: 0.2 }}
                    >
                      {/* Badges */}
                      <div className="flex items-center gap-2 mb-4">
                        <span className={`px-2 py-0.5 text-[10px] uppercase font-semibold rounded-md ${
                          currentQuestion.type === 'multiple' ? 'bg-[var(--color-accent-violet)]/20 text-[var(--color-accent-violet-light)]' : 'bg-[var(--color-accent-cyan)]/20 text-[var(--color-accent-cyan)]'
                        }`}>
                          {currentQuestion.type === 'multiple' ? 'Select all' : 'Single choice'}
                        </span>
                        <span className={`px-2 py-0.5 text-[10px] uppercase font-semibold rounded-md ${
                          currentQuestion.difficulty === 'beginner' ? 'bg-[var(--color-success)]/20 text-[var(--color-success)]'
                          : currentQuestion.difficulty === 'intermediate' ? 'bg-[var(--color-warning)]/20 text-[var(--color-warning)]'
                          : 'bg-[var(--color-error)]/20 text-[var(--color-error)]'
                        }`}>
                          {currentQuestion.difficulty}
                        </span>
                      </div>

                      <h2 className="text-lg font-bold mb-5 leading-snug">{currentQuestion.question}</h2>

                      <div className="space-y-2.5">
                        {currentQuestion.options.map((opt, idx) => {
                          const isSelected = (answers[currentQuestion.id] || []).includes(opt.id);
                          const showCorrect = !!showFeedback && opt.isCorrect;
                          const showWrong = showFeedback === 'incorrect' && isSelected && !opt.isCorrect;
                          return (
                            <OptionButton
                              key={opt.id}
                              label={OPTION_LABELS[idx]}
                              text={opt.text}
                              selected={isSelected}
                              showCorrect={showCorrect}
                              showWrong={showWrong}
                              disabled={!!showFeedback}
                              onClick={() => handleOptionSelect(opt.id)}
                            />
                          );
                        })}
                      </div>

                      {currentQuestion.type === 'multiple' && !showFeedback && (
                        <p className="mt-3 text-xs text-muted-foreground text-center">Select all correct answers, then confirm</p>
                      )}

                      {/* Explanation on reveal */}
                      <AnimatePresence>
                        {showFeedback && currentQuestion.explanation && (
                          <motion.div
                            initial={{ opacity: 0, y: 8 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0 }}
                            className={`mt-3 p-3 rounded-xl text-xs leading-relaxed border ${
                              showFeedback === 'correct'
                                ? 'bg-[var(--color-success)]/10 border-[var(--color-success)]/25 text-[var(--color-success)]'
                                : 'bg-[var(--color-error)]/10 border-[var(--color-error)]/25 text-[var(--color-error)]'
                            }`}
                          >
                            <span className="font-semibold">{showFeedback === 'correct' ? '✓ ' : '✗ '}</span>
                            <span className="text-foreground/80">{currentQuestion.explanation}</span>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </motion.div>
                  </AnimatePresence>
                </div>
              </div>

              {/* Footer nav */}
              <footer className="border-t border-border p-3">
                <div className="max-w-2xl mx-auto flex items-center justify-between gap-2">
                  <Button size="sm" variant="secondary" onClick={() => setCurrentIndex(i => i - 1)} disabled={currentIndex === 0}>
                    <ArrowLeft className="w-3.5 h-3.5 mr-1" />Prev
                  </Button>

                  <span className="text-xs text-muted-foreground">{Object.keys(answers).length}/{questions.length} answered</span>

                  {currentIndex === questions.length - 1 ? (
                    currentQuestion.type === 'multiple' ? (
                      <Button size="sm" onClick={confirmMultiple} disabled={!(answers[currentQuestion.id]?.length) || !!showFeedback}>
                        Submit
                      </Button>
                    ) : (
                      <Button size="sm" onClick={submitTest}>Submit</Button>
                    )
                  ) : currentQuestion.type === 'multiple' ? (
                    <Button size="sm" onClick={confirmMultiple} disabled={!(answers[currentQuestion.id]?.length) || !!showFeedback}>
                      Confirm
                    </Button>
                  ) : (
                    <Button size="sm" variant="secondary" onClick={() => setCurrentIndex(i => i + 1)} disabled={currentIndex >= questions.length - 1}>
                      Next<ArrowRight className="w-3.5 h-3.5 ml-1" />
                    </Button>
                  )}
                </div>
              </footer>
            </div>
          )}

          {/* ── Results ── */}
          {sessionState === 'review' && result && (
            <div className="min-h-screen flex items-center justify-center p-4">
              {result.passed && <Confetti />}
              <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="max-w-md w-full space-y-4">
                <Card className="p-6">
                  {/* Score ring */}
                  <div className="text-center mb-6">
                    <ScoreRing score={result.score} passed={result.passed} />
                    <motion.div
                      initial={{ opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.6 }}
                      className="mt-3"
                    >
                      <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-sm font-bold border ${
                        result.passed
                          ? 'bg-[var(--color-success)]/15 text-[var(--color-success)] border-[var(--color-success)]/30'
                          : 'bg-[var(--color-error)]/15 text-[var(--color-error)] border-[var(--color-error)]/30'
                      }`}>
                        {result.passed ? <><CheckCircle className="w-4 h-4" />Passed!</> : <><XCircle className="w-4 h-4" />Not Passed</>}
                      </span>
                    </motion.div>
                  </div>

                  {/* Breakdown */}
                  <div className="grid grid-cols-3 gap-3 mb-5">
                    {[
                      { label: 'Correct', value: result.correct, color: 'var(--color-success)' },
                      { label: 'Wrong', value: result.total - result.correct, color: 'var(--color-error)' },
                      { label: 'Total', value: result.total, color: 'var(--color-accent-violet-light)' },
                    ].map(({ label, value, color }) => (
                      <div key={label} className="text-center p-3 rounded-xl bg-muted/40">
                        <div className="text-2xl font-bold" style={{ color }}>{value}</div>
                        <div className="text-xs text-muted-foreground">{label}</div>
                      </div>
                    ))}
                  </div>

                  {/* Question review list */}
                  <div className="mb-5">
                    <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">Question Review</h3>
                    <div className="space-y-1 max-h-48 overflow-y-auto custom-scrollbar pr-1">
                      {questions.map((q, idx) => {
                        const userAns = answers[q.id] || [];
                        const correctIds = q.options.filter(o => o.isCorrect).map(o => o.id);
                        const isCorrect = correctIds.every(id => userAns.includes(id)) && userAns.every(id => correctIds.includes(id));
                        return (
                          <div key={q.id} className="flex items-start gap-2 p-2 rounded-lg bg-muted/30 text-xs">
                            {isCorrect
                              ? <CheckCircle className="w-3.5 h-3.5 text-[var(--color-success)] flex-shrink-0 mt-0.5" />
                              : <XCircle className="w-3.5 h-3.5 text-[var(--color-error)] flex-shrink-0 mt-0.5" />}
                            <span className="text-muted-foreground line-clamp-2">{idx + 1}. {q.question}</span>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="space-y-2">
                    {result.passed && (
                      <Button
                        variant="secondary"
                        onClick={() => {
                          const text = `I scored ${result.score}% on the ${test.title} test on Code Reels! 🎉`;
                          if (navigator.share) navigator.share({ text, url: window.location.href });
                          else navigator.clipboard.writeText(text);
                        }}
                        className="w-full"
                      >
                        <Share2 className="w-4 h-4 mr-2" />Share Badge
                      </Button>
                    )}
                    <Button onClick={startTest} className="w-full">
                      <RotateCcw className="w-4 h-4 mr-2" />{result.passed ? 'Retake' : 'Try Again'}
                    </Button>
                    <Button variant="secondary" onClick={() => setLocation('/tests')} className="w-full">
                      <ChevronRight className="w-4 h-4 mr-2" />Next Test
                    </Button>
                    <Button variant="secondary" onClick={() => setLocation(`/channel/${channelId}`)} className="w-full">
                      Back to Channel
                    </Button>
                  </div>
                </Card>
              </motion.div>
            </div>
          )}
        </div>
      </DesktopSidebarWrapper>
    </>
  );
}
