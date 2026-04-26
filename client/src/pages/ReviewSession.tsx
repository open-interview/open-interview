/**
 * SRS Review - Spaced Repetition
 * Swipe cards, earn XP, level up your memory
 */

import { useState, useEffect } from 'react';
import { useLocation } from 'wouter';
import { motion, AnimatePresence } from 'framer-motion';
import { AppLayout } from '../components/layout/AppLayout';
import { PageHeader, PageLoader } from '@/components/ui/page';
import { SEOHead } from '../components/SEOHead';
import { useCredits } from '../context/CreditsContext';
import { EnhancedMermaid } from '../components/EnhancedMermaid';
import { ListenButton } from '../components/ListenButton';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { vscDarkPlus } from 'react-syntax-highlighter/dist/esm/styles/prism';
import {
  Brain, ChevronLeft, ChevronRight, Eye, Flame, Sparkles, Zap, Check, CheckCircle, RotateCcw, Trash2
} from 'lucide-react';
import { getDueCards, getDueCardsByChannel, getChannelsWithDueCards, recordReview, removeFromSRS, type ReviewCard } from '../lib/spaced-repetition';
import { getQuestionByIdAsync } from '../lib/questions-loader';
import { useUserPreferences } from '../hooks/use-user-preferences';
import { isPersonalized } from '../lib/personalization';

// Fallback data if no SRS cards available
const FALLBACK_CARDS = [
  {
    id: 'q-1',
    question: 'How would you find all processes running on port 8080 and terminate them safely?',
    answer: 'Use `lsof -ti:8080 | xargs kill -9` or `netstat -tulpn | grep 8080` to find PIDs, then `kill -15 <PID>` for graceful shutdown.',
    tldr: 'Use lsof or netstat to find PIDs, then kill -15 for graceful termination',
    codeInterpretation: `\`\`\`bash
lsof -ti:8080 | xargs kill -15
\`\`\`

**Line-by-line breakdown:**

1. \`lsof -ti:8080\`
   - \`lsof\` = List Open Files command
   - \`-t\` = Output PIDs only (terse mode)
   - \`-i:8080\` = Filter by internet connections on port 8080
   - Returns: Space-separated list of process IDs

2. \`|\` = Pipe operator
   - Takes output from left command
   - Passes it as input to right command

3. \`xargs kill -15\`
   - \`xargs\` = Converts input into arguments
   - \`kill -15\` = Send SIGTERM signal (graceful shutdown)
   - Each PID becomes: \`kill -15 <PID>\`

**Example execution:**
\`\`\`bash
# If PIDs are 1234 and 5678
lsof -ti:8080        # Returns: 1234 5678
xargs kill -15       # Executes: kill -15 1234 5678
\`\`\``,
    explanation: `**Finding Processes:**
- \`lsof -ti:8080\` - Lists PIDs using port 8080
- \`netstat -tulpn | grep 8080\` - Alternative method

**Terminating Safely:**
- \`kill -15 <PID>\` - SIGTERM (graceful shutdown)
- \`kill -9 <PID>\` - SIGKILL (force kill, last resort)

**Best Practice:** Always try SIGTERM first to allow cleanup.`,
    diagram: `graph LR
    A[Port 8080] --> B[lsof -ti:8080]
    B --> C[Get PIDs]
    C --> D[kill -15 PID]
    D --> E{Process Stopped?}
    E -->|Yes| F[Done]
    E -->|No| G[kill -9 PID]`,
    difficulty: 'intermediate',
    channel: 'linux',
    dueDate: new Date(),
    interval: 1,
    easeFactor: 2.5
  },
  {
    id: 'q-2',
    question: 'What is the difference between TCP and UDP?',
    answer: 'TCP is connection-oriented, reliable, ordered delivery. UDP is connectionless, faster, no guaranteed delivery. TCP for accuracy, UDP for speed.',
    tldr: 'TCP = reliable & ordered, UDP = fast & connectionless',
    codeInterpretation: `\`\`\`python
# TCP Socket Example
import socket

# Create TCP socket
tcp_socket = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
tcp_socket.connect(('server.com', 80))
tcp_socket.send(b'GET / HTTP/1.1')
\`\`\`

**Line-by-line breakdown:**

1. \`socket.socket(socket.AF_INET, socket.SOCK_STREAM)\`
   - \`AF_INET\` = IPv4 address family
   - \`SOCK_STREAM\` = TCP protocol (stream-based)
   - Creates a TCP socket object

2. \`tcp_socket.connect(('server.com', 80))\`
   - Initiates 3-way handshake
   - Establishes connection before data transfer
   - Blocks until connection established

3. \`tcp_socket.send(b'GET / HTTP/1.1')\`
   - Sends data reliably
   - Guarantees delivery and order
   - Waits for acknowledgment

**UDP Alternative:**
\`\`\`python
# UDP Socket - No connection needed
udp_socket = socket.socket(socket.AF_INET, socket.SOCK_DGRAM)
udp_socket.sendto(b'data', ('server.com', 53))  # Fire and forget
\`\`\``,
    explanation: `**TCP (Transmission Control Protocol):**
- Connection-oriented (3-way handshake)
- Guaranteed delivery with acknowledgments
- Ordered packet delivery
- Flow control and congestion control
- Use cases: HTTP, FTP, Email

**UDP (User Datagram Protocol):**
- Connectionless (no handshake)
- No delivery guarantees
- No ordering
- Lower overhead, faster
- Use cases: DNS, Video streaming, Gaming`,
    difficulty: 'beginner',
    channel: 'networking',
    dueDate: new Date(),
    interval: 1,
    easeFactor: 2.5
  },
  {
    id: 'q-3',
    question: 'Explain the CAP theorem',
    answer: 'CAP theorem states distributed systems can only guarantee 2 of 3: Consistency, Availability, Partition tolerance. Must choose based on requirements.',
    tldr: 'Pick 2 of 3: Consistency, Availability, Partition tolerance',
    codeInterpretation: `\`\`\`javascript
// CP System Example (MongoDB)
const result = await db.collection.findOneAndUpdate(
  { _id: userId },
  { $inc: { balance: -100 } },
  { writeConcern: { w: 'majority' } }  // Wait for majority acknowledgment
);
\`\`\`

**Line-by-line breakdown:**

1. \`findOneAndUpdate({ _id: userId }, ...)\`
   - Atomic operation on single document
   - Finds document by ID and updates it

2. \`{ $inc: { balance: -100 } }\`
   - \`$inc\` = Increment operator
   - Decrements balance by 100
   - Atomic operation ensures consistency

3. \`{ writeConcern: { w: 'majority' } }\`
   - \`w: 'majority'\` = Wait for majority of nodes
   - Ensures **Consistency** across replicas
   - Sacrifices **Availability** during network partition
   - This is a **CP choice** (Consistency + Partition tolerance)

**AP System Alternative (Cassandra):**
\`\`\`javascript
// AP System - Always available, eventual consistency
await client.execute(
  'UPDATE users SET balance = balance - 100 WHERE id = ?',
  [userId],
  { consistency: cassandra.types.consistencies.one }  // Any node responds
);
\`\`\``,
    explanation: `**The Three Guarantees:**

1. **Consistency (C):** All nodes see the same data at the same time
2. **Availability (A):** Every request receives a response
3. **Partition Tolerance (P):** System continues despite network failures

**Trade-offs:**
- **CP Systems:** Consistent + Partition tolerant (MongoDB, HBase)
- **AP Systems:** Available + Partition tolerant (Cassandra, DynamoDB)
- **CA Systems:** Consistent + Available (Traditional RDBMS, but not truly distributed)

In practice, partition tolerance is mandatory for distributed systems, so you choose between CP or AP.`,
    diagram: `graph TD
    CAP[CAP Theorem] --> C[Consistency]
    CAP --> A[Availability]
    CAP --> P[Partition Tolerance]
    C --> CP[CP: MongoDB]
    A --> AP[AP: Cassandra]
    P --> CP
    P --> AP`,
    difficulty: 'advanced',
    channel: 'system-design',
    dueDate: new Date(),
    interval: 1,
    easeFactor: 2.5
  }
];

const confidenceLevels = [
  { id: 'again', label: 'Again', cls: 'bg-red-500/20 border-red-500/30 text-red-400 hover:bg-red-500/30', icon: <RotateCcw className="w-3 h-3" />, interval: 1 },
  { id: 'hard',  label: 'Hard',  cls: 'bg-orange-500/20 border-orange-500/30 text-orange-400 hover:bg-orange-500/30', icon: <Brain className="w-3 h-3" />, interval: 2 },
  { id: 'good',  label: 'Good',  cls: 'bg-emerald-500/20 border-emerald-500/30 text-emerald-400 hover:bg-emerald-500/30', icon: <Check className="w-3 h-3" />, interval: 4 },
  { id: 'easy',  label: 'Easy',  cls: 'bg-blue-500/20 border-blue-500/30 text-blue-400 hover:bg-blue-500/30', icon: <Zap className="w-3 h-3" />, interval: 7 }
];

// Diagram section with error handling
function DiagramSection({ diagram }: { diagram: string }) {
  const [renderSuccess, setRenderSuccess] = useState<boolean | null>(null);
  
  if (renderSuccess === false) return null;
  
  return (
    <div className="p-6 bg-muted/50 backdrop-blur-xl rounded-xl border border-border">
      <div className="flex items-center gap-2 mb-4">
        <div className="p-2 bg-purple-500/20 rounded-lg">
          <Eye className="w-5 h-5 text-purple-400" />
        </div>
        <span className="text-sm font-bold text-purple-400 uppercase tracking-wider">Diagram</span>
      </div>
      <div className="bg-background/30 rounded-xl p-4 overflow-x-auto">
        <EnhancedMermaid 
          chart={diagram} 
          onRenderResult={(success) => setRenderSuccess(success)}
        />
      </div>
    </div>
  );
}

// Markdown preprocessing
function preprocessMarkdown(text: string): string {
  if (!text) return '';
  let processed = text;
  processed = processed.replace(/([^\n])(```)/g, '$1\n$2');
  processed = processed.replace(/(```\w*)\s*\n?\s*([^\n`])/g, '$1\n$2');
  processed = processed.replace(/^\*\*\s*$/gm, '');
  processed = processed.replace(/\*\*\s*\n\s*([^*]+)\*\*/g, '**$1**');
  processed = processed.replace(/^[•·]\s*/gm, '- ');
  processed = processed.replace(/\n{3,}/g, '\n\n');
  return processed.trim();
}

export default function ReviewSession() {
  const [, setLocation] = useLocation();
  const { onSRSReview } = useCredits();
  const { preferences } = useUserPreferences();
  const { onboardingComplete, subscribedChannels } = preferences;

  const [focusMyTopics, setFocusMyTopics] = useState<boolean>(() => {
    const saved = localStorage.getItem('review_focus_my_topics');
    if (saved !== null) return saved === 'true';
    return isPersonalized(onboardingComplete, subscribedChannels);
  });

  useEffect(() => {
    localStorage.setItem('review_focus_my_topics', String(focusMyTopics));
  }, [focusMyTopics]);

  const [allCards, setAllCards] = useState<any[]>([]);
  const [loadingCards, setLoadingCards] = useState(true);
  const [channelList, setChannelList] = useState<{ channel: string; count: number }[]>([]);
  const [selectedChannel, setSelectedChannel] = useState<string | null>(null);

  // Get channel colors
  const getChannelColor = (channel: string) => {
    const colors: Record<string, string> = {
      algorithms: 'from-blue-500/20 to-cyan-500/20 border-blue-500/30 text-blue-400',
      system-design: 'from-purple-500/20 to-pink-500/20 border-purple-500/30 text-purple-400',
      networking: 'from-green-500/20 to-emerald-500/20 border-green-500/30 text-green-400',
      kubernetes: 'from-indigo-500/20 to-blue-500/20 border-indigo-500/30 text-indigo-400',
      aws: 'from-orange-500/20 to-amber-500/20 border-orange-500/30 text-orange-400',
      gcp: 'from-red-500/20 to-rose-500/20 border-red-500/30 text-red-400',
      azure: 'from-cyan-500/20 to-blue-500/20 border-cyan-500/30 text-cyan-400',
      database: 'from-yellow-500/20 to-orange-500/20 border-yellow-500/30 text-yellow-400',
      linux: 'from-gray-500/20 to-slate-500/20 border-gray-500/30 text-gray-400',
      security: 'from-red-500/20 to-pink-500/20 border-red-500/30 text-red-400',
      devops: 'from-teal-500/20 to-cyan-500/20 border-teal-500/30 text-teal-400',
      behavioral: 'from-pink-500/20 to-rose-500/20 border-pink-500/30 text-pink-400',
      default: 'from-slate-500/20 to-zinc-500/20 border-slate-500/30 text-slate-400',
    };
    return colors[channel] || colors.default;
  };

  useEffect(() => {
    const channels = getChannelsWithDueCards();
    setChannelList(channels);
    
    const dueCards = getDueCards();
    if (dueCards.length === 0) { setLoadingCards(false); return; }
    Promise.all(
      dueCards.map(async card => {
        const question = await getQuestionByIdAsync(card.questionId);
        return question ? {
          id: card.questionId,
          question: question.question,
          answer: question.answer,
          explanation: question.explanation,
          diagram: question.diagram,
          difficulty: card.difficulty,
          channel: card.channel,
          tldr: undefined,
          codeInterpretation: undefined,
        } : null;
      })
    ).then(results => {
      setAllCards(results.filter(Boolean));
      setLoadingCards(false);
    });
  }, []);

  // Filter cards by selected channel
  const filteredCards = selectedChannel 
    ? allCards.filter(c => c.channel === selectedChannel)
    : allCards;
  
  // Further filter by subscribed channels if focusMyTopics is enabled
  const cards = (focusMyTopics && subscribedChannels.length > 0)
    ? filteredCards.filter(c => subscribedChannels.includes(c.channel))
    : filteredCards;
  const [currentIndex, setCurrentIndex] = useState(0);
  const [showAnswer, setShowAnswer] = useState(false);
  const [reviewedCount, setReviewedCount] = useState(0);
  const [streak, setStreak] = useState(0);

  const currentCard = cards[currentIndex];
  const progress = cards.length > 0 ? ((reviewedCount / cards.length) * 100).toFixed(0) : '0';

  const handleChannelSelect = (channel: string | null) => {
    setSelectedChannel(channel);
    setCurrentIndex(0);
    setShowAnswer(false);
    setReviewedCount(0);
  };

  const handleConfidence = (level: string) => {
    // Award credits based on confidence using the unified system
    const rating = level as 'again' | 'hard' | 'good' | 'easy';
    onSRSReview(rating);

    // Record the review in SRS system
    if (currentCard?.id && currentCard?.channel && currentCard?.difficulty) {
      recordReview(currentCard.id, currentCard.channel, currentCard.difficulty, rating);
    }

    setReviewedCount(prev => prev + 1);
    setStreak(prev => level === 'easy' || level === 'good' ? prev + 1 : 0);
    setShowAnswer(false);

    // Move to next card
    if (currentIndex < cards.length - 1) {
      setCurrentIndex(prev => prev + 1);
    } else {
      // Session complete - check if there are more channels
      if (selectedChannel) {
        // Remove this channel from the list and select next
        const remainingChannels = channelList.filter(c => c.channel !== selectedChannel);
        if (remainingChannels.length > 0) {
          handleChannelSelect(remainingChannels[0].channel);
        } else {
          setLocation('/profile');
        }
      } else {
        setLocation('/profile');
      }
    }
  };

  const handleRevealAnswer = () => {
    setShowAnswer(true);
  };

  const handleSkip = () => {
    if (currentIndex < cards.length - 1) {
      setCurrentIndex(prev => prev + 1);
      setShowAnswer(false);
    }
  };

  const handleDelete = () => {
    if (!currentCard?.id) return;
    removeFromSRS(currentCard.id);
    const updated = allCards.filter(c => c?.id !== currentCard.id);
    setAllCards(updated);
    setShowAnswer(false);
    setCurrentIndex(i => Math.min(i, updated.length - 1));
  };

  if (loadingCards) {
    return (
      <AppLayout fullWidth>
        <div className="min-h-screen bg-background text-foreground">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8 sm:py-12">
            <PageHeader title="SRS Review" subtitle="Spaced repetition to lock in what you've learned" />
            <PageLoader message="Loading review cards..." />
          </div>
        </div>
      </AppLayout>
    );
  }

  if (cards.length === 0) {
    return (
      <AppLayout fullWidth>
        <div className="min-h-screen bg-background text-foreground">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8 sm:py-12">
            <PageHeader title="SRS Review" subtitle="Spaced repetition to lock in what you've learned" />
            <div className="flex items-center justify-center py-20">
              <div className="text-center space-y-4 px-6">
                <Brain className="w-16 h-16 text-muted-foreground/30 mx-auto" />
                <h2 className="text-2xl font-bold">No cards due</h2>
                <p className="text-muted-foreground text-sm max-w-xs mx-auto">Add questions to your SRS deck by tapping "Add to SRS" while reviewing questions.</p>
                <button onClick={() => setLocation('/channels')} className="px-6 py-3 bg-primary text-primary-foreground rounded-2xl font-bold text-sm">Browse Questions</button>
              </div>
            </div>
          </div>
        </div>
      </AppLayout>
    );
  }

  if (!currentCard) {
    return (
      <AppLayout fullWidth>
        <div className="min-h-screen bg-background text-foreground flex items-center justify-center">
          <div className="text-center">
            <CheckCircle className="w-16 h-16 text-primary mx-auto mb-4" />
            <h2 className="text-3xl font-bold mb-2">Review Complete!</h2>
            <p className="text-muted-foreground mb-6">You've reviewed all cards for today</p>
            <button
              onClick={() => setLocation('/')}
              className="min-h-[44px] cursor-pointer px-8 py-4 bg-gradient-to-r from-primary to-cyan-500 rounded-[16px] font-bold text-black"
            >
              Back to Home
            </button>
          </div>
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
        {/* iPhone 13 FIX: Ensure content fits within viewport with safe areas */}
        <div className="min-h-screen bg-background text-foreground overflow-x-hidden w-full pb-24 lg:pb-0">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8 sm:py-12 w-full overflow-x-hidden">
            {/* Page Header */}
            <PageHeader title="SRS Review" subtitle="Spaced repetition to lock in what you've learned" />

            {/* Focus toggle */}
            {isPersonalized(onboardingComplete, subscribedChannels) && (
              <div className="flex items-center gap-3 mb-6">
                <button
                  onClick={() => setFocusMyTopics(v => !v)}
                  className={`relative inline-flex h-6 w-11 items-center rounded-full cursor-pointer transition duration-150 ease-out ${focusMyTopics ? 'bg-primary' : 'bg-muted'}`}
                >
                  <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${focusMyTopics ? 'translate-x-6' : 'translate-x-1'}`} />
                </button>
                <span className="text-sm font-medium">Focus on my topics</span>
              </div>
            )}

            {/* Session Controls */}
            <div className="flex items-center justify-between mb-8">
              <button
                onClick={() => setLocation('/')}
                className="flex items-center gap-2 min-h-[44px] cursor-pointer text-muted-foreground hover:text-foreground transition duration-150 ease-out"
              >
                <ChevronLeft className="w-5 h-5" />
                <span>Back</span>
              </button>

              <div className="flex items-center gap-6">
                <div className="flex items-center gap-2">
                  <Flame className="w-5 h-5 text-orange-500" />
                  <span className="font-bold">{streak}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Brain className="w-5 h-5 text-primary" />
                  <span className="font-bold">{reviewedCount}/{cards.length}</span>
                </div>
              </div>
            </div>

            {/* Progress Bar */}
            <div className="mb-8">
              <div className="flex items-center justify-between text-sm mb-2">
                <span className="text-muted-foreground">Progress</span>
                <span className="font-bold">{progress}%</span>
              </div>
              <div className="h-3 bg-muted rounded-full overflow-hidden">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${progress}%` }}
                  className="h-full bg-gradient-to-r from-primary to-cyan-500"
                />
              </div>
            </div>

            {/* Card */}
            <AnimatePresence mode="wait">
              <motion.div
                key={currentCard.id}
                initial={{ opacity: 0, scale: 0.9, rotateY: -10 }}
                animate={{ opacity: 1, scale: 1, rotateY: 0 }}
                exit={{ opacity: 0, scale: 0.9, rotateY: 10 }}
                transition={{ duration: 0.3 }}
                className="relative w-full overflow-hidden"
              >
                {/* Question Card */}
                <div className="p-8 rounded-[28px] border min-h-[400px] flex flex-col w-full overflow-hidden"
                  style={{
                    background: 'color-mix(in srgb, var(--color-surface-2, #1e293b) 60%, transparent)',
                    borderColor: 'var(--color-border-subtle, rgba(148,163,184,0.15))',
                    boxShadow: '8px 8px 24px rgba(0,0,0,0.3), -4px -4px 16px rgba(255,255,255,0.03), inset 0 1px 0 rgba(255,255,255,0.05)'
                  }}>
                  {/* Tags */}
                  <div className="flex items-center justify-between gap-2 mb-6">
                    <div className="flex items-center gap-2">
                      <span className="px-3 py-1 bg-[#00ff88]/20 text-primary rounded-full text-xs font-bold uppercase">
                        {currentCard.channel}
                      </span>
                      <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase ${
                        currentCard.difficulty === 'beginner' ? 'bg-green-500/20 text-green-500' :
                        currentCard.difficulty === 'intermediate' ? 'bg-yellow-500/20 text-yellow-500' :
                        'bg-red-500/20 text-red-500'
                      }`}>
                        {currentCard.difficulty}
                      </span>
                    </div>
                    <button
                      onClick={handleDelete}
                      title="Remove from SRS"
                      className="min-h-[44px] min-w-[44px] flex items-center justify-center cursor-pointer rounded-lg text-muted-foreground hover:text-red-400 hover:bg-red-500/10 transition duration-150 ease-out"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>

                  {/* Question */}
                  <div className="flex-1 flex items-center justify-center">
                    <h2 className="text-lg font-semibold text-center leading-relaxed">
                      {currentCard.question}
                    </h2>
                  </div>

                  {/* Answer (Hidden/Shown) */}
                  <AnimatePresence>
                    {showAnswer && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        className="mt-6 space-y-4"
                      >
                        {/* TLDR */}
                        {currentCard.tldr && (
                          <motion.div
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.1 }}
                            className="p-4 bg-gradient-to-br from-cyan-500/10 to-blue-500/10 border border-cyan-500/30 rounded-[20px] backdrop-blur-sm"
                          >
                            <div className="flex items-center gap-2 mb-2">
                              <Zap className="w-4 h-4 text-cyan-400" />
                              <span className="text-xs font-bold text-cyan-400 uppercase">TL;DR</span>
                            </div>
                            <p className="text-sm text-foreground">{currentCard.tldr}</p>
                          </motion.div>
                        )}

                        {/* Answer */}
                        <motion.div
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: 0.15 }}
                          className="p-6 bg-muted/50 backdrop-blur-xl rounded-xl border border-border"
                        >
                          <div className="flex items-center justify-between mb-3">
                            <div className="flex items-center gap-2">
                              <Sparkles className="w-5 h-5 text-primary" />
                              <span className="font-bold text-primary">Answer</span>
                            </div>
                            <ListenButton 
                              text={`${currentCard.answer}${currentCard.explanation ? '. ' + currentCard.explanation : ''}`}
                              label="Listen"
                              size="sm"
                            />
                          </div>
                          <p className="text-lg text-foreground leading-relaxed">
                            {currentCard.answer}
                          </p>
                        </motion.div>

                        {/* Code Interpretation */}
                        {currentCard.codeInterpretation && (
                          <motion.div
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.18 }}
                            className="p-6 bg-gradient-to-br from-pink-500/10 to-purple-500/10 border border-pink-500/30 rounded-xl backdrop-blur-sm"
                          >
                            <div className="flex items-center gap-2 mb-4">
                              <Check className="w-5 h-5 text-pink-400" />
                              <span className="font-bold text-pink-400 uppercase text-sm">Code Interpretation</span>
                            </div>
                            <div className="prose prose-invert max-w-none">
                              <ReactMarkdown
                                remarkPlugins={[remarkGfm]}
                                components={{
                                  code({ className, children }) {
                                    const match = /language-(\w+)/.exec(className || '');
                                    const isInline = !match && !String(children).includes('\n');
                                    
                                    if (isInline) {
                                      return (
                                        <code className="px-2 py-1 bg-cyan-500/20 text-cyan-300 rounded text-sm font-mono">
                                          {children}
                                        </code>
                                      );
                                    }
                                    
                                    return (
                                      <div className="my-4 rounded-xl overflow-hidden">
                                        <SyntaxHighlighter
                                          language={match ? match[1] : 'text'}
                                          style={vscDarkPlus}
                                          customStyle={{ 
                                            margin: 0, 
                                            padding: '1.5rem',
                                            background: 'var(--surface-code, #0a0a0a)',
                                            fontSize: '0.9rem',
                                          }}
                                        >
                                          {String(children).replace(/\n$/, '')}
                                        </SyntaxHighlighter>
                                      </div>
                                    );
                                  },
                                  p({ children }) {
                                    return <p className="mb-3 text-[#e0e0e0] leading-relaxed">{children}</p>;
                                  },
                                  h1({ children }) {
                                    return <h1 className="text-xl font-bold mb-3 mt-4 text-foreground">{children}</h1>;
                                  },
                                  h2({ children }) {
                                    return <h2 className="text-lg font-bold mb-2 mt-4 text-foreground">{children}</h2>;
                                  },
                                  strong({ children }) {
                                    return <strong className="font-bold text-foreground">{children}</strong>;
                                  },
                                  ul({ children }) {
                                    return <ul className="space-y-2 mb-3">{children}</ul>;
                                  },
                                  ol({ children }) {
                                    return <ol className="space-y-2 mb-3 list-decimal list-inside">{children}</ol>;
                                  },
                                  li({ children }) {
                                    return (
                                      <li className="flex gap-2 text-[#e0e0e0]">
                                        <span className="text-pink-400 mt-1">•</span>
                                        <span className="flex-1">{children}</span>
                                      </li>
                                    );
                                  },
                                }}
                              >
                                {preprocessMarkdown(currentCard.codeInterpretation)}
                              </ReactMarkdown>
                            </div>
                          </motion.div>
                        )}

                        {/* Diagram */}
                        {currentCard.diagram && (
                          <motion.div
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.2 }}
                          >
                            <DiagramSection diagram={currentCard.diagram} />
                          </motion.div>
                        )}

                        {/* Explanation */}
                        {currentCard.explanation && (
                          <motion.div
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.25 }}
                            className="p-6 bg-muted/50 backdrop-blur-xl rounded-xl border border-border"
                          >
                            <div className="flex items-center gap-2 mb-4">
                              <Brain className="w-5 h-5 text-orange-400" />
                              <span className="font-bold text-orange-400 uppercase text-sm">Explanation</span>
                            </div>
                            <div className="prose prose-invert max-w-none">
                              <ReactMarkdown
                                remarkPlugins={[remarkGfm]}
                                components={{
                                  code({ className, children }) {
                                    const match = /language-(\w+)/.exec(className || '');
                                    const isInline = !match && !String(children).includes('\n');
                                    
                                    if (isInline) {
                                      return (
                                        <code className="px-2 py-1 bg-cyan-500/20 text-cyan-300 rounded text-sm font-mono">
                                          {children}
                                        </code>
                                      );
                                    }
                                    
                                    return (
                                      <div className="my-4 rounded-xl overflow-hidden">
                                        <SyntaxHighlighter
                                          language={match ? match[1] : 'text'}
                                          style={vscDarkPlus}
                                          customStyle={{ 
                                            margin: 0, 
                                            padding: '1.5rem',
                                            background: 'var(--surface-code, #0a0a0a)',
                                            fontSize: '0.9rem',
                                          }}
                                        >
                                          {String(children).replace(/\n$/, '')}
                                        </SyntaxHighlighter>
                                      </div>
                                    );
                                  },
                                  p({ children }) {
                                    return <p className="mb-3 text-[#e0e0e0] leading-relaxed">{children}</p>;
                                  },
                                  h1({ children }) {
                                    return <h1 className="text-xl font-bold mb-3 mt-4 text-foreground">{children}</h1>;
                                  },
                                  h2({ children }) {
                                    return <h2 className="text-lg font-bold mb-2 mt-4 text-foreground">{children}</h2>;
                                  },
                                  strong({ children }) {
                                    return <strong className="font-bold text-foreground">{children}</strong>;
                                  },
                                  ul({ children }) {
                                    return <ul className="space-y-2 mb-3">{children}</ul>;
                                  },
                                  li({ children }) {
                                    return (
                                      <li className="flex gap-2 text-[#e0e0e0]">
                                        <span className="text-primary mt-1">•</span>
                                        <span className="flex-1">{children}</span>
                                      </li>
                                    );
                                  },
                                }}
                              >
                                {preprocessMarkdown(currentCard.explanation)}
                              </ReactMarkdown>
                            </div>
                          </motion.div>
                        )}
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>

                {/* Actions */}
                <div className="mt-6">
                  {!showAnswer ? (
                    // Reveal Answer Button
                    <motion.button
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={handleRevealAnswer}
                      className="w-full min-h-[44px] py-6 cursor-pointer bg-gradient-to-r from-primary to-cyan-500 rounded-[20px] font-bold text-xl text-black flex items-center justify-center gap-3"
                    >
                      <Eye className="w-6 h-6" />
                      Tap to reveal answer
                    </motion.button>
                  ) : (
                    // Confidence Buttons
                    <div className="space-y-3">
                      <div className="text-center text-sm text-muted-foreground mb-4">
                        How well did you know this?
                      </div>
                      <div className="flex items-center justify-center gap-2 flex-wrap">
                        {confidenceLevels.map((level) => (
                          <motion.button
                            key={level.id}
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.92 }}
                            onClick={() => handleConfidence(level.id)}
                            className={`min-h-[44px] px-3 py-2 rounded-xl text-sm font-bold cursor-pointer transition-all duration-150 flex items-center gap-1.5 ${level.cls}`}
                            style={{
                              background: level.id === 'again' ? 'linear-gradient(135deg, #f43f5e 0%, #e11d48 100%)' :
                                         level.id === 'hard' ? 'linear-gradient(135deg, #f97316 0%, #ea580c 100%)' :
                                         level.id === 'good' ? 'linear-gradient(135deg, #10b981 0%, #059669 100%)' :
                                         'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)',
                              boxShadow: '0 4px 12px rgba(0,0,0,0.25)',
                              border: 'none'
                            }}
                          >
                            {level.icon}
                            <span className="capitalize">{level.label}</span>
                            <span className="opacity-60 text-xs">+{level.interval}d</span>
                          </motion.button>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                {/* Skip Button */}
                <div className="mt-4 text-center">
                  <button
                    onClick={handleSkip}
                    className="min-h-[44px] px-4 cursor-pointer text-sm text-muted-foreground hover:text-foreground transition duration-150 ease-out"
                  >
                    Skip this card
                  </button>
                </div>

                {/* Prev / Counter / Next */}
                <div className="mt-4 flex items-center justify-center gap-4">
                  <button
                    onClick={() => { setCurrentIndex(i => i - 1); setShowAnswer(false); }}
                    disabled={currentIndex === 0}
                    className="min-h-[44px] px-3 cursor-pointer flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition duration-150 ease-out disabled:opacity-30 disabled:cursor-not-allowed"
                  >
                    <ChevronLeft className="w-4 h-4" />
                    Prev
                  </button>
                  <span className="text-sm text-muted-foreground">{currentIndex + 1} / {cards.length}</span>
                  <button
                    onClick={() => { setCurrentIndex(i => i + 1); setShowAnswer(false); }}
                    disabled={currentIndex === cards.length - 1}
                    className="min-h-[44px] px-3 cursor-pointer flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition duration-150 ease-out disabled:opacity-30 disabled:cursor-not-allowed"
                  >
                    Next
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              </motion.div>
            </AnimatePresence>


          </div>
        </div>
      </AppLayout>
    </>
  );
}
