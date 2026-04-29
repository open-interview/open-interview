/**
 * My Path - View and Manage Custom Learning Paths
 * Shows all custom paths created by the user + curated paths
 * Google Material Design 3 styling
 */

import { useState, useEffect, useMemo } from 'react';
import { useLocation } from 'wouter';
import { motion, Reorder, AnimatePresence } from 'framer-motion';
import { AppLayout } from '../components/layout/AppLayout';
import { SEOHead } from '../components/SEOHead';
import { allChannelsConfig } from '../lib/channels-config';
import { useUserPreferences } from '../context/UserPreferencesContext';
import { useUnifiedToast } from '../hooks/use-unified-toast';
import {
  Plus, Trash2, Edit, ChevronLeft, ChevronRight, Brain, Check, Target, Clock, Award,
  Code, Rocket, Building2, X, Search, GripVertical, PlayCircle, CheckCircle,
  Flag, Star, Lightbulb, MoreVert
} from 'lucide-react';

interface CustomPath {
  id: string;
  name: string;
  channels: string[];
  certifications: string[];
  createdAt: string;
}

interface LearningStep {
  id: string;
  title: string;
  type: 'channel' | 'certification' | 'milestone';
  completed: boolean;
  order: number;
}

interface Certification {
  id: string;
  name: string;
  provider: string;
  icon: string;
  category: string;
}

const PATH_ICON_MAP: Record<string, React.ElementType> = {
  'job-title': Code, 'company': Building2, 'skill': Brain, 'certification': Award,
};
const PATH_COLOR_MAP: Record<string, string> = {
  'job-title': 'from-blue-500 to-primary', 'company': 'from-green-500 to-emerald-500',
  'skill': 'from-primary to-pink-500', 'certification': 'from-orange-500 to-red-500',
};

function mapPathFromJson(path: any) {
  const channels = typeof path.channels === 'string' ? JSON.parse(path.channels) : (path.channels || []);
  const tags = typeof path.tags === 'string' ? JSON.parse(path.tags) : (path.tags || []);
  const learningObjectives = typeof path.learningObjectives === 'string' ? JSON.parse(path.learningObjectives) : (path.learningObjectives || []);
  const questionIds = typeof path.questionIds === 'string' ? JSON.parse(path.questionIds) : (path.questionIds || []);
  const pathType = path.pathType || getPathTypeFromId(path.id);
  return {
    id: path.id,
    name: path.title,
    icon: PATH_ICON_MAP[pathType] || Rocket,
    color: PATH_COLOR_MAP[pathType] || 'from-primary to-primary',
    description: path.description,
    channels,
    difficulty: path.difficulty ? path.difficulty.charAt(0).toUpperCase() + path.difficulty.slice(1) : 'Intermediate',
    duration: path.estimatedHours ? `${path.estimatedHours}h` : '10h',
    totalQuestions: questionIds.length || 0,
    jobs: learningObjectives.slice(0, 3),
    skills: tags.slice(0, 5),
    pathType,
  };
}
function getPathTypeFromId(id: string) {
  if (id.startsWith('company-')) return 'company';
  if (id.startsWith('job-')) return 'job-title';
  if (id.startsWith('cert-')) return 'certification';
  return 'skill';
}

export default function MyPath() {
  const [, setLocation] = useLocation();
  const { preferences } = useUserPreferences();
  const [customPaths, setCustomPaths] = useState<CustomPath[]>([]);
  const [activePathId, setActivePathId] = useState<string | null>(null);
  const [certifications, setCertifications] = useState<Certification[]>([]);
  const [curatedPaths, setCuratedPaths] = useState<any[]>([]);
  const subscribedSet = new Set(preferences.subscribedChannels);
  const visibleCuratedPaths = curatedPaths.filter(p => p.channels.some((c: string) => subscribedSet.has(c)));
  const { toast } = useUnifiedToast();
  
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingPath, setEditingPath] = useState<CustomPath | null>(null);
  const [editForm, setEditForm] = useState({
    name: '',
    channels: [] as string[],
    certifications: [] as string[]
  });
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCustomIdx, setSelectedCustomIdx] = useState(0);
  const [selectedCuratedIdx, setSelectedCuratedIdx] = useState(0);

  useEffect(() => {
    try {
      const saved = localStorage.getItem('customPaths');
      if (saved) {
        setCustomPaths(JSON.parse(saved));
      }

      const activePaths = localStorage.getItem('activeLearningPaths');
      if (activePaths) {
        const pathIds = JSON.parse(activePaths);
        setActivePathId(pathIds.length > 0 ? pathIds[0] : null);
      }
    } catch (e) {
      console.error('Failed to load paths:', e);
    }
  }, []);

  useEffect(() => {
    async function loadCerts() {
      try {
        const basePath = import.meta.env.BASE_URL || '/';
        const response = await fetch(`${basePath}data/certifications.json`);
        if (response.ok) {
          const data = await response.json();
          setCertifications(data);
        }
      } catch (e) {
        console.error('Failed to load certifications:', e);
      }
    }
    loadCerts();
  }, []);

  useEffect(() => {
    async function loadPaths() {
      try {
        const basePath = import.meta.env.BASE_URL || '/';
        const response = await fetch(`${basePath}data/learning-paths.json`);
        if (response.ok) {
          const data = await response.json();
          setCuratedPaths(data.map(mapPathFromJson));
        }
      } catch (e) {
        console.error('Failed to load learning paths:', e);
      }
    }
    loadPaths();
  }, []);

  const savePaths = (paths: CustomPath[]) => {
    try {
      localStorage.setItem('customPaths', JSON.stringify(paths));
      setCustomPaths(paths);
    } catch (e) {
      console.error('Failed to save paths:', e);
    }
  };

  const deletePath = (pathId: string) => {
    const newPaths = customPaths.filter(p => p.id !== pathId);
    savePaths(newPaths);

    try {
      const currentPaths = JSON.parse(localStorage.getItem('activeLearningPaths') || '[]');
      if (currentPaths.includes(pathId)) {
        const updatedPaths = currentPaths.filter((id: string) => id !== pathId);
        localStorage.setItem('activeLearningPaths', JSON.stringify(updatedPaths));
      }
    } catch (e) {
      console.error('Failed to update active paths:', e);
    }
  };

  const togglePathActivation = (path: CustomPath) => {
    try {
      const currentPaths = JSON.parse(localStorage.getItem('activeLearningPaths') || '[]');
      
      if (currentPaths.includes(path.id)) {
        const updatedPaths = currentPaths.filter((id: string) => id !== path.id);
        localStorage.setItem('activeLearningPaths', JSON.stringify(updatedPaths));
      } else {
        const updatedPaths = [...currentPaths, path.id];
        localStorage.setItem('activeLearningPaths', JSON.stringify(updatedPaths));
      }
      
      window.location.reload();
    } catch (e) {
      console.error('Failed to toggle path:', e);
    }
  };

  const toggleCuratedPathActivation = (path: typeof curatedPaths[0]) => {
    try {
      const currentPaths = JSON.parse(localStorage.getItem('activeLearningPaths') || '[]');
      
      if (currentPaths.includes(path.id)) {
        const updatedPaths = currentPaths.filter((id: string) => id !== path.id);
        localStorage.setItem('activeLearningPaths', JSON.stringify(updatedPaths));
      } else {
        const updatedPaths = [...currentPaths, path.id];
        localStorage.setItem('activeLearningPaths', JSON.stringify(updatedPaths));
      }
      
      window.location.reload();
    } catch (e) {
      console.error('Failed to toggle curated path:', e);
    }
  };

  const isPathActive = (pathId: string): boolean => {
    try {
      const currentPaths = JSON.parse(localStorage.getItem('activeLearningPaths') || '[]');
      return currentPaths.includes(pathId);
    } catch {
      return false;
    }
  };

  const openEditModal = (path: CustomPath) => {
    setEditingPath(path);
    setEditForm({
      name: path.name,
      channels: [...path.channels],
      certifications: [...path.certifications]
    });
    setSearchQuery('');
    setShowEditModal(true);
  };

  const toggleEditChannel = (channelId: string) => {
    setEditForm(prev => ({
      ...prev,
      channels: prev.channels.includes(channelId)
        ? prev.channels.filter(c => c !== channelId)
        : [...prev.channels, channelId]
    }));
  };

  const toggleEditCertification = (certId: string) => {
    setEditForm(prev => ({
      ...prev,
      certifications: prev.certifications.includes(certId)
        ? prev.certifications.filter(c => c !== certId)
        : [...prev.certifications, certId]
    }));
  };

  const saveEditedPath = () => {
    if (!editingPath || !editForm.name || (editForm.channels.length === 0 && editForm.certifications.length === 0)) {
      toast({
        title: 'Invalid Path',
        description: 'Please add a name and select at least one channel or certification',
        variant: 'destructive'
      });
      return;
    }

    try {
      const updatedPath = {
        ...editingPath,
        name: editForm.name,
        channels: editForm.channels,
        certifications: editForm.certifications
      };

      const updatedPaths = customPaths.map(p => 
        p.id === editingPath.id ? updatedPath : p
      );

      savePaths(updatedPaths);

      setShowEditModal(false);
      setEditingPath(null);
    } catch (e) {
      console.error('Failed to save edited path:', e);
    }
  };

  const filteredChannels = allChannelsConfig.filter(ch =>
    ch.name.toLowerCase().includes(searchQuery.toLowerCase())
  );
  const filteredCerts = certifications.filter(cert =>
    cert.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <>
      <SEOHead
        title="My Path - Custom Learning Journeys"
        description="View and manage your custom learning paths"
        canonical="https://open-interview.github.io/my-path"
      />

      <AppLayout>
        <style>{`
          .g-card {
            background: var(--surface-bg, #fff);
            border: 1px solid var(--border-default, #dadce0);
            border-radius: 1rem;
            box-shadow: var(--shadow-1);
          }
          .g-card:focus-visible {
            outline: 2px solid var(--g-primary, #4285F4);
            outline-offset: 2px;
          }
          .g-fab {
            width: 56px;
            height: 56px;
            border-radius: 1rem;
            display: inline-flex;
            align-items: center;
            justify-content: center;
          }
          .g-fab-small {
            width: 40px;
            height: 40px;
            border-radius: 0.75rem;
          }
          .g-fab-primary {
            background: var(--g-primary, #4285F4);
            color: white;
          }
          .g-button {
            display: inline-flex;
            align-items: center;
            justify-content: center;
            gap: 8px;
            padding: 10px 16px;
            border-radius: var(--radius-md, 8px);
            font-size: 0.875rem;
            font-weight: 500;
            cursor: pointer;
            transition: all 0.2s;
            border: none;
          }
          .g-button:focus-visible {
            outline: 2px solid var(--g-primary, #4285F4);
            outline-offset: 2px;
          }
          .g-button-primary {
            background: var(--g-primary, #4285F4);
            color: white;
          }
          .g-button-primary:hover {
            background: var(--g-primary-dark, #1a73e8);
          }
          .g-button-secondary {
            background: var(--surface-raised, #f8f9fa);
            color: var(--text-primary, #202124);
            border: 1px solid var(--border-default, #dadce0);
          }
          .g-button-tonal {
            background: var(--g-primary-container, #e8f0fe);
            color: var(--g-primary-dark, #1a73e8);
          }
          .g-text-field {
            padding: 12px 16px;
            border: 1px solid var(--border-default, #dadce0);
            border-radius: var(--radius-md, 8px);
            font-size: 1rem;
            background: var(--surface-bg, #fff);
            color: var(--text-primary, #202124);
            width: 100%;
          }
          .g-text-field:focus {
            outline: none;
            border-color: var(--g-primary, #4285F4);
            box-shadow: 0 0 0 2px var(--g-primary-light, #8ab4f8);
          }
          .g-chip {
            padding: 6px 12px;
            border-radius: 8px;
            background: var(--surface-raised, #f8f9fa);
            border: 1px solid var(--border-default, #dadce0);
            font-size: 0.75rem;
            font-weight: 500;
          }
          .g-chip-primary {
            background: var(--g-primary, #4285F4);
            color: white;
            border-color: var(--g-primary, #4285F4);
          }
          .step-card {
            position: relative;
            padding: 16px 16px 16px 48px;
          }
          .step-dot {
            position: absolute;
            left: 8px;
            top: 16px;
            width: 24px;
            height: 24px;
            border-radius: 50%;
            background: var(--surface-raised);
            border: 2px solid var(--border-default);
            display: flex;
            align-items: center;
            justify-content: center;
          }
          .step-dot-active {
            background: var(--g-primary, #4285F4);
            border-color: var(--g-primary, #4285F4);
            color: white;
            animation: pulse 2s infinite;
          }
          .step-dot-completed {
            background: var(--g-success, #34A853);
            border-color: var(--g-success, #34A853);
            color: white;
          }
          .timeline-track {
            position: absolute;
            left: 19px;
            top: 48px;
            bottom: 24px;
            width: 2px;
            background: var(--border-default);
          }
          .timeline-track-progress {
            background: var(--g-primary, #4285F4);
          }
          @keyframes pulse {
            0%, 100% { box-shadow: 0 0 0 0 rgba(66, 133, 244, 0.4); }
            50% { box-shadow: 0 0 0 8px rgba(66, 133, 244, 0); }
          }
          .progress-rail {
            height: 8px;
            background: var(--surface-raised, #f8f9fa);
            border-radius: 4px;
            overflow: hidden;
          }
          .progress-fill {
            height: 100%;
            background: linear-gradient(90deg, var(--g-primary, #4285F4), var(--g-success, #34A853));
            border-radius: 4px;
            transition: width 0.3s ease;
          }
        `}</style>

        <AnimatePresence>
          {showEditModal && editingPath && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50 flex items-center justify-center p-4"
              onClick={() => setShowEditModal(false)}
            >
              <motion.div
                initial={{ scale: 0.9, y: 20 }}
                animate={{ scale: 1, y: 0 }}
                exit={{ scale: 0.9, y: 20 }}
                onClick={(e) => e.stopPropagation()}
                className="bg-background border border-border rounded-2xl max-w-3xl w-full max-h-[90vh] overflow-hidden flex flex-col"
              >
                <div className="p-6 border-b border-border">
                  <div className="flex items-center justify-between mb-4">
                    <h2 className="text-2xl font-semibold">Edit Path</h2>
                    <button
                      onClick={() => setShowEditModal(false)}
                      className="g-button g-button-secondary g-fab-small"
                    >
                      <X className="w-5 h-5" />
                    </button>
                  </div>
                  
                  <input
                    type="text"
                    placeholder="Path Name"
                    value={editForm.name}
                    onChange={(e) => setEditForm(prev => ({ ...prev, name: e.target.value }))}
                    className="g-text-field"
                  />
                </div>

                <div className="flex-1 overflow-y-auto p-6 space-y-6">
                  <div className="relative">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-[#9AA0A6]" />
                    <input
                      type="text"
                      placeholder="Search channels and certifications..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="w-full pl-12 pr-4 h-[46px] bg-[#F1F3F4] dark:bg-[#303134] rounded-full focus:outline-none focus-visible:ring-2 focus-visible:ring-primary/50 transition-all placeholder:text-[#9AA0A6] text-foreground"
                    />
                  </div>

                  {(editForm.channels.length > 0 || editForm.certifications.length > 0) && (
                    <div className="g-card p-4 border-primary/30">
                      <div className="text-sm text-foreground/70 mb-2">Selected:</div>
                      <div className="flex items-center gap-4 text-sm font-medium">
                        <span>{editForm.channels.length} channels</span>
                        <span>•</span>
                        <span>{editForm.certifications.length} certifications</span>
                      </div>
                    </div>
                  )}

                  <div>
                    <h3 className="text-lg font-semibold mb-4">Channels</h3>
                    <div className="grid grid-cols-2 gap-3">
                      {filteredChannels.slice(0, 16).map((channel) => {
                        const isSelected = editForm.channels.includes(channel.id);
                        return (
                          <button
                            key={channel.id}
                            onClick={() => toggleEditChannel(channel.id)}
                            className={`g-card p-3 text-left transition-all ${isSelected ? 'border-primary bg-primary/5' : ''}`}
                          >
                            <div className="flex items-center justify-between">
                              <span className="font-medium text-sm">{channel.name}</span>
                              {isSelected && <Check className="w-5 h-5 text-primary" />}
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  <div>
                    <h3 className="text-lg font-semibold mb-4">Certifications</h3>
                    <div className="grid grid-cols-2 gap-3">
                      {filteredCerts.slice(0, 16).map((cert) => {
                        const isSelected = editForm.certifications.includes(cert.id);
                        return (
                          <button
                            key={cert.id}
                            onClick={() => toggleEditCertification(cert.id)}
                            className={`g-card p-3 text-left transition-all ${isSelected ? 'border-primary bg-primary/5' : ''}`}
                          >
                            <div className="flex items-center justify-between">
                              <div>
                                <div className="text-xs text-foreground/70 mb-1">{cert.provider}</div>
                                <div className="font-medium text-sm">{cert.name}</div>
                              </div>
                              {isSelected && <Check className="w-5 h-5 text-primary" />}
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                </div>

                <div className="p-6 border-t border-border">
                  <button
                    onClick={saveEditedPath}
                    disabled={!editForm.name || (editForm.channels.length === 0 && editForm.certifications.length === 0)}
                    className="g-button g-button-primary w-full"
                  >
                    Save Changes
                  </button>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        <div className="min-h-screen bg-background text-foreground">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 py-12">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="mb-8"
            >
              <h1 className="text-3xl font-semibold mb-2">My Learning Paths</h1>
              <p className="text-foreground/70">
                {customPaths.length} custom {customPaths.length === 1 ? 'path' : 'paths'} created
              </p>
            </motion.div>

            <motion.button
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              whileHover={{ scale: 1.01 }}
              whileTap={{ scale: 0.99 }}
              onClick={() => setLocation('/learning-paths')}
              className="g-card p-6 mb-8 border-2 border-dashed border-primary/30 hover:border-primary/60 transition-all group"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="g-fab g-fab-primary">
                    <Plus className="min-w-[48px] w-8 h-8" />
                  </div>
                  <div className="text-left">
                    <h3 className="text-lg font-semibold mb-1">Create New Path</h3>
                    <p className="text-sm text-foreground/70">Build your own learning journey</p>
                  </div>
                </div>
                <ChevronRight className="w-6 h-6 text-primary group-hover:translate-x-2 transition-transform" />
              </div>
            </motion.button>

            {customPaths.length > 0 ? (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
              >
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-lg font-semibold">Custom Paths</h2>
                  <span className="g-chip">{customPaths.length}</span>
                </div>

                {(() => {
                  const idx = Math.min(selectedCustomIdx, customPaths.length - 1);
                  const path = customPaths[idx];
                  const isActive = isPathActive(path.id);
                  
                  const pathProgress = 0;
                  
                  return (
                    <div className="g-card p-6 mb-6">
                      <div className="flex items-start justify-between mb-4">
                        <div className="flex items-center gap-4">
                          <div className="g-fab bg-gradient-to-br from-primary to-pink-500">
                            <Brain className="w-7 h-7 text-white" />
                          </div>
                          <div>
                            <h3 className="text-xl font-semibold mb-1">{path.name}</h3>
                            <p className="text-sm text-foreground/70">
                              Created {new Date(path.createdAt).toLocaleDateString()}
                            </p>
                          </div>
                        </div>
                        {isActive && (
                          <span className="g-chip g-chip-primary flex items-center gap-1">
                            <CheckCircle className="w-4 h-4" />
                            Active
                          </span>
                        )}
                      </div>

                      <div className="mb-4">
                        <div className="flex items-center justify-between text-sm mb-2">
                          <span className="text-foreground/70">Progress</span>
                          <span className="font-medium">{pathProgress}%</span>
                        </div>
                        <div className="progress-rail">
                          <div className="progress-fill" style={{ width: `${pathProgress}%` }} />
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-3 mb-4">
                        <div className="g-card p-3">
                          <div className="flex items-center gap-2 text-sm text-foreground/70 mb-1">
                            <Target className="w-4 h-4" />
                            <span>Channels</span>
                          </div>
                          <div className="text-xl font-semibold">{path.channels.length}</div>
                        </div>
                        <div className="g-card p-3">
                          <div className="flex items-center gap-2 text-sm text-foreground/70 mb-1">
                            <Award className="w-4 h-4" />
                            <span>Certifications</span>
                          </div>
                          <div className="text-xl font-semibold">{path.certifications.length}</div>
                        </div>
                      </div>

                      {path.channels.length > 0 && (
                        <div className="mb-4">
                          <div className="text-xs text-foreground/70 mb-2">Channels</div>
                          <div className="flex flex-wrap gap-2">
                            {path.channels.slice(0, 4).map((channel: string) => (
                              <span key={channel} className="g-chip">{channel}</span>
                            ))}
                            {path.channels.length > 4 && (
                              <span className="g-chip text-foreground/70">+{path.channels.length - 4} more</span>
                            )}
                          </div>
                        </div>
                      )}

                      <div className="flex items-center gap-3">
                        <button
                          onClick={() => togglePathActivation(path)}
                          className={`g-button ${isActive ? 'g-button-secondary' : 'g-button-primary'} flex-1`}
                        >
                          {isActive ? 'Deactivate' : 'Activate'}
                        </button>
                        <button onClick={() => openEditModal(path)} className="g-button g-button-secondary" title="Edit path">
                          <Edit className="w-4 h-4" />
                        </button>
                         <button onClick={() => deletePath(path.id)} className="g-button bg-destructive/10 text-destructive hover:bg-destructive/20" title="Delete path">
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>

                      <div className="flex items-center justify-between mt-4 pt-4 border-t border-border">
                        <button
                          onClick={() => setSelectedCustomIdx(i => Math.max(0, i - 1))}
                          disabled={idx === 0}
                          className="g-button g-button-secondary"
                        >
                          <ChevronLeft className="w-4 h-4" /> Previous
                        </button>
                        <span className="text-sm text-foreground/70">{idx + 1} / {customPaths.length}</span>
                        <button
                          onClick={() => setSelectedCustomIdx(i => Math.min(customPaths.length - 1, i + 1))}
                          disabled={idx === customPaths.length - 1}
                          className="g-button g-button-secondary"
                        >
                          Next <ChevronRight className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  );
                })()}
              </motion.div>
            ) : (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.2 }}
                className="g-card p-6 text-center"
              >
                <div className="g-fab bg-primary/10 mx-auto mb-4">
                  <Brain className="min-w-[48px] w-8 min-h-[48px] h-8 text-primary" />
                </div>
                <h3 className="text-xl font-semibold mb-2">No custom paths yet</h3>
                <p className="text-foreground/70 mb-6">Create your first custom learning path to get started</p>
                <button
                  onClick={() => setLocation('/learning-paths')}
                  className="g-button g-button-primary"
                >
                  Create Your First Path
                </button>
              </motion.div>
            )}

            {visibleCuratedPaths.length > 0 && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
                className="mt-12"
              >
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-lg font-semibold">Curated Paths</h2>
                  <span className="g-chip">{visibleCuratedPaths.length}</span>
                </div>

                {(() => {
                  const idx = Math.min(selectedCuratedIdx, visibleCuratedPaths.length - 1);
                  const path = visibleCuratedPaths[idx];
                  const Icon = path.icon;
                  const isActive = isPathActive(path.id);
                  
                  return (
                    <div className="g-card p-6">
                      <div className="flex items-start gap-4 mb-4">
                        <div className={`g-fab bg-gradient-to-br ${path.color}`}>
                          <Icon className="w-7 h-7 text-white" />
                        </div>
                        <div className="flex-1">
                          <h3 className="text-xl font-semibold mb-1">{path.name}</h3>
                          <p className="text-sm text-foreground/70 line-clamp-2">{path.description}</p>
                        </div>
                        {isActive && (
                          <span className="g-chip g-chip-primary flex items-center gap-1">
                            <CheckCircle className="w-4 h-4" />
                            Active
                          </span>
                        )}
                      </div>

                      <div className="grid grid-cols-2 gap-3 mb-4">
                        <div className="g-card p-3">
                          <div className="flex items-center gap-2 text-sm text-foreground/70 mb-1">
                            <Target className="w-4 h-4" />
                            <span>Difficulty</span>
                          </div>
                          <div className="font-semibold">{path.difficulty}</div>
                        </div>
                        <div className="g-card p-3">
                          <div className="flex items-center gap-2 text-sm text-foreground/70 mb-1">
                            <Clock className="w-4 h-4" />
                            <span>Duration</span>
                          </div>
                          <div className="font-semibold">{path.duration}</div>
                        </div>
                      </div>

                      <button
                        onClick={() => toggleCuratedPathActivation(path)}
                        className={`g-button w-full ${isActive ? 'g-button-secondary' : 'g-button-primary'}`}
                      >
                        {isActive ? 'Deactivate' : 'Activate Path'}
                      </button>

                      <div className="flex items-center justify-between mt-4 pt-4 border-t border-border">
                        <button
                          onClick={() => setSelectedCuratedIdx(i => Math.max(0, i - 1))}
                          disabled={idx === 0}
                          className="g-button g-button-secondary"
                        >
                          <ChevronLeft className="w-4 h-4" /> Previous
                        </button>
                        <span className="text-sm text-foreground/70">{idx + 1} / {visibleCuratedPaths.length}</span>
                        <button
                          onClick={() => setSelectedCuratedIdx(i => Math.min(visibleCuratedPaths.length - 1, i + 1))}
                          disabled={idx === visibleCuratedPaths.length - 1}
                          className="g-button g-button-secondary"
                        >
                          Next <ChevronRight className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  );
                })()}
              </motion.div>
            )}
          </div>
        </div>
      </AppLayout>
    </>
  );
}