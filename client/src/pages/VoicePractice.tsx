/**
 * Voice Practice
 
 */

import { useState, useEffect, useRef, useCallback } from 'react';
import { useLocation } from 'wouter';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ArrowLeft, Eye, EyeOff, Volume2, Trophy, RotateCcw, 
  ChevronRight, Sparkles, BookOpen
} from 'lucide-react';
import { PageHeader, PageLoader } from '@/components/ui/page';
import { SEOHead } from '../components/SEOHead';
import { AppLayout } from '../components/layout/AppLayout';
import { useUserPreferences } from '../context/UserPreferencesContext';
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
  
  return { wordsSpoken, targetWords, duration, message };
}

export default function VoicePractice() {
  const [, setLocation] = useLocation();
  const { getSubscribedChannels } = useUserPreferences();
  
  const [mode, setMode] = useState<PracticeMode>('interview');
  const [questions, setQuestions] = useState<Question[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [loading, setLoading] = useState(true);
  
  const [recordingState, setRecordingState] = useState<RecordingState>('idle');
  const [transcript, setTranscript] = useState('');
  const [interimTranscript, setInterimTranscript] = useState('');
  const [duration, setDuration] = useState(0);
  const [feedback, setFeedback] = useState<FeedbackResult | null>(null);
  const [showAnswer, setShowAnswer] = useState(false);
  
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
          const shuffled = allQuestions.sort(() => Math.random() - 0.5);
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
    
    try {
      recognitionRef.current.stop();
    } catch (e) { }
    
    setRecordingState('recorded');
    
    if (currentQuestion) {
      const result = calculateFeedback(transcript, currentQuestion.answer, duration);
      setFeedback(result);
      
      if (mode === 'interview') {
        setShowAnswer(true);
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
  }, [mode]);

  const goToNext = useCallback(() => {
    if (currentIndex < questions.length - 1) {
      setCurrentIndex(prev => prev + 1);
      resetForNewQuestion();
    } else {
      setLocation('/');
    }
  }, [currentIndex, questions.length, resetForNewQuestion, setLocation]);

  const tryAgain = useCallback(() => {
    resetForNewQuestion();
  }, [resetForNewQuestion]);

  const toggleMode = useCallback(() => {
    const newMode = mode === 'training' ? 'interview' : 'training';
    setMode(newMode);
    setShowAnswer(newMode === 'training');
  }, [mode]);

  useEffect(() => {
    setShowAnswer(mode === 'training');
  }, [mode, currentIndex]);

  if (loading) {
    return (
      <AppLayout>
        <div className="min-h-screen bg-background text-foreground">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8 sm:py-12">
            <PageHeader title="Voice Practice" subtitle="Speak your answers out loud and get instant feedback" />
            <PageLoader message="Loading questions..." />
          </div>
        </div>
      </AppLayout>
    );
  }

  if (questions.length === 0) {
    return (
      <AppLayout>
        <div className="min-h-screen bg-background text-foreground">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8 sm:py-12">
            <PageHeader title="Voice Practice" subtitle="Speak your answers out loud and get instant feedback" />
            <div className="flex items-center justify-center py-20">
              <div className="text-center max-w-md">
                <div className="w-20 h-20 rounded-2xl bg-muted/50 flex items-center justify-center mx-auto mb-6">
                  <BookOpen className="w-10 h-10 text-muted-foreground" />
                </div>
                <h2 className="text-xl font-bold mb-2">No Questions Available</h2>
                <p className="text-muted-foreground mb-6">Subscribe to channels to access practice questions</p>
                <Button onClick={() => setLocation('/channels')}>Browse Channels</Button>
              </div>
            </div>
          </div>
        </div>
      </AppLayout>
    );
  }

  if (!isSpeechSupported) {
    return (
      <AppLayout>
        <div className="min-h-screen bg-background text-foreground">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8 sm:py-12">
            <PageHeader title="Voice Practice" subtitle="Speak your answers out loud and get instant feedback" />
            <div className="flex items-center justify-center py-20">
              <div className="max-w-md text-center">
                <h1 className="text-2xl font-bold text-foreground mb-3">Browser Not Supported</h1>
                <p className="text-muted-foreground mb-6">
                  Voice practice requires the Web Speech API. Please use Chrome, Edge, or Safari.
                </p>
                <Button onClick={() => setLocation('/')}>
                  Go Home
                </Button>
              </div>
            </div>
          </div>
        </div>
      </AppLayout>
    );
  }

  const progress = ((currentIndex + 1) / questions.length) * 100;

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
            <div className="max-w-4xl mx-auto px-4 h-14 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <button
                  onClick={() => setLocation('/')}
                  className="p-1.5 hover:bg-muted rounded-lg transition-colors"
                >
                  <ArrowLeft className="w-4 h-4 text-muted-foreground" />
                </button>
                <div>
                  <h1 className="font-semibold text-foreground text-sm">Voice Practice</h1>
                  <p className="text-[10px] text-muted-foreground">
                    Q{currentIndex + 1}/{questions.length}
                  </p>
                </div>
              </div>
              
              <Button
                variant={mode === 'interview' ? 'primary' : 'secondary'}
                size="sm"
                onClick={toggleMode}
              >
                {mode === 'interview' ? <EyeOff className="w-3.5 h-3.5 mr-1" /> : <Eye className="w-3.5 h-3.5 mr-1" />}
                {mode === 'interview' ? 'Interview' : 'Training'}
              </Button>
            </div>
            
            <div className="max-w-4xl mx-auto px-4 pb-2">
              <Progress value={currentIndex + 1} max={questions.length} color="green" />
            </div>
          </header>

          {/* Main Content */}
          <main className="max-w-7xl mx-auto px-4 sm:px-6 py-8 sm:py-12">
            {/* Page Header */}
            <PageHeader title="Voice Practice" subtitle="Speak your answers out loud and get instant feedback" />
            <AnimatePresence mode="wait">
              <motion.div
                key={currentQuestion.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="space-y-6"
              >
                {/* Question Card */}
                <Card className="p-6" neonBorder>
                  <div className="flex items-start gap-4 mb-4">
                    <div className="p-2.5 rounded-xl bg-[#00ff88]/10 flex-shrink-0">
                      <Sparkles className="w-5 h-5 text-primary" />
                    </div>
                    <div className="flex-1">
                      <h2 className="text-lg font-semibold text-foreground mb-2">{currentQuestion.question}</h2>
                      <div className="flex items-center gap-2 text-sm">
                        <span className={`px-2.5 py-1 rounded-lg text-xs font-medium ${
                          currentQuestion.difficulty === 'beginner' ? 'bg-[#00ff88]/20 text-primary' :
                          currentQuestion.difficulty === 'intermediate' ? 'bg-[#ffd700]/20 text-[#ffd700]' :
                          'bg-[#ff0080]/20 text-[#ff0080]'
                        }`}>
                          {currentQuestion.difficulty}
                        </span>
                        <span className="text-muted-foreground">•</span>
                        <span className="text-muted-foreground">{currentQuestion.channel}</span>
                      </div>
                    </div>
                  </div>

                  {/* Answer Display */}
                  {showAnswer && (
                    <div className="bg-background/50 rounded-xl p-5 border border-border">
                      <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center gap-2">
                          <Eye className="w-4 h-4 text-primary" />
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
                    </div>
                  )}
                </Card>

                {/* Recording Interface */}
                <Card className="p-8">
                  <div className="flex flex-col items-center gap-6">
                    <Microphone
                      isRecording={recordingState === 'recording'}
                      onStart={startRecording}
                      onStop={stopRecording}
                      disabled={!recognitionReady}
                    />

                    {/* Transcript */}
                    <div className="w-full">
                      <div className="bg-background/50 rounded-xl p-4 min-h-[100px] border border-border">
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
                        className="w-full bg-[#00ff88]/10 border border-primary/30 rounded-xl p-4"
                      >
                        <p className="text-primary font-semibold mb-2">{feedback.message}</p>
                        <div className="flex items-center gap-4 text-sm text-muted-foreground">
                          <span>Words: {feedback.wordsSpoken}/{feedback.targetWords}</span>
                          <span>•</span>
                          <span>Time: {feedback.duration}s</span>
                        </div>
                      </motion.div>
                    )}

                    {/* Actions */}
                    <div className="flex gap-3">
                      {recordingState === 'recorded' && (
                        <>
                          <Button variant="secondary" onClick={tryAgain}>
                            <RotateCcw className="w-4 h-4 mr-2" />
                            Try Again
                          </Button>
                          <Button variant="primary" onClick={goToNext}>
                            Next Question
                            <ChevronRight className="w-4 h-4 ml-2" />
                          </Button>
                        </>
                      )}
                    </div>
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
