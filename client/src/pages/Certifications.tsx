/**
 * Certifications — revamped with provider sections, collapsible groups,
 * progress bars, earned badge display, and cert detail view.
 * All existing data loading and started-cert logic preserved.
 */

import { useState, useEffect } from 'react';
import { useLocation } from 'wouter';
import { motion, AnimatePresence } from 'framer-motion';
import { AppLayout } from '../components/layout/AppLayout';
import { SEOHead } from '../components/SEOHead';
import {
  Search, Award, Clock, ChevronRight, ChevronDown, Check, Plus,
  Cloud, Shield, Database, Brain, Code, Users, Box, Terminal,
  Server, Cpu, Layers, Network, GitBranch, Target,
  BookOpen, BarChart2, X
} from 'lucide-react';
import { useUserPreferences } from '../context/UserPreferencesContext';
import { getRoleCertPriority } from '../lib/personalization';
import { PageHeader, SearchBar, FilterPills } from '@/components/ui/page';
import { ChannelCardSkeleton } from '@/components/ui/skeleton-loaders';
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert';

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

const iconMap: Record<string, React.ElementType> = {
  cloud: Cloud, shield: Shield, database: Database, brain: Brain,
  code: Code, users: Users, box: Box, terminal: Terminal,
  server: Server, cpu: Cpu, layers: Layers, network: Network,
  infinity: GitBranch, award: Award,
};

const DIFFICULTY_COLOR: Record<string, string> = {
  beginner: 'text-emerald-600 dark:text-emerald-400',
  intermediate: 'text-amber-600 dark:text-amber-400',
  advanced: 'text-orange-600 dark:text-orange-400',
  expert: 'text-red-600 dark:text-red-400',
};

const CERT_COLORS: Record<string, { bg: string; text: string; border: string }> = {
  AWS: { bg: 'bg-orange-100 dark:bg-orange-950', text: 'text-orange-700 dark:text-orange-300', border: 'border-orange-200 dark:border-orange-800' },
  GCP: { bg: 'bg-blue-100 dark:bg-blue-950', text: 'text-blue-700 dark:text-blue-300', border: 'border-blue-200 dark:border-blue-800' },
  Azure: { bg: 'bg-sky-100 dark:bg-sky-950', text: 'text-sky-700 dark:text-sky-300', border: 'border-sky-200 dark:border-sky-800' },
  Kubernetes: { bg: 'bg-violet-100 dark:bg-violet-950', text: 'text-violet-700 dark:text-violet-300', border: 'border-violet-200 dark:border-violet-800' },
  HashiCorp: { bg: 'bg-muted', text: 'text-foreground/80', border: 'border-border' },
  CompTIA: { bg: 'bg-red-100 dark:bg-red-950', text: 'text-red-700 dark:text-red-300', border: 'border-red-200 dark:border-red-800' },
  Cisco: { bg: 'bg-emerald-100 dark:bg-emerald-950', text: 'text-emerald-700 dark:text-emerald-300', border: 'border-emerald-200 dark:border-emerald-800' },
};

// Provider display config
const PROVIDER_META: Record<string, { label: string; emoji: string; order: number }> = {
  AWS:        { label: 'Amazon Web Services', emoji: '☁️', order: 1 },
  Kubernetes: { label: 'Kubernetes',          emoji: '⚙️', order: 2 },
  HashiCorp:  { label: 'HashiCorp',           emoji: '🔷', order: 3 },
  GCP:        { label: 'Google Cloud',        emoji: '🌐', order: 4 },
  Azure:      { label: 'Microsoft Azure',     emoji: '🔵', order: 5 },
  CompTIA:    { label: 'CompTIA',             emoji: '🛡️', order: 6 },
  Cisco:      { label: 'Cisco',               emoji: '🔗', order: 7 },
};

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

// ── Cert Detail Modal ─────────────────────────────────────────────────────────
function CertDetail({
  cert, isStarted, onToggle, onNavigate, onClose
}: {
  cert: Certification;
  isStarted: boolean;
  onToggle: () => void;
  onNavigate: () => void;
  onClose: () => void;
}) {
  const Icon = iconMap[cert.icon] || Award;
  const colorScheme = CERT_COLORS[cert.provider] || { bg: 'bg-muted', text: 'text-foreground/80', border: 'border-border' };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4"
      onClick={onClose}
    >
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />
      <motion.div
        initial={{ y: 60, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        exit={{ y: 60, opacity: 0 }}
        transition={{ type: 'spring', damping: 28, stiffness: 300 }}
        onClick={e => e.stopPropagation()}
         className="relative w-full sm:max-w-lg bg-card rounded-t-xl sm:rounded-xl p-6 max-h-[85vh] overflow-y-auto custom-scrollbar shadow-sm"
      >
        <button onClick={onClose} className="absolute top-4 right-4 p-2 rounded-full hover:bg-muted text-foreground/70 transition-colors cursor-pointer focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-none">
          <X className="w-5 h-5" />
        </button>

        {/* Header with colored icon */}
        <div className="flex items-start gap-4 mb-5">
           <div className={`w-14 h-14 rounded-xl ${colorScheme.bg} flex items-center justify-center flex-shrink-0`}>
            <Icon className={`w-7 h-7 ${colorScheme.text}`} />
          </div>
          <div className="pt-1">
            <div className="text-xs text-foreground/70 mb-0.5">{cert.provider}</div>
            <h2 className="text-xl font-bold leading-tight text-foreground">{cert.name}</h2>
            {cert.examCode && <div className="text-xs text-foreground/70 font-mono mt-1">{cert.examCode}</div>}
          </div>
        </div>

        {/* Description */}
        <p className="text-base text-foreground/80 mb-5 leading-relaxed">{cert.description}</p>

        {/* Stats grid - Material Design 3 card style */}
        <div className="grid grid-cols-2 gap-3 mb-5">
          {[
            { icon: BookOpen, label: 'Questions', value: cert.questionCount },
            { icon: Clock, label: 'Study Time', value: `${cert.estimatedHours}h` },
            { icon: Target, label: 'Pass Score', value: `${cert.passingScore}%` },
            { icon: BarChart2, label: 'Difficulty', value: cert.difficulty, color: DIFFICULTY_COLOR[cert.difficulty] },
          ].map(({ icon: I, label, value, color }) => (
            <div key={label} className="p-4 rounded-xl bg-muted/50 border border-border flex items-center gap-3">
              <I className="w-5 h-5 text-foreground/60 flex-shrink-0" />
              <div>
                <div className="text-xs text-foreground/70 uppercase tracking-wide">{label}</div>
                <div className={`text-base font-semibold ${color || 'text-foreground'}`}>{value}</div>
              </div>
            </div>
          ))}
        </div>

        {/* Google-style progress bar if started */}
        {isStarted && (
           <div className="mb-5 p-4 rounded-xl bg-muted/50">
            <div className="flex justify-between text-base mb-2">
              <span className="text-foreground/80 font-medium">Practice Progress</span>
              <span className="text-emerald-600 dark:text-emerald-400 font-semibold">In Progress</span>
            </div>
            <div className="h-2 bg-muted rounded-full overflow-hidden">
              <div className="h-full w-1/3 bg-gradient-to-r from-emerald-500 to-emerald-600 rounded-full" />
            </div>
            <div className="flex justify-between mt-1.5 text-xs text-foreground/70">
              <span>33% complete</span>
              <span>Keep going!</span>
            </div>
          </div>
        )}

        {/* Badge-style difficulty indicator */}
        <div className="flex items-center gap-2 mb-5">
          <span className="text-xs text-foreground/70 uppercase tracking-wide">Level</span>
          <span className={`px-3 py-1.5 rounded-full text-xs font-semibold capitalize ${DIFFICULTY_COLOR[cert.difficulty]} bg-muted`}>
            {cert.difficulty}
          </span>
        </div>

        {/* Actions - Material Design 3 buttons */}
        <div className="flex gap-3">
          <button
            onClick={onToggle}
            className={`flex-1 h-10 rounded-lg text-sm font-medium transition-all duration-200 flex items-center justify-center gap-2 cursor-pointer focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-none ${
              isStarted
                ? 'bg-muted border border-border hover:bg-muted/80 text-foreground/80'
                : `${colorScheme.bg} ${colorScheme.text} ${colorScheme.border} border hover:opacity-80`
            }`}
          >
            {isStarted ? <><Check className="w-4 h-4" />Started</> : <><Plus className="w-4 h-4" />Start Practice</>}
          </button>
          {isStarted && (
            <button
              onClick={onNavigate}
              className="flex-1 h-10 rounded-lg text-sm font-medium bg-primary text-primary-foreground hover:opacity-90 transition-opacity flex items-center justify-center gap-2 cursor-pointer focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-none"
            >
              Practice<ChevronRight className="w-4 h-4" />
            </button>
          )}
        </div>
      </motion.div>
    </motion.div>
  );
}

// ── Cert Card ─────────────────────────────────────────────────────────────────
function CertCard({
  cert, isStarted, onClick
}: {
  cert: Certification; isStarted: boolean;
  onClick: () => void;
}) {
  const Icon = iconMap[cert.icon] || Award;
  const colorScheme = CERT_COLORS[cert.provider] || { bg: 'bg-muted', text: 'text-foreground/80', border: 'border-border' };

  return (
    <motion.div
      layout
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      whileHover={{ y: -2 }}
      onClick={onClick}
      className="group relative p-4 bg-card border border-border rounded-2xl cursor-pointer hover:shadow-xl transition-all duration-200 ease-out overflow-hidden focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-none"
    >
      <div className={`absolute inset-0 bg-gradient-to-br ${colorScheme.bg} opacity-0 group-hover:opacity-60 transition-opacity duration-200`} />

       <div className="relative space-y-3">
         {/* Header with colored icon background */}
         <div className="flex items-start gap-3">
           <div className={`relative w-12 h-12 flex-shrink-0 rounded-xl ${colorScheme.bg} ${colorScheme.border} border flex items-center justify-center`}>
             <Icon className={`w-5 h-5 ${colorScheme.text}`} />
           </div>
           <div className="flex-1 min-w-0">
             <div className="text-xs text-foreground/70 font-medium">{cert.provider}</div>
             <h3 className="text-base font-semibold leading-tight line-clamp-2 text-foreground">{cert.name}</h3>
             {cert.examCode && <div className="text-xs text-foreground/70 font-mono mt-0.5">{cert.examCode}</div>}
           </div>
           {isStarted && (
             <div className={`px-3 py-1.5 rounded-full text-xs font-semibold ${colorScheme.bg} ${colorScheme.text} border ${colorScheme.border}`}>
               Started
             </div>
           )}
         </div>

         {/* Meta with clean list styling */}
         <div className="flex items-center gap-4 text-xs text-foreground/70">
           <span className="flex items-center gap-1"><BookOpen className="w-3 h-3" />{cert.questionCount} questions</span>
           <span className="flex items-center gap-1"><Clock className="w-3 h-3" />{cert.estimatedHours}h</span>
           <span className={`font-semibold capitalize ${DIFFICULTY_COLOR[cert.difficulty]}`}>{cert.difficulty}</span>
         </div>

       </div>
     </motion.div>
   );
 }

// ── Provider Section ──────────────────────────────────────────────────────────
function ProviderSection({
  provider, certs, startedCerts, onToggle, onNavigate, onSelect
}: {
  provider: string;
  certs: Certification[];
  startedCerts: Set<string>;
  onToggle: (id: string) => void;
  onNavigate: (id: string) => void;
  onSelect: (cert: Certification) => void;
}) {
  const [open, setOpen] = useState(true);
  const meta = PROVIDER_META[provider] ?? { label: provider, emoji: '📋', order: 99 };
  const colorScheme = CERT_COLORS[provider] || { bg: 'bg-muted', text: 'text-foreground/80', border: 'border-border' };
  const startedCount = certs.filter(c => startedCerts.has(c.id)).length;

  return (
    <div className="mb-8">
      <button
        onClick={() => setOpen(o => !o)}
        className="w-full min-h-[56px] flex items-center justify-between px-4 py-3 mb-4 group cursor-pointer bg-card border border-border rounded-xl hover:shadow-xl transition-all duration-200 focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-none"
      >
        <div className="flex items-center gap-4">
          <div className={`w-10 h-10 rounded-xl ${colorScheme.bg} border ${colorScheme.border} flex items-center justify-center text-lg`}>
            {meta.emoji}
          </div>
          <div className="text-left">
            <div className="text-base font-semibold text-foreground">{meta.label}</div>
            <div className="text-xs text-foreground/70">{certs.length} certifications{startedCount > 0 ? ` · ${startedCount} started` : ''}</div>
          </div>
        </div>
        <motion.div animate={{ rotate: open ? 0 : -90 }} transition={{ duration: 0.2 }}>
          <ChevronDown className="w-5 h-5 text-foreground/60" />
        </motion.div>
      </button>

      <AnimatePresence initial={false}>
        {open && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.25, ease: 'easeInOut' }}
            className="overflow-hidden"
          >
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {certs.map(cert => (
                <CertCard
                  key={cert.id}
                  cert={cert}
                  isStarted={startedCerts.has(cert.id)}
                  onClick={() => onSelect(cert)}
                />
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// ── Main Page ─────────────────────────────────────────────────────────────────
export default function CertificationsPage() {
  const [, navigate] = useLocation();
  const { certifications, loading, error, refetch } = useCertifications();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [startedCerts, setStartedCerts] = useState<Set<string>>(new Set());
  const [selectedCert, setSelectedCert] = useState<Certification | null>(null);
  const { preferences, toggleSubscription } = useUserPreferences();
  const [subscribedOnly, setSubscribedOnly] = useState(
    preferences.onboardingComplete &&
    ((preferences.subscribedCertifications?.length ?? 0) > 0 || preferences.subscribedChannels.length > 0)
  );
  const subscribedCertIds = new Set(preferences.subscribedChannels);

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

  const categories = Array.from(new Set(certifications.map(c => c.category)));

  const filtered = certifications.filter(cert => {
    const q = searchQuery.toLowerCase();
    const matchSearch = !q || cert.name.toLowerCase().includes(q) || cert.provider.toLowerCase().includes(q) || cert.description.toLowerCase().includes(q);
    const matchCat = !selectedCategory || cert.category === selectedCategory;
    const matchSub = !subscribedOnly || subscribedCertIds.has(cert.id) || startedCerts.has(cert.id);
    return matchSearch && matchCat && matchSub;
  });

  // Group by provider, sorted by PROVIDER_META order
  const grouped = filtered.reduce<Record<string, Certification[]>>((acc, cert) => {
    (acc[cert.provider] ??= []).push(cert);
    return acc;
  }, {});

  const sortedProviders = Object.keys(grouped).sort((a, b) => {
    const priority = getRoleCertPriority(preferences.role ?? '');
    const ai = priority.findIndex((p: string) => a.toLowerCase().startsWith(p));
    const bi = priority.findIndex((p: string) => b.toLowerCase().startsWith(p));
    const aRank = ai === -1 ? 999 : ai;
    const bRank = bi === -1 ? 999 : bi;
    if (aRank !== bRank) return aRank - bRank;
    return (PROVIDER_META[a]?.order ?? 99) - (PROVIDER_META[b]?.order ?? 99);
  });

  return (
    <>
      <SEOHead
        title="Certifications — Get Certified, Get Hired"
        description="Practice for AWS, Azure, GCP, Kubernetes, and more certifications"
        canonical="https://open-interview.github.io/certifications"
      />
      <AppLayout fullWidth>
        <div className="min-h-screen bg-background text-foreground">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8 sm:py-12 pb-24">

            {/* Page Header */}
            <div className="text-center mb-8">
              <h1 className="text-3xl sm:text-4xl font-bold text-foreground mb-2">Certifications</h1>
              <p className="text-foreground/70">Get certified, get hired</p>
            </div>

            {loading ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {Array.from({ length: 9 }).map((_, i) => <ChannelCardSkeleton key={i} />)}
              </div>
            ) : error ? (
              <Alert variant="destructive">
                <AlertTitle>Failed to load certifications</AlertTitle>
                <AlertDescription>
                  <button onClick={() => refetch()}>Try again</button>
                </AlertDescription>
              </Alert>
            ) : (
              <>
                {/* Stats - Material Design 3 cards */}
                {startedCerts.size > 0 && (
                  <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="grid grid-cols-3 gap-4 mb-8 max-w-lg mx-auto">
                    {[
                      { label: 'Practicing', value: startedCerts.size, colorClass: 'text-emerald-600 dark:text-emerald-400' },
                      { label: 'Available', value: certifications.length, colorClass: 'text-blue-600 dark:text-blue-400' },
                      { label: 'Progress', value: `${Math.round((startedCerts.size / Math.max(certifications.length, 1)) * 100)}%`, colorClass: 'text-violet-600 dark:text-violet-400' },
                    ].map(({ label, value, colorClass }) => (
                      <div key={label} className="p-4 rounded-2xl bg-card border border-border text-center shadow-xl">
                        <div className={`text-xl font-bold ${colorClass}`}>{value}</div>
                        <div className="text-xs text-foreground/70 uppercase tracking-wide mt-1">{label}</div>
                      </div>
                    ))}
                  </motion.div>
                )}

                {/* Search */}
                <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="max-w-2xl mx-auto mb-6">
                  <div className="flex gap-3">
                    <SearchBar
                      value={searchQuery}
                      onChange={setSearchQuery}
                      placeholder="Search certifications..."
                      className="flex-1"
                    />
                    <button
                      onClick={() => setSubscribedOnly(s => !s)}
                      className={`min-h-[40px] px-4 py-2.5 rounded-lg text-sm font-medium border transition-all duration-200 whitespace-nowrap cursor-pointer focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-none ${
                        subscribedOnly
                          ? 'bg-emerald-50 dark:bg-emerald-950 border-emerald-200 dark:border-emerald-800 text-emerald-700 dark:text-emerald-300'
                          : 'bg-card border-border text-foreground/70 hover:border-border/80'
                      }`}
                    >
                      {subscribedOnly ? '★ My Certs' : 'All Certs'}
                    </button>
                  </div>
                </motion.div>

                {/* Category filters - clean list layout */}
                <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }} className="flex flex-wrap gap-2 justify-center mb-8">
                  <FilterPills
                    options={[{ id: '', label: 'All' }, ...categories.map(cat => ({ id: cat, label: cat }))]}
                    active={selectedCategory ?? ''}
                    onChange={id => setSelectedCategory(id || null)}
                  />
                </motion.div>

                {/* Provider sections */}
                {sortedProviders.length === 0 ? (
                  <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-center py-20">
                    <Search className="w-5 h-5 mx-auto mb-3 text-[#9AA0A6]" />
                    <h3 className="text-xl font-semibold mb-1 text-foreground/80">No certifications found</h3>
                    <p className="text-base text-foreground/70 mb-4">Try a different search or category</p>
                    {(searchQuery || selectedCategory || subscribedOnly) && (
                      <button
                        onClick={() => { setSearchQuery(''); setSelectedCategory(null); setSubscribedOnly(false); }}
                        className="min-h-[40px] px-6 py-2.5 rounded-lg text-sm font-medium bg-primary text-primary-foreground hover:opacity-90 transition-opacity cursor-pointer focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-none"
                      >
                        Clear Filters
                      </button>
                    )}
                  </motion.div>
                ) : (
                  sortedProviders.map(provider => (
                    <ProviderSection
                      key={provider}
                      provider={provider}
                      certs={grouped[provider]}
                      startedCerts={startedCerts}
                      onToggle={toggleStarted}
                      onNavigate={id => navigate(`/channel/${id}`)}
                      onSelect={setSelectedCert}
                    />
                  ))
                )}
              </>
            )}
          </div>
        </div>

        {/* Detail modal */}
        <AnimatePresence>
          {selectedCert && (
            <CertDetail
              cert={selectedCert}
              isStarted={startedCerts.has(selectedCert.id)}
              onToggle={() => toggleStarted(selectedCert.id)}
              onNavigate={() => navigate(`/channel/${selectedCert.id}`)}
              onClose={() => setSelectedCert(null)}
            />
          )}
        </AnimatePresence>
      </AppLayout>
    </>
  );
}
