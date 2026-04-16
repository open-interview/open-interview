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
  Server, Cpu, Layers, Network, GitBranch, Loader2, Target,
  BookOpen, BarChart2, X, Settings2
} from 'lucide-react';
import { useUserPreferences } from '../context/UserPreferencesContext';

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
  beginner: 'text-[var(--color-difficulty-beginner)]',
  intermediate: 'text-[var(--color-difficulty-intermediate)]',
  advanced: 'text-[var(--color-difficulty-advanced)]',
  expert: 'text-[var(--color-error)]',
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
  useEffect(() => {
    (async () => {
      try {
        const base = import.meta.env.BASE_URL || '/';
        const res = await fetch(`${base}data/certifications.json`);
        if (!res.ok) throw new Error('Failed to fetch');
        setCertifications(await res.json());
      } catch (e) {
        console.error('Failed to load certifications:', e);
      } finally {
        setLoading(false);
      }
    })();
  }, []);
  return { certifications, loading };
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
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[var(--z-modal)] flex items-end sm:items-center justify-center p-0 sm:p-4"
      onClick={onClose}
    >
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />
      <motion.div
        initial={{ y: 60, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        exit={{ y: 60, opacity: 0 }}
        transition={{ type: 'spring', damping: 28, stiffness: 300 }}
        onClick={e => e.stopPropagation()}
        className="relative w-full sm:max-w-lg bg-card border border-border rounded-t-2xl sm:rounded-2xl p-6 max-h-[85vh] overflow-y-auto custom-scrollbar"
      >
        <button onClick={onClose} className="absolute top-4 right-4 p-1.5 rounded-lg hover:bg-muted/50 text-muted-foreground transition-colors">
          <X className="w-4 h-4" />
        </button>

        {/* Header */}
        <div className="flex items-start gap-4 mb-5">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-[var(--color-accent-violet)]/20 to-[var(--color-accent-cyan)]/20 border border-[var(--color-accent-violet)]/30 flex items-center justify-center flex-shrink-0">
            <Icon className="w-7 h-7 text-[var(--color-accent-violet-light)]" />
          </div>
          <div>
            <div className="text-xs text-muted-foreground mb-0.5">{cert.provider}</div>
            <h2 className="text-lg font-bold leading-tight">{cert.name}</h2>
            {cert.examCode && <div className="text-xs text-[var(--color-accent-cyan)] font-mono mt-0.5">{cert.examCode}</div>}
          </div>
        </div>

        {/* Description */}
        <p className="text-sm text-muted-foreground mb-5 leading-relaxed">{cert.description}</p>

        {/* Stats grid */}
        <div className="grid grid-cols-2 gap-3 mb-5">
          {[
            { icon: BookOpen, label: 'Questions', value: cert.questionCount },
            { icon: Clock, label: 'Study Time', value: `${cert.estimatedHours}h` },
            { icon: Target, label: 'Pass Score', value: `${cert.passingScore}%` },
            { icon: BarChart2, label: 'Difficulty', value: cert.difficulty },
          ].map(({ icon: I, label, value }) => (
            <div key={label} className="p-3 rounded-xl bg-muted/40 flex items-center gap-2.5">
              <I className="w-4 h-4 text-muted-foreground flex-shrink-0" />
              <div>
                <div className="text-[10px] text-muted-foreground">{label}</div>
                <div className={`text-sm font-semibold capitalize ${label === 'Difficulty' ? DIFFICULTY_COLOR[cert.difficulty] : ''}`}>{value}</div>
              </div>
            </div>
          ))}
        </div>

        {/* Progress bar if started */}
        {isStarted && (
          <div className="mb-5 p-3 rounded-xl bg-[var(--color-accent-violet)]/10 border border-[var(--color-accent-violet)]/20">
            <div className="flex justify-between text-xs mb-1.5">
              <span className="text-muted-foreground">Practice Progress</span>
              <span className="font-semibold text-[var(--color-accent-violet-light)]">In Progress</span>
            </div>
            <div className="h-1.5 bg-muted rounded-full overflow-hidden">
              <div className="h-full w-1/3 bg-gradient-to-r from-[var(--color-accent-violet)] to-[var(--color-accent-cyan)] rounded-full" />
            </div>
          </div>
        )}

        {/* Actions */}
        <div className="flex gap-2">
          <button
            onClick={onToggle}
            className={`flex-1 py-2.5 rounded-xl text-sm font-bold transition-all flex items-center justify-center gap-2 ${
              isStarted
                ? 'bg-muted border border-border hover:bg-muted/80 text-foreground'
                : 'bg-gradient-to-r from-[var(--color-accent-violet)] to-[var(--color-accent-cyan)] text-white hover:opacity-90'
            }`}
          >
            {isStarted ? <><Check className="w-4 h-4" />Started</> : <><Plus className="w-4 h-4" />Start Practice</>}
          </button>
          {isStarted && (
            <button
              onClick={onNavigate}
              className="flex-1 py-2.5 rounded-xl text-sm font-bold bg-gradient-to-r from-[var(--color-accent-violet)] to-[var(--color-accent-cyan)] text-white hover:opacity-90 transition-all flex items-center justify-center gap-2"
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
  cert, isStarted, onToggle, onNavigate, onClick
}: {
  cert: Certification; isStarted: boolean;
  onToggle: (e: React.MouseEvent) => void;
  onNavigate: (e: React.MouseEvent) => void;
  onClick: () => void;
}) {
  const Icon = iconMap[cert.icon] || Award;
  return (
    <motion.div
      layout
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      whileHover={{ y: -2 }}
      onClick={onClick}
      className="group relative p-4 bg-card border border-border rounded-xl cursor-pointer hover:border-[var(--color-accent-violet)]/40 transition-all overflow-hidden"
    >
      <div className="absolute inset-0 bg-gradient-to-br from-[var(--color-accent-violet)]/5 to-[var(--color-accent-cyan)]/5 opacity-0 group-hover:opacity-100 transition-opacity" />

      <div className="relative space-y-3">
        {/* Header */}
        <div className="flex items-start gap-3">
          <div className="relative w-10 h-10 flex-shrink-0">
            <svg width="40" height="40" className="-rotate-90 absolute inset-0">
              <circle cx="20" cy="20" r="16" fill="none" stroke="currentColor" strokeOpacity="0.08" strokeWidth="3" />
              {isStarted && (
                <circle
                  cx="20" cy="20" r="16"
                  fill="none"
                  stroke="url(#certRingGrad)"
                  strokeWidth="3"
                  strokeLinecap="round"
                  strokeDasharray={2 * Math.PI * 16}
                  strokeDashoffset={2 * Math.PI * 16 * 0.67}
                />
              )}
              <defs>
                <linearGradient id="certRingGrad" x1="0%" y1="0%" x2="100%" y2="0%">
                  <stop offset="0%" stopColor="var(--color-accent-violet)" />
                  <stop offset="100%" stopColor="var(--color-accent-cyan)" />
                </linearGradient>
              </defs>
            </svg>
            <div className="absolute inset-0 rounded-xl bg-gradient-to-br from-[var(--color-accent-violet)]/20 to-[var(--color-accent-cyan)]/20 border border-[var(--color-accent-violet)]/25 flex items-center justify-center">
              <Icon className="w-4 h-4 text-[var(--color-accent-violet-light)]" />
            </div>
          </div>
          <div className="flex-1 min-w-0">
            <div className="text-[10px] text-muted-foreground">{cert.provider}</div>
            <h3 className="text-sm font-bold leading-tight line-clamp-2">{cert.name}</h3>
            {cert.examCode && <div className="text-[10px] text-[var(--color-accent-cyan)] font-mono">{cert.examCode}</div>}
          </div>
          {isStarted && (
            <div className="w-5 h-5 rounded-full bg-[var(--color-success)]/20 border border-[var(--color-success)]/40 flex items-center justify-center flex-shrink-0">
              <Check className="w-3 h-3 text-[var(--color-success)]" />
            </div>
          )}
        </div>

        {/* Meta */}
        <div className="flex items-center gap-3 text-[10px] text-muted-foreground">
          <span className="flex items-center gap-1"><BookOpen className="w-3 h-3" />{cert.questionCount}q</span>
          <span className="flex items-center gap-1"><Clock className="w-3 h-3" />{cert.estimatedHours}h</span>
          <span className={`font-semibold capitalize ${DIFFICULTY_COLOR[cert.difficulty]}`}>{cert.difficulty}</span>
        </div>

        {/* CTA */}
        <div className="flex gap-1.5" onClick={e => e.stopPropagation()}>
          <button
            onClick={onToggle}
            className={`flex-1 py-2 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${
              isStarted
                ? 'bg-muted border border-border hover:bg-muted/80'
                : 'bg-gradient-to-r from-[var(--color-accent-violet)] to-[var(--color-accent-cyan)] text-white hover:opacity-90'
            }`}
          >
            {isStarted ? <><Check className="w-3 h-3" />Started</> : <><Plus className="w-3 h-3" />Start</>}
          </button>
          {isStarted && (
            <button
              onClick={onNavigate}
              className="px-3 py-2 rounded-lg bg-muted/50 border border-border hover:bg-muted transition-all"
            >
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          )}
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
  const startedCount = certs.filter(c => startedCerts.has(c.id)).length;

  return (
    <div className="mb-6">
      <button
        onClick={() => setOpen(o => !o)}
        className="w-full flex items-center justify-between px-1 py-2 mb-3 group"
      >
        <div className="flex items-center gap-2.5">
          <span className="text-xl">{meta.emoji}</span>
          <div className="text-left">
            <div className="text-sm font-bold">{meta.label}</div>
            <div className="text-[10px] text-muted-foreground">{certs.length} certifications{startedCount > 0 ? ` · ${startedCount} started` : ''}</div>
          </div>
        </div>
        <motion.div animate={{ rotate: open ? 0 : -90 }} transition={{ duration: 0.2 }}>
          <ChevronDown className="w-4 h-4 text-muted-foreground" />
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
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {certs.map(cert => (
                <CertCard
                  key={cert.id}
                  cert={cert}
                  isStarted={startedCerts.has(cert.id)}
                  onToggle={e => { e.stopPropagation(); onToggle(cert.id); }}
                  onNavigate={e => { e.stopPropagation(); onNavigate(cert.id); }}
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
  const { certifications, loading } = useCertifications();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [startedCerts, setStartedCerts] = useState<Set<string>>(new Set());
  const [selectedCert, setSelectedCert] = useState<Certification | null>(null);
  const [subscribedOnly, setSubscribedOnly] = useState(false);
  const { preferences, toggleSubscription } = useUserPreferences();
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
    // Also sync with subscriptions
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

  const sortedProviders = Object.keys(grouped).sort((a, b) =>
    (PROVIDER_META[a]?.order ?? 99) - (PROVIDER_META[b]?.order ?? 99)
  );

  if (loading) {
    return (
      <AppLayout>
        <div className="min-h-screen bg-background flex items-center justify-center">
          <Loader2 className="w-10 h-10 text-primary animate-spin" />
        </div>
      </AppLayout>
    );
  }

  return (
    <>
      <SEOHead
        title="Certifications — Get Certified, Get Hired"
        description="Practice for AWS, Azure, GCP, Kubernetes, and more certifications"
        canonical="https://open-interview.github.io/certifications"
      />
      <AppLayout>
        <div className="min-h-screen bg-background">
          <div className="px-4 pt-6 pb-4 lg:px-8">
            <h1 className="text-2xl font-bold text-foreground">Certifications</h1>
            <p className="text-sm text-muted-foreground mt-1">{certifications.length} certifications to master</p>
          </div>
          <div className="max-w-7xl mx-auto px-4 md:px-6 pb-24 lg:pb-8">

            {/* Stats */}
            {startedCerts.size > 0 && (
              <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="grid grid-cols-3 gap-3 mb-6 max-w-lg mx-auto">
                {[
                  { label: 'Practicing', value: startedCerts.size, colorClass: 'text-[var(--color-accent-violet-light)]' },
                  { label: 'Available', value: certifications.length, colorClass: 'text-[var(--color-accent-cyan)]' },
                  { label: 'Progress', value: `${Math.round((startedCerts.size / Math.max(certifications.length, 1)) * 100)}%`, colorClass: 'text-[var(--color-success)]' },
                ].map(({ label, value, colorClass }) => (
                  <div key={label} className="p-3 rounded-xl bg-muted/40 border border-border text-center">
                    <div className={`text-xl font-bold ${colorClass}`}>{value}</div>
                    <div className="text-[10px] text-muted-foreground">{label}</div>
                  </div>
                ))}
              </motion.div>
            )}

            {/* Search */}
            <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="max-w-2xl mx-auto mb-4">
              <div className="flex gap-2">
                <div className="relative flex-1">
                  <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <input
                    type="text"
                    placeholder="Search certifications..."
                    value={searchQuery}
                    onChange={e => setSearchQuery(e.target.value)}
                    className="w-full pl-10 pr-4 py-2.5 bg-muted/50 border border-border rounded-lg text-sm focus:outline-none focus:border-primary transition-colors"
                  />
                </div>
                <button
                  onClick={() => setSubscribedOnly(s => !s)}
                  className={`px-3 py-2.5 rounded-lg text-xs font-semibold border transition-all whitespace-nowrap ${
                    subscribedOnly
                      ? 'bg-[var(--color-accent-violet)]/15 border-[var(--color-accent-violet)] text-[var(--color-accent-violet-light)]'
                      : 'bg-muted/50 border-border text-muted-foreground hover:border-primary/50'
                  }`}
                >
                  {subscribedOnly ? '★ My Certs' : 'All Certs'}
                </button>
              </div>
            </motion.div>

            {/* Category filters */}
            <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }} className="flex flex-wrap gap-2 justify-center mb-8">
              <button
                onClick={() => setSelectedCategory(null)}
                className={`px-4 py-1.5 rounded-full text-sm font-semibold transition-all ${
                  !selectedCategory ? 'bg-gradient-to-r from-[var(--color-accent-violet)] to-[var(--color-accent-cyan)] text-white' : 'bg-muted/50 border border-border hover:bg-muted text-muted-foreground'
                }`}
              >
                All
              </button>
              {categories.map(cat => (
                <button
                  key={cat}
                  onClick={() => setSelectedCategory(cat)}
                  className={`px-4 py-1.5 rounded-full text-sm font-semibold capitalize transition-all ${
                    selectedCategory === cat ? 'bg-gradient-to-r from-[var(--color-accent-violet)] to-[var(--color-accent-cyan)] text-white' : 'bg-muted/50 border border-border hover:bg-muted text-muted-foreground'
                  }`}
                >
                  {cat}
                </button>
              ))}
            </motion.div>

            {/* Provider sections */}
            {sortedProviders.length === 0 ? (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-center py-20">
                <Search className="w-12 h-12 mx-auto mb-3 text-muted-foreground/40" />
                <h3 className="text-xl font-bold mb-1">No certifications found</h3>
                <p className="text-sm text-muted-foreground">Try a different search or category</p>
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
