import { useState, useEffect, useRef } from "react";
import type { ChatMessage, Question, EvaluationResult } from "@/types";
import { useChatStore } from "@/store/chatStore";
import { useUserStore } from "@/store/userStore";
import { useGamificationStore } from "@/store/gamificationStore";
import { useAIStore } from "@/store/aiStore";
import { useProgressStore } from "@/store/progressStore";
import { questionEngine } from "@/lib/questions/questionEngine";
import { createVoiceSession } from "@/lib/voice/voiceService";
import {
  conversationDAO,
  progressDAO,
  userProfileDAO,
  dailyStatsDAO,
} from "@/db/dao";
import { toast } from "sonner";

interface ChatInterfaceProps {
  sessionType?: string;
  onClose: () => void;
}

const CREDITS_HINT = 10;
const CREDITS_SKIP = 50;
const XP_CORRECT = 10;
const XP_PERFECT = 25;

export default function ChatInterface({
  sessionType: _sessionType = "daily",
  onClose,
}: ChatInterfaceProps) {
  // Get stores
  const { profile } = useUserStore();
  const gamification = useGamificationStore();
  const ai = useAIStore();
  const progress = useProgressStore();
  const chat = useChatStore();

  // Local state
  const [input, setInput] = useState("");
  const [isLoadingQuestion, setIsLoadingQuestion] = useState(true);
  const [sessionStarted, setSessionStarted] = useState(false);
  const [voiceSession, setVoiceSession] = useState<ReturnType<
    typeof createVoiceSession
  > | null>(null);
  const [isListening, setIsListening] = useState(false);
  const [showEvaluation, setShowEvaluation] = useState(false);
  const [followupCount, setFollowupCount] = useState(0);
  const [isProcessing, setIsProcessing] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const sessionStartTime = useRef<number>(Date.now());

  // Initialize AI and load first question
  useEffect(() => {
    const init = async () => {
      if (!profile) {
        toast.error("Please complete onboarding first");
        onClose();
        return;
      }

      // Initialize AI if not ready
      if (!ai.isReady && !ai.isInitializing) {
        try {
          await ai.initialize();
        } catch (error) {
          console.error("Failed to initialize AI:", error);
          toast.error("AI initialization failed. Using fallback mode.");
        }
      }

      // Load first question
      try {
        await questionEngine.initialize();
        const userProgress = await progressDAO.getByUserId(profile.id);

        const nextQuestion = await questionEngine.getNextQuestion(
          {
            ...profile,
            targetCompanies: profile.targetCompanies || [],
            experienceLevel: profile.experienceLevel || "mid",
          },
          userProgress,
          {
            experienceLevel: profile.experienceLevel,
            requireVoiceSuitable: profile.voiceEnabled,
          },
        );

        if (nextQuestion) {
          chat.startSession(nextQuestion);

          // Speak question if voice is enabled
          if (profile.voiceEnabled && voiceSession) {
            await speakMessage(nextQuestion.question);
          }
        } else {
          toast.error("No questions available");
        }
      } catch (error) {
        console.error("Failed to load question:", error);
        toast.error("Failed to load questions");
      } finally {
        setIsLoadingQuestion(false);
      }
    };

    init();
  }, [profile, ai.isReady]);

  // Initialize voice session
  useEffect(() => {
    if (profile?.voiceEnabled) {
      const session = createVoiceSession();

      session.onStateChange((state) => {
        setIsListening(state.isListening);

        // If we have a final transcript and not listening anymore, set it as input
        if (!state.isListening && state.transcript && !isProcessing) {
          setInput((prev) => {
            const newInput = prev + " " + state.transcript;
            return newInput.trim();
          });
          session.clearTranscript();
        }
      });

      setVoiceSession(session);

      return () => {
        session.dispose();
      };
    }
  }, [profile?.voiceEnabled]);

  // Scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [chat.messages]);

  // Track session time
  useEffect(() => {
    if (sessionStarted) {
      const interval = setInterval(() => {
        chat.incrementTimeSpent(1);
      }, 1000);

      return () => clearInterval(interval);
    }
  }, [sessionStarted]);

  const speakMessage = async (text: string) => {
    if (voiceSession && profile?.voiceEnabled) {
      try {
        await voiceSession.speak(text);
      } catch (error) {
        console.error("TTS error:", error);
      }
    }
  };

  const toggleVoiceInput = () => {
    if (!voiceSession) {
      toast.error("Voice input not available");
      return;
    }

    if (isListening) {
      voiceSession.stopListening();
    } else {
      voiceSession.clearTranscript();
      voiceSession.startListening();
    }
  };

  const handleSendMessage = async () => {
    if (!input.trim() || isProcessing || !profile) return;

    const userAnswer = input.trim();
    setInput("");
    setIsProcessing(true);
    setSessionStarted(true);

    // Add user message to chat
    const userMessage: ChatMessage = {
      id: crypto.randomUUID(),
      role: "user",
      content: userAnswer,
      timestamp: new Date(),
      type: "answer",
    };
    chat.addMessage(userMessage);

    try {
      const currentQuestion = chat.currentQuestion;
      if (!currentQuestion) {
        throw new Error("No question loaded");
      }

      // Evaluate answer
      let evaluation: EvaluationResult;

      if (ai.isReady) {
        try {
          evaluation = await ai.evaluateAnswer(currentQuestion, userAnswer);
        } catch (error) {
          console.error("AI evaluation failed:", error);
          // Fallback evaluation
          evaluation = createFallbackEvaluation(currentQuestion, userAnswer);
        }
      } else {
        evaluation = createFallbackEvaluation(currentQuestion, userAnswer);
      }

      // Store evaluation
      chat.setEvaluationResult(evaluation);

      // Create conversation record
      const conversation = await conversationDAO.create({
        userId: profile.id,
        questionId: currentQuestion.id,
        questionText: currentQuestion.question,
        expectedAnswer: currentQuestion.answer,
        expectedKeyPoints: extractKeyPoints(currentQuestion.answer),
        userAnswer,
        responseMode: isListening ? "voice" : "text",
        aiFollowups: [],
        score: evaluation.score,
        keyPointsCovered: evaluation.coveredKeyPoints,
        keyPointsMissing: evaluation.missingKeyPoints,
        feedback: evaluation.feedback,
        timeSpent: Math.floor((Date.now() - sessionStartTime.current) / 1000),
        hintsUsed: chat.hintsUsed,
        attemptsCount: 1,
      });

      // Update progress
      await progressDAO.updateScore(currentQuestion.id, evaluation.score);
      await progressDAO.updateSRS(currentQuestion.id, evaluation.score);

      // Update gamification
      const xpEarned = evaluation.score >= 90 ? XP_PERFECT : XP_CORRECT;
      gamification.addXP(xpEarned);
      await userProfileDAO.addXP(profile.id, xpEarned);

      // Update daily stats
      await dailyStatsDAO.incrementStats(profile.id, new Date(), {
        questionsAnswered: 1,
        questionsCorrect: evaluation.score >= 70 ? 1 : 0,
        totalScore: evaluation.score,
        xpEarned,
        timeSpent: Math.floor((Date.now() - sessionStartTime.current) / 1000),
      });

      // Add AI feedback message
      const feedbackMessage: ChatMessage = {
        id: crypto.randomUUID(),
        role: "ai",
        content: formatFeedbackMessage(evaluation),
        timestamp: new Date(),
        type: "feedback",
        metadata: {
          score: evaluation.score,
          conversationId: conversation.id,
        },
      };
      chat.addMessage(feedbackMessage);

      // Speak feedback if voice enabled
      if (profile.voiceEnabled) {
        await speakMessage(evaluation.feedback.overallComment);
      }

      setShowEvaluation(true);

      // Check if we should ask a follow-up
      if (followupCount < 2 && evaluation.followUpQuestion) {
        setFollowupCount((prev) => prev + 1);

        // Wait a bit then ask follow-up
        setTimeout(async () => {
          const followUpMessage: ChatMessage = {
            id: crypto.randomUUID(),
            role: "ai",
            content:
              evaluation.followUpQuestion ||
              "Can you elaborate on your answer?",
            timestamp: new Date(),
            type: "followup",
          };
          chat.addMessage(followUpMessage);

          if (profile.voiceEnabled) {
            await speakMessage(
              evaluation.followUpQuestion ||
                "Can you elaborate on your answer?",
            );
          }
        }, 1000);
      }

      // Refresh progress stats
      await progress.refreshStats(profile.id);
    } catch (error) {
      console.error("Failed to process answer:", error);
      toast.error("Failed to process your answer");

      // Add error message
      const errorMessage: ChatMessage = {
        id: crypto.randomUUID(),
        role: "ai",
        content:
          "Sorry, I encountered an error evaluating your answer. Please try again.",
        timestamp: new Date(),
        type: "system",
      };
      chat.addMessage(errorMessage);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleGetHint = async () => {
    if (!profile || !chat.currentQuestion) return;

    if (gamification.credits < CREDITS_HINT) {
      toast.error(`Not enough credits. You need ${CREDITS_HINT} credits.`);
      return;
    }

    try {
      gamification.addCredits(-CREDITS_HINT);
      await userProfileDAO.addCredits(profile.id, -CREDITS_HINT);
      chat.useHint();

      const hint = await ai.getHint(chat.currentQuestion);

      const hintMessage: ChatMessage = {
        id: crypto.randomUUID(),
        role: "ai",
        content: `💡 Hint: ${hint}`,
        timestamp: new Date(),
        type: "hint",
      };
      chat.addMessage(hintMessage);

      if (profile.voiceEnabled) {
        await speakMessage(`Hint: ${hint}`);
      }

      toast.success(`Hint used (-${CREDITS_HINT} credits)`);
    } catch (error) {
      console.error("Failed to get hint:", error);
      toast.error("Failed to get hint");
    }
  };

  const handleSkipQuestion = async () => {
    if (!profile) return;

    if (gamification.credits < CREDITS_SKIP) {
      toast.error(`Not enough credits. You need ${CREDITS_SKIP} credits.`);
      return;
    }

    try {
      gamification.addCredits(-CREDITS_SKIP);
      await userProfileDAO.addCredits(profile.id, -CREDITS_SKIP);

      // Load next question
      setIsLoadingQuestion(true);
      const userProgress = await progressDAO.getByUserId(profile.id);

      const nextQuestion = await questionEngine.getNextQuestion(
        {
          ...profile,
          targetCompanies: profile.targetCompanies || [],
          experienceLevel: profile.experienceLevel || "mid",
        },
        userProgress,
        {
          experienceLevel: profile.experienceLevel,
          requireVoiceSuitable: profile.voiceEnabled,
        },
      );

      if (nextQuestion) {
        chat.startSession(nextQuestion);
        setFollowupCount(0);
        setShowEvaluation(false);
        sessionStartTime.current = Date.now();

        if (profile.voiceEnabled) {
          await speakMessage(nextQuestion.question);
        }

        toast.success(`Question skipped (-${CREDITS_SKIP} credits)`);
      } else {
        toast.error("No more questions available");
      }
    } catch (error) {
      console.error("Failed to skip question:", error);
      toast.error("Failed to skip question");
    } finally {
      setIsLoadingQuestion(false);
    }
  };

  const handleNextQuestion = async () => {
    if (!profile) return;

    try {
      setIsLoadingQuestion(true);
      const userProgress = await progressDAO.getByUserId(profile.id);

      const nextQuestion = await questionEngine.getNextQuestion(
        {
          ...profile,
          targetCompanies: profile.targetCompanies || [],
          experienceLevel: profile.experienceLevel || "mid",
        },
        userProgress,
        {
          experienceLevel: profile.experienceLevel,
          requireVoiceSuitable: profile.voiceEnabled,
        },
      );

      if (nextQuestion) {
        chat.startSession(nextQuestion);
        setFollowupCount(0);
        setShowEvaluation(false);
        sessionStartTime.current = Date.now();

        if (profile.voiceEnabled) {
          await speakMessage(nextQuestion.question);
        }
      } else {
        toast.success("You've completed all available questions!");
        onClose();
      }
    } catch (error) {
      console.error("Failed to load next question:", error);
      toast.error("Failed to load next question");
    } finally {
      setIsLoadingQuestion(false);
    }
  };

  const formatFeedbackMessage = (evaluation: EvaluationResult): string => {
    const parts = [];

    parts.push(`**Score: ${evaluation.score}/100**`);
    parts.push("");

    if (evaluation.feedback.strengths.length > 0) {
      parts.push("✅ **Strengths:**");
      evaluation.feedback.strengths.forEach((s) => parts.push(`• ${s}`));
      parts.push("");
    }

    if (evaluation.feedback.improvements.length > 0) {
      parts.push("💡 **Areas for Improvement:**");
      evaluation.feedback.improvements.forEach((i) => parts.push(`• ${i}`));
      parts.push("");
    }

    parts.push(`📝 ${evaluation.feedback.overallComment}`);

    return parts.join("\n");
  };

  const extractKeyPoints = (answer: string): string[] => {
    // Simple extraction - split by periods and filter
    return answer
      .split(/[.!?]+/)
      .map((s) => s.trim())
      .filter((s) => s.length > 10)
      .slice(0, 5);
  };

  const createFallbackEvaluation = (
    question: Question,
    userAnswer: string,
  ): EvaluationResult => {
    const answerLower = userAnswer.toLowerCase();

    // Simple keyword matching
    const keywords = question.tags;
    const coveredKeywords = keywords.filter((k) =>
      answerLower.includes(k.toLowerCase()),
    );
    const score = Math.round((coveredKeywords.length / keywords.length) * 100);

    return {
      isComplete: score >= 70,
      score,
      coveredKeyPoints: coveredKeywords,
      missingKeyPoints: keywords.filter(
        (k) => !answerLower.includes(k.toLowerCase()),
      ),
      followUpQuestion:
        score < 80
          ? "Can you provide more details about your approach?"
          : undefined,
      confidence: 0.6,
      reasoning: "Based on keyword matching",
      feedback: {
        strengths: score >= 50 ? ["You covered some key concepts"] : [],
        improvements:
          score < 70 ? ["Try to include more technical details"] : [],
        overallComment:
          score >= 70
            ? "Good answer! You covered the main points."
            : "Keep practicing. Try to be more specific with technical details.",
      },
      suggestedImprovements: ["Consider adding more specific examples"],
    };
  };

  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  if (isLoadingQuestion) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-purple-950 to-black flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-primary-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-primary-200">Loading question...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-purple-950 to-black flex flex-col">
      {/* Header */}
      <div className="bg-background-secondary border-b border-primary-800 p-4">
        <div className="flex items-center justify-between max-w-4xl mx-auto">
          <div className="flex items-center space-x-4">
            <h2 className="text-xl font-semibold text-white">
              Interview Practice
            </h2>
            {sessionStarted && (
              <span className="text-sm text-primary-300">
                ⏱️ {formatTime(chat.timeSpent)}
              </span>
            )}
          </div>
          <div className="flex items-center space-x-4">
            <span className="text-sm text-primary-300">
              💰 {gamification.credits}
            </span>
            <span className="text-sm text-primary-300">
              ⭐ Level {gamification.level}
            </span>
            <button
              onClick={onClose}
              className="text-primary-300 hover:text-primary-200 transition-colors"
            >
              Close
            </button>
          </div>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        <div className="max-w-4xl mx-auto">
          {chat.messages.length === 0 && (
            <div className="text-center py-8">
              <div className="w-16 h-16 bg-primary-500 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl">🤖</span>
              </div>
              <h3 className="text-xl font-semibold text-white mb-2">
                Ready to practice!
              </h3>
              <p className="text-primary-200">
                I'll ask you interview questions and provide real-time feedback.
              </p>
            </div>
          )}

          {chat.messages.map((message) => (
            <div
              key={message.id}
              className={`flex ${
                message.role === "user" ? "justify-end" : "justify-start"
              } mb-4`}
            >
              <div
                className={`max-w-lg px-4 py-3 rounded-xl ${
                  message.role === "user"
                    ? "bg-primary-500 text-white"
                    : message.type === "feedback"
                      ? "bg-green-900/50 text-white border border-green-700"
                      : message.type === "hint"
                        ? "bg-yellow-900/50 text-white border border-yellow-700"
                        : "bg-background-secondary text-white border border-primary-700"
                }`}
              >
                <div className="whitespace-pre-wrap">{message.content}</div>
                <div className="text-xs opacity-70 mt-1">
                  {message.timestamp.toLocaleTimeString()}
                </div>
              </div>
            </div>
          ))}

          {(isProcessing || ai.isEvaluating) && (
            <div className="flex justify-start mb-4">
              <div className="bg-background-secondary text-white border border-primary-700 px-4 py-3 rounded-xl">
                <div className="flex items-center space-x-2">
                  <span className="text-primary-300">AI is thinking</span>
                  <div className="flex space-x-1">
                    <div className="w-2 h-2 bg-primary-400 rounded-full animate-bounce"></div>
                    <div
                      className="w-2 h-2 bg-primary-400 rounded-full animate-bounce"
                      style={{ animationDelay: "0.1s" }}
                    ></div>
                    <div
                      className="w-2 h-2 bg-primary-400 rounded-full animate-bounce"
                      style={{ animationDelay: "0.2s" }}
                    ></div>
                  </div>
                </div>
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>
      </div>

      {/* Evaluation Panel */}
      {showEvaluation && chat.evaluationResult && (
        <div className="border-t border-primary-800 bg-background-secondary/50 p-4">
          <div className="max-w-4xl mx-auto">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-lg font-semibold text-white">
                Evaluation Complete!
              </h3>
              <button
                onClick={handleNextQuestion}
                className="button-primary text-sm"
              >
                Next Question →
              </button>
            </div>
            <div className="grid grid-cols-3 gap-4 text-center">
              <div className="bg-background-secondary p-3 rounded-lg">
                <div className="text-2xl font-bold text-primary-500">
                  {chat.evaluationResult.score}
                </div>
                <div className="text-xs text-primary-300">Score</div>
              </div>
              <div className="bg-background-secondary p-3 rounded-lg">
                <div className="text-2xl font-bold text-green-500">
                  {chat.evaluationResult.coveredKeyPoints.length}
                </div>
                <div className="text-xs text-primary-300">Points Covered</div>
              </div>
              <div className="bg-background-secondary p-3 rounded-lg">
                <div className="text-2xl font-bold text-yellow-500">
                  {chat.evaluationResult.missingKeyPoints.length}
                </div>
                <div className="text-xs text-primary-300">Points Missing</div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Input */}
      <div className="border-t border-primary-800 bg-background-secondary p-4">
        <div className="max-w-4xl mx-auto">
          <div className="flex space-x-2">
            {profile?.voiceEnabled && (
              <button
                onClick={toggleVoiceInput}
                disabled={isProcessing}
                className={`px-4 py-3 rounded-lg transition-colors ${
                  isListening
                    ? "bg-red-500 text-white animate-pulse"
                    : "bg-background-primary border border-primary-700 text-primary-300 hover:text-white"
                }`}
                title={isListening ? "Stop listening" : "Use voice input"}
              >
                🎤
              </button>
            )}
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyPress={(e) =>
                e.key === "Enter" && !e.shiftKey && handleSendMessage()
              }
              placeholder={
                isListening
                  ? "Listening... Speak now"
                  : "Type your answer or use voice input..."
              }
              className="flex-1 px-4 py-3 bg-background-primary border border-primary-700 rounded-lg text-white placeholder-primary-400 focus:outline-none focus:border-primary-500"
              disabled={isProcessing}
            />
            <button
              onClick={handleSendMessage}
              disabled={!input.trim() || isProcessing}
              className="button-primary disabled:opacity-50 disabled:cursor-not-allowed px-6"
            >
              Send
            </button>
          </div>

          <div className="flex space-x-4 mt-3 text-sm">
            <button
              onClick={handleGetHint}
              disabled={gamification.credits < CREDITS_HINT || isProcessing}
              className="text-primary-300 hover:text-primary-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-1"
            >
              <span>💡</span>
              <span>Hint (-{CREDITS_HINT} credits)</span>
            </button>
            <button
              onClick={handleSkipQuestion}
              disabled={gamification.credits < CREDITS_SKIP || isProcessing}
              className="text-primary-300 hover:text-primary-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-1"
            >
              <span>⏭️</span>
              <span>Skip (-{CREDITS_SKIP} credits)</span>
            </button>
            {!ai.isReady && ai.isInitializing && (
              <span className="text-yellow-400">
                ⏳ AI initializing... {ai.progress?.progress.toFixed(0)}%
              </span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
