/**
 * Voice Interview Session Page
 * 
 * Session-based voice interview with micro-questions:
 * - Each question has 1-2 sentence expected answers
 * - Follow-up questions drill into the topic
 * - Precise keyword-based evaluation
 * - Progress tracking through the session
 */

import { useState, useEffect, useRef, useCallback } from 'react';
import { useLocation, useParams } from 'wouter';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Mic, MicOff, Square, RotateCcw, Home, ChevronRight,
  CheckCircle, XCircle, AlertCircle, Loader2,
  Target, MessageSquare, Coins, Edit3, ChevronLeft,
  BarChart3, Sparkles, Play, ArrowRight
} from 'lucide-react';
import { SEOHead } from '../components/SEOHead';
import { getAllQuestionsAsync } from '../lib/questions-loader';
import { useCredits } from '../context/CreditsContext';
import { CreditsDisplay } from '../components/CreditsDisplay';
import { ListenButton } from '../components/ListenButton';
import {
  type VoiceSession,
  type SessionState,
  type SessionResult,
  type MicroQuestion,
  startSession,
  submitAnswer,
  getCurrentQuestion,
  completeSession,
  generateSessionFromQuestion,
  saveSessionState,
  loadSessionState,
  clearSessionState,
  saveSessionToHistory
} from '../lib/voice-interview-session';
import type { Question } from '../types';

type PageState = 'loading' | 'select' | 'intro' | 'recording' | 'editing' | 'feedback' | 'results';

// Check if Web Speech API is supported
const isSpeechSupported = typeof window !== 'undefined' && 
  ('SpeechRecognition' in window || 'webkitSpeechRecognition' in window);

export default function VoiceSession() {
  const [, setLocation] = useLocation();
  const params = useParams<{ questionId?: string }>();
  
  const [pageState, setPageState] = useState<PageState>('loading');
  const [availableSessions, setAvailableSessions] = useState<VoiceSession[]>([]);
  const [sessionState, setSessionState] = useState<SessionState | null>(null);
  const [sessionResult, setSessionResult] = useState<SessionResult | null>(null);
  
  const [transcript, setTranscript] = useState('');
  const [interimTranscript, setInterimTranscript] = useState('');
  const [recordingTime, setRecordingTime] = useState(0);
  const [error, setError] = useState<string | null>(null);
  
  const recognitionRef = useRef<any>(null);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  
  const { onVoiceInterview, config } = useCredits();

  const currentQuestion = sessionState ? getCurrentQuestion(sessionState) : null;


  // Load available sessions from questions with voiceKeywords
  useEffect(() => {
    async function loadSessions() {
      try {
        const allQuestions = await getAllQuestionsAsync();
        
        // Filter questions suitable for voice sessions
        const suitable = allQuestions.filter((q: Question) => 
          q.voiceSuitable === true && 
          q.voiceKeywords && 
          q.voiceKeywords.length >= 4
        );
        
        // Generate sessions from questions
        const sessions: VoiceSession[] = [];
        for (const q of suitable.slice(0, 50)) { // Limit to 50 for performance
          const session = generateSessionFromQuestion(q);
          if (session) {
            sessions.push(session);
          }
        }
        
        setAvailableSessions(sessions);
        
        // Check for specific question ID in URL
        if (params.questionId) {
          const targetSession = sessions.find(s => s.sourceQuestionId === params.questionId);
          if (targetSession) {
            startNewSession(targetSession);
            return;
          }
        }
        
        // Check for saved session state
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
    loadSessions();
  }, [params.questionId]);

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
        setError('Microphone access denied. Please allow microphone access.');
      }
    };
    
    recognition.onend = () => {
      if (pageState === 'recording') {
        try {
          recognition.start();
        } catch (e) {
          // Already started
        }
      }
    };
    
    recognitionRef.current = recognition;
    
    return () => {
      recognition.stop();
    };
  }, [pageState]);

  // Recording timer
  useEffect(() => {
    if (pageState === 'recording') {
      timerRef.current = setInterval(() => {
        setRecordingTime(prev => prev + 1);
      }, 1000);
    } else {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    }
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [pageState]);

  const startNewSession = useCallback((session: VoiceSession) => {
    const newState = startSession(session);
    setSessionState(newState);
    saveSessionState(newState);
    setPageState('intro');
  }, []);

  const beginQuestions = useCallback(() => {
    if (!sessionState) return;
    const updated = { ...sessionState, status: 'in-progress' as const };
    setSessionState(updated);
    saveSessionState(updated);
    setPageState('recording');
    setTranscript('');
    setInterimTranscript('');
    setRecordingTime(0);
  }, [sessionState]);

  const startRecording = useCallback(() => {
    if (!recognitionRef.current) return;
    
    setTranscript('');
    setInterimTranscript('');
    setRecordingTime(0);
    setError(null);
    
    try {
      recognitionRef.current.start();
      setPageState('recording');
    } catch (err) {
      setError('Failed to start recording. Check microphone permissions.');
    }
  }, []);

  const stopRecording = useCallback(() => {
    if (!recognitionRef.current) return;
    recognitionRef.current.stop();
    setPageState('editing');
  }, []);

  const submitCurrentAnswer = useCallback(() => {
    if (!sessionState || !transcript.trim()) {
      setError('Please provide an answer.');
      return;
    }
    
    const updated = submitAnswer(sessionState, transcript.trim());
    setSessionState(updated);
    saveSessionState(updated);
    
    // Show feedback for this answer
    setPageState('feedback');
  }, [sessionState, transcript]);

  const nextMicroQuestion = useCallback(() => {
    if (!sessionState) return;
    
    const nextIndex = sessionState.currentQuestionIndex + 1;
    
    if (nextIndex >= sessionState.session.microQuestions.length) {
      // Session complete
      const result = completeSession(sessionState);
      setSessionResult(result);
      saveSessionToHistory(result);
      clearSessionState();
      
      // Award credits
      const verdict = result.overallScore >= 60 ? 'hire' : 'no-hire';
      onVoiceInterview(verdict);
      
      setPageState('results');
    } else {
      // Move to next question
      const updated = {
        ...sessionState,
        currentQuestionIndex: nextIndex
      };
      setSessionState(updated);
      saveSessionState(updated);
      setTranscript('');
      setInterimTranscript('');
      setRecordingTime(0);
      setPageState('recording');
    }
  }, [sessionState, onVoiceInterview]);

  const retryQuestion = useCallback(() => {
    setTranscript('');
    setInterimTranscript('');
    setRecordingTime(0);
    setPageState('recording');
  }, []);

  const exitSession = useCallback(() => {
    clearSessionState();
    setSessionState(null);
    setSessionResult(null);
    setPageState('select');
  }, []);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  // Unsupported browser
  if (!isSpeechSupported) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <div className="max-w-md text-center">
          <AlertCircle className="w-16 h-16 text-orange-500 mx-auto mb-4" />
          <h1 className="text-xl font-bold mb-2">Browser Not Supported</h1>
          <p className="text-muted-foreground mb-4">
            Voice sessions require the Web Speech API. Please use Chrome, Edge, or Safari.
          </p>
          <button
            onClick={() => setLocation('/')}
            className="px-4 py-2 bg-primary text-primary-foreground rounded hover:bg-primary/90"
          >
            Go Home
          </button>
        </div>
      </div>
    );
  }

  // Loading state
  if (pageState === 'loading') {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin text-primary mx-auto mb-4" />
          <p className="text-muted-foreground">Loading voice sessions...</p>
        </div>
      </div>
    );
  }


  // Session selection
  if (pageState === 'select') {
    return (
      <>
        <SEOHead
          title="Voice Interview Sessions | Code Reels"
          description="Practice interview questions with focused micro-question sessions"
          canonical="https://open-interview.github.io/voice-session"
        />
        <div className="min-h-screen bg-background text-foreground font-mono">
          <header className="border-b border-border p-4">
            <div className="max-w-4xl mx-auto flex items-center justify-between">
              <div className="flex items-center gap-3">
                <button
                  onClick={() => setLocation('/')}
                  className="p-2 hover:bg-muted/20 rounded-lg transition-colors"
                >
                  <Home className="w-5 h-5" />
                </button>
                <div>
                  <h1 className="font-bold flex items-center gap-2">
                    <Target className="w-5 h-5 text-primary" />
                    Voice Sessions
                  </h1>
                  <p className="text-xs text-muted-foreground">
                    Focused micro-question practice
                  </p>
                </div>
              </div>
              <CreditsDisplay compact onClick={() => setLocation('/profile')} />
            </div>
          </header>

          <main className="max-w-4xl mx-auto p-4">
            <div className="mb-6">
              <h2 className="text-lg font-bold mb-2">Choose a Topic</h2>
              <p className="text-sm text-muted-foreground">
                Each session breaks down a topic into 4-6 focused questions with 1-2 sentence answers.
              </p>
            </div>

            {availableSessions.length === 0 ? (
              <div className="text-center py-12">
                <AlertCircle className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                <p className="text-muted-foreground">No sessions available yet.</p>
                <p className="text-sm text-muted-foreground mt-2">
                  Questions need voiceKeywords to generate sessions.
                </p>
              </div>
            ) : (
              <div className="grid gap-3">
                {availableSessions.map((session) => (
                  <button
                    key={session.id}
                    onClick={() => startNewSession(session)}
                    className="p-4 bg-card border border-border rounded-lg text-left hover:border-primary/50 hover:bg-muted/10 transition-all group"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex-1">
                        <h3 className="font-medium group-hover:text-primary transition-colors">
                          {session.topic}
                        </h3>
                        <p className="text-sm text-muted-foreground mt-1 line-clamp-2">
                          {session.contextQuestion}
                        </p>
                        <div className="flex items-center gap-3 mt-2">
                          <span className={`px-2 py-0.5 text-xs rounded ${
                            session.difficulty === 'beginner' ? 'bg-green-500/20 text-green-400' :
                            session.difficulty === 'intermediate' ? 'bg-yellow-500/20 text-yellow-400' :
                            'bg-red-500/20 text-red-400'
                          }`}>
                            {session.difficulty}
                          </span>
                          <span className="text-xs text-muted-foreground">
                            {session.totalQuestions} questions
                          </span>
                          <span className="text-xs text-muted-foreground">
                            {session.channel}
                          </span>
                        </div>
                      </div>
                      <ChevronRight className="w-5 h-5 text-muted-foreground group-hover:text-primary transition-colors" />
                    </div>
                  </button>
                ))}
              </div>
            )}
          </main>
        </div>
      </>
    );
  }

  // Session intro
  if (pageState === 'intro' && sessionState) {
    return (
      <>
        <SEOHead
          title={`${sessionState.session.topic} | Voice Session`}
          description="Voice interview session practice"
        />
        <div className="min-h-screen bg-background text-foreground font-mono flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="max-w-lg w-full bg-card border border-border rounded-lg p-6"
          >
            <div className="text-center mb-6">
              <div className="w-16 h-16 rounded-full bg-primary/20 flex items-center justify-center mx-auto mb-4">
                <Target className="w-8 h-8 text-primary" />
              </div>
              <h1 className="text-xl font-bold mb-2">{sessionState.session.topic}</h1>
              <p className="text-sm text-muted-foreground">
                {sessionState.session.totalQuestions} focused questions • ~{sessionState.session.totalQuestions * 30}s each
              </p>
            </div>

            <div className="bg-muted/20 rounded-lg p-4 mb-6">
              <h3 className="text-sm font-medium mb-2 flex items-center gap-2">
                <MessageSquare className="w-4 h-4" />
                Topic Overview
              </h3>
              <p className="text-sm text-muted-foreground">
                {sessionState.session.contextQuestion}
              </p>
            </div>

            <div className="space-y-2 mb-6">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <CheckCircle className="w-4 h-4 text-green-500" />
                <span>Answer each question in 1-2 sentences</span>
              </div>
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <CheckCircle className="w-4 h-4 text-green-500" />
                <span>Use specific technical terms</span>
              </div>
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <CheckCircle className="w-4 h-4 text-green-500" />
                <span>Get instant feedback after each answer</span>
              </div>
            </div>

            <div className="flex gap-3">
              <button
                onClick={exitSession}
                className="flex-1 px-4 py-3 border border-border rounded-lg hover:bg-muted/20 transition-colors"
              >
                Back
              </button>
              <button
                onClick={beginQuestions}
                className="flex-1 px-4 py-3 bg-primary text-primary-foreground font-bold rounded-lg hover:bg-primary/90 transition-colors flex items-center justify-center gap-2"
              >
                <Play className="w-4 h-4" />
                Start Session
              </button>
            </div>
          </motion.div>
        </div>
      </>
    );
  }


  // Recording/Editing state
  if ((pageState === 'recording' || pageState === 'editing') && sessionState && currentQuestion) {
    const progress = ((sessionState.currentQuestionIndex + 1) / sessionState.session.totalQuestions) * 100;
    
    return (
      <>
        <SEOHead title={`Question ${sessionState.currentQuestionIndex + 1} | Voice Session`} />
        <div className="min-h-screen bg-background text-foreground font-mono">
          {/* Header */}
          <header className="border-b border-border p-4">
            <div className="max-w-4xl mx-auto">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-3">
                  <button
                    onClick={exitSession}
                    className="p-2 hover:bg-muted/20 rounded-lg transition-colors"
                  >
                    <Home className="w-5 h-5" />
                  </button>
                  <div>
                    <h1 className="font-bold text-sm">{sessionState.session.topic}</h1>
                    <p className="text-xs text-muted-foreground">
                      Question {sessionState.currentQuestionIndex + 1} of {sessionState.session.totalQuestions}
                    </p>
                  </div>
                </div>
                <span className={`px-2 py-1 text-xs rounded ${
                  currentQuestion.difficulty === 'easy' ? 'bg-green-500/20 text-green-400' :
                  currentQuestion.difficulty === 'medium' ? 'bg-yellow-500/20 text-yellow-400' :
                  'bg-red-500/20 text-red-400'
                }`}>
                  {currentQuestion.difficulty}
                </span>
              </div>
              
              {/* Progress bar */}
              <div className="h-1 bg-muted rounded-full overflow-hidden">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${progress}%` }}
                  className="h-full bg-primary rounded-full"
                />
              </div>
            </div>
          </header>

          <main className="max-w-4xl mx-auto p-4">
            {/* Question */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-card border border-border rounded-lg p-6 mb-6"
            >
              <div className="flex items-start gap-3">
                <MessageSquare className="w-5 h-5 text-primary flex-shrink-0 mt-1" />
                <div className="flex-1">
                  <h2 className="text-lg font-medium">{currentQuestion.question}</h2>
                  <div className="flex items-center gap-3 mt-3">
                    <ListenButton text={currentQuestion.question} label="Listen" size="sm" />
                    <span className="text-xs text-muted-foreground">
                      {currentQuestion.keywords.length} key terms expected
                    </span>
                  </div>
                </div>
              </div>
              
              {error && (
                <div className="mt-4 p-3 bg-red-500/10 border border-red-500/30 rounded-lg text-red-400 text-sm">
                  {error}
                </div>
              )}
            </motion.div>

            {/* Recording Interface */}
            <div className="bg-card border border-border rounded-lg p-6 mb-6">
              {/* Status */}
              <div className="flex items-center justify-center gap-4 mb-6">
                {pageState === 'recording' && (
                  <div className="flex items-center gap-2 text-red-500">
                    <span className="w-3 h-3 bg-red-500 rounded-full animate-pulse" />
                    <span className="font-mono">{formatTime(recordingTime)}</span>
                  </div>
                )}
                {pageState === 'editing' && (
                  <div className="flex items-center gap-2 text-amber-500">
                    <Edit3 className="w-4 h-4" />
                    <span className="text-sm">Edit your answer, then submit</span>
                  </div>
                )}
              </div>

              {/* Transcript */}
              {(pageState === 'recording' || pageState === 'editing' || transcript) && (
                <div className="mb-6">
                  {pageState === 'editing' ? (
                    <textarea
                      value={transcript}
                      onChange={(e) => setTranscript(e.target.value)}
                      className="w-full p-4 bg-muted/20 border border-amber-500/30 rounded-lg min-h-[100px] text-sm resize-y focus:outline-none focus:ring-2 focus:ring-amber-500/50"
                      placeholder="Edit your answer..."
                    />
                  ) : (
                    <div className="p-4 bg-muted/20 rounded-lg min-h-[80px]">
                      <p className="text-sm whitespace-pre-wrap">
                        {transcript}
                        <span className="text-muted-foreground">{interimTranscript}</span>
                        {pageState === 'recording' && <span className="animate-pulse">|</span>}
                      </p>
                    </div>
                  )}
                  <p className="text-xs text-muted-foreground mt-2">
                    💡 Keep it brief: 1-2 sentences with key terms
                  </p>
                </div>
              )}

              {/* Controls */}
              <div className="flex items-center justify-center gap-4">
                {pageState === 'recording' && (
                  <button
                    onClick={stopRecording}
                    className="flex items-center gap-2 px-6 py-3 bg-red-500 text-white font-bold rounded-full hover:bg-red-600 transition-all"
                  >
                    <Square className="w-5 h-5" />
                    Stop
                  </button>
                )}
                
                {pageState === 'editing' && (
                  <div className="flex gap-3">
                    <button
                      onClick={retryQuestion}
                      className="flex items-center gap-2 px-4 py-2 border border-border rounded-lg hover:bg-muted/20 transition-colors"
                    >
                      <RotateCcw className="w-4 h-4" />
                      Re-record
                    </button>
                    <button
                      onClick={submitCurrentAnswer}
                      disabled={!transcript.trim()}
                      className="flex items-center gap-2 px-6 py-3 bg-primary text-primary-foreground font-bold rounded-full hover:bg-primary/90 transition-all disabled:opacity-50"
                    >
                      <CheckCircle className="w-5 h-5" />
                      Submit
                    </button>
                  </div>
                )}
              </div>
            </div>
          </main>
        </div>
      </>
    );
  }


  // Feedback state (after answering a micro-question)
  if (pageState === 'feedback' && sessionState) {
    const lastAnswer = sessionState.answers[sessionState.answers.length - 1];
    const answeredQuestion = sessionState.session.microQuestions[sessionState.currentQuestionIndex];
    const isLastQuestion = sessionState.currentQuestionIndex >= sessionState.session.totalQuestions - 1;
    
    return (
      <>
        <SEOHead title="Answer Feedback | Voice Session" />
        <div className="min-h-screen bg-background text-foreground font-mono flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="max-w-lg w-full bg-card border border-border rounded-lg p-6"
          >
            {/* Score */}
            <div className="text-center mb-6">
              <div className={`w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-4 ${
                lastAnswer.isCorrect 
                  ? 'bg-green-500/20 text-green-400' 
                  : 'bg-red-500/20 text-red-400'
              }`}>
                {lastAnswer.isCorrect ? (
                  <CheckCircle className="w-10 h-10" />
                ) : (
                  <XCircle className="w-10 h-10" />
                )}
              </div>
              <div className="text-3xl font-bold mb-1">{lastAnswer.score}%</div>
              <p className="text-sm text-muted-foreground">
                {lastAnswer.isCorrect ? 'Good answer!' : 'Needs improvement'}
              </p>
            </div>

            {/* Feedback */}
            <div className="bg-muted/20 rounded-lg p-4 mb-4">
              <p className="text-sm">{lastAnswer.feedback}</p>
            </div>

            {/* Keywords */}
            <div className="space-y-3 mb-6">
              {lastAnswer.keywordsCovered.length > 0 && (
                <div>
                  <h4 className="text-xs font-medium text-green-400 mb-2 flex items-center gap-1">
                    <CheckCircle className="w-3 h-3" />
                    Keywords covered
                  </h4>
                  <div className="flex flex-wrap gap-1">
                    {lastAnswer.keywordsCovered.map((kw, i) => (
                      <span key={i} className="px-2 py-0.5 text-xs bg-green-500/20 text-green-400 rounded">
                        {kw}
                      </span>
                    ))}
                  </div>
                </div>
              )}
              
              {lastAnswer.keywordsMissed.length > 0 && (
                <div>
                  <h4 className="text-xs font-medium text-red-400 mb-2 flex items-center gap-1">
                    <XCircle className="w-3 h-3" />
                    Keywords missed
                  </h4>
                  <div className="flex flex-wrap gap-1">
                    {lastAnswer.keywordsMissed.map((kw, i) => (
                      <span key={i} className="px-2 py-0.5 text-xs bg-red-500/20 text-red-400 rounded">
                        {kw}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Expected Answer */}
            <div className="bg-muted/10 border border-border/50 rounded-lg p-3 mb-6">
              <h4 className="text-xs font-medium text-muted-foreground mb-1">Expected answer:</h4>
              <p className="text-sm">{answeredQuestion.expectedAnswer}</p>
            </div>

            {/* Actions */}
            <div className="flex gap-3">
              <button
                onClick={retryQuestion}
                className="flex-1 px-4 py-3 border border-border rounded-lg hover:bg-muted/20 transition-colors flex items-center justify-center gap-2"
              >
                <RotateCcw className="w-4 h-4" />
                Retry
              </button>
              <button
                onClick={nextMicroQuestion}
                className="flex-1 px-4 py-3 bg-primary text-primary-foreground font-bold rounded-lg hover:bg-primary/90 transition-colors flex items-center justify-center gap-2"
              >
                {isLastQuestion ? (
                  <>
                    <BarChart3 className="w-4 h-4" />
                    See Results
                  </>
                ) : (
                  <>
                    Next Question
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </div>
          </motion.div>
        </div>
      </>
    );
  }

  // Results state
  if (pageState === 'results' && sessionResult) {
    return (
      <>
        <SEOHead title="Session Results | Voice Session" />
        <div className="min-h-screen bg-background text-foreground font-mono">
          <header className="border-b border-border p-4">
            <div className="max-w-4xl mx-auto flex items-center justify-between">
              <h1 className="font-bold flex items-center gap-2">
                <BarChart3 className="w-5 h-5 text-primary" />
                Session Complete
              </h1>
              <CreditsDisplay compact onClick={() => setLocation('/profile')} />
            </div>
          </header>

          <main className="max-w-4xl mx-auto p-4">
            {/* Overall Score */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-card border border-border rounded-lg p-6 mb-6 text-center"
            >
              <div className={`w-24 h-24 rounded-full flex items-center justify-center mx-auto mb-4 ${
                sessionResult.verdict === 'excellent' ? 'bg-green-500/20' :
                sessionResult.verdict === 'good' ? 'bg-blue-500/20' :
                sessionResult.verdict === 'needs-work' ? 'bg-yellow-500/20' :
                'bg-red-500/20'
              }`}>
                <span className={`text-4xl font-bold ${
                  sessionResult.verdict === 'excellent' ? 'text-green-400' :
                  sessionResult.verdict === 'good' ? 'text-blue-400' :
                  sessionResult.verdict === 'needs-work' ? 'text-yellow-400' :
                  'text-red-400'
                }`}>
                  {sessionResult.overallScore}%
                </span>
              </div>
              
              <h2 className="text-xl font-bold mb-2">{sessionResult.topic}</h2>
              <p className={`text-sm font-medium ${
                sessionResult.verdict === 'excellent' ? 'text-green-400' :
                sessionResult.verdict === 'good' ? 'text-blue-400' :
                sessionResult.verdict === 'needs-work' ? 'text-yellow-400' :
                'text-red-400'
              }`}>
                {sessionResult.verdict === 'excellent' ? '🌟 Excellent!' :
                 sessionResult.verdict === 'good' ? '👍 Good Job!' :
                 sessionResult.verdict === 'needs-work' ? '📚 Needs Practice' :
                 '🔄 Review Topic'}
              </p>
              <p className="text-sm text-muted-foreground mt-2">{sessionResult.summary}</p>
            </motion.div>

            {/* Question Breakdown */}
            <div className="bg-card border border-border rounded-lg p-6 mb-6">
              <h3 className="font-bold mb-4">Question Breakdown</h3>
              <div className="space-y-3">
                {sessionResult.answers.map((answer, index) => (
                  <div
                    key={answer.questionId}
                    className="flex items-center justify-between p-3 bg-muted/10 rounded-lg"
                  >
                    <div className="flex items-center gap-3">
                      <span className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${
                        answer.isCorrect ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'
                      }`}>
                        {index + 1}
                      </span>
                      <span className="text-sm">Question {index + 1}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className={`text-sm font-bold ${
                        answer.score >= 60 ? 'text-green-400' : 'text-red-400'
                      }`}>
                        {answer.score}%
                      </span>
                      {answer.isCorrect ? (
                        <CheckCircle className="w-4 h-4 text-green-400" />
                      ) : (
                        <XCircle className="w-4 h-4 text-red-400" />
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Strengths & Improvements */}
            <div className="grid md:grid-cols-2 gap-4 mb-6">
              {sessionResult.strengths.length > 0 && (
                <div className="bg-card border border-border rounded-lg p-4">
                  <h4 className="font-medium text-green-400 mb-3 flex items-center gap-2">
                    <Sparkles className="w-4 h-4" />
                    Strengths
                  </h4>
                  <ul className="space-y-2">
                    {sessionResult.strengths.map((s, i) => (
                      <li key={i} className="text-sm text-muted-foreground flex items-start gap-2">
                        <CheckCircle className="w-4 h-4 text-green-400 flex-shrink-0 mt-0.5" />
                        {s}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
              
              {sessionResult.areasToImprove.length > 0 && (
                <div className="bg-card border border-border rounded-lg p-4">
                  <h4 className="font-medium text-amber-400 mb-3 flex items-center gap-2">
                    <Target className="w-4 h-4" />
                    Areas to Improve
                  </h4>
                  <ul className="space-y-2">
                    {sessionResult.areasToImprove.map((a, i) => (
                      <li key={i} className="text-sm text-muted-foreground flex items-start gap-2">
                        <ArrowRight className="w-4 h-4 text-amber-400 flex-shrink-0 mt-0.5" />
                        {a}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>

            {/* Actions */}
            <div className="flex gap-3">
              <button
                onClick={() => setLocation('/')}
                className="flex-1 px-4 py-3 border border-border rounded-lg hover:bg-muted/20 transition-colors"
              >
                <Home className="w-4 h-4 inline mr-2" />
                Home
              </button>
              <button
                onClick={exitSession}
                className="flex-1 px-4 py-3 bg-primary text-primary-foreground font-bold rounded-lg hover:bg-primary/90 transition-colors"
              >
                <Target className="w-4 h-4 inline mr-2" />
                New Session
              </button>
            </div>
          </main>
        </div>
      </>
    );
  }

  // Fallback
  return null;
}
