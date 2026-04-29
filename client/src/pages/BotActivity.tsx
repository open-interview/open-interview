/**
 * Bot Monitor Page - Redesigned for 3-Bot Architecture
 * 
 * Shows:
 * - Real-time bot status (Creator, Verifier, Processor)
 * - Work queue visualization
 * - Ledger browser with filters
 * - Stats: items created/verified/deleted
 */

import { useState, useEffect, useCallback } from "react";
import { useLocation } from "wouter";
import { 
  Bot, Sparkles, CheckCircle, RefreshCw,
  Activity, Clock, Trash2, FileText, ListTodo, History, Zap, Eye, Wrench,
  ExternalLink, Code, HelpCircle, Mic, Filter, Check
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { SEOHead } from "../components/SEOHead";
import { AppLayout } from "../components/layout/AppLayout";
import { MetricCard } from "../components/unified";
import { EmptyState } from "../components/unified/EmptyState";
import { cn } from "../lib/utils";

// Types
interface BotRun {
  id: number;
  botName: string;
  startedAt: string;
  completedAt: string | null;
  status: 'running' | 'completed' | 'failed';
  itemsProcessed: number;
  itemsCreated: number;
  itemsUpdated: number;
  itemsDeleted: number;
  summary: any;
}

interface WorkItem {
  id: number;
  itemType: string;
  itemId: string;
  action: string;
  priority: number;
  status: string;
  reason: string;
  createdBy: string;
  createdAt: string;
}

interface LedgerEntry {
  id: number;
  botName: string;
  action: string;
  itemType: string;
  itemId: string;
  reason: string;
  createdAt: string;
}

interface BotStats {
  botName: string;
  totalRuns: number;
  successfulRuns: number;
  totalCreated: number;
  totalUpdated: number;
  totalDeleted: number;
  lastRun: string;
}


// Bot configurations for the 3-bot architecture
const BOT_CONFIG: Record<string, { 
  name: string; 
  icon: typeof Bot; 
  color: string; 
  description: string;
  gradient: string;
}> = {
  'creator': { 
    name: 'Creator Bot', 
    icon: Sparkles, 
    color: 'text-primary bg-primary/10 border-primary/30',
    gradient: 'from-primary to-blue-500',
    description: 'Creates questions, challenges, voice keywords'
  },
  'verifier': { 
    name: 'Verifier Bot', 
    icon: Eye, 
    color: 'text-orange-500 bg-orange-500/10 border-orange-500/30',
    gradient: 'from-orange-500 to-orange-600',
    description: 'Quality checks, detects issues, flags content'
  },
  'processor': { 
    name: 'Processor Bot', 
    icon: Wrench, 
    color: 'text-primary bg-primary/10 border-primary/30',
    gradient: 'from-primary to-pink-500',
    description: 'Improves or deletes flagged content'
  }
};

function getBotConfig(botName: string) {
  return BOT_CONFIG[botName] || { 
    name: botName, 
    icon: Bot, 
    color: 'text-gray-500 bg-gray-500/10 border-gray-500/30',
    gradient: 'from-gray-500 to-gray-600',
    description: 'Unknown bot'
  };
}

function formatTimeAgo(dateStr: string): string {
  if (!dateStr) return 'never';
  const date = new Date(dateStr);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 1) return 'just now';
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays < 7) return `${diffDays}d ago`;
  return date.toLocaleDateString();
}

// Generate link to view an item based on its type and ID
function getItemLink(itemType: string, itemId: string): string | null {
  if (!itemId) return null;
  
  // Extract channel from question ID (e.g., "q-123" -> need to look up, or use pattern)
  // For now, link to search or direct question view
  switch (itemType) {
    case 'question':
      // Questions can be viewed via search or direct link
      // Format: /channel/{channel}?q={questionId}
      // Since we don't know the channel, link to home with search
      return `/?search=${encodeURIComponent(itemId)}`;
    case 'challenge':
      return `/coding/${itemId}`;
    case 'test':
      return `/tests`;
    case 'voice_keyword':
      return `/voice-interview`;
    default:
      return null;
  }
}

// Get icon for item type
function getItemTypeIcon(itemType: string) {
  switch (itemType) {
    case 'question':
      return <HelpCircle className="w-3 h-3" />;
    case 'challenge':
      return <Code className="w-3 h-3" />;
    case 'test':
      return <FileText className="w-3 h-3" />;
    case 'voice_keyword':
      return <Mic className="w-3 h-3" />;
    default:
      return <FileText className="w-3 h-3" />;
  }
}

// Clickable item ID component
function ItemLink({ itemType, itemId, className }: { itemType: string; itemId: string; className?: string }) {
  const [, setLocation] = useLocation();
  const link = getItemLink(itemType, itemId);
  
  if (!link) {
    return <span className={className}>{itemId}</span>;
  }
  
  return (
    <button
      onClick={() => setLocation(link)}
      className={cn(
        "inline-flex items-center gap-1 px-3 py-1.5 bg-primary/10 hover:bg-primary/20 text-primary rounded-lg text-xs font-mono transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
        className
      )}
      title={`View ${itemType}: ${itemId}`}
    >
      {getItemTypeIcon(itemType)}
      <span className="truncate max-w-[120px]">{itemId}</span>
      <ExternalLink className="w-2.5 h-2.5 opacity-60" />
    </button>
  );
}

const statusColorClasses: Record<string, string> = {
  completed: 'bg-green-500',
  running: 'bg-blue-500',
  failed: 'bg-red-500',
  pending: 'bg-yellow-500',
  processing: 'bg-blue-500',
  delete: 'bg-red-500',
  improve: 'bg-blue-500',
  verify: 'bg-green-500',
  create: 'bg-blue-500',
  update: 'bg-blue-500',
};

function StatusDot({ status }: { status: string }) {
  const colorClass = statusColorClasses[status] || 'bg-yellow-500';
  return (
    <span className={cn("w-2 h-2 rounded-full", colorClass)} />
  );
}

function TimelineItem({ children, last = false }: { children: React.ReactNode; last?: boolean }) {
  return (
    <div className="flex gap-4">
      <div className="flex flex-col items-center">
        <div className="min-w-[48px] w-8 min-h-[48px] h-8 rounded-full bg-card border-2 border-border flex items-center justify-center z-10">
          {children}
        </div>
        {!last && <div className="w-0.5 flex-1 bg-border/50" />}
      </div>
    </div>
  );
}

function ActivityCard({ 
  icon: Icon, 
  title, 
  subtitle, 
  status, 
  time,
  action,
  itemLink,
  details 
}: { 
  icon: React.ElementType; 
  title: string; 
  subtitle?: string; 
  status?: string; 
  time: string;
  action?: React.ReactNode;
  itemLink?: React.ReactNode;
  details?: React.ReactNode;
}) {
  return (
    <div className="flex gap-3 py-3">
      <div className="flex flex-col items-center">
        <div className="w-9 h-9 rounded-full bg-primary/10 flex items-center justify-center">
          <Icon className="w-4 h-4 text-primary" />
        </div>
      </div>
      <div className="flex-1 pb-4 border-b border-border/50">
        <div className="flex items-start justify-between gap-2">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="font-medium text-sm text-foreground">{title}</span>
              {status && (
                <span className="flex items-center gap-1.5 text-xs">
                  <StatusDot status={status} />
                  <span className="text-foreground/70 capitalize">{status}</span>
                </span>
              )}
            </div>
            {subtitle && (
              <p className="text-xs text-foreground/70 mt-1 line-clamp-1">{subtitle}</p>
            )}
            {details && <div className="mt-2">{details}</div>}
          </div>
          <div className="text-right flex-shrink-0">
            <span className="text-xs text-foreground/70 font-medium">{time}</span>
          </div>
        </div>
        {itemLink && <div className="mt-2">{itemLink}</div>}
        {action && <div className="mt-2">{action}</div>}
      </div>
    </div>
  );
}

function FilterChip({ active, onClick, label }: { active: boolean; onClick: () => void; label: string }) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "text-xs px-3 py-1.5 rounded-full transition-all duration-150 cursor-pointer flex items-center gap-1.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
        active 
          ? "bg-primary text-primary-foreground" 
          : "bg-muted/50 text-foreground/70 hover:bg-muted hover:text-foreground"
      )}
    >
      {active && <Check className="w-3 h-3" />}
      {label}
    </button>
  );
}

function renderQueueItem(item: WorkItem, i: number, filter: string) {
  const filtered = workQueue.filter(w => filter === 'all' || w.status === filter).slice(0, 20);
  const isLast = i === filtered.length - 1;
  
  const getActionIcon = () => {
    if (item.action === 'delete') return <Trash2 className="w-4 h-4" />;
    if (item.action === 'improve') return <Zap className="w-4 h-4" />;
    return <Eye className="w-4 h-4" />;
  };
  const actionColors: Record<string, string> = {
    delete: 'bg-rose-500/10 text-rose-500',
    improve: 'bg-blue-500/10 text-blue-500',
    verify: 'bg-emerald-500/10 text-emerald-500',
  };
  
  return (
    <div key={item.id || i} className="flex gap-3">
      <div className="flex flex-col items-center">
        <div className={cn(
          "w-9 h-9 rounded-full flex items-center justify-center",
          actionColors[item.action] || 'bg-muted text-foreground/70'
        )}>
          {getActionIcon()}
        </div>
        {!isLast && <div className="w-0.5 flex-1 bg-border/30 min-h-[60px]" />}
      </div>
      <div className="flex-1 pb-4">
        <div className="flex items-start justify-between gap-2">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="font-medium text-sm text-foreground capitalize">{item.action}</span>
              <span className="text-xs text-foreground/70">{item.itemType}</span>
              <ItemLink itemType={item.itemType} itemId={item.itemId} />
              <span className="flex items-center gap-1.5 text-xs">
                <StatusDot status={item.status} />
                <span className="text-foreground/70 capitalize">{item.status}</span>
              </span>
            </div>
            {(item.reason || item.priority) && (
              <div className="flex items-center gap-3 mt-2">
                {item.reason && (
                  <p className="text-xs text-foreground/70 truncate max-w-[300px]">
                    {item.reason}
                  </p>
                )}
                {item.priority && (
                  <span className="text-xs px-3 py-1.5 bg-muted rounded-full text-foreground/70">
                    P{item.priority}
                  </span>
                )}
              </div>
            )}
          </div>
          <span className="text-xs text-foreground/70 font-medium whitespace-nowrap">
            {formatTimeAgo(item.createdAt)}
          </span>
        </div>
      </div>
    </div>
  );
}

function renderLedgerItem(entry: LedgerEntry, i: number, items: LedgerEntry[]) {
  const config = getBotConfig(entry.botName);
  const Icon = config.icon;
  const isLast = i === items.length - 1;
  
  return (
    <div key={entry.id || i} className="flex gap-3">
      <div className="flex flex-col items-center">
        <div className={cn(
          "w-9 h-9 rounded-full flex items-center justify-center",
          config.color
        )}>
          <Icon className="w-4 h-4" />
        </div>
        {!isLast && <div className="w-0.5 flex-1 bg-border/30 min-h-[60px]" />}
      </div>
      <div className="flex-1 pb-4">
        <div className="flex items-start justify-between gap-2">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="font-medium text-sm text-foreground">{config.name}</span>
              <span className="flex items-center gap-1.5 text-xs">
                <StatusDot status={entry.action} />
                <span className="text-foreground/70 capitalize">{entry.action}</span>
              </span>
              <span className="text-xs text-foreground/70">{entry.itemType}</span>
              <ItemLink itemType={entry.itemType} itemId={entry.itemId} />
            </div>
            <div className="text-xs text-foreground/70 mt-1 truncate max-w-[300px]">
              {entry.reason || `${entry.action} ${entry.itemId}`}
            </div>
          </div>
          <span className="text-xs text-foreground/70 font-medium whitespace-nowrap">
            {formatTimeAgo(entry.createdAt)}
          </span>
        </div>
      </div>
    </div>
  );
}

// Tab component
function Tab({ active, onClick, children, icon: Icon, count }: { 
  active: boolean; 
  onClick: () => void; 
  children: React.ReactNode;
  icon: typeof Bot;
  count?: number;
}) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "flex items-center gap-2 px-4 min-h-[48px] text-sm font-medium rounded-full transition-all duration-150 cursor-pointer whitespace-nowrap focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
        active 
          ? "bg-primary text-primary-foreground shadow-sm" 
          : "text-foreground/70 hover:bg-muted hover:text-foreground"
      )}
    >
      <Icon className="w-4 h-4" />
      {children}
        {typeof count === 'number' && count > 0 && (
          <span className={cn(
            "text-xs px-1.5 py-0.5 rounded-full",
            active ? "bg-primary-foreground/20" : "bg-muted text-foreground/70"
          )}>
            {count}
          </span>
        )}
    </button>
  );
}


export default function BotActivity() {
  const [activeTab, setActiveTab] = useState<'overview' | 'queue' | 'ledger'>('overview');
  const [botStats, setBotStats] = useState<BotStats[]>([]);
  const [recentRuns, setRecentRuns] = useState<BotRun[]>([]);
  const [workQueue, setWorkQueue] = useState<WorkItem[]>([]);
  const [ledger, setLedger] = useState<LedgerEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [fetchError, setFetchError] = useState(false);
  const [selectedBot, setSelectedBot] = useState<string>('all');

  const fetchData = useCallback(async () => {
    try {
      setFetchError(false);
      const res = await fetch('/data/bot-monitor.json');
      if (res.ok) {
        const data = await res.json();
        setBotStats(data.stats || []);
        setRecentRuns(data.runs || []);
        setWorkQueue(data.queue || []);
        setLedger(data.ledger || []);
      } else {
        setFetchError(true);
      }
    } catch (error) {
      console.error('Failed to fetch bot data:', error);
      setFetchError(true);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleRefresh = () => {
    setRefreshing(true);
    fetchData();
  };

  // Calculate totals
  const totalCreated = botStats.reduce((sum, s) => sum + (s.totalCreated || 0), 0);
  const totalUpdated = botStats.reduce((sum, s) => sum + (s.totalUpdated || 0), 0);
  const totalDeleted = botStats.reduce((sum, s) => sum + (s.totalDeleted || 0), 0);
  const pendingQueue = workQueue.filter(w => w.status === 'pending').length;

  return (
    <>
      <SEOHead 
        title="Bot Monitor - AI Content Pipeline | Interview Prep" 
        description="Monitor the 3-bot AI pipeline: Creator, Verifier, and Processor bots working together to maintain high-quality interview content."
        canonical="https://open-interview.github.io/bot-activity"
      />
      <AppLayout title="Bot Monitor" showBackOnMobile fullWidth>
        <div className="max-w-6xl mx-auto pb-24">
          {/* Header - Desktop only since AppLayout handles mobile */}
          <header className="hidden lg:flex items-center justify-between mb-6">
            <h1 className="text-xl font-bold flex items-center gap-2">
              <Bot className="w-5 h-5 text-primary" />
              Bot Monitor
            </h1>
            <button 
              onClick={handleRefresh}
              disabled={refreshing}
              className="min-w-[48px] min-h-[48px] flex items-center justify-center hover:bg-muted rounded-lg disabled:opacity-[0.38] transition-colors duration-150 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              <RefreshCw className={cn("w-4 h-4", refreshing && "animate-spin")} />
            </button>
          </header>
          
          {/* Mobile refresh button */}
          <div className="lg:hidden flex justify-end mb-4">
            <button 
              onClick={handleRefresh}
              disabled={refreshing}
              className="min-w-[48px] min-h-[48px] flex items-center justify-center hover:bg-muted rounded-lg disabled:opacity-[0.38] transition-colors duration-150 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              <RefreshCw className={cn("w-4 h-4", refreshing && "animate-spin")} />
            </button>
          </div>

          {/* Bot Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            {Object.entries(BOT_CONFIG).map(([key, config], i) => {
              const stats = botStats.find(s => s.botName === key);
              const Icon = config.icon;
              return (
                <motion.div
                  key={key}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.1 }}
                  className={cn(
                    "relative overflow-hidden rounded-2xl border p-4",
                    config.color
                  )}
                >
                  <div className={cn(
                    "absolute top-0 right-0 w-32 h-32 opacity-10 blur-2xl rounded-full bg-gradient-to-br",
                    config.gradient
                  )} />
                  <div className="relative">
                    <div className="flex items-center gap-3 mb-3">
                      <div className={cn(
                        "min-w-[48px] w-10 min-h-[48px] h-10 rounded-2xl flex items-center justify-center bg-gradient-to-br",
                        config.gradient
                      )}>
                        <Icon className="w-5 h-5 text-white" />
                      </div>
                      <div>
                        <h3 className="font-semibold">{config.name}</h3>
                        <p className="text-xs text-foreground/70">{config.description}</p>
                      </div>
                    </div>
                    <div className="grid grid-cols-3 gap-2 text-center">
                      <div>
                        <div className="text-lg font-bold">{stats?.totalRuns || 0}</div>
                        <div className="text-xs text-foreground/70 uppercase">Runs</div>
                      </div>
                      <div>
                        <div className="text-lg font-bold text-emerald-500">
                          {stats?.successfulRuns || 0}
                        </div>
                        <div className="text-xs text-foreground/70 uppercase">Success</div>
                      </div>
                      <div>
                        <div className="text-lg font-bold">
                          {key === 'creator' ? stats?.totalCreated || 0 : 
                           key === 'verifier' ? workQueue.filter(w => w.createdBy === 'verifier').length :
                           stats?.totalUpdated || 0}
                        </div>
                        <div className="text-xs text-foreground/70 uppercase">
                          {key === 'creator' ? 'Created' : key === 'verifier' ? 'Flagged' : 'Fixed'}
                        </div>
                      </div>
                    </div>
                    <div className="mt-3 pt-3 border-t border-current/10 text-xs text-foreground/70">
                      Last run: {formatTimeAgo(stats?.lastRun || '')}
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </div>

          {/* Stats Summary */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
            <MetricCard
              icon={<Sparkles className="w-4 h-4" />}
              value={totalCreated}
              label="Created"
              variant="info"
              size="md"
              animated={true}
            />
            
            <MetricCard
              icon={<Zap className="w-4 h-4" />}
              value={totalUpdated}
              label="Updated"
              variant="default"
              size="md"
              animated={true}
            />
            
            <MetricCard
              icon={<Trash2 className="w-4 h-4" />}
              value={totalDeleted}
              label="Deleted"
              variant="danger"
              size="md"
              animated={true}
            />
            
            <MetricCard
              icon={<ListTodo className="w-4 h-4" />}
              value={pendingQueue}
              label="Pending"
              variant="warning"
              size="md"
              animated={true}
            />
          </div>

          {/* Tabs */}
          <div className="flex items-center gap-2 mb-4 overflow-x-auto pb-1 scrollbar-hide">
            <div className="flex gap-1.5">
              <Tab active={activeTab === 'overview'} onClick={() => setActiveTab('overview')} icon={Activity} count={recentRuns.length}>
                Recent Runs
              </Tab>
              <Tab active={activeTab === 'queue'} onClick={() => setActiveTab('queue')} icon={ListTodo} count={pendingQueue}>
                Work Queue
              </Tab>
              <Tab active={activeTab === 'ledger'} onClick={() => setActiveTab('ledger')} icon={History} count={ledger.length}>
                Audit Ledger
              </Tab>
            </div>
          </div>

          {/* Tab Content */}
          <AnimatePresence mode="wait">
            {activeTab === 'overview' && (
              <motion.div
                key="overview"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="bg-card border border-border rounded-2xl overflow-hidden"
              >
                <div className="p-4 border-b border-border/50 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Clock className="w-4 h-4 text-primary" />
                    <span className="font-medium text-sm">Recent Bot Runs</span>
                  </div>
                  <Filter className="w-4 h-4 text-foreground/70" />
                </div>
                <div className="p-4">
                  {loading ? (
                    <div className="p-6 text-center">
                      <RefreshCw className="w-6 h-6 animate-spin mx-auto text-primary mb-2" />
                      <p className="text-sm text-foreground/70">Loading...</p>
                    </div>
                  ) : fetchError ? (
                    <EmptyState
                      variant="error"
                      icon={<Bot className="w-6 h-6" />}
                      title="Failed to load activity"
                      description="Could not fetch bot run data."
                      action={
                        <button
                          onClick={handleRefresh}
                          className="px-4 min-h-[48px] text-sm font-medium bg-primary text-primary-foreground rounded-lg hover:opacity-90 transition-opacity duration-150 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                        >
                          Try again
                        </button>
                      }
                    />
                  ) : recentRuns.length === 0 ? (
                    <EmptyState
                      icon={<Bot className="w-6 h-6" />}
                      title="No activity yet"
                      description="Bot activity will appear here once bots run."
                    />
                  ) : (
                    <div className="relative">
                      {recentRuns.slice(0, 10).map((run, i) => {
                        const config = getBotConfig(run.botName);
                        const Icon = config.icon;
                        const isLast = i === recentRuns.slice(0, 10).length - 1;
                        return (
                          <div key={run.id || i} className="flex gap-3">
                            <div className="flex flex-col items-center">
                              <div className={cn(
                                "w-9 h-9 rounded-full flex items-center justify-center",
                                config.color
                              )}>
                                <Icon className="w-4 h-4" />
                              </div>
                              {!isLast && <div className="w-0.5 flex-1 bg-border/30 min-h-[60px]" />}
                            </div>
                             <div className="flex-1 pb-4">
                              <div className="flex items-start justify-between gap-2">
                                <div className="flex-1">
                                  <div className="flex items-center gap-2">
                                    <span className="font-medium text-sm text-foreground">{config.name}</span>
                                    <span className="flex items-center gap-1.5 text-xs">
                                      <StatusDot status={run.status} />
                                      <span className="text-foreground/70 capitalize">{run.status}</span>
                                    </span>
                                  </div>
                                  <div className="flex items-center gap-3 mt-2 text-xs text-foreground/70">
                                    <span className="flex items-center gap-1">
                                      <span className="font-medium text-foreground">{run.itemsProcessed}</span>
                                      <span>processed</span>
                                    </span>
                                    <span className="flex items-center gap-1">
                                      <span className="font-medium text-emerald-500">{run.itemsCreated}</span>
                                      <span>created</span>
                                    </span>
                                    <span className="flex items-center gap-1">
                                      <span className="font-medium text-blue-500">{run.itemsUpdated}</span>
                                      <span>updated</span>
                                    </span>
                                    <span className="flex items-center gap-1">
                                      <span className="font-medium text-rose-500">{run.itemsDeleted}</span>
                                      <span>deleted</span>
                                    </span>
                                  </div>
                                </div>
                                <span className="text-xs text-foreground/70 font-medium whitespace-nowrap">
                                  {formatTimeAgo(run.startedAt)}
                                </span>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              </motion.div>
            )}

            {activeTab === 'queue' && (
              <motion.div
                key="queue"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="bg-card border border-border rounded-2xl overflow-hidden"
              >
                <div className="p-4 border-b border-border/50 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <ListTodo className="w-4 h-4 text-primary" />
                    <span className="font-medium text-sm">Work Queue</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <FilterChip active={selectedBot === 'all'} onClick={() => setSelectedBot('all')} label="All" />
                    <FilterChip active={selectedBot === 'pending'} onClick={() => setSelectedBot('pending')} label="Pending" />
                    <FilterChip active={selectedBot === 'processing'} onClick={() => setSelectedBot('processing')} label="Processing" />
                    <FilterChip active={selectedBot === 'completed'} onClick={() => setSelectedBot('completed')} label="Done" />
                  </div>
                </div>
                <div className="p-4">
                  {workQueue.length === 0 ? (
                    <div className="p-6 text-center">
                      <CheckCircle className="min-w-[48px] w-8 min-h-[48px] h-8 mx-auto text-emerald-500 mb-2" />
                      <p className="text-sm text-foreground/70 font-medium">Queue is empty</p>
                      <p className="text-xs text-foreground/70 mt-1">All tasks completed</p>
                    </div>
                  ) : (
                    <div className="relative">
                      {workQueue
                        .filter(w => selectedBot === 'all' || w.status === selectedBot)
                        .slice(0, 20)
                        .map((item, i) => renderQueueItem(item, i, selectedBot))}
                    </div>
                  )}
                </div>
              </motion.div>
            )}

            {activeTab === 'ledger' && (
              <motion.div
                key="ledger"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="bg-card border border-border rounded-2xl overflow-hidden"
              >
                <div className="p-4 border-b border-border/50 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <History className="w-4 h-4 text-primary" />
                    <span className="font-medium text-sm">Audit Ledger</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <FilterChip active={selectedBot === 'all'} onClick={() => setSelectedBot('all')} label="All" />
                    <FilterChip active={selectedBot === 'completed'} onClick={() => setSelectedBot('completed')} label="Completed" />
                    <FilterChip active={selectedBot === 'failed'} onClick={() => setSelectedBot('failed')} label="Failed" />
                  </div>
                </div>
                <div className="p-4">
                  {ledger.length === 0 ? (
                    <div className="p-6 text-center">
                      <FileText className="min-w-[48px] w-8 min-h-[48px] h-8 mx-auto text-foreground/70 mb-2" />
                      <p className="text-sm text-foreground/70 font-medium">No ledger entries yet</p>
                      <p className="text-xs text-foreground/70 mt-1">Activity will appear here once bots run</p>
                    </div>
                  ) : (
                    <div className="relative">
                      {ledger.slice(0, 30).map((entry, i) => renderLedgerItem(entry, i, ledger.slice(0, 30)))}
                    </div>
                  )}
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Pipeline Info */}
          <motion.div 
            initial={{ opacity: 0 }} 
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5 }}
            className="mt-6 p-4 bg-card border border-border/50 rounded-2xl"
          >
            <div className="flex items-center gap-2 mb-3">
              <Activity className="w-4 h-4 text-primary" />
              <span className="font-medium text-sm">3-Bot Pipeline</span>
            </div>
            <div className="flex items-center gap-2 text-sm text-foreground/70 mb-3">
              <span className="flex items-center gap-1.5">
                <div className="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center">
                  <Sparkles className="w-3 h-3 text-primary" />
                </div>
                <span>Creator</span>
              </span>
              <span className="text-foreground/40">→</span>
              <span className="flex items-center gap-1.5">
                <div className="w-6 h-6 rounded-full bg-orange-500/10 flex items-center justify-center">
                  <Eye className="w-3 h-3 text-orange-500" />
                </div>
                <span>Verifier</span>
              </span>
              <span className="text-foreground/40">→</span>
              <span className="flex items-center gap-1.5">
                <div className="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center">
                  <Wrench className="w-3 h-3 text-primary" />
                </div>
                <span>Processor</span>
              </span>
            </div>
            <p className="text-xs text-foreground/70">
              Creator generates content → Verifier checks quality and flags issues → Processor improves or removes flagged content
            </p>
          </motion.div>
        </div>
      </AppLayout>
    </>
  );
}
