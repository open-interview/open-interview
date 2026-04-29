/**
 * Voice Practice - Google-style Material Design
 * Clean interface with waveform visualization, microphone controls
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
import { Progress } from '../components/practice-ui';
import type { Question } from '../types';

const GOOGLE_BLUE = '#1a73e8';
const GOOGLE_RED = '#ea4335';
const GOOGLE_GREEN = '#34a853';
const GOOGLE_YELLOW = '#fbbc04';

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
    message = "Great job! Your answer length is perfect!";
  } else if (ratio >= 0.5) {
    message = `Good effort! Try to cover more details.`;
  } else if (wordsSpoken > 0) {
    message = "Keep practicing! Try to elaborate more.";
  } else {
    message = "Start speaking to practice!";
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

// ── Google-style Microphone Button ───────────────────────────────────────
function GoogleMicrophoneButton({
  isRecording,
  onStart,
  onStop,
  disabled = false,
}: {
  isRecording: boolean;
  onStart: () => void;
  onStop: () => void;
  disabled?: boolean;
}) {
  return (
    <div className="relative flex items-center justify-center">
      {isRecording && (
        <>
          <motion.div
            animate={{ scale: [1, 1.4, 1], opacity: [0.4, 0, 0.4] }}
            transition={{ duration: 1.5, repeat: Infinity, ease: 'easeInOut' }}
            className="absolute rounded-full"
            style={{ width: 120, height: 120, backgroundColor: GOOGLE_RED }}
          />
          <motion.div
            animate={{ scale: [1, 1.2, 1], opacity: [0.5, 0, 0.5] }}
            transition={{ duration: 1.5, repeat: Infinity, ease: 'easeInOut', delay: 0.3 }}
            className="absolute rounded-full"
            style={{ width: 100, height: 100, backgroundColor: GOOGLE_RED }}
          />
        </>
      )}
      <motion.button
        onClick={isRecording ? onStop : onStart}
        disabled={disabled}
        aria-label={isRecording ? 'Stop recording' : 'Start recording'}
        whileHover={{ scale: disabled ? 1 : 1.05 }}
        whileTap={{ scale: disabled ? 1 : 0.95 }}
        animate={isRecording ? { scale: [1, 1.02, 1] } : {}}
        transition={{ duration: 1, repeat: isRecording ? Infinity : 0 }}
        style={{ touchAction: 'manipulation' }}
         className={`
           relative z-10 w-24 h-24 rounded-full flex items-center justify-center
           transition-all duration-200 cursor-pointer
           ${isRecording ? 'bg-red-500' : 'bg-[#1a73e8]'}
           ${disabled ? 'opacity-50 cursor-not-allowed' : ''}
         `}
      >
        {isRecording ? (
          <div className="w-8 h-8 bg-white rounded-sm" />
        ) : (
          <Mic className="w-10 h-10 text-white" strokeWidth={2} />
        )}
      </motion.button>
      {isRecording && (
        <motion.div
          initial={{ opacity: 0, y: 5 }}
          animate={{ opacity: 1, y: 0 }}
          className="absolute -bottom-10 flex items-center gap-2"
        >
          <span className="w-3 h-3 bg-red-500 rounded-full animate-pulse" />
          <span className="text-sm font-medium text-red-500">Recording</span>
        </motion.div>
      )}
    </div>
  );
}

// ── Google-style Waveform Visualizer ─────────────────────────────────────
function GoogleWaveformVisualizer({ isActive, intensity = 1 }: { isActive: boolean; intensity?: number }) {
  const [bars, setBars] = useState<number[]>(Array(24).fill(4));
  const rafRef = useRef<number | null>(null);

  useEffect(() => {
    if (!isActive) {
      setBars(Array(24).fill(4));
      return;
    }
    const animate = () => {
      setBars(prev => prev.map(() => 4 + Math.random() * 36 * intensity));
      rafRef.current = requestAnimationFrame(animate);
    };
    rafRef.current = requestAnimationFrame(animate);
    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, [isActive, intensity]);

  return (
    <div className="flex items-center justify-center gap-[3px] h-12" aria-hidden>
      {bars.map((height, i) => (
        <div
          key={i}
          style={{
            height: `${height}px`,
            width: '3px',
            backgroundColor: isActive ? GOOGLE_BLUE : '#ddd',
            opacity: isActive ? 0.7 + Math.random() * 0.3 : 0.4,
            borderRadius: '2px',
            transition: 'height 100ms ease-out',
          }}
        />
      ))}
    </div>
  );
}

// ── Session Timer ────────────────────────────────────────────────
function SessionTimer({ seconds }: { seconds: number }) {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return (
    <span className="font-google-mono text-xl font-medium text-gray-700 tabular-nums">
      {String(mins).padStart(2, '0')}:{String(secs).padStart(2, '0')}
    </span>
  );
}

// ── Progress Bar ────────────────────────────────────────────
function GoogleProgress({ value, max }: { value: number; max: number }) {
  const pct = Math.min((value / max) * 100, 100);
  return (
    <div className="w-full h-1.5 bg-gray-200 rounded-full overflow-hidden">
      <motion.div
        initial={{ width: 0 }}
        animate={{ width: `${pct}%` }}
        transition={{ duration: 0.3, ease: 'easeOut' }}
        className="h-full rounded-full"
        style={{ backgroundColor: GOOGLE_BLUE }}
      />
    </div>
  );
}

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
        <div className="min-h-screen bg-white text-gray-900">
          <div className="max-w-4xl mx-auto px-4 py-12">
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
        <div className="min-h-screen bg-white text-gray-900">
          <div className="max-w-4xl mx-auto px-4 py-12 pb-24">
            <PageHeader title="Voice Practice" subtitle="Speak your answers out loud and get instant feedback" />
            <div className="flex items-center justify-center py-20">
              <div className="text-center max-w-md">
                <div className="w-20 h-20 rounded-full bg-gray-100 flex items-center justify-center mx-auto mb-6">
                  <Mic className="w-10 h-10 text-gray-400" />
                </div>
                <h2 className="text-xl font-semibold mb-2">No Questions Available</h2>
                <p className="text-gray-500 mb-4">Subscribe to channels to access voice practice questions</p>
                 <button
                   onClick={() => setLocation('/channels')}
                   className="px-6 py-2 bg-[#1a73e8] text-white rounded-md font-medium hover:bg-[#1557b0] transition-colors cursor-pointer"
                 >
                   Browse Channels
                </button>
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
        <div className="min-h-screen bg-white text-gray-900">
          <div className="max-w-4xl mx-auto px-4 py-12 pb-24">
            <PageHeader title="Voice Practice" subtitle="Speak your answers out loud and get instant feedback" />
            <div className="flex items-center justify-center py-20">
              <div className="max-w-md text-center">
                <div className="w-20 h-20 rounded-full bg-gray-100 flex items-center justify-center mx-auto mb-6">
                  <Mic className="w-10 h-10 text-gray-400" />
                </div>
                <h1 className="text-2xl font-semibold mb-3">Browser Not Supported</h1>
                <p className="text-gray-500 mb-4">
                  Voice practice requires the Web Speech API.
                </p>
                <button
                  onClick={() => setLocation('/')}
                   className="px-6 py-2 bg-[#1a73e8] text-white rounded-md font-medium hover:bg-[#1557b0] transition-colors cursor-pointer"
                 >
                   Go Home
                </button>
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
        <div className="min-h-screen bg-white text-gray-900 flex items-center justify-center">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="text-center space-y-6 px-4"
          >
            <div className="w-24 h-24 rounded-full bg-green-100 flex items-center justify-center mx-auto">
              <Trophy className="w-12 h-12 text-green-600" />
            </div>
            <div>
              <h1 className="text-2xl font-semibold">Session Complete!</h1>
              <p className="text-gray-500 mt-1">{questions.length} questions practiced</p>
            </div>
            <div className="flex gap-3 justify-center">
              <button
                onClick={() => { setCurrentIndex(0); setCompleted(false); resetForNewQuestion(); }}
                 className="px-5 py-2 border border-gray-300 rounded-md font-medium text-gray-700 hover:bg-gray-50 transition-colors cursor-pointer"
              >
                <RotateCcw className="w-4 h-4 inline mr-2" />
                Practice Again
              </button>
              <button
                onClick={() => setLocation('/')}
                 className="px-5 py-2 bg-[#1a73e8] text-white rounded-md font-medium hover:bg-[#1557b0] transition-colors cursor-pointer"
              >
                Go Home
              </button>
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
          <div className="min-h-screen bg-white text-gray-900 flex items-center justify-center px-4">
            <div className="w-full max-w-md flex flex-col items-center gap-8">
              <div className="w-24 h-24 rounded-full bg-blue-50 flex items-center justify-center">
                <Mic className="w-12 h-12 text-[#1a73e8]" />
              </div>
              <div className="text-center">
                <h1 className="text-2xl font-semibold mb-2">Voice Practice</h1>
                <p className="text-gray-500">Speak your answers aloud. Get instant feedback on length and delivery.</p>
              </div>
              <div className="grid grid-cols-2 gap-4 w-full">
                {([
                  { value: 'interview' as PracticeMode, icon: EyeOff, label: 'Interview Mode', desc: 'Answer first, then see the ideal response' },
                  { value: 'training' as PracticeMode, icon: Eye, label: 'Training Mode', desc: 'Read the answer, then practice saying it' },
                ] as const).map(({ value, icon: Icon, label, desc }) => (
                  <button
                    key={value}
                    onClick={() => { setMode(value); setStarted(true); }}
                    className={`flex flex-col items-center gap-3 p-5 rounded-2xl border-2 text-center transition-all cursor-pointer ${
                      mode === value
                        ? 'border-[#1a73e8] bg-blue-50'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <Icon className="w-6 h-6 text-[#1a73e8]" />
                    <div>
                      <p className="font-medium text-gray-900 text-sm">{label}</p>
                      <p className="text-xs text-gray-500 mt-1">{desc}</p>
                    </div>
                  </button>
                ))}
              </div>
              <button
                onClick={() => setStarted(true)}
                  className="w-full py-2.5 h-10 rounded-lg font-medium text-sm text-white bg-[#1a73e8] hover:bg-[#1557b0] transition-colors cursor-pointer shadow-none"
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
        <div className="min-h-screen bg-white text-gray-900">
           <header className="sticky top-0 z-50 bg-white border-b border-gray-200">
            <div className="max-w-4xl mx-auto px-4 h-14 flex items-center gap-3">
              <button
                onClick={() => setLocation('/')}
                className="min-h-[40px] min-w-[40px] flex items-center justify-center hover:bg-gray-100 rounded-full transition-colors cursor-pointer"
                aria-label="Go back"
              >
                <ArrowLeft className="w-5 h-5 text-gray-600" />
              </button>
              <div>
                <h1 className="font-medium text-gray-900 text-sm">Voice Practice</h1>
                {currentQuestion?.channel && (
                  <p className="text-xs text-gray-500 capitalize">{currentQuestion.channel}</p>
                )}
              </div>
              <div className="flex-1" />
              <span className="text-sm text-gray-500">
                {currentIndex + 1} / {questions.length}
              </span>
            </div>
            <div className="max-w-4xl mx-auto px-4 pb-3">
              <GoogleProgress value={currentIndex + 1} max={questions.length} />
            </div>
          </header>

          <main className="max-w-4xl mx-auto px-4 py-6 pb-32 space-y-6">
            <AnimatePresence mode="wait">
              <motion.div
                key={currentQuestion.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.15 }}
                className="space-y-6"
              >
                 <div className="bg-white rounded-xl p-6">
                  <div className="flex items-center gap-2 mb-3">
                    <span className="text-xs font-medium text-gray-500 uppercase tracking-wide">
                      Question {currentIndex + 1}
                    </span>
                    <span className="text-gray-300">•</span>
                    <span className={`px-2 py-0.5 rounded text-xs font-medium ${
                      currentQuestion.difficulty === 'beginner' ? 'bg-green-100 text-green-700' :
                      currentQuestion.difficulty === 'intermediate' ? 'bg-yellow-100 text-yellow-700' :
                      'bg-red-100 text-red-700'
                    }`}>
                      {currentQuestion.difficulty}
                    </span>
                  </div>
                  <h2 className="text-lg font-medium text-gray-900 leading-relaxed">{currentQuestion.question}</h2>
                  <div className="flex items-center gap-2 mt-3 text-sm text-gray-500">
                    <span>{currentQuestion.channel}</span>
                  </div>
                  <div className="flex items-center gap-2 mt-2">
                    <button
                      onClick={() => { setCurrentIndex(prev => prev - 1); resetForNewQuestion(); }}
                      disabled={currentIndex === 0}
                      className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-sm text-gray-600 hover:bg-gray-100 transition-colors disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
                    >
                      <ChevronLeft className="w-4 h-4" /> Prev
                    </button>
                    <button
                      onClick={() => { setCurrentIndex(prev => prev + 1); resetForNewQuestion(); }}
                      disabled={currentIndex === questions.length - 1}
                      className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-sm text-gray-600 hover:bg-gray-100 transition-colors disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
                    >
                      Next <ChevronRight className="w-4 h-4" />
                    </button>
                  </div>
                  {showRevealButton && !showAnswer && (
                    <button
                      onClick={() => setShowAnswer(true)}
                       className="w-full mt-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors cursor-pointer"
                    >
                      <Eye className="w-4 h-4 inline mr-2" />
                      Reveal Answer
                    </button>
                  )}
                  <AnimatePresence>
                    {showAnswer && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        className="mt-4 p-4 bg-gray-50 rounded-xl border border-gray-200"
                      >
                        <div className="flex items-center justify-between mb-3">
                          <span className="text-sm font-medium text-gray-700">
                            {mode === 'training' ? 'Answer to Read' : 'Ideal Answer'}
                          </span>
                          <span className="text-xs text-gray-500 px-2 py-1 bg-gray-200 rounded">
                            {targetWords} words
                          </span>
                        </div>
                        <p className="text-sm text-gray-700 leading-relaxed whitespace-pre-wrap">
                          {currentQuestion.answer}
                        </p>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>

                 <div className="bg-white rounded-xl p-6">
                  <div className="flex flex-col items-center gap-6">
                    <div className="relative flex items-center justify-center py-4">
                      <GoogleMicrophoneButton
                        isRecording={recordingState === 'recording'}
                        onStart={startRecording}
                        onStop={stopRecording}
                        disabled={!recognitionReady}
                      />
                    </div>

                    {recordingState === 'recording' && (
                      <SessionTimer seconds={duration} />
                    )}

                    <GoogleWaveformVisualizer isActive={recordingState === 'recording'} />

                    <div className="w-full">
                      <div className={`p-4 rounded-xl border transition-all min-h-[100px] ${
                        recordingState === 'recording'
                          ? 'border-blue-300 bg-blue-50'
                          : 'border-gray-200 bg-gray-50'
                      }`}>
                        {transcript || interimTranscript ? (
                          <p className="text-gray-800 text-sm whitespace-pre-wrap leading-relaxed">
                            {transcript}
                            <span className="text-gray-400">{interimTranscript}</span>
                          </p>
                        ) : (
                          <p className="text-gray-400 text-sm italic">
                            {recordingState === 'recording'
                              ? 'Listening... Start speaking'
                              : 'Tap the microphone to start'}
                          </p>
                        )}
                      </div>

                      {transcript && recordingState === 'recorded' && (
                        <div className="mt-3 flex items-center justify-between text-sm">
                          <span className="text-gray-600">
                            {countWords(transcript)} / {targetWords} words
                          </span>
                          <div className="flex-1 mx-3">
                            <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                              <div
                                className="h-full rounded-full transition-all"
                                style={{
                                  width: `${Math.min((countWords(transcript) / targetWords) * 100, 100)}%`,
                                  backgroundColor: countWords(transcript) >= targetWords * 0.8 ? GOOGLE_GREEN : GOOGLE_BLUE,
                                }}
                              />
                            </div>
                          </div>
                        </div>
                      )}

                      {feedback && (
                        <motion.div
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          className="mt-5 p-5 bg-gray-50 rounded-xl border border-gray-200"
                        >
                          <div className="flex items-center gap-4 mb-4">
                            <div className={`text-3xl font-bold ${
                              feedback.score >= 80 ? 'text-green-600' :
                              feedback.score >= 50 ? 'text-yellow-600' :
                              'text-red-500'
                            }`}>{feedback.score}</div>
                            <div className="text-sm text-gray-600">
                              <div>Words: {feedback.wordsSpoken} / {feedback.targetWords}</div>
                              <div>Duration: {feedback.duration}s</div>
                            </div>
                          </div>
                          <p className="text-sm text-gray-600">{feedback.message}</p>
                        </motion.div>
                      )}

                      {recordingState === 'recorded' && (
                        <div className="flex gap-3 mt-5">
                          <button
                            onClick={tryAgain}
                             className="flex-1 py-2 border border-gray-300 rounded-lg font-medium text-gray-700 hover:bg-gray-50 transition-colors cursor-pointer"
                          >
                            <RotateCcw className="w-4 h-4 inline mr-2" />
                            Try Again
                          </button>
                          <button
                            onClick={goToNext}
                             className="flex-1 py-2 bg-[#1a73e8] text-white rounded-lg font-medium hover:bg-[#1557b0] transition-colors cursor-pointer"
                          >
                            Next Question
                            <ChevronRight className="w-4 h-4 inline ml-2" />
                          </button>
                        </div>
                      )}
                    </div>
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