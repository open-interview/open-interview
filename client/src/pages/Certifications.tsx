/**
 * Certifications — Material Design 3 revamp
 * Provider sections, M3 elevated cards, filter chips, stats bar, search, skeletons
 * All existing data fetching and routing preserved.
 */

import { useState, useEffect, useMemo } from 'react';
import { useLocation } from 'wouter';
import { motion, AnimatePresence } from 'framer-motion';
import { AppLayout } from '../components/layout/AppLayout';
import { SEOHead } from '../components/SEOHead';
import { Search, Award, BookOpen, X, Check, Plus } from 'lucide-react';
import { useUserPreferences } from '../context/UserPreferencesContext';
import { getRoleCertPriority } from '../lib/personalization';
import { Progress } from '@/components/ui/progress';
import { Skeleton } from '@/components/ui/skeleton';
import { Empty, EmptyHeader, EmptyMedia, EmptyTitle, EmptyDescription, EmptyContent } from '@/components/ui/empty';
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert';

// ── Types ─────────────────────────────────────────────────────────────────────

interface Certification {
  id: string;
  name: string;
  provider: string;
  description: string;
  icon: string;
  color: string;
  difficulty: 'beginner' | 'intermediate' | 'advanced' | 'expert';
  category: string;
  estimatedHours: number;
  examCode?: string;
  questionCount: number;
  passingScore: number;
  examDuration: number;
}

// ── Provider config ───────────────────────────────────────────────────────────

const PROVIDER_META: Record<string, { label: string; emoji: string; order: number; tonal: string; onTonal: string }> = {
  AWS:        { label: 'Amazon Web Services', emoji: '☁️', order: 1, tonal: 'bg-orange-100 dark:bg-orange-950', onTonal: 'text-orange-700 dark:text-orange-300' },
  Kubernetes: { label: 'Kubernetes',          emoji: '⚙️', order: 2, tonal: 'bg-violet-100 dark:bg-violet-950', onTonal: 'text-violet-700 dark:text-violet-300' },
  HashiCorp:  { label: 'HashiCorp',           emoji: '🔷', order: 3, tonal: 'bg-muted',                        onTonal: 'text-foreground/80' },
  GCP:        { label: 'Google Cloud',        emoji: '🌐', order: 4, tonal: 'bg-blue-100 dark:bg-blue-950',    onTonal: 'text-blue-700 dark:text-blue-300' },
  Azure:      { label: 'Microsoft Azure',     emoji: '🔵', order: 5, tonal: 'bg-sky-100 dark:bg-sky-950',      onTonal: 'text-sky-700 dark:text-sky-300' },
  Linux:      { label: 'Linux / Docker',      emoji: '🐧', order: 6, tonal: 'bg-yellow-100 dark:bg-yellow-950',onTonal: 'text-yellow-700 dark:text-yellow-300' },
  CompTIA:    { label: 'CompTIA',             emoji: '🛡️', order: 7, tonal: 'bg-red-100 dark:bg-red-950',      onTonal: 'text-red-700 dark:text-red-300' },
  Databricks: { label: 'Data & Analytics',    emoji: '📊', order: 8, tonal: 'bg-emerald-100 dark:bg-emerald-950', onTonal: 'text-emerald-700 dark:text-emerald-300' },
  Security:   { label: 'Security',            emoji: '🔒', order: 9, tonal: 'bg-red-100 dark:bg-red-950',      onTonal: 'text-red-700 dark:text-red-300' },
  TensorFlow: { label: 'AI / ML',             emoji: '🤖', order: 10, tonal: 'bg-purple-100 dark:bg-purple-950', onTonal: 'text-purple-700 dark:text-purple-300' },
};

function getProviderMeta(provider: string) {
  return PROVIDER_META[provider] ?? { label: provider, emoji: '📋', order: 99, tonal: 'bg-muted', onTonal: 'text-foreground/80' };
}

// ── Data hook ─────────────────────────────────────────────────────────────────

function useCertifications() {
  const [certifications, setCertifications] = useState<Certification[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  const load = async () => {
    setLoading(true);
    setError(false);
    try {
      const base = import.meta.env.BASE_URL || '/';
      const res = await fetch(`${base}data/certifications.json`);
      if (!res.ok) throw new Error('Failed to fetch');
      setCertifications(await res.json());
    } catch (e) {
      console.error('Failed to load certifications:', e);
      setError(true);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);
  return { certifications, loading, error, refetch: load };
}

// ── Skeleton cards ────────────────────────────────────────────────────────────

function CertCardSkeleton() {
  return (
    <div className="flex items-center gap-4 p-4 rounded-2xl bg-card border border-border shadow-sm">
      <Skeleton className="min-w-[48px] w-10 min-h-[48px] h-10 rounded-xl flex-shrink-0" />
      <div className="flex-1 space-y-2 min-w-0">
        <Skeleton className="h-4 w-3/4" />
        <Skeleton className="h-3 w-1/3" />
        <Skeleton className="h-1.5 w-full rounded-full" />
      </div>
      <Skeleton className="h-9 w-16 rounded-full flex-shrink-0" />
    </div>
  );
}

function SkeletonSection() {
  return (
    <div className="mb-8">
      <Skeleton className="h-6 w-40 mb-4 rounded-lg" />
      <div className="space-y-3">
        {Array.from({ length: 4 }).map((_, i) => <CertCardSkeleton key={i} />)}
      </div>
    </div>
  );
}

// ── Cert Card (M3 elevated, horizontal) ──────────────────────────────────────

function CertCard({
  cert,
  isStarted,
  progress,
  onStart,
  onNavigate,
}: {
  cert: Certification;
  isStarted: boolean;
  progress: number;
  onStart: () => void;
  onNavigate: () => void;
}) {
  const meta = getProviderMeta(cert.provider);

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.2, ease: [0.2, 0, 0, 1] }}
      className={`flex items-center gap-4 p-4 rounded-2xl border shadow-sm transition-colors duration-200 ${
        isStarted
          ? 'bg-[var(--md-sys-color-primary-container)] border-[var(--md-sys-color-primary)]/20'
          : 'bg-[var(--md-sys-color-surface-container)] border-[var(--md-sys-color-outline-variant)] hover:shadow-md'
      }`}
      role="article"
      aria-label={cert.name}
    >
      {/* Provider icon — 40dp tonal container */}
      <div className={`min-w-[48px] w-10 min-h-[48px] h-10 rounded-xl flex-shrink-0 flex items-center justify-center text-lg ${meta.tonal}`} aria-hidden="true">
        {meta.emoji}
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0">
        {/* Title Small */}
        <p className="text-sm font-semibold leading-tight truncate text-[var(--md-sys-color-on-surface)]">{cert.name}</p>
        {/* Body Small */}
        <p className="text-xs text-[var(--md-sys-color-on-surface-variant)] mt-0.5">{cert.questionCount} questions</p>
        {/* M3 linear progress */}
        <div className="mt-2">
          <Progress value={progress} className="h-1.5" />
        </div>
        {progress > 0 && (
          <p className="text-[10px] text-[var(--md-sys-color-on-surface-variant)] mt-0.5">{progress}% complete</p>
        )}
      </div>

      {/* Start / Continue button — filled tonal */}
      <button
        onClick={isStarted ? onNavigate : onStart}
        aria-label={isStarted ? `Continue ${cert.name}` : `Start ${cert.name}`}
        className={`flex-shrink-0 min-h-[48px] px-4 rounded-full text-xs font-semibold transition-all duration-200 ease-out focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-[var(--md-sys-color-primary)]/50 ${
          isStarted
            ? 'bg-[var(--md-sys-color-primary)] text-[var(--md-sys-color-on-primary)] hover:opacity-90'
            : `${meta.tonal} ${meta.onTonal} hover:opacity-80`
        }`}
      >
        {isStarted ? 'Continue' : 'Start'}
      </button>
    </motion.div>
  );
}

// ── Provider Section ──────────────────────────────────────────────────────────

function ProviderSection({
  provider,
  certs,
  startedCerts,
  onStart,
  onNavigate,
}: {
  provider: string;
  certs: Certification[];
  startedCerts: Set<string>;
  onStart: (id: string) => void;
  onNavigate: (id: string) => void;
}) {
  const meta = getProviderMeta(provider);

  return (
    <section className="mb-8" aria-label={`${meta.label} certifications`}>
      {/* Title Medium */}
      <h2 className="text-[var(--md-sys-typescale-title-medium-size,1.125rem)] font-[var(--md-sys-typescale-title-medium-weight,500)] leading-[var(--md-sys-typescale-title-medium-line-height,1.33)] text-[var(--md-sys-color-on-surface)] mb-3 flex items-center gap-2">
        <span aria-hidden="true">{meta.emoji}</span>
        <span>{meta.label}</span>
        <span className="text-xs font-normal text-[var(--md-sys-color-on-surface-variant)]">({certs.length})</span>
      </h2>
      <div className="space-y-3" role="list" aria-label={`${provider} certification list`}>
        {certs.map(cert => (
          <div key={cert.id} role="listitem">
            <CertCard
              cert={cert}
              isStarted={startedCerts.has(cert.id)}
              progress={startedCerts.has(cert.id) ? 33 : 0}
              onStart={() => onStart(cert.id)}
              onNavigate={() => onNavigate(cert.id)}
            />
          </div>
        ))}
      </div>
    </section>
  );
}

// ── Main Page ─────────────────────────────────────────────────────────────────

export default function CertificationsPage() {
  const [, navigate] = useLocation();
  const { certifications, loading, error, refetch } = useCertifications();
  const [searchQuery, setSearchQuery] = useState('');
  const [activeProvider, setActiveProvider] = useState<string>('');
  const [startedCerts, setStartedCerts] = useState<Set<string>>(new Set());
  const { preferences, toggleSubscription } = useUserPreferences();

  useEffect(() => {
    try {
      const saved = localStorage.getItem('startedCertifications');
      if (saved) setStartedCerts(new Set(JSON.parse(saved)));
    } catch {}
  }, []);

  const toggleStarted = (certId: string) => {
    setStartedCerts(prev => {
      const next = new Set(prev);
      next.has(certId) ? next.delete(certId) : next.add(certId);
      try { localStorage.setItem('startedCertifications', JSON.stringify(Array.from(next))); } catch {}
      return next;
    });
    toggleSubscription(certId);
  };

  // Unique providers for filter chips
  const providers = useMemo(
    () => Array.from(new Set(certifications.map(c => c.provider))),
    [certifications]
  );

  // Filtered certs
  const filtered = useMemo(() => {
    const q = searchQuery.toLowerCase();
    return certifications.filter(cert => {
      const matchSearch = !q || cert.name.toLowerCase().includes(q) || cert.provider.toLowerCase().includes(q);
      const matchProvider = !activeProvider || cert.provider === activeProvider;
      return matchSearch && matchProvider;
    });
  }, [certifications, searchQuery, activeProvider]);

  // Group by provider, sorted by role priority then PROVIDER_META order
  const { grouped, sortedProviders } = useMemo(() => {
    const grouped = filtered.reduce<Record<string, Certification[]>>((acc, cert) => {
      (acc[cert.provider] ??= []).push(cert);
      return acc;
    }, {});
    const priority = getRoleCertPriority(preferences.role ?? '');
    const sortedProviders = Object.keys(grouped).sort((a, b) => {
      const ai = priority.findIndex((p: string) => a.toLowerCase().startsWith(p));
      const bi = priority.findIndex((p: string) => b.toLowerCase().startsWith(p));
      const aRank = ai === -1 ? 999 : ai;
      const bRank = bi === -1 ? 999 : bi;
      if (aRank !== bRank) return aRank - bRank;
      return (getProviderMeta(a).order) - (getProviderMeta(b).order);
    });
    return { grouped, sortedProviders };
  }, [filtered, preferences.role]);

  const completedCount = startedCerts.size;
  const inProgressCount = startedCerts.size; // treat started as in-progress
  const hasFilters = !!searchQuery || !!activeProvider;

  return (
    <>
      <SEOHead
        title="Certifications — Get Certified, Get Hired"
        description="Practice for AWS, Azure, GCP, Kubernetes, and more certifications"
        canonical="https://open-interview.github.io/certifications"
      />
      <AppLayout fullWidth>
        <div className="min-h-screen bg-background text-foreground">
          <div className="max-w-3xl mx-auto px-4 sm:px-6 py-8 pb-24">

            {/* ── Page Header (Headline Large + Body Medium) ── */}
            <div className="mb-8">
              <h1 className="text-[var(--md-sys-typescale-headline-large-size,2rem)] font-[var(--md-sys-typescale-headline-large-weight,400)] leading-[var(--md-sys-typescale-headline-large-line-height,1.25)] tracking-[var(--md-sys-typescale-headline-large-tracking,0em)] text-[var(--md-sys-color-on-surface)]">Certifications</h1>
              <p className="mt-2 text-[var(--md-sys-typescale-body-medium-size,0.875rem)] text-[var(--md-sys-color-on-surface-variant)]">
                Practice for top cloud, DevOps, and engineering certifications.
              </p>
            </div>

             {loading ? (
               <>
                 {/* Stats bar skeleton */}
                 <div className="flex gap-3 mb-6" role="status" aria-label="Loading certifications">
                   {[80, 64, 72].map(w => <Skeleton key={w} className={`h-16 rounded-2xl flex-1 bg-[var(--md-sys-color-surface-container-high)]`} />)}
                 </div>
                 {/* Search skeleton */}
                 <Skeleton className="h-12 w-full rounded-full bg-[var(--md-sys-color-surface-container-high)] mb-4" />
                 {/* Filter chips skeleton */}
                 <div className="flex gap-2 mb-6 overflow-hidden">
                   {[60, 80, 72, 90, 68].map(w => <Skeleton key={w} className="min-h-[48px] h-8 rounded-full bg-[var(--md-sys-color-surface-container-high)]" style={{ width: w }} />)}
                 </div>
                 <SkeletonSection />
               </>
             ) : error ? (
               <Alert variant="destructive" role="alert">
                 <AlertTitle>Failed to load certifications</AlertTitle>
                 <AlertDescription>
                   <button onClick={() => refetch()} className="underline text-[var(--md-sys-color-primary)] hover:opacity-90 transition-opacity duration-150 ease-out focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--md-sys-color-primary)]/50" aria-label="Retry loading certifications">Try again</button>
                 </AlertDescription>
               </Alert>
             ) : (
              <>
                 {/* ── Stats bar (M3 metric chips) ── */}
                 <motion.div
                   initial={{ opacity: 0, y: 10 }}
                   animate={{ opacity: 1, y: 0 }}
                   transition={{ duration: 0.3, ease: [0.2, 0, 0, 1] }}
                   className="grid grid-cols-3 gap-3 mb-6"
                 >
                   {[
                     { label: 'Total', value: certifications.length, color: 'text-[var(--md-sys-color-on-surface)]' },
                     { label: 'Started', value: completedCount, color: 'text-[var(--md-sys-color-primary)]' },
                     { label: 'In Progress', value: inProgressCount, color: 'text-[var(--md-sys-color-tertiary)]' },
                   ].map(({ label, value, color }) => (
                     <div key={label} className="flex flex-col items-center justify-center p-3 rounded-2xl bg-[var(--md-sys-color-surface-container)] border border-[var(--md-sys-color-outline-variant)] shadow-sm">
                       <span className={`text-2xl font-bold ${color}`}>{value}</span>
                       <span className="text-xs text-[var(--md-sys-color-on-surface-variant)] mt-0.5">{label}</span>
                     </div>
                   ))}
                 </motion.div>

                 {/* ── M3 Search bar ── */}
                 <motion.div
                   initial={{ opacity: 0, y: 10 }}
                   animate={{ opacity: 1, y: 0 }}
                   transition={{ duration: 0.3, ease: [0.2, 0, 0, 1] }}
                   className="relative mb-4"
                 >
                   <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-[var(--md-sys-color-on-surface-variant)] pointer-events-none" />
                   <input
                     type="text"
                     value={searchQuery}
                     onChange={e => setSearchQuery(e.target.value)}
                     placeholder="Search certifications..."
                     aria-label="Search certifications"
                     className="w-full h-12 pl-11 pr-10 rounded-full bg-[var(--md-sys-color-surface-container-highest)] text-[var(--md-sys-color-on-surface)] placeholder:text-[var(--md-sys-color-on-surface-variant)] text-sm focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--md-sys-color-primary)]/40 transition-all duration-200 ease-out"
                   />
                   {searchQuery && (
                     <button
                       onClick={() => setSearchQuery('')}
                       aria-label="Clear search"
                       className="absolute right-3 top-1/2 -translate-y-1/2 p-1 rounded-full hover:bg-[var(--md-sys-color-surface-container-high)] text-[var(--md-sys-color-on-surface-variant)] min-h-[48px] min-w-[48px] flex items-center justify-center transition-colors duration-150 ease-out focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--md-sys-color-primary)]/50"
                     >
                       <X className="w-4 h-4" />
                     </button>
                   )}
                 </motion.div>

                 {/* ── Filter chips (horizontal scrollable) ── */}
                 <motion.div
                   initial={{ opacity: 0, y: 10 }}
                   animate={{ opacity: 1, y: 0 }}
                   transition={{ delay: 0.1, duration: 0.3, ease: [0.2, 0, 0, 1] }}
                   className="flex gap-2 overflow-x-auto pb-1 mb-6 scrollbar-none"
                 >
                   {['', ...providers].map(p => {
                     const isAll = p === '';
                     const active = activeProvider === p;
                     const meta = isAll ? null : getProviderMeta(p);
                     return (
                       <button
                         key={p || '__all__'}
                         onClick={() => setActiveProvider(p)}
                         aria-pressed={active}
                         aria-label={isAll ? 'All providers' : `Filter by ${meta!.label}`}
                         className={`flex-shrink-0 min-h-[48px] px-4 rounded-full text-xs font-semibold transition-all duration-200 ease-out focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-1 focus-visible:ring-[var(--md-sys-color-primary)]/50 ${
                           active
                             ? 'bg-[var(--md-sys-color-secondary-container)] text-[var(--md-sys-color-on-secondary-container)]'
                             : 'bg-[var(--md-sys-color-surface-container-high)] text-[var(--md-sys-color-on-surface-variant)] hover:bg-[var(--md-sys-color-surface-container-highest)] border border-[var(--md-sys-color-outline-variant)]'
                         }`}
                       >
                         {isAll ? 'All' : `${meta!.emoji} ${p}`}
                       </button>
                     );
                   })}
                 </motion.div>

                {/* ── Provider sections or empty state ── */}
                <AnimatePresence mode="wait">
                  {sortedProviders.length === 0 ? (
                     <motion.div key="empty" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} role="status" aria-live="polite">
                       <Empty className="border border-dashed border-[var(--md-sys-color-outline-variant)] rounded-2xl py-16 bg-[var(--md-sys-color-surface-container-low)]">
                         <EmptyHeader>
                           <EmptyMedia variant="icon">
                             <Search className="w-5 h-5 text-[var(--md-sys-color-on-surface-variant)]" />
                           </EmptyMedia>
                           <EmptyTitle className="text-[var(--md-sys-color-on-surface)]">No certifications found</EmptyTitle>
                           <EmptyDescription className="text-[var(--md-sys-color-on-surface-variant)]">
                             Try a different search term or clear the filters.
                           </EmptyDescription>
                         </EmptyHeader>
                         {hasFilters && (
                           <EmptyContent>
                             <button
                               onClick={() => { setSearchQuery(''); setActiveProvider(''); }}
                               aria-label="Clear all filters"
                               className="min-h-[48px] h-10 px-6 rounded-full text-sm font-semibold bg-[var(--md-sys-color-primary)] text-[var(--md-sys-color-on-primary)] hover:opacity-90 transition-opacity duration-150 ease-out focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--md-sys-color-primary)]/50"
                             >
                               Clear Filters
                             </button>
                           </EmptyContent>
                         )}
                       </Empty>
                     </motion.div>
                  ) : (
                    <motion.div key="list" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                      {sortedProviders.map(provider => (
                        <ProviderSection
                          key={provider}
                          provider={provider}
                          certs={grouped[provider]}
                          startedCerts={startedCerts}
                          onStart={toggleStarted}
                          onNavigate={id => navigate(`/channel/${id}`)}
                        />
                      ))}
                    </motion.div>
                  )}
                </AnimatePresence>
              </>
            )}
          </div>
        </div>
      </AppLayout>
    </>
  );
}
