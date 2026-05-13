import { useState, useMemo, useCallback, Fragment } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
} from "recharts";
import {
  Rocket, Bot, FileText, LinkedinIcon, BarChart2, Wrench, HelpCircle,
  CheckCircle2, XCircle, Info, RefreshCw, Clock, Mic, BookOpen, Code2,
  GraduationCap, Activity, ChevronDown, ChevronUp, ExternalLink, Zap,
  Download, ArrowUpDown, ArrowUp, ArrowDown, Table2, List,
} from "lucide-react";
import { AppLayout } from "@/components/layout/AppLayout";
import { SEOHead } from "@/components/SEOHead";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

// ─── Types ────────────────────────────────────────────────────────────────────

interface EventLink {
  label: string;
  url: string;
}

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
  links: EventLink[];
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

function normalizeLinks(event: Event): EventLink[] {
  const links = Array.isArray(event.links) ? event.links : [];
  const meta = event.metadata ?? {};
  if (meta.runId) {
    const ghUrl = `https://github.com/satishkumar-dhule/code-reels/actions/runs/${meta.runId}`;
    if (!links.some(l => l.url === ghUrl)) {
      return [...links, { label: "GitHub Actions run", url: ghUrl }];
    }
  }
  return links;
}

// ─── LinkChips ────────────────────────────────────────────────────────────────

function LinkChips({ links, size = "sm" }: { links: EventLink[]; size?: "sm" | "xs" }) {
  if (!links.length) return null;
  return (
    <div className="flex flex-wrap gap-1.5">
      {links.map((link, i) => (
        <a
          key={i}
          href={link.url}
          target="_blank"
          rel="noopener noreferrer"
          onClick={e => e.stopPropagation()}
          className={cn(
            "inline-flex items-center gap-1 rounded-md border border-border/50 bg-muted/40",
            "text-muted-foreground hover:text-foreground hover:border-border hover:bg-muted transition-all",
            size === "xs" ? "px-1.5 py-0.5 text-[10px]" : "px-2 py-0.5 text-xs",
          )}
          data-testid={`link-${link.label.replace(/\s+/g, "-").toLowerCase()}-${i}`}
        >
          <ExternalLink className={cn(size === "xs" ? "w-2.5 h-2.5" : "w-3 h-3")} />
          {link.label}
        </a>
      ))}
    </div>
  );
}

// ─── StatCard ─────────────────────────────────────────────────────────────────

function StatCard({ label, value, sub, color }: { label: string; value: string | number; sub?: string; color?: string }) {
  return (
    <div className="bg-card border border-border rounded-xl p-4 flex flex-col gap-1">
      <span className="text-xs text-muted-foreground uppercase tracking-wider font-medium">{label}</span>
      <span className={cn("text-2xl font-bold", color ?? "text-foreground")}>{value}</span>
      {sub && <span className="text-xs text-muted-foreground">{sub}</span>}
    </div>
  );
}

// ─── EventRow (Timeline view) ─────────────────────────────────────────────────

function EventRow({ event, expanded, onToggle }: { event: Event; expanded: boolean; onToggle: () => void }) {
  const cfg = getEventConfig(event.type);
  const statusCfg = getStatusConfig(event.status);
  const Icon = cfg.icon;
  const StatusIcon = statusCfg.icon;
  const links = normalizeLinks(event);

  return (
    <div
      className={cn(
        "border rounded-xl overflow-hidden transition-all",
        "bg-card/50 hover:bg-card",
        expanded ? "border-border/80" : "border-border/40",
      )}
    >
      <button
        className="w-full text-left px-4 py-3 flex items-start gap-3"
        onClick={onToggle}
        data-testid={`event-row-${event.id}`}
      >
        <div className={cn("p-1.5 rounded-lg flex-shrink-0 mt-0.5", cfg.bg, cfg.border, "border")}>
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
          {links.length > 0 && (
            <div className="mt-1.5">
              <LinkChips links={links} size="xs" />
            </div>
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
              <div className="text-muted-foreground mb-0.5">Event ID</div>
              <div className="text-foreground font-mono text-[10px] break-all">{event.id.slice(0, 8)}…</div>
            </div>
          </div>

          {links.length > 0 && (
            <div className="mb-3">
              <div className="text-xs text-muted-foreground mb-1.5">References</div>
              <LinkChips links={links} size="sm" />
            </div>
          )}

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

// ─── Audit Table ──────────────────────────────────────────────────────────────

type SortKey = "timestamp" | "type" | "title" | "status" | "workflow" | "trigger";
type SortDir = "asc" | "desc";

function SortIcon({ col, sortKey, sortDir }: { col: SortKey; sortKey: SortKey; sortDir: SortDir }) {
  if (col !== sortKey) return <ArrowUpDown className="w-3 h-3 opacity-40" />;
  return sortDir === "asc"
    ? <ArrowUp className="w-3 h-3 text-primary" />
    : <ArrowDown className="w-3 h-3 text-primary" />;
}

const PAGE_SIZE = 20;

function AuditTable({ events }: { events: Event[] }) {
  const [sortKey, setSortKey] = useState<SortKey>("timestamp");
  const [sortDir, setSortDir] = useState<SortDir>("desc");
  const [page, setPage] = useState(1);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const handleSort = useCallback((key: SortKey) => {
    if (key === sortKey) {
      setSortDir(d => d === "asc" ? "desc" : "asc");
    } else {
      setSortKey(key);
      setSortDir("desc");
    }
    setPage(1);
  }, [sortKey]);

  const sorted = useMemo(() => {
    return [...events].sort((a, b) => {
      let av: string = "";
      let bv: string = "";
      if (sortKey === "timestamp") { av = a.timestamp; bv = b.timestamp; }
      else if (sortKey === "type") { av = a.type; bv = b.type; }
      else if (sortKey === "title") { av = a.title; bv = b.title; }
      else if (sortKey === "status") { av = a.status; bv = b.status; }
      else if (sortKey === "workflow") { av = a.workflow; bv = b.workflow; }
      else if (sortKey === "trigger") { av = a.trigger; bv = b.trigger; }
      const cmp = av.localeCompare(bv);
      return sortDir === "asc" ? cmp : -cmp;
    });
  }, [events, sortKey, sortDir]);

  const totalPages = Math.ceil(sorted.length / PAGE_SIZE);
  const paginated = sorted.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  const exportCSV = useCallback(() => {
    const headers = ["#", "Timestamp", "Type", "Title", "Status", "Workflow", "Trigger", "Actor", "Links", "Description"];
    const rows = events.map((e, i) => {
      const links = normalizeLinks(e).map(l => `${l.label}: ${l.url}`).join(" | ");
      return [
        i + 1,
        e.timestamp,
        e.type,
        `"${e.title.replace(/"/g, '""')}"`,
        e.status,
        e.workflow,
        e.trigger,
        e.actor,
        `"${links.replace(/"/g, '""')}"`,
        `"${(e.description || "").replace(/"/g, '""')}"`,
      ].join(",");
    });
    const csv = [headers.join(","), ...rows].join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `events-audit-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }, [events]);

  const cols: { key: SortKey; label: string; width?: string }[] = [
    { key: "timestamp", label: "Time",     width: "w-28" },
    { key: "type",      label: "Type",     width: "w-36" },
    { key: "title",     label: "Title" },
    { key: "status",    label: "Status",   width: "w-24" },
    { key: "workflow",  label: "Workflow", width: "w-28" },
    { key: "trigger",   label: "Trigger",  width: "w-24" },
  ];

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between gap-3">
        <p className="text-xs text-muted-foreground">
          {events.length} total events — sorted by {sortKey} ({sortDir})
        </p>
        <Button
          variant="outline"
          size="sm"
          onClick={exportCSV}
          className="flex items-center gap-1.5 text-xs h-7"
          data-testid="button-export-csv"
        >
          <Download className="w-3.5 h-3.5" />
          Export CSV
        </Button>
      </div>

      <div className="border border-border rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead>
              <tr className="bg-muted/40 border-b border-border">
                <th className="px-3 py-2.5 text-left text-muted-foreground font-medium w-8">#</th>
                {cols.map(col => (
                  <th
                    key={col.key}
                    className={cn("px-3 py-2.5 text-left text-muted-foreground font-medium cursor-pointer hover:text-foreground select-none", col.width)}
                    onClick={() => handleSort(col.key)}
                    data-testid={`sort-${col.key}`}
                  >
                    <span className="inline-flex items-center gap-1">
                      {col.label}
                      <SortIcon col={col.key} sortKey={sortKey} sortDir={sortDir} />
                    </span>
                  </th>
                ))}
                <th className="px-3 py-2.5 text-left text-muted-foreground font-medium">References</th>
              </tr>
            </thead>
            <tbody>
              {paginated.map((event, idx) => {
                const cfg = getEventConfig(event.type);
                const statusCfg = getStatusConfig(event.status);
                const Icon = cfg.icon;
                const StatusIcon = statusCfg.icon;
                const links = normalizeLinks(event);
                const rowNum = (page - 1) * PAGE_SIZE + idx + 1;
                const isExpanded = expandedId === event.id;

                return (
                  <Fragment key={event.id}>
                    <tr
                      className={cn(
                        "border-b border-border/40 transition-colors cursor-pointer",
                        isExpanded ? "bg-muted/30" : "hover:bg-muted/20",
                      )}
                      onClick={() => setExpandedId(isExpanded ? null : event.id)}
                      data-testid={`audit-row-${event.id}`}
                    >
                      <td className="px-3 py-2.5 text-muted-foreground/60 tabular-nums">{rowNum}</td>
                      <td className="px-3 py-2.5 text-muted-foreground whitespace-nowrap">
                        <span title={event.timestamp}>{formatTimeAgo(event.timestamp)}</span>
                      </td>
                      <td className="px-3 py-2.5">
                        <span className={cn(
                          "inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full border text-xs font-medium",
                          cfg.bg, cfg.border, cfg.color,
                        )}>
                          <Icon className="w-2.5 h-2.5" />
                          {cfg.label}
                        </span>
                      </td>
                      <td className="px-3 py-2.5 text-foreground font-medium max-w-xs">
                        <span className="truncate block" title={event.title}>{event.title}</span>
                        {event.description && (
                          <span className="text-muted-foreground font-normal truncate block text-[10px]">{event.description}</span>
                        )}
                      </td>
                      <td className="px-3 py-2.5">
                        <span className={cn(
                          "inline-flex items-center gap-1 px-1.5 py-0.5 rounded border text-[10px] font-medium",
                          statusCfg.bg, statusCfg.border, statusCfg.color,
                        )}>
                          <StatusIcon className="w-2.5 h-2.5" />
                          {statusCfg.label}
                        </span>
                      </td>
                      <td className="px-3 py-2.5 text-muted-foreground whitespace-nowrap">{event.workflow || "—"}</td>
                      <td className="px-3 py-2.5 text-muted-foreground">{event.trigger || "—"}</td>
                      <td className="px-3 py-2.5">
                        <LinkChips links={links} size="xs" />
                      </td>
                    </tr>
                    {isExpanded && (
                      <tr key={`${event.id}-detail`} className="bg-muted/20 border-b border-border/40">
                        <td colSpan={8} className="px-4 py-3">
                          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs mb-2">
                            <div>
                              <div className="text-muted-foreground">Timestamp</div>
                              <div className="font-mono text-foreground">{formatDate(event.timestamp)}</div>
                            </div>
                            <div>
                              <div className="text-muted-foreground">Actor</div>
                              <div className="text-foreground">{event.actor || "github-actions"}</div>
                            </div>
                            <div>
                              <div className="text-muted-foreground">Event ID</div>
                              <div className="font-mono text-foreground text-[10px]">{event.id}</div>
                            </div>
                          </div>
                          {Object.keys(event.metadata ?? {}).length > 0 && (
                            <div className="bg-card rounded-lg p-2.5 font-mono text-[10px] border border-border/40">
                              {Object.entries(event.metadata).map(([k, v]) => (
                                <div key={k} className="flex gap-2">
                                  <span className="text-muted-foreground">{k}:</span>
                                  <span className="text-foreground break-all">{String(v)}</span>
                                </div>
                              ))}
                            </div>
                          )}
                        </td>
                      </tr>
                    )}
                  </Fragment>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between px-4 py-3 border-t border-border/40 bg-muted/20">
            <span className="text-xs text-muted-foreground">
              Page {page} of {totalPages} — {events.length} events
            </span>
            <div className="flex items-center gap-1">
              <Button
                variant="outline"
                size="sm"
                className="h-7 px-2 text-xs"
                onClick={() => setPage(p => Math.max(1, p - 1))}
                disabled={page === 1}
                data-testid="button-prev-page"
              >
                Previous
              </Button>
              <Button
                variant="outline"
                size="sm"
                className="h-7 px-2 text-xs"
                onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                disabled={page === totalPages}
                data-testid="button-next-page"
              >
                Next
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function EventsDashboard() {
  const [activeView, setActiveView] = useState<"timeline" | "audit">("timeline");
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

  const stats = useMemo(() => {
    const total = events.length;
    const successes = events.filter(e => e.status === "success").length;
    const failures = events.filter(e => e.status === "failed").length;
    const typeCounts: Record<string, number> = {};
    events.forEach(e => { typeCounts[e.type] = (typeCounts[e.type] ?? 0) + 1; });
    const topType = Object.entries(typeCounts).sort((a, b) => b[1] - a[1])[0];
    return { total, successes, failures, topType };
  }, [events]);

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

  const filtered = useMemo(() => {
    return events.filter(e => {
      if (activeType !== "all" && e.type !== activeType) return false;
      if (activeStatus !== "all" && e.status !== activeStatus) return false;
      return true;
    });
  }, [events, activeType, activeStatus]);

  const displayed = showAll ? filtered : filtered.slice(0, 25);

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
              Every automated job, deploy, LinkedIn post, and content run — with direct links to the output.
            </p>
            {data?.lastUpdated && (
              <p className="text-xs text-muted-foreground/60 mt-0.5 flex items-center gap-1">
                <Clock className="w-3 h-3" />
                Last updated {formatTimeAgo(data.lastUpdated)}
              </p>
            )}
          </div>
          <div className="flex items-center gap-2">
            {/* View toggle */}
            <div className="flex items-center gap-1 bg-muted/30 rounded-lg p-1 border border-border/40">
              <button
                className={cn(
                  "flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium transition-all",
                  activeView === "timeline"
                    ? "bg-background border border-border text-foreground shadow-sm"
                    : "text-muted-foreground hover:text-foreground",
                )}
                onClick={() => setActiveView("timeline")}
                data-testid="view-timeline"
              >
                <List className="w-3.5 h-3.5" />
                Timeline
              </button>
              <button
                className={cn(
                  "flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium transition-all",
                  activeView === "audit"
                    ? "bg-background border border-border text-foreground shadow-sm"
                    : "text-muted-foreground hover:text-foreground",
                )}
                onClick={() => setActiveView("audit")}
                data-testid="view-audit"
              >
                <Table2 className="w-3.5 h-3.5" />
                Audit Table
              </button>
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
          <div className="bg-card border border-border rounded-xl p-4" style={{ width: '100%', minHeight: 300 }}>
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
                        activeType === type
                          ? `${cfg.bg} ${cfg.border} ${cfg.color}`
                          : "bg-muted/30 border-border/40 text-muted-foreground hover:border-border",
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

        {/* Loading / Error states */}
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
              Events appear here automatically after each GitHub Actions workflow run — deploys, content generation, LinkedIn posts, and more.
            </p>
          </div>
        )}

        {/* ── Timeline View ──────────────────────────────────────────────────── */}
        {!isLoading && !error && !isEmpty && activeView === "timeline" && (
          <div>
            <div className="flex items-center justify-between gap-3 mb-3 flex-wrap">
              <h2 className="text-sm font-semibold text-foreground">
                Event Log
                {filtered.length > 0 && (
                  <span className="ml-2 text-muted-foreground font-normal">({filtered.length})</span>
                )}
              </h2>

              <div className="flex items-center gap-2">
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

            {filtered.length === 0 ? (
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
            ) : (
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
                    {showAll ? "Show less" : `Show all ${filtered.length} events`}
                  </Button>
                )}
              </div>
            )}
          </div>
        )}

        {/* ── Audit Table View ───────────────────────────────────────────────── */}
        {!isLoading && !error && !isEmpty && activeView === "audit" && (
          <div>
            <div className="flex items-center gap-2 mb-3">
              <h2 className="text-sm font-semibold text-foreground">Audit Table</h2>
              <Badge variant="outline" className="text-xs font-normal">
                {events.length} records
              </Badge>
            </div>
            <AuditTable events={events} />
          </div>
        )}

        {/* Footer */}
        <div className="text-xs text-muted-foreground/50 text-center pb-4">
          Events written by GitHub Actions on every workflow run and committed to{" "}
          <code className="font-mono">client/public/data/events.json</code>
        </div>
      </div>
    </AppLayout>
  );
}
