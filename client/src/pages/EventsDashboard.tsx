import { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell,
} from "recharts";
import {
  Rocket, Bot, FileText, LinkedinIcon, BarChart2, Wrench, HelpCircle,
  CheckCircle2, XCircle, Info, RefreshCw, Clock, Mic, BookOpen, Code2,
  GraduationCap, Activity, ChevronDown, ChevronUp, ExternalLink, Zap,
} from "lucide-react";
import { AppLayout } from "@/components/layout/AppLayout";
import { SEOHead } from "@/components/SEOHead";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

// ─── Types ────────────────────────────────────────────────────────────────────

interface Event {
  id: string;
  timestamp: string;
  type: string;
  title: string;
  description: string;
  status: "success" | "failed" | "info" | "running";
  workflow: string;
  trigger: string;
  actor: string;
  metadata: Record<string, string>;
}

interface EventsData {
  version: string;
  lastUpdated: string;
  events: Event[];
}

// ─── Config ───────────────────────────────────────────────────────────────────

const EVENT_CONFIG: Record<string, {
  label: string;
  icon: React.ElementType;
  color: string;
  bg: string;
  border: string;
  chartColor: string;
}> = {
  deploy:         { label: "Deploy",          icon: Rocket,       color: "text-blue-400",   bg: "bg-blue-500/10",   border: "border-blue-500/30",   chartColor: "#60a5fa" },
  bot_run:        { label: "Bot Run",         icon: Bot,          color: "text-purple-400", bg: "bg-purple-500/10", border: "border-purple-500/30", chartColor: "#a78bfa" },
  question_added: { label: "Question Added",  icon: HelpCircle,   color: "text-cyan-400",   bg: "bg-cyan-500/10",   border: "border-cyan-500/30",   chartColor: "#22d3ee" },
  blog_published: { label: "Blog Published",  icon: FileText,     color: "text-emerald-400",bg: "bg-emerald-500/10",border: "border-emerald-500/30",chartColor: "#34d399" },
  linkedin_post:  { label: "LinkedIn Post",   icon: LinkedinIcon, color: "text-sky-400",    bg: "bg-sky-500/10",    border: "border-sky-500/30",    chartColor: "#38bdf8" },
  linkedin_poll:  { label: "LinkedIn Poll",   icon: BarChart2,    color: "text-indigo-400", bg: "bg-indigo-500/10", border: "border-indigo-500/30", chartColor: "#818cf8" },
  analytics:      { label: "Analytics",       icon: Activity,     color: "text-amber-400",  bg: "bg-amber-500/10",  border: "border-amber-500/30",  chartColor: "#fbbf24" },
  maintenance:    { label: "Maintenance",     icon: Wrench,       color: "text-orange-400", bg: "bg-orange-500/10", border: "border-orange-500/30", chartColor: "#fb923c" },
  community:      { label: "Community",       icon: BookOpen,     color: "text-pink-400",   bg: "bg-pink-500/10",   border: "border-pink-500/30",   chartColor: "#f472b6" },
  quality:        { label: "Quality Check",   icon: CheckCircle2, color: "text-teal-400",   bg: "bg-teal-500/10",   border: "border-teal-500/30",   chartColor: "#2dd4bf" },
  learning_path:  { label: "Learning Path",  icon: GraduationCap,color: "text-violet-400", bg: "bg-violet-500/10", border: "border-violet-500/30", chartColor: "#a78bfa" },
  certification:  { label: "Certification",  icon: GraduationCap,color: "text-rose-400",   bg: "bg-rose-500/10",   border: "border-rose-500/30",   chartColor: "#fb7185" },
  voice_session:  { label: "Voice Session",  icon: Mic,          color: "text-lime-400",   bg: "bg-lime-500/10",   border: "border-lime-500/30",   chartColor: "#a3e635" },
  flashcard:      { label: "Flashcards",     icon: Zap,          color: "text-yellow-400", bg: "bg-yellow-500/10", border: "border-yellow-500/30", chartColor: "#facc15" },
  challenge:      { label: "Challenge",      icon: Code2,        color: "text-red-400",    bg: "bg-red-500/10",    border: "border-red-500/30",    chartColor: "#f87171" },
};

const STATUS_CONFIG = {
  success: { label: "Success", icon: CheckCircle2, color: "text-emerald-400", bg: "bg-emerald-500/15", border: "border-emerald-500/30" },
  failed:  { label: "Failed",  icon: XCircle,      color: "text-red-400",     bg: "bg-red-500/15",     border: "border-red-500/30" },
  info:    { label: "Info",    icon: Info,         color: "text-blue-400",    bg: "bg-blue-500/15",    border: "border-blue-500/30" },
  running: { label: "Running", icon: RefreshCw,    color: "text-amber-400",   bg: "bg-amber-500/15",   border: "border-amber-500/30" },
};

const TYPE_FILTERS = ["all", ...Object.keys(EVENT_CONFIG)] as const;

// ─── Helpers ──────────────────────────────────────────────────────────────────

function getEventConfig(type: string) {
  return EVENT_CONFIG[type] ?? {
    label: type,
    icon: Bot,
    color: "text-gray-400",
    bg: "bg-gray-500/10",
    border: "border-gray-500/30",
    chartColor: "#9ca3af",
  };
}

function getStatusConfig(status: string) {
  return STATUS_CONFIG[status as keyof typeof STATUS_CONFIG] ?? STATUS_CONFIG.info;
}

function formatTimeAgo(iso: string) {
  const ms = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(ms / 60000);
  const hours = Math.floor(ms / 3600000);
  const days = Math.floor(ms / 86400000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  if (hours < 24) return `${hours}h ago`;
  if (days < 7) return `${days}d ago`;
  return new Date(iso).toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleString("en-US", {
    month: "short", day: "numeric", year: "numeric",
    hour: "numeric", minute: "2-digit", hour12: true,
  });
}

function formatShortDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function StatCard({ label, value, sub, color }: { label: string; value: string | number; sub?: string; color?: string }) {
  return (
    <div className="bg-card border border-border rounded-xl p-4 flex flex-col gap-1">
      <span className="text-xs text-muted-foreground uppercase tracking-wider font-medium">{label}</span>
      <span className={cn("text-2xl font-bold", color ?? "text-foreground")}>{value}</span>
      {sub && <span className="text-xs text-muted-foreground">{sub}</span>}
    </div>
  );
}

function EventRow({ event, expanded, onToggle }: { event: Event; expanded: boolean; onToggle: () => void }) {
  const cfg = getEventConfig(event.type);
  const statusCfg = getStatusConfig(event.status);
  const Icon = cfg.icon;
  const StatusIcon = statusCfg.icon;

  return (
    <div
      className={cn(
        "border rounded-xl overflow-hidden transition-all",
        "bg-card/50 hover:bg-card",
        expanded ? "border-border/80" : "border-border/40",
      )}
    >
      <button
        className="w-full text-left px-4 py-3 flex items-center gap-3"
        onClick={onToggle}
        data-testid={`event-row-${event.id}`}
      >
        <div className={cn("p-1.5 rounded-lg flex-shrink-0", cfg.bg, cfg.border, "border")}>
          <Icon className={cn("w-4 h-4", cfg.color)} />
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="font-medium text-sm text-foreground truncate">{event.title}</span>
            <span className={cn(
              "inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-xs font-medium border flex-shrink-0",
              statusCfg.bg, statusCfg.border, statusCfg.color,
            )}>
              <StatusIcon className="w-3 h-3" />
              {statusCfg.label}
            </span>
          </div>
          {event.description && (
            <p className="text-xs text-muted-foreground mt-0.5 truncate">{event.description}</p>
          )}
        </div>

        <div className="flex items-center gap-3 flex-shrink-0">
          <div className="text-right hidden sm:block">
            <div className="text-xs text-muted-foreground">{formatTimeAgo(event.timestamp)}</div>
            {event.workflow && (
              <div className="text-xs text-muted-foreground/60">{event.workflow}</div>
            )}
          </div>
          {expanded ? (
            <ChevronUp className="w-4 h-4 text-muted-foreground" />
          ) : (
            <ChevronDown className="w-4 h-4 text-muted-foreground" />
          )}
        </div>
      </button>

      {expanded && (
        <div className="px-4 pb-4 pt-1 border-t border-border/30">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-2 mb-3 text-xs">
            <div>
              <div className="text-muted-foreground mb-0.5">Timestamp</div>
              <div className="text-foreground font-mono">{formatDate(event.timestamp)}</div>
            </div>
            <div>
              <div className="text-muted-foreground mb-0.5">Trigger</div>
              <div className="text-foreground">{event.trigger || "—"}</div>
            </div>
            <div>
              <div className="text-muted-foreground mb-0.5">Actor</div>
              <div className="text-foreground">{event.actor || "github-actions"}</div>
            </div>
            <div>
              <div className="text-muted-foreground mb-0.5">Workflow</div>
              <div className="text-foreground">{event.workflow || "—"}</div>
            </div>
          </div>

          {Object.keys(event.metadata ?? {}).length > 0 && (
            <div className="bg-muted/30 rounded-lg p-3 font-mono text-xs">
              <div className="text-muted-foreground mb-1">Metadata</div>
              {Object.entries(event.metadata).map(([k, v]) => (
                <div key={k} className="flex gap-2">
                  <span className="text-muted-foreground">{k}:</span>
                  <span className="text-foreground break-all">{String(v)}</span>
                </div>
              ))}
            </div>
          )}

          {event.metadata?.runId && (
            <a
              href={`https://github.com/satishkumar-dhule/code-reels/actions/runs/${event.metadata.runId}`}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 mt-2 text-xs text-primary hover:underline"
            >
              <ExternalLink className="w-3 h-3" />
              View GitHub Actions run
            </a>
          )}
        </div>
      )}
    </div>
  );
}

// ─── Chart tooltip ────────────────────────────────────────────────────────────

function ChartTooltip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-card border border-border rounded-lg px-3 py-2 text-xs shadow-lg">
      <div className="font-medium text-foreground mb-1">{label}</div>
      {payload.map((p: any) => (
        <div key={p.dataKey} className="flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-full" style={{ background: p.fill }} />
          <span className="text-muted-foreground">{p.name}:</span>
          <span className="text-foreground font-medium">{p.value}</span>
        </div>
      ))}
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function EventsDashboard() {
  const [activeType, setActiveType] = useState<string>("all");
  const [activeStatus, setActiveStatus] = useState<string>("all");
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [showAll, setShowAll] = useState(false);

  const { data, isLoading, error, refetch } = useQuery<EventsData>({
    queryKey: ["/data/events.json"],
    queryFn: async () => {
      const res = await fetch("/data/events.json");
      if (!res.ok) throw new Error("Could not load events");
      return res.json();
    },
    staleTime: 60_000,
  });

  const events = data?.events ?? [];

  // Summary stats
  const stats = useMemo(() => {
    const total = events.length;
    const successes = events.filter(e => e.status === "success").length;
    const failures = events.filter(e => e.status === "failed").length;
    const last = events[0];
    const typeCounts: Record<string, number> = {};
    events.forEach(e => { typeCounts[e.type] = (typeCounts[e.type] ?? 0) + 1; });
    const topType = Object.entries(typeCounts).sort((a, b) => b[1] - a[1])[0];
    return { total, successes, failures, last, topType };
  }, [events]);

  // Activity chart — last 30 days
  const chartData = useMemo(() => {
    const now = new Date();
    const days: Record<string, Record<string, number>> = {};
    for (let i = 29; i >= 0; i--) {
      const d = new Date(now);
      d.setDate(d.getDate() - i);
      days[formatShortDate(d.toISOString())] = { success: 0, failed: 0 };
    }
    events.forEach(e => {
      const label = formatShortDate(e.timestamp);
      if (days[label]) {
        const bucket = e.status === "failed" ? "failed" : "success";
        days[label][bucket] = (days[label][bucket] ?? 0) + 1;
      }
    });
    return Object.entries(days).map(([date, counts]) => ({ date, ...counts }));
  }, [events]);

  // Filtered events
  const filtered = useMemo(() => {
    return events.filter(e => {
      if (activeType !== "all" && e.type !== activeType) return false;
      if (activeStatus !== "all" && e.status !== activeStatus) return false;
      return true;
    });
  }, [events, activeType, activeStatus]);

  const displayed = showAll ? filtered : filtered.slice(0, 25);

  // Event type breakdown for the legend
  const typeCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    events.forEach(e => { counts[e.type] = (counts[e.type] ?? 0) + 1; });
    return Object.entries(counts).sort((a, b) => b[1] - a[1]).slice(0, 6);
  }, [events]);

  const isEmpty = !isLoading && events.length === 0;

  return (
    <AppLayout>
      <SEOHead
        title="Events Dashboard | Open Interview"
        description="Live activity log of all GitHub Actions runs, content generation, LinkedIn posts, and deployments."
      />

      <div className="max-w-5xl mx-auto px-4 py-6 space-y-6">
        {/* Header */}
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div>
            <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
              <Activity className="w-6 h-6 text-primary" />
              Events Dashboard
            </h1>
            <p className="text-sm text-muted-foreground mt-1">
              Real-time log of every automated job, deploy, and significant action.
            </p>
            {data?.lastUpdated && (
              <p className="text-xs text-muted-foreground/60 mt-0.5 flex items-center gap-1">
                <Clock className="w-3 h-3" />
                Last updated {formatTimeAgo(data.lastUpdated)}
              </p>
            )}
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => refetch()}
            data-testid="button-refresh-events"
            className="flex items-center gap-1.5"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            Refresh
          </Button>
        </div>

        {/* Stat Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <StatCard
            label="Total Events"
            value={stats.total}
            sub="all time"
            color="text-foreground"
          />
          <StatCard
            label="Succeeded"
            value={stats.successes}
            sub={stats.total > 0 ? `${Math.round(stats.successes / stats.total * 100)}% success rate` : "—"}
            color="text-emerald-400"
          />
          <StatCard
            label="Failed"
            value={stats.failures}
            sub={stats.failures === 0 ? "All clear!" : "need attention"}
            color={stats.failures > 0 ? "text-red-400" : "text-emerald-400"}
          />
          <StatCard
            label="Top Activity"
            value={stats.topType ? getEventConfig(stats.topType[0]).label : "—"}
            sub={stats.topType ? `${stats.topType[1]} events` : "no data yet"}
            color="text-primary"
          />
        </div>

        {/* Activity Chart */}
        {!isEmpty && (
          <div className="bg-card border border-border rounded-xl p-4">
            <h2 className="text-sm font-semibold text-foreground mb-1">Activity — Last 30 Days</h2>
            <p className="text-xs text-muted-foreground mb-4">Daily event count by outcome</p>
            <ResponsiveContainer width="100%" height={160}>
              <BarChart data={chartData} barSize={6} barGap={1}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
                <XAxis
                  dataKey="date"
                  tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }}
                  axisLine={false}
                  tickLine={false}
                  interval="preserveStartEnd"
                />
                <YAxis
                  tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }}
                  axisLine={false}
                  tickLine={false}
                  width={24}
                  allowDecimals={false}
                />
                <Tooltip content={<ChartTooltip />} cursor={{ fill: "hsl(var(--muted)/0.3)" }} />
                <Bar dataKey="success" name="Success" fill="#34d399" radius={[2, 2, 0, 0]} />
                <Bar dataKey="failed" name="Failed" fill="#f87171" radius={[2, 2, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>

            {/* Type breakdown pills */}
            {typeCounts.length > 0 && (
              <div className="flex flex-wrap gap-2 mt-4 pt-3 border-t border-border/40">
                {typeCounts.map(([type, count]) => {
                  const cfg = getEventConfig(type);
                  const Icon = cfg.icon;
                  return (
                    <button
                      key={type}
                      onClick={() => setActiveType(activeType === type ? "all" : type)}
                      className={cn(
                        "inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border transition-all",
                        activeType === type ? `${cfg.bg} ${cfg.border} ${cfg.color}` : "bg-muted/30 border-border/40 text-muted-foreground hover:border-border",
                      )}
                      data-testid={`filter-type-${type}`}
                    >
                      <Icon className="w-3 h-3" />
                      {cfg.label}
                      <span className="opacity-70">{count}</span>
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* Event Feed */}
        <div>
          <div className="flex items-center justify-between gap-3 mb-3 flex-wrap">
            <h2 className="text-sm font-semibold text-foreground">
              Event Log
              {filtered.length > 0 && (
                <span className="ml-2 text-muted-foreground font-normal">({filtered.length})</span>
              )}
            </h2>

            <div className="flex items-center gap-2">
              {/* Status filter */}
              <div className="flex items-center gap-1 bg-muted/30 rounded-lg p-1">
                {(["all", "success", "failed"] as const).map(s => (
                  <button
                    key={s}
                    onClick={() => setActiveStatus(s)}
                    className={cn(
                      "px-2.5 py-1 rounded-md text-xs font-medium transition-all capitalize",
                      activeStatus === s
                        ? "bg-background border border-border text-foreground shadow-sm"
                        : "text-muted-foreground hover:text-foreground",
                    )}
                    data-testid={`filter-status-${s}`}
                  >
                    {s === "all" ? "All" : s}
                  </button>
                ))}
              </div>

              {/* Reset filters */}
              {(activeType !== "all" || activeStatus !== "all") && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => { setActiveType("all"); setActiveStatus("all"); }}
                  className="text-xs h-7 px-2"
                  data-testid="button-reset-filters"
                >
                  Reset
                </Button>
              )}
            </div>
          </div>

          {isLoading && (
            <div className="flex flex-col gap-2">
              {[1, 2, 3, 4].map(i => (
                <div key={i} className="h-16 bg-muted/30 rounded-xl animate-pulse" />
              ))}
            </div>
          )}

          {error && (
            <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-6 text-center">
              <XCircle className="w-8 h-8 text-red-400 mx-auto mb-2" />
              <p className="text-sm text-red-400 font-medium">Could not load events</p>
              <p className="text-xs text-muted-foreground mt-1">
                The events log will populate automatically as GitHub Actions runs.
              </p>
            </div>
          )}

          {isEmpty && !isLoading && !error && (
            <div className="bg-muted/20 border border-border/40 rounded-xl p-10 text-center">
              <Activity className="w-10 h-10 text-muted-foreground/50 mx-auto mb-3" />
              <p className="text-sm font-medium text-muted-foreground">No events yet</p>
              <p className="text-xs text-muted-foreground/70 mt-1 max-w-xs mx-auto">
                Events will appear here automatically after each GitHub Actions workflow run — deploys, content generation, LinkedIn posts, and more.
              </p>
            </div>
          )}

          {filtered.length === 0 && !isEmpty && !isLoading && (
            <div className="bg-muted/20 border border-border/40 rounded-xl p-8 text-center">
              <p className="text-sm text-muted-foreground">No events match your filters.</p>
              <Button
                variant="ghost"
                size="sm"
                className="mt-2 text-xs"
                onClick={() => { setActiveType("all"); setActiveStatus("all"); }}
              >
                Clear filters
              </Button>
            </div>
          )}

          {!isLoading && !error && displayed.length > 0 && (
            <div className="flex flex-col gap-2">
              {displayed.map(event => (
                <EventRow
                  key={event.id}
                  event={event}
                  expanded={expandedId === event.id}
                  onToggle={() => setExpandedId(expandedId === event.id ? null : event.id)}
                />
              ))}

              {filtered.length > 25 && (
                <Button
                  variant="outline"
                  className="w-full mt-1"
                  onClick={() => setShowAll(!showAll)}
                  data-testid="button-show-more-events"
                >
                  {showAll
                    ? "Show less"
                    : `Show all ${filtered.length} events`}
                </Button>
              )}
            </div>
          )}
        </div>

        {/* Footer note */}
        <div className="text-xs text-muted-foreground/50 text-center pb-4">
          Events are written by GitHub Actions on every workflow run and committed to{" "}
          <code className="font-mono">client/public/data/events.json</code>
        </div>
      </div>
    </AppLayout>
  );
}
