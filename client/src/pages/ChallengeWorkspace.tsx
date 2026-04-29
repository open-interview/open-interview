import { useState, useEffect, useRef } from 'react';
import { useParams, Link, useLocation } from 'wouter';
import { Panel, PanelGroup, PanelResizeHandle } from 'react-resizable-panels';
import Editor from '@monaco-editor/react';
import {
  Play,
  Send,
  Loader2,
  ChevronLeft,
  Code2,
  FileCode,
  CheckCircle2,
  XCircle,
  Clock,
  Zap,
  Bug,
  Lightbulb,
  Settings2,
  RotateCcw,
  Circle,
  AlertCircle,
} from 'lucide-react';
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
import RexCompanion from '@/components/RexCompanion';
import TestResultsPanel from '@/components/TestResultsPanel';
import XPCelebration from '@/components/XPCelebration';
import { NetworkError, NotFound404 } from '@/components/google/ErrorStates';

const DIFFICULTY_ICONS: Record<string, typeof Circle> = {
  easy: Circle,
  medium: AlertCircle,
  hard: CheckCircle2,
};

const DIFFICULTY_COLORS: Record<string, string> = {
  easy: 'bg-green-500/20 text-green-500 border-green-500/30',
  medium: 'bg-yellow-500/20 text-yellow-500 border-yellow-500/30',
  hard: 'bg-destructive/20 text-destructive border-destructive/30',
};

const STATUS_CONFIG = {
  idle: { label: 'Ready', color: 'text-slate-400', bg: 'bg-slate-800/50', icon: FileCode },
  running: { label: 'Running', color: 'text-blue-400', bg: 'bg-blue-500/20', icon: Loader2 },
  success: { label: 'Passed', color: 'text-green-400', bg: 'bg-green-500/20', icon: CheckCircle2 },
  error: { label: 'Failed', color: 'text-red-400', bg: 'bg-red-500/20', icon: XCircle },
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

type EditorStatus = 'idle' | 'running' | 'success' | 'error';

export default function ChallengeWorkspace() {
  const { id } = useParams<{ id: string }>();
  const [, navigate] = useLocation();
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
  const [editorStatus, setEditorStatus] = useState<EditorStatus>('idle');
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
    setEditorStatus('running');
    setIsSubmitResult(false);
    markAttempted(challenge.id, language);
    const testCases = buildVisibleTestCasesWithFunctionName(challenge);
    const result = await runCode(code, testCases, language);
    setRunResult(result);
    setScore(calculateScore(challenge, result, Date.now() - startTimeRef.current));
    setEditorStatus(result.allPassed ? 'success' : 'error');
    setRunning(false);
  }

  async function handleSubmit() {
    if (!challenge || submitting) return;
    setSubmitting(true);
    setEditorStatus('running');
    setIsSubmitResult(true);
    markAttempted(challenge.id, language);
    const testCases = buildTestCasesWithFunctionName(challenge);
    const result = await runCode(code, testCases, language);
    const timeMs = Date.now() - startTimeRef.current;
    const scoreResult = calculateScore(challenge, result, timeMs);
    setRunResult(result);
    setScore(scoreResult);
    setEditorStatus(result.allPassed ? 'success' : 'error');

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
        <Loader2 className="min-w-[48px] w-8 min-h-[48px] h-8 animate-spin text-foreground/70" />
      </div>
    );
  }

  if (error || !challenge) {
    return (
      error ? (
        <NetworkError
          title="Failed to load challenge"
          message="We couldn't load the challenge due to a network issue."
          onRetry={() => {
            setError(null);
            setLoading(true);
            loadChallenge(id!)
              .then(c => {
                setChallenge(c);
                setCode(c.starterCode.javascript);
              })
              .catch(e => setError(e.message))
              .finally(() => setLoading(false));
          }}
          onGoBack={() => navigate('/code/challenges')}
        />
      ) : (
        <NotFound404
          title="Challenge not found"
          message="This challenge may have been removed or the link is incorrect."
          onGoHome={() => navigate('/coding')}
        />
      )
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

      {/* Header - compact on mobile */}
      <header className={`flex items-center gap-2 px-2 py-2 border-b border-border shrink-0 ${isMobile ? 'flex-wrap' : ''}`}>
        <Link href="/coding">
          <Button variant="ghost" size="sm" className="gap-1 text-foreground/70 cursor-pointer min-h-[48px] transition-colors duration-150 ease-out focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2">
            <ChevronLeft className="w-4 h-4" /> 
            <span className="hidden sm:inline">Challenges</span>
          </Button>
        </Link>
        <h1 className="font-semibold text-base truncate flex-1 min-w-0">{challenge.title}</h1>
        <Badge className={`text-sm border ${DIFFICULTY_COLORS[challenge.difficulty]} inline-flex items-center gap-1.5`} variant="outline">
          {(() => { const Icon = DIFFICULTY_ICONS[challenge.difficulty]; return <Icon className="w-3.5 h-3.5" />; })()}
          {challenge.difficulty}
        </Badge>
        <span className="text-sm text-foreground/70 hidden sm:inline">{challenge.estimatedMinutes} min</span>
        {isMobile && (
          <Button
            size="sm"
            variant="outline"
            onClick={() => setShowEditor(!showEditor)}
            className="min-h-[48px] gap-1"
          >
            <Code2 className="w-4 h-4" />
            {showEditor ? 'Problem' : 'Code'}
          </Button>
        )}
      </header>

      {/* Mobile: Tab-based view */}
      {isMobile ? (
        <div className="flex-1 overflow-hidden">
          {showEditor ? (
            <div className="flex flex-col h-full">
              {/* Editor toolbar */}
              <div className="flex items-center gap-2 px-2 py-2 border-b border-border shrink-0">
                <select
                  value={language}
                  onChange={e => setLanguage(e.target.value as Language)}
                  className="text-sm bg-background border border-input rounded-md px-2 py-1.5 text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 cursor-pointer min-h-[48px] transition-colors duration-150 ease-out flex-1"
                >
                  <option value="javascript">JavaScript</option>
                  {challenge.starterCode.python && <option value="python">Python</option>}
                </select>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={handleRun}
                  disabled={running || submitting}
                  className="gap-1 text-sm min-h-[48px] cursor-pointer transition-colors duration-150 ease-out focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                >
                  {running ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Play className="w-3.5 h-3.5" />}
                </Button>
                <Button
                  size="sm"
                  onClick={handleSubmit}
                  disabled={running || submitting}
                  className="gap-1 text-sm min-h-[48px] cursor-pointer transition-colors duration-150 ease-out bg-primary hover:bg-primary/90 focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                >
                  {submitting ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Send className="w-3.5 h-3.5" />}
                </Button>
              </div>

              {/* Monaco editor - mobile optimized */}
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

              {/* Mobile output panel - collapsible */}
              <div className="border-t border-border bg-card rounded-b-2xl">
                <div className="px-3 py-2 border-b border-border shrink-0 flex items-center justify-between">
                  <span className="text-sm font-medium text-foreground/70">Output</span>
                  {runResult && (
                    <span className={`text-sm font-semibold ${runResult.allPassed ? 'text-green-500' : 'text-destructive'}`}>
                      {runResult.passCount}/{runResult.totalCount} passed
                    </span>
                  )}
                </div>
                <ScrollArea className="h-32">
                  <div className="p-3">
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
          ) : (
            /* Mobile: Problem description view */
            <div className="flex flex-col h-full">
              <Tabs defaultValue="description" className="flex flex-col flex-1 overflow-hidden">
                <TabsList className="mx-2 mt-2 shrink-0 w-fit">
                  <TabsTrigger value="description" className="cursor-pointer min-h-[48px] text-sm">Description</TabsTrigger>
                  <TabsTrigger value="testcases" className="cursor-pointer min-h-[48px] text-sm">Test Cases</TabsTrigger>
                  <TabsTrigger value="editorial" className="cursor-pointer min-h-[48px] text-sm">Editorial</TabsTrigger>
                </TabsList>

                <TabsContent value="description" className="flex-1 overflow-hidden mt-0">
                  <ScrollArea className="h-full">
                    <div className="p-3 space-y-3 text-base">
                      <p className="leading-relaxed whitespace-pre-wrap">{challenge.description}</p>
                      {challenge.examples.length > 0 && (
                        <div className="space-y-2">
                          <h3 className="font-semibold text-base">Examples</h3>
                          {challenge.examples.map((ex, i) => (
                            <div key={i} className="rounded-2xl border border-border bg-card p-3 space-y-1 font-mono text-sm">
                              <div><span className="text-foreground/70">Input: </span>{ex.input}</div>
                              <div><span className="text-foreground/70">Output: </span>{ex.output}</div>
                              {ex.explanation && (
                                <div className="font-sans text-foreground/70">{ex.explanation}</div>
                              )}
                            </div>
                          ))}
                        </div>
                      )}
                      {challenge.tags.length > 0 && (
                        <div className="flex flex-wrap gap-1 pt-2">
                          {challenge.tags.map(tag => (
                            <Badge key={tag} variant="secondary" className="text-sm">{tag}</Badge>
                          ))}
                        </div>
                      )}
                    </div>
                  </ScrollArea>
                </TabsContent>

                <TabsContent value="testcases" className="flex-1 overflow-hidden mt-0">
                  <ScrollArea className="h-full">
                    <div className="p-3 space-y-3">
                      <p className="text-sm text-foreground/70">Visible test cases ({challenge.testCases.visible.length})</p>
                      {challenge.testCases.visible.map((tc, i) => (
                        <div key={i} className="rounded-2xl border border-border bg-card p-3 font-mono text-sm space-y-1">
                          <div><span className="text-foreground/70">Input: </span>{JSON.stringify(tc.input)}</div>
                          <div><span className="text-foreground/70">Expected: </span>{JSON.stringify(tc.expected)}</div>
                        </div>
                      ))}
                      {challenge.testCases.hidden.length > 0 && (
                        <p className="text-sm text-foreground/70">
                          + {challenge.testCases.hidden.length} hidden test case{challenge.testCases.hidden.length > 1 ? 's' : ''}
                        </p>
                      )}
                    </div>
                  </ScrollArea>
                </TabsContent>

                <TabsContent value="editorial" className="flex-1 overflow-hidden mt-0">
                  <ScrollArea className="h-full">
                    <div className="p-3 text-base leading-relaxed whitespace-pre-wrap">
                      {challenge.editorial}
                    </div>
                  </ScrollArea>
                </TabsContent>
              </Tabs>

              {/* Rex Companion - coding assistant */}
              <div className="p-2 border-t border-border shrink-0 flex justify-center">
                <RexCompanion
                  challenge={challenge}
                  currentCode={code}
                  failingTests={failingTests}
                />
              </div>
            </div>
          )}
        </div>
      ) : (
        /* Desktop: Split panel view */
        <PanelGroup direction="horizontal" className="flex-1 overflow-hidden">
          {/* Left: Problem */}
          <Panel defaultSize={40} minSize={25}>
            <div className="flex flex-col h-full">
              <Tabs defaultValue="description" className="flex flex-col flex-1 overflow-hidden">
                <TabsList className="mx-3 mt-2 shrink-0 w-fit">
                  <TabsTrigger value="description" className="cursor-pointer min-h-[48px] text-sm">Description</TabsTrigger>
                  <TabsTrigger value="testcases" className="cursor-pointer min-h-[48px] text-sm">Test Cases</TabsTrigger>
                  <TabsTrigger value="editorial" className="cursor-pointer min-h-[48px] text-sm">Editorial</TabsTrigger>
                </TabsList>

                <TabsContent value="description" className="flex-1 overflow-hidden mt-0">
                  <ScrollArea className="h-full">
                    <div className="p-4 space-y-4 text-base">
                      <p className="leading-relaxed whitespace-pre-wrap">{challenge.description}</p>
                      {challenge.examples.length > 0 && (
                        <div className="space-y-3">
                          <h3 className="font-semibold text-base">Examples</h3>
                          {challenge.examples.map((ex, i) => (
                            <div key={i} className="rounded-2xl border border-border bg-card p-4 space-y-1 font-mono text-sm">
                              <div><span className="text-foreground/70">Input: </span>{ex.input}</div>
                              <div><span className="text-foreground/70">Output: </span>{ex.output}</div>
                              {ex.explanation && (
                                <div className="font-sans text-foreground/70">{ex.explanation}</div>
                              )}
                            </div>
                          ))}
                        </div>
                      )}
                      {challenge.tags.length > 0 && (
                        <div className="flex flex-wrap gap-1 pt-2">
                          {challenge.tags.map(tag => (
                            <Badge key={tag} variant="secondary" className="text-sm">{tag}</Badge>
                          ))}
                        </div>
                      )}
                    </div>
                  </ScrollArea>
                </TabsContent>

                <TabsContent value="testcases" className="flex-1 overflow-hidden mt-0">
                  <ScrollArea className="h-full">
                    <div className="p-4 space-y-3">
                      <p className="text-sm text-foreground/70">Visible test cases ({challenge.testCases.visible.length})</p>
                      {challenge.testCases.visible.map((tc, i) => (
                        <div key={i} className="rounded-2xl border border-border bg-card p-4 font-mono text-sm space-y-1">
                          <div><span className="text-foreground/70">Input: </span>{JSON.stringify(tc.input)}</div>
                          <div><span className="text-foreground/70">Expected: </span>{JSON.stringify(tc.expected)}</div>
                        </div>
                      ))}
                      {challenge.testCases.hidden.length > 0 && (
                        <p className="text-sm text-foreground/70">
                          + {challenge.testCases.hidden.length} hidden test case{challenge.testCases.hidden.length > 1 ? 's' : ''}
                        </p>
                      )}
                    </div>
                  </ScrollArea>
                </TabsContent>

                <TabsContent value="editorial" className="flex-1 overflow-hidden mt-0">
                  <ScrollArea className="h-full">
                    <div className="p-4 text-base leading-relaxed whitespace-pre-wrap">
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
                <div className="flex flex-col h-full bg-[#1E1E1E]">
                  {/* Material Design toolbar */}
                  <div className="flex items-center gap-3 px-3 py-2 border-b border-[#2D2D2D] shrink-0 bg-[#252526]">
                    {/* Language selector with Material styling */}
                    <div className="flex items-center gap-2">
                      <Settings2 className="w-4 h-4 text-slate-400" />
                      <select
                        value={language}
                        onChange={e => setLanguage(e.target.value as Language)}
                        className="bg-[#3C3C3C] border border-[#454545] rounded px-2 py-1.5 text-sm text-slate-200 focus:outline-none focus:ring-1 focus:ring-emerald-500 cursor-pointer min-h-[36px] transition-all duration-150 hover:border-emerald-500/50"
                      >
                        <option value="javascript">JavaScript</option>
                        {challenge.starterCode.python && <option value="python">Python</option>}
                      </select>
                    </div>

                    {/* Toolbar divider */}
                    <div className="w-px h-6 bg-[#454545]" />

                    {/* Status indicator - Material Design */}
                    {(() => {
                      const status = STATUS_CONFIG[editorStatus];
                      const StatusIcon = status.icon;
                      return (
                        <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded text-xs font-medium ${status.bg} ${status.color}`}>
                          <StatusIcon className={`w-3.5 h-3.5 ${editorStatus === 'running' ? 'animate-spin' : ''}`} />
                          {status.label}
                        </div>
                      );
                    })()}

                    {/* Execution time when available */}
                    {runResult?.executionTimeMs !== undefined && (
                      <>
                        <div className="w-px h-6 bg-[#454545]" />
                        <div className="flex items-center gap-1.5 text-xs text-slate-400">
                          <Clock className="w-3.5 h-3.5" />
                          <span>{(runResult.executionTimeMs / 1000).toFixed(2)}s</span>
                        </div>
                      </>
                    )}

                    {/* Test results indicator */}
                    {runResult && (
                      <>
                        <div className="w-px h-6 bg-[#454545]" />
                        <div className={`flex items-center gap-1.5 text-xs font-semibold ${
                          runResult.allPassed ? 'text-emerald-400' : 'text-red-400'
                        }`}>
                          {runResult.allPassed ? (
                            <CheckCircle2 className="w-3.5 h-3.5" />
                          ) : (
                            <Bug className="w-3.5 h-3.5" />
                          )}
                          <span>{runResult.passCount}/{runResult.totalCount}</span>
                        </div>
                      </>
                    )}

                    {/* XP indicator when submitted */}
                    {score && runResult?.allPassed && (
                      <>
                        <div className="w-px h-6 bg-[#454545]" />
                        <div className="flex items-center gap-1.5 text-xs text-amber-400">
                          <Zap className="w-3.5 h-3.5" />
                          <span>+{score.totalXP} XP</span>
                        </div>
                      </>
                    )}

                    {/* Spacer */}
                    <div className="flex-1" />

                    {/* Reset button */}
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => {
                        setCode(challenge?.starterCode.javascript ?? '');
                        setRunResult(null);
                        setScore(null);
                        setEditorStatus('idle');
                      }}
                      className="gap-1.5 text-xs min-h-[36px] text-slate-400 hover:text-slate-200 hover:bg-[#3C3C3C] cursor-pointer transition-all duration-150"
                    >
                      <RotateCcw className="w-3.5 h-3.5" />
                      Reset
                    </Button>

                    {/* Run button */}
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={handleRun}
                      disabled={running || submitting}
                      className="gap-1.5 text-xs min-h-[36px] cursor-pointer transition-all duration-150 border-slate-600 text-slate-300 hover:text-slate-100 hover:bg-slate-700 hover:border-slate-500"
                    >
                      {running ? (
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      ) : (
                        <Play className="w-3.5 h-3.5" />
                      )}
                      {running ? 'Running…' : 'Run'}
                    </Button>

                    {/* Submit button - Primary CTA */}
                    <Button
                      size="sm"
                      onClick={handleSubmit}
                      disabled={running || submitting}
                      className="gap-1.5 text-xs min-h-[36px] cursor-pointer transition-all duration-150 bg-emerald-600 hover:bg-emerald-500 border-none"
                    >
                      {submitting ? (
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      ) : (
                        <Send className="w-3.5 h-3.5" />
                      )}
                      {submitting ? 'Submitting…' : 'Submit'}
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

              <PanelResizeHandle className="h-1 bg-[#2D2D2D] hover:bg-emerald-500/50 transition-colors duration-150 ease-out cursor-row-resize" />

              {/* Output panel - Material Design */}
              <Panel defaultSize={35} minSize={15}>
                <div className="flex flex-col h-full bg-[#1E1E1E]">
                  {/* Output header with tabs */}
                  <div className="flex items-center gap-2 px-3 py-2 border-b border-[#2D2D2D] shrink-0 bg-[#252526]">
                    <div className="flex items-center gap-1.5">
                      <Bug className="w-4 h-4 text-slate-400" />
                      <span className="text-sm font-medium text-slate-200">Output</span>
                    </div>
                    {runResult && (
                      <div className={`flex items-center gap-1.5 px-2 py-0.5 rounded text-xs font-semibold ${
                        runResult.allPassed 
                          ? 'bg-emerald-500/20 text-emerald-400' 
                          : 'bg-red-500/20 text-red-400'
                      }`}>
                        {runResult.allPassed ? (
                          <CheckCircle2 className="w-3 h-3" />
                        ) : (
                          <XCircle className="w-3 h-3" />
                        )}
                        {runResult.passCount}/{runResult.totalCount} passed
                      </div>
                    )}
                    {score && (
                      <>
                        <div className="w-px h-5 bg-[#454545]" />
                        <div className="flex items-center gap-1.5 text-xs text-amber-400">
                          <Zap className="w-3 h-3" />
                          <span className="font-semibold">+{score.totalXP} XP</span>
                        </div>
                      </>
                    )}
                  </div>
                  <div className="flex-1 overflow-hidden">
                    <ScrollArea className="h-full">
                      <div className="pb-6">
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
