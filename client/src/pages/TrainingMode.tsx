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
  Zap, Clock, Award, TrendingUp, Star, Volume2
} from 'lucide-react';
import { SEOHead } from '../components/SEOHead';
import { useUserPreferences } from '../context/UserPreferencesContext';
import { ChannelService } from '../services/api.service';
import { useVoiceRecording } from '../hooks/use-voice-recording';
import { RecordingPanel } from '../components/unified/RecordingPanel';
import type { Question } from '../types';

// Feedback messages based on performance
const feedbackMessages = {
  excellent: [
    "Outstanding! You nailed it! 🌟",
    "Perfect delivery! You're interview-ready! 💪",
    "Exceptional! Your articulation was spot-on! 🎯",
    "Brilliant! That was professional-grade! ⭐",
  ],
  good: [
    "Great job! You covered the key points! 👍",
    "Well done! Your answer was solid! 🎉",
    "Nice work! Keep practicing for perfection! 💫",
    "Good effort! You're making progress! 📈",
  ],
  needsWork: [
    "Good start! Try to include more details next time 📚",
    "Keep practicing! You're building muscle memory 💪",
    "Nice try! Focus on the key technical terms 🎯",
    "You're learning! Each attempt makes you better 🌱",
  ],
  tooShort: [
    "Try to elaborate more on your answer 📝",
    "Include more details from the reference answer 💡",
    "Expand your response with examples 🔍",
  ],
};

interface RecordingFeedback {
  score: number;
  wordsSpoken: number;
  targetWords: number;
  duration: number;
  message: string;
  badges: string[];
  tips: string[];
}

function calculateFeedback(
  transcript: string,
  targetAnswer: string,
  duration: number
): RecordingFeedback {
  const wordsSpoken = countWords(transcript);
  const targetWords = countWords(targetAnswer);
  const wordRatio = wordsSpoken / targetWords;
  
  // Calculate score based on word coverage
  let score = Math.min(100, Math.round(wordRatio * 100));
  
  // Bonus for speaking at a good pace (100-150 words per minute is ideal)
  const wordsPerMinute = duration > 0 ? (wordsSpoken / duration) * 60 : 0;
  const paceBonus = wordsPerMinute >= 80 && wordsPerMinute <= 160 ? 10 : 0;
  score = Math.min(100, score + paceBonus);
  
  // Determine feedback category
  let message: string;
  const badges: string[] = [];
  const tips: string[] = [];
  
  if (wordRatio < 0.3) {
    message = feedbackMessages.tooShort[Math.floor(Math.random() * feedbackMessages.tooShort.length)];
    tips.push("Try to cover at least 50% of the reference answer");
  } else if (score >= 85) {
    message = feedbackMessages.excellent[Math.floor(Math.random() * feedbackMessages.excellent.length)];
    badges.push("🏆 Excellent Coverage");
    if (wordsPerMinute >= 100 && wordsPerMinute <= 140) {
      badges.push("⚡ Perfect Pace");
    }
  } else if (score >= 60) {
    message = feedbackMessages.good[Math.floor(Math.random() * feedbackMessages.good.length)];
    badges.push("✅ Good Effort");
    if (wordRatio < 0.7) {
      tips.push("Try to include more key concepts");
    }
  } else {
    message = feedbackMessages.needsWork[Math.floor(Math.random() * feedbackMessages.needsWork.length)];
    tips.push("Practice reading the full answer aloud");
    tips.push("Focus on technical terminology");
  }
  
  // Additional badges
  if (duration >= 30 && duration <= 120) {
    badges.push("⏱️ Good Timing");
  }
  if (wordsSpoken >= 50) {
    badges.push("💬 Detailed Response");
  }
  
  return {
    score,
    wordsSpoken,
    targetWords,
    duration,
    message,
    badges,
    tips,
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
    },
    onRecordingComplete: (_audioBlob, transcript) => {
      // Calculate duration
      const duration = Math.round((Date.now() - recordingStartTimeRef.current) / 1000);
      const question = currentQuestionRef.current;
      
      // Calculate feedback
      if (question && transcript) {
        const feedback = calculateFeedback(transcript, question.answer, duration);
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
                            <Zap className="w-4 h-4" />
                            <span className="text-xs">Pace</span>
                          </div>
                          <div className="text-2xl font-bold text-white">
                            {currentFeedback.duration > 0 ? Math.round((currentFeedback.wordsSpoken / currentFeedback.duration) * 60) : 0}
                            <span className="text-sm text-[#6e7681] font-normal"> wpm</span>
                          </div>
                        </div>
                      </div>

                      {/* Badges */}
                      {currentFeedback.badges.length > 0 && (
                        <div className="mb-6">
                          <h4 className="text-sm font-medium text-[#8b949e] mb-3 flex items-center gap-2">
                            <Star className="w-4 h-4 text-[#f1c40f]" />
                            Achievements
                          </h4>
                          <div className="flex flex-wrap gap-2">
                            {currentFeedback.badges.map((badge, i) => (
                              <span
                                key={i}
                                className="px-3 py-1.5 bg-[#f1c40f]/10 border border-[#f1c40f]/30 text-[#f1c40f] rounded-lg text-sm font-medium"
                              >
                                {badge}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Tips */}
                      {currentFeedback.tips.length > 0 && (
                        <div className="p-4 bg-[#58a6ff]/10 border border-[#58a6ff]/30 rounded-xl">
                          <h4 className="text-sm font-medium text-[#58a6ff] mb-2 flex items-center gap-2">
                            <Sparkles className="w-4 h-4" />
                            Tips for Improvement
                          </h4>
                          <ul className="space-y-1">
                            {currentFeedback.tips.map((tip, i) => (
                              <li key={i} className="text-sm text-[#8b949e] flex items-start gap-2">
                                <ChevronRight className="w-4 h-4 text-[#58a6ff] flex-shrink-0 mt-0.5" />
                                {tip}
                              </li>
                            ))}
                          </ul>
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
    </>
  );
}

// Helper function
function countWords(text: string): number {
  return text.trim().split(/\s+/).filter(word => word.length > 0).length;
}
