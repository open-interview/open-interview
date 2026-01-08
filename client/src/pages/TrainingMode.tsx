/**
 * Training Mode - Read and Record Answers
 * 
 * Features:
 * - Answer is visible for reading
 * - Progressive answer reveal (cut off at multiple points)
 * - Voice recording with auto-stop after target word count
 * - Practice speaking technical answers fluently
 */

import { useState, useEffect, useRef, useCallback } from 'react';
import { useLocation } from 'wouter';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ArrowLeft, Mic, Square, Play, Pause, RotateCcw, 
  ChevronRight, Volume2, Eye, EyeOff, Target, Award,
  Zap, CheckCircle, Clock, BookOpen, Sparkles
} from 'lucide-react';
import { SEOHead } from '../components/SEOHead';
import { useChannelStats } from '../hooks/use-stats';
import { useUserPreferences } from '../context/UserPreferencesContext';
import { ChannelService } from '../services/api.service';
import { useCredits } from '../context/CreditsContext';
import type { Question } from '../types';

interface RecordingState {
  isRecording: boolean;
  isPaused: boolean;
  duration: number;
  wordCount: number;
  audioBlob: Blob | null;
  transcript: string; // Live transcription
  finalTranscript: string; // Final saved transcript
}

interface AnswerSegment {
  text: string;
  wordCount: number;
  isRevealed: boolean;
}

interface PlaybackState {
  isPlaying: boolean;
  currentWordIndex: number;
  words: string[];
}

const TARGET_WORDS_PER_SEGMENT = 30; // Words per reveal segment (not used for auto-stop anymore)

export default function TrainingMode() {
  const [, setLocation] = useLocation();
  const { getSubscribedChannels } = useUserPreferences();
  const { balance, formatCredits, config } = useCredits();
  const subscribedChannels = getSubscribedChannels();

  const [questions, setQuestions] = useState<Question[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [loading, setLoading] = useState(true);
  const [answerSegments, setAnswerSegments] = useState<AnswerSegment[]>([]);
  const [revealedSegments, setRevealedSegments] = useState(0);
  const [recording, setRecording] = useState<RecordingState>({
    isRecording: false,
    isPaused: false,
    duration: 0,
    wordCount: 0,
    audioBlob: null,
    transcript: '',
    finalTranscript: ''
  });
  const [completedQuestions, setCompletedQuestions] = useState<Set<string>>(new Set());
  const [showFullAnswer, setShowFullAnswer] = useState(false);
  const [hasLoadedQuestions, setHasLoadedQuestions] = useState(false);
  const [playback, setPlayback] = useState<PlaybackState>({
    isPlaying: false,
    currentWordIndex: -1,
    words: []
  });

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const recognitionRef = useRef<any>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const playbackIntervalRef = useRef<NodeJS.Timeout | null>(null);

  const currentQuestion = questions[currentIndex];
  const totalWords = answerSegments.reduce((sum, seg) => sum + seg.wordCount, 0);

  // Load questions from subscribed channels - only once
  useEffect(() => {
    if (hasLoadedQuestions) return;

    const loadQuestions = async () => {
      console.log('TrainingMode: Starting to load questions');
      console.log('TrainingMode: Subscribed channels:', subscribedChannels.length);
      
      setLoading(true);
      
      if (subscribedChannels.length === 0) {
        console.log('TrainingMode: No subscribed channels');
        setLoading(false);
        setHasLoadedQuestions(true);
        return;
      }

      try {
        const allQuestions: Question[] = [];
        
        for (const channel of subscribedChannels) {
          try {
            console.log(`TrainingMode: Loading channel ${channel.id}`);
            const data = await ChannelService.getData(channel.id);
            console.log(`TrainingMode: Loaded ${data.questions.length} questions from ${channel.id}`);
            allQuestions.push(...data.questions);
          } catch (e) {
            console.error(`TrainingMode: Failed to load ${channel.id}`, e);
          }
        }

        console.log(`TrainingMode: Total questions loaded: ${allQuestions.length}`);
        
        if (allQuestions.length > 0) {
          // Simple shuffle
          const shuffled = allQuestions.sort(() => Math.random() - 0.5);
          const selected = shuffled.slice(0, 20);
          console.log(`TrainingMode: Selected ${selected.length} questions for training`);
          setQuestions(selected);
        }
      } catch (e) {
        console.error('TrainingMode: Failed to load questions', e);
      }
      
      setLoading(false);
      setHasLoadedQuestions(true);
    };

    loadQuestions();
  }, [subscribedChannels, hasLoadedQuestions]);

  // Split answer into segments when question changes
  useEffect(() => {
    if (!currentQuestion?.answer) return;

    const segments = splitIntoSegments(currentQuestion.answer, TARGET_WORDS_PER_SEGMENT);
    setAnswerSegments(segments);
    setRevealedSegments(segments.length - 1); // Show all segments by default
    setShowFullAnswer(true); // Show full answer by default
    setRecording({
      isRecording: false,
      isPaused: false,
      duration: 0,
      wordCount: 0,
      audioBlob: null,
      transcript: '',
      finalTranscript: ''
    });
    setPlayback({
      isPlaying: false,
      currentWordIndex: -1,
      words: []
    });
  }, [currentQuestion]);

  // Initialize speech recognition for word counting and transcription
  useEffect(() => {
    if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
      const SpeechRecognition = (window as any).webkitSpeechRecognition || (window as any).SpeechRecognition;
      const recognition = new SpeechRecognition();
      recognition.continuous = true;
      recognition.interimResults = true;
      recognition.lang = 'en-US';

      recognition.onresult = (event: any) => {
        let interimTranscript = '';
        let finalTranscript = '';
        
        for (let i = event.resultIndex; i < event.results.length; i++) {
          const transcript = event.results[i][0].transcript;
          if (event.results[i].isFinal) {
            finalTranscript += transcript + ' ';
          } else {
            interimTranscript += transcript;
          }
        }
        
        const fullTranscript = finalTranscript + interimTranscript;
        const wordCount = countWords(fullTranscript);
        
        setRecording(prev => ({ 
          ...prev, 
          wordCount,
          transcript: fullTranscript,
          finalTranscript: finalTranscript || prev.finalTranscript
        }));
      };

      recognitionRef.current = recognition;
    }

    return () => {
      if (recognitionRef.current) {
        try {
          recognitionRef.current.stop();
        } catch (e) {
          // Already stopped
        }
      }
    };
  }, []);

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      
      audioChunksRef.current = [];
      
      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        setRecording(prev => ({ ...prev, audioBlob }));
        stream.getTracks().forEach(track => track.stop());
      };

      mediaRecorder.start();
      mediaRecorderRef.current = mediaRecorder;

      // Start speech recognition for word counting
      if (recognitionRef.current) {
        recognitionRef.current.start();
      }

      // Start timer
      timerRef.current = setInterval(() => {
        setRecording(prev => ({ ...prev, duration: prev.duration + 1 }));
      }, 1000);

      setRecording(prev => ({ ...prev, isRecording: true, isPaused: false }));
    } catch (error) {
      console.error('Failed to start recording:', error);
      alert('Microphone access denied. Please enable microphone permissions.');
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      mediaRecorderRef.current.stop();
    }

    if (recognitionRef.current) {
      try {
        recognitionRef.current.stop();
      } catch (e) {
        // Already stopped
      }
    }

    if (timerRef.current) {
      clearInterval(timerRef.current);
    }

    setRecording(prev => ({ ...prev, isRecording: false }));
    
    // Mark question as completed
    if (currentQuestion) {
      setCompletedQuestions(prev => new Set(prev).add(currentQuestion.id));
    }
  };

  const resetRecording = () => {
    setRecording({
      isRecording: false,
      isPaused: false,
      duration: 0,
      wordCount: 0,
      audioBlob: null,
      transcript: '',
      finalTranscript: ''
    });
    setPlayback({
      isPlaying: false,
      currentWordIndex: -1,
      words: []
    });
  };

  const playRecording = () => {
    if (!recording.audioBlob) return;

    const url = URL.createObjectURL(recording.audioBlob);
    const audio = new Audio(url);
    audioRef.current = audio;

    // Split transcript into words for highlighting
    const words = recording.finalTranscript.trim().split(/\s+/);
    setPlayback({
      isPlaying: true,
      currentWordIndex: 0,
      words
    });

    // Estimate word timing (average speaking rate: ~150 words per minute)
    const totalDuration = recording.duration * 1000; // Convert to ms
    const msPerWord = words.length > 0 ? totalDuration / words.length : 0;

    let currentIndex = 0;
    playbackIntervalRef.current = setInterval(() => {
      currentIndex++;
      if (currentIndex >= words.length) {
        stopPlayback();
      } else {
        setPlayback(prev => ({ ...prev, currentWordIndex: currentIndex }));
      }
    }, msPerWord);

    audio.onended = () => {
      stopPlayback();
    };

    audio.play();
  };

  const stopPlayback = () => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current = null;
    }
    if (playbackIntervalRef.current) {
      clearInterval(playbackIntervalRef.current);
      playbackIntervalRef.current = null;
    }
    setPlayback({
      isPlaying: false,
      currentWordIndex: -1,
      words: []
    });
  };

  const goToNext = () => {
    if (currentIndex < questions.length - 1) {
      setCurrentIndex(prev => prev + 1);
    } else {
      // Completed all questions
      setLocation('/');
    }
  };

  const goToPrevious = () => {
    if (currentIndex > 0) {
      setCurrentIndex(prev => prev - 1);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-muted-foreground">Loading training questions...</p>
        </div>
      </div>
    );
  }

  if (questions.length === 0) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <div className="text-center max-w-md">
          <BookOpen className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
          <h2 className="text-xl font-bold mb-2">No Questions Available</h2>
          <p className="text-muted-foreground mb-4">
            Subscribe to channels to access training questions
          </p>
          <button
            onClick={() => setLocation('/channels')}
            className="px-6 py-3 bg-primary text-primary-foreground rounded-lg font-semibold"
          >
            Browse Channels
          </button>
        </div>
      </div>
    );
  }

  return (
    <>
      <SEOHead 
        title="Training Mode - Practice Speaking Answers"
        description="Read and record technical interview answers to improve your speaking skills"
      />

      <div className="min-h-screen bg-background pb-20">
        {/* Header */}
        <div className="sticky top-0 z-10 bg-background/95 backdrop-blur border-b border-border">
          <div className="max-w-4xl mx-auto px-4 py-3 flex items-center justify-between">
            <button
              onClick={() => setLocation('/')}
              className="p-2 hover:bg-muted rounded-lg transition-colors"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2 px-3 py-1.5 bg-primary/10 rounded-lg">
                <Target className="w-4 h-4 text-primary" />
                <span className="text-sm font-semibold">
                  {currentIndex + 1} / {questions.length}
                </span>
              </div>

              <div className="flex items-center gap-2 px-3 py-1.5 bg-green-500/10 rounded-lg">
                <CheckCircle className="w-4 h-4 text-green-500" />
                <span className="text-sm font-semibold text-green-500">
                  {completedQuestions.size}
                </span>
              </div>
            </div>
          </div>

          {/* Progress bar */}
          <div className="h-1 bg-muted">
            <div 
              className="h-full bg-primary transition-all duration-300"
              style={{ width: `${((currentIndex + 1) / questions.length) * 100}%` }}
            />
          </div>
        </div>

        {/* Main Content */}
        <div className="max-w-4xl mx-auto px-4 py-6">
          <AnimatePresence mode="wait">
            <motion.div
              key={currentQuestion.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="space-y-6"
            >
              {/* Question Card */}
              <div className="bg-card rounded-xl border border-border p-6">
                <div className="flex items-start gap-3 mb-4">
                  <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                    <Sparkles className="w-5 h-5 text-primary" />
                  </div>
                  <div className="flex-1">
                    <h2 className="text-lg font-semibold mb-2">{currentQuestion.question}</h2>
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <span className={`px-2 py-0.5 rounded text-xs ${
                        currentQuestion.difficulty === 'beginner' ? 'bg-green-500/10 text-green-600' :
                        currentQuestion.difficulty === 'intermediate' ? 'bg-yellow-500/10 text-yellow-600' :
                        'bg-red-500/10 text-red-600'
                      }`}>
                        {currentQuestion.difficulty}
                      </span>
                      <span>•</span>
                      <span>{currentQuestion.channel}</span>
                    </div>
                  </div>
                </div>

                {/* Answer with Full Display */}
                <div className="bg-muted/30 rounded-lg p-4 space-y-3">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <Eye className="w-4 h-4 text-primary" />
                      <span className="text-sm font-semibold">Answer to Read</span>
                    </div>
                    <span className="text-xs text-muted-foreground">
                      {totalWords} words
                    </span>
                  </div>

                  <div className="max-w-none overflow-auto max-h-96">
                    <p className="text-foreground leading-relaxed whitespace-pre-wrap break-words">
                      {currentQuestion.answer}
                    </p>
                  </div>
                </div>
              </div>

              {/* Recording Controls */}
              <div className="bg-card rounded-xl border border-border p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-semibold flex items-center gap-2">
                    <Mic className="w-5 h-5 text-primary" />
                    Record Your Answer
                  </h3>
                  {recording.duration > 0 && (
                    <div className="flex items-center gap-2 text-sm">
                      <Clock className="w-4 h-4 text-muted-foreground" />
                      <span className="font-mono">
                        {Math.floor(recording.duration / 60)}:{(recording.duration % 60).toString().padStart(2, '0')}
                      </span>
                    </div>
                  )}
                </div>

                {/* Live Transcription Display */}
                {(recording.isRecording || recording.transcript) && (
                  <div className="mb-4 p-4 bg-muted/30 rounded-lg border border-border">
                    <div className="flex items-center gap-2 mb-2">
                      <Volume2 className="w-4 h-4 text-primary" />
                      <span className="text-sm font-semibold">
                        {recording.isRecording ? 'Live Transcription' : 'Your Recording'}
                      </span>
                      {recording.isRecording && (
                        <span className="flex items-center gap-1 text-xs text-red-500">
                          <span className="w-2 h-2 bg-red-500 rounded-full animate-pulse" />
                          Recording...
                        </span>
                      )}
                    </div>
                    <div className="text-sm leading-relaxed break-words overflow-auto max-h-96">
                      {playback.isPlaying ? (
                        // Show word-by-word highlighting during playback
                        <div className="flex flex-wrap gap-1">
                          {playback.words.map((word, index) => (
                            <span
                              key={index}
                              className={`transition-all duration-200 ${
                                index === playback.currentWordIndex
                                  ? 'bg-primary text-primary-foreground px-1 rounded font-semibold scale-110'
                                  : index < playback.currentWordIndex
                                  ? 'text-muted-foreground'
                                  : 'text-foreground'
                              }`}
                            >
                              {word}
                            </span>
                          ))}
                        </div>
                      ) : (
                        // Show live or final transcript
                        <p className="text-foreground whitespace-pre-wrap">
                          {recording.transcript || 'Start speaking...'}
                        </p>
                      )}
                    </div>
                  </div>
                )}

                {/* Word Count Progress */}
                <div className="mb-4">
                  <div className="flex items-center justify-between text-sm mb-2">
                    <span className="text-muted-foreground">Words spoken</span>
                    <span className="font-semibold">
                      {recording.wordCount} words
                    </span>
                  </div>
                  <div className="h-2 bg-muted rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-primary transition-all duration-300"
                      style={{ width: `${Math.min((recording.wordCount / Math.max(totalWords, 1)) * 100, 100)}%` }}
                    />
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">
                    Target: ~{totalWords} words (full answer)
                  </p>
                </div>

                {/* Recording Buttons */}
                <div className="flex gap-3">
                  {!recording.isRecording && !recording.audioBlob && (
                    <button
                      onClick={startRecording}
                      className="flex-1 py-3 px-6 bg-red-500 hover:bg-red-600 text-white rounded-lg font-semibold flex items-center justify-center gap-2 transition-colors"
                    >
                      <Mic className="w-5 h-5" />
                      Start Recording
                    </button>
                  )}

                  {recording.isRecording && (
                    <button
                      onClick={stopRecording}
                      className="flex-1 py-3 px-6 bg-red-500 hover:bg-red-600 text-white rounded-lg font-semibold flex items-center justify-center gap-2 transition-colors animate-pulse"
                    >
                      <Square className="w-5 h-5" />
                      Stop Recording
                    </button>
                  )}

                  {recording.audioBlob && (
                    <>
                      {!playback.isPlaying ? (
                        <button
                          onClick={playRecording}
                          className="flex-1 py-3 px-6 bg-primary hover:bg-primary/90 text-primary-foreground rounded-lg font-semibold flex items-center justify-center gap-2 transition-colors"
                        >
                          <Play className="w-5 h-5" />
                          Play Recording
                        </button>
                      ) : (
                        <button
                          onClick={stopPlayback}
                          className="flex-1 py-3 px-6 bg-primary hover:bg-primary/90 text-primary-foreground rounded-lg font-semibold flex items-center justify-center gap-2 transition-colors"
                        >
                          <Pause className="w-5 h-5" />
                          Stop Playback
                        </button>
                      )}
                      <button
                        onClick={resetRecording}
                        className="py-3 px-6 bg-muted hover:bg-muted/80 rounded-lg font-semibold flex items-center justify-center gap-2 transition-colors"
                      >
                        <RotateCcw className="w-5 h-5" />
                      </button>
                    </>
                  )}
                </div>

                {/* Tips */}
                <div className="mt-4 p-3 bg-blue-500/10 rounded-lg">
                  <p className="text-xs text-blue-600 dark:text-blue-400">
                    💡 Tip: Read the full answer naturally. Click "Stop Recording" when you're done.
                  </p>
                </div>
              </div>

              {/* Navigation */}
              <div className="flex gap-3">
                <button
                  onClick={goToPrevious}
                  disabled={currentIndex === 0}
                  className="px-6 py-3 bg-muted hover:bg-muted/80 disabled:opacity-50 disabled:cursor-not-allowed rounded-lg font-semibold transition-colors"
                >
                  Previous
                </button>
                <button
                  onClick={goToNext}
                  className="flex-1 px-6 py-3 bg-primary hover:bg-primary/90 text-primary-foreground rounded-lg font-semibold flex items-center justify-center gap-2 transition-colors"
                >
                  {currentIndex === questions.length - 1 ? 'Finish' : 'Next Question'}
                  <ChevronRight className="w-5 h-5" />
                </button>
              </div>
            </motion.div>
          </AnimatePresence>
        </div>
      </div>
    </>
  );
}

// Helper functions
function splitIntoSegments(text: string, wordsPerSegment: number): AnswerSegment[] {
  const sentences = text.match(/[^.!?]+[.!?]+/g) || [text];
  const segments: AnswerSegment[] = [];
  let currentSegment = '';
  let currentWordCount = 0;

  for (const sentence of sentences) {
    const sentenceWords = countWords(sentence);
    
    if (currentWordCount + sentenceWords > wordsPerSegment && currentSegment) {
      segments.push({
        text: currentSegment.trim(),
        wordCount: currentWordCount,
        isRevealed: false
      });
      currentSegment = sentence;
      currentWordCount = sentenceWords;
    } else {
      currentSegment += ' ' + sentence;
      currentWordCount += sentenceWords;
    }
  }

  if (currentSegment.trim()) {
    segments.push({
      text: currentSegment.trim(),
      wordCount: currentWordCount,
      isRevealed: false
    });
  }

  return segments;
}

function countWords(text: string): number {
  return text.trim().split(/\s+/).filter(word => word.length > 0).length;
}
