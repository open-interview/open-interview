/**
 * Certification Exam Practice
 * Material Design 3 compliant
 * Features: Timer, domain tracking, exam simulation mode
 */

import { useState, useEffect, useMemo, useCallback } from 'react';
import { AppLayout } from '../components/layout/AppLayout';
import { useLocation, useRoute } from 'wouter';
import { motion, AnimatePresence } from 'framer-motion';
import {
  getCertificationById,
  CertificationConfig
} from '../lib/certifications-config';
import {
  getQuestionsForCertification,
  getExamConfig,
  generatePracticeSession,
  CertificationQuestion,
  CertificationExamConfig,
} from '../lib/certification-questions';
import { useCredits } from '../context/CreditsContext';
import { SEOHead } from '../components/SEOHead';
import {
  ArrowLeft, Award, Target, CheckCircle, XCircle,
  ChevronRight, ChevronLeft, Lightbulb, BarChart3,
  RotateCw, Flag, BookOpen, Zap, Trophy, AlertCircle, Home, Clock
} from 'lucide-react';
import { useUnifiedToast } from '../hooks/use-unified-toast';

const M3_MOTION_DURATION = 200;
const M3_MOTION_EASING = [0.2, 0, 0, 1];

type ExamMode = 'practice' | 'timed' | 'review';
type SessionState = 'setup' | 'active' | 'results';

interface AnswerRecord {
  questionId: string;
  selectedOptionId: string;
  isCorrect: boolean;
  timeSpent: number;
}

export default function CertificationExam() {
  const [, setLocation] = useLocation();
  const [, params] = useRoute('/certification/:id/exam');
  const certificationId = params?.id;

  const certification = certificationId ? getCertificationById(certificationId) : undefined;
  const examConfig = certificationId ? getExamConfig(certificationId) : undefined;
  const allQuestions = certificationId ? getQuestionsForCertification(certificationId) : [];

  // Session state
  const [sessionState, setSessionState] = useState<SessionState>('setup');
  const [examMode, setExamMode] = useState<ExamMode>('practice');
  const [questionCount, setQuestionCount] = useState(10);
  const [sessionId, setSessionId] = useState<string>(`certification-session-${certificationId}`);

  // Active session
  const [questions, setQuestions] = useState<CertificationQuestion[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [answers, setAnswers] = useState<AnswerRecord[]>([]);
  const [selectedOption, setSelectedOption] = useState<string | null>(null);
  const [showExplanation, setShowExplanation] = useState(false);
  const [flaggedQuestions, setFlaggedQuestions] = useState<Set<number>>(new Set());
  const [questionStartTime, setQuestionStartTime] = useState(Date.now());

  const { toast } = useUnifiedToast();

  // Redirect to home when certification not found
  useEffect(() => {
    if (!certification && certificationId) {
      toast({
        title: "Certification not found",
        description: "Redirecting to home page...",
        variant: "warning",
      });
      const timer = setTimeout(() => {
        setLocation('/');
      }, 1500);
      return () => clearTimeout(timer);
    }
  }, [certification, certificationId, toast, setLocation]);

  const currentQuestion = questions[currentIndex];
  const isAnswered = answers.some(a => a.questionId === currentQuestion?.id);
  const currentAnswer = answers.find(a => a.questionId === currentQuestion?.id);

  // Start exam session
  const startSession = useCallback(() => {
    const sessionQuestions = generatePracticeSession(certificationId!, questionCount);
    setQuestions(sessionQuestions);
    setCurrentIndex(0);
    setAnswers([]);
    setSelectedOption(null);
    setShowExplanation(false);
    setFlaggedQuestions(new Set());
    setQuestionStartTime(Date.now());
    setSessionState('active');
    saveSessionProgress();
  }, [certificationId, questionCount, examMode, examConfig]);

  // Save session progress
  const saveSessionProgress = useCallback(() => {
    if (!certificationId || questions.length === 0) return;

    const sessionData = {
      certificationId,
      certificationName: certification?.name,
      questions,
      currentIndex,
      answers,
      examMode,
      questionCount,
      lastAccessedAt: new Date().toISOString(),
    };

    localStorage.setItem(sessionId, JSON.stringify(sessionData));
  }, [certificationId, certification, questions, currentIndex, answers, examMode, questionCount, sessionId]);

  // Load saved session on mount
  useEffect(() => {
    if (!certificationId) return;

    const savedData = localStorage.getItem(sessionId);
    if (savedData) {
      try {
        const sessionData = JSON.parse(savedData);
        if (sessionData.questions && sessionData.questions.length > 0) {
          // Session exists - keep it in localStorage for resume service
        }
      } catch (e) {
        console.error('Invalid session data:', e);
        localStorage.removeItem(sessionId);
      }
    }
  }, [certificationId, sessionId]);

  // Submit answer
  const submitAnswer = useCallback((optionId: string) => {
    if (!currentQuestion || isAnswered) return;

    const correctOption = currentQuestion.options.find(o => o.isCorrect);
    const isCorrect = optionId === correctOption?.id;
    const timeSpent = Math.round((Date.now() - questionStartTime) / 1000);

    const record: AnswerRecord = {
      questionId: currentQuestion.id,
      selectedOptionId: optionId,
      isCorrect,
      timeSpent,
    };

    setAnswers(prev => [...prev, record]);
    setSelectedOption(optionId);

    if (examMode === 'practice') {
      setShowExplanation(true);
    }
  }, [currentQuestion, isAnswered, questionStartTime, examMode]);

  // Navigation
  const goToNext = useCallback(() => {
    if (currentIndex < questions.length - 1) {
      setCurrentIndex(prev => prev + 1);
      setSelectedOption(null);
      setShowExplanation(false);
      setQuestionStartTime(Date.now());
      saveSessionProgress();
    }
  }, [currentIndex, questions.length, saveSessionProgress]);

  const goToPrev = useCallback(() => {
    if (currentIndex > 0) {
      setCurrentIndex(prev => prev - 1);
      const prevAnswer = answers.find(a => a.questionId === questions[currentIndex - 1]?.id);
      setSelectedOption(prevAnswer?.selectedOptionId || null);
      setShowExplanation(false);
      saveSessionProgress();
    }
  }, [currentIndex, answers, questions, saveSessionProgress]);

  const goToQuestion = useCallback((index: number) => {
    setCurrentIndex(index);
    const answer = answers.find(a => a.questionId === questions[index]?.id);
    setSelectedOption(answer?.selectedOptionId || null);
    setShowExplanation(false);
    setQuestionStartTime(Date.now());
    saveSessionProgress();
  }, [answers, questions, saveSessionProgress]);

  const toggleFlag = useCallback(() => {
    setFlaggedQuestions(prev => {
      const newSet = new Set(prev);
      if (newSet.has(currentIndex)) {
        newSet.delete(currentIndex);
      } else {
        newSet.add(currentIndex);
      }
      return newSet;
    });
    saveSessionProgress();
  }, [currentIndex, saveSessionProgress]);

  const finishExam = useCallback(() => {
    setSessionState('results');
    localStorage.removeItem(sessionId);
  }, [sessionId]);

  const exitExam = useCallback(() => {
    saveSessionProgress();
    setLocation(`/certification/${certificationId}`);
  }, [saveSessionProgress, certificationId, setLocation]);

  // Results calculations
  const results = useMemo(() => {
    const correct = answers.filter(a => a.isCorrect).length;
    const total = questions.length;
    const percentage = total > 0 ? Math.round((correct / total) * 100) : 0;
    const passed = examConfig ? percentage >= examConfig.passingScore : percentage >= 70;
    const totalTime = answers.reduce((sum, a) => sum + a.timeSpent, 0);
    const avgTime = answers.length > 0 ? Math.round(totalTime / answers.length) : 0;

    // Domain breakdown
    const domainResults: Record<string, { correct: number; total: number; percentage: number }> = {};
    if (examConfig) {
      examConfig.domains.forEach(domain => {
        const domainQuestions = questions.filter(q => q.domain === domain.id);
        const domainAnswers = answers.filter(a =>
          domainQuestions.some(q => q.id === a.questionId)
        );
        const domainCorrect = domainAnswers.filter(a => a.isCorrect).length;
        domainResults[domain.id] = {
          correct: domainCorrect,
          total: domainQuestions.length,
          percentage: domainQuestions.length > 0 ? Math.round((domainCorrect / domainQuestions.length) * 100) : 0,
        };
      });
    }

    return { correct, total, percentage, passed, totalTime, avgTime, domainResults };
  }, [answers, questions, examConfig]);

  if (!certification) {
    return (
      <div className="min-h-screen flex items-center justify-center" role="alert" aria-label="Certification not found">
        <div className="text-center">
          <Award className="w-16 h-16 mx-auto mb-4 text-[var(--md-sys-color-on-surface-variant)]/30" />
          <h2 className="text-xl font-semibold mb-2 text-[var(--md-sys-color-on-surface)]">Certification not found</h2>
          <p className="text-[var(--md-sys-color-on-surface-variant)] text-base">Redirecting to home...</p>
        </div>
      </div>
    );
  }

  if (allQuestions.length === 0) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4" role="status" aria-label="Questions coming soon">
        <div className="text-center max-w-md">
          <AlertCircle className="w-16 h-16 mx-auto mb-4 text-[var(--md-sys-color-on-surface-variant)]" />
          <h2 className="text-xl font-semibold mb-2 text-[var(--md-sys-color-on-surface)]">Questions Coming Soon</h2>
          <p className="text-[var(--md-sys-color-on-surface-variant)] mb-4 text-base">
            We're preparing certification-specific questions for {certification.name}.
            In the meantime, try the general practice mode.
          </p>
          <button
            onClick={() => setLocation(`/certification/${certificationId}`)}
            aria-label="Go to practice mode"
            className="min-h-[48px] px-6 py-2 bg-[var(--md-sys-color-primary)] text-[var(--md-sys-color-on-primary)] rounded-2xl font-medium cursor-pointer transition-opacity duration-150 ease-out hover:opacity-90 focus-visible:ring-2 focus-visible:ring-[var(--md-sys-color-primary)] focus-visible:ring-offset-2 focus-visible:outline-none text-sm shadow-none"
          >
            Go to Practice Mode
          </button>
        </div>
      </div>
    );
  }

  return (
    <AppLayout fullWidth>
      <SEOHead
        title={`${certification.name} Exam Practice`}
        description={`Practice exam for ${certification.name} certification`}
      />

      <div className="min-h-screen bg-[var(--md-sys-color-background)] pt-14 lg:pt-0">
        {/* Setup Screen */}
        {sessionState === 'setup' && (
          <SetupScreen
            certification={certification}
            examConfig={examConfig}
            totalQuestions={allQuestions.length}
            examMode={examMode}
            setExamMode={setExamMode}
            questionCount={questionCount}
            setQuestionCount={setQuestionCount}
            onStart={startSession}
            onBack={() => setLocation(`/certification/${certificationId}`)}
          />
        )}

        {/* Active Exam */}
        {sessionState === 'active' && currentQuestion && (
          <ActiveExam
            certification={certification}
            examMode={examMode}
            currentIndex={currentIndex}
            totalQuestions={questions.length}
            currentQuestion={currentQuestion}
            selectedOption={selectedOption}
            isAnswered={isAnswered}
            currentAnswer={currentAnswer}
            showExplanation={showExplanation}
            flaggedQuestions={flaggedQuestions}
            answers={answers}
            questions={questions}
            onSelectOption={submitAnswer}
            onNext={goToNext}
            onPrev={goToPrev}
            onGoToQuestion={goToQuestion}
            onToggleFlag={toggleFlag}
            onFinish={finishExam}
            onExit={exitExam}
          />
        )}

        {/* Results Screen */}
        {sessionState === 'results' && (
          <ResultsScreen
            certification={certification}
            examConfig={examConfig}
            results={results}
            questions={questions}
            answers={answers}
            onRetry={() => {
              setSessionState('setup');
            }}
            onReview={() => {
              setExamMode('review');
              setCurrentIndex(0);
              setSessionState('active');
            }}
            onReviewWrong={() => {
              // Store wrong question IDs in sessionStorage for CertificationPractice to filter
              const wrongIds = answers
                .filter(a => !a.isCorrect)
                .map(a => a.questionId);
              sessionStorage.setItem('cert-review-wrong', JSON.stringify(wrongIds));
              setExamMode('review');
              // Filter to only wrong questions
              const wrongIndices = answers
                .map((a, i) => (!a.isCorrect ? i : -1))
                .filter(i => i >= 0);
              setCurrentIndex(wrongIndices[0] ?? 0);
              setSessionState('active');
            }}
            onBack={() => setLocation(`/certification/${certificationId}`)}
          />
        )}
      </div>
    </AppLayout>
  );
}

// ============================================
// SETUP SCREEN
// ============================================

interface SetupScreenProps {
  certification: CertificationConfig;
  examConfig: CertificationExamConfig | undefined;
  totalQuestions: number;
  examMode: ExamMode;
  setExamMode: (mode: ExamMode) => void;
  questionCount: number;
  setQuestionCount: (count: number) => void;
  onStart: () => void;
  onBack: () => void;
}

function SetupScreen({
  certification,
  examConfig,
  totalQuestions,
  examMode,
  setExamMode,
  questionCount,
  setQuestionCount,
  onStart,
  onBack,
}: SetupScreenProps) {
  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, ease: M3_MOTION_EASING }}
        className="w-full max-w-lg"
      >
        {/* Header */}
        <div className="text-center mb-8">
          <button
            onClick={onBack}
            aria-label="Back to certification"
            className="inline-flex items-center gap-2 text-[var(--md-sys-color-on-surface-variant)] hover:text-[var(--md-sys-color-on-surface)] mb-4 min-h-[48px] cursor-pointer transition-colors duration-150 ease-out focus-visible:ring-2 focus-visible:ring-[var(--md-sys-color-primary)] focus-visible:outline-none"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to certification
          </button>

          <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-gradient-to-br from-[var(--md-sys-color-primary)]/20 to-[var(--md-sys-color-primary)]/5 flex items-center justify-center">
            <Award className="min-w-[48px] w-8 min-h-[48px] h-8 text-[var(--md-sys-color-primary)]" />
          </div>

          <h1 className="text-[var(--md-sys-typescale-headline-small-size,2.25rem)] font-[var(--md-sys-typescale-headline-small-weight,400)] leading-[var(--md-sys-typescale-headline-small-line-height,1.22)] mb-2 text-[var(--md-sys-color-on-surface)]">{certification.name}</h1>
          <p className="text-[var(--md-sys-color-on-surface-variant)]">{certification.provider}</p>
        </div>

        {/* Exam Info */}
        {examConfig && (
          <div className="bg-[var(--md-sys-color-surface-container)] border border-[var(--md-sys-color-outline-variant)] rounded-2xl p-4 mb-6">
            <h3 className="font-semibold mb-3 flex items-center gap-2 text-[var(--md-sys-color-on-surface)]">
              <BookOpen className="w-4 h-4 text-[var(--md-sys-color-primary)]" />
              Exam Details
            </h3>
            <div className="grid grid-cols-3 gap-4 text-base">
              <div>
                <div className="text-[var(--md-sys-color-on-surface-variant)]">Questions</div>
                <div className="font-semibold text-[var(--md-sys-color-on-surface)]">{examConfig.totalQuestions}</div>
              </div>
              <div>
                <div className="text-[var(--md-sys-color-on-surface-variant)]">Time Limit</div>
                <div className="font-semibold text-[var(--md-sys-color-on-surface)]">{examConfig.timeLimit} min</div>
              </div>
              <div>
                <div className="text-[var(--md-sys-color-on-surface-variant)]">Passing</div>
                <div className="font-semibold text-[var(--md-sys-color-on-surface)]">{examConfig.passingScore}%</div>
              </div>
            </div>
          </div>
        )}

        {/* Mode Selection */}
        <div className="space-y-3 mb-6" role="radiogroup" aria-label="Practice mode">
          <h3 className="font-semibold text-[var(--md-sys-color-on-surface)]">Practice Mode</h3>

          <button
            onClick={() => setExamMode('practice')}
            role="radio"
            aria-checked={examMode === 'practice'}
            className={`w-full p-4 rounded-2xl border-2 text-left transition-all duration-200 ease-out cursor-pointer min-h-[48px] focus-visible:ring-2 focus-visible:ring-[var(--md-sys-color-primary)] focus-visible:ring-offset-2 focus-visible:outline-none ${
              examMode === 'practice'
                ? 'border-[var(--md-sys-color-primary)] bg-[var(--md-sys-color-primary-container)]'
                : 'border-[var(--md-sys-color-outline-variant)] hover:border-[var(--md-sys-color-primary)]/50'
            }`}
          >
            <div className="flex items-center gap-3">
              <div className={`min-w-[48px] w-10 min-h-[48px] h-10 rounded-2xl flex items-center justify-center ${
                examMode === 'practice' ? 'bg-[var(--md-sys-color-primary)] text-[var(--md-sys-color-on-primary)]' : 'bg-[var(--md-sys-color-surface-container)]'
              }`}>
                <Lightbulb className="w-5 h-5" />
              </div>
              <div>
                <div className="font-medium text-[var(--md-sys-color-on-surface)]">Learning Mode</div>
                <div className="text-base text-[var(--md-sys-color-on-surface-variant)]">See explanations after each answer</div>
              </div>
            </div>
          </button>

          <button
            onClick={() => setExamMode('timed')}
            role="radio"
            aria-checked={examMode === 'timed'}
            className={`w-full p-4 rounded-2xl border-2 text-left transition-all duration-200 ease-out cursor-pointer min-h-[48px] focus-visible:ring-2 focus-visible:ring-[var(--md-sys-color-primary)] focus-visible:ring-offset-2 focus-visible:outline-none ${
              examMode === 'timed'
                ? 'border-[var(--md-sys-color-primary)] bg-[var(--md-sys-color-primary-container)]'
                : 'border-[var(--md-sys-color-outline-variant)] hover:border-[var(--md-sys-color-primary)]/50'
            }`}
          >
            <div className="flex items-center gap-3">
              <div className={`min-w-[48px] w-10 min-h-[48px] h-10 rounded-2xl flex items-center justify-center ${
                examMode === 'timed' ? 'bg-[var(--md-sys-color-primary)] text-[var(--md-sys-color-on-primary)]' : 'bg-[var(--md-sys-color-surface-container)]'
              }`}>
                <Clock className="w-5 h-5" />
              </div>
              <div>
                <div className="font-medium text-[var(--md-sys-color-on-surface)]">Exam Simulation</div>
                <div className="text-base text-[var(--md-sys-color-on-surface-variant)]">Timed test, results at the end</div>
              </div>
            </div>
          </button>
        </div>

        {/* Question Count */}
        <div className="mb-8">
          <h3 className="font-semibold mb-3 text-[var(--md-sys-color-on-surface)]">Questions ({totalQuestions} available)</h3>
          <div className="flex gap-2" role="radiogroup" aria-label="Question count">
            {[5, 10, 15, 20].filter(n => n <= totalQuestions).map(count => (
              <button
                key={count}
                onClick={() => setQuestionCount(count)}
                role="radio"
                aria-checked={questionCount === count}
                className={`flex-1 py-2 rounded-2xl font-medium transition-all duration-200 ease-out cursor-pointer min-h-[48px] focus-visible:ring-2 focus-visible:ring-[var(--md-sys-color-primary)] focus-visible:ring-offset-2 focus-visible:outline-none ${
                  questionCount === count
                    ? 'bg-[var(--md-sys-color-primary)] text-[var(--md-sys-color-on-primary)]'
                    : 'bg-[var(--md-sys-color-surface-container)] hover:bg-[var(--md-sys-color-surface-container-high)]'
                }`}
              >
                {count}
              </button>
            ))}
          </div>
        </div>

        {/* Start Button */}
        <button
          onClick={onStart}
          aria-label="Start practice exam"
          className="w-full min-h-[48px] py-2.5 h-10 bg-[var(--md-sys-color-primary)] text-[var(--md-sys-color-on-primary)] rounded-lg font-medium flex items-center justify-center gap-2 hover:opacity-90 transition-opacity duration-150 ease-out cursor-pointer focus-visible:ring-2 focus-visible:ring-[var(--md-sys-color-primary)] focus-visible:ring-offset-2 focus-visible:outline-none text-sm shadow-none"
        >
          <Zap className="w-5 h-5" />
          Start Practice
        </button>
      </motion.div>
    </div>
  );
}

// ============================================
// ACTIVE EXAM
// ============================================

interface ActiveExamProps {
  certification: CertificationConfig;
  examMode: ExamMode;
  currentIndex: number;
  totalQuestions: number;
  currentQuestion: CertificationQuestion;
  selectedOption: string | null;
  isAnswered: boolean;
  currentAnswer: AnswerRecord | undefined;
  showExplanation: boolean;
  flaggedQuestions: Set<number>;
  answers: AnswerRecord[];
  questions: CertificationQuestion[];
  onSelectOption: (optionId: string) => void;
  onNext: () => void;
  onPrev: () => void;
  onGoToQuestion: (index: number) => void;
  onToggleFlag: () => void;
  onFinish: () => void;
  onExit: () => void;
}

function ActiveExam({
  certification,
  examMode,
  currentIndex,
  totalQuestions,
  currentQuestion,
  selectedOption,
  isAnswered,
  currentAnswer,
  showExplanation,
  flaggedQuestions,
  answers,
  questions,
  onSelectOption,
  onNext,
  onPrev,
  onGoToQuestion,
  onToggleFlag,
  onFinish,
  onExit,
}: ActiveExamProps) {
  const [showNav, setShowNav] = useState(false);
  const [showExitConfirm, setShowExitConfirm] = useState(false);
  const isFlagged = flaggedQuestions.has(currentIndex);
  const correctOption = currentQuestion.options.find(o => o.isCorrect);

  return (
    <div className="min-h-screen flex flex-col">
      {/* Exit Confirmation Dialog */}
      <AnimatePresence>
        {showExitConfirm && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2, ease: M3_MOTION_EASING }}
            className="fixed inset-0 z-[60] bg-[var(--md-sys-color-scrim)]/80 backdrop-blur-sm flex items-center justify-center p-4"
            onClick={() => setShowExitConfirm(false)}
            role="dialog"
            aria-modal="true"
            aria-label="Exit exam confirmation"
          >
            <motion.div
              initial={{ scale: 0.9 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0.9 }}
              transition={{ duration: 0.2, ease: M3_MOTION_EASING }}
              className="bg-[var(--md-sys-color-surface-container-high)] border border-[var(--md-sys-color-outline-variant)] rounded-2xl w-full max-w-sm p-5"
              onClick={e => e.stopPropagation()}
            >
              <div className="text-center">
                <Home className="w-12 h-12 mx-auto mb-3 text-[var(--md-sys-color-on-surface-variant)]" />
                <h3 className="font-bold mb-2 text-[var(--md-sys-color-on-surface)]">Exit Exam?</h3>
                <p className="text-base text-[var(--md-sys-color-on-surface-variant)] mb-4">Your progress will be saved. You can resume later.</p>
                <div className="flex gap-2">
                  <button
                    onClick={() => setShowExitConfirm(false)}
                    aria-label="Continue exam"
                    className="flex-1 min-h-[48px] py-2.5 bg-[var(--md-sys-color-surface-container)] rounded-2xl font-medium cursor-pointer transition-colors duration-150 ease-out hover:bg-[var(--md-sys-color-surface-container-high)] focus-visible:ring-2 focus-visible:ring-[var(--md-sys-color-primary)] focus-visible:ring-offset-2 focus-visible:outline-none text-[var(--md-sys-color-on-surface-variant)]"
                  >
                    Continue
                  </button>
                  <button
                    onClick={onExit}
                    aria-label="Exit exam and save progress"
                    className="flex-1 min-h-[48px] py-2.5 bg-[var(--md-sys-color-surface-container-high)] text-[var(--md-sys-color-on-surface-variant)] rounded-2xl font-medium cursor-pointer transition-colors duration-150 ease-out hover:bg-[var(--md-sys-color-surface-container)] focus-visible:ring-2 focus-visible:ring-[var(--md-sys-color-primary)] focus-visible:ring-offset-2 focus-visible:outline-none"
                  >
                    Exit
                  </button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Header */}
      <header className="sticky top-0 z-40 bg-[var(--md-sys-color-background)]/95 backdrop-blur-xl border-b border-[var(--md-sys-color-outline-variant)] shadow-xl">
        <div className="max-w-4xl mx-auto px-4 py-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <button
                onClick={() => setShowExitConfirm(true)}
                aria-label="Exit and save progress"
                className="min-h-[48px] min-w-[48px] flex items-center justify-center hover:bg-[var(--md-sys-color-surface-container)] rounded-2xl transition-colors duration-150 ease-out cursor-pointer focus-visible:ring-2 focus-visible:ring-[var(--md-sys-color-primary)] focus-visible:ring-offset-2 focus-visible:outline-none"
              >
                <Home className="w-4 h-4 text-[var(--md-sys-color-on-surface-variant)]" />
              </button>
              <span className="text-base font-medium text-[var(--md-sys-color-on-surface-variant)]">
                {certification.name}
              </span>
            </div>

            <div className="flex items-center gap-3">
              <button
                onClick={() => setShowNav(!showNav)}
                aria-expanded={showNav}
                aria-label={`Question navigator (${currentIndex + 1} of ${totalQuestions})`}
                className="min-h-[48px] px-3 py-1.5 bg-[var(--md-sys-color-surface-container)] rounded-2xl text-base font-medium cursor-pointer transition-colors duration-150 ease-out hover:bg-[var(--md-sys-color-surface-container-high)] focus-visible:ring-2 focus-visible:ring-[var(--md-sys-color-primary)] focus-visible:ring-offset-2 focus-visible:outline-none text-[var(--md-sys-color-on-surface-variant)]"
              >
                {currentIndex + 1}/{totalQuestions}
              </button>
            </div>
          </div>

          {/* Progress bar */}
          <div className="mt-2 h-1 bg-[var(--md-sys-color-surface-container)] rounded-full overflow-hidden">
            <div
              className="h-full bg-[var(--md-sys-color-primary)] transition-all"
              style={{ width: `${((currentIndex + 1) / totalQuestions) * 100}%`, transitionDuration: M3_MOTION_DURATION, transitionTimingFunction: M3_MOTION_EASING }}
            />
          </div>
        </div>
      </header>

      {/* Question Navigator Overlay */}
      <AnimatePresence>
        {showNav && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2, ease: M3_MOTION_EASING }}
            className="fixed inset-0 z-50 bg-[var(--md-sys-color-scrim)]/60 backdrop-blur-sm"
            onClick={() => setShowNav(false)}
            role="dialog"
            aria-modal="true"
            aria-label="Question navigator"
          >
            <motion.div
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              transition={{ duration: 0.3, ease: M3_MOTION_EASING }}
              className="absolute bottom-0 left-0 right-0 bg-[var(--md-sys-color-surface-container-high)] rounded-t-2xl p-4 max-h-[60vh] overflow-y-auto"
              onClick={e => e.stopPropagation()}
            >
              <div className="text-center mb-4">
                <div className="w-12 h-1 bg-[var(--md-sys-color-outline-variant)] rounded-full mx-auto mb-3" />
                <h3 className="font-semibold text-[var(--md-sys-color-on-surface)]">Question Navigator</h3>
              </div>

              <div className="grid grid-cols-5 gap-2" role="grid" aria-label="Question list">
                {questions.map((_, i) => {
                  const answer = answers.find(a => a.questionId === questions[i].id);
                  const isCurrent = i === currentIndex;
                  const isFlag = flaggedQuestions.has(i);

                  return (
                    <button
                      key={i}
                      onClick={() => {
                        onGoToQuestion(i);
                        setShowNav(false);
                      }}
                      aria-label={`Question ${i + 1}${answer ? (answer.isCorrect ? ' - correct' : ' - wrong') : ' - unanswered'}${isCurrent ? ' (current)' : ''}`}
                      className={`relative aspect-square rounded-2xl font-medium text-base transition-all duration-200 ease-out cursor-pointer min-h-[48px] focus-visible:ring-2 focus-visible:ring-[var(--md-sys-color-primary)] focus-visible:ring-offset-2 focus-visible:outline-none ${
                        isCurrent
                          ? 'bg-[var(--md-sys-color-primary)] text-[var(--md-sys-color-on-primary)]'
                          : answer
                          ? answer.isCorrect
                            ? 'bg-[var(--md-sys-color-tertiary)]/20 text-[var(--md-sys-color-tertiary)]'
                            : 'bg-[var(--md-sys-color-error)]/20 text-[var(--md-sys-color-error)]'
                          : 'bg-[var(--md-sys-color-surface-container)] hover:bg-[var(--md-sys-color-surface-container-high)]'
                      }`}
                    >
                      {i + 1}
                      {isFlag && (
                        <Flag className="absolute top-0.5 right-0.5 w-3 h-3 text-[var(--md-sys-color-on-surface-variant)]" />
                      )}
                    </button>
                  );
                })}
              </div>

              <div className="mt-4 flex gap-4 text-xs text-[var(--md-sys-color-on-surface-variant)] justify-center">
                <span className="flex items-center gap-1">
                  <div className="w-3 h-3 rounded bg-[var(--md-sys-color-tertiary)]/20" /> Correct
                </span>
                <span className="flex items-center gap-1">
                  <div className="w-3 h-3 rounded bg-[var(--md-sys-color-error)]/20" /> Wrong
                </span>
                <span className="flex items-center gap-1">
                  <div className="w-3 h-3 rounded bg-[var(--md-sys-color-surface-container)]" /> Unanswered
                </span>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Question Content */}
      <main className="flex-1 max-w-4xl mx-auto w-full px-4 py-6">
        {/* Domain & Difficulty */}
        <div className="flex items-center gap-2 mb-4">
          <span className="px-3 py-1.5 bg-[var(--md-sys-color-primary-container)] text-[var(--md-sys-color-on-primary-container)] text-xs rounded-full font-medium">
            {currentQuestion.domain.replace(/-/g, ' ')}
          </span>
          <span className={`px-3 py-1.5 text-xs rounded-full font-medium ${
            currentQuestion.difficulty === 'beginner' ? 'bg-[var(--md-sys-color-tertiary)]/10 text-[var(--md-sys-color-tertiary)]' :
            currentQuestion.difficulty === 'intermediate' ? 'bg-[var(--md-sys-color-tertiary)]/10 text-[var(--md-sys-color-tertiary)]' :
            'bg-[var(--md-sys-color-error)]/10 text-[var(--md-sys-color-error)]'
          }`}>
            {currentQuestion.difficulty}
          </span>
          <button
            onClick={onToggleFlag}
            aria-label={isFlagged ? 'Unflag question' : 'Flag question for review'}
            aria-pressed={isFlagged}
            className={`ml-auto min-h-[48px] min-w-[48px] flex items-center justify-center rounded-2xl transition-colors duration-150 ease-out cursor-pointer focus-visible:ring-2 focus-visible:ring-[var(--md-sys-color-primary)] focus-visible:ring-offset-2 focus-visible:outline-none ${
              isFlagged ? 'bg-[var(--md-sys-color-surface-container-high)] text-[var(--md-sys-color-on-surface-variant)]' : 'hover:bg-[var(--md-sys-color-surface-container)] text-[var(--md-sys-color-on-surface-variant)]'
            }`}
          >
            <Flag className="w-4 h-4" />
          </button>
        </div>

        {/* Question */}
        <h2 className="text-[var(--md-sys-typescale-title-large-size,2rem)] font-[var(--md-sys-typescale-title-large-weight,400)] leading-[var(--md-sys-typescale-title-large-line-height,1.25)] mb-6 text-[var(--md-sys-color-on-surface)]">
          {currentQuestion.question}
        </h2>

        {/* Options */}
        <div className="space-y-3 mb-6" role="radiogroup" aria-label="Answer options">
          {currentQuestion.options.map((option) => {
            const isSelected = selectedOption === option.id;
            const showResult = isAnswered && (examMode === 'practice' || examMode === 'review');
            const isCorrect = option.isCorrect;

            return (
              <button
                key={option.id}
                onClick={() => !isAnswered && onSelectOption(option.id)}
                disabled={isAnswered && examMode !== 'review'}
                role="radio"
                aria-checked={isSelected}
                aria-label={option.text}
                className={`w-full p-4 text-left border-2 rounded-2xl transition-all duration-200 ease-out min-h-[48px] focus-visible:ring-2 focus-visible:ring-[var(--md-sys-color-primary)] focus-visible:ring-offset-2 focus-visible:outline-none ${
                  showResult
                    ? isCorrect
                      ? 'border-[var(--md-sys-color-tertiary)] bg-[var(--md-sys-color-tertiary)]/10'
                      : isSelected
                      ? 'border-[var(--md-sys-color-error)] bg-[var(--md-sys-color-error)]/10'
                      : 'border-[var(--md-sys-color-outline-variant)]'
                    : isSelected
                    ? 'border-[var(--md-sys-color-primary)] bg-[var(--md-sys-color-primary-container)]'
                    : 'border-[var(--md-sys-color-outline-variant)] hover:border-[var(--md-sys-color-primary)]/50'
                } ${isAnswered && examMode !== 'review' ? 'cursor-default' : 'cursor-pointer'}`}
              >
                <div className="flex items-start gap-3">
                  <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center flex-shrink-0 mt-0.5 ${
                    showResult && isCorrect ? 'border-[var(--md-sys-color-tertiary)] bg-[var(--md-sys-color-tertiary)]' :
                    showResult && isSelected && !isCorrect ? 'border-[var(--md-sys-color-error)] bg-[var(--md-sys-color-error)]' :
                    isSelected ? 'border-[var(--md-sys-color-primary)] bg-[var(--md-sys-color-primary)]' :
                    'border-[var(--md-sys-color-outline-variant)]'
                  }`}>
                    {showResult && isCorrect && <CheckCircle className="w-4 h-4 text-[var(--md-sys-color-on-tertiary)]" />}
                    {showResult && isSelected && !isCorrect && <XCircle className="w-4 h-4 text-[var(--md-sys-color-on-error)]" />}
                    {!showResult && isSelected && <div className="w-2 h-2 rounded-full bg-[var(--md-sys-color-on-primary)]" />}
                  </div>
                  <span className="text-[var(--md-sys-typescale-body-medium-size,0.875rem)] leading-relaxed text-[var(--md-sys-color-on-surface)]">{option.text}</span>
                </div>
              </button>
            );
          })}
        </div>

        {/* Explanation */}
        <AnimatePresence>
          {showExplanation && currentQuestion.explanation && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.3, ease: M3_MOTION_EASING }}
              className="mb-6"
              role="region"
              aria-label="Explanation"
            >
              <div className="p-4 bg-[var(--md-sys-color-primary)]/10 border border-[var(--md-sys-color-primary)]/20 rounded-2xl">
                <div className="flex items-start gap-3">
                  <Lightbulb className="w-5 h-5 text-[var(--md-sys-color-primary)] flex-shrink-0 mt-0.5" />
                  <div>
                    <div className="font-medium text-[var(--md-sys-color-primary)] mb-1">Explanation</div>
                    <p className="text-base text-[var(--md-sys-color-on-surface-variant)] leading-relaxed">
                      {currentQuestion.explanation}
                    </p>
                  </div>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      {/* Footer Navigation */}
      <footer className="sticky bottom-0 bg-[var(--md-sys-color-background)]/95 backdrop-blur-xl border-t border-[var(--md-sys-color-outline-variant)] p-4 pb-safe shadow-xl">
        <div className="max-w-4xl mx-auto flex items-center justify-between pb-2">
          <button
            onClick={onPrev}
            disabled={currentIndex === 0}
            aria-label="Previous question"
            className="flex items-center gap-2 px-4 min-h-[48px] bg-[var(--md-sys-color-surface-container)] rounded-2xl disabled:opacity-[0.38] cursor-pointer transition-colors duration-150 ease-out hover:bg-[var(--md-sys-color-surface-container-high)] disabled:cursor-default focus-visible:ring-2 focus-visible:ring-[var(--md-sys-color-primary)] focus-visible:ring-offset-2 focus-visible:outline-none"
          >
            <ChevronLeft className="w-5 h-5 text-[var(--md-sys-color-on-surface-variant)]" />
            <span className="hidden sm:inline text-[var(--md-sys-color-on-surface-variant)]">Previous</span>
          </button>

          {currentIndex === totalQuestions - 1 ? (
            <button
              onClick={onFinish}
              aria-label="Finish exam"
              className="flex items-center gap-2 px-6 min-h-[48px] bg-[var(--md-sys-color-primary)] text-[var(--md-sys-color-on-primary)] rounded-2xl font-medium cursor-pointer transition-opacity duration-150 ease-out hover:opacity-90 focus-visible:ring-2 focus-visible:ring-[var(--md-sys-color-primary)] focus-visible:ring-offset-2 focus-visible:outline-none"
            >
              <Trophy className="w-5 h-5" />
              Finish
            </button>
          ) : (
            <button
              onClick={onNext}
              disabled={!isAnswered && examMode === 'practice'}
              aria-label="Next question"
              className="flex items-center gap-2 px-4 min-h-[48px] bg-[var(--md-sys-color-primary)] text-[var(--md-sys-color-on-primary)] rounded-2xl disabled:opacity-[0.38] cursor-pointer transition-opacity duration-150 ease-out hover:opacity-90 disabled:cursor-default focus-visible:ring-2 focus-visible:ring-[var(--md-sys-color-primary)] focus-visible:ring-offset-2 focus-visible:outline-none"
            >
              <span className="hidden sm:inline">Next</span>
              <ChevronRight className="w-5 h-5" />
            </button>
          )}
        </div>
      </footer>
    </div>
  );
}

// ============================================
// RESULTS SCREEN
// ============================================

interface ResultsScreenProps {
  certification: CertificationConfig;
  examConfig: CertificationExamConfig | undefined;
  results: {
    correct: number;
    total: number;
    percentage: number;
    passed: boolean;
    totalTime: number;
    avgTime: number;
    domainResults: Record<string, { correct: number; total: number; percentage: number }>;
  };
  questions: CertificationQuestion[];
  answers: AnswerRecord[];
  onRetry: () => void;
  onReview: () => void;
  onBack: () => void;
  onReviewWrong: () => void;
}

function ResultsScreen({
  certification,
  examConfig,
  results,
  questions,
  answers,
  onRetry,
  onReview,
  onBack,
  onReviewWrong,
}: ResultsScreenProps) {
  const wrongCount = results.total - results.correct;
  return (
    <div className="min-h-screen p-4" role="main" aria-label="Exam results">
      <div className="max-w-2xl mx-auto">
        {/* Result Header */}
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.3, ease: M3_MOTION_EASING }}
          className="text-center py-8"
        >
          <div className={`w-24 h-24 mx-auto mb-4 rounded-full flex items-center justify-center ${
            results.passed
              ? 'bg-gradient-to-br from-[var(--md-sys-color-tertiary)] to-[var(--md-sys-color-tertiary)]'
              : 'bg-gradient-to-br from-[var(--md-sys-color-error)] to-[var(--md-sys-color-error)]'
          }`}>
            {results.passed ? (
              <Trophy className="w-12 h-12 text-[var(--md-sys-color-on-tertiary)]" />
            ) : (
              <RotateCw className="w-12 h-12 text-[var(--md-sys-color-on-error)]" />
            )}
          </div>

          <h1 className="text-[var(--md-sys-typescale-headline-large-size,2rem)] font-[var(--md-sys-typescale-headline-large-weight,400)] leading-[var(--md-sys-typescale-headline-large-line-height,1.25)] mb-2 text-[var(--md-sys-color-on-surface)]">
            {results.passed ? 'Congratulations!' : 'Keep Practicing!'}
          </h1>

          <p className="text-[var(--md-sys-color-on-surface-variant)] mb-4 text-base">
            {results.passed
              ? `You passed the ${certification.name} practice exam!`
              : `You need ${examConfig?.passingScore || 70}% to pass. Keep studying!`
            }
          </p>

          {/* Score Circle */}
          <div className="relative w-32 h-32 mx-auto mb-6" role="img" aria-label={`Score: ${results.percentage}%`}>
            <svg className="w-full h-full transform -rotate-90">
              <circle
                cx="64"
                cy="64"
                r="56"
                fill="none"
                stroke="currentColor"
                strokeWidth="8"
                className="text-[var(--md-sys-color-outline-variant)]"
              />
              <circle
                cx="64"
                cy="64"
                r="56"
                fill="none"
                stroke="currentColor"
                strokeWidth="8"
                strokeDasharray={`${results.percentage * 3.52} 352`}
                className={results.passed ? 'text-[var(--md-sys-color-tertiary)]' : 'text-[var(--md-sys-color-error)]'}
              />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <span className="text-3xl font-bold text-[var(--md-sys-color-on-surface)]">{results.percentage}%</span>
              <span className="text-xs text-[var(--md-sys-color-on-surface-variant)]">
                {results.correct}/{results.total}
              </span>
            </div>
          </div>
        </motion.div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-4 mb-6">
          <div className="bg-[var(--md-sys-color-surface-container)] border border-[var(--md-sys-color-outline-variant)] rounded-2xl p-4 text-center">
            <Target className="w-5 h-5 mx-auto mb-2 text-[var(--md-sys-color-primary)]" />
            <div className="text-2xl font-bold text-[var(--md-sys-color-on-surface)]">{results.correct}</div>
            <div className="text-xs text-[var(--md-sys-color-on-surface-variant)]">Correct</div>
          </div>
          <div className="bg-[var(--md-sys-color-surface-container)] border border-[var(--md-sys-color-outline-variant)] rounded-2xl p-4 text-center">
            <Trophy className="w-5 h-5 mx-auto mb-2 text-[var(--md-sys-color-primary)]" />
            <div className="text-2xl font-bold text-[var(--md-sys-color-on-surface)]">{results.avgTime}s</div>
            <div className="text-xs text-[var(--md-sys-color-on-surface-variant)]">Avg Time</div>
          </div>
          <div className="bg-[var(--md-sys-color-surface-container)] border border-[var(--md-sys-color-outline-variant)] rounded-2xl p-4 text-center">
            <BarChart3 className="w-5 h-5 mx-auto mb-2 text-[var(--md-sys-color-primary)]" />
            <div className="text-2xl font-bold text-[var(--md-sys-color-on-surface)]">{examConfig?.passingScore || 70}%</div>
            <div className="text-xs text-[var(--md-sys-color-on-surface-variant)]">Pass Mark</div>
          </div>
        </div>

        {/* Domain Breakdown */}
        {examConfig && Object.keys(results.domainResults).length > 0 && (
          <div className="bg-[var(--md-sys-color-surface-container)] border border-[var(--md-sys-color-outline-variant)] rounded-2xl p-4 mb-6">
            <h3 className="font-semibold mb-4 flex items-center gap-2 text-[var(--md-sys-color-on-surface)]">
              <BarChart3 className="w-4 h-4 text-[var(--md-sys-color-primary)]" />
              Domain Performance
            </h3>
            <div className="space-y-3">
              {examConfig.domains.map(domain => {
                const domainResult = results.domainResults[domain.id];
                if (!domainResult || domainResult.total === 0) return null;

                return (
                  <div key={domain.id}>
                    <div className="flex justify-between text-base mb-1">
                      <span className="text-[var(--md-sys-color-on-surface-variant)]">{domain.name}</span>
                      <span className={`font-medium ${
                        domainResult.percentage >= 70 ? 'text-[var(--md-sys-color-tertiary)]' : 'text-[var(--md-sys-color-error)]'
                      }`}>
                        {domainResult.correct}/{domainResult.total} ({domainResult.percentage}%)
                      </span>
                    </div>
                    <div className="h-2 bg-[var(--md-sys-color-surface-container-high)] rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full ${
                          domainResult.percentage >= 70 ? 'bg-[var(--md-sys-color-tertiary)]' : 'bg-[var(--md-sys-color-error)]'
                        }`}
                        style={{ width: `${domainResult.percentage}%`, transitionDuration: M3_MOTION_DURATION, transitionTimingFunction: M3_MOTION_EASING }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Actions */}
        <div className="space-y-3 pb-24">
          <button
            onClick={onReview}
            aria-label="Review answers"
            className="w-full min-h-[48px] py-2 h-10 bg-[var(--md-sys-color-primary)] text-[var(--md-sys-color-on-primary)] rounded-lg font-medium flex items-center justify-center gap-2 cursor-pointer transition-opacity duration-150 ease-out hover:opacity-90 focus-visible:ring-2 focus-visible:ring-[var(--md-sys-color-primary)] focus-visible:ring-offset-2 focus-visible:outline-none text-sm shadow-none"
          >
            <BookOpen className="w-5 h-5" />
            Review Answers
          </button>

          {wrongCount > 0 && (
            <button
              onClick={onReviewWrong}
              aria-label={`Review ${wrongCount} wrong answers`}
              className="w-full min-h-[48px] py-2 h-10 bg-[var(--md-sys-color-error-container)] text-[var(--md-sys-color-on-error-container)] rounded-lg font-medium flex items-center justify-center gap-2 cursor-pointer transition-opacity duration-150 ease-out hover:opacity-90 focus-visible:ring-2 focus-visible:ring-[var(--md-sys-color-error)] focus-visible:ring-offset-2 focus-visible:outline-none text-sm shadow-none"
            >
              <RotateCw className="w-5 h-5" />
              Review {wrongCount} Wrong Answer{wrongCount !== 1 ? 's' : ''}
            </button>
          )}

          <button
            onClick={onRetry}
            aria-label="Try exam again"
            className="w-full min-h-[48px] py-2.5 h-10 bg-[var(--md-sys-color-surface-container)] rounded-lg font-medium flex items-center justify-center gap-2 cursor-pointer transition-colors duration-150 ease-out hover:bg-[var(--md-sys-color-surface-container-high)] focus-visible:ring-2 focus-visible:ring-[var(--md-sys-color-primary)] focus-visible:ring-offset-2 focus-visible:outline-none text-sm shadow-none text-[var(--md-sys-color-on-surface-variant)]"
          >
            <RotateCw className="w-5 h-5" />
            Try Again
          </button>

          <button
            onClick={onBack}
            aria-label="Back to certification"
            className="w-full min-h-[48px] py-2.5 h-10 text-[var(--md-sys-color-on-surface-variant)] hover:text-[var(--md-sys-color-on-surface)] transition-colors duration-150 ease-out cursor-pointer focus-visible:ring-2 focus-visible:ring-[var(--md-sys-color-primary)] focus-visible:ring-offset-2 focus-visible:outline-none text-sm"
          >
            Back to Certification
          </button>
        </div>
      </div>
    </div>
  );
}
