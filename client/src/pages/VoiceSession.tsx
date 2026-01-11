/**
 * Voice Interview Session Page - Redesigned
 * Modern GitHub-inspired dark theme with polished UI
 */

import { useState, useEffect, useRef, useCallback } from 'react';
import { useLocation } from 'wouter';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Mic, Square, RotateCcw, Home, ChevronRight,
  CheckCircle, XCircle, AlertCircle, Loader2,
  Target, MessageSquare, Edit3,
  BarChart3, Sparkles, Play, ArrowRight, BookOpen, Volume2,
  Clock, Zap, Award, Trophy
} from 'lucide-react';
import { SEOHead } from '../components/SEOHead';
import { getAllQuestionsAsync } from '../lib/questions-loader';
import { useCredits } from '../context/CreditsContext';
import { useAchievementContext } from '../context/AchievementContext';
import { useUserPreferences } from '../hooks/use-user-preferences';
import { CreditsDisplay } from '../components/CreditsDisplay';
import { ListenButton } from '../components/ListenButton';
import { DesktopSidebarWrapper } from '../components/layout/DesktopSidebarWrapper';
import { QuestionHistoryIcon } from '../components/unified/QuestionHistory';
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

type PageState = 'loading' | 'select' | 'intro' | 'recording' | 'editing' | 'feedback' | 'practice' | 'results';

const isSpeechSupported = typeof window !== 'undefined' && 
  ('SpeechRecognition' in window || 'webkitSpeechRecognition' in window);

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
  const [recordingTime, setRecordingTime] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [practiceTranscript, setPracticeTranscript] = useState('');
  
  const recognitionRef = useRef<any>(null);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  
  const { onVoiceInterview } = useCredits();
  const { trackEvent } = useAchievementContext();

  const currentQuestion = sessionState ? getCurrentQuestion(sessionState) : null;

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
        if (result.isFinal) final += result[0].transcript + ' ';
        else interim += result[0].transcript;
      }
      if (final) {
        if (pageState === 'practice') setPracticeTranscript(prev => prev + final);
        else setTranscript(prev => prev + final);
      }
      setInterimTranscript(interim);
    };
    
    recognition.onerror = (event: any) => {
      console.error('Speech recognition error:', event.error);
      if (event.error === 'not-allowed') setError('Microphone access denied.');
    };
    
    recognition.onend = () => {
      if (pageState === 'recording' || pageState === 'practice') {
        try { recognition.start(); } catch (e) { /* ignore */ }
      }
    };
    
    recognitionRef.current = recognition;
    return () => { recognition.stop(); };
  }, [pageState]);

  // Recording timer
  useEffect(() => {
    if (pageState === 'recording' || pageState === 'practice') {
      timerRef.current = setInterval(() => setRecordingTime(prev => prev + 1), 1000);
    } else if (timerRef.current) {
      clearInterval(timerRef.current);
    }
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, [pageState]);

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
    setRecordingTime(0);
    
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
      setRecordingTime(0);
      
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
    setRecordingTime(0);
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

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  // Unsupported browser
  if (!isSpeechSupported) {
    return (
      <div className="min-h-screen bg-[#0d1117] flex items-center justify-center p-4">
        <div className="max-w-md text-center">
          <div className="w-20 h-20 rounded-2xl bg-[#d29922]/20 flex items-center justify-center mx-auto mb-6">
            <AlertCircle className="w-10 h-10 text-[#d29922]" />
          </div>
          <h1 className="text-2xl font-bold text-white mb-3">Browser Not Supported</h1>
          <p className="text-[#8b949e] mb-6">Voice sessions require the Web Speech API. Use Chrome, Edge, or Safari.</p>
          <button onClick={() => setLocation('/')} className="px-6 py-3 bg-[#238636] text-white font-medium rounded-xl hover:bg-[#2ea043] transition-colors">
            Go Home
          </button>
        </div>
      </div>
    );
  }

  // Loading
  if (pageState === 'loading') {
    return (
      <div className="min-h-screen bg-[#0d1117] flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 rounded-2xl bg-[#58a6ff]/20 flex items-center justify-center mx-auto mb-4">
            <Loader2 className="w-8 h-8 animate-spin text-[#58a6ff]" />
          </div>
          <p className="text-[#8b949e]">Loading sessions...</p>
        </div>
      </div>
    );
  }

  // Session selection
  if (pageState === 'select') {
    const byChannel: Record<string, VoiceSession[]> = {};
    for (const session of availableSessions) {
      if (!byChannel[session.channel]) byChannel[session.channel] = [];
      byChannel[session.channel].push(session);
    }

    return (
      <>
        <SEOHead title="Voice Sessions | Code Reels" description="Practice interview topics with focused question sessions" />
        <div className="min-h-screen bg-[#0d1117] text-[#e6edf3]">
          {/* Header */}
          <header className="sticky top-0 z-50 border-b border-[#30363d] bg-[#0d1117]/95 backdrop-blur-md">
            <div className="max-w-4xl mx-auto px-4 h-16 flex items-center justify-between">
              <div className="flex items-center gap-4">
                <button onClick={() => setLocation('/')} className="p-2 hover:bg-[#21262d] rounded-lg transition-colors">
                  <Home className="w-5 h-5 text-[#8b949e]" />
                </button>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#a371f7] to-[#f778ba] flex items-center justify-center">
                    <Target className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <h1 className="font-semibold text-white">Voice Sessions</h1>
                    <p className="text-xs text-[#8b949e]">{availableSessions.length} sessions available</p>
                  </div>
                </div>
              </div>
              <CreditsDisplay compact onClick={() => setLocation('/profile')} />
            </div>
          </header>

          <main className="max-w-4xl mx-auto px-4 py-6">
            {availableSessions.length === 0 ? (
              <div className="text-center py-16">
                <div className="w-20 h-20 rounded-2xl bg-[#21262d] flex items-center justify-center mx-auto mb-6">
                  <AlertCircle className="w-10 h-10 text-[#6e7681]" />
                </div>
                <h2 className="text-xl font-semibold text-white mb-2">No Sessions Available</h2>
                <p className="text-[#8b949e] mb-6">Subscribe to channels to unlock voice sessions.</p>
                <button
                  onClick={() => setLocation('/channels')}
                  className="px-6 py-3 bg-[#238636] text-white font-medium rounded-xl hover:bg-[#2ea043] transition-colors"
                >
                  Subscribe to Channels
                </button>
              </div>
            ) : (
              <div className="space-y-8">
                {Object.entries(byChannel).map(([channel, sessions]) => (
                  <div key={channel}>
                    <h2 className="text-xs font-semibold text-[#8b949e] uppercase tracking-wider mb-4 flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full bg-[#58a6ff]" />
                      {channel.replace(/-/g, ' ')}
                    </h2>
                    <div className="grid gap-3">
                      {sessions.map((session) => (
                        <motion.button
                          key={session.id}
                          onClick={() => startNewSession(session)}
                          whileHover={{ scale: 1.01 }}
                          whileTap={{ scale: 0.99 }}
                          className="p-5 bg-[#161b22] border border-[#30363d] rounded-2xl text-left hover:border-[#58a6ff]/50 transition-all group"
                        >
                          <div className="flex items-start justify-between gap-4">
                            <div className="flex-1">
                              <h3 className="font-semibold text-white group-hover:text-[#58a6ff] transition-colors mb-1">
                                {session.topic}
                              </h3>
                              <p className="text-sm text-[#8b949e] mb-3">{session.description}</p>
                              <div className="flex items-center gap-3">
                                <span className={`px-2.5 py-1 text-xs font-medium rounded-lg ${
                                  session.difficulty === 'beginner' ? 'bg-[#238636]/20 text-[#3fb950]' :
                                  session.difficulty === 'intermediate' ? 'bg-[#d29922]/20 text-[#d29922]' :
                                  'bg-[#f85149]/20 text-[#f85149]'
                                }`}>
                                  {session.difficulty}
                                </span>
                                <span className="text-xs text-[#6e7681] flex items-center gap-1">
                                  <MessageSquare className="w-3.5 h-3.5" />
                                  {session.totalQuestions} questions
                                </span>
                                <span className="text-xs text-[#6e7681] flex items-center gap-1">
                                  <Clock className="w-3.5 h-3.5" />
                                  ~{session.estimatedMinutes} min
                                </span>
                              </div>
                            </div>
                            <div className="p-2 rounded-lg bg-[#21262d] group-hover:bg-[#58a6ff]/20 transition-colors">
                              <ChevronRight className="w-5 h-5 text-[#6e7681] group-hover:text-[#58a6ff]" />
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
      </>
    );
  }


  // Session intro
  if (pageState === 'intro' && sessionState) {
    return (
      <>
        <SEOHead title={`${sessionState.session.topic} | Voice Session`} description="Voice interview session practice" />
        <div className="min-h-screen bg-[#0d1117] text-[#e6edf3] flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="max-w-lg w-full"
          >
            <div className="rounded-2xl border border-[#30363d] bg-[#161b22] overflow-hidden">
              <div className="p-8 text-center">
                <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-[#a371f7] to-[#f778ba] flex items-center justify-center mx-auto mb-6">
                  <Target className="w-10 h-10 text-white" />
                </div>
                <h1 className="text-2xl font-bold text-white mb-2">{sessionState.session.topic}</h1>
                <p className="text-[#8b949e] mb-6">
                  {sessionState.questions.length} questions • ~{sessionState.session.estimatedMinutes} min
                </p>
                
                <div className="bg-[#0d1117] rounded-xl p-4 mb-6 text-left">
                  <p className="text-sm text-[#8b949e]">{sessionState.session.description}</p>
                </div>

                <div className="space-y-3 mb-8 text-left">
                  <div className="flex items-center gap-3 text-sm text-[#8b949e]">
                    <div className="w-8 h-8 rounded-lg bg-[#238636]/20 flex items-center justify-center">
                      <CheckCircle className="w-4 h-4 text-[#3fb950]" />
                    </div>
                    <span>Answer each question in 1-2 sentences</span>
                  </div>
                  <div className="flex items-center gap-3 text-sm text-[#8b949e]">
                    <div className="w-8 h-8 rounded-lg bg-[#58a6ff]/20 flex items-center justify-center">
                      <Zap className="w-4 h-4 text-[#58a6ff]" />
                    </div>
                    <span>Use specific technical terms</span>
                  </div>
                  <div className="flex items-center gap-3 text-sm text-[#8b949e]">
                    <div className="w-8 h-8 rounded-lg bg-[#a371f7]/20 flex items-center justify-center">
                      <Sparkles className="w-4 h-4 text-[#a371f7]" />
                    </div>
                    <span>Get instant feedback after each answer</span>
                  </div>
                </div>
              </div>

              <div className="p-4 bg-[#0d1117] border-t border-[#30363d] flex gap-3">
                <button 
                  onClick={exitSession} 
                  className="flex-1 px-4 py-3 border border-[#30363d] text-[#8b949e] hover:text-white hover:border-[#8b949e] rounded-xl transition-colors"
                >
                  Back
                </button>
                <button
                  onClick={beginQuestions}
                  className="flex-1 px-4 py-3 bg-[#238636] text-white font-semibold rounded-xl hover:bg-[#2ea043] transition-colors flex items-center justify-center gap-2"
                >
                  <Play className="w-5 h-5" />
                  Start Session
                </button>
              </div>
            </div>
          </motion.div>
        </div>
      </>
    );
  }

  // Recording/Editing
  if ((pageState === 'recording' || pageState === 'editing') && sessionState && currentQuestion) {
    const progress = ((sessionState.currentQuestionIndex + 1) / sessionState.questions.length) * 100;
    
    return (
      <>
        <SEOHead title={`Q${sessionState.currentQuestionIndex + 1} | ${sessionState.session.topic}`} description="Answer the interview question" />
        <div className="min-h-screen bg-[#0d1117] text-[#e6edf3]">
          {/* Header */}
          <header className="sticky top-0 z-50 border-b border-[#30363d] bg-[#0d1117]/95 backdrop-blur-md">
            <div className="max-w-4xl mx-auto px-4">
              <div className="h-16 flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <button onClick={exitSession} className="p-2 hover:bg-[#21262d] rounded-lg transition-colors">
                    <Home className="w-5 h-5 text-[#8b949e]" />
                  </button>
                  <div>
                    <h1 className="font-semibold text-white text-sm">{sessionState.session.topic}</h1>
                    <p className="text-xs text-[#8b949e]">Question {sessionState.currentQuestionIndex + 1} of {sessionState.questions.length}</p>
                  </div>
                </div>
                <span className={`px-2.5 py-1 text-xs font-medium rounded-lg ${
                  currentQuestion.difficulty === 'beginner' ? 'bg-[#238636]/20 text-[#3fb950]' :
                  currentQuestion.difficulty === 'intermediate' ? 'bg-[#d29922]/20 text-[#d29922]' :
                  'bg-[#f85149]/20 text-[#f85149]'
                }`}>
                  {currentQuestion.difficulty}
                </span>
                <QuestionHistoryIcon 
                  questionId={currentQuestion.id} 
                  questionType="question"
                  size="sm"
                />
              </div>
              <div className="pb-3">
                <div className="h-1.5 bg-[#21262d] rounded-full overflow-hidden">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${progress}%` }}
                    className="h-full bg-gradient-to-r from-[#a371f7] to-[#f778ba] rounded-full"
                  />
                </div>
              </div>
            </div>
          </header>

          <main className="max-w-4xl mx-auto px-4 py-6">
            {/* Question */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="rounded-2xl border border-[#30363d] bg-[#161b22] p-6 mb-6"
            >
              <div className="flex items-start gap-4">
                <div className="p-2.5 rounded-xl bg-[#58a6ff]/10 flex-shrink-0">
                  <MessageSquare className="w-5 h-5 text-[#58a6ff]" />
                </div>
                <div className="flex-1">
                  <h2 className="text-lg font-medium text-white leading-relaxed">{currentQuestion.question}</h2>
                  <div className="flex items-center gap-3 mt-4">
                    <ListenButton text={currentQuestion.question} label="Listen" size="sm" />
                    <span className="text-xs text-[#6e7681]">{currentQuestion.criticalPoints.length} key points</span>
                  </div>
                </div>
              </div>
              {error && (
                <div className="mt-4 p-4 bg-[#f85149]/10 border border-[#f85149]/30 rounded-xl text-[#f85149] text-sm">
                  {error}
                </div>
              )}
            </motion.div>

            {/* Recording Interface */}
            <div className="rounded-2xl border border-[#30363d] bg-[#161b22] p-6">
              <div className="flex items-center justify-center gap-4 mb-6">
                {pageState === 'recording' && (
                  <div className="flex items-center gap-3 px-4 py-2 bg-[#f85149]/10 border border-[#f85149]/30 rounded-full">
                    <span className="w-3 h-3 bg-[#f85149] rounded-full animate-pulse" />
                    <span className="font-mono text-[#f85149] font-medium">{formatTime(recordingTime)}</span>
                  </div>
                )}
                {pageState === 'editing' && (
                  <div className="flex items-center gap-2 px-4 py-2 bg-[#d29922]/10 border border-[#d29922]/30 rounded-full">
                    <Edit3 className="w-4 h-4 text-[#d29922]" />
                    <span className="text-sm text-[#d29922]">Edit, then submit</span>
                  </div>
                )}
              </div>

              {/* Transcript */}
              <div className="mb-6">
                {pageState === 'editing' ? (
                  <textarea
                    value={transcript}
                    onChange={(e) => setTranscript(e.target.value)}
                    className="w-full p-4 bg-[#0d1117] border border-[#d29922]/30 rounded-xl min-h-[100px] text-sm text-[#e6edf3] resize-y focus:outline-none focus:ring-2 focus:ring-[#d29922]/50"
                    placeholder="Edit your answer..."
                  />
                ) : (
                  <div className="p-4 bg-[#0d1117] rounded-xl min-h-[80px] border border-[#30363d]">
                    <p className="text-sm text-[#e6edf3] whitespace-pre-wrap">
                      {transcript}
                      <span className="text-[#6e7681]">{interimTranscript}</span>
                      {pageState === 'recording' && <span className="animate-pulse text-[#58a6ff]">|</span>}
                    </p>
                  </div>
                )}
                <p className="text-xs text-[#6e7681] mt-2 flex items-center gap-1.5">
                  <Zap className="w-3.5 h-3.5 text-[#d29922]" />
                  Keep it brief: 1-2 sentences with key terms
                </p>
              </div>

              {/* Controls */}
              <div className="flex items-center justify-center gap-4">
                {pageState === 'recording' && (
                  <button
                    onClick={stopRecording}
                    className="flex items-center gap-3 px-8 py-4 bg-[#f85149] text-white font-semibold rounded-2xl hover:bg-[#da3633] transition-all"
                  >
                    <Square className="w-5 h-5" />
                    Stop
                  </button>
                )}
                {pageState === 'editing' && (
                  <div className="flex gap-3">
                    <button
                      onClick={retryQuestion}
                      className="flex items-center gap-2 px-5 py-3 border border-[#30363d] text-[#8b949e] hover:text-white hover:border-[#8b949e] rounded-xl transition-colors"
                    >
                      <RotateCcw className="w-4 h-4" />
                      Re-record
                    </button>
                    <button
                      onClick={submitCurrentAnswer}
                      disabled={!transcript.trim()}
                      className="flex items-center gap-3 px-8 py-3 bg-[#238636] text-white font-semibold rounded-xl hover:bg-[#2ea043] transition-all disabled:opacity-50"
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


  // Feedback after answering
  if (pageState === 'feedback' && sessionState) {
    const lastAnswer = sessionState.answers[sessionState.answers.length - 1];
    const answeredQuestion = sessionState.questions[sessionState.currentQuestionIndex];
    const isLastQuestion = sessionState.currentQuestionIndex >= sessionState.questions.length - 1;
    
    const startPracticeMode = () => {
      setPracticeTranscript('');
      setInterimTranscript('');
      setRecordingTime(0);
      setPageState('practice');
      if (recognitionRef.current) {
        try { recognitionRef.current.start(); } catch (e) { /* ignore */ }
      }
    };
    
    return (
      <>
        <SEOHead title="Feedback | Voice Session" description="Review your answer feedback" />
        <div className="min-h-screen bg-[#0d1117] text-[#e6edf3] flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="max-w-lg w-full"
          >
            <div className="rounded-2xl border border-[#30363d] bg-[#161b22] overflow-hidden">
              {/* Score Header */}
              <div className="p-8 text-center">
                <div className={`w-24 h-24 rounded-2xl flex items-center justify-center mx-auto mb-4 ${
                  lastAnswer.isCorrect ? 'bg-[#238636]/20' : 'bg-[#f85149]/20'
                }`}>
                  {lastAnswer.isCorrect 
                    ? <CheckCircle className="w-12 h-12 text-[#3fb950]" /> 
                    : <XCircle className="w-12 h-12 text-[#f85149]" />
                  }
                </div>
                <div className="text-4xl font-bold text-white mb-2">{lastAnswer.score}%</div>
                <p className={`text-sm font-medium ${lastAnswer.isCorrect ? 'text-[#3fb950]' : 'text-[#f85149]'}`}>
                  {lastAnswer.isCorrect ? 'Good answer!' : 'Needs improvement'}
                </p>
              </div>

              {/* Feedback Content */}
              <div className="px-6 pb-6 space-y-4">
                <div className="bg-[#0d1117] rounded-xl p-4">
                  <p className="text-sm text-[#8b949e]">{lastAnswer.feedback}</p>
                  <div className="mt-2 text-xs text-[#6e7681]">
                    Score: {lastAnswer.weightedScore}/{lastAnswer.maxPossibleScore} weighted points
                  </div>
                </div>

                {/* Critical Points */}
                <div className="space-y-3">
                  {lastAnswer.pointsCovered.length > 0 && (
                    <div>
                      <h4 className="text-xs font-medium text-[#3fb950] mb-2 flex items-center gap-1.5">
                        <CheckCircle className="w-3.5 h-3.5" /> Covered
                      </h4>
                      <div className="flex flex-wrap gap-1.5">
                        {lastAnswer.pointsCovered.map((point, i) => (
                          <span key={i} className="px-2.5 py-1 text-xs bg-[#238636]/20 text-[#3fb950] rounded-lg font-medium flex items-center gap-1">
                            {point.phrase}
                            <span className="opacity-60">×{point.weight}</span>
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                  {lastAnswer.pointsMissed.length > 0 && (
                    <div>
                      <h4 className="text-xs font-medium text-[#f85149] mb-2 flex items-center gap-1.5">
                        <XCircle className="w-3.5 h-3.5" /> Missed
                      </h4>
                      <div className="flex flex-wrap gap-1.5">
                        {lastAnswer.pointsMissed.map((point, i) => (
                          <span key={i} className="px-2.5 py-1 text-xs bg-[#f85149]/20 text-[#f85149] rounded-lg font-medium flex items-center gap-1">
                            {point.phrase}
                            <span className="opacity-60">×{point.weight}</span>
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                {/* Practice Mode CTA */}
                {answeredQuestion.idealAnswer && (
                  <div className="bg-[#58a6ff]/10 border border-[#58a6ff]/30 rounded-xl p-4">
                    <div className="flex items-start gap-3">
                      <div className="p-2 rounded-lg bg-[#58a6ff]/20">
                        <BookOpen className="w-5 h-5 text-[#58a6ff]" />
                      </div>
                      <div className="flex-1">
                        <h4 className="text-sm font-medium text-[#58a6ff] mb-1">Practice the Ideal Answer</h4>
                        <p className="text-xs text-[#8b949e] mb-3">
                          Read aloud to practice pronunciation and memorize key terms.
                        </p>
                        <button
                          onClick={startPracticeMode}
                          className="flex items-center gap-2 px-3 py-1.5 bg-[#58a6ff]/20 text-[#58a6ff] text-xs font-medium rounded-lg hover:bg-[#58a6ff]/30 transition-colors"
                        >
                          <Mic className="w-3.5 h-3.5" />
                          Practice Reading Aloud
                        </button>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Actions */}
              <div className="p-4 bg-[#0d1117] border-t border-[#30363d] flex gap-3">
                <button
                  onClick={retryQuestion}
                  className="flex-1 px-4 py-3 border border-[#30363d] text-[#8b949e] hover:text-white hover:border-[#8b949e] rounded-xl transition-colors flex items-center justify-center gap-2"
                >
                  <RotateCcw className="w-4 h-4" />
                  Retry
                </button>
                <button
                  onClick={goToNextQuestion}
                  className="flex-1 px-4 py-3 bg-[#238636] text-white font-semibold rounded-xl hover:bg-[#2ea043] transition-colors flex items-center justify-center gap-2"
                >
                  {isLastQuestion ? (
                    <>
                      <BarChart3 className="w-4 h-4" />
                      Results
                    </>
                  ) : (
                    <>
                      Next
                      <ArrowRight className="w-4 h-4" />
                    </>
                  )}
                </button>
              </div>
            </div>
          </motion.div>
        </div>
      </>
    );
  }

  // Practice Mode
  if (pageState === 'practice' && sessionState) {
    const answeredQuestion = sessionState.questions[sessionState.currentQuestionIndex];
    const isLastQuestion = sessionState.currentQuestionIndex >= sessionState.questions.length - 1;
    
    const stopPractice = () => {
      if (recognitionRef.current) recognitionRef.current.stop();
      setPageState('feedback');
    };
    
    const finishPractice = () => {
      if (recognitionRef.current) recognitionRef.current.stop();
      setPracticeTranscript('');
      setInterimTranscript('');
      goToNextQuestion();
    };
    
    return (
      <>
        <SEOHead title="Practice Mode | Voice Session" description="Practice reading the ideal answer" />
        <div className="min-h-screen bg-[#0d1117] text-[#e6edf3]">
          <header className="sticky top-0 z-50 border-b border-[#30363d] bg-[#0d1117]/95 backdrop-blur-md">
            <div className="max-w-4xl mx-auto px-4 h-16 flex items-center justify-between">
              <div className="flex items-center gap-4">
                <button onClick={stopPractice} className="p-2 hover:bg-[#21262d] rounded-lg transition-colors">
                  <ArrowRight className="w-5 h-5 rotate-180 text-[#8b949e]" />
                </button>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-[#58a6ff]/20 flex items-center justify-center">
                    <BookOpen className="w-5 h-5 text-[#58a6ff]" />
                  </div>
                  <div>
                    <h1 className="font-semibold text-white text-sm">Practice Mode</h1>
                    <p className="text-xs text-[#8b949e]">Read the ideal answer aloud</p>
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-3 px-4 py-2 bg-[#f85149]/10 border border-[#f85149]/30 rounded-full">
                <span className="w-3 h-3 bg-[#f85149] rounded-full animate-pulse" />
                <span className="font-mono text-sm text-[#f85149]">{formatTime(recordingTime)}</span>
              </div>
            </div>
          </header>

          <main className="max-w-4xl mx-auto px-4 py-6">
            {/* Ideal Answer */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="rounded-2xl bg-[#58a6ff]/10 border border-[#58a6ff]/30 p-6 mb-6"
            >
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-sm font-medium text-[#58a6ff] flex items-center gap-2">
                  <BookOpen className="w-4 h-4" />
                  Read This Aloud
                </h2>
                <ListenButton text={answeredQuestion.idealAnswer} label="Listen" size="sm" />
              </div>
              <p className="text-lg text-white leading-relaxed">{answeredQuestion.idealAnswer}</p>
              
              <div className="mt-4 pt-4 border-t border-[#58a6ff]/20">
                <p className="text-xs text-[#8b949e] mb-2">Key points to emphasize:</p>
                <div className="flex flex-wrap gap-1.5">
                  {answeredQuestion.criticalPoints.map((point, i) => (
                    <span key={i} className={`px-2.5 py-1 text-xs rounded-lg font-medium flex items-center gap-1 ${
                      point.weight === 3 ? 'bg-[#58a6ff]/30 text-[#79c0ff]' :
                      point.weight === 2 ? 'bg-[#58a6ff]/20 text-[#58a6ff]' :
                      'bg-[#58a6ff]/10 text-[#58a6ff]/80'
                    }`}>
                      {point.phrase}
                      {point.weight > 1 && <span className="opacity-60">×{point.weight}</span>}
                    </span>
                  ))}
                </div>
              </div>
            </motion.div>

            {/* Your Recording */}
            <div className="rounded-2xl border border-[#30363d] bg-[#161b22] p-6 mb-6">
              <h3 className="text-sm font-medium text-white mb-4 flex items-center gap-2">
                <Mic className="w-4 h-4 text-[#f85149]" />
                Your Recording
              </h3>
              <div className="p-4 bg-[#0d1117] rounded-xl min-h-[100px] border border-[#30363d]">
                <p className="text-sm text-[#e6edf3] whitespace-pre-wrap">
                  {practiceTranscript}
                  <span className="text-[#6e7681]">{interimTranscript}</span>
                  <span className="animate-pulse text-[#58a6ff]">|</span>
                </p>
                {!practiceTranscript && !interimTranscript && (
                  <p className="text-[#6e7681] text-sm">Start reading the answer above...</p>
                )}
              </div>
            </div>

            {/* Controls */}
            <div className="flex gap-3">
              <button
                onClick={stopPractice}
                className="flex-1 px-4 py-3 border border-[#30363d] text-[#8b949e] hover:text-white hover:border-[#8b949e] rounded-xl transition-colors flex items-center justify-center gap-2"
              >
                <Square className="w-4 h-4" />
                Back to Feedback
              </button>
              <button
                onClick={finishPractice}
                className="flex-1 px-4 py-3 bg-[#238636] text-white font-semibold rounded-xl hover:bg-[#2ea043] transition-colors flex items-center justify-center gap-2"
              >
                {isLastQuestion ? (
                  <>
                    <BarChart3 className="w-4 h-4" />
                    Finish Session
                  </>
                ) : (
                  <>
                    <CheckCircle className="w-4 h-4" />
                    Done, Next Question
                  </>
                )}
              </button>
            </div>
          </main>
        </div>
      </>
    );
  }

  // Final results
  if (pageState === 'results' && sessionResult) {
    const getVerdictStyle = (verdict: string) => {
      switch (verdict) {
        case 'excellent': return { bg: 'bg-[#238636]/20', text: 'text-[#3fb950]', icon: '🌟' };
        case 'good': return { bg: 'bg-[#58a6ff]/20', text: 'text-[#58a6ff]', icon: '👍' };
        case 'needs-work': return { bg: 'bg-[#d29922]/20', text: 'text-[#d29922]', icon: '📚' };
        default: return { bg: 'bg-[#f85149]/20', text: 'text-[#f85149]', icon: '🔄' };
      }
    };
    
    const verdictStyle = getVerdictStyle(sessionResult.verdict);
    
    return (
      <>
        <SEOHead title="Results | Voice Session" description="Your session results and score" />
        <div className="min-h-screen bg-[#0d1117] text-[#e6edf3]">
          <header className="sticky top-0 z-50 border-b border-[#30363d] bg-[#0d1117]/95 backdrop-blur-md">
            <div className="max-w-4xl mx-auto px-4 h-16 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#f1c40f] to-[#d29922] flex items-center justify-center">
                  <Trophy className="w-5 h-5 text-white" />
                </div>
                <h1 className="font-semibold text-white">Session Complete</h1>
              </div>
              <CreditsDisplay compact onClick={() => setLocation('/profile')} />
            </div>
          </header>

          <main className="max-w-4xl mx-auto px-4 py-6">
            {/* Overall Score */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="rounded-2xl border border-[#30363d] bg-[#161b22] p-8 mb-6 text-center"
            >
              <div className={`w-28 h-28 rounded-2xl ${verdictStyle.bg} flex items-center justify-center mx-auto mb-6`}>
                <span className={`text-5xl font-bold ${verdictStyle.text}`}>{sessionResult.overallScore}%</span>
              </div>
              
              <h2 className="text-2xl font-bold text-white mb-2">{sessionResult.topic}</h2>
              <p className={`text-lg font-medium ${verdictStyle.text} mb-4`}>
                {verdictStyle.icon} {sessionResult.verdict === 'excellent' ? 'Excellent!' :
                 sessionResult.verdict === 'good' ? 'Good Job!' :
                 sessionResult.verdict === 'needs-work' ? 'Keep Practicing' : 'Review Topic'}
              </p>
              <p className="text-sm text-[#8b949e] max-w-md mx-auto">{sessionResult.summary}</p>
            </motion.div>

            {/* Question Breakdown */}
            <div className="rounded-2xl border border-[#30363d] bg-[#161b22] p-6 mb-6">
              <h3 className="font-semibold text-white mb-4 flex items-center gap-2">
                <BarChart3 className="w-5 h-5 text-[#58a6ff]" />
                Question Breakdown
              </h3>
              <div className="space-y-3">
                {sessionResult.answers.map((answer, index) => (
                  <div key={answer.questionId} className="flex items-center justify-between p-4 bg-[#0d1117] rounded-xl border border-[#30363d]">
                    <div className="flex items-center gap-3">
                      <span className={`w-10 h-10 rounded-xl flex items-center justify-center text-sm font-bold ${
                        answer.isCorrect ? 'bg-[#238636]/20 text-[#3fb950]' : 'bg-[#f85149]/20 text-[#f85149]'
                      }`}>
                        {index + 1}
                      </span>
                      <span className="text-sm text-[#8b949e]">Question {index + 1}</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className={`text-lg font-bold ${answer.score >= 60 ? 'text-[#3fb950]' : 'text-[#f85149]'}`}>
                        {answer.score}%
                      </span>
                      {answer.isCorrect 
                        ? <CheckCircle className="w-5 h-5 text-[#3fb950]" /> 
                        : <XCircle className="w-5 h-5 text-[#f85149]" />
                      }
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Strengths & Improvements */}
            <div className="grid md:grid-cols-2 gap-4 mb-6">
              {sessionResult.strengths.length > 0 && (
                <div className="rounded-2xl border border-[#30363d] bg-[#161b22] p-5">
                  <h4 className="font-semibold text-[#3fb950] mb-4 flex items-center gap-2">
                    <Sparkles className="w-5 h-5" /> Strengths
                  </h4>
                  <ul className="space-y-2">
                    {sessionResult.strengths.map((s, i) => (
                      <li key={i} className="text-sm text-[#8b949e] flex items-start gap-2">
                        <CheckCircle className="w-4 h-4 text-[#3fb950] flex-shrink-0 mt-0.5" />
                        {s}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
              {sessionResult.areasToImprove.length > 0 && (
                <div className="rounded-2xl border border-[#30363d] bg-[#161b22] p-5">
                  <h4 className="font-semibold text-[#d29922] mb-4 flex items-center gap-2">
                    <Target className="w-5 h-5" /> To Improve
                  </h4>
                  <ul className="space-y-2">
                    {sessionResult.areasToImprove.map((a, i) => (
                      <li key={i} className="text-sm text-[#8b949e] flex items-start gap-2">
                        <ArrowRight className="w-4 h-4 text-[#d29922] flex-shrink-0 mt-0.5" />
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
                className="flex-1 px-4 py-3 border border-[#30363d] text-[#8b949e] hover:text-white hover:border-[#8b949e] rounded-xl transition-colors flex items-center justify-center gap-2"
              >
                <Home className="w-4 h-4" />
                Home
              </button>
              <button 
                onClick={exitSession} 
                className="flex-1 px-4 py-3 bg-[#238636] text-white font-semibold rounded-xl hover:bg-[#2ea043] transition-colors flex items-center justify-center gap-2"
              >
                <Target className="w-4 h-4" />
                New Session
              </button>
            </div>
          </main>
        </div>
      </>
    );
  }

  return null;
}
