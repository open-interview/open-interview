/**
 * Training Mode - Read and Record Answers
 * 
 * Features:
 * - Answer is visible for reading
 * - Voice recording with unified hook
 * - Practice speaking technical answers fluently
 * - Word-by-word playback highlighting
 * - Feedback after recording completion
 */

import { useState, useEffect, useRef } from 'react';
import { useLocation } from 'wouter';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ArrowLeft, ChevronRight, Eye, Target,
  CheckCircle, BookOpen, Sparkles, Trophy,
  Clock, Award, TrendingUp, Volume2
} from 'lucide-react';
import { SEOHead } from '../components/SEOHead';
import { useUserPreferences } from '../context/UserPreferencesContext';
import { ChannelService } from '../services/api.service';
import { useVoiceRecording } from '../hooks/use-voice-recording';
import { RecordingPanel } from '../components/unified/RecordingPanel';
import { QuestionHistoryIcon } from '../components/unified/QuestionHistory';
import { DesktopSidebarWrapper } from '../components/layout/DesktopSidebarWrapper';
import type { Question } from '../types';

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
  const { getSubscribedChannels } = useUserPreferences();
  const subscribedChannels = getSubscribedChannels();

  const [questions, setQuestions] = useState<Question[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [loading, setLoading] = useState(true);
  const [completedQuestions, setCompletedQuestions] = useState<Set<string>>(new Set());
  const [hasLoadedQuestions, setHasLoadedQuestions] = useState(false);
  const [showFeedback, setShowFeedback] = useState(false);
  const [currentFeedback, setCurrentFeedback] = useState<RecordingFeedback | null>(null);
  
  // Use refs to avoid stale closures in callbacks
  const recordingStartTimeRef = useRef<number>(0);
  const currentQuestionRef = useRef<Question | null>(null);

  const currentQuestion = questions[currentIndex];
  const totalWords = currentQuestion?.answer ? countWords(currentQuestion.answer) : 0;
  
  // Keep ref in sync with current question
  useEffect(() => {
    currentQuestionRef.current = currentQuestion;
  }, [currentQuestion]);

  // Use unified voice recording hook
  const recording = useVoiceRecording({
    onRecordingStart: () => {
      recordingStartTimeRef.current = Date.now();
      setShowFeedback(false);
      setCurrentFeedback(null);
    },
    onRecordingComplete: (_audioBlob, transcript) => {
      // Calculate duration
      const duration = Math.round((Date.now() - recordingStartTimeRef.current) / 1000);
      const question = currentQuestionRef.current;
      
      // Use the transcript from the recording state if callback transcript is empty
      const finalTranscript = transcript || recording.state.transcript || recording.state.finalTranscript;
      
      // Calculate feedback
      if (question) {
        const feedback = calculateFeedback(finalTranscript, question.answer, duration);
        setCurrentFeedback(feedback);
        setShowFeedback(true);
        
        // Mark question as completed
        setCompletedQuestions(prev => new Set(prev).add(question.id));
      }
    }
  });

  // Load questions from subscribed channels - only once
  useEffect(() => {
    if (hasLoadedQuestions) return;

    const loadQuestions = async () => {
      setLoading(true);
      
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
            allQuestions.push(...data.questions);
          } catch (e) {
            console.error(`TrainingMode: Failed to load ${channel.id}`, e);
          }
        }
        
        if (allQuestions.length > 0) {
          const shuffled = allQuestions.sort(() => Math.random() - 0.5);
          const selected = shuffled.slice(0, 20);
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

  // Reset recording when question changes
  useEffect(() => {
    if (!currentQuestion?.answer) return;
    recording.resetRecording();
    setShowFeedback(false);
    setCurrentFeedback(null);
  }, [currentQuestion]);

  const goToNext = () => {
    if (currentIndex < questions.length - 1) {
      setCurrentIndex(prev => prev + 1);
    } else {
      setLocation('/');
    }
  };

  const goToPrevious = () => {
    if (currentIndex > 0) {
      setCurrentIndex(prev => prev - 1);
    }
  };

  const tryAgain = () => {
    recording.resetRecording();
    setShowFeedback(false);
    setCurrentFeedback(null);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0d1117] flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 rounded-2xl bg-[#58a6ff]/20 flex items-center justify-center mx-auto mb-4">
            <div className="w-8 h-8 border-3 border-[#58a6ff] border-t-transparent rounded-full animate-spin" />
          </div>
          <p className="text-[#8b949e]">Loading training questions...</p>
        </div>
      </div>
    );
  }

  if (questions.length === 0) {
    return (
      <div className="min-h-screen bg-[#0d1117] flex items-center justify-center p-4">
        <div className="text-center max-w-md">
          <div className="w-20 h-20 rounded-2xl bg-[#21262d] flex items-center justify-center mx-auto mb-6">
            <BookOpen className="w-10 h-10 text-[#6e7681]" />
          </div>
          <h2 className="text-xl font-bold text-white mb-2">No Questions Available</h2>
          <p className="text-[#8b949e] mb-6">
            Subscribe to channels to access training questions
          </p>
          <button
            onClick={() => setLocation('/channels')}
            className="px-6 py-3 bg-[#238636] text-white rounded-xl font-semibold hover:bg-[#2ea043] transition-colors"
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

      <DesktopSidebarWrapper>
      <div className="min-h-screen bg-[#0d1117] text-[#e6edf3] pb-20">
        {/* Header */}
        <div className="sticky top-0 z-10 bg-[#0d1117]/95 backdrop-blur-md border-b border-[#30363d]">
          <div className="max-w-4xl mx-auto px-4 py-3 flex items-center justify-between">
            <button
              onClick={() => setLocation('/')}
              className="p-2 hover:bg-[#21262d] rounded-lg transition-colors"
            >
              <ArrowLeft className="w-5 h-5 text-[#8b949e]" />
            </button>

            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2 px-3 py-1.5 bg-[#58a6ff]/10 border border-[#58a6ff]/30 rounded-lg">
                <Target className="w-4 h-4 text-[#58a6ff]" />
                <span className="text-sm font-semibold text-[#58a6ff]">
                  {currentIndex + 1} / {questions.length}
                </span>
              </div>

              <div className="flex items-center gap-2 px-3 py-1.5 bg-[#238636]/10 border border-[#238636]/30 rounded-lg">
                <CheckCircle className="w-4 h-4 text-[#3fb950]" />
                <span className="text-sm font-semibold text-[#3fb950]">
                  {completedQuestions.size}
                </span>
              </div>
            </div>
          </div>

          {/* Progress bar */}
          <div className="h-1.5 bg-[#21262d]">
            <motion.div 
              className="h-full bg-gradient-to-r from-[#58a6ff] to-[#a371f7]"
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
              <div className="rounded-2xl border border-[#30363d] bg-[#161b22] p-6">
                <div className="flex items-start gap-4 mb-4">
                  <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-[#58a6ff] to-[#a371f7] flex items-center justify-center flex-shrink-0">
                    <Sparkles className="w-6 h-6 text-white" />
                  </div>
                  <div className="flex-1">
                    <h2 className="text-lg font-semibold text-white mb-2">{currentQuestion.question}</h2>
                    <div className="flex items-center gap-2 text-sm">
                      <span className={`px-2.5 py-1 rounded-lg text-xs font-medium ${
                        currentQuestion.difficulty === 'beginner' ? 'bg-[#238636]/20 text-[#3fb950]' :
                        currentQuestion.difficulty === 'intermediate' ? 'bg-[#d29922]/20 text-[#d29922]' :
                        'bg-[#f85149]/20 text-[#f85149]'
                      }`}>
                        {currentQuestion.difficulty}
                      </span>
                      <span className="text-[#6e7681]">•</span>
                      <span className="text-[#8b949e]">{currentQuestion.channel}</span>
                      <span className="text-[#6e7681]">•</span>
                      <QuestionHistoryIcon 
                        questionId={currentQuestion.id} 
                        questionType="question"
                        size="sm"
                      />
                    </div>
                  </div>
                </div>

                {/* Answer with Full Display */}
                <div className="bg-[#0d1117] rounded-xl p-5 border border-[#30363d]">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-2">
                      <Eye className="w-4 h-4 text-[#3fb950]" />
                      <span className="text-sm font-semibold text-white">Answer to Read</span>
                    </div>
                    <span className="text-xs text-[#6e7681] px-2 py-1 bg-[#21262d] rounded-lg">
                      {totalWords} words
                    </span>
                  </div>

                  <div className="max-w-none overflow-auto max-h-96">
                    <p className="text-[#e6edf3] leading-relaxed whitespace-pre-wrap break-words">
                      {currentQuestion.answer}
                    </p>
                  </div>
                </div>
              </div>

              {/* Recording Controls - Using Unified Component */}
              <RecordingPanel
                recording={recording}
                targetWords={totalWords}
                showTranscript={true}
                showWordCount={true}
                showTimer={true}
                tip="Read the full answer naturally. Click 'Stop Recording' when you're done."
                className=""
              />

              {/* Feedback Panel - Shows after recording */}
              <AnimatePresence>
                {showFeedback && currentFeedback && (
                  <motion.div
                    initial={{ opacity: 0, y: 20, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: -20, scale: 0.95 }}
                    className="rounded-2xl border border-[#30363d] bg-[#161b22] overflow-hidden"
                  >
                    {/* Score Header */}
                    <div className={`p-6 ${
                      currentFeedback.score >= 85 ? 'bg-gradient-to-r from-[#238636]/20 to-[#3fb950]/10' :
                      currentFeedback.score >= 60 ? 'bg-gradient-to-r from-[#58a6ff]/20 to-[#a371f7]/10' :
                      'bg-gradient-to-r from-[#d29922]/20 to-[#f0883e]/10'
                    }`}>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                          <div className={`w-16 h-16 rounded-2xl flex items-center justify-center ${
                            currentFeedback.score >= 85 ? 'bg-[#238636]/30' :
                            currentFeedback.score >= 60 ? 'bg-[#58a6ff]/30' :
                            'bg-[#d29922]/30'
                          }`}>
                            {currentFeedback.score >= 85 ? (
                              <Trophy className="w-8 h-8 text-[#3fb950]" />
                            ) : currentFeedback.score >= 60 ? (
                              <Award className="w-8 h-8 text-[#58a6ff]" />
                            ) : (
                              <TrendingUp className="w-8 h-8 text-[#d29922]" />
                            )}
                          </div>
                          <div>
                            <h3 className="text-xl font-bold text-white mb-1">{currentFeedback.message}</h3>
                            <p className="text-sm text-[#8b949e]">Recording completed</p>
                          </div>
                        </div>
                        <div className="text-right">
                          <div className={`text-4xl font-bold ${
                            currentFeedback.score >= 85 ? 'text-[#3fb950]' :
                            currentFeedback.score >= 60 ? 'text-[#58a6ff]' :
                            'text-[#d29922]'
                          }`}>
                            {currentFeedback.score}%
                          </div>
                          <div className="text-xs text-[#6e7681]">Coverage Score</div>
                        </div>
                      </div>
                    </div>

                    {/* Stats Grid */}
                    <div className="p-6 border-t border-[#30363d]">
                      <div className="grid grid-cols-3 gap-4 mb-6">
                        <div className="text-center p-4 bg-[#0d1117] rounded-xl border border-[#30363d]">
                          <div className="flex items-center justify-center gap-1.5 mb-2 text-[#8b949e]">
                            <Volume2 className="w-4 h-4" />
                            <span className="text-xs">Words Spoken</span>
                          </div>
                          <div className="text-2xl font-bold text-white">
                            {currentFeedback.wordsSpoken}
                            <span className="text-sm text-[#6e7681] font-normal"> / {currentFeedback.targetWords}</span>
                          </div>
                        </div>
                        <div className="text-center p-4 bg-[#0d1117] rounded-xl border border-[#30363d]">
                          <div className="flex items-center justify-center gap-1.5 mb-2 text-[#8b949e]">
                            <Clock className="w-4 h-4" />
                            <span className="text-xs">Duration</span>
                          </div>
                          <div className="text-2xl font-bold text-white">
                            {Math.floor(currentFeedback.duration / 60)}:{(currentFeedback.duration % 60).toString().padStart(2, '0')}
                          </div>
                        </div>
                        <div className="text-center p-4 bg-[#0d1117] rounded-xl border border-[#30363d]">
                          <div className="flex items-center justify-center gap-1.5 mb-2 text-[#8b949e]">
                            <Target className="w-4 h-4" />
                            <span className="text-xs">Key Terms</span>
                          </div>
                          <div className="text-2xl font-bold text-white">
                            {currentFeedback.matchedCount}
                            <span className="text-sm text-[#6e7681] font-normal"> / {currentFeedback.totalPhrases}</span>
                          </div>
                        </div>
                      </div>

                      {/* Key Phrases Matching */}
                      {currentFeedback.keyPhrases.length > 0 && (
                        <div className="mb-6">
                          <h4 className="text-sm font-medium text-white mb-3 flex items-center gap-2">
                            <Sparkles className="w-4 h-4 text-[#a371f7]" />
                            Key Terms from Answer
                          </h4>
                          <div className="flex flex-wrap gap-2">
                            {currentFeedback.keyPhrases.map((phrase, i) => (
                              <span
                                key={i}
                                className={`px-3 py-1.5 rounded-lg text-sm font-medium flex items-center gap-1.5 ${
                                  phrase.matched 
                                    ? 'bg-[#238636]/20 border border-[#238636]/40 text-[#3fb950]' 
                                    : 'bg-[#f85149]/10 border border-[#f85149]/30 text-[#f85149]'
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
                            <p className="text-xs text-[#8b949e] mt-3">
                              💡 Try to include the missing terms in your next attempt
                            </p>
                          )}
                        </div>
                      )}

                      {/* Try Again Button */}
                      <button
                        onClick={tryAgain}
                        className="w-full mt-4 px-4 py-3 border border-[#30363d] text-[#8b949e] hover:text-white hover:border-[#8b949e] rounded-xl transition-colors flex items-center justify-center gap-2"
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
                  className="px-6 py-3 bg-[#21262d] hover:bg-[#30363d] disabled:opacity-50 disabled:cursor-not-allowed rounded-xl font-semibold transition-colors text-[#8b949e] hover:text-white border border-[#30363d]"
                >
                  Previous
                </button>
                <button
                  onClick={goToNext}
                  className="flex-1 px-6 py-3 bg-[#238636] hover:bg-[#2ea043] text-white rounded-xl font-semibold flex items-center justify-center gap-2 transition-colors"
                >
                  {currentIndex === questions.length - 1 ? 'Finish' : 'Next Question'}
                  <ChevronRight className="w-5 h-5" />
                </button>
              </div>
            </motion.div>
          </AnimatePresence>
        </div>
      </div>
      </DesktopSidebarWrapper>
    </>
  );
}

// Helper function
function countWords(text: string): number {
  return text.trim().split(/\s+/).filter(word => word.length > 0).length;
}
