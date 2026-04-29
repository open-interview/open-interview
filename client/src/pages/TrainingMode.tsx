/**
 * Training Mode - Read and Record Answers
 * 
 * Features:
 * - Answer is visible for reading (training mode)
 * - Answer hidden until after recording (interview mode)
 * - Voice recording with unified hook
 * - Practice speaking technical answers fluently
 * - Word-by-word playback highlighting
 * - Feedback after recording completion
 */

import { useState, useEffect, useRef } from 'react';
import { useLocation, useRoute } from 'wouter';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ArrowLeft, ChevronRight, Eye, Target,
  CheckCircle, BookOpen, Sparkles, Trophy,
  Clock, Award, TrendingUp, Volume2,
  Play, Timer, Zap, Gauge
} from 'lucide-react';
import { SEOHead } from '../components/SEOHead';
import { useUserPreferences } from '../context/UserPreferencesContext';
import { ChannelService } from '../services/api.service';
import { useVoiceRecording } from '../hooks/use-voice-recording';
import { RecordingPanel } from '../components/unified/RecordingPanel';
import { QuestionHistoryIcon } from '../components/unified/QuestionHistory';
import { AppLayout } from '../components/layout/AppLayout';
import { DesktopSidebarWrapper } from '../components/layout/DesktopSidebarWrapper';
import { MobileBottomNav } from '../components/layout/UnifiedNav';
import { MobileHeader } from '../components/layout/MobileHeader';
import { GoogleCard } from '../components/google/GoogleCard';
import { GoogleChip } from '../components/google/GoogleChip';
import type { Question } from '../types';

type SessionDuration = '5min' | '10min' | '20min' | 'unlimited';
type SessionDifficulty = 'beginner' | 'intermediate' | 'advanced' | 'mixed';

interface SessionConfig {
  duration: SessionDuration;
  difficulty: SessionDifficulty;
  questionsCount: number;
}

interface KeyPhrase {
  phrase: string;
  matched: boolean;
  userSaid?: string;
}

interface RecordingFeedback {
  score: number;
  wordsSpoken: number;
  targetWords: number;
  duration: number;
  message: string;
  keyPhrases: KeyPhrase[];
  matchedCount: number;
  totalPhrases: number;
}

// Extract key phrases from the ideal answer (technical terms, important concepts)
function extractKeyPhrases(answer: string): string[] {
  // Split into words and find important terms
  const words = answer.toLowerCase().split(/\s+/);
  const phrases: string[] = [];
  
  // Technical terms patterns
  const technicalPatterns = [
    /ci\/cd/i, /api/i, /rest/i, /graphql/i, /docker/i, /kubernetes/i, /k8s/i,
    /microservices?/i, /database/i, /sql/i, /nosql/i, /cache/i, /redis/i,
    /aws/i, /azure/i, /gcp/i, /cloud/i, /serverless/i, /lambda/i,
    /git/i, /github/i, /workflow/i, /pipeline/i, /deploy/i, /build/i, /test/i,
    /automat\w*/i, /integrat\w*/i, /continuous/i, /delivery/i,
    /repository/i, /branch/i, /merge/i, /pull request/i, /commit/i,
    /container/i, /image/i, /yaml/i, /config\w*/i,
    /event[- ]driven/i, /async\w*/i, /sync\w*/i, /messag\w*/i,
    /scalab\w*/i, /performance/i, /latency/i, /throughput/i,
    /security/i, /auth\w*/i, /encrypt\w*/i, /token/i,
    /monitor\w*/i, /log\w*/i, /metric/i, /alert/i,
  ];
  
  // Extract matching technical terms
  for (const pattern of technicalPatterns) {
    const match = answer.match(pattern);
    if (match) {
      phrases.push(match[0].toLowerCase());
    }
  }
  
  // Also extract 2-3 word phrases that seem important
  const importantPhrases = answer.match(/\b[A-Z][a-z]+(?:\s+[A-Z]?[a-z]+){1,2}\b/g) || [];
  for (const phrase of importantPhrases.slice(0, 5)) {
    if (phrase.length > 5 && !phrases.includes(phrase.toLowerCase())) {
      phrases.push(phrase.toLowerCase());
    }
  }
  
  // Deduplicate and limit
  return Array.from(new Set(phrases)).slice(0, 10);
}

// Check if user's transcript contains a phrase (fuzzy matching)
function phraseMatches(transcript: string, phrase: string): { matched: boolean; userSaid?: string } {
  const transcriptLower = transcript.toLowerCase();
  const phraseLower = phrase.toLowerCase();
  
  // Exact match
  if (transcriptLower.includes(phraseLower)) {
    return { matched: true, userSaid: phrase };
  }
  
  // Check for similar words (simple fuzzy match)
  const phraseWords = phraseLower.split(/\s+/);
  const transcriptWords = transcriptLower.split(/\s+/);
  
  for (const phraseWord of phraseWords) {
    if (phraseWord.length < 4) continue;
    
    for (const transcriptWord of transcriptWords) {
      // Check if words are similar (start with same letters or contain each other)
      if (transcriptWord.length >= 4) {
        if (transcriptWord.startsWith(phraseWord.slice(0, 4)) || 
            phraseWord.startsWith(transcriptWord.slice(0, 4)) ||
            transcriptWord.includes(phraseWord) ||
            phraseWord.includes(transcriptWord)) {
          return { matched: true, userSaid: transcriptWord };
        }
      }
    }
  }
  
  return { matched: false };
}

function calculateFeedback(
  transcript: string,
  targetAnswer: string,
  duration: number
): RecordingFeedback {
  const wordsSpoken = countWords(transcript);
  const targetWords = countWords(targetAnswer);
  
  // Extract and match key phrases
  const keyPhraseStrings = extractKeyPhrases(targetAnswer);
  const keyPhrases: KeyPhrase[] = keyPhraseStrings.map(phrase => {
    const match = phraseMatches(transcript, phrase);
    return {
      phrase,
      matched: match.matched,
      userSaid: match.userSaid
    };
  });
  
  const matchedCount = keyPhrases.filter(p => p.matched).length;
  const totalPhrases = keyPhrases.length;
  
  // Calculate score based on key phrase coverage + word coverage
  const phraseScore = totalPhrases > 0 ? (matchedCount / totalPhrases) * 70 : 0;
  const wordScore = Math.min(30, (wordsSpoken / targetWords) * 30);
  const score = Math.round(phraseScore + wordScore);
  
  // Generate specific message based on performance
  let message: string;
  if (matchedCount === totalPhrases && totalPhrases > 0) {
    message = "Perfect! You covered all key concepts! 🌟";
  } else if (matchedCount >= totalPhrases * 0.7) {
    message = `Great job! You covered ${matchedCount}/${totalPhrases} key terms! 💪`;
  } else if (matchedCount >= totalPhrases * 0.4) {
    message = `Good progress! ${matchedCount}/${totalPhrases} key terms matched. Keep practicing! 📈`;
  } else if (matchedCount > 0) {
    message = `You got ${matchedCount} key term${matchedCount > 1 ? 's' : ''}. Try to include more technical details. 🎯`;
  } else if (wordsSpoken > 0) {
    message = "Try to use the specific technical terms from the answer. 📚";
  } else {
    message = "Start speaking to practice the answer! 🎤";
  }
  
  return {
    score,
    wordsSpoken,
    targetWords,
    duration,
    message,
    keyPhrases,
    matchedCount,
    totalPhrases,
  };
}

export default function TrainingMode() {
  const [, setLocation] = useLocation();
  const [isInterviewMode] = useRoute('/voice-interview');
  const { getSubscribedChannels } = useUserPreferences();
  const subscribedChannels = getSubscribedChannels();

  const [questions, setQuestions] = useState<Question[]>([]);
  const [allQuestions, setAllQuestions] = useState<Question[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [loading, setLoading] = useState(true);
  const [completedQuestions, setCompletedQuestions] = useState<Set<string>>(new Set());
  const [hasLoadedQuestions, setHasLoadedQuestions] = useState(false);
  const [showFeedback, setShowFeedback] = useState(false);
  const [currentFeedback, setCurrentFeedback] = useState<RecordingFeedback | null>(null);
  const [showAnswer, setShowAnswer] = useState(false); // For interview mode - show after recording
  const sessionId = isInterviewMode ? 'voice-interview-session-state' : 'training-session-state';
  
  // Session setup state
  const [sessionStarted, setSessionStarted] = useState(false);
  const [sessionConfig, setSessionConfig] = useState<SessionConfig>({
    duration: '10min',
    difficulty: 'mixed',
    questionsCount: 10,
  });
  
  // Use refs to avoid stale closures in callbacks
  const recordingStartTimeRef = useRef<number>(0);
  const currentQuestionRef = useRef<Question | null>(null);
  const resetRecordingRef = useRef<(() => void) | null>(null);

  const currentQuestion = questions[currentIndex];
  const totalWords = currentQuestion?.answer ? countWords(currentQuestion.answer) : 0;
  
  // Keep ref in sync with current question
  useEffect(() => {
    currentQuestionRef.current = currentQuestion;
  }, [currentQuestion]);

  // Use unified voice recording hook
  const recording = useVoiceRecording({
    onRecordingStart: () => {
      console.log('TrainingMode: Recording started');
      recordingStartTimeRef.current = Date.now();
      setShowFeedback(false);
      setCurrentFeedback(null);
    },
    onRecordingComplete: (_audioBlob, transcript) => {
      console.log('TrainingMode: Recording completed', { transcript });
      // Calculate duration
      const duration = Math.round((Date.now() - recordingStartTimeRef.current) / 1000);
      const question = currentQuestionRef.current;
      
      // Use the transcript from the recording state if callback transcript is empty
      const finalTranscript = transcript || recording.state.transcript || recording.state.finalTranscript;
      console.log('TrainingMode: Final transcript', { finalTranscript });
      
      // Calculate feedback
      if (question) {
        const feedback = calculateFeedback(finalTranscript, question.answer, duration);
        setCurrentFeedback(feedback);
        setShowFeedback(true);
        
        // In interview mode, reveal the answer after recording
        if (isInterviewMode) {
          console.log('TrainingMode: Revealing answer in interview mode');
          setShowAnswer(true);
        }
        
        // Mark question as completed
        setCompletedQuestions(prev => new Set(prev).add(question.id));
      }
    }
  });

  console.log('TrainingMode: Recording object', { 
    recording: !!recording, 
    state: recording?.state,
    isInterviewMode 
  });

  // Store resetRecording in ref to avoid stale closures
  useEffect(() => {
    if (recording) {
      resetRecordingRef.current = recording.resetRecording;
    }
  }, [recording]);

  // Load questions from subscribed channels - only once
  useEffect(() => {
    if (hasLoadedQuestions) return;

    const loadQuestions = async () => {
      setLoading(true);
      
      // Check for saved session first
      const savedData = localStorage.getItem(sessionId);
      if (savedData) {
        try {
          const sessionData = JSON.parse(savedData);
          if (sessionData.questions && sessionData.questions.length > 0) {
            setQuestions(sessionData.questions);
            setCurrentIndex(sessionData.currentIndex || 0);
            if (sessionData.completedQuestions) {
              setCompletedQuestions(new Set(sessionData.completedQuestions));
            }
            setLoading(false);
            setHasLoadedQuestions(true);
            return;
          }
        } catch (e) {
          console.error('Invalid session data:', e);
          localStorage.removeItem(sessionId);
        }
      }
      
      if (subscribedChannels.length === 0) {
        setLoading(false);
        setHasLoadedQuestions(true);
        return;
      }

      try {
        const allQuestions: Question[] = [];
        
        for (const channel of subscribedChannels) {
          try {
            const data = await ChannelService.getData(channel.id);
            // In interview mode, filter for voice-suitable questions
            const channelQuestions = isInterviewMode 
              ? data.questions.filter((q: Question) => 
                  q.voiceSuitable !== false && 
                  q.answer && 
                  q.answer.length > 100
                )
              : data.questions;
            allQuestions.push(...channelQuestions);
          } catch (e) {
            console.error(`Failed to load ${channel.id}`, e);
          }
        }
        
        if (allQuestions.length > 0) {
          setQuestions(allQuestions);
        }
      } catch (e) {
        console.error('Failed to load questions', e);
      }
      
      setLoading(false);
      setHasLoadedQuestions(true);
    };

    loadQuestions();
  }, [subscribedChannels, hasLoadedQuestions, sessionId, isInterviewMode]);

  // Reset recording when question changes
  useEffect(() => {
    if (!currentQuestion?.answer) return;
    if (resetRecordingRef.current) {
      resetRecordingRef.current();
    }
    setShowFeedback(false);
    setCurrentFeedback(null);
    setShowAnswer(false); // Hide answer for new question in interview mode
  }, [currentQuestion?.id]); // Use question ID to avoid infinite loop

  const goToNext = () => {
    if (currentIndex < questions.length - 1) {
      setCurrentIndex(prev => prev + 1);
      saveSessionProgress();
    } else {
      // Clear session when completed
      localStorage.removeItem(sessionId);
      setLocation('/');
    }
  };

  const goToPrevious = () => {
    if (currentIndex > 0) {
      setCurrentIndex(prev => prev - 1);
      saveSessionProgress();
    }
  };

  const saveSessionProgress = () => {
    if (questions.length === 0) return;
    
    const sessionData = {
      questions,
      currentIndex,
      completedQuestions: Array.from(completedQuestions),
      lastAccessedAt: new Date().toISOString(),
    };
    
    localStorage.setItem(sessionId, JSON.stringify(sessionData));
  };

  const exitTraining = () => {
    saveSessionProgress();
    setLocation('/');
  };

  const tryAgain = () => {
    recording.resetRecording();
    setShowFeedback(false);
    setCurrentFeedback(null);
    setShowAnswer(false); // Hide answer again in interview mode
  };

  if (loading) {
    return (
      <AppLayout>
        <div className="min-h-screen bg-background text-foreground">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8 sm:py-12">
            <div className="text-center mb-10">
              <h1 className="text-5xl md:text-6xl font-black mb-3">
                <span className="bg-gradient-to-r from-primary to-primary bg-clip-text text-transparent">Training Mode</span>
              </h1>
            </div>
            <div className="flex items-center justify-center py-20">
              <div className="text-center">
                <div className="w-16 h-16 rounded-2xl bg-primary/20 flex items-center justify-center mx-auto mb-4">
                  <div className="w-8 h-8 border-3 border-primary border-t-transparent rounded-full animate-spin" />
                </div>
                <p className="text-base text-foreground/70">Loading training questions...</p>
              </div>
            </div>
          </div>
        </div>
      </AppLayout>
    );
  }

  // Session Setup Screen
  if (!sessionStarted) {
    return (
      <AppLayout>
        <DesktopSidebarWrapper>
          <div className="lg:hidden"><MobileHeader title={isInterviewMode ? "Interview Setup" : "Training Setup"} showBack={true} onBack={() => setLocation('/')} /></div>
          <div className="min-h-screen bg-background pb-20 pt-14 lg:pt-0">
            <div className="max-w-2xl mx-auto px-4 py-8">
              {/* Header */}
              <motion.div 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="text-center mb-8"
              >
<div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-primary dark:bg-primary mb-4">
                   <Zap className="w-8 h-8 text-primary-foreground" />
                 </div>
                 <h1 className="text-3xl md:text-4xl font-normal text-foreground mb-2">
                   {isInterviewMode ? "Interview Practice" : "Training Mode"}
                 </h1>
                 <p className="text-base text-foreground/70">
                  {isInterviewMode 
                    ? "Practice answering interview questions in your own words"
                    : "Read and practice technical answers out loud"}
                </p>
              </motion.div>

              {/* Session Config Cards */}
              <motion.div 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
                className="space-y-4"
              >
                {/* Duration Card */}
                <GoogleCard variant="elevated" className="p-0 overflow-hidden">
                  <div className="p-5">
<div className="flex items-center gap-3 mb-4">
                     <Timer className="w-5 h-5 text-primary" />
                       <span className="text-base font-medium text-foreground">Session Duration</span>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {(['5min', '10min', '20min', 'unlimited'] as SessionDuration[]).map((dur) => (
                        <GoogleChip
                          key={dur}
                          selected={sessionConfig.duration === dur}
                          onClick={() => setSessionConfig(prev => ({ ...prev, duration: dur }))}
                          variant="filter"
                        >
                          {dur === 'unlimited' ? 'Unlimited' : dur.replace('min', ' min')}
                        </GoogleChip>
                      ))}
                    </div>
                  </div>
                </GoogleCard>

                {/* Difficulty Card */}
                <GoogleCard variant="elevated" className="p-0 overflow-hidden">
                  <div className="p-5">
<div className="flex items-center gap-3 mb-4">
                     <Gauge className="w-5 h-5 text-primary" />
                       <span className="text-base font-medium text-foreground">Difficulty Level</span>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {(['beginner', 'intermediate', 'advanced', 'mixed'] as SessionDifficulty[]).map((diff) => (
                        <GoogleChip
                          key={diff}
                          selected={sessionConfig.difficulty === diff}
                          onClick={() => setSessionConfig(prev => ({ ...prev, difficulty: diff }))}
                          variant="filter"
                        >
                          {diff.charAt(0).toUpperCase() + diff.slice(1)}
                        </GoogleChip>
                      ))}
                    </div>
                  </div>
                </GoogleCard>

                {/* Questions Count Card */}
                <GoogleCard variant="elevated" className="p-0 overflow-hidden">
                  <div className="p-5">
<div className="flex items-center gap-3 mb-4">
                     <Target className="w-5 h-5 text-primary" />
                       <span className="text-base font-medium text-foreground">Number of Questions</span>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {[5, 10, 15, 20].map((count) => (
                        <GoogleChip
                          key={count}
                          selected={sessionConfig.questionsCount === count}
                          onClick={() => setSessionConfig(prev => ({ ...prev, questionsCount: count }))}
                          variant="filter"
                        >
                          {count} questions
                        </GoogleChip>
                      ))}
                    </div>
                  </div>
                </GoogleCard>
              </motion.div>

              {/* Start Button */}
              <motion.div 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                className="mt-6"
              >
<button
                   onClick={() => {
                     setAllQuestions(questions);
                     setQuestions(filterQuestionsByConfig(questions, sessionConfig));
                     setSessionStarted(true);
                   }}
                   className="w-full flex items-center justify-center gap-2 h-12 rounded-[24px] bg-primary hover:bg-primary/90 text-primary-foreground text-base font-medium shadow-xl hover:shadow-xl transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                 >
                   <Play className="w-5 h-5" />
                   Start Training
                 </button>
              </motion.div>
            </div>
          </div>
          <MobileBottomNav />
        </DesktopSidebarWrapper>
        <SEOHead 
          title={isInterviewMode ? "Interview Setup" : "Training Setup"}
          description={isInterviewMode 
            ? "Set up your interview practice session"
            : "Configure your training session"
          }
        />
      </AppLayout>
    );
  }

// Session main view
  if (questions.length === 0) {
    return (
      <AppLayout>
        <div className="min-h-screen bg-background text-foreground">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8 sm:py-12">
            <div className="text-center mb-10">
              <h1 className="text-5xl md:text-6xl font-black mb-3">
                <span className="bg-gradient-to-r from-primary to-primary bg-clip-text text-transparent">Training Mode</span>
              </h1>
            </div>
            <div className="flex items-center justify-center py-20">
              <div className="text-center max-w-md">
<div className="w-20 h-20 rounded-2xl bg-muted flex items-center justify-center mx-auto mb-6">
                   <BookOpen className="w-10 h-10 text-foreground/70" />
                 </div>
                 <h2 className="text-xl font-bold text-foreground mb-2">No Questions Available</h2>
                 <p className="text-base text-foreground/70 mb-6">
                   Subscribe to channels to access training questions
                 </p>
                 <button
                   onClick={() => setLocation('/channels')}
                    className="px-4 py-2.5 bg-primary text-primary-foreground rounded-lg font-medium hover:opacity-90 transition-opacity focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 h-10 text-sm shadow-none"
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

  return (
    <>
      <SEOHead 
        title={isInterviewMode ? "Voice Interview Practice" : "Training Mode - Practice Speaking Answers"}
        description={isInterviewMode 
          ? "Practice answering interview questions out loud with AI-powered feedback"
          : "Read and record technical interview answers to improve your speaking skills"
        }
      />

      <DesktopSidebarWrapper>
      <div className="lg:hidden"><MobileHeader title="Training" showBack={true} /></div>
      <div className="min-h-screen bg-background text-foreground pb-20 pt-14 lg:pt-0">
        {/* Header */}
        <div className="sticky top-0 z-10 bg-background/95 backdrop-blur-md border-b border-border">
          <div className="max-w-4xl mx-auto px-4 py-2 flex items-center justify-between">
<button
               onClick={exitTraining}
               className="p-2 hover:bg-muted rounded-lg transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
               title="Exit and save progress"
             >
               <ArrowLeft className="w-5 h-5 text-foreground/70" />
             </button>

            <div className="flex items-center gap-3">
{isInterviewMode && (
                 <div className="flex items-center gap-2 px-3 py-1.5 bg-destructive/10 border border-destructive/30 rounded-lg">
                   <Sparkles className="w-4 h-4 text-destructive" />
                   <span className="text-sm font-semibold text-destructive">Interview Mode</span>
                 </div>
               )}

               <div className="flex items-center gap-2 px-3 py-1.5 bg-primary/10 border border-primary/30 rounded-lg">
                 <Target className="w-4 h-4 text-primary" />
                 <span className="text-sm font-semibold text-primary">
                   {currentIndex + 1} / {questions.length}
                 </span>
               </div>

               <div className="flex items-center gap-2 px-3 py-1.5 bg-green-500/10 border border-green-500/30 rounded-lg">
                 <CheckCircle className="w-4 h-4 text-green-500" />
                 <span className="text-sm font-semibold text-green-500">
                   {completedQuestions.size}
                 </span>
               </div>
            </div>
          </div>

          {/* Progress bar */}
          <div className="h-1.5 bg-muted">
            <motion.div 
              className="h-full bg-gradient-to-r from-primary to-primary"
              initial={{ width: 0 }}
              animate={{ width: `${((currentIndex + 1) / questions.length) * 100}%` }}
              transition={{ duration: 0.3 }}
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
              <div className="rounded-2xl border border-border bg-card p-6">
                <div className="flex items-start gap-4 mb-4">
                  <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-primary to-primary flex items-center justify-center flex-shrink-0">
                    <Sparkles className="w-6 h-6 text-white" />
                  </div>
                  <div className="flex-1">
                    <h2 className="text-lg font-semibold text-foreground mb-2">{currentQuestion.question}</h2>
<div className="flex items-center gap-2 text-sm">
                       <span className={`px-3 py-1.5 rounded-lg text-xs font-medium ${
                         currentQuestion.difficulty === 'beginner' ? 'bg-green-500/20 text-green-500' :
                         currentQuestion.difficulty === 'intermediate' ? 'bg-yellow-500/20 text-yellow-500' :
                         'bg-destructive/20 text-destructive'
                       }`}>
                         {currentQuestion.difficulty}
                       </span>
                       <span className="text-foreground/50">•</span>
                       <span className="text-base text-foreground/70">{currentQuestion.channel}</span>
                       <span className="text-foreground/50">•</span>
                       <QuestionHistoryIcon
                         questionId={currentQuestion.id}
                         questionType="question"
                         size="sm"
                       />
                     </div>
                  </div>
                </div>

                {/* Answer Display - Conditional based on mode */}
{!isInterviewMode || showAnswer ? (
                   <div className="bg-muted/50 rounded-2xl p-5 border border-border">
                     <div className="flex items-center justify-between mb-4">
                       <div className="flex items-center gap-2">
                         <Eye className="w-4 h-4 text-green-500" />
                         <span className="text-sm font-semibold text-foreground">
                           {isInterviewMode ? "Ideal Answer" : "Answer to Read"}
                         </span>
                       </div>
                       <span className="text-xs text-foreground/70 px-2 py-1 bg-muted rounded-lg">
                         {totalWords} words
                       </span>
                     </div>

                     <div className="max-w-none overflow-auto max-h-96">
                       <p className="text-base text-foreground leading-relaxed whitespace-pre-wrap break-words">
                         {currentQuestion.answer}
                       </p>
                     </div>
                   </div>
                 ) : (
                   <div className="bg-muted/50 rounded-2xl p-5 border border-border">
                     <div className="flex items-center justify-center py-8">
                       <div className="text-center">
                         <div className="w-16 h-16 rounded-2xl bg-destructive/10 flex items-center justify-center mx-auto mb-4">
                           <Eye className="w-8 h-8 text-destructive" />
                         </div>
                         <h3 className="text-lg font-semibold text-foreground mb-2">Answer Hidden</h3>
                         <p className="text-base text-foreground/70 max-w-md">
                           Record your answer first. The ideal answer will be revealed after you finish recording.
                         </p>
                       </div>
                     </div>
                   </div>
                 )}
              </div>

              {/* Recording Controls - Using Unified Component */}
              {recording && (
                <RecordingPanel
                  recording={recording}
                  targetWords={totalWords}
                  showTranscript={true}
                  showWordCount={true}
                  showTimer={true}
                  tip={isInterviewMode 
                    ? "Answer the question in your own words. The ideal answer will be revealed after you finish."
                    : "Read the full answer naturally. Click 'Stop Recording' when you're done."
                  }
                  className=""
                />
              )}

              {/* Feedback Panel - Shows after recording */}
              <AnimatePresence>
                {showFeedback && currentFeedback && (
                  <motion.div
                    initial={{ opacity: 0, y: 20, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: -20, scale: 0.95 }}
                    className="rounded-2xl border border-border bg-card overflow-hidden"
                  >
                    {/* Score Header */}
                    <div className={`p-6 ${
                      currentFeedback.score >= 85 ? 'bg-gradient-to-r from-green-500/20 to-green-500/10' :
                      currentFeedback.score >= 60 ? 'bg-gradient-to-r from-primary/20 to-primary/10' :
                      'bg-gradient-to-r from-yellow-500/20 to-orange-500/10'
                    }`}>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                          <div className={`w-16 h-16 rounded-2xl flex items-center justify-center ${
                            currentFeedback.score >= 85 ? 'bg-green-500/30' :
                            currentFeedback.score >= 60 ? 'bg-primary/30' :
                            'bg-yellow-500/30'
                          }`}>
                            {currentFeedback.score >= 85 ? (
                              <Trophy className="w-8 h-8 text-green-500" />
                            ) : currentFeedback.score >= 60 ? (
                              <Award className="w-8 h-8 text-primary" />
                            ) : (
                              <TrendingUp className="w-8 h-8 text-yellow-500" />
                            )}
                          </div>
                          <div>
                            <h3 className="text-xl font-bold text-foreground mb-1">{currentFeedback.message}</h3>
                            <p className="text-sm text-foreground/70">Recording completed</p>
                          </div>
                        </div>
                        <div className="text-right">
                          <div className={`text-4xl font-bold ${
                            currentFeedback.score >= 85 ? 'text-green-500' :
                            currentFeedback.score >= 60 ? 'text-primary' :
                            'text-yellow-500'
                          }`}>
                            {currentFeedback.score}%
                          </div>
                          <div className="text-xs text-foreground/70">Coverage Score</div>
                        </div>
                      </div>
                    </div>

{/* Stats Grid */}
                     <div className="p-6 border-t border-border">
                       <div className="grid grid-cols-3 gap-4 mb-6">
                         <div className="text-center p-4 bg-muted/50 rounded-2xl border border-border">
                           <div className="flex items-center justify-center gap-1.5 mb-2 text-foreground/70">
                             <Volume2 className="w-4 h-4" />
                             <span className="text-xs">Words Spoken</span>
                           </div>
                           <div className="text-2xl font-bold text-foreground">
                             {currentFeedback.wordsSpoken}
                             <span className="text-sm text-foreground/70 font-normal"> / {currentFeedback.targetWords}</span>
                           </div>
                         </div>
                         <div className="text-center p-4 bg-muted/50 rounded-2xl border border-border">
                           <div className="flex items-center justify-center gap-1.5 mb-2 text-foreground/70">
                             <Clock className="w-4 h-4" />
                             <span className="text-xs">Duration</span>
                           </div>
                           <div className="text-2xl font-bold text-foreground">
                             {Math.floor(currentFeedback.duration / 60)}:{(currentFeedback.duration % 60).toString().padStart(2, '0')}
                           </div>
                         </div>
                         <div className="text-center p-4 bg-muted/50 rounded-2xl border border-border">
                           <div className="flex items-center justify-center gap-1.5 mb-2 text-foreground/70">
                             <Target className="w-4 h-4" />
                             <span className="text-xs">Key Terms</span>
                           </div>
                           <div className="text-2xl font-bold text-foreground">
                             {currentFeedback.matchedCount}
                             <span className="text-sm text-foreground/70 font-normal"> / {currentFeedback.totalPhrases}</span>
                           </div>
                         </div>
                       </div>

{/* Key Phrases Matching */}
                       {currentFeedback.keyPhrases.length > 0 && (
                         <div className="mb-6">
                           <h4 className="text-sm font-medium text-foreground mb-3 flex items-center gap-2">
                             <Sparkles className="w-4 h-4 text-primary" />
                             Key Terms from Answer
                           </h4>
                           <div className="flex flex-wrap gap-2">
                             {currentFeedback.keyPhrases.map((phrase, i) => (
                               <span
                                 key={i}
                                 className={`px-3 py-1.5 rounded-lg text-sm font-medium flex items-center gap-1.5 ${
                                   phrase.matched
                                     ? 'bg-green-500/20 border border-green-500/40 text-green-500'
                                     : 'bg-destructive/10 border border-destructive/30 text-destructive'
                                 }`}
                               >
                                 {phrase.matched ? (
                                   <CheckCircle className="w-3.5 h-3.5" />
                                 ) : (
                                   <span className="w-3.5 h-3.5 rounded-full border border-current" />
                                 )}
                                 {phrase.phrase}
                                 {phrase.matched && phrase.userSaid && phrase.userSaid !== phrase.phrase && (
                                   <span className="text-xs opacity-70">({phrase.userSaid})</span>
                                 )}
                               </span>
                             ))}
                           </div>
                           {currentFeedback.matchedCount < currentFeedback.totalPhrases && (
                             <p className="text-xs text-foreground/70 mt-3">
                               💡 Try to include the missing terms in your next attempt
                             </p>
                           )}
                         </div>
                       )}

                      {/* Try Again Button */}
<button
                         onClick={tryAgain}
                          className="w-full mt-4 px-4 py-2.5 border border-border text-foreground/70 hover:text-foreground hover:border-foreground/50 rounded-lg transition-colors flex items-center justify-center gap-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 h-10 text-sm shadow-none"
                       >
                        <ArrowLeft className="w-4 h-4" />
                        Try Again
                      </button>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Navigation */}
<div className="flex gap-3">
                 <button
                   onClick={goToPrevious}
                   disabled={currentIndex === 0}
                    className="px-4 py-2.5 bg-muted hover:bg-muted/80 disabled:opacity-50 disabled:cursor-not-allowed rounded-lg font-medium transition-colors text-foreground/70 hover:text-foreground border border-border focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 h-10 text-sm shadow-none"
                 >
                   Previous
                 </button>
                 <button
                   onClick={goToNext}
                    className="flex-1 px-4 py-2.5 bg-primary hover:opacity-90 text-primary-foreground rounded-lg font-medium flex items-center justify-center gap-2 transition-opacity focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 h-10 text-sm shadow-none"
                 >
                  {currentIndex === questions.length - 1 ? 'Finish' : 'Next Question'}
                  <ChevronRight className="w-5 h-5" />
                </button>
              </div>
            </motion.div>
          </AnimatePresence>
        </div>
      </div>
      <MobileBottomNav />
      </DesktopSidebarWrapper>
    </>
  );
}

// Helper functions
function countWords(text: string): number {
  return text.trim().split(/\s+/).filter(word => word.length > 0).length;
}

function filterQuestionsByConfig(
  allQuestions: Question[], 
  config: SessionConfig
): Question[] {
  let filtered = [...allQuestions];
  
  // Filter by difficulty if not mixed
  if (config.difficulty !== 'mixed') {
    filtered = filtered.filter(q => q.difficulty === config.difficulty);
  }
  
  // Shuffle and limit
  filtered = filtered.sort(() => Math.random() - 0.5);
  return filtered.slice(0, config.questionsCount);
}
