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
import { FloatingButton } from '../components/mobile';
import {
  Plus, Trash2, Edit, ChevronRight, Brain, Check, Target, Clock, Sparkles, Award,
  Code, Server, Rocket, X, Search, Star, Zap, Trophy, Building2
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

export default function UnifiedLearningPathsGenZ() {
  const [, setLocation] = useLocation();
  const [view, setView] = useState<'all' | 'custom' | 'curated'>('all');
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
    const iconMap: Record<string, any> = { 'job-title': Code, 'company': Building2, 'skill': Brain, 'certification': Award };
    return iconMap[pathType] || Rocket;
  };
  const getColorForPath = (pathType: string) => {
    const colorMap: Record<string, string> = {
      'job-title': 'from-blue-500 to-cyan-500', 'company': 'from-green-500 to-emerald-500',
      'skill': 'from-purple-500 to-pink-500', 'certification': 'from-orange-500 to-red-500',
    };
    return colorMap[pathType] || 'from-indigo-500 to-purple-500';
  };
  const getSalaryRange = (jobTitle: string | null) => {
    const salaryMap: Record<string, string> = {
      'frontend-engineer': '$80k–$120k', 'backend-engineer': '$90k–$140k',
      'fullstack-engineer': '$100k–$160k', 'devops-engineer': '$110k–$170k',
      'data-engineer': '$95k–$150k', 'mobile-developer': '$85k–$130k',
    };
    return jobTitle ? salaryMap[jobTitle] || '$80k–$150k' : '';
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

  // Read per-channel progress from localStorage (same key as AllChannels)
  const getChannelCompleted = (channelId: string): number => {
    try {
      const raw = localStorage.getItem(`progress_${channelId}`);
      return raw ? (JSON.parse(raw) as string[]).length : 0;
    } catch { return 0; }
  };

  // Aggregate progress across all channels in a path (0–100)
  const getPathProgress = (path: any): number => {
    const channels: string[] = path.channels || [];
    if (channels.length === 0) return 0;
    const total = path.totalQuestions || channels.reduce((sum: number, id: string) => {
      const ch = Object.values(allChannelsConfig).find(c => c.id === id);
      return sum + (ch ? 10 : 0); // fallback estimate
    }, 0);
    if (total === 0) return 0;
    const done = channels.reduce((sum: number, id: string) => sum + getChannelCompleted(id), 0);
    return Math.min(100, Math.round((done / total) * 100));
  };

  // Daily goal: count questions answered today across active path channels
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

  const filteredChannels = Object.values(allChannelsConfig).filter(c => c.name.toLowerCase().includes(searchQuery.toLowerCase()));
  const filteredCerts = certifications.filter(c => c.name.toLowerCase().includes(searchQuery.toLowerCase()) || c.provider.toLowerCase().includes(searchQuery.toLowerCase()));

  const filterCuratedPaths = (paths: any[]) => {
    return paths.filter(path => {
      const q = curatedSearchQuery.toLowerCase();
      const matchesSearch = !q || path.name.toLowerCase().includes(q) || path.description.toLowerCase().includes(q)
        || (path.targetCompany && path.targetCompany.toLowerCase().includes(q))
        || path.channels?.some((c: string) => c.toLowerCase().includes(q))
        || path.skills?.some((s: string) => s.toLowerCase().includes(q))
        || path.jobs?.some((j: string) => j.toLowerCase().includes(q))
        || path.difficulty?.toLowerCase().includes(q);
      const matchesDiff = !filterDifficulty || path.difficulty === filterDifficulty;
      const matchesRole = !filterRole || path.pathType === filterRole;
      return matchesSearch && matchesDiff && matchesRole;
    });
  };

  const isReadonly = modalMode === 'view';
  const currentChannels = modalMode === 'create' ? customForm.channels : (modalMode === 'edit' ? editForm.channels : selectedPath?.channels || []);
  const currentCertifications = modalMode === 'create' ? customForm.certifications : (modalMode === 'edit' ? editForm.certifications : selectedPath?.certifications || []);
  const visibleCurated = filterCuratedPaths(curatedPaths);

  const stagger = { hidden: {}, visible: { transition: { staggerChildren: 0.06 } } };
  const fadeUp = { hidden: { opacity: 0, y: 20 }, visible: { opacity: 1, y: 0, transition: { duration: 0.35, ease: [0.16, 1, 0.3, 1] as [number,number,number,number] } } };

  return (
    <>
      <SEOHead title="Learning Paths - Open-Interview" description="Choose your career path and start learning" />
      <AppLayout>
        <div className="min-h-screen pb-24" style={{ background: 'var(--surface-0)', color: 'var(--text-primary)' }}>
          <div className="max-w-7xl mx-auto px-4 md:px-6 py-8 md:py-12 w-full overflow-x-hidden">

            {/* Header */}
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="mb-8 md:mb-12">
              <h1 className="text-4xl md:text-6xl font-bold mb-3 tracking-tight" style={{ letterSpacing: 'var(--tracking-tight)' }}>
                Learning
                <br />
                <span className="gradient-text">Paths</span>
              </h1>
              <p className="text-base md:text-lg" style={{ color: 'var(--text-secondary)' }}>
                {activePaths.length > 0 && `${activePaths.length} active · `}
                {customPaths.length} custom · {curatedPaths.length} curated
              </p>
            </motion.div>

            {/* View Tabs */}
            <div className="flex gap-2 mb-6 overflow-x-auto pb-2 -mx-4 px-4 md:mx-0 md:px-0 scrollbar-hide">
              {([
                { id: 'all', label: 'All Paths', icon: Sparkles },
                { id: 'custom', label: 'My Custom', icon: Brain },
                { id: 'curated', label: 'Curated', icon: Star },
              ] as const).map(({ id, label, icon: Icon }) => (
                <button
                  key={id}
                  onClick={() => setView(id)}
                  className="flex items-center gap-2 px-5 py-2.5 rounded-full font-semibold transition-all whitespace-nowrap text-sm"
                  style={view === id
                    ? { background: 'var(--gradient-primary)', color: '#fff' }
                    : { background: 'var(--surface-3)', color: 'var(--text-secondary)' }}
                >
                  <Icon className="w-4 h-4" />
                  {label}
                </button>
              ))}
            </div>

            {/* Create New Path Button */}
            <motion.button
              whileHover={{ scale: 1.01, boxShadow: 'var(--glow-violet)' }}
              whileTap={{ scale: 0.98 }}
              onClick={() => openPathModal(null, 'create')}
              className="w-full p-5 md:p-7 rounded-2xl border-2 border-dashed mb-8 transition-all group flex items-center justify-between"
              style={{ background: 'rgba(124,58,237,0.08)', borderColor: 'rgba(124,58,237,0.3)' }}
            >
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-full flex items-center justify-center flex-shrink-0" style={{ background: 'var(--gradient-primary)' }}>
                  <Plus className="w-6 h-6 text-white" strokeWidth={3} />
                </div>
                <div className="text-left">
                  <h3 className="text-lg font-bold">Create Custom Path</h3>
                  <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>Build your own learning journey</p>
                </div>
              </div>
              <ChevronRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" style={{ color: 'var(--color-accent-violet)' }} />
            </motion.button>

            {/* Active Paths — up to 3, with daily goal + recommended next step */}
            {activePaths.length > 0 && (view === 'all' || view === 'custom') && (
              <div className="mb-10">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-2xl font-bold flex items-center gap-2">
                    <Zap className="w-6 h-6" style={{ color: 'var(--color-accent-violet)' }} />
                    My Active Paths
                  </h2>
                  <span className="text-xs px-2.5 py-1 rounded-full font-semibold" style={{ background: 'rgba(124,58,237,0.15)', color: 'var(--color-accent-violet-light)' }}>
                    {activePaths.length} active
                  </span>
                </div>

                {/* Daily goal bar */}
                <div className="mb-4 p-4 rounded-2xl border" style={{ background: 'rgba(124,58,237,0.06)', borderColor: 'rgba(124,58,237,0.2)' }}>
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
                      <motion.div
                        key={path.id}
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        whileHover={{ y: -4, boxShadow: 'var(--glow-violet)' }}
                        className="flex-shrink-0 w-72 rounded-2xl p-4 border relative overflow-hidden"
                        style={{ background: 'var(--surface-2)', borderColor: 'rgba(124,58,237,0.35)' }}
                      >
                        {/* gradient accent border top */}
                        <div className="absolute top-0 left-0 right-0 h-[2px] rounded-t-2xl" style={{ background: path.gradient || 'var(--gradient-primary)' }} />

                        <div className="flex items-center justify-between mb-3 mt-1">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: path.gradient || 'var(--gradient-primary)' }}>
                              <Icon className="w-5 h-5 text-white" strokeWidth={2.5} />
                            </div>
                            <div className="min-w-0">
                              <p className="font-bold text-sm truncate">{path.name}</p>
                              <p className="text-xs" style={{ color: 'var(--text-tertiary)' }}>{path.duration || 'Custom path'}</p>
                            </div>
                          </div>
                          <div className="relative flex-shrink-0">
                            <ProgressRing progress={pathProgress} size={40} stroke={3} color="var(--color-accent-violet)" />
                            <span className="absolute inset-0 flex items-center justify-center text-[10px] font-bold">{pathProgress}%</span>
                          </div>
                        </div>

                        {/* Progress bar */}
                        <div className="mb-1 flex items-center justify-between text-[10px]" style={{ color: 'var(--text-tertiary)' }}>
                          <span>Progress</span><span>{pathProgress}%</span>
                        </div>
                        <div className="h-1.5 rounded-full overflow-hidden mb-3" style={{ background: 'var(--surface-4)' }}>
                          <div className="h-full rounded-full transition-all" style={{ background: path.gradient || 'var(--gradient-primary)', width: `${pathProgress}%` }} />
                        </div>

                        {/* Chapter breadcrumb */}
                        {path.channels?.length > 0 && (
                          <p className="text-[10px] mb-3 truncate" style={{ color: 'var(--text-tertiary)' }}>
                            {path.channels.slice(0, 3).map((c: string) =>
                              Object.values(allChannelsConfig).find(ch => ch.id === c)?.name || c
                            ).join(' → ')}
                          </p>
                        )}

                        <div className="flex gap-2">
                          <button
                            onClick={() => path.channels?.[0] && setLocation(`/channel/${path.channels[0]}`)}
                            className="flex-1 py-2 rounded-xl text-xs font-bold text-white transition-all hover:opacity-90"
                            style={{ background: 'var(--gradient-primary)' }}
                          >
                            Continue
                          </button>
                          <button
                            onClick={() => deactivateCustomPath(path.id)}
                            className="px-2.5 py-2 rounded-xl transition-all hover:bg-red-500/20"
                            style={{ background: 'var(--surface-3)' }}
                          >
                            <X className="w-3.5 h-3.5" style={{ color: 'var(--color-error)' }} />
                          </button>
                        </div>
                      </motion.div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Custom Paths Grid */}
            {(view === 'all' || view === 'custom') && customPaths.length > 0 && (
              <div className="mb-10">
                <h2 className="text-2xl font-bold mb-4 flex items-center gap-2">
                  <Brain className="w-6 h-6" style={{ color: 'var(--color-accent-violet-light)' }} />
                  My Custom Paths
                </h2>
                <motion.div variants={stagger} initial="hidden" animate="visible" className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {customPaths.map((path) => {
                    const isActive = activePaths.some((p: any) => p.id === path.id);
                    return (
                      <motion.div
                        key={path.id}
                        variants={fadeUp}
                        whileHover={{ y: -3, boxShadow: 'var(--shadow-md)' }}
                        className="p-5 rounded-2xl border transition-all"
                        style={{ background: 'var(--surface-2)', borderColor: isActive ? 'rgba(124,58,237,0.4)' : 'var(--color-border)' }}
                      >
                        <div className="flex items-start justify-between mb-3">
                          <h3 className="text-base font-bold flex-1 min-w-0 truncate">{path.name}</h3>
                          <div className="flex gap-1 flex-shrink-0 ml-2">
                            <button onClick={() => openPathModal(path, 'edit')} className="p-1.5 rounded-lg transition-all hover:bg-white/10">
                              <Edit className="w-3.5 h-3.5" style={{ color: 'var(--color-accent-violet-light)' }} />
                            </button>
                            <button onClick={() => deleteCustomPath(path.id)} className="p-1.5 rounded-lg transition-all hover:bg-red-500/20">
                              <Trash2 className="w-3.5 h-3.5" style={{ color: 'var(--color-error)' }} />
                            </button>
                          </div>
                        </div>
                        <p className="text-xs mb-4" style={{ color: 'var(--text-tertiary)' }}>
                          {path.channels.length} channels · {path.certifications.length} certifications
                        </p>
                        <button
                          onClick={() => isActive ? deactivateCustomPath(path.id) : activateCustomPath(path.id)}
                          className="w-full py-2.5 rounded-xl font-semibold text-sm transition-all"
                          style={isActive
                            ? { background: 'var(--surface-3)', color: 'var(--text-secondary)' }
                            : { background: 'var(--gradient-primary)', color: '#fff' }}
                        >
                          {isActive ? 'Deactivate' : 'Activate Path'}
                        </button>
                      </motion.div>
                    );
                  })}
                </motion.div>
              </div>
            )}

            {/* Curated Paths */}
            {(view === 'all' || view === 'curated') && (
              <div>
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-2xl font-bold flex items-center gap-2">
                    <Star className="w-6 h-6" style={{ color: 'var(--accent-gold)' }} />
                    Curated Paths
                    {curatedSearchQuery && (
                      <span className="text-base font-normal" style={{ color: 'var(--text-tertiary)' }}>
                        ({visibleCurated.length})
                      </span>
                    )}
                  </h2>
                </div>

                {/* Filters row */}
                <div className="flex flex-col sm:flex-row gap-3 mb-6">
                  <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: 'var(--text-tertiary)' }} />
                    <input
                      type="text"
                      placeholder="Search paths…"
                      value={curatedSearchQuery}
                      onChange={(e) => setCuratedSearchQuery(e.target.value)}
                      className="w-full pl-9 pr-8 py-2.5 rounded-xl text-sm focus:outline-none transition-all"
                      style={{ background: 'var(--surface-3)', border: '1px solid var(--color-border)', color: 'var(--text-primary)' }}
                    />
                    {curatedSearchQuery && (
                      <button onClick={() => setCuratedSearchQuery('')} className="absolute right-2.5 top-1/2 -translate-y-1/2">
                        <X className="w-3.5 h-3.5" style={{ color: 'var(--text-tertiary)' }} />
                      </button>
                    )}
                  </div>
                  <select
                    value={filterDifficulty}
                    onChange={(e) => setFilterDifficulty(e.target.value)}
                    className="px-3 py-2.5 rounded-xl text-sm focus:outline-none"
                    style={{ background: 'var(--surface-3)', border: '1px solid var(--color-border)', color: 'var(--text-primary)' }}
                  >
                    <option value="">All Levels</option>
                    <option value="Beginner">Beginner</option>
                    <option value="Intermediate">Intermediate</option>
                    <option value="Advanced">Advanced</option>
                  </select>
                  <select
                    value={filterRole}
                    onChange={(e) => setFilterRole(e.target.value)}
                    className="px-3 py-2.5 rounded-xl text-sm focus:outline-none"
                    style={{ background: 'var(--surface-3)', border: '1px solid var(--color-border)', color: 'var(--text-primary)' }}
                  >
                    <option value="">All Types</option>
                    <option value="job-title">Job Title</option>
                    <option value="company">Company</option>
                    <option value="skill">Skill</option>
                    <option value="certification">Certification</option>
                  </select>
                </div>

                <motion.div variants={stagger} initial="hidden" animate="visible" className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {visibleCurated.map((path) => {
                    const Icon = path.icon;
                    const isActive = activePaths.some((p: any) => p.id === path.id);
                    const diffColor = difficultyColors[path.difficulty] || 'var(--color-accent-violet)';
                    const pathProgress = isActive ? getPathProgress(path) : 0;
                    return (
                      <motion.div
                        key={path.id}
                        variants={fadeUp}
                        whileHover={{ y: -4, boxShadow: 'var(--shadow-lg)' }}
                        className="rounded-2xl border overflow-hidden cursor-pointer group transition-all"
                        style={{ background: 'var(--surface-2)', borderColor: 'var(--color-border)' }}
                        onClick={() => openPathModal(path, 'view')}
                      >
                        {/* Gradient header */}
                        <div className="h-2" style={{ background: path.gradient }} />

                        <div className="p-5">
                          <div className="flex items-start gap-3 mb-3">
                            <div className="w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: path.gradient }}>
                              <Icon className="w-6 h-6 text-white" strokeWidth={2.5} />
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2 mb-0.5 flex-wrap">
                                <h3 className="text-base font-bold line-clamp-1">{path.name}</h3>
                                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full" style={{ background: `${diffColor}22`, color: diffColor, border: `1px solid ${diffColor}44` }}>
                                  {path.difficulty}
                                </span>
                              </div>
                              <p className="text-xs line-clamp-2" style={{ color: 'var(--text-secondary)' }}>{path.description}</p>
                            </div>
                          </div>

                          {/* Chapter breadcrumb */}
                          {path.channels?.length > 0 && (
                            <p className="text-[10px] mb-2 truncate" style={{ color: 'var(--text-tertiary)' }}>
                              {path.channels.slice(0, 4).map((c: string) =>
                                Object.values(allChannelsConfig).find(ch => ch.id === c)?.name || c
                              ).join(' → ')}
                            </p>
                          )}

                          {/* Learning objectives */}
                          {path.jobs?.length > 0 && (
                            <div className="mb-3 space-y-1">
                              {path.jobs.slice(0, 2).map((obj: string, i: number) => (
                                <div key={i} className="flex items-center gap-2 text-xs" style={{ color: 'var(--text-tertiary)' }}>
                                  <div className="w-1 h-1 rounded-full flex-shrink-0" style={{ background: 'var(--color-accent-violet)' }} />
                                  <span className="truncate">{obj}</span>
                                </div>
                              ))}
                            </div>
                          )}

                          {/* Progress bar (always shown, 0% if not started) */}
                          <div className="mb-1 flex items-center justify-between text-[10px]" style={{ color: 'var(--text-tertiary)' }}>
                            <span>{isActive && pathProgress > 0 ? `${pathProgress}% complete` : isActive ? 'In progress' : 'Not started'}</span>
                            <span className="flex items-center gap-1"><Clock className="w-2.5 h-2.5" />{path.duration} est.</span>
                          </div>
                          <div className="h-1.5 rounded-full overflow-hidden mb-3" style={{ background: 'var(--surface-4)' }}>
                            <div className="h-full rounded-full transition-all" style={{ background: path.gradient, width: `${pathProgress}%` }} />
                          </div>

                          <div className="flex items-center gap-3 text-xs mb-4" style={{ color: 'var(--text-tertiary)' }}>
                            <span className="flex items-center gap-1"><Target className="w-3 h-3" />{path.totalQuestions}Q</span>
                            {path.salary && <span className="font-semibold" style={{ color: 'var(--color-accent-cyan)' }}>{path.salary}</span>}
                          </div>

                          <div className="flex items-center gap-2">
                            {isActive ? (
                              <button
                                onClick={(e) => { e.stopPropagation(); path.channels?.[0] && setLocation(`/channel/${path.channels[0]}`); }}
                                className="flex-1 py-2 rounded-xl text-xs font-bold text-white transition-all hover:opacity-90"
                                style={{ background: 'var(--gradient-primary)' }}
                              >
                                Continue Path
                              </button>
                            ) : (
                              <button
                                onClick={(e) => { e.stopPropagation(); activateCustomPath(path.id); }}
                                className="flex-1 py-2 rounded-xl text-xs font-bold text-white transition-all hover:opacity-90"
                                style={{ background: path.gradient }}
                              >
                                Start Path
                              </button>
                            )}
                            <button
                              onClick={(e) => { e.stopPropagation(); openPathModal(path, 'view'); }}
                              className="px-3 py-2 rounded-xl text-xs font-semibold transition-all hover:bg-white/10"
                              style={{ background: 'var(--surface-3)', color: 'var(--text-secondary)', border: '1px solid var(--color-border)' }}
                            >
                              Details
                            </button>
                          </div>
                        </div>
                      </motion.div>
                    );
                  })}
                </motion.div>

                {visibleCurated.length === 0 && curatedSearchQuery && (
                  <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-center py-16">
                    <Search className="w-12 h-12 mx-auto mb-3" style={{ color: 'var(--text-tertiary)' }} />
                    <h3 className="text-xl font-bold mb-2">No paths found</h3>
                    <button onClick={() => setCuratedSearchQuery('')} className="text-sm" style={{ color: 'var(--color-accent-violet-light)' }}>
                      Clear search
                    </button>
                  </motion.div>
                )}
              </div>
            )}

          </div>
        </div>

        {/* Path Modal */}
        <AnimatePresence>
          {showPathModal && (
            <motion.div
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="fixed inset-0 z-50 flex items-end md:items-center justify-center md:p-6"
              style={{ background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(8px)' }}
              onClick={closePathModal}
            >
              <motion.div
                initial={{ y: '100%' }} animate={{ y: 0 }} exit={{ y: '100%' }}
                transition={{ type: 'spring', damping: 30, stiffness: 300 }}
                onClick={(e) => e.stopPropagation()}
                className="w-full max-w-3xl h-[90vh] md:h-auto md:max-h-[85vh] flex flex-col overflow-hidden md:mb-0 mb-16"
                style={{ background: 'var(--surface-2)', border: '1px solid var(--color-border)', borderRadius: '24px 24px 0 0' }}
              >
                {/* Drag handle */}
                <div className="flex justify-center pt-3 pb-1 md:hidden">
                  <div className="w-10 h-1 rounded-full" style={{ background: 'var(--color-border-strong)' }} />
                </div>

                {/* Modal header */}
                <div className="px-5 py-4 border-b flex-shrink-0" style={{ borderColor: 'var(--color-border)' }}>
                  <div className="flex items-center justify-between mb-3">
                    <h2 className="text-lg font-bold truncate pr-2">
                      {modalMode === 'create' ? 'Create Path' : modalMode === 'edit' ? 'Edit Path' : selectedPath?.name}
                    </h2>
                    <button onClick={closePathModal} className="w-8 h-8 rounded-full flex items-center justify-center transition-all hover:bg-white/10" style={{ background: 'var(--surface-3)' }}>
                      <X className="w-4 h-4" />
                    </button>
                  </div>

                  {!isReadonly && (
                    <input
                      type="text"
                      placeholder="Path name…"
                      value={modalMode === 'create' ? customForm.name : editForm.name}
                      onChange={(e) => modalMode === 'create' ? setCustomForm(p => ({ ...p, name: e.target.value })) : setEditForm(p => ({ ...p, name: e.target.value }))}
                      className="w-full px-4 py-3 rounded-xl text-sm focus:outline-none transition-all"
                      style={{ background: 'var(--surface-3)', border: '1px solid var(--color-border)', color: 'var(--text-primary)' }}
                    />
                  )}

                  {isReadonly && selectedPath && (
                    <div>
                      <p className="text-sm mb-3" style={{ color: 'var(--text-secondary)' }}>{selectedPath.description}</p>
                      <div className="grid grid-cols-3 gap-2 mb-3">
                        {[
                          { icon: Clock, label: 'Duration', val: selectedPath.duration },
                          { icon: Target, label: 'Questions', val: selectedPath.totalQuestions },
                          { icon: Trophy, label: 'Level', val: selectedPath.difficulty },
                        ].map(({ icon: Ic, label, val }) => (
                          <div key={label} className="p-2.5 rounded-xl" style={{ background: 'var(--surface-3)' }}>
                            <div className="flex items-center gap-1 text-xs mb-1" style={{ color: 'var(--text-tertiary)' }}><Ic className="w-3 h-3" />{label}</div>
                            <div className="font-bold text-sm">{val}</div>
                          </div>
                        ))}
                      </div>
                      {/* Chapter list with checkmarks */}
                      {selectedPath.channels?.length > 0 && (
                        <div className="mb-3">
                          <p className="text-xs font-semibold mb-2" style={{ color: 'var(--text-secondary)' }}>Chapters</p>
                          <div className="space-y-1.5">
                            {selectedPath.channels.map((c: string, i: number) => {
                              const ch = Object.values(allChannelsConfig).find(ch => ch.id === c);
                              return (
                                <div key={c} className="flex items-center gap-2.5 p-2 rounded-xl" style={{ background: 'var(--surface-3)' }}>
                                  <div className="w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0 text-[10px] font-bold" style={{ background: 'rgba(124,58,237,0.2)', color: 'var(--color-accent-violet-light)' }}>{i + 1}</div>
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
                                <Check className="w-3.5 h-3.5 mt-0.5 flex-shrink-0" style={{ color: 'var(--color-accent-violet)' }} />
                                {obj}
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                      {selectedPath.skills?.length > 0 && (
                        <div className="flex flex-wrap gap-1.5 mt-2">
                          {selectedPath.skills.map((s: string, i: number) => (
                            <span key={i} className="px-2 py-0.5 rounded-full text-xs" style={{ background: 'rgba(124,58,237,0.15)', color: 'var(--color-accent-violet-light)' }}>{s}</span>
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                </div>

                {/* Tabs */}
                <div className="flex border-b flex-shrink-0" style={{ borderColor: 'var(--color-border)' }}>
                  {(['channels', 'certifications'] as const).map((tab) => {
                    const count = tab === 'channels' ? currentChannels.length : currentCertifications.length;
                    return (
                      <button
                        key={tab}
                        onClick={() => setModalTab(tab)}
                        className="flex-1 py-3 text-xs font-semibold capitalize relative transition-colors"
                        style={{ color: modalTab === tab ? 'var(--color-accent-violet-light)' : 'var(--text-tertiary)' }}
                      >
                        {tab} ({count})
                        {modalTab === tab && <motion.div layoutId="modal-tab" className="absolute bottom-0 left-0 right-0 h-0.5" style={{ background: 'var(--color-accent-violet)' }} />}
                      </button>
                    );
                  })}
                </div>

                {/* Search inside modal */}
                {!isReadonly && (
                  <div className="p-3 border-b flex-shrink-0" style={{ borderColor: 'var(--color-border)' }}>
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: 'var(--text-tertiary)' }} />
                      <input
                        type="text" placeholder={`Search ${modalTab}…`} value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full pl-9 pr-3 py-2.5 rounded-xl text-sm focus:outline-none"
                        style={{ background: 'var(--surface-3)', border: '1px solid var(--color-border)', color: 'var(--text-primary)' }}
                      />
                    </div>
                  </div>
                )}

                {/* Scrollable content */}
                <div className="flex-1 overflow-y-auto p-3 overscroll-contain">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2 pb-4">
                    {modalTab === 'channels'
                      ? (isReadonly
                          ? Object.values(allChannelsConfig).filter(c => currentChannels.includes(c.id))
                          : filteredChannels
                        ).map((channel) => {
                          const isSelected = currentChannels.includes(channel.id);
                          return (
                            <button
                              key={channel.id}
                              onClick={() => {
                                if (isReadonly) return;
                                if (modalMode === 'create') setCustomForm(p => ({ ...p, channels: isSelected ? p.channels.filter(id => id !== channel.id) : [...p.channels, channel.id] }));
                                else toggleEditChannel(channel.id);
                              }}
                              disabled={isReadonly}
                              className="p-3 rounded-xl border text-left transition-all"
                              style={{ background: isSelected ? 'rgba(124,58,237,0.12)' : 'var(--surface-3)', borderColor: isSelected ? 'var(--color-accent-violet)' : 'var(--color-border)' }}
                            >
                              <div className="flex items-center justify-between">
                                <span className="font-medium text-sm">{channel.name}</span>
                                {isSelected && <Check className="w-4 h-4 flex-shrink-0" style={{ color: 'var(--color-accent-violet)' }} />}
                              </div>
                            </button>
                          );
                        })
                      : (isReadonly
                          ? certifications.filter(c => currentCertifications.includes(c.id))
                          : filteredCerts
                        ).map((cert) => {
                          const isSelected = currentCertifications.includes(cert.id);
                          return (
                            <button
                              key={cert.id}
                              onClick={() => {
                                if (isReadonly) return;
                                if (modalMode === 'create') setCustomForm(p => ({ ...p, certifications: isSelected ? p.certifications.filter(id => id !== cert.id) : [...p.certifications, cert.id] }));
                                else toggleEditCertification(cert.id);
                              }}
                              disabled={isReadonly}
                              className="p-3 rounded-xl border text-left transition-all"
                              style={{ background: isSelected ? 'rgba(124,58,237,0.12)' : 'var(--surface-3)', borderColor: isSelected ? 'var(--color-accent-violet)' : 'var(--color-border)' }}
                            >
                              <div className="flex items-center justify-between gap-2">
                                <div className="min-w-0">
                                  <div className="text-[10px] mb-0.5" style={{ color: 'var(--text-tertiary)' }}>{cert.provider}</div>
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

                {/* Footer CTA */}
                <div className="p-4 border-t flex-shrink-0" style={{ borderColor: 'var(--color-border)', background: 'var(--surface-2)' }}>
                  {isReadonly ? (
                    <button
                      onClick={() => { activateCustomPath(selectedPath.id); closePathModal(); }}
                      className="w-full py-3.5 rounded-xl font-bold text-white transition-all hover:opacity-90 active:scale-95"
                      style={{ background: selectedPath?.gradient || 'var(--gradient-primary)' }}
                    >
                      {activePaths.some(p => p.id === selectedPath?.id) ? 'Resume Path' : 'Start Path'}
                    </button>
                  ) : (
                    <button
                      onClick={modalMode === 'create' ? saveCustomPath : saveEditedPath}
                      disabled={
                        (modalMode === 'create' && (!customForm.name || (customForm.channels.length === 0 && customForm.certifications.length === 0))) ||
                        (modalMode === 'edit' && (!editForm.name || (editForm.channels.length === 0 && editForm.certifications.length === 0)))
                      }
                      className="w-full py-3.5 rounded-xl font-bold text-white transition-all hover:opacity-90 active:scale-95 disabled:opacity-40 disabled:cursor-not-allowed"
                      style={{ background: 'var(--gradient-primary)' }}
                    >
                      {modalMode === 'create' ? 'Create Path' : 'Save Changes'}
                    </button>
                  )}
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        <FloatingButton
          icon={<Plus className="w-6 h-6" />}
          label="Create"
          onClick={() => openPathModal(null, 'create')}
          position="bottom-right"
          hideOnScroll={true}
        />
      </AppLayout>
    </>
  );
}
