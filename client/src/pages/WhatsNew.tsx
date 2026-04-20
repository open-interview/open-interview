import { useState, useEffect } from 'react';
import { useLocation } from 'wouter';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Sparkles, Plus, RefreshCw, Rocket, Calendar,
  ChevronDown, ChevronUp, Layers, Rss, Loader2
} from 'lucide-react';
import { SEOHead } from '../components/SEOHead';
import { AppLayout } from '../components/layout/AppLayout';
import { defaultChangelog, fetchChangelog, type ChangelogData, type ChangelogEntry } from '../lib/changelog';

const typeConfig = {
  added: { icon: Plus, color: 'text-[var(--color-difficulty-beginner)]', bg: 'bg-[var(--color-difficulty-beginner)]/20', label: 'New Questions' },
  improved: { icon: RefreshCw, color: 'text-[var(--color-difficulty-intermediate)]', bg: 'bg-[var(--color-difficulty-intermediate)]/20', label: 'Improved' },
  initial: { icon: Rocket, color: 'text-[var(--color-accent-violet)]', bg: 'bg-[var(--color-accent-violet)]/20', label: 'Launch' },
  feature: { icon: Sparkles, color: 'text-[var(--color-difficulty-advanced)]', bg: 'bg-[var(--color-difficulty-advanced)]/20', label: 'Feature' },
};

function ChangelogEntryCard({ entry, index }: { entry: ChangelogEntry; index: number }) {
  const [expanded, setExpanded] = useState(index === 0);
  const config = typeConfig[entry.type] || typeConfig.added;
  const Icon = config.icon;

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-US', { 
      year: 'numeric', 
      month: 'short', 
      day: 'numeric' 
    });
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.05 }}
      className="border border-border rounded-lg overflow-hidden bg-card"
    >
      <button
        onClick={() => setExpanded(!expanded)}
        aria-expanded={expanded}
        aria-label={`${expanded ? 'Collapse' : 'Expand'} ${entry.title}`}
        className="w-full p-4 min-h-[44px] flex items-start gap-4 text-left hover:bg-muted/30 transition-colors duration-150 ease-out cursor-pointer"
      >
        <div className={`p-2 rounded-lg ${config.bg} shrink-0`}>
          <Icon className={`w-4 h-4 ${config.color}`} />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <span className={`text-[10px] uppercase tracking-widest font-bold ${config.color}`}>
              {config.label}
            </span>
            <span className="text-[10px] text-muted-foreground flex items-center gap-1">
              <Calendar className="w-3 h-3" />
              {formatDate(entry.date)}
            </span>
          </div>
          <h3 className="font-bold text-sm">{entry.title}</h3>
          <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{entry.description}</p>
        </div>
        <div className="shrink-0 text-muted-foreground">
          {expanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
        </div>
      </button>

      <AnimatePresence>
        {expanded && entry.details && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="border-t border-border overflow-hidden"
          >
            <div className="p-4 space-y-3 bg-muted/10">
              {entry.details.questionsAdded !== undefined && entry.details.questionsAdded > 0 && (
                <div className="flex items-center gap-2 text-xs">
                  <Plus className="w-3 h-3 text-[var(--color-difficulty-beginner)]" />
                  <span className="text-muted-foreground">Questions Added:</span>
                  <span className="font-bold text-[var(--color-difficulty-beginner)]">{entry.details.questionsAdded}</span>
                </div>
              )}
              {entry.details.questionsImproved !== undefined && entry.details.questionsImproved > 0 && (
                <div className="flex items-center gap-2 text-xs">
                  <RefreshCw className="w-3 h-3 text-[var(--color-difficulty-intermediate)]" />
                  <span className="text-muted-foreground">Questions Improved:</span>
                  <span className="font-bold text-[var(--color-difficulty-intermediate)]">{entry.details.questionsImproved}</span>
                </div>
              )}
              {entry.details.channels && entry.details.channels.length > 0 && (
                <div>
                  <div className="flex items-center gap-2 text-xs text-muted-foreground mb-2">
                    <Layers className="w-3 h-3" />
                    <span>Channels:</span>
                  </div>
                  <div className="flex flex-wrap gap-1">
                    {entry.details.channels.map((channel) => (
                      <span
                        key={channel}
                        className="px-2 py-0.5 bg-primary/20 text-primary text-[10px] rounded font-mono"
                      >
                        {channel}
                      </span>
                    ))}
                  </div>
                </div>
              )}
              {entry.details.features && entry.details.features.length > 0 && (
                <div>
                  <div className="flex items-center gap-2 text-xs text-muted-foreground mb-2">
                    <Sparkles className="w-3 h-3" />
                    <span>Features:</span>
                  </div>
                  <ul className="space-y-1">
                    {entry.details.features.map((feature, i) => (
                      <li key={i} className="text-xs text-muted-foreground flex items-start gap-2">
                        <span className="text-primary">•</span>
                        {feature}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

export default function WhatsNew() {
  const [, setLocation] = useLocation();
  const [data, setData] = useState<ChangelogData>(defaultChangelog);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchChangelog()
      .then(setData)
      .finally(() => setIsLoading(false));
  }, []);

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-US', { 
      year: 'numeric', 
      month: 'short', 
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <>
      <SEOHead
        title="What's New - Daily Updates & Changelog | Code Reels Interview Prep"
        description="Stay updated with daily AI-generated interview questions, improvements, and new features. See the latest additions to System Design, Algorithms, Frontend, Backend, DevOps, and AI/ML channels."
        keywords="code reels updates, changelog, new interview questions, daily updates, interview prep news, new features, AI generated questions"
        canonical="https://open-interview.github.io/whats-new"
      />
      <AppLayout title="What's New" showBackOnMobile fullWidth>
        <div className="font-mono pb-24">
          {/* RSS Link */}
          <div className="flex justify-end mb-4">
            <a
              href="/rss.xml"
              target="_blank"
              rel="noopener noreferrer"
              aria-label="Subscribe to RSS Feed"
              className="flex items-center gap-1.5 px-4 py-2.5 min-h-[44px] text-xs font-bold uppercase tracking-widest bg-[var(--color-difficulty-advanced)]/20 text-[var(--color-difficulty-advanced)] hover:bg-[var(--color-difficulty-advanced)]/30 rounded transition-colors duration-150 ease-out cursor-pointer"
            >
              <Rss className="w-3.5 h-3.5" /> RSS
            </a>
          </div>

          {/* Stats Summary */}
          <div className="max-w-4xl mx-auto">
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="grid grid-cols-3 gap-2 sm:gap-3 mb-6"
            >
              <div className="border border-border rounded-lg p-3 sm:p-4 bg-card text-center">
                <div className="text-xl sm:text-2xl font-bold text-[var(--color-difficulty-beginner)]">{data.stats.totalQuestionsAdded}</div>
                <div className="text-[10px] uppercase tracking-widest text-muted-foreground">Added</div>
              </div>
              <div className="border border-border rounded-lg p-3 sm:p-4 bg-card text-center">
                <div className="text-xl sm:text-2xl font-bold text-[var(--color-difficulty-intermediate)]">{data.stats.totalQuestionsImproved}</div>
                <div className="text-[10px] uppercase tracking-widest text-muted-foreground">Improved</div>
              </div>
              <div className="border border-border rounded-lg p-3 sm:p-4 bg-card text-center">
                <div className="text-xl sm:text-2xl font-bold text-primary">{data.entries.length}</div>
                <div className="text-[10px] uppercase tracking-widest text-muted-foreground">Updates</div>
              </div>
            </motion.div>

            <div className="text-[10px] text-muted-foreground text-center mb-6">
              Last updated: {formatDate(data.stats.lastUpdated)}
            </div>

            {/* Loading state */}
            {isLoading && (
              <div className="text-center py-12 text-muted-foreground">
                <Loader2 className="w-8 h-8 mx-auto mb-4 animate-spin" />
                <p>Loading updates...</p>
              </div>
            )}

            {/* Empty state */}
            {!isLoading && data.entries.length === 0 && (
              <div className="text-center py-12 text-muted-foreground">
                <Sparkles className="w-8 h-8 mx-auto mb-4 opacity-50" />
                <p className="text-base mb-4">No updates yet. Check back soon!</p>
                <button
                  onClick={() => setLocation('/')}
                  className="px-6 py-3 min-h-[44px] bg-primary text-primary-foreground rounded-lg font-semibold hover:bg-primary/90 transition-all duration-150 ease-out cursor-pointer"
                >
                  Browse Channels
                </button>
              </div>
            )}

            {/* Changelog Entries */}
            {!isLoading && data.entries.length > 0 && (
              <>
                <div className="space-y-3">
                  {data.entries.map((entry, index) => (
                    <ChangelogEntryCard key={`${entry.date}-${index}`} entry={entry} index={index} />
                  ))}
                </div>
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.3 }}
                  className="text-center pt-8"
                >
                  <button
                    onClick={() => setLocation('/channels')}
                    className="px-6 py-3 min-h-[44px] bg-primary text-primary-foreground rounded-lg font-bold hover:bg-primary/90 transition-all duration-150 ease-out cursor-pointer flex items-center gap-2 mx-auto"
                  >
                    <Sparkles className="w-4 h-4" /> Explore New Questions
                  </button>
                </motion.div>
              </>
            )}
          </div>
        </div>
      </AppLayout>
    </>
  );
}
