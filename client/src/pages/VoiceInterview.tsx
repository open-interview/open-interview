/**
 * Voice Interview Practice Page - Redesigned
 * Modern GitHub-inspired dark theme with polished UI
 */

import { useState, useEffect, useRef, useCallback } from 'react';
import { useLocation } from 'wouter';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Mic, MicOff, Play, Square, RotateCcw, Home, ChevronRight,
  CheckCircle, XCircle, AlertCircle, Volume2, Loader2, Sparkles,
  ThumbsUp, ThumbsDown, Minus, Target, MessageSquare, Coins, Edit3,
  SkipForward, ExternalLink, Shuffle, ChevronLeft, MoreHorizontal, User,
  BarChart3, Brain, Lightbulb, Zap, Award
} from 'lucide-react';

// ── Waveform Visualizer ──────────────────────────────────────
const BAR_COUNT = 24;

function WaveformVisualizer({ isActive }: { isActive: boolean }) {
  const [heights, setHeights] = useState<number[]>(Array(BAR_COUNT).fill(3));
  const rafRef = useRef<number | null>(null);

  useEffect(() => {
    if (!isActive) {
      setHeights(Array(BAR_COUNT).fill(3));
      return;
    }
    const animate = () => {
      setHeights(prev =>
        prev.map((h, i) => {
          const target = isActive ? 8 + Math.random() * 52 : 3;
          return h + (target - h) * 0.35;
        })
      );
      rafRef.current = requestAnimationFrame(animate);
    };
    rafRef.current = requestAnimationFrame(animate);
    return () => { if (rafRef.current) cancelAnimationFrame(rafRef.current); };
  }, [isActive]);

  return (
    <div className="flex items-center justify-center gap-[3px] h-14" aria-hidden>
      {heights.map((h, i) => (
        <div
          key={i}
          style={{
            height: `${h}px`,
            background: `linear-gradient(to top, var(--color-violet-600, #7c3aed), var(--color-cyan-500, #06b6d4))`,
            opacity: isActive ? 0.85 + (i % 3) * 0.05 : 0.3,
            transition: 'height 80ms ease, opacity 300ms ease',
            borderRadius: '2px',
            width: '4px',
            flexShrink: 0,
          }}
        />
      ))}
    </div>
  );
}

// ── Recording Timer ──────────────────────────────────────────
function RecordingTimer({ isRunning }: { isRunning: boolean }) {
  const [seconds, setSeconds] = useState(0);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (isRunning) {
      setSeconds(0);
      intervalRef.current = setInterval(() => setSeconds(s => s + 1), 1000);
    } else {
      if (intervalRef.current) clearInterval(intervalRef.current);
    }
    return () => { if (intervalRef.current) clearInterval(intervalRef.current); };
  }, [isRunning]);

  const mm = String(Math.floor(seconds / 60)).padStart(2, '0');
  const ss = String(seconds % 60).padStart(2, '0');
  return <span className="font-mono text-sm tabular-nums text-foreground">{mm}:{ss}</span>;
}

// ── Keyword-highlighted Transcript ──────────────────────────
function HighlightedTranscript({ text, keywords }: { text: string; keywords: string[] }) {
  if (!keywords.length || !text) return <span>{text}</span>;
  const pattern = new RegExp(`(${keywords.map(k => k.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')).join('|')})`, 'gi');
  const parts = text.split(pattern);
  return (
    <>
      {parts.map((part, i) =>
        keywords.some(k => k.toLowerCase() === part.toLowerCase())
          ? <mark key={i} className="bg-violet-500/25 text-violet-300 rounded px-0.5 not-italic">{part}</mark>
          : <span key={i}>{part}</span>
      )}
    </>
  );
}

// ── Word Count Progress ──────────────────────────────────────
function WordCountBar({ text, target = 150 }: { text: string; target?: number }) {
  const count = text.trim() ? text.trim().split(/\s+/).length : 0;
  const pct = Math.min(count / target, 1);
  const barClass = pct >= 1 ? 'bg-[#3fb950]' : pct >= 0.5 ? 'bg-[#d29922]' : 'bg-primary';
  return (
    <div className="flex items-center gap-2 mt-2">
      <div className="flex-1 h-1 bg-muted rounded-full overflow-hidden">
        <motion.div
          animate={{ width: `${pct * 100}%` }}
          transition={{ duration: 0.2 }}
          className={`h-full rounded-full ${barClass}`}
        />
      </div>
      <span className="text-xs tabular-nums text-muted-foreground">{count} / {target}w</span>
    </div>
  );
}

// ── Circular Score Ring ──────────────────────────────────────
function ScoreRing({ score }: { score: number }) {
  const r = 44;
  const circ = 2 * Math.PI * r;
  const dash = (score / 100) * circ;
  const color = score >= 70 ? '#3fb950' : score >= 50 ? '#d29922' : '#f85149';
  return (
    <div className="relative w-28 h-28 flex items-center justify-center">
      <svg className="absolute inset-0 -rotate-90" width="112" height="112">
        <circle cx="56" cy="56" r={r} fill="none" stroke="var(--surface-2)" strokeWidth="8" />
        <motion.circle
          cx="56" cy="56" r={r} fill="none"
          stroke={color} strokeWidth="8"
          strokeLinecap="round"
          strokeDasharray={circ}
          initial={{ strokeDashoffset: circ }}
          animate={{ strokeDashoffset: circ - dash }}
          transition={{ duration: 0.8, ease: 'easeOut' }}
        />
      </svg>
      <div className="text-center">
        <div className="text-2xl font-bold text-foreground">{score}</div>
        <div className="text-[10px] text-muted-foreground">score</div>
      </div>
    </div>
  );
}
import { SEOHead } from '../components/SEOHead';
import { getAllQuestionsAsync } from '../lib/questions-loader';
import { useCredits } from '../context/CreditsContext';
import { useAchievementContext } from '../context/AchievementContext';
import { useUserPreferences } from '../hooks/use-user-preferences';
import { CreditsDisplay } from '../components/CreditsDisplay';
import { ListenButton } from '../components/ListenButton';
import { evaluateVoiceAnswer, type EvaluationResult } from '../lib/voice-evaluation';
import { DesktopSidebarWrapper } from '../components/layout/DesktopSidebarWrapper';
import { MobileBottomNav } from '../components/layout/UnifiedNav';
import { MobileHeader } from '../components/layout/MobileHeader';
import { QuestionHistoryIcon } from '../components/unified/QuestionHistory';
import type { Question } from '../types';

interface InterviewerComments {
  skip: string[];
  shuffle: string[];
  quick_answer: string[];
  long_pause: string[];
  retry: string[];
  good_score: string[];
  bad_score: string[];
  first_question: string[];
  last_question: string[];
  idle: string[];
}

type InterviewState = 'loading' | 'ready' | 'recording' | 'editing' | 'processing' | 'evaluated' | 'summary';

const isSpeechSupported = typeof window !== 'undefined' && 
  ('SpeechRecognition' in window || 'webkitSpeechRecognition' in window);

function getRandomComment(comments: string[]): string {
  return comments[Math.floor(Math.random() * comments.length)];
}

function getQuestionType(channel: string): 'technical' | 'behavioral' | 'system-design' {
  if (channel === 'behavioral' || channel === 'engineering-management') return 'behavioral';
  if (channel === 'system-design') return 'system-design';
  return 'technical';
}

export default function VoiceInterview() {
  const [, setLocation] = useLocation();
  const [state, setState] = useState<InterviewState>('loading');
  const [questions, setQuestions] = useState<Question[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [transcript, setTranscript] = useState('');
  const [interimTranscript, setInterimTranscript] = useState('');
  const [evaluation, setEvaluation] = useState<EvaluationResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [earnedCredits, setEarnedCredits] = useState<{ total: number; bonus: number } | null>(null);
  const [interviewerComment, setInterviewerComment] = useState<string | null>(null);
  const [comments, setComments] = useState<InterviewerComments | null>(null);
  const [showActions, setShowActions] = useState(false);
  const [sessionId, setSessionId] = useState<string>('voice-session-state');
  const [showAnswer, setShowAnswer] = useState(false); // Hide answer until after recording
  const [sessionScores, setSessionScores] = useState<Array<{ score: number; missed: string[] }>>([]);
  
  const recognitionRef = useRef<any>(null);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const commentTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  
  const { onVoiceInterview, config } = useCredits();
  const { trackEvent } = useAchievementContext();
  const { preferences } = useUserPreferences();

  const currentQuestion = questions[currentIndex];

  useEffect(() => {
    fetch('/data/interviewer-comments.json')
      .then(res => res.ok ? res.json() : null)
      .then(data => setComments(data))
      .catch(() => setComments(null));
  }, []);

  const showComment = useCallback((category: keyof InterviewerComments) => {
    if (!comments || !comments[category]) return;
    if (commentTimeoutRef.current) clearTimeout(commentTimeoutRef.current);
    const comment = getRandomComment(comments[category]);
    setInterviewerComment(comment);
    commentTimeoutRef.current = setTimeout(() => setInterviewerComment(null), 4000);
  }, [comments]);

  useEffect(() => {
    async function loadQuestions() {
      try {
        // Check for saved session first
        const savedData = localStorage.getItem(sessionId);
        if (savedData) {
          try {
            const sessionData = JSON.parse(savedData);
            if (sessionData.questions && sessionData.questions.length > 0) {
              setQuestions(sessionData.questions);
              setCurrentIndex(sessionData.currentIndex || 0);
              setState('ready');
              return;
            }
          } catch (e) {
            console.error('Invalid session data:', e);
            localStorage.removeItem(sessionId);
          }
        }

        // Load new questions
        const allQuestions = await getAllQuestionsAsync();
        const subscribedChannelIds = preferences.subscribedChannels;
        const suitable = allQuestions.filter((q: Question) => {
          if (!subscribedChannelIds.includes(q.channel)) return false;
          if (q.voiceSuitable === false) return false;
          if (q.voiceSuitable === true && q.voiceKeywords && q.voiceKeywords.length > 0) return true;
          return ['behavioral', 'system-design', 'sre', 'devops'].includes(q.channel) &&
            q.answer && q.answer.length > 100;
        });
        const shuffled = suitable.sort(() => Math.random() - 0.5).slice(0, 10);
        setQuestions(shuffled);
        setState('ready');
      } catch (err) {
        setError('Failed to load interview questions');
        console.error(err);
      }
    }
    loadQuestions();
  }, [preferences.subscribedChannels, sessionId]);

  useEffect(() => {
    if (state === 'ready' && currentIndex === 0 && questions.length > 0 && comments) {
      const timer = setTimeout(() => showComment('first_question'), 500);
      return () => clearTimeout(timer);
    }
  }, [state, currentIndex, questions.length, comments, showComment]);

  useEffect(() => {
    if (!isSpeechSupported) return;
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    const recognition = new SpeechRecognition();
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = 'en-US';
    
    recognition.onresult = (event: any) => {
      console.log('Speech recognition result received:', event.results.length);
      let interim = '';
      let final = '';
      for (let i = event.resultIndex; i < event.results.length; i++) {
        const result = event.results[i];
        if (result.isFinal) {
          final += result[0].transcript + ' ';
          console.log('Final transcript:', result[0].transcript);
        } else {
          interim += result[0].transcript;
          console.log('Interim transcript:', result[0].transcript);
        }
      }
      if (final) {
        setTranscript(prev => {
          const updated = prev + final;
          console.log('Updated transcript:', updated);
          return updated;
        });
      }
      setInterimTranscript(interim);
    };
    
    recognition.onerror = (event: any) => {
      console.error('Speech recognition error:', event.error);
      if (event.error === 'not-allowed') {
        setError('Microphone access denied. Please allow microphone access and try again.');
        setState('ready');
      } else if (event.error === 'no-speech') {
        console.log('No speech detected, continuing...');
      } else {
        setError(`Speech recognition error: ${event.error}`);
      }
    };
    
    recognition.onstart = () => {
      console.log('Speech recognition started');
    };
    
    recognition.onend = () => {
      console.log('Speech recognition ended, state:', state);
      if (state === 'recording') {
        try { 
          console.log('Restarting recognition...');
          recognition.start(); 
        } catch (e) { 
          console.error('Failed to restart recognition:', e);
        }
      }
    };
    
    recognitionRef.current = recognition;
    return () => { 
      try {
        recognition.stop(); 
      } catch (e) {
        console.log('Recognition already stopped');
      }
    };
  }, [state]);

  useEffect(() => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
    }
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
      if (commentTimeoutRef.current) clearTimeout(commentTimeoutRef.current);
    };
  }, [state]);

  // Space bar shortcut to toggle recording
  const startRecording = useCallback(() => {
    if (!recognitionRef.current) return;
    setTranscript('');
    setInterimTranscript('');
    setEvaluation(null);
    setError(null);
    try {
      recognitionRef.current.start();
      setState('recording');
    } catch (err) {
      setError('Failed to start recording. Please check microphone permissions.');
    }
  }, []);

  const stopRecording = useCallback(() => {
    if (!recognitionRef.current) return;
    recognitionRef.current.stop();
    setState('editing');
  }, []);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.code !== 'Space' || e.target instanceof HTMLTextAreaElement || e.target instanceof HTMLInputElement) return;
      e.preventDefault();
      if (state === 'ready') startRecording();
      else if (state === 'recording') stopRecording();
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [state, startRecording, stopRecording]);

  const submitAnswer = useCallback(() => {
    if (!currentQuestion || !transcript.trim()) {
      setError('Please provide an answer before submitting.');
      return;
    }
    setState('processing');
    setTimeout(() => {
      const questionType = getQuestionType(currentQuestion.channel);
      const result = evaluateVoiceAnswer(transcript, currentQuestion.answer, currentQuestion.voiceKeywords, questionType);
      setEvaluation(result);
      const credits = onVoiceInterview(result.verdict);
      setEarnedCredits({ total: credits.totalCredits, bonus: credits.bonusCredits });
      trackEvent({ type: 'voice_interview_completed', timestamp: new Date().toISOString() });
      if (result.score >= 60) showComment('good_score');
      else showComment('bad_score');
      setShowAnswer(true); // Reveal answer after evaluation
      setSessionScores(prev => [...prev, { score: result.score, missed: result.keyPointsMissed as string[] }]);
      setState('evaluated');
    }, 800);
  }, [transcript, currentQuestion, onVoiceInterview, showComment, trackEvent]);

  const nextQuestion = useCallback(() => {
    if (currentIndex < questions.length - 1) {
      setCurrentIndex(prev => prev + 1);
      setTranscript('');
      setInterimTranscript('');
      setEvaluation(null);
      setEarnedCredits(null);
      setShowAnswer(false); // Hide answer for next question
      setState('ready');
      saveSessionProgress();
    } else {
      // Show summary screen
      localStorage.removeItem(sessionId);
      setState('summary');
    }
  }, [currentIndex, questions.length, sessionId]);

  const previousQuestion = useCallback(() => {
    if (currentIndex > 0) {
      setCurrentIndex(prev => prev - 1);
      setTranscript('');
      setInterimTranscript('');
      setEvaluation(null);
      setEarnedCredits(null);
      setShowAnswer(false); // Hide answer for previous question
      setState('ready');
      setShowActions(false);
      saveSessionProgress();
    }
  }, [currentIndex]);

  const skipQuestion = useCallback(() => {
    if (recognitionRef.current && state === 'recording') recognitionRef.current.stop();
    if (currentIndex < questions.length - 1) {
      showComment('skip');
      setCurrentIndex(prev => prev + 1);
      setTranscript('');
      setInterimTranscript('');
      setEvaluation(null);
      setEarnedCredits(null);
      setShowAnswer(false); // Hide answer for skipped question
      setEarnedCredits(null);
      setState('ready');
      setShowActions(false);
      saveSessionProgress();
    }
  }, [currentIndex, questions.length, state, showComment]);

  const saveSessionProgress = useCallback(() => {
    if (questions.length === 0) return;
    
    const sessionData = {
      questions,
      currentIndex,
      startedAt: new Date().toISOString(),
      lastAccessedAt: new Date().toISOString(),
    };
    
    localStorage.setItem(sessionId, JSON.stringify(sessionData));
  }, [questions, currentIndex, sessionId]);

  const exitInterview = useCallback(() => {
    saveSessionProgress();
    setLocation('/');
  }, [saveSessionProgress, setLocation]);

  const goToOriginalQuestion = useCallback(() => {
    if (currentQuestion) setLocation(`/channel/${currentQuestion.channel}/${currentQuestion.id}`);
  }, [currentQuestion, setLocation]);

  const shuffleQuestions = useCallback(() => {
    showComment('shuffle');
    const shuffled = [...questions].sort(() => Math.random() - 0.5);
    setQuestions(shuffled);
    setCurrentIndex(0);
    setTranscript('');
    setInterimTranscript('');
    setEvaluation(null);
    setEarnedCredits(null);
    setState('ready');
    setShowActions(false);
  }, [questions, showComment]);

  const retryQuestion = useCallback(() => {
    showComment('retry');
    setTranscript('');
    setInterimTranscript('');
    setEvaluation(null);
    setShowAnswer(false); // Hide answer when retrying
    setState('ready');
  }, [showComment]);



  // Unsupported browser
  if (!isSpeechSupported) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <div className="max-w-md text-center">
          <div className="w-20 h-20 rounded-2xl bg-[#d29922]/20 flex items-center justify-center mx-auto mb-6">
            <AlertCircle className="w-10 h-10 text-[#d29922]" />
          </div>
          <h1 className="text-2xl font-bold text-foreground mb-3">Browser Not Supported</h1>
          <p className="text-muted-foreground mb-6">
            Voice interview requires the Web Speech API. Please use Chrome, Edge, or Safari.
          </p>
          <button
            onClick={() => setLocation('/')}
            className="px-6 py-3 bg-[#238636] text-white font-medium rounded-xl hover:bg-[#2ea043] transition-colors"
          >
            Go Home
          </button>
        </div>
      </div>
    );
  }

  // Loading
  if (state === 'loading' || questions.length === 0) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 rounded-2xl bg-[#58a6ff]/20 flex items-center justify-center mx-auto mb-4">
            <Loader2 className="w-8 h-8 animate-spin text-[#58a6ff]" />
          </div>
          <p className="text-muted-foreground">Loading interview questions...</p>
        </div>
      </div>
    );
  }

  // Error state
  if (error && !currentQuestion) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <div className="max-w-md text-center">
          <div className="w-20 h-20 rounded-2xl bg-[#f85149]/20 flex items-center justify-center mx-auto mb-6">
            <XCircle className="w-10 h-10 text-[#f85149]" />
          </div>
          <h1 className="text-2xl font-bold text-foreground mb-3">Error</h1>
          <p className="text-muted-foreground mb-6">{error}</p>
          <button
            onClick={() => setLocation('/')}
            className="px-6 py-3 bg-[#238636] text-white font-medium rounded-xl hover:bg-[#2ea043] transition-colors"
          >
            Go Home
          </button>
        </div>
      </div>
    );
  }

  // Session Summary
  if (state === 'summary') {
    const avg = sessionScores.length ? Math.round(sessionScores.reduce((s, r) => s + r.score, 0) / sessionScores.length) : 0;
    const missedAll = sessionScores.flatMap(r => r.missed);
    const missedCounts: Record<string, number> = {};
    for (const m of missedAll) missedCounts[m] = (missedCounts[m] || 0) + 1;
    const topMissed = Object.entries(missedCounts).sort((a, b) => b[1] - a[1]).slice(0, 5).map(([k]) => k);

    const handleShare = () => {
      const text = `I scored ${avg}% on a Voice Interview session on Code Reels! 🎤`;
      if (navigator.share) navigator.share({ title: 'Code Reels Voice Interview', text }).catch(() => {});
      else navigator.clipboard.writeText(text).catch(() => {});
    };

    return (
      <DesktopSidebarWrapper>
        <div className="lg:hidden"><MobileHeader title="Voice Interview" showBack={true} /></div>
        <div className="min-h-screen bg-background flex items-center justify-center p-4 pb-[calc(56px+env(safe-area-inset-bottom,0px))] lg:pb-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.93, y: 24 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
            className="max-w-lg w-full"
          >
            <div className="rounded-2xl border border-border bg-surface-1 p-8">
              <div className="flex flex-col items-center mb-8">
                <ScoreRing score={avg} />
                <h2 className="text-xl font-bold text-foreground mt-4">Session Complete!</h2>
                <p className="text-sm text-muted-foreground mt-1">{questions.length} questions answered</p>
              </div>

              <div className="grid grid-cols-3 gap-3 mb-8">
                <div className="bg-surface-0 rounded-xl p-4 text-center border border-border">
                  <div className="text-2xl font-bold text-foreground">{questions.length}</div>
                  <div className="text-xs text-muted-foreground mt-1">Questions</div>
                </div>
                <div className="bg-surface-0 rounded-xl p-4 text-center border border-border">
                  <div className="text-2xl font-bold text-[#3fb950]">{sessionScores.filter(s => s.score >= 60).length}</div>
                  <div className="text-xs text-muted-foreground mt-1">Passed</div>
                </div>
                <div className="bg-surface-0 rounded-xl p-4 text-center border border-border">
                  <div className="text-2xl font-bold text-[#f85149]">{sessionScores.filter(s => s.score < 60).length}</div>
                  <div className="text-xs text-muted-foreground mt-1">Missed</div>
                </div>
              </div>

              {topMissed.length > 0 && (
                <div className="mb-8">
                  <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3 flex items-center gap-1.5">
                    <Brain className="w-3.5 h-3.5" /> Top missed concepts
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {topMissed.map(m => (
                      <span key={m} className="px-2.5 py-1 bg-[#f85149]/10 border border-[#f85149]/20 rounded-full text-xs text-[#f85149]">{m}</span>
                    ))}
                  </div>
                </div>
              )}

              <div className="flex gap-3">
                <button onClick={handleShare} className="flex-1 flex items-center justify-center gap-2 px-4 py-3 border border-border text-muted-foreground hover:text-foreground hover:border-muted-foreground rounded-xl transition-colors text-sm">
                  <ExternalLink className="w-4 h-4" /> Share
                </button>
                <button onClick={() => { setSessionScores([]); setCurrentIndex(0); setTranscript(''); setEvaluation(null); setState('ready'); }}
                  className="flex-1 flex items-center justify-center gap-2 px-4 py-3 border border-border text-muted-foreground hover:text-foreground hover:border-muted-foreground rounded-xl transition-colors text-sm">
                  <RotateCcw className="w-4 h-4" /> Again
                </button>
                <button onClick={() => setLocation('/')}
                  className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-[#238636] text-white font-medium rounded-xl hover:bg-[#2ea043] transition-colors text-sm">
                  <Home className="w-4 h-4" /> Home
                </button>
              </div>
            </div>
          </motion.div>
        </div>
        <MobileBottomNav />
      </DesktopSidebarWrapper>
    );
  }

  const progress = ((currentIndex + 1) / questions.length) * 100;

  return (
    <>
      <SEOHead
        title="Voice Interview Practice | Code Reels"
        description="Practice answering interview questions out loud with AI-powered feedback"
        canonical="https://open-interview.github.io/voice-interview"
      />

      <DesktopSidebarWrapper>
      <div className="lg:hidden"><MobileHeader title="Voice Interview" showBack={true} /></div>
      {/* iPhone 13 FIX: Ensure content fits within viewport with safe areas */}
      <div className="min-h-screen bg-background text-foreground overflow-x-hidden w-full pb-[calc(56px+env(safe-area-inset-bottom,0px))] lg:pb-0">
        {/* Header - COMPACT */}
        <header className="hidden lg:block sticky top-0 z-50 border-b border-border bg-background/95 backdrop-blur-md">
          <div className="max-w-4xl mx-auto px-3 h-14 flex items-center justify-between w-full" style={{ maxWidth: '100vw' }}>
            <div className="flex items-center gap-3">
              <button
                onClick={exitInterview}
                className="p-1.5 hover:bg-muted rounded-lg transition-colors"
                title="Exit and save progress"
              >
                <Home className="w-4 h-4 text-muted-foreground" />
              </button>
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-[#f85149] to-[#ff7b72] flex items-center justify-center">
                  <Mic className="w-4 h-4 text-white" />
                </div>
                <div>
                  <h1 className="font-semibold text-foreground text-sm">Voice Interview</h1>
                  <p className="text-[10px] text-muted-foreground">
                    Q{currentIndex + 1}/{questions.length}
                  </p>
                </div>
              </div>
            </div>
            
            <div className="flex items-center gap-2">
              <button
                onClick={() => setLocation('/voice-session')}
                className="hidden sm:flex items-center gap-1.5 px-2.5 py-1 text-xs bg-muted text-muted-foreground hover:text-foreground rounded-lg border border-border hover:border-[#58a6ff]/50 transition-all"
              >
                <Target className="w-3.5 h-3.5" />
                Sessions
              </button>
              <CreditsDisplay compact onClick={() => setLocation('/profile')} />
              {currentQuestion?.id && (
                <QuestionHistoryIcon 
                  questionId={currentQuestion.id} 
                  questionType="question"
                  size="sm"
                />
              )}
            </div>
          </div>
          
          {/* Progress Bar */}
          <div className="max-w-4xl mx-auto px-3 pb-2 w-full" style={{ maxWidth: '100vw' }}>
            <div className="h-1 bg-muted rounded-full overflow-hidden">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${progress}%` }}
                className="h-full bg-gradient-to-r from-[#58a6ff] to-[#a371f7] rounded-full"
              />
            </div>
          </div>
        </header>

        {/* Main Content */}
        <main className="max-w-4xl mx-auto px-4 py-6 w-full overflow-x-hidden" style={{ maxWidth: '100vw' }}>

          {/* Question Card */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="rounded-2xl border border-border bg-surface-1 overflow-hidden mb-6 w-full"
            style={{ maxWidth: '100%' }}
          >
            <div className="p-6">
              <div className="flex items-start justify-between gap-4 mb-4">
                <div className="flex items-start gap-4 flex-1">
                  <div className="p-2.5 rounded-xl bg-[#58a6ff]/10 flex-shrink-0">
                    <MessageSquare className="w-5 h-5 text-[#58a6ff]" />
                  </div>
                  <h2 className="text-lg font-medium text-foreground leading-relaxed">{currentQuestion?.question}</h2>
                </div>
                <button
                  onClick={goToOriginalQuestion}
                  className="flex items-center gap-1.5 px-3 py-1.5 text-xs text-muted-foreground hover:text-[#58a6ff] hover:bg-muted rounded-lg transition-colors flex-shrink-0"
                >
                  <ExternalLink className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">View Details</span>
                </button>
              </div>
              
              {/* Question Controls */}
              <div className="flex items-center justify-between pt-4 border-t border-border/50">
                <div className="flex items-center gap-2">
                  {/* Prev / Counter / Next */}
                  <button
                    onClick={previousQuestion}
                    disabled={currentIndex === 0}
                    className="flex items-center gap-0.5 px-2 py-1 text-sm text-muted-foreground hover:text-foreground border border-border rounded-lg transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
                  >
                    <ChevronLeft className="w-3.5 h-3.5" />
                    Prev
                  </button>
                  <span className="text-sm text-muted-foreground tabular-nums">{currentIndex + 1} / {questions.length}</span>
                  <button
                    onClick={nextQuestion}
                    disabled={currentIndex >= questions.length - 1}
                    className="flex items-center gap-0.5 px-2 py-1 text-sm text-muted-foreground hover:text-foreground border border-border rounded-lg transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
                  >
                    Next
                    <ChevronRight className="w-3.5 h-3.5" />
                  </button>
                  {/* Actions Dropdown */}
                  <div className="relative">
                    <button
                      onClick={() => setShowActions(!showActions)}
                      className="p-1.5 text-muted-foreground hover:text-foreground hover:bg-muted rounded-lg transition-colors"
                    >
                      <MoreHorizontal className="w-4 h-4" />
                    </button>
                    
                    <AnimatePresence>
                      {showActions && (
                        <motion.div
                          initial={{ opacity: 0, y: -5 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, y: -5 }}
                          className="absolute left-0 top-full mt-1 bg-surface-1 border border-border rounded-xl shadow-xl py-1 z-10 min-w-[160px]"
                        >
                          <button
                            onClick={previousQuestion}
                            disabled={currentIndex === 0}
                            className="w-full flex items-center gap-2.5 px-3 py-2 text-sm text-muted-foreground hover:text-foreground hover:bg-muted transition-colors disabled:opacity-30"
                          >
                            <ChevronLeft className="w-4 h-4" />
                            Previous
                          </button>
                          <button
                            onClick={skipQuestion}
                            disabled={currentIndex >= questions.length - 1}
                            className="w-full flex items-center gap-2.5 px-3 py-2 text-sm text-muted-foreground hover:text-foreground hover:bg-muted transition-colors disabled:opacity-30"
                          >
                            <SkipForward className="w-4 h-4" />
                            Skip Question
                          </button>
                          <button
                            onClick={shuffleQuestions}
                            className="w-full flex items-center gap-2.5 px-3 py-2 text-sm text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
                          >
                            <Shuffle className="w-4 h-4" />
                            Shuffle All
                          </button>
                          <div className="border-t border-border my-1" />
                          <button
                            onClick={goToOriginalQuestion}
                            className="w-full flex items-center gap-2.5 px-3 py-2 text-sm text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
                          >
                            <ExternalLink className="w-4 h-4" />
                            View Full Question
                          </button>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                </div>
                
                <div className="flex items-center gap-3">
                  <ListenButton text={currentQuestion?.question || ''} label="Listen" size="sm" />
                  {currentQuestion?.voiceKeywords && currentQuestion.voiceKeywords.length > 0 && (
                    <span className="text-xs text-muted-foreground">
                      {currentQuestion.voiceKeywords.length} key terms
                    </span>
                  )}
                </div>
              </div>
            </div>
            
            {error && (
              <div className="mx-6 mb-6 p-4 bg-[#f85149]/10 border border-[#f85149]/30 rounded-xl text-[#f85149] text-sm">
                {error}
              </div>
            )}
          </motion.div>

          {/* Tips & Keywords Panel - fills dead space when in 'ready' state */}
          {state === 'ready' && currentQuestion && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="rounded-2xl border border-border bg-surface-1 p-5 mb-6 w-full"
            >
              <div className="flex items-center gap-2 mb-4">
                <Lightbulb className="w-4 h-4 text-[#d29922]" />
                <span className="text-sm font-semibold text-foreground">How to answer well</span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-4">
                {[
                  { tip: 'State your approach first, then explain the details' },
                  { tip: 'Use concrete examples or numbers when possible' },
                  { tip: 'Mention trade-offs — interviewers love nuanced answers' },
                  { tip: 'Summarize your answer at the end' },
                ].map((item, i) => (
                  <div key={i} className="flex items-start gap-2 text-xs text-muted-foreground">
                    <ChevronRight className="w-3.5 h-3.5 flex-shrink-0 mt-0.5 text-[#58a6ff]" />
                    <span>{item.tip}</span>
                  </div>
                ))}
              </div>
              {currentQuestion.voiceKeywords && currentQuestion.voiceKeywords.length > 0 && (
                <div>
                  <div className="text-xs text-muted-foreground mb-2 flex items-center gap-1.5">
                    <Brain className="w-3.5 h-3.5" />
                    Key terms to mention:
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {currentQuestion.voiceKeywords.map((kw: string) => (
                      <span key={kw} className="px-2 py-0.5 bg-[#58a6ff]/10 border border-[#58a6ff]/20 rounded-full text-[11px] text-[#58a6ff]">
                        {kw}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </motion.div>
          )}

          {/* Interviewer Comment */}
          <AnimatePresence>
            {interviewerComment && (
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0, transition: { duration: 0.25, ease: 'easeOut' } }}
                exit={{ opacity: 0, x: 20, transition: { duration: 0.15, ease: 'easeIn' } }}
                className="mb-6 flex items-start gap-3"
              >
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[#a371f7] to-[#f778ba] flex items-center justify-center flex-shrink-0">
                  <User className="w-5 h-5 text-white" />
                </div>
                <div className="flex-1 p-4 bg-muted border border-border rounded-2xl rounded-tl-none">
                  <p className="text-sm italic text-muted-foreground">"{interviewerComment}"</p>
                  <p className="text-[10px] text-muted-foreground mt-2">— Your Interviewer</p>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Recording Interface */}
          <div
            className="rounded-2xl border bg-surface-1 p-6 mb-6 w-full overflow-hidden transition-colors duration-300"
            style={{
              maxWidth: '100%',
              borderColor: state === 'recording' ? 'rgba(248,81,73,0.5)' : state === 'evaluated' ? 'rgba(63,185,80,0.4)' : 'var(--color-border)',
              boxShadow: state === 'recording' ? '0 0 0 1px rgba(248,81,73,0.2)' : 'none',
            }}
          >

            {/* State Header */}
            <div className="flex items-center justify-between mb-5">
              <AnimatePresence mode="wait">
                {state === 'ready' && (
                  <motion.div key="ready" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.2 }}
                    className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center">
                      <Mic className="w-4 h-4 text-muted-foreground" />
                    </div>
                    <span className="text-sm font-medium text-muted-foreground">Ready</span>
                  </motion.div>
                )}
                {state === 'recording' && (
                  <motion.div key="recording" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.2 }}
                    className="flex items-center gap-3">
                    <span className="w-3 h-3 bg-[#f85149] rounded-full animate-pulse shadow-[0_0_8px_#f85149]" />
                    <span className="text-sm font-semibold text-[#f85149]">Listening...</span>
                    <RecordingTimer isRunning={state === 'recording'} />
                  </motion.div>
                )}
                {state === 'editing' && (
                  <motion.div key="editing" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.2 }}
                    className="flex items-center gap-2">
                    <Edit3 className="w-4 h-4 text-[#d29922]" />
                    <span className="text-sm font-medium text-[#d29922]">Review & Edit</span>
                  </motion.div>
                )}
                {state === 'processing' && (
                  <motion.div key="processing" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.2 }}
                    className="flex items-center gap-2">
                    <Loader2 className="w-4 h-4 animate-spin text-[#58a6ff]" />
                    <span className="text-sm font-medium text-[#58a6ff]">Processing...</span>
                  </motion.div>
                )}
                {state === 'evaluated' && (
                  <motion.div key="evaluated" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.2 }}
                    className="flex items-center gap-2">
                    <CheckCircle className="w-4 h-4 text-[#3fb950]" />
                    <span className="text-sm font-medium text-[#3fb950]">Evaluated</span>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Word count when transcript exists */}
              {transcript && state !== 'evaluated' && (
                <span className="text-xs text-muted-foreground tabular-nums">
                  {transcript.trim().split(/\s+/).filter(Boolean).length} words
                </span>
              )}
            </div>

            {/* Waveform — always visible; animated when recording, flat when idle */}
            {state !== 'evaluated' && (
              <div className="mb-5">
                <WaveformVisualizer isActive={state === 'recording'} />
              </div>
            )}

            {/* Transcript Display */}
            {(state === 'recording' || state === 'editing' || transcript) && state !== 'evaluated' && (
              <div className="mb-6">
                {state === 'editing' ? (
                  <>
                    <textarea
                      value={transcript}
                      onChange={(e) => setTranscript(e.target.value)}
                      className="w-full p-4 bg-background border border-[#d29922]/30 rounded-xl min-h-[150px] max-h-[300px] text-sm text-foreground resize-y focus:outline-none focus:ring-2 focus:ring-[#d29922]/50 focus:border-[#d29922]"
                      placeholder="Edit your transcribed answer here..."
                    />
                    <WordCountBar text={transcript} />
                  </>
                ) : (
                  <>
                    <div className="p-4 bg-background rounded-xl min-h-[100px] max-h-[200px] overflow-y-auto border border-border">
                      {transcript || interimTranscript ? (
                        <p className="text-sm text-foreground whitespace-pre-wrap leading-relaxed">
                          <HighlightedTranscript text={transcript} keywords={currentQuestion?.voiceKeywords || []} />
                          <span className="text-muted-foreground">{interimTranscript}</span>
                          {state === 'recording' && <span className="animate-pulse text-[#58a6ff]">|</span>}
                        </p>
                      ) : (
                        <p className="text-sm text-muted-foreground italic">
                          {state === 'recording'
                            ? 'Start speaking... Your words will appear here.'
                            : 'No transcript yet'}
                        </p>
                      )}
                    </div>
                    {transcript && <WordCountBar text={transcript} />}
                  </>
                )}
                {state === 'editing' && (
                  <p className="text-xs text-muted-foreground mt-2 flex items-center gap-1.5">
                    <Lightbulb className="w-3.5 h-3.5 text-[#d29922]" />
                    Fix any transcription errors before submitting
                  </p>
                )}
              </div>
            )}

            {/* Recording Controls */}
            <div className="flex flex-col items-center gap-3">
              <div className="flex items-center justify-center gap-4">
              {state === 'ready' && (
                <motion.button
                  whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}
                  onClick={startRecording}
                  className="flex items-center gap-3 px-8 py-4 bg-gradient-to-r from-[#f85149] to-[#ff7b72] text-white font-semibold rounded-2xl shadow-lg shadow-[#f85149]/20 transition-opacity hover:opacity-90"
                >
                  <Mic className="w-5 h-5" />
                  Start Recording
                </motion.button>
              )}

              {state === 'recording' && (
                <div className="flex items-center gap-3">
                  <motion.button
                    whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}
                    onClick={stopRecording}
                    className="flex items-center gap-3 px-8 py-4 bg-[#f85149] text-white font-semibold rounded-2xl hover:bg-[#da3633] transition-colors"
                  >
                    <Square className="w-5 h-5" />
                    Stop
                  </motion.button>
                </div>
              )}

              {state === 'editing' && (
                <div className="flex gap-3">
                  <button
                    onClick={retryQuestion}
                    className="flex items-center gap-2 px-5 py-3 border border-border text-muted-foreground hover:text-foreground hover:border-muted-foreground rounded-xl transition-colors"
                  >
                    <RotateCcw className="w-4 h-4" />
                    Re-record
                  </button>
                  <motion.button
                    whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
                    onClick={submitAnswer}
                    disabled={!transcript.trim()}
                    className="flex items-center gap-3 px-8 py-3 bg-[#238636] text-white font-semibold rounded-xl hover:bg-[#2ea043] transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <CheckCircle className="w-5 h-5" />
                    Submit Answer
                  </motion.button>
                </div>
              )}

              {state === 'evaluated' && (
                <div className="flex gap-3">
                  <button
                    onClick={retryQuestion}
                    className="flex items-center gap-2 px-5 py-3 border border-border text-muted-foreground hover:text-foreground hover:border-muted-foreground rounded-xl transition-colors"
                  >
                    <RotateCcw className="w-4 h-4" />
                    Try Again
                  </button>
                  <motion.button
                    whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
                    onClick={nextQuestion}
                    className="flex items-center gap-2 px-6 py-3 bg-[#238636] text-white font-semibold rounded-xl hover:bg-[#2ea043] transition-colors"
                  >
                    {currentIndex < questions.length - 1 ? 'Next Question' : 'View Results'}
                    <ChevronRight className="w-4 h-4" />
                  </motion.button>
                </div>
              )}
            </div>
            {(state === 'ready' || state === 'recording') && (
              <p className="text-center text-[10px] text-muted-foreground mt-3">
                Press <kbd className="px-1.5 py-0.5 bg-muted border border-border rounded text-[10px] font-mono">Space</kbd> to {state === 'recording' ? 'stop' : 'start'}
              </p>
            )}
            </div>
          </div>

          {/* Evaluation Results */}
          <AnimatePresence>
            {evaluation && (
              <motion.div
                initial={{ opacity: 0, y: 24 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
                className="space-y-4"
              >
                {/* Credits Earned Banner */}
                {earnedCredits && (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: 0.1 }}
                    className="p-4 bg-gradient-to-r from-[#d29922]/20 to-[#f1c40f]/20 border border-[#d29922]/30 rounded-2xl flex items-center justify-between"
                  >
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 rounded-xl bg-[#d29922]/20 flex items-center justify-center">
                        <Coins className="w-6 h-6 text-[#d29922]" />
                      </div>
                      <div>
                        <div className="font-bold text-[#d29922] text-lg">+{earnedCredits.total} Credits Earned!</div>
                        <div className="text-xs text-muted-foreground">
                          {earnedCredits.bonus > 0
                            ? `${config.VOICE_ATTEMPT} base + ${earnedCredits.bonus} success bonus`
                            : 'Thanks for practicing!'}
                        </div>
                      </div>
                    </div>
                    <Award className="w-8 h-8 text-[#d29922]/50" />
                  </motion.div>
                )}

                {/* Verdict Card — circular score ring */}
                <motion.div
                  initial={{ opacity: 0, scale: 0.97 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 0.05, duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
                  className={`p-6 rounded-2xl border ${getVerdictStyle(evaluation.verdict)}`}
                >
                  <div className="flex items-center gap-6 mb-4">
                    <ScoreRing score={evaluation.score} />
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-1">
                        <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${getVerdictBgStyle(evaluation.verdict)}`}>
                          {getVerdictIcon(evaluation.verdict)}
                        </div>
                        <h3 className="font-bold text-xl text-foreground">{getVerdictLabel(evaluation.verdict)}</h3>
                      </div>
                      <p className="text-sm text-muted-foreground leading-relaxed">{evaluation.feedback}</p>
                    </div>
                  </div>
                </motion.div>

                {/* Key Points — checkmarks & X marks */}
                <motion.div
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.15 }}
                  className="grid md:grid-cols-2 gap-4"
                >
                  <div className="p-5 rounded-2xl bg-[#238636]/10 border border-[#238636]/30">
                    <h4 className="font-semibold text-[#3fb950] flex items-center gap-2 mb-4">
                      <CheckCircle className="w-5 h-5" />
                      Covered ({evaluation.keyPointsCovered.length})
                    </h4>
                    <ul className="space-y-2">
                      {evaluation.keyPointsCovered.map((point, i) => (
                        <li key={i} className="text-sm flex items-start gap-2 text-muted-foreground">
                          <span className="text-[#3fb950] mt-0.5 flex-shrink-0">✓</span>
                          <span>
                            {typeof point === 'object' && 'concept' in point
                              ? `${point.concept}${point.confidence !== 'exact' ? ` (as "${point.matchedAs}")` : ''}`
                              : point}
                          </span>
                        </li>
                      ))}
                      {evaluation.keyPointsCovered.length === 0 && (
                        <li className="text-sm text-muted-foreground">No key concepts identified</li>
                      )}
                    </ul>
                  </div>

                  <div className="p-5 rounded-2xl bg-[#f85149]/10 border border-[#f85149]/30">
                    <h4 className="font-semibold text-[#f85149] flex items-center gap-2 mb-4">
                      <XCircle className="w-5 h-5" />
                      Missed ({evaluation.keyPointsMissed.length})
                    </h4>
                    <ul className="space-y-2">
                      {evaluation.keyPointsMissed.map((point, i) => (
                        <li key={i} className="text-sm flex items-start gap-2 text-muted-foreground">
                          <span className="text-[#f85149] mt-0.5 flex-shrink-0">✗</span>
                          <span>{point}</span>
                        </li>
                      ))}
                      {evaluation.keyPointsMissed.length === 0 && (
                        <li className="text-sm text-muted-foreground">Great job covering all concepts!</li>
                      )}
                    </ul>
                  </div>
                </motion.div>

                {/* Multi-Dimensional Scores */}
                {evaluation.scores && (
                  <motion.div
                    initial={{ opacity: 0, y: 12 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.2 }}
                    className="p-6 rounded-2xl border border-border bg-surface-1"
                  >
                    <h4 className="font-semibold text-foreground flex items-center gap-2 mb-5">
                      <BarChart3 className="w-5 h-5 text-[#58a6ff]" />
                      Detailed Analysis
                    </h4>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      <ScoreDimension label="Technical" score={evaluation.scores.technical} icon={<Brain className="w-4 h-4" />} description="Accuracy & depth" />
                      <ScoreDimension label="Completeness" score={evaluation.scores.completeness} icon={<Target className="w-4 h-4" />} description="Coverage" />
                      <ScoreDimension label="Structure" score={evaluation.scores.structure} icon={<Lightbulb className="w-4 h-4" />} description="Organization" />
                      <ScoreDimension label="Communication" score={evaluation.scores.communication} icon={<MessageSquare className="w-4 h-4" />} description="Clarity" />
                    </div>

                    {evaluation.structureAnalysis && (
                      <div className="mt-5 pt-5 border-t border-border flex flex-wrap gap-2">
                        {evaluation.structureAnalysis.hasIntroduction && (
                          <span className="px-3 py-1.5 text-xs bg-[#238636]/20 text-[#3fb950] rounded-lg font-medium">✓ Introduction</span>
                        )}
                        {evaluation.structureAnalysis.hasExamples && (
                          <span className="px-3 py-1.5 text-xs bg-[#238636]/20 text-[#3fb950] rounded-lg font-medium">✓ Examples</span>
                        )}
                        {evaluation.structureAnalysis.hasConclusion && (
                          <span className="px-3 py-1.5 text-xs bg-[#238636]/20 text-[#3fb950] rounded-lg font-medium">✓ Conclusion</span>
                        )}
                        {evaluation.structureAnalysis.usesSTAR && (
                          <span className="px-3 py-1.5 text-xs bg-[#a371f7]/20 text-[#a371f7] rounded-lg font-medium">STAR Method</span>
                        )}
                        {evaluation.fluencyMetrics && evaluation.fluencyMetrics.fillerWordCount > 3 && (
                          <span className="px-3 py-1.5 text-xs bg-[#d29922]/20 text-[#d29922] rounded-lg font-medium">
                            {evaluation.fluencyMetrics.fillerWordCount} filler words
                          </span>
                        )}
                      </div>
                    )}
                  </motion.div>
                )}

                {/* Strengths & Improvements */}
                <motion.div
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.25 }}
                  className="grid md:grid-cols-2 gap-4"
                >
                  <div className="p-5 rounded-2xl border border-border bg-surface-1">
                    <h4 className="font-semibold text-foreground flex items-center gap-2 mb-4">
                      <Sparkles className="w-5 h-5 text-[#f1c40f]" />
                      Strengths
                    </h4>
                    <ul className="space-y-2">
                      {evaluation.strengths.map((s, i) => (
                        <li key={i} className="text-sm text-muted-foreground flex items-start gap-2">
                          <Zap className="w-4 h-4 text-[#f1c40f] flex-shrink-0 mt-0.5" />
                          {s}
                        </li>
                      ))}
                    </ul>
                  </div>

                  <div className="p-5 rounded-2xl border border-border bg-surface-1">
                    <h4 className="font-semibold text-foreground flex items-center gap-2 mb-4">
                      <Target className="w-5 h-5 text-[#58a6ff]" />
                      Areas to Improve
                    </h4>
                    <ul className="space-y-2">
                      {evaluation.improvements.map((s, i) => (
                        <li key={i} className="text-sm text-muted-foreground flex items-start gap-2">
                          <ChevronRight className="w-4 h-4 text-[#58a6ff] flex-shrink-0 mt-0.5" />
                          {s}
                        </li>
                      ))}
                    </ul>
                  </div>
                </motion.div>

                {/* Ideal Answer Reference */}
                {showAnswer && (
                  <motion.details
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.3 }}
                    className="p-5 rounded-2xl border border-border bg-surface-1 group"
                  >
                    <summary className="cursor-pointer font-semibold text-foreground flex items-center gap-2 list-none">
                      <Volume2 className="w-5 h-5 text-[#a371f7]" />
                      View Ideal Answer
                      <ChevronRight className="w-4 h-4 text-muted-foreground ml-auto transition-transform group-open:rotate-90" />
                    </summary>
                    <div className="mt-4 pt-4 border-t border-border space-y-3">
                      <div className="flex justify-end">
                        <ListenButton text={currentQuestion?.answer || ''} label="Listen to Answer" size="sm" />
                      </div>
                      <div className="text-sm text-muted-foreground whitespace-pre-wrap leading-relaxed bg-background p-4 rounded-xl">
                        {currentQuestion?.answer}
                      </div>
                    </div>
                  </motion.details>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </main>
      </div>
      <MobileBottomNav />
      </DesktopSidebarWrapper>
    </>
  );
}

// Score dimension component
function ScoreDimension({ label, score, icon, description }: { 
  label: string; score: number; icon: React.ReactNode; description: string;
}) {
  const getColor = (s: number) => {
    if (s >= 70) return 'text-[#3fb950]';
    if (s >= 50) return 'text-[#d29922]';
    if (s >= 30) return 'text-[#f0883e]';
    return 'text-[#f85149]';
  };
  
  const getBgColor = (s: number) => {
    if (s >= 70) return 'bg-[#238636]';
    if (s >= 50) return 'bg-[#d29922]';
    if (s >= 30) return 'bg-[#f0883e]';
    return 'bg-[#f85149]';
  };
  
  return (
    <div className="text-center p-4 rounded-xl bg-background border border-border">
      <div className={`flex items-center justify-center gap-1.5 mb-2 ${getColor(score)}`}>
        {icon}
        <span className="text-xs font-medium">{label}</span>
      </div>
      <div className="text-2xl font-bold text-foreground">{score}%</div>
      <div className="h-1.5 bg-muted rounded-full overflow-hidden mt-2">
        <motion.div
          initial={{ scaleX: 0 }}
          animate={{ scaleX: score / 100 }}
          transition={{ duration: 0.25, delay: 0.1, ease: 'easeOut' }}
          style={{ transformOrigin: 'left' }}
          className={`h-full ${getBgColor(score)}`}
        />
      </div>
      <div className="text-[10px] text-muted-foreground mt-2">{description}</div>
    </div>
  );
}

// Helper functions
function getVerdictStyle(verdict: EvaluationResult['verdict']): string {
  switch (verdict) {
    case 'strong-hire': return 'bg-[#238636]/20 border-[#238636]/50';
    case 'hire': return 'bg-[#3fb950]/20 border-[#3fb950]/50';
    case 'lean-hire': return 'bg-[#d29922]/20 border-[#d29922]/50';
    case 'lean-no-hire': return 'bg-[#f0883e]/20 border-[#f0883e]/50';
    case 'no-hire': return 'bg-[#f85149]/20 border-[#f85149]/50';
  }
}

function getVerdictBgStyle(verdict: EvaluationResult['verdict']): string {
  switch (verdict) {
    case 'strong-hire':
    case 'hire': return 'bg-[#238636]/30';
    case 'lean-hire': return 'bg-[#d29922]/30';
    case 'lean-no-hire':
    case 'no-hire': return 'bg-[#f85149]/30';
  }
}

function getVerdictIcon(verdict: EvaluationResult['verdict']) {
  switch (verdict) {
    case 'strong-hire':
    case 'hire': return <ThumbsUp className="w-7 h-7 text-[#3fb950]" />;
    case 'lean-hire': return <Minus className="w-7 h-7 text-[#d29922]" />;
    case 'lean-no-hire':
    case 'no-hire': return <ThumbsDown className="w-7 h-7 text-[#f85149]" />;
  }
}

function getVerdictLabel(verdict: EvaluationResult['verdict']): string {
  switch (verdict) {
    case 'strong-hire': return 'Strong Hire';
    case 'hire': return 'Hire';
    case 'lean-hire': return 'Lean Hire';
    case 'lean-no-hire': return 'Lean No Hire';
    case 'no-hire': return 'No Hire';
  }
}

function getScoreBarColor(_score: number): string { return ''; }
