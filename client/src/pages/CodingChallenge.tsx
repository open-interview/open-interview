import { useState, useEffect, useRef } from 'react';
import { useParams, Link } from 'wouter';
import { motion } from 'framer-motion';
import { Panel, PanelGroup, PanelResizeHandle } from 'react-resizable-panels';
import Editor from '@monaco-editor/react';
import { Play, Send, Loader2, ChevronLeft, Code2, CheckCircle2, XCircle, Clock, Terminal, BookOpen, Lightbulb } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { AppLayout } from '@/components/layout/AppLayout';
import { useIsMobile } from '@/hooks/use-mobile';
import type { Challenge, Language, RunResult } from '@/types/challenges';
import { loadChallenge } from '@/lib/challenges-loader';
import { runCode } from '@/lib/code-runner';
import { markSolved, markAttempted, addXP, awardBadge, getProgress } from '@/lib/challenge-progress';
import { calculateScore, type ScoreResult, type Verdict } from '@/lib/test-runner';
import { checkAndAwardBadges } from '@/lib/challenge-badges';
import TestResultsPanel from '@/components/TestResultsPanel';
import XPCelebration from '@/components/XPCelebration';

const GoogleColors = {
  blue: '#4285F4',
  red: '#EA4335',
  yellow: '#FBBC04',
  green: '#34A853',
};

const DIFFICULTY_STYLES: Record<string, { bg: string; text: string; border: string }> = {
  easy: { bg: `bg-[${GoogleColors.green}]/10`, text: `text-[${GoogleColors.green}]`, border: `border-[${GoogleColors.green}]/30` },
  medium: { bg: `bg-[${GoogleColors.yellow}]/10`, text: `text-[${GoogleColors.yellow}]`, border: `border-[${GoogleColors.yellow}]/30` },
  hard: { bg: `bg-[${GoogleColors.red}]/10`, text: `text-[${GoogleColors.red}]`, border: `border-[${GoogleColors.red}]/30` },
};

function buildTestCasesWithFunctionName(challenge: Challenge) {
  const match = challenge.starterCode.javascript.match(/function\s+(\w+)/);
  const functionName = match?.[1] ?? 'solution';
  const allCases = [...challenge.testCases.visible, ...challenge.testCases.hidden];
  return allCases.map(tc => ({ ...tc, functionName }));
}

function buildVisibleTestCasesWithFunctionName(challenge: Challenge) {
  const match = challenge.starterCode.javascript.match(/function\s+(\w+)/);
  const functionName = match?.[1] ?? 'solution';
  return challenge.testCases.visible.map(tc => ({ ...tc, functionName }));
}

interface CelebrationState {
  xpEarned: number;
  leveledUp: boolean;
  newLevel: number;
  badgesEarned: string[];
}

export default function CodingChallenge() {
  const { id } = useParams<{ id: string }>();
  const isMobile = useIsMobile();
  const [showEditor, setShowEditor] = useState(false);
  const [challenge, setChallenge] = useState<Challenge | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [language, setLanguage] = useState<Language>('javascript');
  const [code, setCode] = useState('');
  const [running, setRunning] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [runResult, setRunResult] = useState<RunResult | null>(null);
  const [score, setScore] = useState<ScoreResult | null>(null);
  const [isSubmitResult, setIsSubmitResult] = useState(false);
  const [celebration, setCelebration] = useState<CelebrationState | null>(null);
  const startTimeRef = useRef(Date.now());

  useEffect(() => {
    if (!id) return;
    setLoading(true);
    loadChallenge(id)
      .then(c => {
        setChallenge(c);
        setCode(c.starterCode.javascript);
        startTimeRef.current = Date.now();
      })
      .catch(e => setError(e.message))
      .finally(() => setLoading(false));
  }, [id]);

  useEffect(() => {
    if (!challenge) return;
    setCode(language === 'python' && challenge.starterCode.python
      ? challenge.starterCode.python
      : challenge.starterCode.javascript);
    setRunResult(null);
    setScore(null);
  }, [language, challenge]);

  async function handleRun() {
    if (!challenge || running) return;
    setRunning(true);
    setIsSubmitResult(false);
    markAttempted(challenge.id, language);
    const testCases = buildVisibleTestCasesWithFunctionName(challenge);
    const result = await runCode(code, testCases, language);
    setRunResult(result);
    setScore(calculateScore(challenge, result, Date.now() - startTimeRef.current));
    setRunning(false);
  }

  async function handleSubmit() {
    if (!challenge || submitting) return;
    setSubmitting(true);
    setIsSubmitResult(true);
    markAttempted(challenge.id, language);
    const testCases = buildTestCasesWithFunctionName(challenge);
    const result = await runCode(code, testCases, language);
    const timeMs = Date.now() - startTimeRef.current;
    const scoreResult = calculateScore(challenge, result, timeMs);
    setRunResult(result);
    setScore(scoreResult);

    if (result.allPassed) {
      markSolved(challenge.id, language, timeMs, scoreResult.totalXP);
      const { newLevel, leveledUp } = addXP(scoreResult.totalXP);

      const progress = getProgress();
      const prevLang = progress.challenges[challenge.id]?.language;
      const previousLanguages = prevLang ? [prevLang] : [];
      const newBadges = checkAndAwardBadges(progress, {
        challengeId: challenge.id,
        difficulty: challenge.difficulty as 'easy' | 'medium' | 'hard',
        language,
        timeMs,
        previousLanguages,
      });
      newBadges.forEach(awardBadge);

      setCelebration({
        xpEarned: scoreResult.totalXP,
        leveledUp,
        newLevel,
        badgesEarned: newBadges,
      });
    }
    setSubmitting(false);
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen bg-background">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="flex flex-col items-center gap-4"
        >
          <div className="w-12 h-12 rounded-full bg-[#4285F4]/10 flex items-center justify-center">
            <Loader2 className={`w-6 h-6 animate-spin text-[${GoogleColors.blue}]`} />
          </div>
          <p className="text-base text-foreground/70">Loading challenge...</p>
        </motion.div>
      </div>
    );
  }

  if (error || !challenge) {
    return (
      <div className="flex flex-col items-center justify-center h-screen gap-4 bg-background">
        <div className="w-16 h-16 rounded-full bg-[#EA4335]/10 flex items-center justify-center">
<XCircle className="w-8 h-8 text-[${GoogleColors.red}]" />
           </div>
           <p className={`text-[${GoogleColors.red}] font-medium`}>{error ?? 'Challenge not found'}</p>
        <Link href="/code">
          <Button className={`bg-[${GoogleColors.blue}] hover:bg-[${GoogleColors.blue}80] text-white rounded-full px-6 focus-visible:ring-2 focus-visible:ring-[${GoogleColors.blue}] focus-visible:ring-offset-2`}>Back to Challenges</Button>
        </Link>
      </div>
    );
  }

  const failingTests = runResult?.results.filter(r => !r.passed);
  const verdict = score?.verdict as Verdict | undefined;
  const diffStyle = DIFFICULTY_STYLES[challenge.difficulty];

  return (
    <AppLayout title={challenge.title} showBackOnMobile fullWidth>
      <div className="flex flex-col h-[calc(100dvh-var(--header-height,0px))] bg-background text-foreground overflow-hidden pb-safe">
        {celebration && (
          <XPCelebration
            xpEarned={celebration.xpEarned}
            leveledUp={celebration.leveledUp}
            newLevel={celebration.newLevel}
            badgesEarned={celebration.badgesEarned}
            onClose={() => setCelebration(null)}
          />
        )}

        {/* Header - Google Style */}
        <motion.header
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          className={`flex items-center gap-3 px-4 py-3 border-b border-[#3C4043] shrink-0 ${isMobile ? 'flex-wrap' : ''}`}
        >
          <Link href="/code">
            <Button variant="ghost" size="sm" className="gap-1.5 text-foreground/70 hover:text-white hover:bg-[#303134] cursor-pointer rounded-full px-4 min-h-[44px] focus-visible:ring-2 focus-visible:ring-[${GoogleColors.blue}] focus-visible:ring-offset-2">
              <ChevronLeft className="w-4 h-4" />
              <span className="hidden sm:inline">Challenges</span>
            </Button>
          </Link>
          <h1 className="font-medium text-base text-white truncate flex-1 min-w-0" style={{ fontFamily: "'Google Sans', 'Roboto', sans-serif" }}>
            {challenge.title}
          </h1>
          <Badge className={`text-xs border ${diffStyle.bg} ${diffStyle.text} ${diffStyle.border} rounded-2xl`}>
            {challenge.difficulty.charAt(0).toUpperCase() + challenge.difficulty.slice(1)}
          </Badge>
          <div className="hidden sm:flex items-center gap-1.5 text-xs text-foreground/70">
            <Clock className="w-3.5 h-3.5" />
            {challenge.estimatedMinutes} min
          </div>
          {isMobile && (
            <Button
              size="sm"
              onClick={() => setShowEditor(!showEditor)}
              className="min-h-[44px] gap-1.5 bg-[#303134] hover:bg-[#3C4043] text-white border border-[#5F6368] rounded-full"
            >
              <Code2 className="w-4 h-4" />
              {showEditor ? 'Problem' : 'Code'}
            </Button>
          )}
        </motion.header>

        {/* Mobile: Tab-based view */}
        {isMobile ? (
          <div className="flex-1 overflow-hidden">
            {showEditor ? (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="flex flex-col h-full"
              >
                {/* Editor toolbar - Google Style */}
                <div className="flex items-center gap-2 px-3 py-2 border-b border-[#3C4043] shrink-0 bg-[#202124]">
                  <select
                    value={language}
                    onChange={e => setLanguage(e.target.value as Language)}
                    className={`text-sm bg-[#303134] border border-[#5F6368] rounded-lg px-3 py-2 text-white focus:outline-none focus:border-[${GoogleColors.blue}] focus-visible:ring-2 focus-visible:ring-[${GoogleColors.blue}] focus-visible:ring-offset-2 cursor-pointer flex-1`}
                  >
                    <option value="javascript">JavaScript</option>
                    {challenge.starterCode.python && <option value="python">Python</option>}
                  </select>
                  <Button
                    size="sm"
                    onClick={handleRun}
                    disabled={running || submitting}
                    className={`gap-2 bg-[#303134] hover:bg-[#3C4043] text-white border border-[#5F6368] rounded-full min-h-[44px] cursor-pointer focus-visible:ring-2 focus-visible:ring-[${GoogleColors.blue}] focus-visible:ring-offset-2`}
                  >
                    {running ? <Loader2 className="w-4 h-4 animate-spin" /> : <Play className="w-4 h-4" />}
                    Run
                  </Button>
                  <Button
                    size="sm"
                    onClick={handleSubmit}
                    disabled={running || submitting}
                    className={`gap-2 bg-[${GoogleColors.blue}] hover:bg-[${GoogleColors.blue}80] text-white border border-[#5F6368] rounded-full min-h-[44px] cursor-pointer focus-visible:ring-2 focus-visible:ring-[${GoogleColors.blue}] focus-visible:ring-offset-2`}
                  >
                    {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                    Submit
                  </Button>
                </div>

                {/* Monaco editor */}
                <div className="flex-1 overflow-hidden">
                  <Editor
                    height="100%"
                    language={language}
                    value={code}
                    onChange={v => setCode(v ?? '')}
                    theme="vs-dark"
                    options={{
                      fontSize: 14,
                      fontFamily: 'JetBrains Mono, Fira Code, monospace',
                      minimap: { enabled: false },
                      scrollBeyondLastLine: false,
                      lineNumbers: 'on',
                      tabSize: language === 'python' ? 4 : 2,
                      wordWrap: 'on',
                      padding: { top: 8 },
                      automaticLayout: true,
                    }}
                  />
                </div>

                {/* Mobile output panel */}
                <div className="border-t border-[#3C4043] bg-[#202124]">
                  <div className="px-3 py-2 border-b border-[#3C4043] shrink-0 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Terminal className="w-4 h-4 text-foreground/70" />
                      <span className="text-base font-medium text-foreground/70">Output</span>
                    </div>
                    {runResult && (
                      <div className={`flex items-center gap-1.5 text-sm font-medium ${runResult.allPassed ? 'text-[${GoogleColors.green}]' : 'text-[${GoogleColors.red}]'}`}>
                        {runResult.allPassed ? <CheckCircle2 className="w-4 h-4" /> : <XCircle className="w-4 h-4" />}
                        {runResult.passCount}/{runResult.totalCount} passed
                      </div>
                    )}
                  </div>
                  <ScrollArea className="h-32 bg-[#202124]">
                    <TestResultsPanel
                      results={runResult?.results ?? []}
                      stdout={runResult?.stdout}
                      error={runResult?.error}
                      executionTimeMs={runResult?.executionTimeMs}
                      verdict={verdict}
                      score={score ?? undefined}
                      isRunning={running || submitting}
                    />
                  </ScrollArea>
                </div>
              </motion.div>
            ) : (
              /* Mobile: Problem description view - Google Card Style */
              <div className="flex flex-col h-full">
                <Tabs defaultValue="description" className="flex flex-col flex-1 overflow-hidden">
                  <TabsList className="mx-3 mt-2 shrink-0 w-fit bg-[#202124] p-1 rounded-full">
<TabsTrigger value="description" className="cursor-pointer min-h-[44px] text-base text-foreground/70 data-[state=active]:bg-[#303134] data-[state=active]:text-white rounded-full px-4">Description</TabsTrigger>
                     <TabsTrigger value="testcases" className="cursor-pointer min-h-[44px] text-base text-foreground/70 data-[state=active]:bg-[#303134] data-[state=active]:text-white rounded-full px-4">Test Cases</TabsTrigger>
                     <TabsTrigger value="editorial" className="cursor-pointer min-h-[44px] text-base text-foreground/70 data-[state=active]:bg-[#303134] data-[state=active]:text-white rounded-full px-4">Editorial</TabsTrigger>
                  </TabsList>

                  <TabsContent value="description" className="flex-1 overflow-hidden mt-0">
                    <ScrollArea className="h-full">
                      <motion.div
                        initial={{ opacity: 0, y: 8 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="p-4 space-y-4"
                      >
                        {/* Problem Card */}
<div className="rounded-2xl border border-[#3C4043] bg-[#202124] p-4 space-y-3 shadow-sm">
                           <p className="text-base text-foreground leading-relaxed whitespace-pre-wrap" style={{ fontFamily: "'Roboto', sans-serif" }}>
                            {challenge.description}
                          </p>
                        </div>

                        {/* Examples */}
                        {challenge.examples.length > 0 && (
                          <div className="space-y-3">
                            <h3 className="text-base font-medium text-white flex items-center gap-2">
                              <Lightbulb className="w-4 h-4 text-[${GoogleColors.yellow}]" />
                              Examples
                            </h3>
                            {challenge.examples.map((ex, i) => (
                               <div key={i} className="rounded-2xl border border-[#3C4043] bg-[#202124] p-4 space-y-2 shadow-sm">
                                <div className="text-xs font-medium text-foreground/70 uppercase tracking-wide">Example {i + 1}</div>
                                <div className="font-mono text-base space-y-1">
<div><span className="text-foreground/70">Input: </span><span className="text-foreground">{ex.input}</span></div>
                                   <div><span className="text-foreground/70">Output: </span><span className="text-[${GoogleColors.green}]">{ex.output}</span></div>
                                  {ex.explanation && (
                                    <div className="text-xs text-foreground/70 mt-2 pt-2 border-t border-[#3C4043]">{ex.explanation}</div>
                                  )}
                                </div>
                              </div>
                            ))}
                          </div>
                        )}

                        {/* Tags */}
                        {challenge.tags.length > 0 && (
                          <div className="flex flex-wrap gap-2 pt-2">
{challenge.tags.map(tag => (
                               <Badge key={tag} className="text-xs bg-[#303134] text-foreground/70 border border-[#5F6368] rounded-full px-3 py-1.5 shadow-xl">{tag}</Badge>
                             ))}
                           </div>
                         )}
                       </motion.div>
                     </ScrollArea>
                   </TabsContent>

                   <TabsContent value="testcases" className="flex-1 overflow-hidden mt-0">
                     <ScrollArea className="h-full">
                       <div className="p-4 space-y-4">
                         <div className="flex items-center gap-2 text-base text-foreground/70">
                           <div className={`w-8 h-8 rounded-lg bg-[${GoogleColors.blue}]/20 flex items-center justify-center`}>
                             <BookOpen className={`w-4 h-4 text-[${GoogleColors.blue}]`} />
                           </div>
                           Visible test cases ({challenge.testCases.visible.length})
                         </div>
                         {challenge.testCases.visible.map((tc, i) => (
                            <div key={i} className="rounded-2xl border border-[#3C4043] bg-[#202124] p-4 font-mono text-base space-y-2 shadow-sm">
                             <div className="text-xs font-medium text-foreground/70 uppercase tracking-wide flex items-center gap-2">
                               <div className="w-5 h-5 rounded-full bg-[#303134] flex items-center justify-center text-foreground/70">{i + 1}</div>
                               Test Case
                             </div>
                             <div><span className="text-foreground/70">Input: </span>{JSON.stringify(tc.input)}</div>
                             <div><span className="text-foreground/70">Expected: </span><span className="text-[${GoogleColors.green}]">{JSON.stringify(tc.expected)}</span></div>
                           </div>
                         ))}
                         {challenge.testCases.hidden.length > 0 && (
                            <div className="flex items-center gap-3 p-4 rounded-2xl border border-[#3C4043] bg-[#202124] text-base text-foreground/70">
                             <div className={`w-8 h-8 rounded-full bg-[${GoogleColors.yellow}]/20 flex items-center justify-center`}>
                               <span className={`text-sm text-[${GoogleColors.yellow}]`}>+</span>
                             </div>
                             {challenge.testCases.hidden.length} hidden test case{challenge.testCases.hidden.length > 1 ? 's' : ''}
                           </div>
                         )}
                      </div>
                    </ScrollArea>
                  </TabsContent>

                  <TabsContent value="editorial" className="flex-1 overflow-hidden mt-0">
                    <ScrollArea className="h-full">
                      <div className="p-4 text-base text-foreground leading-relaxed whitespace-pre-wrap" style={{ fontFamily: "'Roboto', sans-serif" }}>
                        {challenge.editorial}
                      </div>
                    </ScrollArea>
                  </TabsContent>
                </Tabs>
              </div>
            )}
          </div>
        ) : (
          /* Desktop: Split panel view - Google Style */
          <PanelGroup direction="horizontal" className="flex-1 overflow-hidden">
            {/* Left: Problem - Clean Card Style */}
            <Panel defaultSize={40} minSize={25}>
              <div className="flex flex-col h-full bg-[#202124]">
                <Tabs defaultValue="description" className="flex flex-col flex-1 overflow-hidden">
                  <TabsList className="mx-4 mt-3 shrink-0 w-fit bg-[#303134] p-1 rounded-full">
<TabsTrigger value="description" className="cursor-pointer min-h-[40px] text-base text-foreground/70 data-[state=active]:bg-[${GoogleColors.blue}] data-[state=active]:text-white rounded-full px-5">
                      Description
                    </TabsTrigger>
                    <TabsTrigger value="testcases" className="cursor-pointer min-h-[40px] text-base text-foreground/70 data-[state=active]:bg-[${GoogleColors.blue}] data-[state=active]:text-white rounded-full px-5">
                      Test Cases
                    </TabsTrigger>
                    <TabsTrigger value="editorial" className="cursor-pointer min-h-[40px] text-base text-foreground/70 data-[state=active]:bg-[${GoogleColors.blue}] data-[state=active]:text-white rounded-full px-5">
                      <Lightbulb className="w-4 h-4 mr-1.5" />
                      Editorial
                    </TabsTrigger>
                  </TabsList>

                  <TabsContent value="description" className="flex-1 overflow-hidden mt-0">
                    <ScrollArea className="h-full">
                      <motion.div
                        initial={{ opacity: 0, y: 8 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.3 }}
                        className="p-5 space-y-5"
                      >
                        {/* Problem Card */}
<div className="rounded-2xl border border-[#3C4043] bg-[#2D2D2D] p-5 shadow-sm">
                           <p className="text-base text-foreground leading-relaxed whitespace-pre-wrap" style={{ fontFamily: "'Roboto', sans-serif" }}>
                            {challenge.description}
                          </p>
                        </div>

                        {/* Examples */}
                        {challenge.examples.length > 0 && (
                          <div className="space-y-4">
                            <h3 className="text-base font-medium text-white flex items-center gap-2" style={{ fontFamily: "'Google Sans', 'Roboto', sans-serif" }}>
                              <div className="w-6 h-6 rounded-full bg-[#FBBC04]/20 flex items-center justify-center">
                                <Lightbulb className={`w-3.5 h-3.5 text-[${GoogleColors.yellow}]`} />
                              </div>
                              Examples
                            </h3>
                            {challenge.examples.map((ex, i) => (
                               <div key={i} className="rounded-2xl border border-[#3C4043] bg-[#2D2D2D] p-4 space-y-2 shadow-sm">
                                <div className="text-xs font-medium text-foreground/70 uppercase tracking-wide flex items-center gap-2">
                                  <div className={`w-5 h-5 rounded-full bg-[${GoogleColors.blue}]/20 flex items-center justify-center text-[${GoogleColors.blue}]`}>{i + 1}</div>
                                  Example
                                </div>
<div className="font-mono text-base space-y-2">
<div><span className="text-foreground/70">Input: </span><span className="text-foreground">{ex.input}</span></div>
                                   <div><span className="text-foreground/70">Output: </span><span className="text-[${GoogleColors.green}]">{ex.output}</span></div>
                                  {ex.explanation && (
                                    <div className="text-xs text-foreground/70 mt-3 pt-3 border-t border-[#3C4043]">{ex.explanation}</div>
                                  )}
                                </div>
                              </div>
                            ))}
                          </div>
                        )}

                        {/* Tags */}
                        {challenge.tags.length > 0 && (
                          <div className="flex flex-wrap gap-2">
{challenge.tags.map(tag => (
                               <Badge key={tag} className="text-xs bg-[#303134] text-foreground/70 border border-[#5F6368] rounded-full px-3 py-1.5 shadow-xl">{tag}</Badge>
                             ))}
                           </div>
                         )}
                       </motion.div>
                     </ScrollArea>
                   </TabsContent>

                   <TabsContent value="testcases" className="flex-1 overflow-hidden mt-0">
                     <ScrollArea className="h-full">
                       <div className="p-5 space-y-4">
                         <div className="flex items-center gap-2 text-base text-foreground/70">
                           <div className={`w-8 h-8 rounded-lg bg-[${GoogleColors.blue}]/20 flex items-center justify-center`}>
                             <BookOpen className={`w-4 h-4 text-[${GoogleColors.blue}]`} />
                           </div>
                           Visible test cases ({challenge.testCases.visible.length})
                         </div>
                         {challenge.testCases.visible.map((tc, i) => (
                            <div key={i} className="rounded-2xl border border-[#3C4043] bg-[#2D2D2D] p-4 font-mono text-base space-y-2 shadow-sm">
                             <div className="text-xs font-medium text-foreground/70 uppercase tracking-wide flex items-center gap-2">
                               <div className="w-5 h-5 rounded-full bg-[#303134] flex items-center justify-center text-foreground/70">{i + 1}</div>
                               Test Case
                             </div>
                             <div><span className="text-foreground/70">Input: </span><span className="text-foreground">{JSON.stringify(tc.input)}</span></div>
                             <div><span className="text-foreground/70">Expected: </span><span className="text-[${GoogleColors.green}]">{JSON.stringify(tc.expected)}</span></div>
                           </div>
                         ))}
                         {challenge.testCases.hidden.length > 0 && (
                            <div className="flex items-center gap-3 p-4 rounded-2xl border border-[#3C4043] bg-[#2D2D2D] text-base text-foreground/70">
                             <div className={`w-8 h-8 rounded-full bg-[${GoogleColors.yellow}]/20 flex items-center justify-center`}>
                               <span className={`text-sm text-[${GoogleColors.yellow}]`}>+</span>
                             </div>
                             {challenge.testCases.hidden.length} hidden test case{challenge.testCases.hidden.length > 1 ? 's' : ''}
                           </div>
                         )}
                      </div>
                    </ScrollArea>
                  </TabsContent>

                  <TabsContent value="editorial" className="flex-1 overflow-hidden mt-0">
                    <ScrollArea className="h-full">
                      <div className="p-5 text-base text-foreground leading-relaxed whitespace-pre-wrap" style={{ fontFamily: "'Roboto', sans-serif" }}>
                        {challenge.editorial}
                      </div>
                    </ScrollArea>
                  </TabsContent>
                </Tabs>
              </div>
            </Panel>

            <PanelResizeHandle className="w-1 bg-[#3C4043] hover:bg-[#4285F4] transition-colors duration-150 cursor-col-resize" />

            {/* Right: Editor + Output */}
            <Panel defaultSize={60} minSize={30}>
              <PanelGroup direction="vertical" className="h-full">
                {/* Editor panel */}
                <Panel defaultSize={65} minSize={30}>
                  <div className="flex flex-col h-full">
                    {/* Editor toolbar - Google Style */}
                    <div className="flex items-center gap-3 px-4 py-2.5 border-b border-[#3C4043] shrink-0 bg-[#202124]">
                      <select
                        value={language}
                        onChange={e => setLanguage(e.target.value as Language)}
                        className={`text-sm bg-[#303134] border border-[#5F6368] rounded-lg px-3 py-2 text-white focus:outline-none focus:border-[${GoogleColors.blue}] focus-visible:ring-2 focus-visible:ring-[${GoogleColors.blue}] focus-visible:ring-offset-2 cursor-pointer`}
                      >
                        <option value="javascript">JavaScript</option>
                        {challenge.starterCode.python && <option value="python">Python</option>}
                      </select>
                      <div className="ml-auto flex gap-3">
                        <Button
                          size="sm"
                          onClick={handleRun}
                          disabled={running || submitting}
                          className={`gap-2 bg-[#303134] hover:bg-[#3C4043] text-white border border-[#5F6368] rounded-full min-h-[44px] cursor-pointer px-5 focus-visible:ring-2 focus-visible:ring-[${GoogleColors.blue}] focus-visible:ring-offset-2`}
                        >
                          {running ? <Loader2 className="w-4 h-4 animate-spin" /> : <Play className="w-4 h-4" />}
                          {running ? 'Running...' : 'Run Code'}
                        </Button>
                        <Button
                          size="sm"
                          onClick={handleSubmit}
                          disabled={running || submitting}
                          className={`gap-2 bg-[${GoogleColors.blue}] hover:bg-[${GoogleColors.blue}80] text-white border border-[#5F6368] rounded-full min-h-[44px] cursor-pointer px-5 focus-visible:ring-2 focus-visible:ring-[${GoogleColors.blue}] focus-visible:ring-offset-2`}
                        >
                          {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                          {submitting ? 'Submitting...' : 'Submit Solution'}
                        </Button>
                      </div>
                    </div>

                    {/* Monaco editor */}
                    <div className="flex-1 overflow-hidden">
                      <Editor
                        height="100%"
                        language={language}
                        value={code}
                        onChange={v => setCode(v ?? '')}
                        theme="vs-dark"
                        options={{
                          fontSize: 14,
                          fontFamily: 'JetBrains Mono, Fira Code, monospace',
                          minimap: { enabled: false },
                          scrollBeyondLastLine: false,
                          lineNumbers: 'on',
                          tabSize: language === 'python' ? 4 : 2,
                          wordWrap: 'off',
                          padding: { top: 8 },
                        }}
                      />
                    </div>
                  </div>
                </Panel>

                <PanelResizeHandle className="h-1 bg-[#3C4043] hover:bg-[#4285F4] transition-colors duration-150 cursor-row-resize" />

                {/* Output panel - Google Style */}
                <Panel defaultSize={35} minSize={15}>
                  <div className="flex flex-col h-full">
                    <div className="px-4 py-3 border-b border-[#3C4043] shrink-0 bg-[#202124] flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Terminal className="w-4 h-4 text-foreground/70" />
<span className="text-base font-medium text-foreground/70">Output</span>
                      </div>
                      {runResult && (
                        <motion.div
                          initial={{ scale: 0.9, opacity: 0 }}
                          animate={{ scale: 1, opacity: 1 }}
className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-sm font-medium ${
                         runResult.allPassed
                           ? 'bg-[${GoogleColors.green}]/20 text-[${GoogleColors.green}]'
                           : 'bg-[${GoogleColors.red}]/20 text-[${GoogleColors.red}]'
                       }`}
                        >
                          {runResult.allPassed ? <CheckCircle2 className="w-4 h-4" /> : <XCircle className="w-4 h-4" />}
                          {runResult.passCount}/{runResult.totalCount} passed
                        </motion.div>
                      )}
                    </div>
                    <div className="flex-1 overflow-hidden bg-[#202124]">
                      <ScrollArea className="h-full">
                        <div className="pb-24">
                          <TestResultsPanel
                            results={runResult?.results ?? []}
                            stdout={runResult?.stdout}
                            error={runResult?.error}
                            executionTimeMs={runResult?.executionTimeMs}
                            verdict={verdict}
                            score={score ?? undefined}
                            isRunning={running || submitting}
                          />
                        </div>
                      </ScrollArea>
                    </div>
                  </div>
                </Panel>
              </PanelGroup>
            </Panel>
          </PanelGroup>
        )}
      </div>
    </AppLayout>
  );
}