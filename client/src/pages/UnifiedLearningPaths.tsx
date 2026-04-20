/**
 * Unified Learning Paths - All paths in one place
 * Shows: Active paths, Custom paths, Curated paths
 */

import { useState, useEffect } from 'react';
import { useLocation } from 'wouter';
import { motion, AnimatePresence } from 'framer-motion';
import { AppLayout } from '../components/layout/AppLayout';
import { SEOHead } from '../components/SEOHead';
import { allChannelsConfig } from '../lib/channels-config';
import { PageHeader, SearchBar, FilterPills } from '@/components/ui/page';
import { useUserPreferences } from '../context/UserPreferencesContext';
import { isPersonalized } from '../lib/personalization';
import {
  Plus, Trash2, Edit, ChevronRight, Brain, Check, Target, Clock, Sparkles, Award,
  Code, Server, Rocket, X, Search, Star, Zap, Trophy, Building2,
  ChevronDown,
} from 'lucide-react';

interface CustomPath {
  id: string;
  name: string;
  channels: string[];
  certifications: string[];
  createdAt: string;
}

interface Certification {
  id: string;
  name: string;
  provider: string;
  icon: string;
  category: string;
}

// SVG Progress Ring
function ProgressRing({ progress, size = 56, stroke = 4, color = 'var(--color-accent-violet)' }: {
  progress: number; size?: number; stroke?: number; color?: string;
}) {
  const r = (size - stroke * 2) / 2;
  const circ = 2 * Math.PI * r;
  const offset = circ - (progress / 100) * circ;
  return (
    <svg width={size} height={size} className="rotate-[-90deg]">
      <circle cx={size/2} cy={size/2} r={r} fill="none" stroke="var(--surface-4)" strokeWidth={stroke} />
      <circle
        cx={size/2} cy={size/2} r={r} fill="none" stroke={color} strokeWidth={stroke}
        strokeDasharray={circ} strokeDashoffset={offset}
        strokeLinecap="round"
        style={{ transition: 'stroke-dashoffset 0.8s var(--ease-spring)' }}
      />
    </svg>
  );
}

const difficultyColors: Record<string, string> = {
  Beginner: 'var(--color-difficulty-beginner)',
  Intermediate: 'var(--color-difficulty-intermediate)',
  Advanced: 'var(--color-difficulty-advanced)',
};

const roleGradients: Record<string, string> = {
  'job-title': 'linear-gradient(135deg, #3b82f6, #06b6d4)',
  'company':   'linear-gradient(135deg, #10b981, #34d399)',
  'skill':     'linear-gradient(135deg, #7c3aed, #ec4899)',
  'certification': 'linear-gradient(135deg, #f97316, #ef4444)',
};

const pathTypeLabels: Record<string, string> = {
  'job-title': 'Job Title',
  'company': 'Company',
  'skill': 'Skill',
  'certification': 'Certification',
};

const stagger = { hidden: {}, visible: { transition: { staggerChildren: 0.05 } } };
const fadeUp = { hidden: { opacity: 0, y: 16, scale: 0.97 }, visible: { opacity: 1, y: 0, scale: 1, transition: { duration: 0.3, ease: [0.16, 1, 0.3, 1] as [number, number, number, number] } } };

// ─── PathCard ────────────────────────────────────────────────────────────────
function PathCard({ path, isActive, pathProgress, onSelect, onContinue, onDeactivate, onActivate, isCustom = false }: {
  path: any;
  isActive: boolean;
  pathProgress: number;
  onSelect: () => void;
  onContinue: () => void;
  onDeactivate: () => void;
  onActivate: () => void;
  isCustom?: boolean;
}) {
  const gradient = path.gradient || roleGradients['skill'];
  const Icon = path.icon || Brain;
  const categoryLabel = isCustom ? 'Custom' : (pathTypeLabels[path.pathType] || 'Path');
  const diffColor = difficultyColors[path.difficulty as string] || 'var(--color-accent-violet)';

  return (
    <motion.div
      layout
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      whileHover={{ y: -2, scale: 1.02 }}
      onClick={onSelect}
      className="group relative p-4 bg-card border border-border rounded-xl cursor-pointer hover:border-[var(--color-accent-violet)]/40 transition-all duration-150 ease-out overflow-hidden"
    >
      {/* Top accent line */}
      <div className="absolute top-0 left-0 right-0 h-0.5" style={{ background: gradient }} />
      {/* Hover overlay */}
      <div className="absolute inset-0 bg-gradient-to-br from-[var(--color-accent-violet)]/5 to-[var(--color-accent-cyan)]/5 opacity-0 group-hover:opacity-100 transition-opacity" />

      {/* Active badge */}
      {isActive && (
        <div className="absolute top-3 right-3 px-2 py-0.5 rounded-full text-[10px] font-bold z-10"
          style={{ background: `${gradient.includes('#') ? '#7c3aed' : 'var(--color-accent-violet)'}22`, border: `1px solid var(--color-accent-violet)66`, color: 'var(--color-accent-violet-light)' }}>
          ★ Active
        </div>
      )}

      <div className="relative space-y-3">
        {/* Icon + name row */}
        <div className="flex items-start gap-3">
          <div className="relative w-10 h-10 flex-shrink-0">
            {isActive && pathProgress > 0 && (
              <div className="absolute -inset-1 flex items-center justify-center pointer-events-none">
                <ProgressRing progress={pathProgress} size={48} stroke={3} />
              </div>
            )}
            <div className="absolute inset-0 rounded-xl flex items-center justify-center"
              style={{ background: gradient }}>
              <Icon className="w-4 h-4" style={{ color: 'var(--btn-primary-text)' }} />
            </div>
          </div>
          <div className="flex-1 min-w-0 pr-8">
            <div className="text-[10px] text-muted-foreground">{categoryLabel}</div>
            <h3 className="text-sm font-bold leading-tight line-clamp-2">{path.name}</h3>
          </div>
        </div>

        {/* Stats row */}
        <div className="flex items-center gap-3 text-[10px] text-muted-foreground flex-wrap">
          {isCustom ? (
            <span className="flex items-center gap-1">
              <Target className="w-3 h-3" />
              {(path.channels || []).length} channels
            </span>
          ) : (
            <span className="flex items-center gap-1">
              <Sparkles className="w-3 h-3" />
              {path.totalQuestions || 0}q
            </span>
          )}
          {path.duration && (
            <span className="flex items-center gap-1">
              <Clock className="w-3 h-3" />
              {path.duration}
            </span>
          )}
          {!isCustom && path.difficulty && (
            <span className="px-1.5 py-0.5 rounded-full font-bold"
              style={{ background: `${diffColor}22`, color: diffColor, border: `1px solid ${diffColor}44` }}>
              {path.difficulty}
            </span>
          )}
        </div>

        {/* Progress bar when active */}
        {isActive && (
          <div className="h-1 rounded-full overflow-hidden bg-muted">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${pathProgress}%` }}
              transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
              className="h-full rounded-full"
              style={{ background: gradient }}
            />
          </div>
        )}

        {/* Actions */}
        <div className="flex gap-2">
          {isActive ? (
            <>
              <button
                onClick={e => { e.stopPropagation(); onContinue(); }}
                className="flex-1 min-h-[44px] py-2 rounded-xl text-xs font-bold transition-all duration-150 ease-out flex items-center justify-center gap-1.5 text-white cursor-pointer"
                style={{ background: gradient }}
              >
                Continue <ChevronRight className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={e => { e.stopPropagation(); onDeactivate(); }}
                className="px-3 min-h-[44px] rounded-xl transition-all duration-150 ease-out hover:bg-muted/80 border border-border text-muted-foreground cursor-pointer"
                title="Deactivate"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </>
          ) : (
            <button
              onClick={e => { e.stopPropagation(); onActivate(); }}
              className="flex-1 min-h-[44px] py-2 rounded-xl text-xs font-bold transition-all duration-150 ease-out flex items-center justify-center gap-1.5 text-white cursor-pointer"
              style={{ background: gradient }}
            >
              <Plus className="w-3.5 h-3.5" />Start Path
            </button>
          )}
        </div>
      </div>
    </motion.div>
  );
}

// ─── PathSection ─────────────────────────────────────────────────────────────
function PathSection({ title, emoji, paths, activePaths, getPathProgress, onSelect, onContinue, onDeactivate, onActivate, isCustom = false }: {
  title: string;
  emoji: string;
  paths: any[];
  activePaths: any[];
  getPathProgress: (path: any) => number;
  onSelect: (path: any) => void;
  onContinue: (path: any) => void;
  onDeactivate: (pathId: string) => void;
  onActivate: (pathId: string) => void;
  isCustom?: boolean;
}) {
  const [open, setOpen] = useState(true);
  const activeCount = paths.filter(p => activePaths.some((a: any) => a.id === p.id)).length;

  return (
    <div className="mb-6">
      <button onClick={() => setOpen(o => !o)} className="w-full min-h-[44px] flex items-center justify-between px-1 py-2 mb-3 group cursor-pointer">
        <div className="flex items-center gap-2.5">
          <span className="text-xl">{emoji}</span>
          <div className="text-left">
            <div className="text-sm font-bold">{title}</div>
            <div className="text-[10px] text-muted-foreground">
              {paths.length} paths{activeCount > 0 ? ` · ${activeCount} active` : ''}
            </div>
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
              {paths.map(path => {
                const isActive = activePaths.some((a: any) => a.id === path.id);
                const pathProgress = isActive ? getPathProgress(path) : 0;
                return (
                  <PathCard
                    key={path.id}
                    path={path}
                    isActive={isActive}
                    pathProgress={pathProgress}
                    onSelect={() => onSelect(path)}
                    onContinue={() => onContinue(path)}
                    onDeactivate={() => onDeactivate(path.id)}
                    onActivate={() => onActivate(path.id)}
                    isCustom={isCustom}
                  />
                );
              })}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────
export default function UnifiedLearningPaths() {
  const [location, setLocation] = useLocation();
  const { preferences } = useUserPreferences();
  const { onboardingComplete, subscribedChannels, role } = preferences;

  const isRelevantPath = (path: any, userRole: string, channels: string[]): boolean => {
    const channelSet = new Set(channels);
    return (path.channels?.some((c: string) => channelSet.has(c)) ?? false)
      || (path.targetRoles?.includes(userRole) ?? false);
  };

  const personalized = isPersonalized(onboardingComplete, subscribedChannels);
  const defaultTab = location.startsWith('/my-path') ? 'custom' : personalized ? 'for-you' : 'all';
  const [view, setView] = useState<'all' | 'custom' | 'curated' | 'for-you'>(defaultTab as any);
  const [customPaths, setCustomPaths] = useState<CustomPath[]>([]);
  const [certifications, setCertifications] = useState<Certification[]>([]);
  const [curatedPaths, setCuratedPaths] = useState<any[]>([]);
  const [showPathModal, setShowPathModal] = useState(false);
  const [modalMode, setModalMode] = useState<'create' | 'edit' | 'view'>('create');
  const [selectedPath, setSelectedPath] = useState<any>(null);
  const [modalTab, setModalTab] = useState<'channels' | 'certifications'>('channels');
  const [searchQuery, setSearchQuery] = useState('');
  const [curatedSearchQuery, setCuratedSearchQuery] = useState('');
  const [filterDifficulty, setFilterDifficulty] = useState<string>('');
  const [filterRole, setFilterRole] = useState<string>('');
  const [customForm, setCustomForm] = useState({ name: '', channels: [] as string[], certifications: [] as string[] });
  const [editForm, setEditForm] = useState({ name: '', channels: [] as string[], certifications: [] as string[] });

  useEffect(() => {
    try {
      const saved = localStorage.getItem('customLearningPaths');
      if (saved) setCustomPaths(JSON.parse(saved));
    } catch (e) { console.error('Failed to load custom paths:', e); }
  }, []);

  useEffect(() => {
    async function loadCerts() {
      try {
        const basePath = import.meta.env.BASE_URL || '/';
        const response = await fetch(`${basePath}data/certifications.json`);
        if (response.ok) setCertifications(await response.json());
      } catch (e) { console.error('Failed to load certifications:', e); }
    }
    loadCerts();
  }, []);

  useEffect(() => {
    async function loadCuratedPaths() {
      try {
        const basePath = import.meta.env.BASE_URL || '/';
        const response = await fetch(`${basePath}data/learning-paths.json`);
        if (response.ok) {
          const data = await response.json();
          const mappedPaths = data.map((path: any) => {
            const questionIds = typeof path.questionIds === 'string' ? JSON.parse(path.questionIds) : path.questionIds;
            const channels = typeof path.channels === 'string' ? JSON.parse(path.channels) : path.channels;
            const tags = typeof path.tags === 'string' ? JSON.parse(path.tags) : path.tags;
            const learningObjectives = typeof path.learningObjectives === 'string' ? JSON.parse(path.learningObjectives) : path.learningObjectives;
            const milestones = typeof path.milestones === 'string' ? JSON.parse(path.milestones) : path.milestones;
            return {
              id: path.id,
              name: path.title,
              icon: getIconForPath(path.pathType),
              color: getColorForPath(path.pathType),
              gradient: roleGradients[path.pathType] || roleGradients['skill'],
              description: path.description,
              channels: channels || [],
              difficulty: path.difficulty.charAt(0).toUpperCase() + path.difficulty.slice(1),
              duration: `${path.estimatedHours}h`,
              totalQuestions: questionIds?.length || 0,
              jobs: learningObjectives?.slice(0, 3) || [],
              skills: tags?.slice(0, 5) || [],
              salary: getSalaryRange(path.targetJobTitle),
              pathType: path.pathType,
              targetCompany: path.targetCompany,
              milestones: milestones || [],
            };
          });
          setCuratedPaths(mappedPaths);
        }
      } catch (e) { console.error('Failed to load curated paths:', e); setCuratedPaths([]); }
    }
    loadCuratedPaths();
  }, []);

  const getIconForPath = (pathType: string) => {
    const map: Record<string, any> = { 'job-title': Code, 'company': Building2, 'skill': Brain, 'certification': Award };
    return map[pathType] || Rocket;
  };
  const getColorForPath = (pathType: string) => {
    const map: Record<string, string> = {
      'job-title': 'from-blue-500 to-cyan-500', 'company': 'from-green-500 to-emerald-500',
      'skill': 'from-purple-500 to-pink-500', 'certification': 'from-orange-500 to-red-500',
    };
    return map[pathType] || 'from-indigo-500 to-purple-500';
  };
  const getSalaryRange = (jobTitle: string | null) => {
    const map: Record<string, string> = {
      'frontend-engineer': '$80k–$120k', 'backend-engineer': '$90k–$140k',
      'fullstack-engineer': '$100k–$160k', 'devops-engineer': '$110k–$170k',
      'data-engineer': '$95k–$150k', 'mobile-developer': '$85k–$130k',
    };
    return jobTitle ? map[jobTitle] || '$80k–$150k' : '';
  };

  const [activePaths, setActivePaths] = useState<any[]>([]);
  useEffect(() => {
    try {
      const saved = localStorage.getItem('activeLearningPaths');
      if (saved) {
        const pathIds = JSON.parse(saved);
        const paths = pathIds.map((id: string) => {
          const custom = customPaths.find(p => p.id === id);
          if (custom) return { ...custom, type: 'custom' };
          const curated = curatedPaths.find(p => p.id === id);
          if (curated) return { ...curated, type: 'curated' };
          return null;
        }).filter(Boolean);
        setActivePaths(paths);
      } else { setActivePaths([]); }
    } catch { setActivePaths([]); }
  }, [customPaths, curatedPaths]);

  const activateCustomPath = (pathId: string) => {
    try {
      const saved = localStorage.getItem('activeLearningPaths');
      const current = saved ? JSON.parse(saved) : [];
      if (!current.includes(pathId)) { current.push(pathId); localStorage.setItem('activeLearningPaths', JSON.stringify(current)); window.location.reload(); }
    } catch (e) { console.error('Failed to activate path:', e); }
  };
  const deactivateCustomPath = (pathId: string) => {
    try {
      const saved = localStorage.getItem('activeLearningPaths');
      const current = saved ? JSON.parse(saved) : [];
      localStorage.setItem('activeLearningPaths', JSON.stringify(current.filter((id: string) => id !== pathId)));
      window.location.reload();
    } catch (e) { console.error('Failed to deactivate path:', e); }
  };
  const deleteCustomPath = (pathId: string) => {
    if (!confirm('Delete this path? This cannot be undone.')) return;
    try {
      const updated = customPaths.filter(p => p.id !== pathId);
      localStorage.setItem('customLearningPaths', JSON.stringify(updated));
      setCustomPaths(updated);
      deactivateCustomPath(pathId);
    } catch (e) { console.error('Failed to delete path:', e); }
  };
  const saveEditedPath = () => {
    if (!selectedPath || !editForm.name || (editForm.channels.length === 0 && editForm.certifications.length === 0)) {
      alert('Please enter a name and select at least one channel or certification'); return;
    }
    const updated = customPaths.map(p => p.id === selectedPath.id ? { ...p, name: editForm.name, channels: editForm.channels, certifications: editForm.certifications } : p);
    localStorage.setItem('customLearningPaths', JSON.stringify(updated));
    setCustomPaths(updated); setShowPathModal(false); setSelectedPath(null);
    setEditForm({ name: '', channels: [], certifications: [] });
  };
  const openPathModal = (path: any, mode: 'create' | 'edit' | 'view') => {
    setModalMode(mode); setSelectedPath(path); setModalTab('channels');
    if (mode === 'create') setCustomForm({ name: '', channels: [], certifications: [] });
    else if (mode === 'edit') setEditForm({ name: path.name, channels: path.channels || [], certifications: path.certifications || [] });
    setShowPathModal(true);
  };
  const closePathModal = () => { setShowPathModal(false); setSelectedPath(null); setModalMode('create'); setSearchQuery(''); };
  const toggleEditChannel = (channelId: string) => setEditForm(prev => ({ ...prev, channels: prev.channels.includes(channelId) ? prev.channels.filter(id => id !== channelId) : [...prev.channels, channelId] }));
  const toggleEditCertification = (certId: string) => setEditForm(prev => ({ ...prev, certifications: prev.certifications.includes(certId) ? prev.certifications.filter(id => id !== certId) : [...prev.certifications, certId] }));
  const saveCustomPath = () => {
    if (!customForm.name || (customForm.channels.length === 0 && customForm.certifications.length === 0)) {
      alert('Please enter a name and select at least one channel or certification'); return;
    }
    const newPath: CustomPath = { id: `custom-${Date.now()}`, name: customForm.name, channels: customForm.channels, certifications: customForm.certifications, createdAt: new Date().toISOString() };
    const updated = [...customPaths, newPath];
    localStorage.setItem('customLearningPaths', JSON.stringify(updated));
    setCustomPaths(updated); setCustomForm({ name: '', channels: [], certifications: [] });
    closePathModal(); activateCustomPath(newPath.id);
  };

  const getChannelCompleted = (channelId: string): number => {
    try {
      const raw = localStorage.getItem(`progress_${channelId}`);
      return raw ? (JSON.parse(raw) as string[]).length : 0;
    } catch { return 0; }
  };
  const getPathProgress = (path: any): number => {
    const channels: string[] = path.channels || [];
    if (channels.length === 0) return 0;
    const total = path.totalQuestions || channels.reduce((sum: number, id: string) => {
      const ch = Object.values(allChannelsConfig).find(c => c.id === id);
      return sum + (ch ? 10 : 0);
    }, 0);
    if (total === 0) return 0;
    const done = channels.reduce((sum: number, id: string) => sum + getChannelCompleted(id), 0);
    return Math.min(100, Math.round((done / total) * 100));
  };

  const getDailyProgress = (): number => {
    const today = new Date().toDateString();
    try {
      const raw = localStorage.getItem('dailyProgress');
      if (!raw) return 0;
      const data = JSON.parse(raw);
      return data.date === today ? (data.count || 0) : 0;
    } catch { return 0; }
  };
  const dailyDone = getDailyProgress();
  const DAILY_GOAL = 10;

  const subscribedSet = new Set(preferences.subscribedChannels);
  const hasSubscriptions = subscribedSet.size > 0;

  const filteredChannels = Object.values(allChannelsConfig)
    .filter(c => !hasSubscriptions || subscribedSet.has(c.id))
    .filter(c => c.name.toLowerCase().includes(searchQuery.toLowerCase()));
  const filteredCerts = certifications
    .filter(c => !hasSubscriptions || subscribedSet.has(c.id))
    .filter(c => c.name.toLowerCase().includes(searchQuery.toLowerCase()) || c.provider.toLowerCase().includes(searchQuery.toLowerCase()));

  const filterCuratedPaths = (paths: any[]) => paths.filter(path => {
    if (hasSubscriptions && path.channels?.length > 0 && !path.channels.some((c: string) => subscribedSet.has(c))) return false;
    const q = curatedSearchQuery.toLowerCase();
    const matchesSearch = !q || path.name.toLowerCase().includes(q) || path.description.toLowerCase().includes(q)
      || (path.targetCompany && path.targetCompany.toLowerCase().includes(q))
      || path.channels?.some((c: string) => c.toLowerCase().includes(q))
      || path.skills?.some((s: string) => s.toLowerCase().includes(q))
      || path.jobs?.some((j: string) => j.toLowerCase().includes(q))
      || path.difficulty?.toLowerCase().includes(q);
    return matchesSearch && (!filterDifficulty || path.difficulty === filterDifficulty) && (!filterRole || path.pathType === filterRole);
  });

  const isReadonly = modalMode === 'view';
  const currentChannels = modalMode === 'create' ? customForm.channels : (modalMode === 'edit' ? editForm.channels : selectedPath?.channels || []);
  const currentCertifications = modalMode === 'create' ? customForm.certifications : (modalMode === 'edit' ? editForm.certifications : selectedPath?.certifications || []);
  const visibleCurated = filterCuratedPaths(curatedPaths);

  // Stats
  const avgProgress = activePaths.length > 0
    ? Math.round(activePaths.reduce((acc, p) => acc + getPathProgress(p), 0) / activePaths.length)
    : 0;

  return (
    <>
      <SEOHead title="Learning Paths - Open-Interview" description="Choose your career path and start learning" />
      <AppLayout fullWidth>
        <div className="min-h-screen bg-background text-foreground pb-24">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8 sm:py-12 w-full overflow-x-hidden">

            <PageHeader
              title="Learning Paths"
              subtitle={`${activePaths.length > 0 ? `${activePaths.length} active · ` : ''}${customPaths.length} custom · ${curatedPaths.length} curated`}
            >
              <motion.button
                whileHover={{ scale: 1.04 }}
                whileTap={{ scale: 0.97 }}
                onClick={() => openPathModal(null, 'create')}
                className="inline-flex items-center gap-2 mt-5 px-5 py-2.5 rounded-full text-sm font-bold text-white cursor-pointer transition-all duration-150 shadow-lg hover:shadow-violet-500/30"
                style={{ background: 'var(--gradient-primary)' }}
              >
                <Plus className="w-4 h-4" strokeWidth={3} />
                Create Custom Path
              </motion.button>
            </PageHeader>

            {/* Stats bar */}
            {activePaths.length > 0 && (
              <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
                className="grid grid-cols-3 gap-3 mb-6 max-w-lg mx-auto">
                {[
                  { label: 'Active Paths', value: activePaths.length, colorClass: 'text-[var(--color-accent-violet-light)]' },
                  { label: 'Total Paths', value: curatedPaths.length + customPaths.length, colorClass: 'text-[var(--color-accent-cyan)]' },
                  { label: 'Avg Progress', value: `${avgProgress}%`, colorClass: 'text-[var(--color-success)]' },
                ].map(({ label, value, colorClass }) => (
                  <div key={label} className="p-3 rounded-xl bg-muted/40 border border-border text-center">
                    <div className={`text-xl font-bold ${colorClass}`}>{value}</div>
                    <div className="text-[10px] text-muted-foreground">{label}</div>
                  </div>
                ))}
              </motion.div>
            )}

            {/* View Tabs */}
            <FilterPills
              options={[
                ...(personalized ? [{ id: 'for-you', label: 'For You' }] : []),
                { id: 'all', label: 'All Paths' },
                { id: 'custom', label: 'My Custom' },
                { id: 'curated', label: 'Curated' },
              ]}
              active={view}
              onChange={id => setView(id as any)}
              className="px-1 mb-6"
            />

            {/* Create New Path Button — moved to page header */}

            {/* For You */}
            {view === 'for-you' && (() => {
              const forYouPaths = curatedPaths.filter(p => isRelevantPath(p, role ?? '', subscribedChannels));
              return forYouPaths.length === 0 ? (
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-center py-16">
                  <Sparkles className="w-12 h-12 mx-auto mb-3" style={{ color: 'var(--text-tertiary)' }} />
                  <p className="text-base mb-4" style={{ color: 'var(--text-secondary)' }}>No paths match your topics yet.</p>
                  <button onClick={() => setLocation('/channels')}
                    className="px-5 py-2.5 rounded-xl text-sm font-bold text-white transition-all duration-150 ease-out hover:opacity-90 cursor-pointer"
                    style={{ background: 'var(--gradient-primary)' }}>
                    Update Subscriptions
                  </button>
                </motion.div>
              ) : (
                <PathSection
                  title="For You"
                  emoji="✨"
                  paths={forYouPaths}
                  activePaths={activePaths}
                  getPathProgress={getPathProgress}
                  onSelect={path => openPathModal(path, 'view')}
                  onContinue={path => path.channels?.[0] && setLocation(`/channel/${path.channels[0]}`)}
                  onDeactivate={deactivateCustomPath}
                  onActivate={activateCustomPath}
                />
              );
            })()}

            {/* Active Paths */}
            {activePaths.length > 0 && (view === 'all' || view === 'custom') && (
              <div className="mb-10">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-2xl font-bold flex items-center gap-2">
                    <Zap className="w-6 h-6" style={{ color: 'var(--color-accent-violet)' }} />
                    My Active Paths
                  </h2>
                  <span className="text-xs px-2.5 py-1 rounded-full font-semibold" style={{ background: 'color-mix(in srgb, var(--color-accent-violet) 15%, transparent)', color: 'var(--color-accent-violet-light)' }}>
                    {activePaths.length} active
                  </span>
                </div>

                {/* Daily goal bar */}
                <div className="mb-4 p-4 rounded-2xl border" style={{ background: 'color-mix(in srgb, var(--color-accent-violet) 6%, transparent)', borderColor: 'color-mix(in srgb, var(--color-accent-violet) 20%, transparent)' }}>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-semibold flex items-center gap-1.5" style={{ color: 'var(--text-secondary)' }}>
                      <Target className="w-3.5 h-3.5" style={{ color: 'var(--color-accent-violet)' }} />
                      Daily Goal
                    </span>
                    <span className="text-xs font-bold" style={{ color: 'var(--color-accent-violet-light)' }}>{dailyDone} / {DAILY_GOAL} questions</span>
                  </div>
                  <div className="h-2 rounded-full overflow-hidden" style={{ background: 'var(--surface-4)' }}>
                    <div className="h-full rounded-full transition-all" style={{ background: 'var(--gradient-primary)', width: `${Math.min(100, (dailyDone / DAILY_GOAL) * 100)}%` }} />
                  </div>
                  <p className="text-xs mt-2" style={{ color: 'var(--text-tertiary)' }}>
                    Recommended next: <span className="font-semibold" style={{ color: 'var(--text-primary)' }}>
                      {activePaths[0]?.channels?.[0]
                        ? Object.values(allChannelsConfig).find(c => c.id === activePaths[0].channels[0])?.name || activePaths[0].channels[0]
                        : activePaths[0]?.name}
                    </span>
                  </p>
                </div>

                <div className="flex gap-4 overflow-x-auto pb-3 -mx-4 px-4 md:mx-0 md:px-0 scrollbar-hide">
                  {activePaths.slice(0, 3).map((path: any) => {
                    const Icon = path.icon || Brain;
                    const pathProgress = getPathProgress(path);
                    return (
                      <motion.div key={path.id} initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }}
                        whileHover={{ y: -4, boxShadow: 'var(--glow-violet)' }}
                        className="flex-shrink-0 w-72 rounded-2xl p-4 border relative overflow-hidden"
                        style={{ background: 'var(--surface-2)', borderColor: 'color-mix(in srgb, var(--color-accent-violet) 35%, transparent)' }}>
                        <div className="absolute top-0 left-0 right-0 h-0.5 rounded-t-2xl" style={{ background: path.gradient || 'var(--gradient-primary)' }} />
                        <div className="flex items-center justify-between mb-3 mt-1">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: path.gradient || 'var(--gradient-primary)' }}>
                              <Icon className="w-5 h-5" style={{ color: 'var(--btn-primary-text)' }} strokeWidth={2.5} />
                            </div>
                            <div className="min-w-0">
                              <p className="font-bold text-sm truncate">{path.name}</p>
                              <p className="text-xs" style={{ color: 'var(--text-tertiary)' }}>{path.duration || 'Custom path'}</p>
                            </div>
                          </div>
                          <div className="relative flex-shrink-0">
                            <ProgressRing progress={pathProgress} size={40} stroke={3} color="var(--color-accent-violet)" />
                            <span className="absolute inset-0 flex items-center justify-center text-xs font-bold">{pathProgress}%</span>
                          </div>
                        </div>
                        {path.channels?.length > 0 && (
                          <p className="text-xs mb-3 truncate" style={{ color: 'var(--text-tertiary)' }}>
                            {path.channels.slice(0, 3).map((c: string) => Object.values(allChannelsConfig).find(ch => ch.id === c)?.name || c).join(' → ')}
                          </p>
                        )}
                        <div className="flex gap-2">
                          <button onClick={() => path.channels?.[0] && setLocation(`/channel/${path.channels[0]}`)}
                            className="flex-1 min-h-[44px] py-2 rounded-xl text-xs font-bold text-white transition-all duration-150 ease-out hover:opacity-90 cursor-pointer"
                            style={{ background: 'var(--gradient-primary)' }}>Continue</button>
                          <button onClick={() => deactivateCustomPath(path.id)}
                            className="px-2.5 min-h-[44px] rounded-xl transition-all duration-150 ease-out hover:bg-red-500/20 cursor-pointer"
                            style={{ background: 'var(--surface-3)' }}>
                            <X className="w-3.5 h-3.5" style={{ color: 'var(--color-error)' }} />
                          </button>
                        </div>
                      </motion.div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Custom Paths */}
            {(view === 'all' || view === 'custom') && customPaths.length > 0 && (
              <PathSection
                title="My Custom Paths"
                emoji="🧠"
                paths={customPaths}
                activePaths={activePaths}
                getPathProgress={getPathProgress}
                onSelect={path => openPathModal(path, 'edit')}
                onContinue={path => path.channels?.[0] && setLocation(`/channel/${path.channels[0]}`)}
                onDeactivate={deactivateCustomPath}
                onActivate={activateCustomPath}
                isCustom
              />
            )}

            {view === 'custom' && customPaths.length === 0 && (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-center py-16">
                <Brain className="w-12 h-12 mx-auto mb-3" style={{ color: 'var(--text-tertiary)' }} />
                <h3 className="text-xl font-bold mb-2">No custom paths yet</h3>
                <p className="text-sm mb-5" style={{ color: 'var(--text-secondary)' }}>Build a path tailored to your goals.</p>
                <button onClick={() => openPathModal(null, 'create')}
                  className="px-5 py-2.5 rounded-xl text-sm font-bold text-white transition-all duration-150 ease-out hover:opacity-90 cursor-pointer"
                  style={{ background: 'var(--gradient-primary)' }}>
                  Create Your First Path
                </button>
              </motion.div>
            )}

            {/* Curated Paths */}
            {(view === 'all' || view === 'curated') && (
              <div>
                {/* Filters */}
                <div className="flex flex-col sm:flex-row gap-3 mb-6">
                  <SearchBar value={curatedSearchQuery} onChange={setCuratedSearchQuery} placeholder="Search paths…" className="flex-1" />
                  <select value={filterDifficulty} onChange={e => setFilterDifficulty(e.target.value)}
                    className="px-3 py-2.5 rounded-xl text-sm focus:outline-none cursor-pointer min-h-[44px]"
                    style={{ background: 'var(--surface-3)', border: '1px solid var(--color-border)', color: 'var(--text-primary)' }}>
                    <option value="">All Levels</option>
                    <option value="Beginner">Beginner</option>
                    <option value="Intermediate">Intermediate</option>
                    <option value="Advanced">Advanced</option>
                  </select>
                  <select value={filterRole} onChange={e => setFilterRole(e.target.value)}
                    className="px-3 py-2.5 rounded-xl text-sm focus:outline-none cursor-pointer min-h-[44px]"
                    style={{ background: 'var(--surface-3)', border: '1px solid var(--color-border)', color: 'var(--text-primary)' }}>
                    <option value="">All Types</option>
                    <option value="job-title">Job Title</option>
                    <option value="company">Company</option>
                    <option value="skill">Skill</option>
                    <option value="certification">Certification</option>
                  </select>
                </div>

                {visibleCurated.length === 0 && curatedSearchQuery ? (
                  <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-center py-16">
                    <Search className="w-12 h-12 mx-auto mb-3" style={{ color: 'var(--text-tertiary)' }} />
                    <h3 className="text-xl font-bold mb-2">No paths found</h3>
                    <button onClick={() => setCuratedSearchQuery('')} className="text-sm cursor-pointer hover:underline" style={{ color: 'var(--color-accent-violet-light)' }}>Clear search</button>
                  </motion.div>
                ) : (
                  <PathSection
                    title="Curated Paths"
                    emoji="⭐"
                    paths={visibleCurated}
                    activePaths={activePaths}
                    getPathProgress={getPathProgress}
                    onSelect={path => openPathModal(path, 'view')}
                    onContinue={path => path.channels?.[0] && setLocation(`/channel/${path.channels[0]}`)}
                    onDeactivate={deactivateCustomPath}
                    onActivate={activateCustomPath}
                  />
                )}
              </div>
            )}

          </div>
        </div>

        {/* Path Modal */}
        <AnimatePresence>
          {showPathModal && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="fixed inset-0 z-50 flex items-end md:items-center justify-center md:p-6"
              style={{ background: 'var(--surface-overlay, rgba(0,0,0,0.6))', backdropFilter: 'blur(8px)' }}
              onClick={closePathModal}>
              <motion.div initial={{ y: '100%' }} animate={{ y: 0 }} exit={{ y: '100%' }}
                transition={{ type: 'spring', damping: 30, stiffness: 300 }}
                onClick={(e) => e.stopPropagation()}
                className="w-full max-w-3xl h-[90vh] md:h-auto md:max-h-[85vh] flex flex-col overflow-hidden md:mb-0 mb-16"
                style={{ background: 'var(--surface-2)', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-3xl) var(--radius-3xl) 0 0' }}>
                <div className="flex justify-center pt-3 pb-1 md:hidden">
                  <div className="w-10 h-1 rounded-full" style={{ background: 'var(--color-border-strong)' }} />
                </div>
                <div className="px-5 py-4 border-b flex-shrink-0" style={{ borderColor: 'var(--color-border)' }}>
                  <div className="flex items-center justify-between mb-3">
                    <h2 className="text-lg font-bold truncate pr-2">
                      {modalMode === 'create' ? 'Create Path' : modalMode === 'edit' ? 'Edit Path' : selectedPath?.name}
                    </h2>
                    <button onClick={closePathModal} className="w-10 h-10 rounded-full flex items-center justify-center transition-all duration-150 ease-out hover:bg-white/10 cursor-pointer flex-shrink-0" style={{ background: 'var(--surface-3)' }}>
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                  {!isReadonly && (
                    <input type="text" placeholder="Path name…"
                      value={modalMode === 'create' ? customForm.name : editForm.name}
                      onChange={(e) => modalMode === 'create' ? setCustomForm(p => ({ ...p, name: e.target.value })) : setEditForm(p => ({ ...p, name: e.target.value }))}
                      className="w-full px-4 py-3 rounded-xl text-sm focus:outline-none transition-all"
                      style={{ background: 'var(--surface-3)', border: '1px solid var(--color-border)', color: 'var(--text-primary)' }} />
                  )}
                  {isReadonly && selectedPath && (
                    <div>
                      <p className="text-sm mb-3" style={{ color: 'var(--text-secondary)' }}>{selectedPath.description}</p>
                      <div className="grid grid-cols-3 gap-2 mb-3">
                        {[{ icon: Clock, label: 'Duration', val: selectedPath.duration }, { icon: Target, label: 'Questions', val: selectedPath.totalQuestions }, { icon: Trophy, label: 'Level', val: selectedPath.difficulty }].map(({ icon: Ic, label, val }) => (
                          <div key={label} className="p-2.5 rounded-xl" style={{ background: 'var(--surface-3)' }}>
                            <div className="flex items-center gap-1 text-xs mb-1" style={{ color: 'var(--text-tertiary)' }}><Ic className="w-3 h-3" />{label}</div>
                            <div className="font-bold text-sm">{val}</div>
                          </div>
                        ))}
                      </div>
                      {selectedPath.channels?.length > 0 && (
                        <div className="mb-3">
                          <p className="text-xs font-semibold mb-2" style={{ color: 'var(--text-secondary)' }}>Chapters</p>
                          <div className="space-y-1.5">
                            {selectedPath.channels.map((c: string, i: number) => {
                              const ch = Object.values(allChannelsConfig).find(ch => ch.id === c);
                              return (
                                <div key={c} className="flex items-center gap-2.5 p-2 rounded-xl" style={{ background: 'var(--surface-3)' }}>
                                  <div className="w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0 text-xs font-bold" style={{ background: 'color-mix(in srgb, var(--color-accent-violet) 20%, transparent)', color: 'var(--color-accent-violet-light)' }}>{i + 1}</div>
                                  <span className="text-xs font-medium flex-1">{ch?.name || c}</span>
                                  <Check className="w-3.5 h-3.5 opacity-20 flex-shrink-0" style={{ color: 'var(--color-success)' }} />
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      )}
                      {selectedPath.jobs?.length > 0 && (
                        <div className="mb-2">
                          <p className="text-xs font-semibold mb-1.5" style={{ color: 'var(--text-secondary)' }}>What you'll learn</p>
                          <div className="space-y-1">
                            {selectedPath.jobs.map((obj: string, i: number) => (
                              <div key={i} className="flex items-start gap-2 text-xs" style={{ color: 'var(--text-secondary)' }}>
                                <Check className="w-3.5 h-3.5 mt-0.5 flex-shrink-0" style={{ color: 'var(--color-accent-violet)' }} />{obj}
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                      {selectedPath.skills?.length > 0 && (
                        <div className="flex flex-wrap gap-1.5 mt-2">
                          {selectedPath.skills.map((s: string, i: number) => (
                            <span key={i} className="px-2 py-0.5 rounded-full text-xs" style={{ background: 'color-mix(in srgb, var(--color-accent-violet) 15%, transparent)', color: 'var(--color-accent-violet-light)' }}>{s}</span>
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                </div>
                <div className="flex border-b flex-shrink-0" style={{ borderColor: 'var(--color-border)' }}>
                  {(['channels', 'certifications'] as const).map((tab) => {
                    const count = tab === 'channels' ? currentChannels.length : currentCertifications.length;
                    return (
                      <button key={tab} onClick={() => setModalTab(tab)}
                        className="flex-1 min-h-[44px] py-3 text-xs font-semibold capitalize relative transition-colors duration-150 ease-out cursor-pointer"
                        style={{ color: modalTab === tab ? 'var(--color-accent-violet-light)' : 'var(--text-tertiary)' }}>
                        {tab} ({count})
                        {modalTab === tab && <motion.div layoutId="modal-tab" className="absolute bottom-0 left-0 right-0 h-0.5" style={{ background: 'var(--color-accent-violet)' }} />}
                      </button>
                    );
                  })}
                </div>
                {!isReadonly && (
                  <div className="p-3 border-b flex-shrink-0" style={{ borderColor: 'var(--color-border)' }}>
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: 'var(--text-tertiary)' }} />
                      <input type="text" placeholder={`Search ${modalTab}…`} value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full pl-9 pr-3 py-2.5 rounded-xl text-sm focus:outline-none"
                        style={{ background: 'var(--surface-3)', border: '1px solid var(--color-border)', color: 'var(--text-primary)' }} />
                    </div>
                  </div>
                )}
                <div className="flex-1 overflow-y-auto p-3 overscroll-contain">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2 pb-4">
                    {modalTab === 'channels'
                      ? (isReadonly ? Object.values(allChannelsConfig).filter(c => currentChannels.includes(c.id)) : filteredChannels).map((channel) => {
                          const isSelected = currentChannels.includes(channel.id);
                          return (
                            <button key={channel.id} onClick={() => { if (isReadonly) return; if (modalMode === 'create') setCustomForm(p => ({ ...p, channels: isSelected ? p.channels.filter(id => id !== channel.id) : [...p.channels, channel.id] })); else toggleEditChannel(channel.id); }}
                              disabled={isReadonly} className="p-3 min-h-[44px] rounded-xl border text-left transition-all duration-150 ease-out cursor-pointer"
                              style={{ background: isSelected ? 'color-mix(in srgb, var(--color-accent-violet) 12%, transparent)' : 'var(--surface-3)', borderColor: isSelected ? 'var(--color-accent-violet)' : 'var(--color-border)' }}>
                              <div className="flex items-center justify-between">
                                <span className="font-medium text-sm">{channel.name}</span>
                                {isSelected && <Check className="w-4 h-4 flex-shrink-0" style={{ color: 'var(--color-accent-violet)' }} />}
                              </div>
                            </button>
                          );
                        })
                      : (isReadonly ? certifications.filter(c => currentCertifications.includes(c.id)) : filteredCerts).map((cert) => {
                          const isSelected = currentCertifications.includes(cert.id);
                          return (
                            <button key={cert.id} onClick={() => { if (isReadonly) return; if (modalMode === 'create') setCustomForm(p => ({ ...p, certifications: isSelected ? p.certifications.filter(id => id !== cert.id) : [...p.certifications, cert.id] })); else toggleEditCertification(cert.id); }}
                              disabled={isReadonly} className="p-3 min-h-[44px] rounded-xl border text-left transition-all duration-150 ease-out cursor-pointer"
                              style={{ background: isSelected ? 'color-mix(in srgb, var(--color-accent-violet) 12%, transparent)' : 'var(--surface-3)', borderColor: isSelected ? 'var(--color-accent-violet)' : 'var(--color-border)' }}>
                              <div className="flex items-center justify-between gap-2">
                                <div className="min-w-0">
                                  <div className="text-xs mb-0.5" style={{ color: 'var(--text-tertiary)' }}>{cert.provider}</div>
                                  <div className="font-medium text-xs truncate">{cert.name}</div>
                                </div>
                                {isSelected && <Check className="w-4 h-4 flex-shrink-0" style={{ color: 'var(--color-accent-violet)' }} />}
                              </div>
                            </button>
                          );
                        })
                    }
                  </div>
                </div>
                <div className="p-4 border-t flex-shrink-0" style={{ borderColor: 'var(--color-border)', background: 'var(--surface-2)' }}>
                  {isReadonly ? (
                    <button onClick={() => { activateCustomPath(selectedPath.id); closePathModal(); }}
                      className="w-full py-3.5 rounded-xl font-bold text-white transition-all duration-150 ease-out hover:opacity-90 active:scale-95 cursor-pointer"
                      style={{ background: selectedPath?.gradient || 'var(--gradient-primary)' }}>
                      {activePaths.some(p => p.id === selectedPath?.id) ? 'Resume Path' : 'Start Path'}
                    </button>
                  ) : (
                    <button onClick={modalMode === 'create' ? saveCustomPath : saveEditedPath}
                      disabled={(modalMode === 'create' && (!customForm.name || (customForm.channels.length === 0 && customForm.certifications.length === 0))) || (modalMode === 'edit' && (!editForm.name || (editForm.channels.length === 0 && editForm.certifications.length === 0)))}
                      className="w-full py-3.5 rounded-xl font-bold text-white transition-all duration-150 ease-out hover:opacity-90 active:scale-95 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
                      style={{ background: 'var(--gradient-primary)' }}>
                      {modalMode === 'create' ? 'Create Path' : 'Save Changes'}
                    </button>
                  )}
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

      </AppLayout>
    </>
  );
}
