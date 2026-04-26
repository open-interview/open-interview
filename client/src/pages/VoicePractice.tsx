/**
 * Voice Practice
 */

import { useState, useEffect, useRef, useCallback } from 'react';
import { useLocation } from 'wouter';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ArrowLeft, Eye, EyeOff, Volume2, Trophy, RotateCcw,
  ChevronLeft, ChevronRight, BookOpen, Mic
} from 'lucide-react';
import { PageHeader, PageLoader } from '@/components/ui/page';
import { SEOHead } from '../components/SEOHead';
import { AppLayout } from '../components/layout/AppLayout';
import { useUserPreferences } from '../context/UserPreferencesContext';
import { getRoleDefaultChannels } from '../lib/personalization';
import { ChannelService } from '../services/api.service';
import { Card, Button, Microphone, Progress } from '../components/practice-ui';
import type { Question } from '../types';

const isSpeechSupported = typeof window !== 'undefined' &&
  ('SpeechRecognition' in window || 'webkitSpeechRecognition' in window);

type PracticeMode = 'training' | 'interview';
type RecordingState = 'idle' | 'recording' | 'recorded';

interface FeedbackResult {
  wordsSpoken: number;
  targetWords: number;
  duration: number;
  message: string;
  score: number;
}

function countWords(text: string): number {
  return text.trim().split(/\s+/).filter(word => word.length > 0).length;
}

function calculateFeedback(transcript: string, targetAnswer: string, duration: number): FeedbackResult {
  const wordsSpoken = countWords(transcript);
  const targetWords = countWords(targetAnswer);

  let message: string;
  const ratio = wordsSpoken / targetWords;

  if (ratio >= 0.8 && ratio <= 1.2) {
    message = "Great job! Your answer length is perfect! 🌟";
  } else if (ratio >= 0.5) {
    message = `Good effort! Try to cover more details. 💪`;
  } else if (wordsSpoken > 0) {
    message = "Keep practicing! Try to elaborate more. 📚";
  } else {
    message = "Start speaking to practice! 🎤";
  }

  const score = Math.min(100, Math.round((wordsSpoken / targetWords) * 100));
  return { wordsSpoken, targetWords, duration, message, score };
}

const roleQuestionWeights: Record<string, { primary: string[]; multiplier: number }> = {
  manager:      { primary: ['behavioral', 'engineering-management'], multiplier: 2 },
  frontend:     { primary: ['frontend', 'javascript', 'react'], multiplier: 2 },
  devops:       { primary: ['devops', 'kubernetes', 'linux'], multiplier: 2 },
  'ml-engineer':{ primary: ['machine-learning', 'python', 'data-engineering'], multiplier: 2 },
};

export default function VoicePractice() {
  const [, setLocation] = useLocation();
  const { getSubscribedChannels, preferences } = useUserPreferences();

  const [started, setStarted] = useState(false);
  const [mode, setMode] = useState<PracticeMode>('interview');
  const [questions, setQuestions] = useState<Question[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [loading, setLoading] = useState(true);
  const [completed, setCompleted] = useState(false);

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
  const [recognitionReady, setRecognitionReady] = useState(false);

  const currentQuestion = questions[currentIndex];
  const targetWords = currentQuestion?.answer ? countWords(currentQuestion.answer) : 0;

  useEffect(() => {
    recordingStateRef.current = recordingState;
  }, [recordingState]);

  // Load questions
  useEffect(() => {
    async function loadQuestions() {
      setLoading(true);
      const subscribedChannels = getSubscribedChannels();

      if (subscribedChannels.length === 0) {
        setLoading(false);
        return;
      }

      try {
        const allQuestions: Question[] = [];

        for (const channel of subscribedChannels) {
          try {
            const data = await ChannelService.getData(channel.id);
            const suitable = data.questions.filter((q: Question) =>
              q.voiceSuitable !== false && q.answer && q.answer.length > 100
            );
            allQuestions.push(...suitable);
          } catch (e) {
            console.error(`Failed to load ${channel.id}`, e);
          }
        }

        if (allQuestions.length > 0) {
          const role = preferences.role ?? '';
          const weights = roleQuestionWeights[role];
          const primaryChannels = weights
            ? new Set(weights.primary)
            : new Set(getRoleDefaultChannels(role).slice(0, Math.ceil(getRoleDefaultChannels(role).length * 0.6)));
          const multiplier = weights ? weights.multiplier : 2;

          const weighted: Question[] = [];
          for (const q of allQuestions) {
            weighted.push(q);
            if (primaryChannels.has(q.channel ?? '')) {
              for (let i = 1; i < multiplier; i++) weighted.push(q);
            }
          }

          const shuffled = weighted.sort(() => Math.random() - 0.5);
          setQuestions(shuffled.slice(0, 15));
        }
      } catch (e) {
        console.error('Failed to load questions', e);
      }

      setLoading(false);
    }

    loadQuestions();
  }, [getSubscribedChannels]);

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
        setTranscript(prev => (prev + final).trim());
      }
      setInterimTranscript(interim);
    };

    recognition.onerror = (event: any) => {
      console.error('Speech recognition error:', event.error);
    };

    recognition.onend = () => {
      if (recordingStateRef.current === 'recording') {
        try { recognition.start(); } catch (e) { }
      }
    };

    recognitionRef.current = recognition;
    setRecognitionReady(true);

    return () => { try { recognition.stop(); } catch (e) { } };
  }, []);

  // Timer
  useEffect(() => {
    if (recordingState === 'recording') {
      timerRef.current = setInterval(() => {
        setDuration(Math.floor((Date.now() - startTimeRef.current) / 1000));
      }, 1000);
    } else {
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
    }

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [recordingState]);

  const startRecording = useCallback(() => {
    if (!recognitionRef.current) return;

    setTranscript('');
    setInterimTranscript('');
    setFeedback(null);
    setDuration(0);
    startTimeRef.current = Date.now();

    try {
      recognitionRef.current.start();
      setRecordingState('recording');
    } catch (err) {
      console.error('Failed to start recording:', err);
    }
  }, []);

  const stopRecording = useCallback(() => {
    if (!recognitionRef.current) return;
    if (navigator.vibrate) navigator.vibrate([10, 50, 10]);

    try {
      recognitionRef.current.stop();
    } catch (e) { }

    setRecordingState('recorded');

    if (currentQuestion) {
      const result = calculateFeedback(transcript, currentQuestion.answer, duration);
      setFeedback(result);

      if (mode === 'interview') {
        setShowRevealButton(true);
      }
    }
  }, [transcript, currentQuestion, duration, mode]);

  const resetForNewQuestion = useCallback(() => {
    setTranscript('');
    setInterimTranscript('');
    setFeedback(null);
    setDuration(0);
    setRecordingState('idle');
    setShowAnswer(mode === 'training');
    setShowRevealButton(false);
  }, [mode]);

  const goToNext = useCallback(() => {
    if (currentIndex < questions.length - 1) {
      setCurrentIndex(prev => prev + 1);
      resetForNewQuestion();
    } else {
      setCompleted(true);
    }
  }, [currentIndex, questions.length, resetForNewQuestion]);

  const tryAgain = useCallback(() => {
    resetForNewQuestion();
  }, [resetForNewQuestion]);

  useEffect(() => {
    setShowAnswer(mode === 'training');
  }, [mode, currentIndex]);

  if (loading) {
    return (
      <AppLayout fullWidth>
        <div className="min-h-screen bg-background text-foreground">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8 sm:py-12 pb-24">
            <PageHeader title="Voice Practice" subtitle="Speak your answers out loud and get instant feedback" />
            <PageLoader message="Loading questions..." />
          </div>
        </div>
      </AppLayout>
    );
  }

  if (questions.length === 0) {
    return (
      <AppLayout fullWidth>
        <div className="min-h-screen bg-background text-foreground">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8 sm:py-12 pb-24">
            <PageHeader title="Voice Practice" subtitle="Speak your answers out loud and get instant feedback" />
            <div className="flex items-center justify-center py-20">
              <div className="text-center max-w-md">
                <h2 className="text-xl font-bold mb-2">No Questions Available</h2>
                <p className="text-muted-foreground mb-4">Subscribe to channels to access voice practice questions</p>
                <ul className="text-sm text-muted-foreground text-left space-y-1 mb-6">
                  <li>• Subscribe to at least one channel</li>
                  <li>• Channels with voice-suitable questions will appear here</li>
                  <li>• Try AWS, System Design, or Behavioral channels</li>
                </ul>
                <Button onClick={() => setLocation('/channels')} className="cursor-pointer">Browse Channels</Button>
              </div>
            </div>
          </div>
        </div>
      </AppLayout>
    );
  }

  if (!isSpeechSupported) {
    return (
      <AppLayout fullWidth>
        <div className="min-h-screen bg-background text-foreground">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8 sm:py-12 pb-24">
            <PageHeader title="Voice Practice" subtitle="Speak your answers out loud and get instant feedback" />
            <div className="flex items-center justify-center py-20">
              <div className="max-w-md text-center">
                <div className="w-20 h-20 rounded-2xl bg-muted/50 flex items-center justify-center mx-auto mb-6">
                  <Mic className="w-10 h-10 text-muted-foreground" />
                </div>
                <h1 className="text-2xl font-bold text-foreground mb-3">Browser Not Supported</h1>
                <p className="text-muted-foreground mb-4">
                  Voice practice requires the Web Speech API. Please use a supported browser:
                </p>
                <ul className="text-sm text-left space-y-1 mb-6 inline-block">
                  <li>Chrome <span className="text-green-500">✓</span></li>
                  <li>Edge <span className="text-green-500">✓</span></li>
                  <li>Safari <span className="text-green-500">✓</span></li>
                  <li>Firefox <span className="text-red-500">✗</span></li>
                </ul>
                <div>
                  <Button onClick={() => setLocation('/')} className="cursor-pointer">
                    Go Home
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </AppLayout>
    );
  }

  if (completed) {
    return (
      <AppLayout fullWidth hideNav>
        <div className="min-h-screen bg-background text-foreground flex items-center justify-center">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.3 }}
            className="text-center space-y-6 px-4"
          >
            <Trophy className="w-20 h-20 text-amber-400 mx-auto" />
            <div>
              <h1 className="text-3xl font-bold text-foreground">Session Complete!</h1>
              <p className="text-muted-foreground mt-2">{questions.length} questions practiced</p>
            </div>
            <div className="flex gap-3 justify-center">
              <Button variant="secondary" onClick={() => { setCurrentIndex(0); setCompleted(false); resetForNewQuestion(); }} className="cursor-pointer min-h-[44px]">
                <RotateCcw className="w-4 h-4 mr-2" />
                Practice Again
              </Button>
              <Button variant="primary" onClick={() => setLocation('/')} className="cursor-pointer min-h-[44px]">
                Go Home
              </Button>
            </div>
          </motion.div>
        </div>
      </AppLayout>
    );
  }

  if (!started) {
    return (
      <>
        <SEOHead
          title="Voice Practice | Code Reels"
          description="Practice answering interview questions with voice recording and feedback"
          canonical="https://open-interview.github.io/voice-practice"
        />
        <AppLayout fullWidth hideNav>
          <div className="min-h-screen bg-background text-foreground flex items-center justify-center px-4">
            <div className="w-full max-w-md flex flex-col items-center gap-8">
              {/* Icon */}
              <div className="w-24 h-24 rounded-full flex items-center justify-center"
                style={{ background: 'linear-gradient(135deg, #7c3aed, #a855f7)' }}>
                <Mic className="w-12 h-12 text-white" />
              </div>

              {/* Title */}
              <div className="text-center">
                <h1 className="text-3xl font-bold text-foreground mb-2">Voice Practice</h1>
                <p className="text-muted-foreground">Speak your answers aloud. Get instant feedback on length and delivery.</p>
              </div>

              {/* Mode selector */}
              <div className="grid grid-cols-2 gap-4 w-full">
                {([
                  { value: 'interview' as PracticeMode, icon: EyeOff, label: 'Interview Mode', desc: 'Answer first, then see the ideal response' },
                  { value: 'training' as PracticeMode, icon: Eye, label: 'Training Mode', desc: 'Read the answer, then practice saying it' },
                ] as const).map(({ value, icon: Icon, label, desc }) => (
                  <button
                    key={value}
                    onClick={() => { setMode(value); setStarted(true); }}
                    className={`flex flex-col items-center gap-3 p-5 rounded-2xl border-2 text-center transition-all cursor-pointer active:scale-95 ${
                      mode === value
                        ? 'border-violet-500 bg-violet-500/10'
                        : 'border-white/10 bg-white/5 hover:border-violet-500/50'
                    }`}
                    style={{ 
                      boxShadow: mode === value 
                        ? '0 4px 20px rgba(124,58,237,0.3), inset 0 1px 0 rgba(255,255,255,0.1)' 
                        : '0 2px 8px rgba(0,0,0,0.15)' 
                    }}
                  >
                    <Icon className="w-6 h-6 text-violet-400" />
                    <div>
                      <p className="font-semibold text-foreground text-sm">{label}</p>
                      <p className="text-xs text-muted-foreground mt-1">{desc}</p>
                    </div>
                  </button>
                ))}
              </div>

              {/* Start button */}
              <button
                onClick={() => setStarted(true)}
                className="w-full min-h-[52px] rounded-xl font-semibold text-white text-base cursor-pointer transition-all active:scale-95"
                style={{ 
                  background: 'linear-gradient(135deg, #7c3aed 0%, #a855f7 50%, #db2777 100%)',
                  boxShadow: '0 4px 20px rgba(124,58,237,0.4), inset 0 1px 0 rgba(255,255,255,0.2)' 
                }}
              >
                Start Practicing
              </button>
            </div>
          </div>
        </AppLayout>
      </>
    );
  }

  return (
    <>
      <SEOHead
        title="Voice Practice | Code Reels"
        description="Practice answering interview questions with voice recording and feedback"
        canonical="https://open-interview.github.io/voice-practice"
      />

      <AppLayout fullWidth hideNav>
        <div className="min-h-screen bg-background text-foreground">
          {/* Header */}
          <header className="sticky top-0 z-50 border-b border-border bg-background/95 backdrop-blur-md">
            <div className="max-w-4xl mx-auto px-4 h-14 flex items-center gap-3">
              <button
                onClick={() => setLocation('/')}
                className="min-h-[44px] min-w-[44px] flex items-center justify-center hover:bg-muted rounded-lg transition-colors duration-150 ease-out cursor-pointer"
                aria-label="Go back"
                style={{ touchAction: 'manipulation' }}
              >
                <ArrowLeft className="w-4 h-4 text-muted-foreground" />
              </button>
              <div>
                <h1 className="font-semibold text-foreground text-sm">Voice Practice</h1>
                {currentQuestion?.channel && (
                  <p className="text-[10px] text-muted-foreground capitalize">{currentQuestion.channel}</p>
                )}
              </div>
            </div>

            <div className="max-w-4xl mx-auto px-4 pb-2 space-y-1.5">
              {/* Thicker violet gradient progress bar */}
              <div className="h-1.5 w-full rounded-full bg-muted overflow-hidden">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-violet-500 to-violet-400 transition-all duration-300"
                  style={{ width: `${((currentIndex + 1) / questions.length) * 100}%` }}
                />
              </div>

              {/* Dot indicator row */}
              <div className="flex items-center gap-1.5">
                {questions.slice(0, Math.min(10, questions.length)).map((_, i) => (
                  <span
                    key={i}
                    className={`rounded-full transition-all duration-300 ${
                      i < currentIndex
                        ? 'w-1.5 h-1.5 bg-violet-500'
                        : i === currentIndex
                        ? 'w-2 h-2 bg-violet-400 animate-pulse'
                        : 'w-1.5 h-1.5 bg-muted-foreground/30'
                    }`}
                  />
                ))}
              </div>
            </div>
          </header>

          {/* Main Content */}
          <main className="max-w-4xl mx-auto px-4 sm:px-6 py-6 pb-24 space-y-6" style={{ overscrollBehavior: 'contain' }}>
            <AnimatePresence mode="wait">
              <motion.div
                key={currentQuestion.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.15, ease: 'easeOut' }}
                className="space-y-6"
              >
                {/* Question Card */}
                <div className="rounded-2xl border border-border bg-card p-6 relative overflow-hidden pl-8">
                  <div className="w-1 h-full rounded-full bg-gradient-to-b from-violet-500 to-cyan-500 absolute left-0 top-0" />
                  <div className="mb-4">
                    <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
                      Question {currentIndex + 1} of {questions.length}
                    </span>
                    <h2 className="text-xl font-semibold leading-relaxed text-foreground mt-2 mb-3">{currentQuestion.question}</h2>
                    <div className="flex items-center gap-2 text-sm flex-wrap">
                      <span className={`px-2.5 py-1 rounded-lg text-xs font-medium ${
                        currentQuestion.difficulty === 'beginner' ? 'bg-emerald-500/20 text-emerald-400' :
                        currentQuestion.difficulty === 'intermediate' ? 'bg-yellow-500/20 text-yellow-400' :
                        'bg-rose-500/20 text-rose-400'
                      }`}>
                        {currentQuestion.difficulty}
                      </span>
                      <span className="text-muted-foreground">•</span>
                      <span className="text-muted-foreground truncate">{currentQuestion.channel}</span>
                    </div>
                  </div>

                  {/* Question Navigation */}
                  <div className="flex items-center gap-2 mt-3">
                    <button
                      onClick={() => { setCurrentIndex(prev => prev - 1); resetForNewQuestion(); }}
                      disabled={currentIndex === 0}
                      className="flex items-center gap-1 px-2 py-1 rounded-lg text-xs text-muted-foreground hover:text-foreground hover:bg-muted transition-colors disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer"
                    >
                      <ChevronLeft className="w-3.5 h-3.5" /> Prev
                    </button>
                    <span className="text-xs text-muted-foreground flex-1 text-center">{currentIndex + 1} / {questions.length}</span>
                    <button
                      onClick={() => { setCurrentIndex(prev => prev + 1); resetForNewQuestion(); }}
                      disabled={currentIndex === questions.length - 1}
                      className="flex items-center gap-1 px-2 py-1 rounded-lg text-xs text-muted-foreground hover:text-foreground hover:bg-muted transition-colors disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer"
                    >
                      Next <ChevronRight className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  {/* Reveal Answer Button */}
                  {showRevealButton && !showAnswer && (
                    <button
                      onClick={() => setShowAnswer(true)}
                      className="w-full border border-violet-500/40 bg-violet-500/10 hover:bg-violet-500/20 text-violet-300 rounded-xl py-3 flex items-center justify-center gap-2 transition-all cursor-pointer"
                    >
                      <Eye className="w-4 h-4" />
                      Reveal Answer
                    </button>
                  )}

                  {/* Answer Display */}
                  <AnimatePresence>
                  {showAnswer && (
                    <motion.div
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      transition={{ duration: 0.2 }}
                      className="bg-background/50 rounded-xl p-5 border border-border"
                    >
                      <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center gap-2">
                          <Eye className="w-4 h-4 text-violet-400" />
                          <span className="text-sm font-semibold text-foreground">
                            {mode === 'training' ? 'Answer to Read' : 'Ideal Answer'}
                          </span>
                        </div>
                        <span className="text-xs text-muted-foreground px-2 py-1 bg-muted/50 rounded-lg">
                          {targetWords} words
                        </span>
                      </div>
                      <div className="max-h-[500px] overflow-y-auto">
                        <p className="text-foreground text-[15px] leading-[1.7] whitespace-pre-wrap">
                          {currentQuestion.answer}
                        </p>
                      </div>
                    </motion.div>
                  )}
                  </AnimatePresence>
                </div>

                {/* Recording Interface */}
                <Card className="p-8">
                  <div className="flex flex-col items-center gap-6">
                    <div className="relative flex items-center justify-center">
                      {recordingState === 'recording' && <>
                        <div className="absolute rounded-full bg-violet-500 animate-ping" style={{ width: '150%', height: '150%', opacity: 0.3 }} />
                        <div className="absolute rounded-full bg-violet-500 animate-ping" style={{ width: '200%', height: '200%', opacity: 0.15, animationDelay: '0.3s' }} />
                      </>}
                      <Microphone
                        isRecording={recordingState === 'recording'}
                        onStart={startRecording}
                        onStop={stopRecording}
                        disabled={!recognitionReady}
                      />
                    </div>

                    {recordingState === 'recording' && (
                      <p className="text-violet-400 font-mono text-xl font-semibold tabular-nums">
                        {`${Math.floor(duration / 60)}:${String(duration % 60).padStart(2, '0')}`}
                      </p>
                    )}

                    {/* Transcript */}
                    <div className="w-full">
                      <div className={`bg-background/50 rounded-xl p-4 min-h-[100px] border transition-all duration-300 ${recordingState === 'recording' ? 'border-violet-500/50 shadow-violet-500/20 shadow-lg' : 'border-border'}`}>
                        {transcript || interimTranscript ? (
                          <p className="text-foreground text-sm whitespace-pre-wrap">
                            {transcript}
                            <span className="text-muted-foreground">{interimTranscript}</span>
                          </p>
                        ) : (
                          <p className="text-muted-foreground text-sm italic">
                            {recordingState === 'recording'
                              ? 'Listening... Start speaking'
                              : 'Click the microphone to start'}
                          </p>
                        )}
                      </div>

                      {transcript && (
                        <div className="mt-3">
                          <Progress
                            value={countWords(transcript)}
                            max={targetWords}
                            color="blue"
                            showLabel
                          />
                        </div>
                      )}
                    </div>

                    {/* Feedback */}
                    {feedback && (
                      <motion.div
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ duration: 0.15, ease: 'easeOut' }}
                        className="w-full bg-background/60 border border-border rounded-2xl p-5"
                      >
                        <div className={`text-4xl font-black mb-3 ${
                          feedback.score >= 80 ? 'text-green-400' :
                          feedback.score >= 50 ? 'text-yellow-400' :
                          'text-red-400'
                        }`}>{feedback.score}</div>
                        <div className="flex gap-2 mb-3">
                          <span className="px-3 py-1 rounded-full bg-muted text-xs font-medium text-foreground">Words Spoken: {feedback.wordsSpoken}</span>
                          <span className="px-3 py-1 rounded-full bg-muted text-xs font-medium text-foreground">Target: {feedback.targetWords}</span>
                          <span className="px-3 py-1 rounded-full bg-muted text-xs font-medium text-foreground">Duration: {feedback.duration}s</span>
                        </div>
                        <p className="text-sm text-muted-foreground">{feedback.message}</p>
                      </motion.div>
                    )}

                    {/* Actions */}
                    {recordingState === 'recorded' && (
                      <div className="flex gap-3">
                        <Button
                          variant="secondary"
                          onClick={tryAgain}
                          className="cursor-pointer min-h-[44px]"
                        >
                          <RotateCcw className="w-4 h-4 mr-2" />
                          Try Again
                        </Button>
                        <Button
                          variant="primary"
                          onClick={goToNext}
                          className="cursor-pointer min-h-[44px]"
                        >
                          Next Question
                          <ChevronRight className="w-4 h-4 ml-2" />
                        </Button>
                      </div>
                    )}
                  </div>
                </Card>
              </motion.div>
            </AnimatePresence>
          </main>
        </div>
      </AppLayout>
    </>
  );
}
