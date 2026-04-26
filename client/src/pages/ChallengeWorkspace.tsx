import { useState, useEffect, useRef } from 'react';
import { useParams, Link } from 'wouter';
import { Panel, PanelGroup, PanelResizeHandle } from 'react-resizable-panels';
import Editor from '@monaco-editor/react';
import { Play, Send, Loader2, ChevronLeft } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { AppLayout } from '@/components/layout/AppLayout';
import type { Challenge, Language, RunResult } from '@/types/challenges';
import { loadChallenge } from '@/lib/challenges-loader';
import { runCode } from '@/lib/code-runner';
import { markSolved, markAttempted, addXP, awardBadge, getProgress } from '@/lib/challenge-progress';
import { calculateScore, type ScoreResult, type Verdict } from '@/lib/test-runner';
import { checkAndAwardBadges } from '@/lib/challenge-badges';
import RexCompanion from '@/components/RexCompanion';
import TestResultsPanel from '@/components/TestResultsPanel';
import XPCelebration from '@/components/XPCelebration';

const DIFFICULTY_COLORS: Record<string, string> = {
  easy: 'bg-green-500/20 text-green-400 border-green-500/30',
  medium: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30',
  hard: 'bg-red-500/20 text-red-400 border-red-500/30',
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

export default function ChallengeWorkspace() {
  const { id } = useParams<{ id: string }>();
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
        <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (error || !challenge) {
    return (
      <div className="flex flex-col items-center justify-center h-screen gap-4 bg-background">
        <p className="text-destructive">{error ?? 'Challenge not found'}</p>
        <Link href="/code">
          <Button variant="outline">Back to Challenges</Button>
        </Link>
      </div>
    );
  }

  const failingTests = runResult?.results.filter(r => !r.passed);
  const verdict = score?.verdict as Verdict | undefined;

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

      {/* Header */}
      <header className="flex items-center gap-3 px-4 py-2 border-b border-border shrink-0">
        <Link href="/code">
          <Button variant="ghost" size="sm" className="gap-1 text-muted-foreground cursor-pointer min-h-[44px] transition-colors duration-150 ease-out">
            <ChevronLeft className="w-4 h-4" /> Challenges
          </Button>
        </Link>
        <span className="text-muted-foreground">/</span>
        <h1 className="font-semibold text-sm truncate">{challenge.title}</h1>
        <Badge className={`text-xs border ${DIFFICULTY_COLORS[challenge.difficulty]}`} variant="outline">
          {challenge.difficulty}
        </Badge>
        <span className="text-xs text-muted-foreground ml-auto">{challenge.estimatedMinutes} min</span>
      </header>

      {/* Main split */}
      <PanelGroup direction="horizontal" className="flex-1 overflow-hidden">
        {/* Left: Problem */}
        <Panel defaultSize={40} minSize={25}>
          <div className="flex flex-col h-full">
            <Tabs defaultValue="description" className="flex flex-col flex-1 overflow-hidden">
              <TabsList className="mx-3 mt-2 shrink-0 w-fit">
                <TabsTrigger value="description" className="cursor-pointer min-h-[44px]">Description</TabsTrigger>
                <TabsTrigger value="testcases" className="cursor-pointer min-h-[44px]">Test Cases</TabsTrigger>
                <TabsTrigger value="editorial" className="cursor-pointer min-h-[44px]">Editorial</TabsTrigger>
              </TabsList>

              <TabsContent value="description" className="flex-1 overflow-hidden mt-0">
                <ScrollArea className="h-full">
                  <div className="p-4 space-y-4 text-sm">
                    <p className="leading-relaxed whitespace-pre-wrap">{challenge.description}</p>
                    {challenge.examples.length > 0 && (
                      <div className="space-y-3">
                        <h3 className="font-semibold">Examples</h3>
                        {challenge.examples.map((ex, i) => (
                          <div key={i} className="rounded-lg border border-border bg-muted/20 p-3 space-y-1 font-mono text-xs">
                            <div><span className="text-muted-foreground">Input: </span>{ex.input}</div>
                            <div><span className="text-muted-foreground">Output: </span>{ex.output}</div>
                            {ex.explanation && (
                              <div className="font-sans text-muted-foreground">{ex.explanation}</div>
                            )}
                          </div>
                        ))}
                      </div>
                    )}
                    {challenge.tags.length > 0 && (
                      <div className="flex flex-wrap gap-1 pt-2">
                        {challenge.tags.map(tag => (
                          <Badge key={tag} variant="secondary" className="text-xs">{tag}</Badge>
                        ))}
                      </div>
                    )}
                  </div>
                </ScrollArea>
              </TabsContent>

              <TabsContent value="testcases" className="flex-1 overflow-hidden mt-0">
                <ScrollArea className="h-full">
                  <div className="p-4 space-y-3">
                    <p className="text-xs text-muted-foreground">Visible test cases ({challenge.testCases.visible.length})</p>
                    {challenge.testCases.visible.map((tc, i) => (
                      <div key={i} className="rounded-lg border border-border bg-muted/20 p-3 font-mono text-xs space-y-1">
                        <div><span className="text-muted-foreground">Input: </span>{JSON.stringify(tc.input)}</div>
                        <div><span className="text-muted-foreground">Expected: </span>{JSON.stringify(tc.expected)}</div>
                      </div>
                    ))}
                    {challenge.testCases.hidden.length > 0 && (
                      <p className="text-xs text-muted-foreground">
                        + {challenge.testCases.hidden.length} hidden test case{challenge.testCases.hidden.length > 1 ? 's' : ''}
                      </p>
                    )}
                  </div>
                </ScrollArea>
              </TabsContent>

              <TabsContent value="editorial" className="flex-1 overflow-hidden mt-0">
                <ScrollArea className="h-full">
                  <div className="p-4 text-sm leading-relaxed whitespace-pre-wrap">
                    {challenge.editorial}
                  </div>
                </ScrollArea>
              </TabsContent>
            </Tabs>

            {/* Rex Companion - coding assistant */}
            <div className="p-3 border-t border-border shrink-0 flex justify-center">
              <RexCompanion
                challenge={challenge}
                currentCode={code}
                failingTests={failingTests}
              />
            </div>
          </div>
        </Panel>

        <PanelResizeHandle className="w-1 bg-border hover:bg-primary/50 transition-colors duration-150 ease-out cursor-col-resize" />

        {/* Right: Editor + Output */}
        <Panel defaultSize={60} minSize={30}>
          <PanelGroup direction="vertical" className="h-full">
            {/* Editor panel */}
            <Panel defaultSize={65} minSize={30}>
              <div className="flex flex-col h-full">
                {/* Editor toolbar */}
                <div className="flex items-center gap-2 px-3 py-2 border-b border-border shrink-0">
                  <select
                    value={language}
                    onChange={e => setLanguage(e.target.value as Language)}
                    className="text-xs bg-muted border border-border rounded px-2 py-1 text-foreground focus:outline-none focus:ring-1 focus:ring-primary cursor-pointer min-h-[44px] transition-colors duration-150 ease-out"
                  >
                    <option value="javascript">JavaScript</option>
                    {challenge.starterCode.python && <option value="python">Python</option>}
                  </select>
                  <div className="ml-auto flex gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={handleRun}
                      disabled={running || submitting}
                      className="gap-1 text-xs min-h-[44px] cursor-pointer transition-colors duration-150 ease-out"
                    >
                      {running ? <Loader2 className="w-3 h-3 animate-spin" /> : <Play className="w-3 h-3" />}
                      {running ? 'Running…' : 'Run Code'}
                    </Button>
                    <Button
                      size="sm"
                      onClick={handleSubmit}
                      disabled={running || submitting}
                      className="gap-1 text-xs min-h-[44px] cursor-pointer transition-colors duration-150 ease-out bg-violet-600 hover:bg-violet-700"
                    >
                      {submitting ? <Loader2 className="w-3 h-3 animate-spin" /> : <Send className="w-3 h-3" />}
                      {submitting ? 'Submitting…' : 'Submit'}
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
                      fontSize: 13,
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

            <PanelResizeHandle className="h-1 bg-border hover:bg-primary/50 transition-colors duration-150 ease-out cursor-row-resize" />

            {/* Output panel */}
            <Panel defaultSize={35} minSize={15}>
              <div className="flex flex-col h-full">
                <div className="px-3 py-2 border-b border-border shrink-0">
                  <span className="text-xs font-medium text-muted-foreground">Output</span>
                  {runResult && (
                    <span className={`ml-2 text-xs font-semibold ${runResult.allPassed ? 'text-green-400' : 'text-red-400'}`}>
                      {runResult.passCount}/{runResult.totalCount} passed
                    </span>
                  )}
                </div>
                <div className="flex-1 overflow-hidden">
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
    </div>
    </AppLayout>
  );
}
