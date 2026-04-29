import { useState, useEffect } from 'react';
import { useLocation } from 'wouter';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Sparkles, Plus, RefreshCw, Rocket, Calendar,
  ChevronDown, ChevronUp, Layers, Rss, Loader2,
  Star, Zap, Target
} from 'lucide-react';
import { SEOHead } from '../components/SEOHead';
import { AppLayout } from '../components/layout/AppLayout';
import { defaultChangelog, fetchChangelog, type ChangelogData, type ChangelogEntry } from '../lib/changelog';

const typeConfig = {
  added: { icon: Plus, color: 'text-blue-600 bg-blue-50', darkBg: 'dark:bg-blue-500/20 dark:text-blue-400', label: 'New' },
  improved: { icon: RefreshCw, color: 'text-emerald-600 bg-emerald-50', darkBg: 'dark:bg-emerald-500/20 dark:text-emerald-400', label: 'Improved' },
  initial: { icon: Rocket, color: 'text-violet-600 bg-violet-50', darkBg: 'dark:bg-violet-500/20 dark:text-violet-400', label: 'Launch' },
  feature: { icon: Sparkles, color: 'text-amber-600 bg-amber-50', darkBg: 'dark:bg-amber-500/20 dark:text-amber-400', label: 'Feature' },
};

const getVersionFromDate = (dateStr: string, index: number) => {
  const date = new Date(dateStr);
  const base = 100;
  return `v${(base - index).toFixed(1)}`;
};

const isNew = (dateStr: string) => {
  const entryDate = new Date(dateStr);
  const sevenDaysAgo = new Date();
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
  return entryDate >= sevenDaysAgo;
};

function ChangelogEntryCard({ entry, index }: { entry: ChangelogEntry; index: number }) {
  const [expanded, setExpanded] = useState(index === 0);
  const config = typeConfig[entry.type] || typeConfig.added;
  const Icon = config.icon;
  const version = getVersionFromDate(entry.date, index);
  const isNewEntry = isNew(entry.date);

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-US', { 
      month: 'long', 
      day: 'numeric',
      year: 'numeric'
    });
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.04, duration: 0.3 }}
      className="group"
    >
        <div className="bg-card rounded-xl shadow-sm overflow-hidden">
        <button
          onClick={() => setExpanded(!expanded)}
          aria-expanded={expanded}
          aria-label={`${expanded ? 'Collapse' : 'Expand'} ${entry.title}`}
          className="w-full p-5 min-h-[72px] flex items-start gap-4 text-left hover:bg-accent/50 transition-colors duration-150 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
        >
          <div className={`p-2.5 rounded-xl ${config.color} ${config.darkBg} shrink-0`}>
            <Icon className="w-5 h-5" />
          </div>
          <div className="flex-1 min-w-0">
             <div className="flex items-center flex-wrap gap-2 mb-1.5">
               <span className="inline-flex items-center gap-1 px-3 py-1.5 rounded-full text-xs font-semibold bg-muted/70 text-foreground/70 border border-border">
                 <Target className="w-3 h-3" />
                 {version}
               </span>
               {isNewEntry && (
                 <span className="inline-flex items-center gap-1 px-3 py-1.5 rounded-full text-xs font-bold bg-primary text-primary-foreground">
                   <Zap className="w-3 h-3" />
                   NEW
                 </span>
               )}
               <span className={`inline-flex items-center gap-1 px-3 py-1.5 rounded-full text-xs font-semibold ${config.color} ${config.darkBg}`}>
                 {config.label}
               </span>
             </div>
             <h3 className="font-semibold text-base text-foreground">{entry.title}</h3>
             <p className="text-base text-foreground/70 mt-1.5 line-clamp-2">{entry.description}</p>
            </div>
            <div className="shrink-0 text-foreground/70">
             {expanded ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
           </div>
         </button>

         <AnimatePresence>
           {expanded && entry.details && (
             <motion.div
               initial={{ height: 0, opacity: 0 }}
               animate={{ height: 'auto', opacity: 1 }}
               exit={{ height: 0, opacity: 0 }}
               transition={{ duration: 0.2 }}
               className="border-t border-border overflow-hidden"
             >
               <div className="p-5 space-y-4 bg-muted/30">
                 <div className="flex items-center gap-2 text-xs text-foreground/70 mb-3">
                   <Calendar className="w-3.5 h-3.5" />
                   {formatDate(entry.date)}
                 </div>
                 {entry.details.questionsAdded !== undefined && entry.details.questionsAdded > 0 && (
                   <div className="flex items-center gap-3 p-3 bg-muted/50 rounded-xl border border-border">
                     <div className="p-2 rounded-lg bg-emerald-100 dark:bg-emerald-500/20">
                       <Plus className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                     </div>
                     <div>
                       <div className="text-xs uppercase tracking-widest text-foreground/70 font-medium">Questions Added</div>
                       <div className="font-bold text-emerald-600 dark:text-emerald-400 text-lg">{entry.details.questionsAdded}</div>
                     </div>
                   </div>
                 )}
                 {entry.details.questionsImproved !== undefined && entry.details.questionsImproved > 0 && (
                   <div className="flex items-center gap-3 p-3 bg-muted/50 rounded-xl border border-border">
                     <div className="p-2 rounded-lg bg-amber-100 dark:bg-amber-500/20">
                       <RefreshCw className="w-4 h-4 text-amber-600 dark:text-amber-400" />
                     </div>
                     <div>
                       <div className="text-xs uppercase tracking-widest text-foreground/70 font-medium">Questions Improved</div>
                       <div className="font-bold text-amber-600 dark:text-amber-400 text-lg">{entry.details.questionsImproved}</div>
                     </div>
                   </div>
                 )}
                 {entry.details.channels && entry.details.channels.length > 0 && (
                   <div className="p-4 bg-muted/50 rounded-xl border border-border">
                     <div className="flex items-center gap-2 text-xs text-foreground/70 mb-3">
                       <Layers className="w-4 h-4" />
                       <span className="font-medium uppercase tracking-wider">Channels</span>
                     </div>
                     <div className="flex flex-wrap gap-2">
                       {entry.details.channels.map((channel) => (
                         <span
                           key={channel}
                           className="px-3 py-1.5 bg-muted text-foreground/70 text-xs font-medium rounded-lg"
                         >
                           {channel}
                         </span>
                       ))}
                     </div>
                   </div>
                 )}
                 {entry.details.features && entry.details.features.length > 0 && (
                   <div className="p-4 bg-muted/50 rounded-xl border border-border">
                     <div className="flex items-center gap-2 text-xs text-foreground/70 mb-3">
                       <Star className="w-4 h-4" />
                       <span className="font-medium uppercase tracking-wider">Highlights</span>
                     </div>
                     <ul className="space-y-3">
                       {entry.details.features.map((feature, i) => (
                         <li key={i} className="text-base text-foreground/70 flex items-start gap-3">
                           <span className="mt-1.5 w-1.5 h-1.5 rounded-full bg-primary shrink-0"></span>
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
      </div>
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
      month: 'long', 
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const groupEntriesByDate = (entries: ChangelogEntry[]) => {
    const grouped: Record<string, ChangelogEntry[]> = {};
    entries.forEach((entry) => {
      const date = new Date(entry.date);
      const key = date.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
      if (!grouped[key]) grouped[key] = [];
      grouped[key].push(entry);
    });
    return grouped;
  };

  const grouped = groupEntriesByDate(data.entries);

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
          <div className="max-w-3xl mx-auto">
             <motion.div
               initial={{ opacity: 0, y: 10 }}
               animate={{ opacity: 1, y: 0 }}
               className="grid grid-cols-3 gap-3 mb-6"
             >
                <div className="bg-card rounded-xl p-4 text-center">
                 <div className="text-2xl font-bold text-primary">{data.stats.totalQuestionsAdded}</div>
                 <div className="text-xs uppercase tracking-widest text-foreground/70">Added</div>
               </div>
                <div className="bg-card rounded-xl p-4 text-center">
                 <div className="text-2xl font-bold text-emerald-600 dark:text-emerald-400">{data.stats.totalQuestionsImproved}</div>
                 <div className="text-xs uppercase tracking-widest text-foreground/70">Improved</div>
               </div>
                <div className="bg-card rounded-xl p-4 text-center">
                 <div className="text-2xl font-bold text-violet-600 dark:text-violet-400">{data.entries.length}</div>
                 <div className="text-xs uppercase tracking-widest text-foreground/70">Updates</div>
               </div>
             </motion.div>

            <div className="flex items-center justify-between mb-6">
              <div className="text-xs text-foreground/70">
                Last updated: {formatDate(data.stats.lastUpdated)}
              </div>
              <a
                href="/rss.xml"
                target="_blank"
                rel="noopener noreferrer"
                aria-label="Subscribe to RSS Feed"
                className="flex items-center gap-1.5 px-3 py-2 text-xs font-medium bg-muted text-foreground/70 hover:bg-muted/80 rounded-lg transition-colors duration-150 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
              >
                <Rss className="w-3.5 h-3.5" /> RSS
              </a>
            </div>

            {isLoading && (
              <div className="text-center py-12 text-foreground/70">
                <Loader2 className="min-w-[48px] w-8 min-h-[48px] h-8 mx-auto mb-4 animate-spin" />
                <p>Loading updates...</p>
              </div>
            )}

            {!isLoading && data.entries.length === 0 && (
              <div className="text-center py-12 text-foreground/70">
                <Sparkles className="min-w-[48px] w-8 min-h-[48px] h-8 mx-auto mb-4 opacity-[0.38]" />
                <p className="text-base mb-4">No updates yet. Check back soon!</p>
                <button
                  onClick={() => setLocation('/')}
                  className="px-4 py-2.5 min-h-[48px] min-h-[48px] h-10 bg-primary text-primary-foreground rounded-lg font-medium hover:bg-primary/90 transition-all duration-150 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 text-sm"
                >
                  Browse Channels
                </button>
              </div>
            )}

            {!isLoading && data.entries.length > 0 && (
              <div className="space-y-8">
                {Object.entries(grouped).map(([month, entries]) => (
                  <div key={month}>
                    <h2 className="text-sm font-semibold text-foreground mb-4 flex items-center gap-3">
                       <Calendar className="w-4 h-4 text-foreground/70" />
                       {month}
                     </h2>
                    <div className="space-y-4 pl-2">
                      {entries.map((entry, index) => {
                        const globalIndex = data.entries.findIndex(e => e.date === entry.date && e.title === entry.title);
                        return (
                          <ChangelogEntryCard key={`${entry.date}-${entry.title}`} entry={entry} index={globalIndex} />
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </AppLayout>
    </>
  );
}
