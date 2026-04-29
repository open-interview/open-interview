/**
 * Voice Practice — Material Design 3 revamp
 */

import { useState, useEffect, useRef, useCallback } from 'react';
import { useLocation } from 'wouter';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, Eye, EyeOff, Mic, Square, RotateCcw, ChevronRight, ChevronLeft } from 'lucide-react';
import { PageLoader } from '@/components/ui/page';
import { SEOHead } from '../components/SEOHead';
import { AppLayout } from '../components/layout/AppLayout';
import { useUserPreferences } from '../context/UserPreferencesContext';
import { getRoleDefaultChannels } from '../lib/personalization';
import { ChannelService } from '../services/api.service';
import type { Question } from '../types';

// ── Types ─────────────────────────────────────────────────────────────────
type PracticeMode = 'training' | 'interview';
type RecordingState = 'idle' | 'recording' | 'recorded';

interface FeedbackResult {
  wordsSpoken: number;
  targetWords: number;
  duration: number;
  message: string;
  score: number;
}

// ── Helpers ───────────────────────────────────────────────────────────────
const isSpeechSupported = typeof window !== 'undefined' &&
  ('SpeechRecognition' in window || 'webkitSpeechRecognition' in window);

function countWords(text: string): number {
  return text.trim().split(/\s+/).filter(w => w.length > 0).length;
}

function calculateFeedback(transcript: string, targetAnswer: string, duration: number): FeedbackResult {
  const wordsSpoken = countWords(transcript);
  const targetWords = countWords(targetAnswer);
  const ratio = wordsSpoken / (targetWords || 1);
  const score = Math.min(100, Math.round(ratio * 100));
  const message =
    ratio >= 0.8 && ratio <= 1.2 ? 'Great job! Your answer length is perfect!' :
    ratio >= 0.5 ? 'Good effort! Try to cover more details.' :
    wordsSpoken > 0 ? 'Keep practicing! Try to elaborate more.' :
    'Start speaking to practice!';
  return { wordsSpoken, targetWords, duration, message, score };
}

const roleQuestionWeights: Record<string, { primary: string[]; multiplier: number }> = {
  manager:       { primary: ['behavioral', 'engineering-management'], multiplier: 2 },
  frontend:      { primary: ['frontend', 'javascript', 'react'], multiplier: 2 },
  devops:        { primary: ['devops', 'kubernetes', 'linux'], multiplier: 2 },
  'ml-engineer': { primary: ['machine-learning', 'python', 'data-engineering'], multiplier: 2 },
};

// ── M3 Linear Progress ────────────────────────────────────────────────────
function M3LinearProgress({ value, max }: { value: number; max: number }) {
  const pct = Math.min((value / max) * 100, 100);
  return (
    <div className="w-full h-1 bg-[color:var(--md-sys-color-surface-variant,#e7e0ec)] overflow-hidden">
      <motion.div
        initial={{ width: 0 }}
        animate={{ width: `${pct}%` }}
        transition={{ duration: 0.3, ease: 'easeOut' }}
        className="h-full bg-[color:var(--md-sys-color-primary,#6750a4)]"
      />
    </div>
  );
}

// ── M3 FAB Microphone Button ──────────────────────────────────────────────
function M3MicFAB({
  isRecording, onStart, onStop, disabled = false,
}: { isRecording: boolean; onStart: () => void; onStop: () => void; disabled?: boolean }) {
  return (
    <button
      onClick={isRecording ? onStop : onStart}
      disabled={disabled}
      aria-label={isRecording ? 'Stop recording' : 'Start recording'}
      style={{ width: 96, height: 96, transition: 'background-color 300ms ease' }}
      className={[
        'relative flex items-center justify-center rounded-[28px] shadow-lg',
        'focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-offset-2',
        isRecording
          ? 'bg-[color:var(--md-sys-color-error-container,#ffdad6)] focus-visible:ring-[color:var(--md-sys-color-error,#b3261e)]'
          : 'bg-[color:var(--md-sys-color-primary-container,#eaddff)] focus-visible:ring-[color:var(--md-sys-color-primary,#6750a4)]',
        disabled ? 'opacity-40 cursor-not-allowed' : 'cursor-pointer hover:brightness-95 active:brightness-90',
      ].join(' ')}
    >
      <AnimatePresence mode="wait" initial={false}>
        {isRecording ? (
          <motion.span key="stop"
            initial={{ scale: 0.6, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.6, opacity: 0 }} transition={{ duration: 0.15 }}>
            <Square className="w-9 h-9 text-[color:var(--md-sys-color-on-error-container,#410002)]" strokeWidth={2} />
          </motion.span>
        ) : (
          <motion.span key="mic"
            initial={{ scale: 0.6, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.6, opacity: 0 }} transition={{ duration: 0.15 }}>
            <Mic className="w-9 h-9 text-[color:var(--md-sys-color-on-primary-container,#21005d)]" strokeWidth={2} />
          </motion.span>
        )}
      </AnimatePresence>
      {isRecording && (
        <motion.span
          className="absolute inset-0 rounded-[28px] bg-[color:var(--md-sys-color-error,#b3261e)] opacity-0"
          animate={{ opacity: [0, 0.12, 0] }}
          transition={{ duration: 1.5, repeat: Infinity }}
        />
      )}
    </button>
  );
}

// ── M3 Waveform (20 bars, 2dp wide, 4dp gap, rAF animated) ───────────────
function M3Waveform({ isActive }: { isActive: boolean }) {
  const barsRef = useRef<(HTMLDivElement | null)[]>([]);
  const rafRef = useRef<number | null>(null);

  useEffect(() => {
    if (!isActive) {
      barsRef.current.forEach(b => { if (b) b.style.height = '4px'; });
      return;
    }
    const animate = () => {
      barsRef.current.forEach(b => {
        if (b) b.style.height = `${4 + Math.random() * 36}px`;
      });
      rafRef.current = requestAnimationFrame(animate);
    };
    rafRef.current = requestAnimationFrame(animate);
    return () => { if (rafRef.current) cancelAnimationFrame(rafRef.current); };
  }, [isActive]);

  return (
    <div className="flex items-center justify-center" style={{ gap: 4, height: 48 }} aria-hidden>
      {Array.from({ length: 20 }, (_, i) => (
        <div
          key={i}
          ref={el => { barsRef.current[i] = el; }}
          style={{
            width: 2,
            height: 4,
            borderRadius: 1,
            backgroundColor: isActive
              ? 'var(--md-sys-color-primary,#6750a4)'
              : 'var(--md-sys-color-outline-variant,#cac4d0)',
            transition: 'height 80ms ease-out, background-color 300ms',
          }}
        />
      ))}
    </div>
  );
}

// ── Timer (Title Large, 22sp) ─────────────────────────────────────────────
function M3Timer({ seconds }: { seconds: number }) {
  const m = Math.floor(seconds / 60), s = seconds % 60;
  return (
    <span className="text-[22px] font-medium leading-7 tabular-nums text-[color:var(--md-sys-color-on-surface,#1c1b1f)]">
      {String(m).padStart(2, '0')}:{String(s).padStart(2, '0')}
    </span>
  );
}

// ── Score Ring SVG (120dp) ────────────────────────────────────────────────
function ScoreRing({ score }: { score: number }) {
  const r = 50, circ = 2 * Math.PI * r;
  const dash = (score / 100) * circ;
  const color = score >= 80 ? 'var(--md-sys-color-primary,#6750a4)' :
                score >= 50 ? '#f59e0b' : 'var(--md-sys-color-error,#b3261e)';
  return (
    <svg width={120} height={120} viewBox="0 0 120 120" aria-label={`Score ${score}`}>
      <circle cx={60} cy={60} r={r} fill="none" stroke="var(--md-sys-color-surface-variant,#e7e0ec)" strokeWidth={10} />
      <motion.circle
        cx={60} cy={60} r={r} fill="none" stroke={color} strokeWidth={10}
        strokeLinecap="round" strokeDasharray={circ}
        initial={{ strokeDashoffset: circ }}
        animate={{ strokeDashoffset: circ - dash }}
        transition={{ duration: 0.8, ease: 'easeOut' }}
        transform="rotate(-90 60 60)"
      />
      <text x={60} y={65} textAnchor="middle" fontSize={28} fontWeight={700}
        fill="var(--md-sys-color-on-surface,#1c1b1f)">{score}</text>
    </svg>
  );
}

// ── Permission Dialog (M3) ────────────────────────────────────────────────
function M3PermissionDialog({ onAllow, onDismiss }: { onAllow: () => void; onDismiss: () => void }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.92 }} animate={{ opacity: 1, scale: 1 }}
        className="w-full max-w-sm rounded-[28px] bg-[color:var(--md-sys-color-surface,#fffbfe)] p-6 shadow-2xl"
      >
        <h2 className="text-[16px] font-semibold leading-6 text-[color:var(--md-sys-color-on-surface,#1c1b1f)] mb-3">
          Microphone Access
        </h2>
        <p className="text-[14px] leading-5 text-[color:var(--md-sys-color-on-surface-variant,#49454f)] mb-6">
          Voice Practice needs your microphone to transcribe your spoken answers and give you real-time feedback. Your audio is processed locally and never stored.
        </p>
        <div className="flex justify-end gap-2">
          <button
            onClick={onDismiss}
            className="px-4 py-2.5 rounded-full text-[14px] font-medium text-[color:var(--md-sys-color-primary,#6750a4)] hover:bg-[color:var(--md-sys-color-primary,#6750a4)]/8 transition-colors cursor-pointer"
          >
            Not Now
          </button>
          <button
            onClick={onAllow}
            className="px-6 py-2.5 rounded-full text-[14px] font-medium bg-[color:var(--md-sys-color-primary,#6750a4)] text-[color:var(--md-sys-color-on-primary,#fff)] hover:brightness-95 transition-all cursor-pointer"
          >
            Allow
          </button>
        </div>
      </motion.div>
    </div>
  );
}

// ── Main Component ────────────────────────────────────────────────────────
export default function VoicePractice() {
  const [, setLocation] = useLocation();
  const { getSubscribedChannels, preferences } = useUserPreferences();

  const [started, setStarted] = useState(false);
  const [mode, setMode] = useState<PracticeMode>('interview');
  const [questions, setQuestions] = useState<Question[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [loading, setLoading] = useState(true);
  const [completed, setCompleted] = useState(false);
  const [showPermissionDialog, setShowPermissionDialog] = useState(false);

  const [recordingState, setRecordingState] = useState<RecordingState>('idle');
  const [transcript, setTranscript] = useState('');
  const [interimTranscript, setInterimTranscript] = useState('');
  const [duration, setDuration] = useState(0);
  const [feedback, setFeedback] = useState<FeedbackResult | null>(null);
  const [showAnswer, setShowAnswer] = useState(false);
  const [showRevealButton, setShowRevealButton] = useState(false);

  const recognitionRef = useRef<any>(null);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const startTimeRef = useRef<number>(0);
  const recordingStateRef = useRef<RecordingState>('idle');
  const transcriptRef = useRef('');
  const transcriptBoxRef = useRef<HTMLDivElement>(null);
  const [recognitionReady, setRecognitionReady] = useState(false);

  const currentQuestion = questions[currentIndex];
  const targetWords = currentQuestion?.answer ? countWords(currentQuestion.answer) : 0;

  // Keep refs in sync
  useEffect(() => { recordingStateRef.current = recordingState; }, [recordingState]);
  useEffect(() => { transcriptRef.current = transcript; }, [transcript]);

  // Auto-scroll transcript
  useEffect(() => {
    if (transcriptBoxRef.current) {
      transcriptBoxRef.current.scrollTop = transcriptBoxRef.current.scrollHeight;
    }
  }, [transcript, interimTranscript]);

  // Load questions
  useEffect(() => {
    async function loadQuestions() {
      setLoading(true);
      const subscribedChannels = getSubscribedChannels();
      if (subscribedChannels.length === 0) { setLoading(false); return; }
      try {
        const allQuestions: Question[] = [];
        for (const channel of subscribedChannels) {
          try {
            const data = await ChannelService.getData(channel.id);
            const suitable = data.questions.filter((q: Question) =>
              q.voiceSuitable !== false && q.answer && q.answer.length > 100
            );
            allQuestions.push(...suitable);
          } catch (e) { console.error(`Failed to load ${channel.id}`, e); }
        }
        if (allQuestions.length > 0) {
          const role = preferences.role ?? '';
          const weights = roleQuestionWeights[role];
          const defaultChannels = getRoleDefaultChannels(role);
          const primaryChannels = weights
            ? new Set(weights.primary)
            : new Set(defaultChannels.slice(0, Math.ceil(defaultChannels.length * 0.6)));
          const multiplier = weights ? weights.multiplier : 2;
          const weighted: Question[] = [];
          for (const q of allQuestions) {
            weighted.push(q);
            if (primaryChannels.has(q.channel ?? '')) {
              for (let i = 1; i < multiplier; i++) weighted.push(q);
            }
          }
          setQuestions(weighted.sort(() => Math.random() - 0.5).slice(0, 15));
        }
      } catch (e) { console.error('Failed to load questions', e); }
      setLoading(false);
    }
    loadQuestions();
  }, [getSubscribedChannels]);

  // Init speech recognition
  useEffect(() => {
    if (!isSpeechSupported) return;
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    const recognition = new SpeechRecognition();
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = 'en-US';
    recognition.onresult = (event: any) => {
      let interim = '', final = '';
      for (let i = event.resultIndex; i < event.results.length; i++) {
        const r = event.results[i];
        if (r.isFinal) final += r[0].transcript + ' ';
        else interim += r[0].transcript;
      }
      if (final) setTranscript(prev => (prev + final).trim());
      setInterimTranscript(interim);
    };
    recognition.onerror = (event: any) => console.error('Speech recognition error:', event.error);
    recognition.onend = () => {
      if (recordingStateRef.current === 'recording') {
        try { recognition.start(); } catch (e) {}
      }
    };
    recognitionRef.current = recognition;
    setRecognitionReady(true);
    return () => { try { recognition.stop(); } catch (e) {} };
  }, []);

  // Timer
  useEffect(() => {
    if (recordingState === 'recording') {
      timerRef.current = setInterval(() => {
        setDuration(Math.floor((Date.now() - startTimeRef.current) / 1000));
      }, 1000);
    } else {
      if (timerRef.current) { clearInterval(timerRef.current); timerRef.current = null; }
    }
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, [recordingState]);

  useEffect(() => { setShowAnswer(mode === 'training'); }, [mode, currentIndex]);

  const startRecording = useCallback(() => {
    if (!recognitionRef.current) return;
    setTranscript(''); setInterimTranscript(''); setFeedback(null); setDuration(0);
    startTimeRef.current = Date.now();
    try { recognitionRef.current.start(); setRecordingState('recording'); }
    catch (err) { console.error('Failed to start recording:', err); }
  }, []);

  const stopRecording = useCallback(() => {
    if (!recognitionRef.current) return;
    if (navigator.vibrate) navigator.vibrate([10, 50, 10]);
    try { recognitionRef.current.stop(); } catch (e) {}
    setRecordingState('recorded');
    if (currentQuestion) {
      const result = calculateFeedback(transcriptRef.current, currentQuestion.answer, duration);
      setFeedback(result);
      if (mode === 'interview') setShowRevealButton(true);
    }
  }, [currentQuestion, duration, mode]);

  const resetForNewQuestion = useCallback(() => {
    setTranscript(''); setInterimTranscript(''); setFeedback(null);
    setDuration(0); setRecordingState('idle');
    setShowAnswer(mode === 'training'); setShowRevealButton(false);
  }, [mode]);

  const goToNext = useCallback(() => {
    if (currentIndex < questions.length - 1) { setCurrentIndex(p => p + 1); resetForNewQuestion(); }
    else setCompleted(true);
  }, [currentIndex, questions.length, resetForNewQuestion]);

  const handleMicClick = useCallback(() => {
    if (recordingState === 'recording') { stopRecording(); return; }
    // Check mic permission before starting
    if (navigator.permissions) {
      navigator.permissions.query({ name: 'microphone' as PermissionName }).then(result => {
        if (result.state === 'denied') { setShowPermissionDialog(true); }
        else { startRecording(); }
      }).catch(() => startRecording());
    } else {
      startRecording();
    }
  }, [recordingState, startRecording, stopRecording]);

  // ── Early returns ────────────────────────────────────────────────────────
  if (loading) {
    return (
      <AppLayout fullWidth>
        <div className="min-h-screen bg-[color:var(--md-sys-color-background,#fffbfe)]">
          <div className="max-w-2xl mx-auto px-4 py-12">
            <PageLoader message="Loading questions…" />
          </div>
        </div>
      </AppLayout>
    );
  }

  if (questions.length === 0) {
    return (
      <AppLayout fullWidth>
        <div className="min-h-screen bg-[color:var(--md-sys-color-background,#fffbfe)] flex items-center justify-center px-4">
          <div className="text-center max-w-sm">
            <div className="w-20 h-20 rounded-full bg-[color:var(--md-sys-color-surface-variant,#e7e0ec)] flex items-center justify-center mx-auto mb-6">
              <Mic className="min-w-[48px] w-10 min-h-[48px] h-10 text-[color:var(--md-sys-color-on-surface-variant,#49454f)]" />
            </div>
            <h2 className="text-[22px] font-medium mb-2 text-[color:var(--md-sys-color-on-surface,#1c1b1f)]">No Questions Available</h2>
            <p className="text-[14px] text-[color:var(--md-sys-color-on-surface-variant,#49454f)] mb-6">Subscribe to channels to access voice practice questions.</p>
            <button onClick={() => setLocation('/channels')}
              className="px-6 py-2.5 rounded-full bg-[color:var(--md-sys-color-primary,#6750a4)] text-[color:var(--md-sys-color-on-primary,#fff)] text-[14px] font-medium cursor-pointer hover:brightness-95">
              Browse Channels
            </button>
          </div>
        </div>
      </AppLayout>
    );
  }

  if (!isSpeechSupported) {
    return (
      <AppLayout fullWidth>
        <div className="min-h-screen bg-[color:var(--md-sys-color-background,#fffbfe)] flex items-center justify-center px-4">
          <div className="text-center max-w-sm">
            <h1 className="text-[22px] font-medium mb-3 text-[color:var(--md-sys-color-on-surface,#1c1b1f)]">Browser Not Supported</h1>
            <p className="text-[14px] text-[color:var(--md-sys-color-on-surface-variant,#49454f)] mb-6">Voice practice requires the Web Speech API. Try Chrome or Edge.</p>
            <button onClick={() => setLocation('/')}
              className="px-6 py-2.5 rounded-full bg-[color:var(--md-sys-color-primary,#6750a4)] text-[color:var(--md-sys-color-on-primary,#fff)] text-[14px] font-medium cursor-pointer">
              Go Home
            </button>
          </div>
        </div>
      </AppLayout>
    );
  }

  // ── Session Complete ───────────────────────────────────────────────────
  if (completed) {
    // Track session count in localStorage
    const sessionCount = parseInt(localStorage.getItem('voice-sessions-count') || '0', 10) + 1;
    localStorage.setItem('voice-sessions-count', String(sessionCount));
    localStorage.setItem('last-voice-session', new Date().toISOString());

    const avgScore = Math.round(feedback?.score ?? 70);
    return (
      <AppLayout fullWidth hideNav>
        <div className="min-h-screen bg-[color:var(--md-sys-color-background,#fffbfe)] flex items-center justify-center px-4">
          <motion.div initial={{ opacity: 0, scale: 0.92 }} animate={{ opacity: 1, scale: 1 }}
            className="flex flex-col items-center gap-6 text-center max-w-sm w-full">
            <ScoreRing score={avgScore} />
            <div>
              <h1 className="text-[28px] font-medium text-[color:var(--md-sys-color-on-surface,#1c1b1f)]">Session Complete!</h1>
              <p className="text-[16px] text-[color:var(--md-sys-color-on-surface-variant,#49454f)] mt-1">
                {questions.length} questions practiced · Session #{sessionCount}
              </p>
            </div>
            {feedback && (
              <p className="text-[16px] text-[color:var(--md-sys-color-on-surface-variant,#49454f)] leading-6">
                {feedback.message}
              </p>
            )}
            {/* Score dimensions — 2-col tonal metric cards */}
            {feedback && (
              <div className="grid grid-cols-2 gap-3 w-full">
                {[
                  { label: 'Words Spoken', value: feedback.wordsSpoken },
                  { label: 'Target Words', value: feedback.targetWords },
                  { label: 'Duration', value: `${feedback.duration}s` },
                  { label: 'Score', value: `${feedback.score}%` },
                ].map(({ label, value }) => (
                  <div key={label}
                    className="rounded-[16px] bg-[color:var(--md-sys-color-secondary-container,#e8def8)] p-4 text-left">
                    <p className="text-[12px] font-medium text-[color:var(--md-sys-color-on-secondary-container,#1d192b)] opacity-70 mb-1">{label}</p>
                    <p className="text-[22px] font-semibold text-[color:var(--md-sys-color-on-secondary-container,#1d192b)]">{value}</p>
                  </div>
                ))}
              </div>
            )}
            <div className="flex flex-col gap-3 w-full">
              <button
                onClick={() => setLocation('/progress')}
                className="w-full py-2.5 rounded-full bg-[color:var(--md-sys-color-primary,#6750a4)] text-[color:var(--md-sys-color-on-primary,#fff)] text-[14px] font-medium hover:brightness-95 transition-all cursor-pointer">
                View Progress
              </button>
              <div className="flex gap-3">
                <button
                  onClick={() => { setCurrentIndex(0); setCompleted(false); resetForNewQuestion(); }}
                  className="flex-1 py-2.5 rounded-full border border-[color:var(--md-sys-color-outline,#79747e)] text-[14px] font-medium text-[color:var(--md-sys-color-primary,#6750a4)] hover:bg-[color:var(--md-sys-color-primary,#6750a4)]/8 transition-colors cursor-pointer flex items-center justify-center gap-2">
                  <RotateCcw className="w-4 h-4" /> Practice Again
                </button>
                <button
                  onClick={() => setLocation('/practice')}
                  className="flex-1 py-2.5 rounded-full border border-[color:var(--md-sys-color-outline,#79747e)] text-[14px] font-medium text-[color:var(--md-sys-color-primary,#6750a4)] hover:bg-[color:var(--md-sys-color-primary,#6750a4)]/8 transition-colors cursor-pointer">
                  Other Modes
                </button>
              </div>
            </div>
          </motion.div>
        </div>
      </AppLayout>
    );
  }

  // ── Start / Mode Selection ─────────────────────────────────────────────
  if (!started) {
    return (
      <>
        <SEOHead title="Voice Practice | Open Interview"
          description="Practice answering interview questions with voice recording and feedback"
          canonical="https://open-interview.github.io/voice-practice" />
        <AppLayout fullWidth hideNav>
          <div className="min-h-screen bg-[color:var(--md-sys-color-background,#fffbfe)] flex items-center justify-center px-4">
            <div className="w-full max-w-sm flex flex-col items-center gap-8">
              <div className="w-24 h-24 rounded-[28px] bg-[color:var(--md-sys-color-primary-container,#eaddff)] flex items-center justify-center">
                <Mic className="w-12 h-12 text-[color:var(--md-sys-color-on-primary-container,#21005d)]" />
              </div>
              <div className="text-center">
                <h1 className="text-[22px] font-medium text-[color:var(--md-sys-color-on-surface,#1c1b1f)] mb-2">Voice Practice</h1>
                <p className="text-[14px] text-[color:var(--md-sys-color-on-surface-variant,#49454f)]">
                  Speak your answers aloud. Get instant feedback on length and delivery.
                </p>
              </div>
              <div className="grid grid-cols-2 gap-3 w-full">
                {([
                  { value: 'interview' as PracticeMode, icon: EyeOff, label: 'Interview Mode', desc: 'Answer first, then see the ideal response' },
                  { value: 'training' as PracticeMode, icon: Eye, label: 'Training Mode', desc: 'Read the answer, then practice saying it' },
                ] as const).map(({ value, icon: Icon, label, desc }) => (
                  <button key={value} onClick={() => { setMode(value); setStarted(true); }}
                    className={[
                      'flex flex-col items-center gap-3 p-5 rounded-[16px] border-2 text-center transition-all cursor-pointer',
                      mode === value
                        ? 'border-[color:var(--md-sys-color-primary,#6750a4)] bg-[color:var(--md-sys-color-primary-container,#eaddff)]'
                        : 'border-[color:var(--md-sys-color-outline-variant,#cac4d0)] hover:border-[color:var(--md-sys-color-outline,#79747e)]',
                    ].join(' ')}>
                    <Icon className="w-6 h-6 text-[color:var(--md-sys-color-primary,#6750a4)]" />
                    <div>
                      <p className="text-[14px] font-medium text-[color:var(--md-sys-color-on-surface,#1c1b1f)]">{label}</p>
                      <p className="text-[12px] text-[color:var(--md-sys-color-on-surface-variant,#49454f)] mt-1">{desc}</p>
                    </div>
                  </button>
                ))}
              </div>
              <button onClick={() => setStarted(true)}
                className="w-full py-2.5 rounded-full bg-[color:var(--md-sys-color-primary,#6750a4)] text-[color:var(--md-sys-color-on-primary,#fff)] text-[14px] font-medium hover:brightness-95 transition-all cursor-pointer">
                Start Practicing
              </button>
            </div>
          </div>
        </AppLayout>
      </>
    );
  }

  // ── Main Practice UI ───────────────────────────────────────────────────
  return (
    <>
      <SEOHead title="Voice Practice | Open Interview"
        description="Practice answering interview questions with voice recording and feedback"
        canonical="https://open-interview.github.io/voice-practice" />
      {showPermissionDialog && (
        <M3PermissionDialog
          onAllow={() => { setShowPermissionDialog(false); startRecording(); }}
          onDismiss={() => setShowPermissionDialog(false)}
        />
      )}
      <AppLayout fullWidth hideNav>
        <div className="min-h-screen bg-[color:var(--md-sys-color-background,#fffbfe)] text-[color:var(--md-sys-color-on-surface,#1c1b1f)]">

          {/* Top progress bar */}
          <M3LinearProgress value={currentIndex + 1} max={questions.length} />

          {/* Header */}
          <header className="sticky top-0 z-40 bg-[color:var(--md-sys-color-surface,#fffbfe)] border-b border-[color:var(--md-sys-color-outline-variant,#cac4d0)]">
            <div className="max-w-2xl mx-auto px-4 h-14 flex items-center gap-2">
              <button onClick={() => setLocation('/')} aria-label="Go back"
                className="min-w-[48px] w-10 min-h-[48px] h-10 flex items-center justify-center rounded-full hover:bg-[color:var(--md-sys-color-on-surface,#1c1b1f)]/8 transition-colors cursor-pointer">
                <ArrowLeft className="w-5 h-5" />
              </button>
              <span className="text-[16px] font-medium flex-1">Voice Practice</span>
              <span className="text-[14px] text-[color:var(--md-sys-color-on-surface-variant,#49454f)]">
                {currentIndex + 1} / {questions.length}
              </span>
            </div>
          </header>

          <main className="max-w-2xl mx-auto px-4 py-6 pb-32 space-y-4">
            <AnimatePresence mode="wait">
              <motion.div key={currentQuestion.id}
                initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -12 }} transition={{ duration: 0.15 }}
                className="space-y-4">

                {/* Question card — M3 elevated */}
                <div className="rounded-[16px] bg-[color:var(--md-sys-color-surface,#fffbfe)] shadow-md p-5">
                  <div className="flex items-center gap-2 mb-3">
                    <span className="text-[11px] font-medium uppercase tracking-wider text-[color:var(--md-sys-color-on-surface-variant,#49454f)]">
                      Question {currentIndex + 1}
                    </span>
                    <span className="text-[color:var(--md-sys-color-outline-variant,#cac4d0)]">•</span>
                    <span className={`px-2 py-0.5 rounded text-[11px] font-medium ${
                      currentQuestion.difficulty === 'beginner' ? 'bg-green-100 text-green-700' :
                      currentQuestion.difficulty === 'intermediate' ? 'bg-yellow-100 text-yellow-700' :
                      'bg-red-100 text-red-700'}`}>
                      {currentQuestion.difficulty}
                    </span>
                  </div>
                  {/* Title Medium question text */}
                  <h2 className="text-[16px] font-medium leading-6 text-[color:var(--md-sys-color-on-surface,#1c1b1f)]">
                    {currentQuestion.question}
                  </h2>
                  <p className="text-[12px] text-[color:var(--md-sys-color-on-surface-variant,#49454f)] mt-2 capitalize">
                    {currentQuestion.channel}
                  </p>
                  <div className="flex items-center gap-2 mt-3">
                    <button onClick={() => { setCurrentIndex(p => p - 1); resetForNewQuestion(); }}
                      disabled={currentIndex === 0}
                      className="flex items-center gap-1 px-3 py-1.5 rounded-full text-[13px] text-[color:var(--md-sys-color-primary,#6750a4)] hover:bg-[color:var(--md-sys-color-primary,#6750a4)]/8 transition-colors disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer">
                      <ChevronLeft className="w-4 h-4" /> Prev
                    </button>
                    <button onClick={() => { setCurrentIndex(p => p + 1); resetForNewQuestion(); }}
                      disabled={currentIndex === questions.length - 1}
                      className="flex items-center gap-1 px-3 py-1.5 rounded-full text-[13px] text-[color:var(--md-sys-color-primary,#6750a4)] hover:bg-[color:var(--md-sys-color-primary,#6750a4)]/8 transition-colors disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer">
                      Next <ChevronRight className="w-4 h-4" />
                    </button>
                  </div>
                  {showRevealButton && !showAnswer && (
                    <button onClick={() => setShowAnswer(true)}
                      className="w-full mt-4 py-2 rounded-full border border-[color:var(--md-sys-color-outline,#79747e)] text-[13px] font-medium text-[color:var(--md-sys-color-primary,#6750a4)] hover:bg-[color:var(--md-sys-color-primary,#6750a4)]/8 transition-colors cursor-pointer flex items-center justify-center gap-2">
                      <Eye className="w-4 h-4" /> Reveal Answer
                    </button>
                  )}
                  <AnimatePresence>
                    {showAnswer && (
                      <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        className="mt-4 p-4 rounded-[12px] bg-[color:var(--md-sys-color-surface-variant,#e7e0ec)]">
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-[13px] font-medium text-[color:var(--md-sys-color-on-surface-variant,#49454f)]">
                            {mode === 'training' ? 'Answer to Read' : 'Ideal Answer'}
                          </span>
                          <span className="text-[11px] px-2 py-0.5 rounded-full bg-[color:var(--md-sys-color-outline-variant,#cac4d0)] text-[color:var(--md-sys-color-on-surface-variant,#49454f)]">
                            {targetWords} words
                          </span>
                        </div>
                        <p className="text-[13px] leading-5 text-[color:var(--md-sys-color-on-surface-variant,#49454f)] whitespace-pre-wrap">
                          {currentQuestion.answer}
                        </p>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>

                {/* Recording controls */}
                <div className="rounded-[16px] bg-[color:var(--md-sys-color-surface,#fffbfe)] shadow-sm border border-[color:var(--md-sys-color-outline-variant,#cac4d0)] p-6">
                  <div className="flex flex-col items-center gap-5">

                    {/* Timer — Title Large, centered above FAB */}
                    <M3Timer seconds={duration} />

                    {/* Large FAB — 96dp primary action */}
                    <M3MicFAB
                      isRecording={recordingState === 'recording'}
                      onStart={handleMicClick}
                      onStop={handleMicClick}
                      disabled={!recognitionReady}
                    />

                    {/* Waveform — 20 bars */}
                    <M3Waveform isActive={recordingState === 'recording'} />

                    {/* Transcript — M3 surface card, Body Medium, auto-scrolls */}
                    <div
                      ref={transcriptBoxRef}
                      className="w-full rounded-[12px] bg-[color:var(--md-sys-color-surface-variant,#e7e0ec)] p-4 min-h-[96px] max-h-48 overflow-y-auto"
                      style={{ scrollBehavior: 'smooth' }}>
                      {transcript || interimTranscript ? (
                        <p className="text-[14px] leading-5 text-[color:var(--md-sys-color-on-surface,#1c1b1f)] whitespace-pre-wrap">
                          {transcript}
                          <span className="text-[color:var(--md-sys-color-on-surface-variant,#49454f)]">{interimTranscript}</span>
                        </p>
                      ) : (
                        <p className="text-[14px] leading-5 text-[color:var(--md-sys-color-on-surface-variant,#49454f)] italic">
                          {recordingState === 'recording' ? 'Listening… start speaking' : 'Tap the microphone to start'}
                        </p>
                      )}
                    </div>

                    {/* Word count progress */}
                    {transcript && recordingState === 'recorded' && (
                      <div className="w-full space-y-1">
                        <div className="flex justify-between text-[12px] text-[color:var(--md-sys-color-on-surface-variant,#49454f)]">
                          <span>{countWords(transcript)} words spoken</span>
                          <span>Target: {targetWords}</span>
                        </div>
                        <div className="h-1.5 rounded-full bg-[color:var(--md-sys-color-surface-variant,#e7e0ec)] overflow-hidden">
                          <div className="h-full rounded-full bg-[color:var(--md-sys-color-primary,#6750a4)] transition-all"
                            style={{ width: `${Math.min((countWords(transcript) / (targetWords || 1)) * 100, 100)}%` }} />
                        </div>
                      </div>
                    )}

                    {/* Feedback */}
                    {feedback && (
                      <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
                        className="w-full rounded-[16px] bg-[color:var(--md-sys-color-surface-variant,#e7e0ec)] p-5">
                        {/* Score dimensions — 2-col tonal metric cards */}
                        <div className="grid grid-cols-2 gap-2 mb-4">
                          {[
                            { label: 'Words', value: `${feedback.wordsSpoken}/${feedback.targetWords}` },
                            { label: 'Duration', value: `${feedback.duration}s` },
                          ].map(({ label, value }) => (
                            <div key={label}
                              className="rounded-[12px] bg-[color:var(--md-sys-color-secondary-container,#e8def8)] px-3 py-2">
                              <p className="text-[11px] text-[color:var(--md-sys-color-on-secondary-container,#1d192b)] opacity-70">{label}</p>
                              <p className="text-[16px] font-semibold text-[color:var(--md-sys-color-on-secondary-container,#1d192b)]">{value}</p>
                            </div>
                          ))}
                        </div>
                        <p className="text-[14px] leading-5 text-[color:var(--md-sys-color-on-surface-variant,#49454f)]">{feedback.message}</p>
                      </motion.div>
                    )}

                    {/* Actions */}
                    {recordingState === 'recorded' && (
                      <div className="flex gap-3 w-full">
                        <button onClick={() => resetForNewQuestion()}
                          className="flex-1 py-2.5 rounded-full border border-[color:var(--md-sys-color-outline,#79747e)] text-[14px] font-medium text-[color:var(--md-sys-color-primary,#6750a4)] hover:bg-[color:var(--md-sys-color-primary,#6750a4)]/8 transition-colors cursor-pointer flex items-center justify-center gap-2">
                          <RotateCcw className="w-4 h-4" /> Try Again
                        </button>
                        <button onClick={goToNext}
                          className="flex-1 py-2.5 rounded-full bg-[color:var(--md-sys-color-primary,#6750a4)] text-[color:var(--md-sys-color-on-primary,#fff)] text-[14px] font-medium hover:brightness-95 transition-all cursor-pointer flex items-center justify-center gap-2">
                          Next <ChevronRight className="w-4 h-4" />
                        </button>
                      </div>
                    )}
                  </div>
                </div>

              </motion.div>
            </AnimatePresence>
          </main>
        </div>
      </AppLayout>
    </>
  );
}
