/**
 * Voice Session
 * Pure black background, neon accents, glassmorphism
 */

import { useState, useEffect, useRef, useCallback } from 'react';
import { useLocation } from 'wouter';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Home, Target, Play, CheckCircle, XCircle, AlertCircle,
  Loader2, RotateCcw, ArrowRight, Share2, RefreshCw
} from 'lucide-react';
import { SEOHead } from '../components/SEOHead';
import { getAllQuestionsAsync } from '../lib/questions-loader';
import { useCredits } from '../context/CreditsContext';
import { useAchievementContext } from '../context/AchievementContext';
import { useUserPreferences } from '../hooks/use-user-preferences';
import { CreditsDisplay } from '../components/CreditsDisplay';
import { AppLayout } from '../components/layout/AppLayout';
import { Card, Button, Microphone, Progress } from '../components/practice-ui';
import {
  type VoiceSession,
  type SessionState,
  type SessionResult,
  loadVoiceSessions,
  generateSessionsFromQuestions,
  buildSessionQuestions,
  startSession,
  beginSession,
  submitAnswer,
  nextQuestion,
  getCurrentQuestion,
  completeSession,
  saveSessionState,
  loadSessionState,
  clearSessionState,
  saveSessionToHistory
} from '../lib/voice-interview-session';
import type { Question } from '../types';

type PageState = 'loading' | 'select' | 'intro' | 'recording' | 'editing' | 'feedback' | 'results';

const isSpeechSupported = typeof window !== 'undefined' &&
  ('SpeechRecognition' in window || 'webkitSpeechRecognition' in window);

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
  const color = pct >= 1 ? '#00ff88' : pct >= 0.5 ? '#ffd700' : '#00d4ff';
  return (
    <div className="flex items-center gap-2 mt-2">
      <div className="flex-1 h-1.5 rounded-full overflow-hidden" style={{ boxShadow: 'inset 0 1px 2px rgba(0,0,0,0.2)' }}>
        <motion.div
          animate={{ width: `${pct * 100}%` }}
          transition={{ type: 'spring', stiffness: 300, damping: 30 }}
          className="h-full rounded-full"
          style={{ 
            background: color,
            boxShadow: pct >= 1 ? '0 0 8px rgba(0,255,136,0.5)' : 'none'
          }}
        />
      </div>
      <span className="text-xs tabular-nums text-muted-foreground">{count} / {target}w</span>
    </div>
  );
}

// ── Waveform Visualizer ──────────────────────────────────────
const BAR_COUNT = 28;

function WaveformVisualizer({ isActive }: { isActive: boolean }) {
  const [heights, setHeights] = useState<number[]>(Array(BAR_COUNT).fill(3));
  const rafRef = useRef<number | null>(null);

  useEffect(() => {
    if (!isActive) {
      setHeights(Array(BAR_COUNT).fill(3));
      return;
    }
    const animate = () => {
      setHeights(prev => prev.map(h => {
        const target = 8 + Math.random() * 48;
        return h + (target - h) * 0.35;
      }));
      rafRef.current = requestAnimationFrame(animate);
    };
    rafRef.current = requestAnimationFrame(animate);
    return () => { if (rafRef.current) cancelAnimationFrame(rafRef.current); };
  }, [isActive]);

  return (
    <div className="flex items-center justify-center gap-[3px] h-14" aria-hidden>
      {heights.map((h, i) => (
        <div key={i} style={{
          height: `${h}px`,
          background: 'linear-gradient(to top, #7c3aed, #06b6d4)',
          opacity: isActive ? 0.8 : 0.25,
          transition: 'height 80ms ease, opacity 300ms ease',
          borderRadius: '2px',
          width: '4px',
          flexShrink: 0,
        }} />
      ))}
    </div>
  );
}

// ── Recording Timer ──────────────────────────────────────────
function RecordingTimer({ isRunning }: { isRunning: boolean }) {
  const [seconds, setSeconds] = useState(0);
  const ref = useRef<NodeJS.Timeout | null>(null);
  useEffect(() => {
    if (isRunning) {
      setSeconds(0);
      ref.current = setInterval(() => setSeconds(s => s + 1), 1000);
    } else {
      if (ref.current) clearInterval(ref.current);
    }
    return () => { if (ref.current) clearInterval(ref.current); };
  }, [isRunning]);
  const mm = String(Math.floor(seconds / 60)).padStart(2, '0');
  const ss = String(seconds % 60).padStart(2, '0');
  return <span className="font-mono text-sm tabular-nums text-foreground">{mm}:{ss}</span>;
}

// ── Circular Score Ring ──────────────────────────────────────
function ScoreRing({ score, size = 96 }: { score: number; size?: number }) {
  const r = (size / 2) - 8;
  const circ = 2 * Math.PI * r;
  const dash = (score / 100) * circ;
  const color = score >= 70 ? '#00ff88' : score >= 50 ? '#ffd700' : '#ff0080';
  return (
    <div className="relative flex items-center justify-center" style={{ width: size, height: size }}>
      <svg className="absolute inset-0 -rotate-90" width={size} height={size}>
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="rgba(255,255,255,0.08)" strokeWidth="7" />
        <motion.circle
          cx={size / 2} cy={size / 2} r={r} fill="none"
          stroke={color} strokeWidth="7" strokeLinecap="round"
          strokeDasharray={circ}
          initial={{ strokeDashoffset: circ }}
          animate={{ strokeDashoffset: circ - dash }}
          transition={{ duration: 0.9, ease: 'easeOut' }}
        />
      </svg>
      <div className="text-center">
        <div className="text-2xl font-bold text-foreground">{score}</div>
        <div className="text-[10px] text-muted-foreground">score</div>
      </div>
    </div>
  );
}

export default function VoiceSession() {
  const [, setLocation] = useLocation();
  const { preferences } = useUserPreferences();
  
  const [pageState, setPageState] = useState<PageState>('loading');
  const [availableSessions, setAvailableSessions] = useState<VoiceSession[]>([]);
  const [allQuestions, setAllQuestions] = useState<Question[]>([]);
  const [sessionState, setSessionState] = useState<SessionState | null>(null);
  const [sessionResult, setSessionResult] = useState<SessionResult | null>(null);
  
  const [transcript, setTranscript] = useState('');
  const [interimTranscript, setInterimTranscript] = useState('');
  const [error, setError] = useState<string | null>(null);
  
  const recognitionRef = useRef<any>(null);
  const pageStateRef = useRef<PageState>('loading');

  const { onVoiceInterview } = useCredits();
  const { trackEvent } = useAchievementContext();

  const currentQuestion = sessionState ? getCurrentQuestion(sessionState) : null;

  useEffect(() => {
    pageStateRef.current = pageState;
  }, [pageState]);

  // Load sessions and questions
  useEffect(() => {
    async function loadData() {
      try {
        const questions = await getAllQuestionsAsync();
        setAllQuestions(questions);
        
        let sessions = await loadVoiceSessions();
        if (sessions.length === 0) {
          sessions = generateSessionsFromQuestions(questions);
        }
        
        const subscribedChannels = preferences.subscribedChannels;
        const filteredSessions = sessions.filter(s => subscribedChannels.includes(s.channel));
        setAvailableSessions(filteredSessions);
        
        const saved = loadSessionState();
        if (saved && saved.status !== 'completed') {
          setSessionState(saved);
          setPageState('intro');
          return;
        }
        
        setPageState('select');
      } catch (err) {
        setError('Failed to load sessions');
        console.error(err);
      }
    }
    loadData();
  }, [preferences.subscribedChannels]);

  // Initialize speech recognition
  useEffect(() => {
    if (!isSpeechSupported) return;
    
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    const recognition = new SpeechRecognition();
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = 'en-US';
    
    recognition.onresult = (event: any) => {
      let interim = '';
      let final = '';
      for (let i = event.resultIndex; i < event.results.length; i++) {
        const result = event.results[i];
        if (result.isFinal) {
          final += result[0].transcript + ' ';
        } else {
          interim += result[0].transcript;
        }
      }
      if (final) {
        setTranscript(prev => prev + final);
      }
      setInterimTranscript(interim);
    };
    
    recognition.onerror = (event: any) => {
      console.error('Speech recognition error:', event.error);
      if (event.error === 'not-allowed') {
        setError('Microphone access denied.');
        setPageState('editing');
      }
    };
    
    recognition.onend = () => {
      if (pageStateRef.current === 'recording') {
        try { recognition.start(); } catch (e) { }
      }
    };
    
    recognitionRef.current = recognition;
    return () => { try { recognition.stop(); } catch (e) { } };
  }, []);

  const startNewSession = useCallback((session: VoiceSession) => {
    const sessionQuestions = buildSessionQuestions(session, allQuestions);
    if (sessionQuestions.length < 3) {
      setError('Not enough questions available for this session');
      return;
    }
    const newState = startSession(session, sessionQuestions);
    setSessionState(newState);
    saveSessionState(newState);
    setPageState('intro');
  }, [allQuestions]);

  const beginQuestions = useCallback(() => {
    if (!sessionState) return;
    const updated = beginSession(sessionState);
    setSessionState(updated);
    saveSessionState(updated);
    setTranscript('');
    setInterimTranscript('');
    
    if (recognitionRef.current) {
      try {
        recognitionRef.current.start();
        setPageState('recording');
      } catch (err) {
        setError('Failed to start recording.');
        setPageState('editing');
      }
    }
  }, [sessionState]);

  const stopRecording = useCallback(() => {
    if (recognitionRef.current) recognitionRef.current.stop();
    setPageState('editing');
  }, []);

  // Space bar shortcut to stop recording
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.code !== 'Space' || e.target instanceof HTMLTextAreaElement || e.target instanceof HTMLInputElement) return;
      e.preventDefault();
      if (pageState === 'recording') stopRecording();
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [pageState, stopRecording]);

  const submitCurrentAnswer = useCallback(() => {
    if (!sessionState || !transcript.trim()) {
      setError('Please provide an answer.');
      return;
    }
    const updated = submitAnswer(sessionState, transcript.trim());
    setSessionState(updated);
    saveSessionState(updated);
    setPageState('feedback');
  }, [sessionState, transcript]);

  const goToNextQuestion = useCallback(() => {
    if (!sessionState) return;
    
    if (sessionState.currentQuestionIndex >= sessionState.questions.length - 1) {
      const result = completeSession(sessionState);
      setSessionResult(result);
      saveSessionToHistory(result);
      clearSessionState();
      
      const verdict = result.overallScore >= 60 ? 'hire' : 'no-hire';
      onVoiceInterview(verdict);
      trackEvent({ type: 'voice_interview_completed', timestamp: new Date().toISOString() });
      setPageState('results');
    } else {
      const updated = nextQuestion(sessionState);
      setSessionState(updated);
      saveSessionState(updated);
      setTranscript('');
      setInterimTranscript('');
      
      if (recognitionRef.current) {
        try {
          recognitionRef.current.start();
          setPageState('recording');
        } catch (err) {
          setPageState('editing');
        }
      }
    }
  }, [sessionState, onVoiceInterview, trackEvent]);

  const retryQuestion = useCallback(() => {
    setTranscript('');
    setInterimTranscript('');
    if (recognitionRef.current) {
      try {
        recognitionRef.current.start();
        setPageState('recording');
      } catch (err) {
        setPageState('editing');
      }
    }
  }, []);

  const exitSession = useCallback(() => {
    clearSessionState();
    setSessionState(null);
    setSessionResult(null);
    setPageState('select');
  }, []);

  if (!isSpeechSupported) {
    return (
      <AppLayout fullWidth hideNav >
        <div className="min-h-screen bg-background flex items-center justify-center p-4">
          <div className="max-w-md text-center">
            <div className="w-20 h-20 rounded-2xl bg-[#ffd700]/20 flex items-center justify-center mx-auto mb-6">
              <AlertCircle className="w-10 h-10 text-[#ffd700]" />
            </div>
            <h1 className="text-2xl font-bold text-foreground mb-3">Browser Not Supported</h1>
            <p className="text-muted-foreground mb-6">Voice sessions require the Web Speech API. Use Chrome, Edge, or Safari.</p>
            <Button onClick={() => setLocation('/')}>Go Home</Button>
          </div>
        </div>
      </AppLayout>
    );
  }

  if (pageState === 'loading') {
    return (
      <AppLayout fullWidth hideNav >
        <div className="min-h-screen bg-background flex items-center justify-center">
          <div className="text-center">
            <div className="w-16 h-16 rounded-2xl bg-[#00d4ff]/20 flex items-center justify-center mx-auto mb-4">
              <Loader2 className="w-8 h-8 animate-spin text-cyan-500" />
            </div>
            <p className="text-muted-foreground">Loading sessions...</p>
          </div>
        </div>
      </AppLayout>
    );
  }

  if (pageState === 'select') {
    const byChannel: Record<string, VoiceSession[]> = {};
    for (const session of availableSessions) {
      if (!byChannel[session.channel]) byChannel[session.channel] = [];
      byChannel[session.channel].push(session);
    }

    return (
      <>
        <SEOHead title="Voice Sessions | Code Reels" description="Practice interview topics with focused question sessions" />
        <AppLayout fullWidth hideNav >
          <div className="min-h-screen bg-background text-foreground">
          <header className="sticky top-0 z-50 border-b border-border bg-background/95 backdrop-blur-md">
            <div className="max-w-4xl mx-auto px-4 h-16 flex items-center justify-between">
              <div className="flex items-center gap-4">
                <button onClick={() => setLocation('/')} className="min-h-[44px] min-w-[44px] flex items-center justify-center hover:bg-muted rounded-lg transition-colors duration-150 ease-out cursor-pointer">
                  <Home className="w-5 h-5 text-muted-foreground" />
                </button>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary to-cyan-500 flex items-center justify-center">
                    <Target className="w-5 h-5 text-black" />
                  </div>
                  <div>
                    <h1 className="font-semibold text-foreground">Voice Sessions</h1>
                    <p className="text-xs text-muted-foreground">{availableSessions.length} sessions available</p>
                  </div>
                </div>
              </div>
              <CreditsDisplay compact onClick={() => setLocation('/profile')} />
            </div>
          </header>

          <main className="max-w-4xl mx-auto px-4 py-6 pb-24">
            {availableSessions.length === 0 ? (
              <div className="text-center py-16">
                <div className="w-20 h-20 rounded-2xl bg-muted/50 flex items-center justify-center mx-auto mb-6">
                  <AlertCircle className="w-10 h-10 text-muted-foreground" />
                </div>
                <h2 className="text-xl font-semibold text-foreground mb-2">No Sessions Available</h2>
                <p className="text-muted-foreground mb-6">Subscribe to channels to unlock voice sessions.</p>
                <Button onClick={() => setLocation('/channels')}>
                  Subscribe to Channels
                </Button>
              </div>
            ) : (
              <div className="space-y-8">
                {Object.entries(byChannel).map(([channel, sessions]) => (
                  <div key={channel}>
                    <h2 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-4 flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full bg-[#00d4ff]" />
                      {channel.replace(/-/g, ' ')}
                    </h2>
                    <div className="grid gap-3">
                      {sessions.map((session) => (
                        <motion.button
                          key={session.id}
                          onClick={() => startNewSession(session)}
                          whileHover={{ scale: 1.02 }}
                          whileTap={{ scale: 0.96 }}
                          className="p-5 bg-white/5 border border-white/10 rounded-2xl text-left hover:border-[#00d4ff]/50 transition-all duration-150 cursor-pointer group"
                          style={{ boxShadow: '0 4px 16px rgba(0,0,0,0.2), inset 0 1px 0 rgba(255,255,255,0.05)' }}
                        >
                          <div className="flex items-start justify-between gap-4">
                            <div className="flex-1">
                              <h3 className="font-semibold text-foreground group-hover:text-cyan-500 transition-colors mb-1">
                                {session.topic}
                              </h3>
                              <p className="text-sm text-muted-foreground mb-3">{session.description}</p>
                              <div className="flex items-center gap-3">
                                <span className={`px-2.5 py-1 text-xs font-medium rounded-lg ${
                                  session.difficulty === 'beginner' ? 'bg-[#00ff88]/20 text-primary' :
                                  session.difficulty === 'intermediate' ? 'bg-[#ffd700]/20 text-[#ffd700]' :
                                  'bg-[#ff0080]/20 text-[#ff0080]'
                                }`}>
                                  {session.difficulty}
                                </span>
                                <span className="text-xs text-muted-foreground">
                                  {session.totalQuestions} questions
                                </span>
                                <span className="text-xs text-muted-foreground">
                                  ~{session.estimatedMinutes} min
                                </span>
                              </div>
                            </div>
                          </div>
                        </motion.button>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </main>
        </div>
        </AppLayout>
      </>
    );
  }

  if (pageState === 'intro' && sessionState) {
    return (
      <>
        <SEOHead title={`${sessionState.session.topic} | Voice Session`} description="Voice interview session practice" />
        <AppLayout fullWidth hideNav >
          <div className="min-h-screen bg-background text-foreground flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="max-w-lg w-full"
          >
            <Card className="p-8 text-center">
              <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-primary to-cyan-500 flex items-center justify-center mx-auto mb-6">
                <Target className="w-10 h-10 text-black" />
              </div>
              <h1 className="text-2xl font-bold text-foreground mb-2">{sessionState.session.topic}</h1>
              <p className="text-muted-foreground mb-6">
                {sessionState.questions.length} questions • ~{sessionState.session.estimatedMinutes} min
              </p>
              
              <div className="bg-background/50 rounded-xl p-4 mb-6 text-left">
                <p className="text-sm text-muted-foreground">{sessionState.session.description}</p>
              </div>

              <div className="flex gap-3">
                <Button variant="secondary" onClick={exitSession} className="flex-1 cursor-pointer min-h-[44px]">
                  Back
                </Button>
                <Button variant="primary" onClick={beginQuestions} className="flex-1 cursor-pointer min-h-[44px]">
                  <Play className="w-5 h-5 mr-2" />
                  Start Session
                </Button>
              </div>
            </Card>
          </motion.div>
        </div>
        </AppLayout>
      </>
    );
  }

  if ((pageState === 'recording' || pageState === 'editing') && sessionState && currentQuestion) {
    const progress = ((sessionState.currentQuestionIndex + 1) / sessionState.questions.length) * 100;
    
    return (
      <>
        <SEOHead title={`Q${sessionState.currentQuestionIndex + 1} | ${sessionState.session.topic}`} description="Answer the interview question" />
        <AppLayout fullWidth hideNav >
          <div className="min-h-screen bg-background text-foreground">
          <header className="sticky top-0 z-50 border-b border-border bg-background/95 backdrop-blur-md">
            <div className="max-w-4xl mx-auto px-4">
              <div className="h-16 flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <button onClick={exitSession} className="min-h-[44px] min-w-[44px] flex items-center justify-center hover:bg-muted rounded-lg transition-colors duration-150 ease-out cursor-pointer">
                    <Home className="w-5 h-5 text-muted-foreground" />
                  </button>
                  <div>
                    <h1 className="font-semibold text-foreground text-sm">{sessionState.session.topic}</h1>
                    <p className="text-xs text-muted-foreground">Question {sessionState.currentQuestionIndex + 1} of {sessionState.questions.length}</p>
                  </div>
                </div>
              </div>
              <div className="pb-3">
                <Progress value={sessionState.currentQuestionIndex + 1} max={sessionState.questions.length} color="blue" />
              </div>
            </div>
          </header>

          <main className="max-w-4xl mx-auto px-4 py-6 pb-24">
            <Card className="p-6 mb-6" neonBorder>
              <h2 className="text-lg font-medium text-foreground leading-relaxed">{currentQuestion.question}</h2>
              {error && (
                <div className="mt-4 p-4 bg-[#ff0080]/10 border border-[#ff0080]/30 rounded-xl text-[#ff0080] text-sm">
                  {error}
                </div>
              )}
            </Card>

            {/* Recording card */}
            <Card className="p-6">
              <div className="flex flex-col items-center gap-5">

                {/* State label + timer */}
                <div className="flex items-center gap-3 h-8">
                  <AnimatePresence mode="wait">
                    {pageState === 'recording' && (
                      <motion.div key="rec" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                        className="flex items-center gap-2">
                        <span className="w-2.5 h-2.5 bg-[#ff0080] rounded-full animate-pulse shadow-[0_0_6px_#ff0080]" />
                        <span className="text-sm font-semibold text-[#ff0080]">Listening...</span>
                        <RecordingTimer isRunning={pageState === 'recording'} />
                      </motion.div>
                    )}
                    {pageState === 'editing' && (
                      <motion.div key="edit" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                        className="flex items-center gap-2 text-[#ffd700]">
                        <span className="text-sm font-medium">Review & Edit</span>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>

                {/* Waveform — always visible; animated when recording, flat when idle */}
                <div className="w-full">
                  <WaveformVisualizer isActive={pageState === 'recording'} />
                </div>

                <Microphone
                  isRecording={pageState === 'recording'}
                  onStart={() => {}}
                  onStop={stopRecording}
                />
                {pageState === 'recording' && (
                  <p className="text-[10px] text-muted-foreground">
                    Press <kbd className="px-1.5 py-0.5 bg-muted border border-border rounded text-[10px] font-mono">Space</kbd> to stop
                  </p>
                )}

                {/* Transcript */}
                <div className="w-full">
                  {pageState === 'editing' ? (
                    <>
                      <textarea
                        value={transcript}
                        onChange={(e) => setTranscript(e.target.value)}
                        className="w-full p-4 bg-background/50 border border-border rounded-xl min-h-[100px] text-sm text-foreground resize-y focus:outline-none focus:ring-2 focus:ring-[#00d4ff]/50"
                        placeholder="Edit your answer..."
                      />
                      <WordCountBar text={transcript} />
                    </>
                  ) : (
                    <>
                      <div className="p-4 bg-background/50 rounded-xl min-h-[80px] border border-border">
                        {transcript || interimTranscript ? (
                          <p className="text-sm text-foreground whitespace-pre-wrap">
                            <HighlightedTranscript text={transcript} keywords={(currentQuestion?.criticalPoints || []).map(p => p.phrase)} />
                            <span className="text-muted-foreground">{interimTranscript}</span>
                            <span className="animate-pulse text-cyan-400">|</span>
                          </p>
                        ) : (
                          <p className="text-sm text-muted-foreground italic">
                            Start speaking... Your words will appear here.
                          </p>
                        )}
                      </div>
                      {transcript && <WordCountBar text={transcript} />}
                    </>
                  )}
                  {transcript && pageState === 'recording' && (
                    <p className="text-xs text-muted-foreground mt-1.5 text-right tabular-nums">
                      {transcript.trim().split(/\s+/).filter(Boolean).length} words
                    </p>
                  )}
                </div>

                {pageState === 'editing' && (
                  <div className="flex gap-3">
                    <Button variant="secondary" onClick={retryQuestion} className="cursor-pointer min-h-[44px]">
                      <RotateCcw className="w-4 h-4 mr-2" />
                      Re-record
                    </Button>
                    <Button variant="primary" onClick={submitCurrentAnswer} disabled={!transcript.trim()} className="cursor-pointer min-h-[44px]">
                      <CheckCircle className="w-5 h-5 mr-2" />
                      Submit
                    </Button>
                  </div>
                )}
              </div>
            </Card>
          </main>
        </div>
        </AppLayout>
      </>
    );
  }

  if (pageState === 'feedback' && sessionState) {
    const lastAnswer = sessionState.answers[sessionState.answers.length - 1];
    const isLastQuestion = sessionState.currentQuestionIndex >= sessionState.questions.length - 1;
    
    return (
      <>
        <SEOHead title="Feedback | Voice Session" description="Review your answer feedback" />
        <AppLayout fullWidth hideNav >
          <div className="min-h-screen bg-background text-foreground flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.93, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
            className="max-w-lg w-full"
          >
            <Card className="p-8">
              {/* Score + verdict */}
              <div className="flex flex-col items-center gap-3 mb-6">
                <ScoreRing score={lastAnswer.score} size={112} />
                <p className={`text-sm font-semibold ${lastAnswer.isCorrect ? 'text-primary' : 'text-[#ff0080]'}`}>
                  {lastAnswer.isCorrect ? '✓ Good answer!' : '✗ Needs improvement'}
                </p>
              </div>

              {/* Feedback text */}
              <div className="bg-background/50 rounded-xl p-4 mb-5">
                <p className="text-sm text-muted-foreground">{lastAnswer.feedback}</p>
              </div>

              {/* Key points checklist */}
              {(lastAnswer.pointsCovered.length > 0 || lastAnswer.pointsMissed.length > 0) && (
                <div className="grid grid-cols-2 gap-3 mb-6">
                  {lastAnswer.pointsCovered.length > 0 && (
                    <div className="p-4 rounded-xl bg-[#00ff88]/10 border border-[#00ff88]/20">
                      <p className="text-xs font-semibold text-primary mb-2 flex items-center gap-1.5">
                        <CheckCircle className="w-3.5 h-3.5" /> Covered ({lastAnswer.pointsCovered.length})
                      </p>
                      <ul className="space-y-1.5">
                        {lastAnswer.pointsCovered.map((p, i) => (
                          <li key={i} className="text-xs text-muted-foreground flex items-start gap-1.5">
                            <span className="text-primary flex-shrink-0">✓</span>
                            <span>{p.phrase}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                  {lastAnswer.pointsMissed.length > 0 && (
                    <div className="p-4 rounded-xl bg-[#ff0080]/10 border border-[#ff0080]/20">
                      <p className="text-xs font-semibold text-[#ff0080] mb-2 flex items-center gap-1.5">
                        <XCircle className="w-3.5 h-3.5" /> Missed ({lastAnswer.pointsMissed.length})
                      </p>
                      <ul className="space-y-1.5">
                        {lastAnswer.pointsMissed.map((p, i) => (
                          <li key={i} className="text-xs text-muted-foreground flex items-start gap-1.5">
                            <span className="text-[#ff0080] flex-shrink-0">✗</span>
                            <span>{p.phrase}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              )}

              {/* CTAs */}
              <div className="flex gap-3">
                <Button variant="secondary" onClick={retryQuestion} className="flex-1 cursor-pointer min-h-[44px]">
                  <RotateCcw className="w-4 h-4 mr-2" />
                  Try Again
                </Button>
                <Button variant="primary" onClick={goToNextQuestion} className="flex-1 cursor-pointer min-h-[44px]">
                  {isLastQuestion ? 'View Results' : 'Next Question'}
                  <ArrowRight className="w-5 h-5 ml-2" />
                </Button>
              </div>
            </Card>
          </motion.div>
        </div>
        </AppLayout>
      </>
    );
  }

  if (pageState === 'results' && sessionResult) {
    const avgScore = sessionResult.overallScore;
    const total = sessionResult.answers.length;
    const correct = sessionResult.answers.filter(a => a.isCorrect).length;
    const incorrect = total - correct;

    // Compute top missed concepts from keyPointsMissed across answers
    const missedAll = sessionResult.answers.flatMap(a => (a as any).keyPointsMissed || []);
    const missedCounts: Record<string, number> = {};
    for (const m of missedAll) missedCounts[m] = (missedCounts[m] || 0) + 1;
    const topMissed = Object.entries(missedCounts).sort((a, b) => b[1] - a[1]).slice(0, 5).map(([k]) => k);

    const handleShare = () => {
      const text = `I scored ${avgScore}% on a ${sessionResult.topic} interview session on Code Reels! 🎤`;
      if (navigator.share) {
        navigator.share({ title: 'Code Reels Voice Session', text }).catch(() => {});
      } else {
        navigator.clipboard.writeText(text).catch(() => {});
      }
    };

    return (
      <>
        <SEOHead title="Session Complete | Voice Session" description="View your session results" />
        <AppLayout fullWidth hideNav >
          <div className="min-h-screen bg-background text-foreground flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.93, y: 24 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
            className="max-w-lg w-full"
          >
            <Card className="p-8">
              {/* Overall score ring */}
              <div className="flex flex-col items-center mb-8">
                <ScoreRing score={avgScore} size={128} />
                <h2 className="text-xl font-bold text-foreground mt-4">Session Complete!</h2>
                <p className="text-sm text-muted-foreground mt-1">{sessionResult.topic}</p>
              </div>

              {/* Stats grid */}
              <div className="grid grid-cols-3 gap-3 mb-8">
                <div className="bg-background/50 rounded-xl p-4 text-center">
                  <div className="text-2xl font-bold text-foreground">{total}</div>
                  <div className="text-xs text-muted-foreground mt-1">Questions</div>
                </div>
                <div className="bg-background/50 rounded-xl p-4 text-center">
                  <div className="text-2xl font-bold text-primary">{correct}</div>
                  <div className="text-xs text-muted-foreground mt-1">Correct</div>
                </div>
                <div className="bg-background/50 rounded-xl p-4 text-center">
                  <div className="text-2xl font-bold text-[#ff0080]">{incorrect}</div>
                  <div className="text-xs text-muted-foreground mt-1">Missed</div>
                </div>
              </div>

              {/* Per-question breakdown */}
              {sessionResult.answers.length > 0 && (
                <div className="mb-8 space-y-2">
                  <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">Per Question</p>
                  {sessionResult.answers.map((a, i) => (
                    <div key={i} className="flex items-center gap-3">
                      <span className="text-xs text-muted-foreground w-5 text-right">{i + 1}</span>
                      <div className="flex-1 h-2 bg-muted rounded-full overflow-hidden">
                        <motion.div
                          initial={{ scaleX: 0 }}
                          animate={{ scaleX: a.score / 100 }}
                          transition={{ duration: 0.5, delay: i * 0.05, ease: 'easeOut' }}
                          className="h-full rounded-full"
                          style={{
                            background: a.score >= 70 ? '#00ff88' : a.score >= 50 ? '#ffd700' : '#ff0080',
                            transformOrigin: 'left',
                          }}
                        />
                      </div>
                      <span className="text-xs font-mono text-muted-foreground w-8 text-right">{a.score}%</span>
                    </div>
                  ))}
                </div>
              )}

              {/* Top missed concepts */}
              {topMissed.length > 0 && (
                <div className="mb-8">
                  <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">Top missed concepts</p>
                  <div className="flex flex-wrap gap-2">
                    {topMissed.map(m => (
                      <span key={m} className="px-2.5 py-1 bg-[#ff0080]/10 border border-[#ff0080]/20 rounded-full text-xs text-[#ff0080]">{m}</span>
                    ))}
                  </div>
                </div>
              )}

              {/* CTAs */}
              <div className="flex gap-3">
                <Button variant="secondary" onClick={handleShare} className="flex-1 cursor-pointer min-h-[44px]">
                  <Share2 className="w-4 h-4 mr-2" />
                  Share
                </Button>
                <Button variant="secondary" onClick={exitSession} className="flex-1 cursor-pointer min-h-[44px]">
                  <RefreshCw className="w-4 h-4 mr-2" />
                  Again
                </Button>
                <Button variant="primary" onClick={() => setLocation('/')} className="flex-1 cursor-pointer min-h-[44px]">
                  <Home className="w-4 h-4 mr-2" />
                  Home
                </Button>
              </div>
            </Card>
          </motion.div>
        </div>
        </AppLayout>
      </>
    );
  }

  return null;
}
