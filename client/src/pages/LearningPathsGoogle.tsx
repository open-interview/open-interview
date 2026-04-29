/**
 * Learning Paths - Google Style
 * Clean visualization with numbered step cards and smooth animations
 */

import { useState, useEffect } from 'react';
import { useLocation } from 'wouter';
import { motion, AnimatePresence } from 'framer-motion';
import { AppLayout } from '../components/layout/AppLayout';
import { SEOHead } from '../components/SEOHead';
import { allChannelsConfig } from '../lib/channels-config';
import { useUserPreferences } from '../context/UserPreferencesContext';
import {
  Code, Rocket, Brain, Building2, Award, Plus, ChevronRight, Check, X, Search,
  Clock, Target, ChevronDown, Play, RotateCcw
} from 'lucide-react';

interface Path {
  id: string;
  name: string;
  description?: string;
  channels: string[];
  difficulty: string;
  duration: string;
  totalQuestions: number;
  skills: string[];
  jobs: string[];
  pathType: string;
  gradient: string;
  icon: React.ElementType;
  milestones?: any[];
}

interface Certification {
  id: string;
  name: string;
  provider: string;
  icon: string;
  category: string;
}

const GOOGLE_BLUE = '#4285F4';
const GOOGLE_GREEN = '#34A853';
const GOOGLE_YELLOW = '#FBBC05';
const GOOGLE_RED = '#EA4335';
const GOOGLE_COLORS = [GOOGLE_BLUE, GOOGLE_GREEN, GOOGLE_YELLOW, GOOGLE_RED];

const pathTypeConfig: Record<string, { icon: React.ElementType; gradient: string; label: string }> = {
  'job-title': { icon: Code, gradient: `linear-gradient(135deg, ${GOOGLE_BLUE}, #669df6)`, label: 'Job Path' },
  'company': { icon: Building2, gradient: `linear-gradient(135deg, ${GOOGLE_GREEN}, #68d391)`, label: 'Company' },
  'skill': { icon: Brain, gradient: `linear-gradient(135deg, ${GOOGLE_YELLOW}, #f6e05e)`, label: 'Skill' },
  'certification': { icon: Award, gradient: `linear-gradient(135deg, ${GOOGLE_RED}, #fc8181)`, label: 'Certification' },
};

function GoogleProgressBar({ progress }: { progress: number }) {
  return (
    <div className="h-1.5 w-full bg-gray-100 rounded-full overflow-hidden">
      <motion.div
        initial={{ width: 0 }}
        animate={{ width: `${progress}%` }}
        transition={{ duration: 0.6, ease: 'easeOut' }}
        className="h-full rounded-full"
        style={{ background: `linear-gradient(90deg, ${GOOGLE_GREEN}, #68d391)` }}
      />
    </div>
  );
}

function GoogleProgressCircle({ progress, size = 48 }: { progress: number; size?: number }) {
  const stroke = 3;
  const r = (size - stroke * 2) / 2;
  const circ = 2 * Math.PI * r;
  const offset = circ - (progress / 100) * circ;
  
  return (
    <div className="relative" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="rotate-[-90deg]">
        <circle cx={size/2} cy={size/2} r={r} fill="none" stroke="#e5e7eb" strokeWidth={stroke} />
        <circle
          cx={size/2} cy={size/2} r={r} fill="none"
          stroke={`url(#progressGradient)`} strokeWidth={stroke}
          strokeDasharray={circ} strokeDashoffset={offset}
          strokeLinecap="round"
          style={{ transition: 'stroke-dashoffset 0.6s ease-out' }}
        />
        <defs>
          <linearGradient id="progressGradient" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor={GOOGLE_GREEN} />
            <stop offset="100%" stopColor="#68d391" />
          </linearGradient>
        </defs>
      </svg>
      <div className="absolute inset-0 flex items-center justify-center">
        <span className="text-xs font-medium text-gray-600">{progress}%</span>
      </div>
    </div>
  );
}

function StepCard({ channel, index, isCompleted, isActive, onClick, color }: {
  channel: any;
  index: number;
  isCompleted: boolean;
  isActive: boolean;
  onClick: () => void;
  color: string;
}) {
  return (
    <motion.button
      onClick={onClick}
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: index * 0.05, duration: 0.3 }}
      whileHover={{ scale: 1.02, x: 4 }}
      whileTap={{ scale: 0.98 }}
      className={`w-full flex items-center gap-4 p-4 rounded-xl border transition-all text-left cursor-pointer ${
        isActive
          ? 'bg-blue-50 border-blue-200 shadow-sm'
          : isCompleted
          ? 'bg-gray-50 border-gray-200'
          : 'bg-white border-gray-200 hover:border-gray-300 hover:shadow-sm'
      }`}
    >
      <div
        className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 text-white font-semibold text-sm transition-all ${
          isCompleted ? 'bg-green-500' : isActive ? 'bg-blue-500' : 'bg-gray-400'
        }`}
      >
        {isCompleted ? <Check className="w-5 h-5" /> : index + 1}
      </div>
      <div className="flex-1 min-w-0">
        <p className={`font-medium text-sm ${isActive ? 'text-blue-700' : 'text-gray-700'}`}>
          {channel.name}
        </p>
        <p className="text-xs text-gray-400 mt-0.5">
          {channel.topics?.length || 0} topics
        </p>
      </div>
      {isActive && (
        <ChevronRight className="w-5 h-5 text-blue-500" />
      )}
    </motion.button>
  );
}

function PathCard({ path, isActive, progress, onStart, onContinue, onView }: {
  path: Path;
  isActive: boolean;
  progress: number;
  onStart: () => void;
  onContinue: () => void;
  onView: () => void;
}) {
  const config = pathTypeConfig[path.pathType] || pathTypeConfig['skill'];
  const [expanded, setExpanded] = useState(false);
  const colorIndex = parseInt(path.id.split('-').pop() || '0', 10) % 4;
  const accentColor = GOOGLE_COLORS[colorIndex];

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="bg-white rounded-2xl border border-gray-200 overflow-hidden shadow-sm hover:shadow-md transition-shadow"
    >
      <div
        className="h-1.5"
        style={{ background: `linear-gradient(90deg, ${accentColor}, ${accentColor}99)` }}
      />
      
      <div className="p-5">
        <div className="flex items-start gap-4">
          <div
            className="w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0"
            style={{ background: config.gradient }}
          >
            {(() => {
              const Icon = config.icon;
              return <Icon className="w-6 h-6 text-white" />;
            })()}
          </div>
          
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <span className="text-xs px-3 py-1.5 rounded-full font-medium" style={{ background: `${accentColor}15`, color: accentColor }}>
                {config.label}
              </span>
              <span className="text-xs text-gray-400">{path.difficulty}</span>
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-1">{path.name}</h3>
            {path.description && (
              <p className="text-sm text-gray-500 line-clamp-2">{path.description}</p>
            )}
          </div>

          {isActive && (
            <GoogleProgressCircle progress={progress} />
          )}
        </div>

        <div className="flex items-center gap-4 mt-4 text-sm text-gray-500">
          <div className="flex items-center gap-1">
            <Clock className="w-4 h-4" />
            <span>{path.duration}</span>
          </div>
          <div className="flex items-center gap-1">
            <Target className="w-4 h-4" />
            <span>{path.totalQuestions} questions</span>
          </div>
          <div className="flex items-center gap-1">
            <Brain className="w-4 h-4" />
            <span>{path.channels.length} chapters</span>
          </div>
        </div>

        {isActive && (
          <div className="mt-4">
            <GoogleProgressBar progress={progress} />
          </div>
        )}

        <div className="flex flex-wrap gap-2 mt-4">
          {path.skills.slice(0, 4).map((skill, i) => (
            <span
              key={i}
              className="px-3 py-1.5 text-xs font-medium rounded-full"
              style={{ background: '#f3f4f6', color: '#4b5563' }}
            >
              {skill}
            </span>
          ))}
          {path.skills.length > 4 && (
            <span className="px-3 py-1.5 text-xs font-medium rounded-full bg-gray-100 text-gray-500">
              +{path.skills.length - 4}
            </span>
          )}
        </div>
      </div>

      <div className="px-5 pb-5 flex gap-3">
        {isActive ? (
          <>
            <button
              onClick={onContinue}
              className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl font-medium text-white transition-all hover:opacity-90 cursor-pointer"
              style={{ background: GOOGLE_BLUE }}
            >
              <Play className="w-4 h-4" />
              Continue
            </button>
            <button
              onClick={onView}
              className="px-4 py-2.5 rounded-xl font-medium border border-gray-200 text-gray-600 hover:bg-gray-50 transition-all cursor-pointer"
            >
              Details
            </button>
          </>
        ) : (
          <>
            <button
              onClick={onStart}
              className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl font-medium text-white transition-all hover:opacity-90 cursor-pointer"
              style={{ background: accentColor }}
            >
              <Plus className="w-4 h-4" />
              Start Path
            </button>
            <button
              onClick={onView}
              className="px-4 py-2.5 rounded-xl font-medium border border-gray-200 text-gray-600 hover:bg-gray-50 transition-all cursor-pointer"
            >
              Details
            </button>
          </>
        )}
      </div>

      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full px-5 py-3 border-t border-gray-100 flex items-center justify-center gap-2 text-sm text-gray-500 hover:bg-gray-50 transition-colors cursor-pointer"
      >
        <span>{expanded ? 'Hide' : 'Show'} Chapters</span>
        <motion.div animate={{ rotate: expanded ? 180 : 0 }}>
          <ChevronDown className="w-4 h-4" />
        </motion.div>
      </button>

      <AnimatePresence>
        {expanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="overflow-hidden"
          >
            <div className="px-5 pb-5 space-y-2">
              {path.channels.map((channelId, index) => {
                const channel = Object.values(allChannelsConfig).find(c => c.id === channelId);
                return (
                  <StepCard
                    key={channelId}
                    channel={channel || { name: channelId, topics: [] }}
                    index={index}
                    isCompleted={progress > (index / path.channels.length) * 100}
                    isActive={progress >= (index / path.channels.length) * 100 && progress < ((index + 1) / path.channels.length) * 100}
                    onClick={() => {}}
                    color={accentColor}
                  />
                );
              })}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

function PathDetailModal({ path, onClose, onStart, onContinue, isActive }: {
  path: Path | null;
  onClose: () => void;
  onStart: () => void;
  onContinue: () => void;
  isActive: boolean;
}) {
  if (!path) return null;

  const config = pathTypeConfig[path.pathType] || pathTypeConfig['skill'];
  const colorIndex = parseInt(path.id.split('-').pop() || '0', 10) % 4;
  const accentColor = GOOGLE_COLORS[colorIndex];

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
        className="fixed inset-0 z-50 flex items-center justify-center p-4"
        style={{ background: 'rgba(0, 0, 0, 0.5)', backdropFilter: 'blur(4px)' }}
      >
        <motion.div
          initial={{ scale: 0.95, y: 20 }}
          animate={{ scale: 1, y: 0 }}
          exit={{ scale: 0.95, y: 20 }}
          transition={{ type: 'spring', damping: 25, stiffness: 300 }}
          onClick={e => e.stopPropagation()}
           className="w-full max-w-2xl max-h-[90vh] overflow-hidden bg-white rounded-xl shadow-sm"
        >
          <div className="h-2" style={{ background: `linear-gradient(90deg, ${accentColor}, ${accentColor}99)` }} />
          
          <div className="p-6">
            <div className="flex items-start gap-4">
              <div
                className="w-14 h-14 rounded-2xl flex items-center justify-center flex-shrink-0"
                style={{ background: config.gradient }}
              >
                {(() => {
                  const Icon = config.icon;
                  return <Icon className="w-7 h-7 text-white" />;
                })()}
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-sm px-3 py-1 rounded-full font-medium" style={{ background: `${accentColor}15`, color: accentColor }}>
                    {config.label}
                  </span>
                  <span className="text-sm text-gray-400">{path.difficulty}</span>
                </div>
                <h2 className="text-2xl font-bold text-gray-900">{path.name}</h2>
                {path.description && (
                  <p className="mt-2 text-gray-600">{path.description}</p>
                )}
              </div>
              <button
                onClick={onClose}
                className="w-10 h-10 rounded-full flex items-center justify-center hover:bg-gray-100 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5 text-gray-500" />
              </button>
            </div>

            <div className="grid grid-cols-3 gap-4 mt-6 p-4 bg-gray-50 rounded-2xl">
              <div className="text-center">
                <div className="flex items-center justify-center gap-1 text-gray-600 mb-1">
                  <Clock className="w-4 h-4" />
                  <span className="text-sm font-medium">Duration</span>
                </div>
                <p className="text-lg font-bold text-gray-900">{path.duration}</p>
              </div>
              <div className="text-center border-x border-gray-200">
                <div className="flex items-center justify-center gap-1 text-gray-600 mb-1">
                  <Target className="w-4 h-4" />
                  <span className="text-sm font-medium">Questions</span>
                </div>
                <p className="text-lg font-bold text-gray-900">{path.totalQuestions}</p>
              </div>
              <div className="text-center">
                <div className="flex items-center justify-center gap-1 text-gray-600 mb-1">
                  <Brain className="w-4 h-4" />
                  <span className="text-sm font-medium">Chapters</span>
                </div>
                <p className="text-lg font-bold text-gray-900">{path.channels.length}</p>
              </div>
            </div>

            <div className="mt-6">
              <h3 className="text-sm font-semibold text-gray-700 mb-3">Your Learning Journey</h3>
              <div className="space-y-3">
                {path.channels.map((channelId, index) => {
                  const channel = Object.values(allChannelsConfig).find(c => c.id === channelId);
                  return (
                    <div key={channelId} className="flex items-center gap-4">
                      <div className="relative flex flex-col items-center">
                        <div
                          className={`w-8 h-8 rounded-full flex items-center justify-center text-white text-sm font-semibold z-10 ${
                            index === 0 ? 'rounded-l-2xl' : ''
                          }`}
                          style={{ background: accentColor }}
                        >
                          {index + 1}
                        </div>
                        {index < path.channels.length - 1 && (
                          <div className="absolute top-8 left-1/2 w-0.5 h-6 -translate-x-1/2 bg-gray-200" />
                        )}
                      </div>
                      <div className="flex-1 p-3 bg-gray-50 rounded-xl">
                        <p className="font-medium text-gray-900">{channel?.name || channelId}</p>
                        <p className="text-xs text-gray-400 mt-1">{channel?.topics?.length || 0} topics</p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {path.skills.length > 0 && (
              <div className="mt-6">
                <h3 className="text-sm font-semibold text-gray-700 mb-3">Skills You'll Gain</h3>
                <div className="flex flex-wrap gap-2">
                  {path.skills.map((skill, i) => (
                    <span
                      key={i}
                      className="px-3 py-1.5 text-sm font-medium rounded-full border border-gray-200 text-gray-700"
                    >
                      {skill}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {path.jobs.length > 0 && (
              <div className="mt-6">
                <h3 className="text-sm font-semibold text-gray-700 mb-3">Career Outcomes</h3>
                <div className="space-y-2">
                  {path.jobs.slice(0, 3).map((job, i) => (
                    <div key={i} className="flex items-center gap-2 text-gray-600">
                      <Check className="w-4 h-4 text-green-500" />
                      <span className="text-sm">{job}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          <div className="px-6 pb-6 flex gap-3">
            {isActive ? (
              <button
                onClick={onContinue}
                className="flex-1 flex items-center justify-center gap-2 py-4 rounded-xl font-semibold text-white transition-all hover:opacity-90 cursor-pointer"
                style={{ background: GOOGLE_BLUE }}
              >
                <RotateCcw className="w-5 h-5" />
                Continue Learning
              </button>
            ) : (
              <button
                onClick={onStart}
                className="flex-1 flex items-center justify-center gap-2 py-4 rounded-xl font-semibold text-white transition-all hover:opacity-90 cursor-pointer"
                style={{ background: accentColor }}
              >
                <Plus className="w-5 h-5" />
                Start This Path
              </button>
            )}
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}

export default function LearningPathsGoogle() {
  const [, setLocation] = useLocation();
  const { preferences } = useUserPreferences();
  const subscribedSet = new Set(preferences.subscribedChannels);

  const [curatedPaths, setCuratedPaths] = useState<Path[]>([]);
  const [customPaths, setCustomPaths] = useState<any[]>([]);
  const [activePaths, setActivePaths] = useState<string[]>([]);
  const [selectedPath, setSelectedPath] = useState<Path | null>(null);
  const [showDetail, setShowDetail] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState<string>('all');
  const [showCreate, setShowCreate] = useState(false);
  const [customForm, setCustomForm] = useState({ name: '', channels: [] as string[] });

  useEffect(() => {
    async function loadCuratedPaths() {
      try {
        const basePath = import.meta.env.BASE_URL || '/';
        const response = await fetch(`${basePath}data/learning-paths.json`);
        if (response.ok) {
          const data = await response.json();
          const mapped: Path[] = data.map((path: any) => {
            const questionIds = typeof path.questionIds === 'string' ? JSON.parse(path.questionIds) : path.questionIds;
            const rawChannels = typeof path.channels === 'string' ? JSON.parse(path.channels) : path.channels;
            const tags = typeof path.tags === 'string' ? JSON.parse(path.tags) : path.tags;
            const channels = (rawChannels && rawChannels.length) ? rawChannels : (tags || []);
            const pathType = path.pathType || 'skill';
            const config = pathTypeConfig[pathType] || pathTypeConfig['skill'];
            const colorIndex = parseInt((path.id.split('-').pop() || '0'), 10) % 4;
            
            return {
              id: path.id,
              name: path.title,
              description: path.description,
              channels,
              difficulty: path.difficulty ? path.difficulty.charAt(0).toUpperCase() + path.difficulty.slice(1) : 'Intermediate',
              duration: `${path.estimatedHours || 10}h`,
              totalQuestions: questionIds?.length || 0,
              skills: tags?.slice(0, 6) || [],
              jobs: path.learningObjectives?.slice(0, 3) || [path.title],
              pathType,
              gradient: config.gradient,
              icon: config.icon,
            };
          });
          setCuratedPaths(mapped);
        }
      } catch (e) {
        console.error('Failed to load paths:', e);
      }
    }
    loadCuratedPaths();
  }, []);

  useEffect(() => {
    try {
      const saved = localStorage.getItem('customLearningPaths');
      if (saved) setCustomPaths(JSON.parse(saved));
      const active = localStorage.getItem('activeLearningPaths');
      if (active) setActivePaths(JSON.parse(active));
    } catch (e) {
      console.error('Failed to load paths:', e);
    }
  }, []);

  const getChannelProgress = (channelId: string): number => {
    try {
      const raw = localStorage.getItem(`progress_${channelId}`);
      return raw ? (JSON.parse(raw) as string[]).length : 0;
    } catch {
      return 0;
    }
  };

  const getPathProgress = (path: Path): number => {
    if (path.channels.length === 0) return 0;
    const total = path.totalQuestions || path.channels.reduce((sum, id) => {
      const ch = Object.values(allChannelsConfig).find(c => c.id === id);
      return sum + (ch ? 10 : 0);
    }, 0);
    if (total === 0) return 0;
    const done = path.channels.reduce((sum, id) => sum + getChannelProgress(id), 0);
    return Math.min(100, Math.round((done / total) * 100));
  };

  const handleStartPath = (pathId: string) => {
    try {
      const current = JSON.parse(localStorage.getItem('activeLearningPaths') || '[]');
      if (!current.includes(pathId)) {
        current.push(pathId);
        localStorage.setItem('activeLearningPaths', JSON.stringify(current));
        setActivePaths(current);
      }
      setShowDetail(false);
      const path = curatedPaths.find(p => p.id === pathId) || customPaths.find(p => p.id === pathId);
      if (path && path.channels?.[0]) {
        setTimeout(() => setLocation(`/channel/${path.channels[0]}`), 500);
      }
    } catch (e) {
      console.error('Failed to start path:', e);
    }
  };

  const handleContinuePath = (path: Path) => {
    if (path.channels?.[0]) {
      setLocation(`/channel/${path.channels[0]}`);
    }
  };

  const handleCreateCustomPath = () => {
    if (!customForm.name || customForm.channels.length === 0) {
      alert('Please add a name and select at least one channel');
      return;
    }
    const newPath = {
      id: `custom-${Date.now()}`,
      name: customForm.name,
      channels: customForm.channels,
      difficulty: 'Custom',
      duration: `${customForm.channels.length * 2}h`,
      totalQuestions: 0,
      skills: [],
      jobs: [customForm.name],
      pathType: 'skill',
      gradient: `linear-gradient(135deg, ${GOOGLE_YELLOW}, #f6e05e)`,
      icon: Brain,
    };
    const updated = [...customPaths, newPath];
    localStorage.setItem('customLearningPaths', JSON.stringify(updated));
    setCustomPaths(updated);
    handleStartPath(newPath.id);
  };

  const filteredPaths = curatedPaths.filter(path => {
    const matchesSearch = !searchQuery || 
      path.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      path.description?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      path.skills.some(s => s.toLowerCase().includes(searchQuery.toLowerCase()));
    const matchesType = filterType === 'all' || path.pathType === filterType;
    return matchesSearch && matchesType;
  });

  const stats = {
    total: curatedPaths.length + customPaths.length,
    active: activePaths.length,
    completed: curatedPaths.filter(p => getPathProgress(p) === 100).length,
  };

  return (
    <>
      <SEOHead title="Learning Paths - Open-Interview" description="Structured learning journeys for your career" />
      <AppLayout>
        <div className="min-h-screen bg-gray-50">
          <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8 sm:py-12">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-center mb-10"
            >
              <h1 className="text-4xl sm:text-5xl font-bold text-gray-900 mb-4">
                Learning Paths
              </h1>
              <p className="text-lg text-gray-600 max-w-2xl mx-auto">
                Follow structured journeys to master new skills and advance your career
              </p>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="grid grid-cols-3 gap-4 mb-8 max-w-lg mx-auto"
            >
              {[
                { label: 'Total Paths', value: stats.total, color: GOOGLE_BLUE },
                { label: 'Active', value: stats.active, color: GOOGLE_GREEN },
                { label: 'Completed', value: stats.completed, color: GOOGLE_YELLOW },
              ].map(({ label, value, color }) => (
                <div key={label} className="bg-white rounded-xl p-4 border border-gray-200 text-center">
                  <p className="text-2xl font-bold" style={{ color }}>{value}</p>
                  <p className="text-xs text-gray-500 mt-1">{label}</p>
                </div>
              ))}
            </motion.div>

            <div className="flex flex-col sm:flex-row gap-4 mb-8">
              <div className="flex-1 relative">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-[#9AA0A6]" />
                <input
                  type="text"
                  placeholder="Search paths..."
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  className="w-full pl-12 pr-4 h-[46px] bg-[#F1F3F4] dark:bg-[#303134] rounded-full focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500/50 transition-all placeholder:text-[#9AA0A6] text-foreground"
                />
              </div>
              <div className="flex gap-2 flex-wrap">
                {['all', 'job-title', 'company', 'skill', 'certification'].map(type => (
                  <button
                    key={type}
                    onClick={() => setFilterType(type)}
                    className={`px-4 py-2.5 rounded-lg text-sm font-medium transition-all cursor-pointer ${
                      filterType === type
                        ? 'bg-blue-500 text-white'
                        : 'bg-white border border-gray-200 text-gray-600 hover:bg-gray-50'
                    }`}
                  >
                    {type === 'all' ? 'All' : type === 'job-title' ? 'Job' : type.charAt(0).toUpperCase() + type.slice(1)}
                  </button>
                ))}
              </div>
            </div>

            <div className="flex gap-3 mb-8">
              <button
                onClick={() => setShowCreate(true)}
                className="flex items-center gap-2 px-5 py-2.5 rounded-lg font-medium text-white transition-all hover:opacity-90 cursor-pointer text-sm shadow-none"
                style={{ background: GOOGLE_BLUE }}
              >
                <Plus className="w-5 h-5" />
                Create Custom Path
              </button>
            </div>

            <div className="space-y-6">
              {filteredPaths.map((path, i) => (
                <PathCard
                  key={path.id}
                  path={path}
                  isActive={activePaths.includes(path.id)}
                  progress={getPathProgress(path)}
                  onStart={() => handleStartPath(path.id)}
                  onContinue={() => handleContinuePath(path)}
                  onView={() => { setSelectedPath(path); setShowDetail(true); }}
                />
              ))}
            </div>

            {filteredPaths.length === 0 && (
              <div className="text-center py-16">
                <Search className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                <h3 className="text-lg font-semibold text-gray-900 mb-2">No paths found</h3>
                <p className="text-gray-500">Try adjusting your search or filters</p>
              </div>
            )}
          </div>
        </div>

        <AnimatePresence>
          {showDetail && selectedPath && (
            <PathDetailModal
              path={selectedPath}
              onClose={() => { setShowDetail(false); setSelectedPath(null); }}
              onStart={() => handleStartPath(selectedPath.id)}
              onContinue={() => handleContinuePath(selectedPath)}
              isActive={activePaths.includes(selectedPath.id)}
            />
          )}
        </AnimatePresence>

        <AnimatePresence>
          {showCreate && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowCreate(false)}
              className="fixed inset-0 z-50 flex items-center justify-center p-4"
              style={{ background: 'rgba(0, 0, 0, 0.5)', backdropFilter: 'blur(4px)' }}
            >
              <motion.div
                initial={{ scale: 0.95, y: 20 }}
                animate={{ scale: 1, y: 0 }}
                exit={{ scale: 0.95, y: 20 }}
                onClick={e => e.stopPropagation()}
                className="w-full max-w-lg bg-white rounded-xl shadow-sm overflow-hidden"
              >
                <div className="h-2" style={{ background: `linear-gradient(90deg, ${GOOGLE_YELLOW}, #f6e05e)` }} />
                
                <div className="p-6">
                  <div className="flex items-center justify-between mb-6">
                    <h2 className="text-xl font-bold text-gray-900">Create Custom Path</h2>
                    <button
                      onClick={() => setShowCreate(false)}
                      className="w-10 h-10 rounded-full flex items-center justify-center hover:bg-gray-100 cursor-pointer"
                    >
                      <X className="w-5 h-5 text-gray-500" />
                    </button>
                  </div>

                  <input
                    type="text"
                    placeholder="Path name..."
                    value={customForm.name}
                    onChange={e => setCustomForm(p => ({ ...p, name: e.target.value }))}
                    className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100 mb-4"
                  />

                  <div className="max-h-64 overflow-y-auto space-y-2 mb-4">
                    {Object.values(allChannelsConfig).slice(0, 12).map(channel => (
                      <button
                        key={channel.id}
                        onClick={() => setCustomForm(p => ({
                          ...p,
                          channels: p.channels.includes(channel.id)
                            ? p.channels.filter(id => id !== channel.id)
                            : [...p.channels, channel.id]
                        }))}
                        className={`w-full flex items-center justify-between p-3 rounded-xl border transition-all cursor-pointer ${
                          customForm.channels.includes(channel.id)
                            ? 'bg-blue-50 border-blue-300'
                            : 'bg-gray-50 border-gray-200 hover:border-gray-300'
                        }`}
                      >
                        <span className="text-sm font-medium text-gray-700">{channel.name}</span>
                        {customForm.channels.includes(channel.id) && (
                          <Check className="w-4 h-4 text-blue-500" />
                        )}
                      </button>
                    ))}
                  </div>

                  <div className="flex gap-3">
                    <button
                      onClick={() => setShowCreate(false)}
                      className="flex-1 py-2.5 rounded-lg font-medium border border-gray-200 text-gray-600 hover:bg-gray-50 transition-all cursor-pointer text-sm shadow-none"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={handleCreateCustomPath}
                      className="flex-1 py-2.5 rounded-lg font-medium text-white transition-all hover:opacity-90 cursor-pointer text-sm shadow-none"
                      style={{ background: GOOGLE_BLUE }}
                    >
                      Create & Start
                    </button>
                  </div>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </AppLayout>
    </>
  );
}