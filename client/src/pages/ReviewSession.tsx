import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { AppLayout } from "../components/layout/AppLayout";

import { SEOHead } from "../components/SEOHead";
import { useCredits } from "../context/CreditsContext";
import { useUserPreferences } from "../hooks/use-user-preferences";
import { isPersonalized } from "../lib/personalization";
import {
  getDueCards,
  getDueCardsByChannel,
  getChannelsWithDueCards,
  recordReview,
  removeFromSRS,
} from "../lib/spaced-repetition";
import { getQuestionByIdAsync, preloadQuestions } from "../lib/questions-loader";
import { SRSChrome } from "../components/srs/SRSChrome";
import { QuestionCard } from "../components/srs/QuestionCard";
import { RatingBar } from "../components/srs/RatingBar";
import { SessionComplete } from "../components/srs/SessionComplete";
import { EmptyDeck } from "../components/srs/EmptyDeck";
import { Eye } from "lucide-react";
import { motion } from "framer-motion";

const FALLBACK_CARDS = [
  {
    id: "q-1",
    question: "How would you find all processes running on port 8080 and terminate them safely?",
    answer: "Use `lsof -ti:8080 | xargs kill -9` or `netstat -tulpn | grep 8080` to find PIDs, then `kill -15 <PID>` for graceful shutdown.",
    tldr: "Use lsof or netstat to find PIDs, then kill -15 for graceful termination",
    codeInterpretation: "",
    explanation:
      "**Finding Processes:**\n- `lsof -ti:8080` - Lists PIDs using port 8080\n- `netstat -tulpn | grep 8080` - Alternative method\n\n**Terminating Safely:**\n- `kill -15 <PID>` - SIGTERM (graceful shutdown)\n- `kill -9 <PID>` - SIGKILL (force kill, last resort)\n\n**Best Practice:** Always try SIGTERM first to allow cleanup.",
    diagram: "graph LR\n    A[Port 8080] --> B[lsof -ti:8080]\n    B --> C[Get PIDs]\n    C --> D[kill -15 PID]\n    D --> E{Process Stopped?}\n    E -->|Yes| F[Done]\n    E -->|No| G[kill -9 PID]",
    difficulty: "intermediate",
    channel: "linux",
    dueDate: new Date(),
    interval: 1,
    easeFactor: 2.5,
  },
  {
    id: "q-2",
    question: "What is the difference between TCP and UDP?",
    answer: "TCP is connection-oriented, reliable, ordered delivery. UDP is connectionless, faster, no guaranteed delivery.",
    tldr: "TCP = reliable & ordered, UDP = fast & connectionless",
    codeInterpretation: "",
    explanation:
      "**TCP:**\n- Connection-oriented (3-way handshake)\n- Guaranteed delivery\n- Ordered packet delivery\n- Use cases: HTTP, FTP, Email\n\n**UDP:**\n- Connectionless (no handshake)\n- No delivery guarantees\n- Lower overhead, faster\n- Use cases: DNS, Video streaming, Gaming",
    difficulty: "beginner",
    channel: "networking",
    dueDate: new Date(),
    interval: 1,
    easeFactor: 2.5,
  },
  {
    id: "q-3",
    question: "Explain the CAP theorem",
    answer: "CAP theorem states distributed systems can only guarantee 2 of 3: Consistency, Availability, Partition tolerance.",
    tldr: "Pick 2 of 3: Consistency, Availability, Partition tolerance",
    codeInterpretation: "",
    explanation:
      "**CP Systems:** Consistent + Partition tolerant (MongoDB, HBase)\n**AP Systems:** Available + Partition tolerant (Cassandra, DynamoDB)\n\nIn practice, partition tolerance is mandatory, so you choose between CP or AP.",
    diagram: "graph TD\n    CAP[CAP Theorem] --> C[Consistency]\n    CAP --> A[Availability]\n    CAP --> P[Partition Tolerance]\n    C --> CP[CP: MongoDB]\n    A --> AP[AP: Cassandra]\n    P --> CP\n    P --> AP",
    difficulty: "advanced",
    channel: "system-design",
    dueDate: new Date(),
    interval: 1,
    easeFactor: 2.5,
  },
];

const getChannelColor = (channel: string) => {
  const colors: Record<string, string> = {
    algorithms: "from-blue-500/20 to-cyan-500/20 border-blue-500/30 text-blue-400",
    "system-design": "from-purple-500/20 to-pink-500/20 border-purple-500/30 text-purple-400",
    networking: "from-green-500/20 to-emerald-500/20 border-green-500/30 text-green-400",
    kubernetes: "from-indigo-500/20 to-blue-500/20 border-indigo-500/30 text-indigo-400",
    aws: "from-orange-500/20 to-amber-500/20 border-orange-500/30 text-orange-400",
    gcp: "from-red-500/20 to-rose-500/20 border-red-500/30 text-red-400",
    azure: "from-cyan-500/20 to-blue-500/20 border-cyan-500/30 text-cyan-400",
    database: "from-yellow-500/20 to-orange-500/20 border-yellow-500/30 text-yellow-400",
    linux: "from-gray-500/20 to-slate-500/20 border-gray-500/30 text-gray-400",
    security: "from-red-500/20 to-pink-500/20 border-red-500/30 text-red-400",
    devops: "from-teal-500/20 to-cyan-500/20 border-teal-500/30 text-teal-400",
    behavioral: "from-pink-500/20 to-rose-500/20 border-pink-500/30 text-pink-400",
    default: "from-slate-500/20 to-zinc-500/20 border-slate-500/30 text-slate-400",
  };
  return colors[channel] || colors.default;
};

export default function ReviewSession() {
  const [, setLocation] = useLocation();
  const { onSRSReview } = useCredits();
  const { preferences } = useUserPreferences();
  const { onboardingComplete, subscribedChannels } = preferences;

  const [focusMyTopics, setFocusMyTopics] = useState<boolean>(() => {
    const saved = localStorage.getItem("review_focus_my_topics");
    if (saved !== null) return saved === "true";
    return isPersonalized(onboardingComplete, subscribedChannels);
  });

  useEffect(() => {
    localStorage.setItem("review_focus_my_topics", String(focusMyTopics));
  }, [focusMyTopics]);

  const [allCards, setAllCards] = useState<any[]>([]);
  const [loadingCards, setLoadingCards] = useState(true);
  const [channelList, setChannelList] = useState<{ channel: string; count: number }[]>([]);
  const [selectedChannel, setSelectedChannel] = useState<string | null>(() => {
    return sessionStorage.getItem("review_channel");
  });
  const [currentIndex, setCurrentIndex] = useState(0);
  const [showAnswer, setShowAnswer] = useState(false);
  const [reviewedCount, setReviewedCount] = useState(0);
  const [streak, setStreak] = useState(0);

  useEffect(() => {
    if (selectedChannel) {
      sessionStorage.removeItem("review_channel");
    }
  }, [selectedChannel]);

  useEffect(() => {
    const channels = getChannelsWithDueCards();
    setChannelList(channels);

    const dueCards = getDueCards();
    if (dueCards.length === 0) {
      setLoadingCards(false);
      return;
    }
    preloadQuestions()
      .then(() =>
        Promise.all(
          dueCards.map(async (card) => {
            const question = await getQuestionByIdAsync(card.questionId);
            return question
              ? {
                  id: card.questionId,
                  question: question.question,
                  answer: question.answer,
                  explanation: question.explanation,
                  diagram: question.diagram,
                  difficulty: card.difficulty,
                  channel: card.channel,
                  tldr: undefined,
                  codeInterpretation: undefined,
                }
              : null;
          })
        )
      )
      .then((results) => {
        setAllCards(results.filter(Boolean));
        setLoadingCards(false);
      })
      .catch(() => {
        setLoadingCards(false);
      });
  }, []);

  useEffect(() => {
    if (!loadingCards) return;
    const timer = setTimeout(() => setLoadingCards(false), 5000);
    return () => clearTimeout(timer);
  }, [loadingCards]);

  const filteredCards = selectedChannel
    ? allCards.filter((c) => c.channel === selectedChannel)
    : allCards;

  const cards =
    focusMyTopics && subscribedChannels.length > 0
      ? filteredCards.filter((c) => subscribedChannels.includes(c.channel))
      : filteredCards;

  const currentCard = cards[currentIndex];
  const progressPercent = cards.length > 0 ? ((reviewedCount / cards.length) * 100).toFixed(0) : "0";

  const handleChannelSelect = (channel: string | null) => {
    setSelectedChannel(channel);
    setCurrentIndex(0);
    setShowAnswer(false);
    setReviewedCount(0);
  };

  const handleConfidence = (level: string) => {
    const rating = level as "again" | "hard" | "good" | "easy";
    onSRSReview(rating);

    if (currentCard?.id && currentCard?.channel && currentCard?.difficulty) {
      recordReview(currentCard.id, currentCard.channel, currentCard.difficulty, rating);
    }

    setReviewedCount((prev) => prev + 1);
    setStreak((prev) => (level === "easy" || level === "good" ? prev + 1 : 0));
    setShowAnswer(false);

    if (currentIndex < cards.length - 1) {
      setCurrentIndex((prev) => prev + 1);
    } else {
      if (selectedChannel) {
        const remainingChannels = channelList.filter((c) => c.channel !== selectedChannel);
        if (remainingChannels.length > 0) {
          handleChannelSelect(remainingChannels[0].channel);
        } else {
          setLocation("/profile");
        }
      } else {
        setLocation("/profile");
      }
    }
  };

  const handleSkip = () => {
    if (currentIndex < cards.length - 1) {
      setCurrentIndex((prev) => prev + 1);
      setShowAnswer(false);
    }
  };

  const handleDelete = () => {
    if (!currentCard?.id) return;
    removeFromSRS(currentCard.id);
    const updated = allCards.filter((c) => c?.id !== currentCard.id);
    setAllCards(updated);
    setShowAnswer(false);
    setCurrentIndex((i) => Math.min(i, updated.length - 1));
  };

  if (loadingCards) {
    return (
      <AppLayout fullWidth>
        <div className="min-h-screen max-w-2xl mx-auto px-4 py-8">
          <div className="flex flex-col items-center gap-6">
            <div className="h-6 w-48 bg-primary/10 rounded animate-pulse" />
            <div className="h-1.5 w-full bg-primary/10 rounded-full animate-pulse" />
            <div className="w-full rounded-2xl border border-border p-6 sm:p-8 space-y-4">
              <div className="flex items-center gap-2">
                <div className="h-5 w-5 bg-primary/10 rounded animate-pulse" />
                <div className="h-4 w-24 bg-primary/10 rounded animate-pulse" />
              </div>
              <div className="space-y-2">
                <div className="h-5 w-full bg-primary/10 rounded animate-pulse" />
                <div className="h-5 w-3/4 bg-primary/10 rounded animate-pulse" />
                <div className="h-5 w-1/2 bg-primary/10 rounded animate-pulse" />
              </div>
              <div className="h-px bg-border" />
              <div className="space-y-2">
                <div className="h-4 w-full bg-primary/10 rounded animate-pulse" />
                <div className="h-4 w-5/6 bg-primary/10 rounded animate-pulse" />
              </div>
              <div className="flex gap-2 pt-2">
                <div className="h-11 flex-1 bg-primary/10 rounded-xl animate-pulse" />
                <div className="h-11 flex-1 bg-primary/10 rounded-xl animate-pulse" />
                <div className="h-11 flex-1 bg-primary/10 rounded-xl animate-pulse" />
                <div className="h-11 flex-1 bg-primary/10 rounded-xl animate-pulse" />
              </div>
            </div>
          </div>
        </div>
      </AppLayout>
    );
  }

  if (cards.length === 0) {
    return (
      <AppLayout fullWidth>
        <div className="min-h-screen max-w-2xl mx-auto px-4 py-8">
          <EmptyDeck onBrowse={() => setLocation("/channels")} />
        </div>
      </AppLayout>
    );
  }

  if (!currentCard) {
    return (
      <AppLayout fullWidth>
        <div className="max-w-2xl mx-auto px-4 py-8">
          <SessionComplete onHome={() => setLocation("/")} />
        </div>
      </AppLayout>
    );
  }

  return (
    <>
      <SEOHead
        title="SRS Review - Spaced Repetition"
        description="Review your cards with spaced repetition"
        canonical="https://open-interview.github.io/review"
      />
      <AppLayout fullWidth>
        <div className="max-w-2xl mx-auto px-4 py-4 w-full">
          <SRSChrome
            streak={streak}
            reviewedCount={reviewedCount}
            totalCards={cards.length}
            progressPercent={progressPercent}
            channelList={channelList}
            selectedChannel={selectedChannel}
            focusMyTopics={focusMyTopics}
            showFocusToggle={isPersonalized(onboardingComplete, subscribedChannels)}
            onBack={() => setLocation("/")}
            onChannelSelect={handleChannelSelect}
            onFocusToggle={() => setFocusMyTopics((v) => !v)}
            getChannelColor={getChannelColor}
          />

          <QuestionCard
            card={currentCard}
            showAnswer={showAnswer}
            onDelete={handleDelete}
            getChannelColor={getChannelColor}
          />

          <div className="mt-6">
            {!showAnswer ? (
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => setShowAnswer(true)}
                className="w-full min-h-[44px] py-6 bg-gradient-to-r from-primary to-cyan-500 rounded-[20px] font-bold text-xl text-black flex items-center justify-center gap-3 cursor-pointer"
              >
                <Eye className="w-6 h-6" />
                Tap to reveal answer
              </motion.button>
            ) : (
              <RatingBar onRate={handleConfidence} />
            )}
          </div>

          <div className="mt-4 text-center">
            <button
              onClick={handleSkip}
              className="min-h-[44px] px-4 text-sm text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
            >
              Skip this card
            </button>
          </div>

          <div className="mt-4 flex items-center justify-center gap-4">
            <button
              onClick={() => {
                setCurrentIndex((i) => i - 1);
                setShowAnswer(false);
              }}
              disabled={currentIndex === 0}
              className="min-h-[44px] px-3 flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-colors disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer"
            >
              <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M15 18l-6-6 6-6"/></svg>
              Prev
            </button>
            <span className="text-sm text-muted-foreground">
              {currentIndex + 1} / {cards.length}
            </span>
            <button
              onClick={() => {
                setCurrentIndex((i) => i + 1);
                setShowAnswer(false);
              }}
              disabled={currentIndex === cards.length - 1}
              className="min-h-[44px] px-3 flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-colors disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer"
            >
              Next
              <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M9 18l6-6-6-6"/></svg>
            </button>
          </div>
        </div>
      </AppLayout>
    </>
  );
}
